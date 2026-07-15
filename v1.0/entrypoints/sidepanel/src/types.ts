/**
 * TYPESCRIPT INTERFACES — Personal Slack v1.0 Data Model
 *
 * =====================================================================
 * WHY THIS FILE EXISTS
 * =====================================================================
 * All shared types are defined in one place to avoid circular imports
 * and to make the data model visible at a glance. The workspace is
 * serialized as a single JSON blob (see WorkspaceData), so every
 * field here maps directly to a persisted storage key.
 *
 * =====================================================================
 * DESIGN RATIONALE
 * =====================================================================
 * - IDs are string prefixed (e.g. "page-notes", "conversation-inbox")
 *   so they're human-readable in storage and debugging. Generated IDs
 *   use createId() in data.ts with a timestamp+random suffix.
 * - Dates are ISO 8601 strings for easy sorting by localeCompare.
 * - tags are always lowercase, deduplicated (see getTagList in data.ts).
 * - PageKind extends as new feature pages are added (e.g. 'melted-tabs').
 * - ViewMode controls which UI panel is visible — not a route.
 */

/** Distinguishes built-in page types from user-created project pages.
 *  'melted-tabs' was added in v1.0 for the /melt-tabs feature. */
export type PageKind = 'bookmarks' | 'notes' | 'project' | 'archive' | 'melted-tabs';

/** Classification for bookmarked links — used for visual display and grouping. */
export type BookmarkKind = 'article' | 'video' | 'link';

/**
 * A page is a top-level grouping container (like a Slack channel or a Notion page).
 * Pages hold conversations and bookmarks. The default workspace starts with
 * "Bookmarks", "Notes", and "Melted Tabs" pages.
 */
export interface Page {
  id: string;          // Unique, human-readable prefix (e.g. "page-notes")
  name: string;        // Display name
  kind: PageKind;      // Determines icon and behavior
  createdAt: string;   // ISO 8601
  updatedAt: string;   // ISO 8601
}

/**
 * A conversation is a thread of messages within a page.
 * Think of it as a Slack thread or a chat channel.
 * Conversations can be pinned (priority) or archived (hidden from default view).
 */
export interface Conversation {
  id: string;
  pageId: string;
  title: string;
  summary: string;     // First 140 chars of the last message
  tags: string[];
  pinned: boolean;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A message is a single post within a conversation.
 * Messages contain markdown body text, extracted URLs (links), and tags.
 * When a message is posted, any URLs in its body are automatically extracted
 * and saved as Bookmark entries (see addDraftToWorkspace in data.ts).
 */
export interface Message {
  id: string;
  conversationId: string;
  pageId: string;
  body: string;        // Markdown content
  tags: string[];
  links: string[];     // Auto-extracted URLs from body
  createdAt: string;
  updatedAt: string;
}

/**
 * A bookmark is a saved URL with metadata (title, host, type, thumbnail).
 * Bookmarks are auto-created when a message contains URLs.
 * The kind field (article/video/link) is determined by URL pattern matching.
 */
export interface Bookmark {
  id: string;
  pageId: string;
  conversationId: string;
  messageId: string;    // Links back to the source message
  url: string;
  title: string;
  host: string;
  kind: BookmarkKind;
  thumbnailUrl?: string; // Only for video bookmarks (YouTube thumbnails)
  tags: string[];
  createdAt: string;
}

/** Which folder structure strategy to use when syncing notes to Google Drive. */
export type DriveSyncFileStrategy = 'page-folders';

/**
 * Configuration for Google Drive notes sync.
 * The user can enable/disable sync and configure folder names in Settings.
 * lastSyncedAt and lastRootFolderId are updated after each successful sync.
 */
export interface DriveSyncConfig {
  enabled: boolean;
  rootFolderName: string;
  notesFolderName: string;
  fileStrategy: DriveSyncFileStrategy;
  lastSyncedAt?: string;
  lastRootFolderId?: string;
  lastNotesFolderId?: string;
}

/**
 * The complete workspace — stored as a single JSON blob in chrome.storage.local.
 *
 * WHY A SINGLE BLOB:
 *   trade-off. For a side panel with modest data (hundreds of messages),
 *   loading everything at once is fast and keeps state management simple.
 *   If data grows to thousands of messages, we'd migrate to per-collection
 *   storage keys.
 *
 * schemaVersion enables future data migrations (see normalizeWorkspace).
 */
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

/** Payload sent from the composer when posting a new message. */
export interface DraftPayload {
  body: string;
  pageId: string;
  tags: string[];
}

/** Capture mode for the capture button — determines how much metadata to extract. */
export type CaptureMode = 'full' | 'standard' | 'minimal';

/** Entry in the capture history dropdown. */
export interface CaptureHistoryEntry {
  id: string;
  title: string;
  url: string;
  host: string;
  favicon: string;
  mode: CaptureMode;
  timestamp: string; // ISO 8601
  markdown: string;
}

/** Data returned from capturing a tab. */
export interface TabCaptureData {
  title: string;
  url: string;
  host: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  selectedText: string;
  markdown: string;
  mode: CaptureMode;
  timestamp: string; // ISO 8601
}

/** Which view is active in the main panel. Controls routing-like UI switching. */
export type ViewMode = 'chat' | 'gallery' | 'bookmarks' | 'settings';
