import type { WorkspaceData } from './types';
import { exportWorkspaceJson, exportWorkspaceMarkdown, makeBackupFilename, makeMarkdownFilename } from './exports';

const DRIVE_CLIENT_PLACEHOLDER = 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com';

export const addChromeBookmark = async (url: string, title: string) => {
  if (typeof chrome === 'undefined' || !chrome.bookmarks?.create) return;

  const folderTitle = 'Personal Slack';
  const tree = await chrome.bookmarks.search({ title: folderTitle });
  const folder =
    tree.find((node) => !node.url && node.title === folderTitle) ||
    (await chrome.bookmarks.create({ title: folderTitle }));

  const existing = await chrome.bookmarks.search({ url });
  if (existing.some((node) => node.parentId === folder.id)) return;

  await chrome.bookmarks.create({
    parentId: folder.id,
    title,
    url,
  });
};

const getAuthToken = () =>
  new Promise<string>((resolve, reject) => {
    if (typeof chrome === 'undefined' || !chrome.identity?.getAuthToken) {
      reject(new Error('Chrome identity API is unavailable in this context.'));
      return;
    }

    const clientId = chrome.runtime.getManifest().oauth2?.client_id;
    if (!clientId || clientId === DRIVE_CLIENT_PLACEHOLDER) {
      reject(new Error('Configure a Google OAuth client ID in browser/wxt.config.ts before using Drive export.'));
      return;
    }

    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      const error = chrome.runtime.lastError;
      if (error || !token) {
        reject(new Error(error?.message || 'No Google auth token returned.'));
        return;
      }
      resolve(token);
    });
  });

const uploadDriveFile = async (token: string, filename: string, content: string, mimeType: string) => {
  const metadata = {
    name: filename,
    mimeType,
  };
  const boundary = `personal-slack-${Date.now()}`;
  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    `Content-Type: ${mimeType}`,
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Drive upload failed with status ${response.status}.`);
  }

  return (await response.json()) as { id: string; webViewLink?: string };
};

export const exportWorkspaceToDrive = async (workspace: WorkspaceData) => {
  const token = await getAuthToken();
  const jsonResult = await uploadDriveFile(
    token,
    makeBackupFilename(),
    exportWorkspaceJson(workspace),
    'application/json',
  );
  const markdownResult = await uploadDriveFile(
    token,
    makeMarkdownFilename(workspace),
    exportWorkspaceMarkdown(workspace),
    'text/markdown',
  );

  return { jsonResult, markdownResult };
};
