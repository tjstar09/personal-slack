import {
  Archive,
  Bookmark,
  Check,
  Download,
  FileDown,
  FolderPlus,
  GalleryVerticalEnd,
  Hash,
  History,
  Import,
  LinkIcon,
  MessageSquarePlus,
  PanelRightOpen,
  Pin,
  Plus,
  Search,
  Send,
  Settings,
  Sparkles,
  Star,
  Tags,
  UploadCloud,
  X,
} from 'lucide-react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { addChromeBookmark, exportWorkspaceToDrive } from './chromeIntegrations';
import {
  addDraftToWorkspace,
  BOOKMARKS_PAGE_ID,
  createConversation,
  createDefaultWorkspace,
  createPage,
  getTagList,
  normalizeWorkspace,
} from './data';
import {
  downloadText,
  exportWorkspaceJson,
  exportWorkspaceMarkdown,
  makeBackupFilename,
  makeMarkdownFilename,
} from './exports';
import { loadWorkspace, saveWorkspace } from './storage';
import type { Bookmark as SavedBookmark, Conversation, Page, ViewMode, WorkspaceData } from './types';

const emptyDraft = {
  body: '',
  tags: '',
  pageId: BOOKMARKS_PAGE_ID,
};

const fallbackWorkspace = createDefaultWorkspace();

export function App() {
  const [workspace, setWorkspace] = useState<WorkspaceData>(fallbackWorkspace);
  const [isLoaded, setIsLoaded] = useState(false);
  const [query, setQuery] = useState('');
  const [activeTag, setActiveTag] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('chat');
  const [draft, setDraft] = useState(emptyDraft);
  const [newPageName, setNewPageName] = useState('');
  const [status, setStatus] = useState('');
  const [driveBusy, setDriveBusy] = useState(false);
  const restoreInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadWorkspace()
      .then((loaded) => {
        setWorkspace(loaded);
        setDraft((current) => ({ ...current, pageId: loaded.selectedPageId || BOOKMARKS_PAGE_ID }));
      })
      .catch((error) => setStatus(`Load failed: ${error.message}`))
      .finally(() => setIsLoaded(true));
  }, []);

  useEffect(() => {
    if (!isLoaded) return;
    saveWorkspace(workspace).catch((error) => setStatus(`Save failed: ${error.message}`));
  }, [workspace, isLoaded]);

  const selectedPage = workspace.pages.find((page) => page.id === workspace.selectedPageId) || workspace.pages[0];
  const selectedConversation =
    workspace.conversations.find((conversation) => conversation.id === workspace.selectedConversationId) ||
    workspace.conversations[0];
  const visibleMessages = workspace.messages.filter((message) => message.conversationId === selectedConversation?.id);
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
    const conversation = workspace.conversations.find((item) => item.pageId === pageId) || workspace.conversations[0];
    setWorkspace((current) => ({
      ...current,
      selectedPageId: pageId,
      selectedConversationId: conversation?.id || current.selectedConversationId,
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

  const postMessage = async () => {
    const body = draft.body.trim();
    if (!body || !selectedConversation) return;

    const tags = getTagList(draft.tags);
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

  const exportDrive = async () => {
    setDriveBusy(true);
    setStatus('Uploading JSON and markdown to Google Drive...');
    try {
      await exportWorkspaceToDrive(workspace);
      setStatus('Exported to Google Drive.');
    } catch (error) {
      setStatus(`Drive export needs setup: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setDriveBusy(false);
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

  return (
    <div className="app-shell">
      <aside className="rail" aria-label="Pages">
        <div className="brand" title="Personal Slack">
          <PanelRightOpen size={20} />
        </div>
        <nav className="page-list">
          {workspace.pages.map((page) => (
            <button
              key={page.id}
              className={page.id === selectedPage?.id ? 'page-button active' : 'page-button'}
              onClick={() => selectPage(page.id)}
              title={page.name}
            >
              {page.kind === 'bookmarks' ? <Bookmark size={17} /> : <Hash size={17} />}
              <span>{page.name.slice(0, 1).toUpperCase()}</span>
            </button>
          ))}
        </nav>
      </aside>

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
          onPin={toggleConversationPin}
          onArchive={archiveConversation}
        />
      </aside>

      <main className="main-panel">
        <div className="top-bar">
          <div>
            <p className="eyebrow">{selectedPage?.name || 'Workspace'}</p>
            <h2>{selectedConversation?.title || 'No conversation selected'}</h2>
          </div>
          <div className="top-actions">
            <button className="command-button" onClick={exportMarkdown}>
              <FileDown size={16} />
              <span>MD</span>
            </button>
            <button className="command-button" onClick={exportJson}>
              <Download size={16} />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {viewMode === 'chat' && (
          <ChatView
            draft={draft}
            pages={workspace.pages}
            setDraft={setDraft}
            messages={visibleMessages}
            bookmarks={filteredBookmarks.filter((bookmark) => bookmark.conversationId === selectedConversation?.id)}
            onPost={postMessage}
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
            onExportJson={exportJson}
            onExportMarkdown={exportMarkdown}
            onExportDrive={exportDrive}
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
        {status && <div className="main-status">{status}</div>}
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
  onPin,
  onArchive,
}: {
  conversations: Conversation[];
  selectedConversationId?: string;
  onSelect: (conversation: Conversation) => void;
  onPin: (conversation: Conversation) => void;
  onArchive: (conversation: Conversation) => void;
}) {
  return (
    <div className="conversation-list">
      {conversations.map((conversation) => (
        <article
          key={conversation.id}
          className={conversation.id === selectedConversationId ? 'conversation-card active' : 'conversation-card'}
          onClick={() => onSelect(conversation)}
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
                <Star size={13} />
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
  messages,
  bookmarks,
  onPost,
}: {
  draft: typeof emptyDraft;
  pages: Page[];
  setDraft: React.Dispatch<React.SetStateAction<typeof emptyDraft>>;
  messages: WorkspaceData['messages'];
  bookmarks: SavedBookmark[];
  onPost: () => void;
}) {
  return (
    <div className="chat-layout">
      <section className="markdown-preview" aria-label="Markdown preview">
        <div className="section-title">
          <Sparkles size={16} />
          <span>Markdown preview</span>
        </div>
        <div className="markdown-body">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {draft.body.trim() || 'Type markdown below to preview headings, lists, tables, tasks, links, and code.'}
          </ReactMarkdown>
        </div>
      </section>

      <section className="message-stream" aria-label="Messages">
        {messages.map((message) => (
          <article key={message.id} className="message-bubble">
            <div className="message-meta">
              <span>{new Date(message.createdAt).toLocaleString()}</span>
              <span>{message.tags.map((tag) => `#${tag}`).join(' ')}</span>
            </div>
            <div className="markdown-body compact">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.body}</ReactMarkdown>
            </div>
          </article>
        ))}
      </section>

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
            <select value={draft.pageId} onChange={(event) => setDraft((current) => ({ ...current, pageId: event.target.value }))}>
              {pages.map((page) => (
                <option key={page.id} value={page.id}>
                  {page.name}
                </option>
              ))}
            </select>
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
        <textarea
          value={draft.body}
          onChange={(event) => setDraft((current) => ({ ...current, body: event.target.value }))}
          onKeyDown={(event) => {
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') void onPost();
          }}
          placeholder="Write markdown, paste links, add notes. Ctrl+Enter sends."
        />
        <button className="send-button" onClick={onPost}>
          <Send size={17} />
          <span>Send</span>
        </button>
      </section>
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
  return (
    <div className="gallery-grid">
      {conversations.map((conversation) => {
        const previewBookmark = bookmarks.find((bookmark) => bookmark.conversationId === conversation.id);
        return (
          <button key={conversation.id} className="gallery-card" onClick={() => onOpen(conversation)}>
            {previewBookmark?.thumbnailUrl ? <img src={previewBookmark.thumbnailUrl} alt="" /> : <div className="gallery-icon"><Hash size={24} /></div>}
            <span>{conversation.title}</span>
            <p>{conversation.summary}</p>
          </button>
        );
      })}
    </div>
  );
}

function BookmarksView({ bookmarks, pages }: { bookmarks: SavedBookmark[]; pages: Page[] }) {
  return (
    <div className="bookmarks-grid">
      {bookmarks.map((bookmark) => {
        const page = pages.find((item) => item.id === bookmark.pageId);
        return (
          <a key={bookmark.id} className="bookmark-card" href={bookmark.url} target="_blank" rel="noreferrer">
            {bookmark.thumbnailUrl ? <img src={bookmark.thumbnailUrl} alt="" /> : <div className="bookmark-card-icon"><LinkIcon size={22} /></div>}
            <div>
              <div className="bookmark-card-title">{bookmark.title}</div>
              <p>{bookmark.host}</p>
              <span>{bookmark.kind} · {page?.name || 'Bookmarks'}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
}

function SettingsView({
  workspace,
  status,
  driveBusy,
  onExportJson,
  onExportMarkdown,
  onExportDrive,
  onRestoreClick,
  onReset,
}: {
  workspace: WorkspaceData;
  status: string;
  driveBusy: boolean;
  onExportJson: () => void;
  onExportMarkdown: () => void;
  onExportDrive: () => void;
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
        <button className="command-button large" onClick={onExportDrive} disabled={driveBusy}>
          <UploadCloud size={17} />
          <span>{driveBusy ? 'Uploading' : 'Export to Drive'}</span>
        </button>
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
