/**
 * EXPORT UTILITIES — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Generates markdown and JSON representations of workspace data for:
 *   - Personal backup (JSON download)
 *   - Gemini prompt generation (markdown with instructions for Gemini AI)
 *   - Google Drive upload (JSON + MD + Gemini prompt)
 *   - Per-page markdown export
 *
 * All exports are pure functions — they take data and return strings.
 * The actual download/upload happens elsewhere (App.tsx calls downloadText(),
 * chromeIntegrations.ts handles Drive uploads via fetch()).
 *
 * =====================================================================
 * WHY SEPARATE FILE
 * =====================================================================
 * Export logic is purely functional and stateless, so it's isolated here
 * to keep App.tsx manageable. Adding a new export format only requires
 * a new function here and a button in SettingsView.
 */

import type { Bookmark, Conversation, DriveSyncConfig, Message, Page, WorkspaceData } from './types';

// Slugify for filenames: lowercase, hyphenated, max 48 chars.
// This ensures filesystem-safe names from human-readable page names.
const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'personal-slack';

// ISO-date filename so multiple exports don't overwrite each other
export const makeBackupFilename = () => `personal-slack-backup-${new Date().toISOString().slice(0, 10)}.json`;
export const makeGeminiPromptFilename = () =>
  `personal-slack-gemini-bookmark-sync-${new Date().toISOString().slice(0, 10)}.md`;
export const makeMarkdownFilename = (workspace: WorkspaceData) => {
  const selectedPage = workspace.pages.find((page) => page.id === workspace.selectedPageId);
  return `${slug(selectedPage?.name || 'workspace')}-${new Date().toISOString().slice(0, 10)}.md`;
};

/**
 * Trigger a browser download of a text blob. Uses Blob + object URL so
 * all processing stays client-side — no server upload needed for exports.
 */
export const downloadText = (filename: string, content: string, type = 'application/json') => {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
};

export const exportWorkspaceJson = (workspace: WorkspaceData) =>
  JSON.stringify({ ...workspace, exportedAt: new Date().toISOString() }, null, 2);

// Shared helper: format tags as "#tag1 #tag2" or empty string
const formatTags = (tags: string[]) => (tags.length ? ` ${tags.map((tag) => `#${tag}`).join(' ')}` : '');

// Render a single bookmark as a markdown list item with URL, kind, host, tags
const renderBookmark = (bookmark: Bookmark) =>
  `- [${bookmark.title}](${bookmark.url}) (${bookmark.kind}, ${bookmark.host})${formatTags(bookmark.tags)}`;

// Render a single message with timestamp header and markdown body
const renderMessage = (message: Message) => {
  const header = `#### ${new Date(message.createdAt).toLocaleString()}${formatTags(message.tags)}`;
  return `${header}\n\n${message.body}`;
};

/**
 * Render a single conversation's markdown: title, summary, all messages.
 * Used by both per-page export and full workspace export.
 */
export const renderConversationMarkdown = (conversation: Conversation, messages: Message[]) => {
  const body = messages.map(renderMessage).join('\n\n');
  return `## ${conversation.title}${formatTags(conversation.tags)}\n\n${conversation.summary}\n\n${body || '_No messages yet._'}`;
};

// Per-page bookmarks list
export const exportPageBookmarksMarkdown = (page: Page, bookmarks: Bookmark[]) => {
  const pageBookmarks = bookmarks.filter((bookmark) => bookmark.pageId === page.id);
  return [
    `# ${page.name} Bookmarks`,
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    pageBookmarks.length ? pageBookmarks.map(renderBookmark).join('\n') : '_No bookmarks yet._',
  ].join('\n');
};

// Per-page conversation history
export const exportPageConversationsMarkdown = (page: Page, conversations: Conversation[], messages: Message[]) => {
  const pageConversations = conversations.filter((conversation) => conversation.pageId === page.id);
  const conversationMarkdown = pageConversations
    .map((conversation) =>
      renderConversationMarkdown(
        conversation,
        messages.filter((message) => message.conversationId === conversation.id),
      ),
    )
    .join('\n\n---\n\n');

  return [
    `# ${page.name} Conversation History`,
    '',
    `Generated: ${new Date().toLocaleString()}`,
    '',
    conversationMarkdown || '_No conversations yet._',
  ].join('\n');
};

// Combined per-page export (bookmarks + conversations together)
export const exportPageMarkdown = (
  page: Page,
  conversations: Conversation[],
  messages: Message[],
  bookmarks: Bookmark[],
) => {
  const pageConversations = conversations.filter((conversation) => conversation.pageId === page.id);
  const pageBookmarks = bookmarks.filter((bookmark) => bookmark.pageId === page.id);
  const conversationMarkdown = pageConversations
    .map((conversation) =>
      renderConversationMarkdown(
        conversation,
        messages.filter((message) => message.conversationId === conversation.id),
      ),
    )
    .join('\n\n---\n\n');

  return [
    `# ${page.name}`,
    '',
    pageBookmarks.length ? `## Bookmarks\n\n${pageBookmarks.map(renderBookmark).join('\n')}` : '## Bookmarks\n\n_No bookmarks yet._',
    '',
    conversationMarkdown || '## Conversations\n\n_No conversations yet._',
  ].join('\n');
};

// Full workspace export — every page, bookmarks, conversations, messages
export const exportWorkspaceMarkdown = (workspace: WorkspaceData) => {
  const pages = workspace.pages.map((page) =>
    exportPageMarkdown(page, workspace.conversations, workspace.messages, workspace.bookmarks),
  );

  return [`# Personal Slack Export`, '', `Exported: ${new Date().toLocaleString()}`, '', ...pages].join('\n\n');
};

/**
 * RENDER FOLDER STRUCTURE HELPER
 * Shows the user what Drive folder structure will be created during sync.
 * Uses current workspace.driveSync config for folder names.
 */
const renderFolderStructure = (workspace: WorkspaceData, config?: DriveSyncConfig) => {
  const rootName = config?.rootFolderName || workspace.driveSync.rootFolderName;
  const notesName = config?.notesFolderName || workspace.driveSync.notesFolderName;
  const lines = [`- ${rootName}/`, `  - ${notesName}/`];

  workspace.pages.forEach((page) => {
    const pageBookmarks = workspace.bookmarks.filter((bookmark) => bookmark.pageId === page.id);
    const pageConversations = workspace.conversations.filter((conversation) => conversation.pageId === page.id);
    lines.push(`    - ${page.name}/`);
    lines.push(`      - bookmarks.md (${pageBookmarks.length} bookmarks)`);
    lines.push(`      - conversation-history.md (${pageConversations.length} conversations)`);
  });

  return lines.join('\n');
};

/**
 * Copy the markdown representation of the current page to the clipboard.
 * Relies on navigator.clipboard.writeText which works in MV3 service workers
 * and side panels via the `clipboardWrite` permission (already implied by
 * `clipboard-write` in Chrome, no explicit permission needed for user gesture).
 */
export const copyPageMarkdown = async (
  page: Page,
  conversations: Conversation[],
  messages: Message[],
  bookmarks: Bookmark[],
  showStatus?: (msg: string) => void,
) => {
  const md = exportPageMarkdown(page, conversations, messages, bookmarks);
  try {
    await navigator.clipboard.writeText(md);
    showStatus?.('Page copied as Markdown.');
  } catch {
    showStatus?.('Clipboard write failed.');
  }
};

export const copyWorkspaceMarkdown = async (workspace: WorkspaceData, showStatus?: (msg: string) => void) => {
  const md = exportWorkspaceMarkdown(workspace);
  try {
    await navigator.clipboard.writeText(md);
    showStatus?.('Workspace copied as Markdown.');
  } catch {
    showStatus?.('Clipboard write failed.');
  }
};

export const exportGeminiBookmarkPrompt = (workspace: WorkspaceData) => {
  const exported = new Date().toLocaleString();

  return [
    '# Gemini Prompt: Personal Slack Bookmark Sync',
    '',
    'You are updating a Google Notes or Google Drive notes workspace from a Personal Slack Sidebar export.',
    '',
    '## Task',
    '',
    'Create missing bookmark notes and update existing bookmark notes using the folder structure below. Preserve page names, folder names, bookmark URLs, tags, source conversations, and message context. If a bookmark already exists, update the existing note instead of creating a duplicate. Do not invent URLs, titles, tags, or summaries.',
    '',
    '## Required Output Format',
    '',
    '- Return markdown only.',
    '- Group output by page folder.',
    '- For every bookmark, include title, URL, kind, host, tags, source conversation title, source message date, and useful surrounding context.',
    '- Include a short change log with created, updated, unchanged, and skipped items.',
    '- Keep the same folder structure so another app can sync it directly.',
    '',
    '## Target Folder Structure',
    '',
    renderFolderStructure(workspace),
    '',
    '## Sync Rules',
    '',
    '- Root folder is the Personal Slack Drive sync root.',
    '- Each Personal Slack page maps to one folder.',
    '- Each page folder contains `bookmarks.md` and `conversation-history.md`.',
    '- Bookmarks page is the default destination for uncategorized links.',
    '- Video bookmarks should keep thumbnails when they are present in the export.',
    '- Article bookmarks should keep the original URL and source message context.',
    '',
    `## Exported At`,
    '',
    exported,
    '',
    '## Complete Personal Slack Export',
    '',
    exportWorkspaceMarkdown(workspace),
  ].join('\n');
};