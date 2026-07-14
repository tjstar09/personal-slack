export type PageKind = 'bookmarks' | 'notes' | 'project' | 'archive';

export type BookmarkKind = 'article' | 'video' | 'link';

export interface Page {
  id: string;
  name: string;
  kind: PageKind;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  pageId: string;
  title: string;
  summary: string;
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  pageId: string;
  body: string;
  tags: string[];
  links: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Bookmark {
  id: string;
  pageId: string;
  conversationId: string;
  messageId: string;
  url: string;
  title: string;
  host: string;
  kind: BookmarkKind;
  thumbnailUrl?: string;
  tags: string[];
  createdAt: string;
}

export type DriveSyncFileStrategy = 'page-folders';

export interface DriveSyncConfig {
  enabled: boolean;
  rootFolderName: string;
  notesFolderName: string;
  fileStrategy: DriveSyncFileStrategy;
  lastSyncedAt?: string;
  lastRootFolderId?: string;
  lastNotesFolderId?: string;
}

export interface WorkspaceData {
  schemaVersion: 1;
  pages: Page[];
  conversations: Conversation[];
  messages: Message[];
  bookmarks: Bookmark[];
  driveSync: DriveSyncConfig;
  selectedPageId: string;
  selectedConversationId: string;
  updatedAt: string;
}

export interface DraftPayload {
  body: string;
  pageId: string;
  tags: string[];
}

export type ViewMode = 'chat' | 'gallery' | 'bookmarks' | 'settings';
