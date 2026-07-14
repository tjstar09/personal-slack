import type {
  Bookmark,
  BookmarkKind,
  Conversation,
  DraftPayload,
  DriveSyncConfig,
  Message,
  Page,
  WorkspaceData,
} from './types';

export const STORAGE_KEY = 'personal-slack-workspace';
export const BOOKMARKS_PAGE_ID = 'page-bookmarks';
export const DEFAULT_DRIVE_SYNC_CONFIG: DriveSyncConfig = {
  enabled: false,
  rootFolderName: 'Personal Slack Notes',
  notesFolderName: 'Notes Sync',
  fileStrategy: 'page-folders',
};

const now = () => new Date().toISOString();

export const createId = (prefix: string) =>
  `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

export const createDefaultWorkspace = (): WorkspaceData => {
  const createdAt = now();
  const bookmarksPage: Page = {
    id: BOOKMARKS_PAGE_ID,
    name: 'Bookmarks',
    kind: 'bookmarks',
    createdAt,
    updatedAt: createdAt,
  };
  const notesPage: Page = {
    id: 'page-notes',
    name: 'Notes',
    kind: 'notes',
    createdAt,
    updatedAt: createdAt,
  };
  const introConversation: Conversation = {
    id: 'conversation-inbox',
    pageId: bookmarksPage.id,
    title: 'Inbox',
    summary: 'Drop links, notes, markdown, clips, and research here.',
    tags: ['inbox'],
    pinned: true,
    archived: false,
    createdAt,
    updatedAt: createdAt,
  };
  const introMessage: Message = {
    id: 'message-welcome',
    conversationId: introConversation.id,
    pageId: bookmarksPage.id,
    body: [
      '## Personal Slack Sidebar',
      '',
      'Use this side panel as a local workspace for conversations, markdown notes, saved links, and bookmark pages.',
      '',
      '- Paste links to save them automatically.',
      '- Paste YouTube links to capture a video bookmark with a thumbnail.',
      '- Add tags before posting to make search useful.',
      '- Back up or restore everything from Settings.',
    ].join('\n'),
    tags: ['welcome'],
    links: [],
    createdAt,
    updatedAt: createdAt,
  };

  return {
    schemaVersion: 1,
    pages: [bookmarksPage, notesPage],
    conversations: [introConversation],
    messages: [introMessage],
    bookmarks: [],
    driveSync: DEFAULT_DRIVE_SYNC_CONFIG,
    selectedPageId: bookmarksPage.id,
    selectedConversationId: introConversation.id,
    updatedAt: createdAt,
  };
};

export const normalizeWorkspace = (input: Partial<WorkspaceData>): WorkspaceData => {
  const fallback = createDefaultWorkspace();
  const pages = Array.isArray(input.pages) && input.pages.length > 0 ? input.pages : fallback.pages;
  const conversations =
    Array.isArray(input.conversations) && input.conversations.length > 0 ? input.conversations : fallback.conversations;
  const selectedPageId = pages.some((page) => page.id === input.selectedPageId)
    ? (input.selectedPageId || pages[0].id)
    : pages[0].id;
  const selectedConversationId = conversations.some((conversation) => conversation.id === input.selectedConversationId)
    ? (input.selectedConversationId || conversations[0].id)
    : conversations[0].id;

  return {
    schemaVersion: 1,
    pages,
    conversations,
    messages: Array.isArray(input.messages) ? input.messages : fallback.messages,
    bookmarks: Array.isArray(input.bookmarks) ? input.bookmarks : [],
    driveSync: {
      ...DEFAULT_DRIVE_SYNC_CONFIG,
      ...(input.driveSync || {}),
    },
    selectedPageId,
    selectedConversationId,
    updatedAt: input.updatedAt || new Date().toISOString(),
  };
};

export const getTagList = (value: string) =>
  value
    .split(',')
    .map((tag) => tag.trim().replace(/^#/, '').toLowerCase())
    .filter(Boolean)
    .filter((tag, index, tags) => tags.indexOf(tag) === index);

export const extractUrls = (text: string) => {
  const matches = text.match(/https?:\/\/[^\s<>)\]]+/gi) || [];
  return [...new Set(matches.map((url) => url.replace(/[.,!?;:]+$/, '')))];
};

export const getUrlHost = (url: string) => {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
};

export const readableTitleFromUrl = (url: string) => {
  try {
    const parsed = new URL(url);
    const lastSegment = parsed.pathname.split('/').filter(Boolean).pop();
    const decoded = decodeURIComponent(lastSegment || parsed.hostname);
    return decoded.replace(/[-_]+/g, ' ').replace(/\.\w+$/, '').trim() || parsed.hostname;
  } catch {
    return url;
  }
};

export const detectBookmarkKind = (url: string): BookmarkKind => {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, '');
    if (
      host.includes('youtube.com') ||
      host.includes('youtu.be') ||
      host.includes('vimeo.com') ||
      /\.(mp4|webm|mov|m4v)$/i.test(parsed.pathname)
    ) {
      return 'video';
    }
    if (/\.(pdf|md|txt)$/i.test(parsed.pathname)) return 'article';
    if (parsed.pathname.split('/').filter(Boolean).length >= 1) return 'article';
    return 'link';
  } catch {
    return 'link';
  }
};

export const getVideoThumbnail = (url: string) => {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('youtu.be')) {
      const id = parsed.pathname.split('/').filter(Boolean)[0];
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
    }
    if (parsed.hostname.includes('youtube.com')) {
      const id = parsed.searchParams.get('v');
      return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : undefined;
    }
    return undefined;
  } catch {
    return undefined;
  }
};

export const buildBookmark = (
  url: string,
  pageId: string,
  conversationId: string,
  messageId: string,
  tags: string[],
): Bookmark => {
  const kind = detectBookmarkKind(url);
  return {
    id: createId('bookmark'),
    pageId,
    conversationId,
    messageId,
    url,
    title: readableTitleFromUrl(url),
    host: getUrlHost(url),
    kind,
    thumbnailUrl: kind === 'video' ? getVideoThumbnail(url) : undefined,
    tags,
    createdAt: now(),
  };
};

export const createConversation = (pageId: string, title = 'New conversation'): Conversation => {
  const createdAt = now();
  return {
    id: createId('conversation'),
    pageId,
    title,
    summary: 'No messages yet.',
    tags: [],
    pinned: false,
    archived: false,
    createdAt,
    updatedAt: createdAt,
  };
};

export const createPage = (name: string): Page => {
  const createdAt = now();
  return {
    id: createId('page'),
    name,
    kind: 'project',
    createdAt,
    updatedAt: createdAt,
  };
};

export const addDraftToWorkspace = (workspace: WorkspaceData, conversationId: string, draft: DraftPayload) => {
  const timestamp = now();
  const links = extractUrls(draft.body);
  const message: Message = {
    id: createId('message'),
    conversationId,
    pageId: draft.pageId,
    body: draft.body,
    tags: draft.tags,
    links,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  const bookmarks = links.map((url) => buildBookmark(url, draft.pageId, conversationId, message.id, draft.tags));
  const title = draft.body
    .split('\n')
    .map((line) => line.replace(/^#+\s*/, '').trim())
    .find(Boolean);
  const summary = draft.body.replace(/\s+/g, ' ').slice(0, 140);

  return {
    ...workspace,
    messages: [...workspace.messages, message],
    bookmarks: [...workspace.bookmarks, ...bookmarks],
    conversations: workspace.conversations.map((conversation) =>
      conversation.id === conversationId
        ? {
            ...conversation,
            pageId: draft.pageId,
            title: conversation.title === 'New conversation' && title ? title.slice(0, 64) : conversation.title,
            summary,
            tags: [...new Set([...conversation.tags, ...draft.tags])],
            updatedAt: timestamp,
          }
        : conversation,
    ),
    pages: workspace.pages.map((page) => (page.id === draft.pageId ? { ...page, updatedAt: timestamp } : page)),
    selectedPageId: draft.pageId,
    updatedAt: timestamp,
  };
};
