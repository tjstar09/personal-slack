import type { Bookmark, Conversation, Message, Page, WorkspaceData } from './types';

const slug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 48) || 'personal-slack';

export const makeBackupFilename = () => `personal-slack-backup-${new Date().toISOString().slice(0, 10)}.json`;

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

const formatTags = (tags: string[]) => (tags.length ? ` ${tags.map((tag) => `#${tag}`).join(' ')}` : '');

const renderBookmark = (bookmark: Bookmark) =>
  `- [${bookmark.title}](${bookmark.url}) (${bookmark.kind}, ${bookmark.host})${formatTags(bookmark.tags)}`;

const renderMessage = (message: Message) => {
  const header = `#### ${new Date(message.createdAt).toLocaleString()}${formatTags(message.tags)}`;
  return `${header}\n\n${message.body}`;
};

const renderConversation = (conversation: Conversation, messages: Message[]) => {
  const body = messages.map(renderMessage).join('\n\n');
  return `## ${conversation.title}${formatTags(conversation.tags)}\n\n${conversation.summary}\n\n${body || '_No messages yet._'}`;
};

const renderPage = (page: Page, conversations: Conversation[], messages: Message[], bookmarks: Bookmark[]) => {
  const pageConversations = conversations.filter((conversation) => conversation.pageId === page.id);
  const pageBookmarks = bookmarks.filter((bookmark) => bookmark.pageId === page.id);
  const conversationMarkdown = pageConversations
    .map((conversation) =>
      renderConversation(
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

export const exportWorkspaceMarkdown = (workspace: WorkspaceData) => {
  const pages = workspace.pages.map((page) =>
    renderPage(page, workspace.conversations, workspace.messages, workspace.bookmarks),
  );

  return [`# Personal Slack Export`, '', `Exported: ${new Date().toLocaleString()}`, '', ...pages].join('\n\n');
};

export const makeMarkdownFilename = (workspace: WorkspaceData) => {
  const selectedPage = workspace.pages.find((page) => page.id === workspace.selectedPageId);
  return `${slug(selectedPage?.name || 'workspace')}-${new Date().toISOString().slice(0, 10)}.md`;
};
