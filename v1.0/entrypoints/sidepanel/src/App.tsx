import {
  Archive,
  Bot,
  Bookmark,
  Check,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  CloudCog,
  Copy,
  Download,
  ExternalLink,
  FileDown,
  FolderPlus,
  GalleryVerticalEnd,
  Github,
  Hash,
  History,
  Import,
  LinkIcon,
  Maximize2,
  MessageSquarePlus,
  Minimize2,
  Moon,
  PanelRightClose,
  PanelRightOpen,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Sun,
  Tags,
  Trash2,
  UploadCloud,
  X,
} from 'lucide-react';
import anime from 'animejs';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import ReactMarkdown from 'react-markdown';

// Keep dark dropdown look consistent with slash suggestions
const MORE_MENU_CLASS = 'slash-suggestions';
import remarkGfm from 'remark-gfm';
import { addChromeBookmark, exportWorkspaceToDrive, syncWorkspaceNotesToDrive } from './chromeIntegrations';
import {
  addDraftToWorkspace,
  BOOKMARKS_PAGE_ID,
  createConversation,
  createDefaultWorkspace,
  createId,
  createPage,
  DEFAULT_DRIVE_SYNC_CONFIG,
  getTagList,
  inferAutoTags,
  normalizeWorkspace,
} from './data';
import {
  copyPageMarkdown,
  downloadText,
  exportGeminiBookmarkPrompt,
  exportWorkspaceJson,
  exportWorkspaceMarkdown,
  makeBackupFilename,
  makeGeminiPromptFilename,
  makeMarkdownFilename,
} from './exports';
import { findGitHubRepos, getGitHubActionLinks, type GitHubRepoInfo } from './githubLinks';
import { loadWorkspace, saveWorkspace, loadThemePreference, saveThemePreference } from './storage';
import { captureTab } from './captureTab';
import { isSlashCommand, parseSlashCommand, executeMeltTabs, SLASH_COMMANDS, type SlashCommand } from './commands';
import { MELTED_TABS_PAGE_ID } from './data';
import type { Bookmark as SavedBookmark, CaptureHistoryEntry, CaptureMode, Conversation, DriveSyncConfig, Message, Page, TabCaptureData, ViewMode, WorkspaceData } from './types';

// Chrome extension API type declarations
type ChromeTab = {
  id?: number;
  url?: string;
  title?: string;
};

type ChromeWindow = {
  id?: number;
};

type ChromeMessageSender = {
  tab?: ChromeTab;
  id?: string;
};

type ChromeInjectionResult = {
  result: any;
};

type ChromeBookmarkTreeNode = {
  id: string;
  title: string;
  url?: string;
};

declare const chrome: {
  tabs: {
    query: (queryInfo: { active: boolean; currentWindow: boolean }) => Promise<ChromeTab[]>;
    create: (createProperties: { url: string; active?: boolean }) => Promise<ChromeTab>;
  };
  windows: {
    create: (createData: { url: string; width: number; height: number; left: number; top: number; type: 'popup' }) => Promise<ChromeWindow>;
  };
  runtime: {
    onMessage: {
      addListener: (listener: (message: any, sender: ChromeMessageSender, sendResponse: (response: any) => void) => void) => void;
      removeListener: (listener: any) => void;
    };
    sendMessage: (message: any) => Promise<any>;
  };
  storage: {
    local: {
      get: (keys: string | string[], callback: (items: { [key: string]: any }) => void) => void;
      set: (items: { [key: string]: any }, callback?: () => void) => void;
      remove: (keys: string | string[], callback?: () => void) => void;
    };
  };
  scripting: {
    executeScript: (injection: { target: { tabId: number }; func: () => any }) => Promise<ChromeInjectionResult[]>;
  };
  bookmarks: {
    create: (bookmark: { title: string; url: string }, callback?: (result: ChromeBookmarkTreeNode) => void) => void;
  };
  commands: {
    onCommand: {
      addListener: (listener: (command: string) => void) => void;
    };
  };
  sidePanel: {
    setOptions: (options: { path: string; tabId?: number }) => Promise<void>;
  };
};

const emptyDraft = {
  body: '',
  tags: '',
  pageId: BOOKMARKS_PAGE_ID,
};

const fallbackWorkspace = createDefaultWorkspace();

const isShortPreviewCandidate = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed || /^https?:\/\//i.test(trimmed)) return false;

  const words = trimmed.split(/\s+/).filter(Boolean);
  const hasSmiley = /(?:\p{Extended_Pictographic}|[:;=8xX][-o*']?[)D(PpOo/\\])$/u.test(trimmed);
  return words.length <= 3 || hasSmiley;
};

export function App({ fullWindow = false }: { fullWindow?: boolean }) {
  const [workspace, setWorkspace] = useState<WorkspaceData>(fallbackWorkspace);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [draft, setDraft] = useState(emptyDraft);
  const [newPageName, setNewPageName] = useState('');
  const [status, setStatus] = useState('');
  const [driveBusy, setDriveBusy] = useState(false);
  const [driveSyncBusy, setDriveSyncBusy] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [captureMode, setCaptureMode] = useState<CaptureMode>('full');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCapturePreview, setShowCapturePreview] = useState(false);
  const [capturePreviewData, setCapturePreviewData] = useState<TabCaptureData | null>(null);
  const [captureHistory, setCaptureHistory] = useState<CaptureHistoryEntry[]>([]);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState(false);
  const [showCaptureDropdown, setShowCaptureDropdown] = useState(false);
  const [previewCollapsed, setPreviewCollapsed] = useState(true);
  const historyButtonRef = useRef<HTMLButtonElement | null>(null);
  const captureDropdownRef = useRef<HTMLDivElement | null>(null);
  const [captureDropdownStyle, setCaptureDropdownStyle] = useState<React.CSSProperties>({});
  const [historyDropdownStyle, setHistoryDropdownStyle] = useState<React.CSSProperties>({});
  const statusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [sendToOpen, setSendToOpen] = useState(false);
  const [sendToMessage, setSendToMessage] = useState<Message | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  const moreButtonRef = useRef<HTMLButtonElement | null>(null);
  const [moreMenuStyle, setMoreMenuStyle] = useState<React.CSSProperties>({});
  const moreMenuRef = useRef<HTMLDivElement | null>(null);
  const captureButtonGroupRef = useRef<HTMLDivElement | null>(null);
  
  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [themeLoaded, setThemeLoaded] = useState(false);

  // Position the More menu relative to the button on open/reopen
  const positionMoreMenu = useCallback(() => {
    if (!moreButtonRef.current) return;
    const rect = moreButtonRef.current.getBoundingClientRect();
    setMoreMenuStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      left: 'auto',
      bottom: 'auto',
      zIndex: 9999,
    });
  }, []);

  // Position the capture dropdown relative to the capture button group
  const positionCaptureDropdown = useCallback(() => {
    if (!captureButtonGroupRef.current) return;
    const rect = captureButtonGroupRef.current.getBoundingClientRect();
    setCaptureDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      left: 'auto',
      bottom: 'auto',
      zIndex: 9999,
    });
  }, []);

  // Show status with auto-fade after 3 seconds
  const showStatus = useCallback((msg: string) => {
    setStatus(msg);
    setToast(null); // clear any active toast
    if (statusTimerRef.current) clearTimeout(statusTimerRef.current);
    statusTimerRef.current = setTimeout(() => setStatus(''), 3000);
  }, []);

  // Show toast notification with auto-fade after 3 seconds
  const showToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setStatus(''); // clear any active status
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToast(null), 3000);
  }, []);

  // Load theme preference
  useEffect(() => {
    loadThemePreference().then((saved) => {
      const initialTheme = saved || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      setTheme(initialTheme);
      document.documentElement.classList.toggle('dark', initialTheme === 'dark');
      setThemeLoaded(true);
    });
  }, []);

  // Apply theme class to document
  useEffect(() => {
    if (!themeLoaded) return;
    document.documentElement.classList.toggle('dark', theme === 'dark');
    saveThemePreference(theme);
  }, [theme, themeLoaded]);

  // Load workspace and check first-run
  useEffect(() => {
    loadWorkspace()
      .then((loaded) => {
        setWorkspace(loaded);
        setDraft((current) => ({ ...current, pageId: loaded.selectedPageId || BOOKMARKS_PAGE_ID }));
      })
      .catch((error) => showStatus(`Load failed: ${error.message}`))
      .finally(() => {
        setIsLoaded(true);
        // Show onboarding on first run (check chrome.storage.local)
        chrome.storage.local.get('onboarded', (result) => {
          if (!result.onboarded) {
            setShowOnboarding(true);
          }
        });
      });
  }, []);

  // Autosave
  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace).catch((error) => showStatus(`Save failed: ${error.message}`));
  }, [workspace, isLoaded]);

  // Listen for capture-tab messages from background / context menu
  useEffect(() => {
    const handler = async (message: { type: string; data?: { body: string; tags: string[] } }) => {
      if (message.type !== 'capture-tab') return;
      const data = message.data;
      if (data?.body) {
        setDraft((current) => ({ ...current, body: data.body, tags: data.tags?.join(', ') || '' }));
        setStatus('Tab captured from context menu. Review and send.');
      }
    };
    chrome.runtime.onMessage.addListener(handler);

    // Check for pending captures stored when side panel was closed
    chrome.storage.local.get('pending-capture', (result) => {
      const pending = result['pending-capture'];
      if (pending?.body) {
        setDraft((current) => ({ ...current, body: pending.body, tags: pending.tags?.join(', ') || 'capture' }));
        chrome.storage.local.remove('pending-capture');
        setStatus('Pending capture loaded. Review and send.');
      }
    });

    return () => chrome.runtime.onMessage.removeListener(handler);
  }, []);

  // Capture tab handler
  // Close More menu on outside click or Escape
  useEffect(() => {
    if (!moreOpen) return;
    const onDocClick = (event: MouseEvent) => {
      if (
        moreMenuRef.current?.contains(event.target as Node) ||
        moreButtonRef.current?.contains(event.target as Node)
      ) {
        return;
      }
      setMoreOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMoreOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [moreOpen]);

  // Cycle capture mode: full → standard → minimal → full
  const cycleCaptureMode = useCallback(() => {
    setCaptureMode((prev) => {
      if (prev === 'full') return 'standard';
      if (prev === 'standard') return 'minimal';
      return 'full';
    });
  }, []);

  const handleCaptureTab = useCallback(async (mode?: CaptureMode) => {
    const currentMode = mode || captureMode;
    setCaptureBusy(true);
    showToast('Capturing current tab...', 'success');
    try {
      const data = await captureTab(currentMode);
      if (!data.markdown) {
        showToast('Could not capture this tab. It may be a chrome:// page.', 'error');
        return;
      }
      // Add to capture history
      const historyEntry: CaptureHistoryEntry = {
        id: createId('capture'),
        title: data.title || data.url,
        url: data.url,
        host: data.host,
        favicon: `https://www.google.com/s2/favicons?domain=${data.host}&sz=32`,
        mode: data.mode,
        timestamp: data.timestamp,
        markdown: data.markdown,
      };
      setCaptureHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      
      setDraft((current) => ({ ...current, body: data.markdown, tags: 'capture' }));
      showToast(`Captured: ${data.title || data.url}`, 'success');
    } catch (error) {
      showToast(`Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setCaptureBusy(false);
    }
  }, [captureMode, showToast]);

  const handleCaptureAndSend = useCallback(async () => {
    const currentMode = captureMode;
    setCaptureBusy(true);
    showToast('Capturing current tab...', 'success');
    try {
      const data = await captureTab(currentMode);
      if (!data.markdown) {
        showToast('Could not capture this tab. It may be a chrome:// page.', 'error');
        return;
      }
      // Add to capture history
      const historyEntry: CaptureHistoryEntry = {
        id: createId('capture'),
        title: data.title || data.url,
        url: data.url,
        host: data.host,
        favicon: `https://www.google.com/s2/favicons?domain=${data.host}&sz=32`,
        mode: data.mode,
        timestamp: data.timestamp,
        markdown: data.markdown,
      };
      setCaptureHistory((prev) => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10
      
      // Post directly to current conversation - compute selectedConv inline
      const selectedConv = workspace.conversations.find(
        (c) => c.id === workspace.selectedConversationId && c.pageId === workspace.selectedPageId
      );
      if (selectedConv) {
        const userTags = getTagList(draft.tags);
        const autoTags = inferAutoTags(data.markdown);
        const tags = [...new Set([...userTags, ...autoTags, 'capture'])];
        const nextWorkspace = addDraftToWorkspace(workspace, selectedConv.id, {
          body: data.markdown,
          tags,
          pageId: draft.pageId || BOOKMARKS_PAGE_ID,
        });
        setWorkspace(nextWorkspace);
        setDraft((current) => ({ ...current, body: '', tags: '' }));
        
        const addedBookmarks = nextWorkspace.bookmarks.slice(workspace.bookmarks.length);
        await Promise.allSettled(addedBookmarks.map((bookmark) => addChromeBookmark(bookmark.url, bookmark.title)));
        showToast(`Captured & sent to ${selectedConv.title}`, 'success');
      } else {
        // Fallback to draft
        setDraft((current) => ({ ...current, body: data.markdown, tags: 'capture' }));
        showToast(`Captured: ${data.title || data.url}`, 'success');
      }
    } catch (error) {
      showToast(`Capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    } finally {
      setCaptureBusy(false);
    }
  }, [captureMode, showToast, workspace, draft]);

  // Open capture preview popup
  const openCapturePreview = useCallback((data: TabCaptureData) => {
    setCapturePreviewData(data);
    setShowCapturePreview(true);
  }, []);

  // Close capture preview popup
  const closeCapturePreview = useCallback(() => {
    setShowCapturePreview(false);
    setCapturePreviewData(null);
  }, []);

  // Handle discard from preview
  const handleDiscardCapture = useCallback(() => {
    closeCapturePreview();
  }, [closeCapturePreview]);

  // Handle edit from preview - move to composer
  const handleEditCapture = useCallback(() => {
    if (capturePreviewData) {
      setDraft((current) => ({ ...current, body: capturePreviewData!.markdown, tags: 'capture' }));
      setPreviewCollapsed(false); // Auto-expand preview
      closeCapturePreview();
    }
  }, [capturePreviewData, closeCapturePreview]);

  // Handle send from preview
  const handleSendCapture = useCallback(() => {
    if (capturePreviewData) {
      // Compute selectedConversation from workspace (already in deps)
      const selectedConv = workspace.conversations.find(
        (c) => c.id === workspace.selectedConversationId && c.pageId === workspace.selectedPageId
      );
      if (selectedConv) {
        const userTags = getTagList(draft.tags);
        const autoTags = inferAutoTags(capturePreviewData.markdown);
        const tags = [...new Set([...userTags, ...autoTags, 'capture'])];
        const nextWorkspace = addDraftToWorkspace(workspace, selectedConv.id, {
          body: capturePreviewData.markdown,
          tags,
          pageId: draft.pageId || BOOKMARKS_PAGE_ID,
        });
        setWorkspace(nextWorkspace);
        setDraft((current) => ({ ...current, body: '', tags: '' }));
        
        const addedBookmarks = nextWorkspace.bookmarks.slice(workspace.bookmarks.length);
        Promise.allSettled(addedBookmarks.map((bookmark) => addChromeBookmark(bookmark.url, bookmark.title)));
        showToast(`Capture posted to ${selectedConv.title}`, 'success');
        closeCapturePreview();
      }
    }
  }, [capturePreviewData, draft, workspace, closeCapturePreview]);

  // Re-capture with new mode from preview
  const handleRecapture = useCallback(async (newMode: CaptureMode) => {
    setCaptureMode(newMode);
    if (capturePreviewData) {
      const data = await captureTab(newMode);
      if (data.markdown) {
        setCapturePreviewData(data);
      }
    }
  }, [capturePreviewData]);

  // Handle history item click
  const handleHistoryItemClick = useCallback((entry: CaptureHistoryEntry) => {
    setCapturePreviewData({
      title: entry.title,
      url: entry.url,
      host: entry.host,
      metaDescription: '',
      ogTitle: '',
      ogDescription: '',
      ogImage: '',
      selectedText: '',
      markdown: entry.markdown,
      mode: entry.mode,
      timestamp: entry.timestamp,
    });
    setShowCapturePreview(true);
    setShowHistoryDropdown(false);
  }, []);

  // Clear capture history
  const clearCaptureHistory = useCallback(() => {
    setCaptureHistory([]);
    setShowHistoryDropdown(false);
  }, []);

  // Toggle history dropdown
  const toggleHistoryDropdown = useCallback(() => {
    setShowHistoryDropdown((prev) => !prev);
  }, []);

  // Position history dropdown
  const positionHistoryDropdown = useCallback(() => {
    if (!historyButtonRef.current) return;
    const rect = historyButtonRef.current.getBoundingClientRect();
    setHistoryDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
      left: 'auto',
      bottom: 'auto',
      zIndex: 9999,
    });
  }, []);

  // Open full window
  const openFullWindow = useCallback(() => {
    const w = Math.round(screen.availWidth * 0.9);
    const h = Math.round(screen.availHeight * 0.9);
    const left = Math.round(screen.availWidth * 0.05);
    const top = Math.round(screen.availHeight * 0.05);
    chrome.windows.create({
      url: 'popup.html',
      width: w,
      height: h,
      left,
      top,
      type: 'popup',
    });
  }, []);

  const selectedPage = workspace.pages.find((page) => page.id === workspace.selectedPageId) || workspace.pages[0];
  // Only treat a conversation as selected if it actually belongs to the
  // currently selected page. This prevents a foreign thread (e.g. from the
  // previously viewed page) from rendering when the new page has no
  // conversation of its own.
  const selectedConversation =
    workspace.conversations.find(
      (conversation) =>
        conversation.id === workspace.selectedConversationId && conversation.pageId === workspace.selectedPageId,
    ) || undefined;
  const visibleMessages = selectedConversation
    ? workspace.messages.filter((message) => message.conversationId === selectedConversation.id)
    : [];
  const hasConversation = Boolean(selectedConversation);
  const allTags = useMemo(() => {
    const values = [
      ...workspace.conversations.flatMap((conversation) => conversation.tags),
      ...workspace.messages.flatMap((message) => message.tags),
      ...workspace.bookmarks.flatMap((bookmark) => bookmark.tags),
    ];
    return [...new Set(values)].sort();
  }, [workspace]);

  const filteredConversations = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return workspace.conversations
      .filter((conversation) => !conversation.archived)
      .filter((conversation) => {
        if (conversation.pageId !== selectedPage?.id && viewMode === 'chat') return false;
        if (activeTag && !conversation.tags.includes(activeTag)) return false;
        if (!lowerQuery) return true;
        const messages = workspace.messages.filter((message) => message.conversationId === conversation.id);
        return [conversation.title, conversation.summary, ...conversation.tags, ...messages.map((message) => message.body)]
          .join(' ')
          .toLowerCase()
          .includes(lowerQuery);
      })
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt));
  }, [activeTag, query, selectedPage?.id, viewMode, workspace.conversations, workspace.messages]);

  const filteredBookmarks = useMemo(() => {
    const lowerQuery = query.trim().toLowerCase();
    return workspace.bookmarks
      .filter((bookmark) => !activeTag || bookmark.tags.includes(activeTag))
      .filter((bookmark) => {
        if (!lowerQuery) return true;
        return [bookmark.title, bookmark.url, bookmark.host, bookmark.kind, ...bookmark.tags]
          .join(' ')
          .toLowerCase()
          .includes(lowerQuery);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [activeTag, query, workspace.bookmarks]);

  const selectPage = (pageId: string) => {
    // Always pick a conversation that actually belongs to this page. Falling
    // back to conversations[0] would surface a different page's thread here.
    const conversation =
      workspace.conversations.find((item) => item.pageId === pageId && !item.archived) ||
      workspace.conversations.find((item) => item.pageId === pageId);
    setWorkspace((current) => ({
      ...current,
      selectedPageId: pageId,
      // Clear the selected conversation when the page has none, so the chat
      // view shows an empty state instead of a foreign thread. Use '' (not
      // null) to stay within the WorkspaceData string type.
      selectedConversationId: conversation?.id ?? '',
      updatedAt: new Date().toISOString(),
    }));
    setDraft((current) => ({ ...current, pageId }));
    setViewMode('chat');
  };

  const createNewPage = () => {
    const name = newPageName.trim();
    if (!name) return;
    const page = createPage(name);
    const conversation = createConversation(page.id, `${name} inbox`);
    setWorkspace((current) => ({
      ...current,
      pages: [...current.pages, page],
      conversations: [...current.conversations, conversation],
      selectedPageId: page.id,
      selectedConversationId: conversation.id,
      updatedAt: new Date().toISOString(),
    }));
    setDraft((current) => ({ ...current, pageId: page.id }));
    setNewPageName('');
    setStatus(`Created ${name}.`);
  };

  const deletePage = (pageId: string) => {
    // Prevent deletion of default pages
    const defaultPageIds = [BOOKMARKS_PAGE_ID, 'page-notes', MELTED_TABS_PAGE_ID];
    if (defaultPageIds.includes(pageId)) {
      showToast('Cannot delete default pages.', 'error');
      return;
    }
    // Prevent deletion if it's the last page
    if (workspace.pages.length <= 1) {
      showToast('Cannot delete the last page.', 'error');
      return;
    }
    
    const pageToDelete = workspace.pages.find((p) => p.id === pageId);
    const pageName = pageToDelete?.name || 'page';
    
    setWorkspace((current) => {
      // Filter out the page
      const newPages = current.pages.filter((page) => page.id !== pageId);
      
      // Filter out conversations belonging to this page
      const newConversations = current.conversations.filter((conv) => conv.pageId !== pageId);
      
      // Filter out messages belonging to conversations on this page
      const conversationIdsToDelete = current.conversations
        .filter((conv) => conv.pageId === pageId)
        .map((conv) => conv.id);
      const newMessages = current.messages.filter((msg) => !conversationIdsToDelete.includes(msg.conversationId));
      
      // Filter out bookmarks belonging to conversations on this page
      const newBookmarks = current.bookmarks.filter((bookmark) => !conversationIdsToDelete.includes(bookmark.conversationId));
      
      // Determine new selected page
      let newSelectedPageId = current.selectedPageId;
      if (current.selectedPageId === pageId) {
        newSelectedPageId = newPages[0]?.id || '';
      }
      
      // Determine new selected conversation
      let newSelectedConversationId = current.selectedConversationId;
      if (conversationIdsToDelete.includes(current.selectedConversationId)) {
        newSelectedConversationId = newConversations[0]?.id || '';
      }
      
      return {
        ...current,
        pages: newPages,
        conversations: newConversations,
        messages: newMessages,
        bookmarks: newBookmarks,
        selectedPageId: newSelectedPageId,
        selectedConversationId: newSelectedConversationId,
        updatedAt: new Date().toISOString(),
      };
    });
    
    setDraft((current) => ({ ...current, pageId: workspace.pages.find((p) => p.id !== pageId)?.id || BOOKMARKS_PAGE_ID }));
    showToast(`Deleted "${pageName}".`, 'success');
  };

  const createNewConversation = () => {
    const pageId = selectedPage?.id || BOOKMARKS_PAGE_ID;
    const conversation = createConversation(pageId);
    setWorkspace((current) => ({
      ...current,
      conversations: [...current.conversations, conversation],
      selectedPageId: pageId,
      selectedConversationId: conversation.id,
      updatedAt: new Date().toISOString(),
    }));
    setDraft((current) => ({ ...current, pageId }));
  };

  // Handle slash commands in the composer
  const postMessage = async () => {
    const body = draft.body.trim();
    if (!body || !selectedConversation) return;

    // Check for slash commands
    if (isSlashCommand(body)) {
      const parsed = parseSlashCommand(body);
      if (parsed) {
        switch (parsed.command) {
          case '/melt-tabs': {
            showStatus('Melting tabs...');
            try {
              const result = await executeMeltTabs(parsed.args);
              // Switch to Melted Tabs page for posting
              setDraft((current) => ({ ...current, body: result.body, tags: result.tags.join(', '), pageId: MELTED_TABS_PAGE_ID }));
              selectPage(MELTED_TABS_PAGE_ID);
              showStatus('Tabs melted. Switch to Melted Tabs page and send to save.');
            } catch (error) {
              showStatus(`Melt tabs failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            return;
          }
          case '/summarize': {
            setStatus('Summarizing current tab...');
            try {
              const data = await captureTab();
              if (!data.markdown) {
                setStatus('Could not capture this tab for summarization.');
                return;
              }
              // Extractive summarization: pick top sentences by keyword density
              const text = data.markdown;
              const lines = text.split('\n').filter((l) => l.trim().length > 20);
              const keywords = ['important', 'key', 'note', 'summary', 'feature', 'todo', 'fix', 'update', 'change', 'new'];
              const scored = lines.map((line) => ({
                line,
                score: keywords.filter((kw) => line.toLowerCase().includes(kw)).length,
              }));
              scored.sort((a, b) => b.score - a.score);
              const top = scored.slice(0, 5).map((s) => `- ${s.line.trim().slice(0, 120)}`);
              const summaryBody = [
                `## Summary of ${data.title}`,
                '',
                `**Source**: ${data.url}`,
                '',
                '### Key Points',
                '',
                ...top,
                '',
                '---',
                '',
                data.markdown,
              ].join('\n');
              setDraft((current) => ({ ...current, body: summaryBody, tags: 'summary' }));
              setStatus('Summary generated. Review and send.');
            } catch (error) {
              setStatus(`Summarize failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
            }
            return;
          }
          case '/todo': {
            setStatus('Extracting todos from the workspace...');
            const todoLines: string[] = [];
            workspace.messages.forEach((msg) => {
              const matches = msg.body.match(/(?:^|\n)\s*[-*]\s*\[.?\]\s*.+/g);
              if (matches) todoLines.push(...matches);
            });
            const todoBody = [
              '# Todo Items',
              '',
              `Extracted from ${workspace.messages.length} messages.`,
              '',
              todoLines.length ? todoLines.join('\n') : '_No checkboxes found in messages._',
            ].join('\n');
            setDraft((current) => ({ ...current, body: todoBody, tags: 'todo' }));
            setStatus(`Found ${todoLines.length} todo items. Review and send.`);
            return;
          }
          case '/todos': {
            setStatus('Building interactive checklist...');
            const todoItems: { messageId: string; line: string; index: number }[] = [];
            workspace.messages.forEach((msg) => {
              const lines = msg.body.split('\n');
              lines.forEach((line, idx) => {
                const match = line.match(/^\s*[-*]\s*\[([ x])\]\s*(.+)/);
                if (match) {
                  todoItems.push({ messageId: msg.id, line, index: idx });
                }
              });
            });
            if (todoItems.length === 0) {
              setStatus('No checkboxes found in the workspace.');
              return;
            }
            // Build a markdown list with source message IDs encoded in a custom protocol
            const todoBody = [
              '# Interactive Todos',
              '',
              'Click any checkbox below to toggle it. Changes are saved immediately.',
              '',
              ...todoItems.map((item, i) => {
                const checked = item.line.includes('[x]');
                return `- [${checked ? 'x' : ' ' }](todo:${item.messageId}:${item.index}) ${item.line.replace(/^\s*[-*]\s*\[[ x]\]\s*/, '')}`;
              }),
            ].join('\n');
            setDraft((current) => ({ ...current, body: todoBody, tags: 'todos' }));
            setStatus(`Found ${todoItems.length} todo items. Review and send to save as interactive list.`);
            return;
          }
          case '/ask': {
            if (!parsed.args) {
              setStatus('Usage: /ask [query] — search conversation history');
              return;
            }
            setStatus('Searching conversations...');
            const query = parsed.args.toLowerCase();
            const results = workspace.messages
              .filter((msg) => msg.body.toLowerCase().includes(query))
              .slice(0, 5)
              .map((msg) => {
                const conv = workspace.conversations.find((c) => c.id === msg.conversationId);
                return `- **${conv?.title || 'Unknown thread'}** (${new Date(msg.createdAt).toLocaleDateString()}): ${msg.body.slice(0, 200)}`;
              });
            const askBody = [
              `## Results for "${parsed.args}"`,
              '',
              results.length ? results.join('\n') : '_No matches found._',
            ].join('\n');
            setDraft((current) => ({ ...current, body: askBody, tags: 'ask' }));
            setStatus(`Found ${results.length} results. Review and send.`);
            return;
          }
        }
      }
    }

    const userTags = getTagList(draft.tags);
    const autoTags = inferAutoTags(body);
    // Merge: user tags first, then auto tags (user wins on duplicates via Set)
    const tags = [...new Set([...userTags, ...autoTags])];
    const beforeCount = workspace.bookmarks.length;
    const nextWorkspace = addDraftToWorkspace(workspace, selectedConversation.id, {
      body,
      tags,
      pageId: draft.pageId || BOOKMARKS_PAGE_ID,
    });
    setWorkspace(nextWorkspace);
    setDraft((current) => ({ ...current, body: '', tags: '' }));

    const addedBookmarks = nextWorkspace.bookmarks.slice(beforeCount);
    await Promise.allSettled(addedBookmarks.map((bookmark) => addChromeBookmark(bookmark.url, bookmark.title)));
    setStatus(
      addedBookmarks.length
        ? `Posted and saved ${addedBookmarks.length} bookmark${addedBookmarks.length === 1 ? '' : 's'}.`
        : 'Posted.',
    );
  };

  const restoreBackup = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as WorkspaceData;
      if (!parsed.schemaVersion || !Array.isArray(parsed.pages)) throw new Error('Invalid backup format.');
      const restored = normalizeWorkspace(parsed);
      setWorkspace(restored);
      setDraft((current) => ({ ...current, pageId: restored.selectedPageId || BOOKMARKS_PAGE_ID }));
      setStatus('Backup restored.');
    } catch (error) {
      setStatus(`Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const exportJson = () => {
    downloadText(makeBackupFilename(), exportWorkspaceJson(workspace));
    setStatus('JSON backup exported.');
  };

  const exportMarkdown = () => {
    downloadText(makeMarkdownFilename(workspace), exportWorkspaceMarkdown(workspace), 'text/markdown');
    setStatus('Markdown export downloaded.');
  };

  const exportGeminiPrompt = () => {
    downloadText(makeGeminiPromptFilename(), exportGeminiBookmarkPrompt(workspace), 'text/markdown');
    setStatus('Gemini bookmark sync prompt exported.');
  };

  const exportDrive = async () => {
    setDriveBusy(true);
    setStatus('Uploading JSON, markdown, and Gemini prompt to Google Drive...');
    try {
      await exportWorkspaceToDrive(workspace);
      setStatus('Exported to Google Drive.');
    } catch (error) {
      setStatus(`Drive export needs setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDriveBusy(false);
    }
  };

  const updateDriveSyncConfig = (patch: Partial<DriveSyncConfig>) => {
    setWorkspace((current) => ({
      ...current,
      driveSync: {
        ...DEFAULT_DRIVE_SYNC_CONFIG,
        ...current.driveSync,
        ...patch,
      },
      updatedAt: new Date().toISOString(),
    }));
  };

  const syncDriveNotes = async () => {
    setDriveSyncBusy(true);
    setStatus('Syncing notes folder structure to Google Drive...');
    try {
      const config = { ...DEFAULT_DRIVE_SYNC_CONFIG, ...workspace.driveSync };
      const result = await syncWorkspaceNotesToDrive(workspace, config);
      setWorkspace((current) => ({
        ...current,
        driveSync: {
          ...DEFAULT_DRIVE_SYNC_CONFIG,
          ...current.driveSync,
          enabled: true,
          lastSyncedAt: result.syncedAt,
          lastRootFolderId: result.rootFolderId,
          lastNotesFolderId: result.notesFolderId,
        },
        updatedAt: result.syncedAt,
      }));
      setStatus(`Synced ${result.syncedFiles.length} notes files to Drive.`);
    } catch (error) {
      setStatus(`Drive notes sync needs setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDriveSyncBusy(false);
    }
  };

  const toggleConversationPin = (conversation: Conversation) => {
    setWorkspace((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === conversation.id ? { ...item, pinned: !item.pinned, updatedAt: new Date().toISOString() } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  const archiveConversation = (conversation: Conversation) => {
    setWorkspace((current) => ({
      ...current,
      conversations: current.conversations.map((item) =>
        item.id === conversation.id ? { ...item, archived: true, updatedAt: new Date().toISOString() } : item,
      ),
      updatedAt: new Date().toISOString(),
    }));
  };

  // Move a message (and its bookmarks) to a conversation on the target page,
  // in place — keeping the same message id so todo:/restore: links stay valid.
  const handleSendToPage = (pageId: string) => {
    if (!sendToMessage) return;
    const messageId = sendToMessage.id;
    const targetPageName = workspace.pages.find((p) => p.id === pageId)?.name || 'page';
    const timestamp = new Date().toISOString();

    setWorkspace((current) => {
      // Choose a destination conversation on the target page (prefer a
      // non-archived one; fall back to creating a new inbox for the page).
      const destination =
        current.conversations.find((c) => c.pageId === pageId && !c.archived) ||
        current.conversations.find((c) => c.pageId === pageId);
      const destinationId = destination?.id || createId('conversation');
      const needsNewConversation = !destination;

      // Get the moved message to use its body for the conversation summary
      const movedMessage = current.messages.find((msg) => msg.id === messageId);
      const newSummary = movedMessage
        ? movedMessage.body.replace(/\s+/g, ' ').slice(0, 140)
        : 'Moved message';

      return {
        ...current,
        conversations: needsNewConversation
          ? [
              ...current.conversations,
              {
                ...createConversation(pageId, `${targetPageName} inbox`),
                id: destinationId,
              },
            ]
          : current.conversations.map((conversation) =>
              conversation.id === destinationId
                ? { ...conversation, summary: newSummary, updatedAt: timestamp }
                : conversation,
            ),
        messages: current.messages.map((msg) =>
          msg.id === messageId ? { ...msg, conversationId: destinationId, pageId, updatedAt: timestamp } : msg,
        ),
        bookmarks: current.bookmarks.map((bookmark) =>
          bookmark.messageId === messageId
            ? { ...bookmark, conversationId: destinationId, pageId, updatedAt: timestamp }
            : bookmark,
        ),
        // Surface the destination so the moved message is immediately visible.
        selectedPageId: pageId,
        selectedConversationId: destinationId,
        updatedAt: timestamp,
      };
    });

    setSendToOpen(false);
    setSendToMessage(null);
    showStatus(`Moved message to "${targetPageName}".`);
  };

  const openSendToPopup = (message: Message) => {
    setSendToMessage(message);
    setSendToOpen(true);
  };

  return (
    <div className={'app-shell' + (sidebarCollapsed ? ' sidebar-collapsed' : '')}>
      <aside className="rail" aria-label="Pages">
        <button className="brand" title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'} onClick={() => setSidebarCollapsed((prev) => !prev)}>
          {sidebarCollapsed ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>
        <nav className="page-list">
          {workspace.pages.map((page) => {
            return (
              <div key={page.id} className="page-button-wrapper" style={{ position: 'relative', width: '100%' }}>
                <button
                  className={page.id === selectedPage?.id ? 'page-button active' : 'page-button'}
                  onClick={() => selectPage(page.id)}
                  title={page.name}
                >
                  {page.kind === 'bookmarks' ? <Bookmark size={17} /> : <Hash size={17} />}
                  <span>{page.name.slice(0, 1).toUpperCase()}</span>
                </button>
              </div>
            );
          })}
        </nav>
      </aside>

      {!sidebarCollapsed && (
      <aside className="sidebar">
        <header className="sidebar-header">
          <div>
            <p className="eyebrow">Local workspace</p>
            <h1>Personal Slack</h1>
          </div>
          <button className="icon-button" title="New conversation" onClick={createNewConversation}>
            <MessageSquarePlus size={18} />
          </button>
        </header>

        <div className="search-box">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations, links, tags"
          />
        </div>

        <div className="new-page-row">
          <input
            value={newPageName}
            onChange={(event) => setNewPageName(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && createNewPage()}
            placeholder="Create page"
          />
          <button className="icon-button" title="Create page" onClick={createNewPage}>
            <FolderPlus size={16} />
          </button>
        </div>

        <div className="mode-tabs" role="tablist">
          <ModeButton mode="chat" active={viewMode} setActive={setViewMode} icon={<History size={16} />} />
          <ModeButton mode="gallery" active={viewMode} setActive={setViewMode} icon={<GalleryVerticalEnd size={16} />} />
          <ModeButton mode="bookmarks" active={viewMode} setActive={setViewMode} icon={<Bookmark size={16} />} />
          <ModeButton mode="settings" active={viewMode} setActive={setViewMode} icon={<Settings size={16} />} />
          {selectedPage && (() => {
            const isDefaultPage = [BOOKMARKS_PAGE_ID, 'page-notes', MELTED_TABS_PAGE_ID].includes(selectedPage.id);
            const isLastPage = workspace.pages.length <= 1;
            const canDelete = !isDefaultPage && !isLastPage;
            return canDelete ? (
              <button
                className="mode-button page-delete-tab"
                title="Delete page"
                onClick={(e) => {
                  e.stopPropagation();
                  if (window.confirm(`Delete page "${selectedPage.name}"? This will also delete all conversations and messages in this page.`)) {
                    deletePage(selectedPage.id);
                  }
                }}
              >
                <Trash2 size={14} />
              </button>
            ) : null;
          })()}
        </div>

        {allTags.length > 0 && (
          <div className="tag-strip">
            <button className={!activeTag ? 'tag active' : 'tag'} onClick={() => setActiveTag('')}>
              all
            </button>
            {allTags.map((tag) => (
              <button
                key={tag}
                className={activeTag === tag ? 'tag active' : 'tag'}
                onClick={() => setActiveTag(activeTag === tag ? '' : tag)}
              >
                #{tag}
              </button>
            ))}
          </div>
        )}

        <ConversationList
          conversations={filteredConversations}
          selectedConversationId={selectedConversation?.id}
          onSelect={(conversation) =>
            setWorkspace((current) => ({
              ...current,
              selectedConversationId: conversation.id,
              selectedPageId: conversation.pageId,
            }))
          }
          onAfterSelectConversation={(conversation) => setDraft((current) => ({ ...current, pageId: conversation.pageId }))}
          onPin={toggleConversationPin}
          onArchive={archiveConversation}
        />
      </aside>
      )}

      <main className="main-panel">
        {/* Title row — thin monospace page title with responsive letter-spacing */}
        <div className="top-bar-title">
          <span className={`top-bar-title-text${!selectedConversation?.title ? ' top-bar-title-solo' : ''}`}>
            {selectedPage?.name || 'Workspace'}
          </span>
          {selectedConversation?.title && (
            <>
              <span className="top-bar-title-sep">/</span>
              <span className="top-bar-title-conv">{selectedConversation.title}</span>
            </>
          )}
        </div>

        {/* Actions row — capture group, more, full, theme toggle */}
        <div className="top-bar-actions">
          <div className="capture-button-group" ref={captureButtonGroupRef}>
            <button
              className="command-button"
              onClick={() => handleCaptureTab()}
              disabled={captureBusy}
              title="Capture current tab (opens preview)"
            >
              <ExternalLink size={16} />
              <span className="cmd-label">{captureBusy ? 'Capturing...' : 'Capture'}</span>
            </button>
            <button
              className="command-button mode-badge"
              onClick={cycleCaptureMode}
              disabled={captureBusy}
              title={`Current mode: ${captureMode.charAt(0).toUpperCase() + captureMode.slice(1)}. Click to cycle.`}
            >
              <span className="mode-badge-text">
                {captureMode === 'full' ? 'F' : captureMode === 'standard' ? 'S' : 'M'}
              </span>
            </button>
            <button
              className="command-button dropdown-toggle"
              onClick={() => {
                positionCaptureDropdown();
                setShowCaptureDropdown((prev) => !prev);
              }}
              aria-expanded={showCaptureDropdown}
              aria-haspopup="true"
              title="Capture options"
            >
              <ChevronDown size={14} />
            </button>
          </div>
          {showCaptureDropdown &&
            createPortal(
              <div
                ref={captureDropdownRef}
                className="slash-suggestions top-more-menu capture-dropdown"
                onMouseDown={(event) => event.preventDefault()}
                style={{ ...captureDropdownStyle, pointerEvents: 'auto' }}
              >
                <button
                  className="slash-suggestion-item"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleCaptureTab();
                    setShowCaptureDropdown(false);
                  }}
                >
                  <span className="slash-suggestion-name">
                    <ExternalLink size={14} />
                    Capture to Draft (Preview)
                  </span>
                </button>
                <button
                  className="slash-suggestion-item"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    handleCaptureAndSend();
                    setShowCaptureDropdown(false);
                  }}
                >
                  <span className="slash-suggestion-name">
                    <Send size={14} />
                    Capture & Send
                  </span>
                </button>
                <hr className="dropdown-divider" />
                <div className="mode-selector">
                  <span className="mode-selector-label">Mode:</span>
                  {(['full', 'standard', 'minimal'] as CaptureMode[]).map((mode) => (
                    <button
                      key={mode}
                      className={`mode-selector-item ${captureMode === mode ? 'active' : ''}`}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        setCaptureMode(mode);
                        setShowCaptureDropdown(false);
                      }}
                    >
                      {mode === 'full' ? '📸 Full' : mode === 'standard' ? '📋 Standard' : '🔗 Minimal'}
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
          {toast && (
            <div className={`toast toast-${toast.type}`}>
              <span>{toast.type === 'success' ? '✓' : '!'}</span>
              <span>{toast.message}</span>
            </div>
          )}
          <button
            ref={moreButtonRef}
            className="command-button"
            onClick={() => {
              positionMoreMenu();
              setMoreOpen((prev) => !prev);
            }}
            aria-expanded={moreOpen}
            title="More actions"
          >
            <ChevronDown size={16} />
            <span className="cmd-label">More</span>
          </button>
          {moreOpen &&
            createPortal(
              <div
                ref={moreMenuRef}
                className="slash-suggestions top-more-menu"
                onMouseDown={(event) => event.preventDefault()}
                style={{ ...moreMenuStyle, pointerEvents: 'auto' }}
              >
                <button className="slash-suggestion-item" onMouseDown={(event) => { event.preventDefault(); exportGeminiPrompt(); setMoreOpen(false); }}>
                  <span className="slash-suggestion-name"><Bot size={14} /> Gemini</span>
                </button>
                <button className="slash-suggestion-item" onMouseDown={(event) => { event.preventDefault(); exportMarkdown(); setMoreOpen(false); }}>
                  <span className="slash-suggestion-name"><FileDown size={14} /> Markdown</span>
                </button>
                <button className="slash-suggestion-item" onMouseDown={(event) => {
                  event.preventDefault();
                  const page = selectedPage;
                  if (page) copyPageMarkdown(page, workspace.conversations, workspace.messages, workspace.bookmarks, showStatus);
                  setMoreOpen(false);
                }}>
                  <span className="slash-suggestion-name"><Copy size={14} /> Copy MD</span>
                </button>
                <button className="slash-suggestion-item" onMouseDown={(event) => { event.preventDefault(); exportJson(); setMoreOpen(false); }}>
                  <span className="slash-suggestion-name"><Download size={14} /> JSON</span>
                </button>
              </div>,
              document.body
            )}
          {!fullWindow && (
            <button className="icon-button" onClick={openFullWindow} title="Full Window">
              <Maximize2 size={16} />
            </button>
          )}
          <button
            className="icon-button theme-toggle"
            onClick={() => setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>
        </div>

        {viewMode === 'chat' && (
      <ChatView
        draft={draft}
        pages={workspace.pages}
        setDraft={setDraft}
        setWorkspace={setWorkspace}
        showStatus={showStatus}
        messages={visibleMessages}
        hasConversation={hasConversation}
        onCreateConversation={createNewConversation}
        bookmarks={filteredBookmarks.filter((bookmark) => bookmark.conversationId === selectedConversation?.id)}
        onPost={postMessage}
        onSendToPage={openSendToPopup}
      />
        )}

        {viewMode === 'gallery' && (
          <GalleryView
            conversations={filteredConversations}
            bookmarks={filteredBookmarks}
            onOpen={(conversation) => {
              setWorkspace((current) => ({
                ...current,
                selectedConversationId: conversation.id,
                selectedPageId: conversation.pageId,
              }));
              setViewMode('chat');
            }}
          />
        )}

        {viewMode === 'bookmarks' && <BookmarksView bookmarks={filteredBookmarks} pages={workspace.pages} />}

        {viewMode === 'settings' && (
          <SettingsView
            workspace={workspace}
            status={status}
            driveBusy={driveBusy}
            driveSyncBusy={driveSyncBusy}
            onExportJson={exportJson}
            onExportMarkdown={exportMarkdown}
            onExportGeminiPrompt={exportGeminiPrompt}
            onExportDrive={exportDrive}
            onSyncDriveNotes={syncDriveNotes}
            onUpdateDriveSyncConfig={updateDriveSyncConfig}
            onRestoreClick={() => restoreInputRef.current?.click()}
            onReset={() => {
              const fresh = createDefaultWorkspace();
              setWorkspace(fresh);
              setDraft({ ...emptyDraft, pageId: fresh.selectedPageId });
              setStatus('Workspace reset.');
            }}
          />
        )}

        <input
          ref={restoreInputRef}
          type="file"
          accept="application/json"
          className="hidden-file"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) void restoreBackup(file);
            event.currentTarget.value = '';
          }}
        />
          {status && <div className="main-status" style={{ zIndex: 9999 }}>{status}</div>}

        {showOnboarding && (
          <OnboardingTour onDismiss={() => {
            setShowOnboarding(false);
            chrome.storage.local.set({ onboarded: true });
          }} />
        )}

        {sendToOpen && sendToMessage && (
          <div className="sendto-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) { setSendToOpen(false); setSendToMessage(null); } }}>
            <div className="sendto-card">
              <div className="sendto-header">
                <h3>Send to page</h3>
                <button className="icon-button" onClick={() => { setSendToOpen(false); setSendToMessage(null); }} aria-label="Close">
                  <X size={16} />
                </button>
              </div>
              <div className="slash-suggestions">
                {workspace.pages.map((page) => (
                  <button
                    key={page.id}
                    type="button"
                    className="slash-suggestion-item"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      handleSendToPage(page.id);
                    }}
                  >
                    <span className="slash-suggestion-name">
                      {page.kind === 'bookmarks' ? <Bookmark size={14} /> : <Hash size={14} />}
                      {page.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function ModeButton({
  mode,
  active,
  setActive,
  icon,
}: {
  mode: ViewMode;
  active: ViewMode;
  setActive: (mode: ViewMode) => void;
  icon: React.ReactNode;
}) {
  return (
    <button className={active === mode ? 'mode-button active' : 'mode-button'} onClick={() => setActive(mode)} title={mode}>
      {icon}
    </button>
  );
}

function ConversationList({
  conversations,
  selectedConversationId,
  onSelect,
  onAfterSelectConversation,
  onPin,
  onArchive,
}: {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onAfterSelectConversation?: (conversation: Conversation) => void;
  onPin: (conversation: Conversation) => void;
  onArchive: (conversation: Conversation) => void;
}) {
  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <article
          key={conversation.id}
          className={conversation.id === selectedConversationId ? 'conversation-card active' : 'conversation-card'}
          onClick={() => {
            onSelect(conversation);
            onAfterSelectConversation?.(conversation);
          }}
        >
          <div className="conversation-title">
            <span>{conversation.title}</span>
            {conversation.pinned && <Pin size={13} />}
          </div>
          <p>{conversation.summary}</p>
          <div className="conversation-meta">
            <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
            <div>
              <button
                className="mini-button"
                title={conversation.pinned ? 'Unpin' : 'Pin'}
                onClick={(event) => {
                  event.stopPropagation();
                  onPin(conversation);
                }}
              >
                <Pin size={13} />
              </button>
              <button
                className="mini-button"
                title="Archive"
                onClick={(event) => {
                  event.stopPropagation();
                  onArchive(conversation);
                }}
              >
                <Archive size={13} />
              </button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}

function ChatView({
  draft,
  pages,
  setDraft,
  setWorkspace,
  showStatus,
  messages,
  bookmarks,
  hasConversation,
  onCreateConversation,
  onPost,
  onSendToPage,
}: {
  draft: typeof emptyDraft;
  pages: Page[];
  setDraft: React.Dispatch<React.SetStateAction<typeof emptyDraft>>;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceData>>;
  showStatus: (msg: string) => void;
  messages: WorkspaceData['messages'];
  bookmarks: SavedBookmark[];
  hasConversation: boolean;
  onCreateConversation: () => void;
  onPost: () => void;
  onSendToPage?: (message: Message) => void;
}) {
  const [previewCollapsed, setPreviewCollapsed] = useState(true);
  const [showSlashSuggestions, setShowSlashSuggestions] = useState(false);
  const [slashFilter, setSlashFilter] = useState('');
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Filtered slash commands based on what the user has typed after '/'
  const filteredSlashCommands = useMemo(() => {
    if (!showSlashSuggestions) return [];
    return SLASH_COMMANDS.filter((cmd: SlashCommand) =>
      cmd.name.toLowerCase().includes(slashFilter.toLowerCase())
    );
  }, [slashFilter, showSlashSuggestions]);

  // Detect '/' and control the suggestions popup
  const handleBodyChange = useCallback((value: string) => {
    setDraft((current) => ({ ...current, body: value }));

    const trimmed = value.trim();
    if (trimmed.startsWith('/')) {
      const afterSlash = trimmed.slice(1);
      setShowSlashSuggestions(true);
      setSlashFilter(afterSlash);
    } else {
      setShowSlashSuggestions(false);
      setSlashFilter('');
    }
  }, [setDraft]);

  // Auto-grow textarea as user types (expands upward into message stream space)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    // Cap at 40vh to prevent overlapping other elements
    const maxHeight = Math.min(textarea.scrollHeight, window.innerHeight * 0.4);
    textarea.style.height = `${Math.max(56, maxHeight)}px`;
  }, [draft.body]);

  // Handle keyboard navigation of suggestions
  const handleComposerKeyDown = useCallback((event: React.KeyboardEvent) => {
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      void onPost();
      return;
    }

    if (showSlashSuggestions && filteredSlashCommands.length > 0) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev < filteredSlashCommands.length - 1 ? prev + 1 : 0
        );
        return;
      }
      if (event.key === 'ArrowUp') {
        event.preventDefault();
        setSelectedSuggestionIndex((prev) =>
          prev > 0 ? prev - 1 : filteredSlashCommands.length - 1
        );
        return;
      }
      if (event.key === 'Enter' || event.key === 'Tab') {
        event.preventDefault();
        // Fill in the selected command
        const selected = filteredSlashCommands[selectedSuggestionIndex];
        if (selected) {
          setDraft((current) => ({ ...current, body: selected.name + ' ' }));
          setShowSlashSuggestions(false);
          setSlashFilter('');
        }
        return;
      }
      if (event.key === 'Escape') {
        setShowSlashSuggestions(false);
        setSlashFilter('');
        return;
      }
    }

    // Esc → blur textarea (only when not in slash suggestions)
    if (event.key === 'Escape') {
      textareaRef.current?.blur();
      return;
    }

    // ↑ (when draft empty and not in slash-suggestions) → load last message into draft
    if (event.key === 'ArrowUp' && !draft.body && messages.length > 0) {
      event.preventDefault();
      const lastMsg = messages[messages.length - 1];
      setDraft((current) => ({ ...current, body: lastMsg.body }));
      // Move cursor to end of textarea after React re-render
      requestAnimationFrame(() => {
        const ta = textareaRef.current;
        if (ta) {
          const len = ta.value.length;
          ta.setSelectionRange(len, len);
        }
      });
      return;
    }

    // Reset suggestion index when typing changes filter
    setSelectedSuggestionIndex(0);
  }, [showSlashSuggestions, filteredSlashCommands, selectedSuggestionIndex, onPost, setDraft, messages, draft.body]);

  return (
    <div className={`chat-layout${previewCollapsed ? ' preview-hidden' : ''}`}>
      {/* Collapsible markdown preview — default collapsed */}
      <section className={`markdown-preview ${previewCollapsed ? 'collapsed' : ''}`} aria-label="Markdown preview">
        <button
          className="section-title toggle-button"
          onClick={() => setPreviewCollapsed((prev) => !prev)}
          title={previewCollapsed ? 'Expand preview' : 'Collapse preview'}
        >
          {previewCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          <Sparkles size={16} />
          <span>Markdown preview</span>
        </button>
        {!previewCollapsed && (
          <div className="preview-content">
            {isShortPreviewCandidate(draft.body) ? (
              <AnimatedShortPreview text={draft.body.trim()} />
            ) : (
              <div className="markdown-body">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    // Render restore: protocol links as "Restore Session" buttons
                    a: ({ href, children }) => {
                      if (href?.startsWith('restore:')) {
                        const parts = href.slice(8).split(':');
                        const sessionId = parts[0];
                        const urls = parts.slice(1).join(':').split(',').map(decodeURIComponent);
                        return (
                          <button
                            className="restore-session-btn"
                            onClick={() => {
                              urls.forEach((url) => {
                                if (url && url !== 'about:blank') {
                                  chrome.tabs.create({ url, active: false });
                                }
                              });
                            }}
                            title={`Restore ${urls.length} tabs from this session`}
                          >
                            <ExternalLink size={14} />
                            Restore Session ({urls.length} tabs)
                          </button>
                        );
                      }
                      return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
                    },
                  }}
                >
                  {draft.body.trim() || 'Type markdown below to preview headings, lists, tables, tasks, links, and code.'}
                </ReactMarkdown>
              </div>
            )}
          </div>
        )}
      </section>

      {hasConversation ? (
        <section className="message-stream" aria-label="Messages">
          {messages.map((message) => (
            <MessageBubble
              key={message.id}
              message={message}
              bookmarks={bookmarks}
              pages={pages}
              setDraft={setDraft}
              setWorkspace={setWorkspace}
              showStatus={showStatus}
              onSendToPage={onSendToPage}
            />
          ))}
        </section>
      ) : (
        <section className="empty-page" aria-label="No conversation">
          <p>No conversation on this page yet.</p>
          <button className="command-button" onClick={onCreateConversation}>
            <MessageSquarePlus size={16} />
            <span>New conversation</span>
          </button>
        </section>
      )}

      {bookmarks.length > 0 && (
        <section className="inline-bookmarks">
          {bookmarks.slice(0, 4).map((bookmark) => (
            <BookmarkChip key={bookmark.id} bookmark={bookmark} />
          ))}
        </section>
      )}

      <section className="composer" aria-label="Composer">
        <div className="composer-tools">
          <label>
            <Bookmark size={15} />
            <PageSelect
              pages={pages}
              value={draft.pageId}
              onChange={(pageId) => setDraft((current) => ({ ...current, pageId }))}
            />
          </label>
          <label>
            <Tags size={15} />
            <input
              value={draft.tags}
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="tags, comma separated"
            />
          </label>
        </div>
        <div className="composer-textarea-wrapper">
          {/* Slash command suggestions popup */}
          {showSlashSuggestions && filteredSlashCommands.length > 0 && (
            <div className="slash-suggestions">
              {filteredSlashCommands.map((cmd, index) => (
                <button
                  key={cmd.name}
                  className={`slash-suggestion-item ${index === selectedSuggestionIndex ? 'selected' : ''}`}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setDraft((current) => ({ ...current, body: cmd.name + ' ' }));
                    setShowSlashSuggestions(false);
                    setSlashFilter('');
                    textareaRef.current?.focus();
                  }}
                >
                  <span className="slash-suggestion-name">{cmd.name}</span>
                  <span className="slash-suggestion-desc">{cmd.description}</span>
                </button>
              ))}
            </div>
          )}
          <textarea
            ref={textareaRef}
            value={draft.body}
            onChange={(event) => handleBodyChange(event.target.value)}
            onKeyDown={handleComposerKeyDown}
            placeholder="Write markdown, paste links, add notes. Ctrl+Enter sends. Type / for commands."
          />
          {/* Send button embedded inside the composer box, separated by a border */}
          <button className="send-button" onClick={onPost} title="Send (Ctrl+Enter)">
            <Send size={17} />
            <span>Send</span>
          </button>
        </div>
      </section>
    </div>
  );
}

// Per-message bubble with a hover toolbar (Copy / Send-to-page / Delete).
// Keeps captured snippets reusable without leaving the chat view.
function MessageBubble({
  message,
  bookmarks,
  pages,
  setDraft,
  setWorkspace,
  showStatus,
  onSendToPage,
}: {
  message: WorkspaceData['messages'][number];
  bookmarks: SavedBookmark[];
  pages: Page[];
  setDraft: React.Dispatch<React.SetStateAction<typeof emptyDraft>>;
  setWorkspace: React.Dispatch<React.SetStateAction<WorkspaceData>>;
  showStatus: (msg: string) => void;
  onSendToPage?: (message: Message) => void;
}) {
  const messageBookmarks = bookmarks.filter((bookmark) => bookmark.messageId === message.id);
  const githubRepos = findGitHubRepos(message.body);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      showStatus('Copied message to clipboard.');
    } catch {
      showStatus('Clipboard unavailable.');
    }
  };

  const handleDelete = () => {
    if (!window.confirm('Delete this message? This cannot be undone.')) return;
    setWorkspace((current) => ({
      ...current,
      messages: current.messages.filter((item) => item.id !== message.id),
      bookmarks: current.bookmarks.filter((item) => item.messageId !== message.id),
      updatedAt: new Date().toISOString(),
    }));
    showStatus('Message deleted.');
  };

  return (
    <article className="message-bubble">
      <div className="message-actions">
        <button className="mini-button" title="Copy" onClick={handleCopy}>
          <Copy size={13} />
        </button>
        <button className="mini-button" title="Send to page" onClick={() => onSendToPage?.(message)}>
          <ExternalLink size={13} />
        </button>
        <button className="mini-button" title="Delete" onClick={handleDelete}>
          <Trash2 size={13} />
        </button>
      </div>
      <div className="message-meta">
        <span>{new Date(message.createdAt).toLocaleString()}</span>
        <span>{message.tags.map((tag) => `#${tag}`).join(' ')}</span>
      </div>
      <div className="markdown-body compact">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            a: ({ href, children }) => {
              if (href?.startsWith('restore:')) {
                const parts = href.slice(8).split(':');
                const sessionId = parts[0];
                const urls = parts.slice(1).join(':').split(',').map(decodeURIComponent);
                return (
                  <button
                    className="restore-session-btn"
                    onClick={() => {
                      urls.forEach((url) => {
                        if (url && url !== 'about:blank') {
                          chrome.tabs.create({ url, active: false });
                        }
                      });
                    }}
                    title={`Restore ${urls.length} tabs from this session`}
                  >
                    <ExternalLink size={14} />
                    Restore Session ({urls.length} tabs)
                  </button>
                );
              }
              // todo: protocol — interactive checkbox toggle
              if (href?.startsWith('todo:')) {
                const parts = href.slice(5).split(':');
                const sourceMessageId = parts[0];
                const lineIndex = parseInt(parts[1], 10);
                const isChecked = children === 'x';
                return (
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {
                      setWorkspace((current) => ({
                        ...current,
                        messages: current.messages.map((msg) => {
                          if (msg.id !== sourceMessageId) return msg;
                          const lines = msg.body.split('\n');
                          const line = lines[lineIndex];
                          if (!line) return msg;
                          const toggled = line.includes('[x]')
                            ? line.replace('[x]', '[ ]')
                            : line.replace('[ ]', '[x]');
                          lines[lineIndex] = toggled;
                          return { ...msg, body: lines.join('\n'), updatedAt: new Date().toISOString() };
                        }),
                        updatedAt: new Date().toISOString(),
                      }));
                      showStatus('Todo toggled.');
                    }}
                    style={{ cursor: 'pointer', accentColor: 'var(--color-primary)' }}
                  />
                );
              }
              return <a href={href} target="_blank" rel="noreferrer">{children}</a>;
            },
          }}
        >
          {message.body}
        </ReactMarkdown>
      </div>
      <MessageLinkPreviews bookmarks={messageBookmarks} githubRepos={githubRepos} />
    </article>
  );
}

function MessageLinkPreviews({
  bookmarks,
  githubRepos,
}: {
  bookmarks: SavedBookmark[];
  githubRepos: GitHubRepoInfo[];
}) {
  if (!bookmarks.length && !githubRepos.length) return null;

  return (
    <div className="message-previews">
      {bookmarks.map((bookmark) => (
        <a key={bookmark.id} className="link-preview-card" href={bookmark.url} target="_blank" rel="noreferrer">
          {bookmark.thumbnailUrl ? (
            <img src={bookmark.thumbnailUrl} alt="" />
          ) : (
            <div className="link-preview-icon">
              <ExternalLink size={18} />
            </div>
          )}
          <div>
            <strong>{bookmark.title}</strong>
            <span>
              {bookmark.kind} / {bookmark.host}
            </span>
          </div>
        </a>
      ))}
      {githubRepos.map((repo) => (
        <GitHubRepoPanel key={repo.repoName} repo={repo} />
      ))}
    </div>
  );
}

function GitHubRepoPanel({ repo }: { repo: GitHubRepoInfo }) {
  const actions = getGitHubActionLinks(repo);
  const groups: Array<GitHubActionLinkGroup> = ['formats', 'work', 'tracking', 'api'];

  return (
    <div className="github-panel">
      <div className="github-panel-title">
        <Github size={18} />
        <strong>{repo.repoName}</strong>
      </div>
      {groups.map((group) => (
        <div key={group} className="github-action-group">
          <span>{group}</span>
          <div>
            {actions
              .filter((action) => action.group === group)
              .map((action) => (
                <a key={`${group}-${action.label}`} href={action.url} target="_blank" rel="noreferrer">
                  {action.label}
                </a>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}

type GitHubActionLinkGroup = 'formats' | 'work' | 'tracking' | 'api';

// First-run onboarding tour — shown once on initial load.
// Uses anime.js for fade/slide transitions (already in dependencies).
function OnboardingTour({ onDismiss }: { onDismiss: () => void }) {
  const [step, setStep] = useState(0);
  const overlayRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  const steps = [
    { title: 'Capture Tabs', body: 'Click "Capture" or right-click any page, link, or image and choose "Send to Personal Slack" to save it instantly.' },
    { title: 'Slash Commands', body: 'Type "/" in the composer to see available commands like /melt-tabs, /summarize, /todo, /todos, and /ask.' },
    { title: 'Full Window', body: 'Click "Full" to open the workspace in a popup window for a more spacious view.' },
    { title: 'Drive Sync', body: 'Go to Settings to configure Google Drive sync for automatic backups and notes synchronization.' },
  ];

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    anime.remove(el);
    anime({
      targets: el,
      opacity: [0, 1],
      translateY: [12, 0],
      duration: 400,
      easing: 'easeOutQuad',
    });
  }, [step]);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep((s) => s + 1);
    } else {
      onDismiss();
    }
  };

  if (step >= steps.length) return null;

  return (
    <div className="onboarding-overlay" ref={overlayRef} onClick={(e) => { if (e.target === overlayRef.current) onDismiss(); }}>
      <div className="onboarding-card" ref={contentRef}>
        <div className="onboarding-steps">
          {steps.map((_, i) => (
            <span key={i} className={`onboarding-dot ${i === step ? 'active' : ''}`} />
          ))}
        </div>
        <h3 className="onboarding-title">{steps[step].title}</h3>
        <p className="onboarding-body">{steps[step].body}</p>
        <div className="onboarding-actions">
          <button className="command-button" onClick={onDismiss}>Skip</button>
          <button className="send-button" onClick={handleNext}>
            {step < steps.length - 1 ? 'Next' : 'Got it'}
          </button>
        </div>
      </div>
    </div>
  );
}

function AnimatedShortPreview({ text }: { text: string }) {
  const previewRef = useRef<HTMLDivElement>(null);
  const characters = useMemo(() => Array.from(text), [text]);

  useEffect(() => {
    const targets = previewRef.current?.querySelectorAll('.short-preview-char');
    if (!targets?.length) return;

    anime.remove(targets);
    anime({
      targets,
      opacity: [0, 1],
      translateY: [14, 0],
      rotate: [-8, 0],
      scale: [0.88, 1],
      delay: anime.stagger(34),
      duration: 720,
      easing: 'easeOutElastic(1, .72)',
    });
  }, [text]);

  return (
    <div ref={previewRef} className="short-preview-animated" aria-label="Animated short text preview">
      {characters.map((character, index) => (
        <span key={`${character}-${index}`} className="short-preview-char">
          {character === ' ' ? '\u00a0' : character}
        </span>
      ))}
    </div>
  );
}

function BookmarkChip({ bookmark }: { bookmark: SavedBookmark }) {
  return (
    <a className="bookmark-chip" href={bookmark.url} target="_blank" rel="noreferrer">
      {bookmark.thumbnailUrl ? <img src={bookmark.thumbnailUrl} alt="" /> : <LinkIcon size={16} />}
      <span>{bookmark.title}</span>
    </a>
  );
}

function GalleryView({
  conversations,
  bookmarks,
  onOpen,
}: {
  conversations: Conversation[];
  bookmarks: SavedBookmark[];
  onOpen: (conversation: Conversation) => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const coverflowRef = useRef<HTMLDivElement>(null);

  const goTo = useCallback((index: number) => {
    if (index < 0 || index >= conversations.length) return;
    setCurrentIndex(index);
  }, [conversations.length]);

  const goPrev = useCallback(() => goTo(currentIndex - 1), [currentIndex, goTo]);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  useEffect(() => {
    const targets = coverflowRef.current?.querySelectorAll('.coverflow-item');
    if (!targets?.length) return;
    anime.remove(targets);

    anime({
      targets: Array.from(targets),
      translateX: (el: Element) => {
        const idx = Number((el as HTMLElement).dataset.index);
        const offset = idx - currentIndex;
        if (idx === currentIndex) return 0;
        const spacing = 240;
        const direction = offset < 0 ? -1 : 1;
        return direction * spacing * Math.min(Math.abs(offset), 3);
      },
      translateZ: (el: Element) => {
        const idx = Number((el as HTMLElement).dataset.index);
        const offset = Math.abs(idx - currentIndex);
        if (idx === currentIndex) return 0;
        return -200 * Math.min(offset, 3);
      },
      rotateY: (el: Element) => {
        const idx = Number((el as HTMLElement).dataset.index);
        const offset = idx - currentIndex;
        if (idx === currentIndex) return 0;
        const direction = offset < 0 ? 1 : -1;
        return direction * 60 * Math.min(Math.abs(offset), 3);
      },
      duration: 700,
      easing: 'easeOutCubic',
    });
  }, [currentIndex, conversations.length]);

  if (!conversations.length) {
    return (
      <div className="gallery-empty">
        <p>No conversations in this page yet.</p>
        <button className="command-button" onClick={(event) => { event.preventDefault(); onOpen({} as Conversation); }}>
          <MessageSquarePlus size={16} />
          <span>New conversation</span>
        </button>
      </div>
    );
  }

  return (
    <div className="gallery-view">
      <div className="gallery-controls">
        <button
          type="button"
          className="gallery-nav"
          onClick={goPrev}
          disabled={currentIndex === 0}
          title="Previous"
        >
          <ChevronLeft size={22} />
        </button>
        <span className="gallery-counter">{currentIndex + 1} / {conversations.length}</span>
        <button
          type="button"
          className="gallery-nav"
          onClick={goNext}
          disabled={currentIndex === conversations.length - 1}
          title="Next"
        >
          <ChevronRight size={22} />
        </button>
      </div>

      <div className="coverflow" ref={coverflowRef}>
        {conversations.map((conversation, index) => (
          <button
            key={conversation.id}
            type="button"
            data-index={index}
            className={`coverflow-item ${index === currentIndex ? 'active' : ''}`}
            onClick={(event) => {
              event.preventDefault();
              setCurrentIndex(index);
              onOpen(conversation);
            }}
          >
            <div className="coverflow-item-inner">
              <div className="coverflow-item-header">
                <span className="coverflow-item-title">{conversation.title}</span>
                {conversation.pinned && <Pin size={14} />}
              </div>
              <p className="coverflow-item-summary">{conversation.summary || 'No summary'}</p>
              <div className="coverflow-item-meta">
                <span>{new Date(conversation.updatedAt).toLocaleDateString()}</span>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// Bookmarks grid view
function BookmarksView({
  bookmarks,
  pages,
}: {
  bookmarks: SavedBookmark[];
  pages: Page[];
}) {
  return (
    <div className="bookmarks-grid">
      {bookmarks.map((bookmark) => (
        <a
          key={bookmark.id}
          className="bookmark-card"
          href={bookmark.url}
          target="_blank"
          rel="noreferrer"
        >
          {bookmark.thumbnailUrl ? (
            <img src={bookmark.thumbnailUrl} alt="" />
          ) : (
            <div className="bookmark-card-icon">
              <ExternalLink size={20} />
            </div>
          )}
          <div>
            <div className="bookmark-card-title">{bookmark.title}</div>
            <p>{bookmark.host}</p>
            <span>{bookmark.kind}</span>
          </div>
        </a>
      ))}
    </div>
  );
}

// Settings / dashboard view
function SettingsView({
  workspace,
  status,
  driveBusy,
  driveSyncBusy,
  onExportJson,
  onExportMarkdown,
  onExportGeminiPrompt,
  onExportDrive,
  onSyncDriveNotes,
  onUpdateDriveSyncConfig,
  onRestoreClick,
  onReset,
}: {
  workspace: WorkspaceData;
  status: string;
  driveBusy: boolean;
  driveSyncBusy: boolean;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onExportGeminiPrompt: () => void;
  onExportDrive: () => void;
  onSyncDriveNotes: () => void;
  onUpdateDriveSyncConfig: (patch: Partial<DriveSyncConfig>) => void;
  onRestoreClick: () => void;
  onReset: () => void;
}) {
  return (
    <div className="settings-panel">
      <div className="stats-row">
        <Stat label="Pages" value={workspace.pages.length} />
        <Stat label="Threads" value={workspace.conversations.length} />
        <Stat label="Messages" value={workspace.messages.length} />
        <Stat label="Bookmarks" value={workspace.bookmarks.length} />
      </div>

      <div className="settings-actions">
        <button className="command-button large" onClick={onExportJson}>
          <Download size={17} />
          <span>Backup JSON</span>
        </button>
        <button className="command-button large" onClick={onRestoreClick}>
          <Import size={17} />
          <span>Restore JSON</span>
        </button>
        <button className="command-button large" onClick={onExportMarkdown}>
          <FileDown size={17} />
          <span>Export Markdown</span>
        </button>
        <button className="command-button large" onClick={onExportGeminiPrompt}>
          <Bot size={17} />
          <span>Gemini Prompt</span>
        </button>
        <button className="command-button large" onClick={onExportDrive} disabled={driveBusy}>
          <UploadCloud size={17} />
          <span>{driveBusy ? 'Uploading' : 'Export to Drive'}</span>
        </button>
      </div>

      <div className="settings-section">
        <h3 className="settings-section-title">
          <CloudCog size={17} />
          <span>Drive Notes Sync</span>
        </h3>
        <div className="drive-sync-controls">
          <label className="drive-toggle">
            <input
              type="checkbox"
              checked={workspace.driveSync.enabled}
              onChange={(event) => onUpdateDriveSyncConfig({ enabled: event.target.checked })}
            />
            <span>Sync enabled</span>
          </label>
          <label className="drive-field">
            <span>Root folder</span>
            <input
              value={workspace.driveSync.rootFolderName}
              onChange={(event) => onUpdateDriveSyncConfig({ rootFolderName: event.target.value })}
              placeholder="Personal Slack Notes"
            />
          </label>
          <label className="drive-field">
            <span>Notes folder</span>
            <input
              value={workspace.driveSync.notesFolderName}
              onChange={(event) => onUpdateDriveSyncConfig({ notesFolderName: event.target.value })}
              placeholder="Notes Sync"
            />
          </label>
          <button className="command-button large" onClick={onSyncDriveNotes} disabled={driveSyncBusy}>
            <UploadCloud size={17} />
            <span>{driveSyncBusy ? 'Syncing...' : 'Sync Notes to Drive'}</span>
          </button>
          {workspace.driveSync.lastSyncedAt && (
            <p className="drive-last-synced">Last synced: {new Date(workspace.driveSync.lastSyncedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="setup-note">
        <Check size={17} />
        <span>Data is stored locally in Chrome storage. Drive export requires replacing the OAuth client placeholder.</span>
      </div>

      <button className="danger-button" onClick={onReset}>
        <X size={16} />
        <span>Reset local workspace</span>
      </button>

      {status && <div className="status-line">{status}</div>}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="stat">
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

// Custom page picker for the composer. Replaces a native <select> so the
// dropdown shares the dark "slash-suggestions" look (OS-painted <option>
// lists cannot be styled). Closes on outside click or Escape.
function PageSelect({
  pages,
  value,
  onChange,
}: {
  pages: Page[];
  value: string;
  onChange: (pageId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = pages.find((page) => page.id === value);

  useEffect(() => {
    if (!open) return;
    const onDocClick = (event: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="page-select" ref={wrapRef}>
      <button
        type="button"
        className="page-select-trigger"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span>{selected?.name || 'Select page'}</span>
        <ChevronDown size={14} />
      </button>
      {open && (
        <div className="slash-suggestions page-select-menu" role="listbox">
          {pages.map((page) => (
            <button
              key={page.id}
              type="button"
              role="option"
              aria-selected={page.id === value}
              className={`slash-suggestion-item ${page.id === value ? 'selected' : ''}`}
              onMouseDown={(event) => {
                event.preventDefault();
                onChange(page.id);
                setOpen(false);
              }}
            >
              <span className="slash-suggestion-name">
                {page.kind === 'bookmarks' ? <Bookmark size={14} /> : <Hash size={14} />}
                {page.name}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
