import {
  Archive,
  Bot,
  Bookmark,
  Check,
  CloudCog,
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
import anime from 'animejs';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { addChromeBookmark, exportWorkspaceToDrive, syncWorkspaceNotesToDrive } from './chromeIntegrations';
import {
  addDraftToWorkspace,
  BOOKMARKS_PAGE_ID,
  createConversation,
  createDefaultWorkspace,
  createPage,
  DEFAULT_DRIVE_SYNC_CONFIG,
  getTagList,
  normalizeWorkspace,
} from './data';
import {
  downloadText,
  exportGeminiBookmarkPrompt,
  exportWorkspaceJson,
  exportWorkspaceMarkdown,
  makeBackupFilename,
  makeGeminiPromptFilename,
  makeMarkdownFilename,
} from './exports';
import { findGitHubRepos, getGitHubActionLinks, type GitHubRepoInfo } from './githubLinks';
import { loadWorkspace, saveWorkspace } from './storage';
import type { Bookmark as SavedBookmark, Conversation, DriveSyncConfig, Page, ViewMode, WorkspaceData } from './types';

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
  const [driveSyncBusy, setDriveSyncBusy] = useState(false);
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
            <button className="command-button" onClick={exportGeminiPrompt} title="Export Gemini prompt">
              <Bot size={16} />
              <span>Gemini</span>
            </button>
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
        {isShortPreviewCandidate(draft.body) ? (
          <AnimatedShortPreview text={draft.body.trim()} />
        ) : (
          <div className="markdown-body">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {draft.body.trim() || 'Type markdown below to preview headings, lists, tables, tasks, links, and code.'}
            </ReactMarkdown>
          </div>
        )}
      </section>

      <section className="message-stream" aria-label="Messages">
        {messages.map((message) => {
          const messageBookmarks = bookmarks.filter((bookmark) => bookmark.messageId === message.id);
          const githubRepos = findGitHubRepos(message.body);

          return (
            <article key={message.id} className="message-bubble">
              <div className="message-meta">
                <span>{new Date(message.createdAt).toLocaleString()}</span>
                <span>{message.tags.map((tag) => `#${tag}`).join(' ')}</span>
              </div>
              <div className="markdown-body compact">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.body}</ReactMarkdown>
              </div>
              <MessageLinkPreviews bookmarks={messageBookmarks} githubRepos={githubRepos} />
            </article>
          );
        })}
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
