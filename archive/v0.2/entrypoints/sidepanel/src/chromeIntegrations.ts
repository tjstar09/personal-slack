import type { DriveSyncConfig, WorkspaceData } from './types';
import {
  exportGeminiBookmarkPrompt,
  exportPageBookmarksMarkdown,
  exportPageConversationsMarkdown,
  exportWorkspaceJson,
  exportWorkspaceMarkdown,
  makeBackupFilename,
  makeGeminiPromptFilename,
  makeMarkdownFilename,
} from './exports';

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

const escapeDriveQueryValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const driveRequest = async <T>(token: string, url: string, init: RequestInit = {}) => {
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Drive request failed with status ${response.status}.`);
  }

  return (await response.json()) as T;
};

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  webViewLink?: string;
}

const listDriveFiles = async (token: string, q: string) => {
  const params = new URLSearchParams({
    q,
    spaces: 'drive',
    fields: 'files(id,name,mimeType,webViewLink)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const result = await driveRequest<{ files: DriveFile[] }>(
    token,
    `https://www.googleapis.com/drive/v3/files?${params.toString()}`,
  );
  return result.files || [];
};

const createDriveFolder = async (token: string, name: string, parentId?: string) =>
  driveRequest<DriveFile>(token, 'https://www.googleapis.com/drive/v3/files?supportsAllDrives=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json; charset=UTF-8',
    },
    body: JSON.stringify({
      name,
      mimeType: 'application/vnd.google-apps.folder',
      ...(parentId ? { parents: [parentId] } : {}),
    }),
  });

const ensureDriveFolder = async (token: string, name: string, parentId?: string) => {
  const folderMime = 'application/vnd.google-apps.folder';
  const parentQuery = parentId ? ` and '${parentId}' in parents` : '';
  const files = await listDriveFiles(
    token,
    `name='${escapeDriveQueryValue(name)}' and mimeType='${folderMime}' and trashed=false${parentQuery}`,
  );
  return files[0] || createDriveFolder(token, name, parentId);
};

const findDriveFile = async (token: string, name: string, parentId: string) => {
  const files = await listDriveFiles(
    token,
    `name='${escapeDriveQueryValue(name)}' and '${parentId}' in parents and trashed=false`,
  );
  return files[0];
};

const multipartBody = (metadata: Record<string, unknown>, content: string, mimeType: string) => {
  const boundary = `personal-slack-v2-${Date.now()}`;
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

  return { boundary, body };
};

const upsertDriveFile = async (
  token: string,
  filename: string,
  content: string,
  mimeType: string,
  parentId: string,
) => {
  const existing = await findDriveFile(token, filename, parentId);
  const metadata = existing ? { name: filename, mimeType } : { name: filename, mimeType, parents: [parentId] };
  const { boundary, body } = multipartBody(metadata, content, mimeType);
  const url = existing
    ? `https://www.googleapis.com/upload/drive/v3/files/${existing.id}?uploadType=multipart&supportsAllDrives=true`
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true';

  return driveRequest<DriveFile>(token, url, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
};

const safeFileName = (value: string) =>
  value
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'untitled';

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

  const geminiPromptResult = await uploadDriveFile(
    token,
    makeGeminiPromptFilename(),
    exportGeminiBookmarkPrompt(workspace),
    'text/markdown',
  );

  return { jsonResult, markdownResult, geminiPromptResult };
};

export const syncWorkspaceNotesToDrive = async (workspace: WorkspaceData, config: DriveSyncConfig) => {
  const token = await getAuthToken();
  const rootFolder = await ensureDriveFolder(token, config.rootFolderName);
  const notesFolder = await ensureDriveFolder(token, config.notesFolderName, rootFolder.id);
  const syncedFiles: DriveFile[] = [];

  await upsertDriveFile(
    token,
    'gemini-bookmark-sync-prompt.md',
    exportGeminiBookmarkPrompt(workspace),
    'text/markdown',
    notesFolder.id,
  );

  for (const page of workspace.pages) {
    const pageFolder = await ensureDriveFolder(token, safeFileName(page.name), notesFolder.id);
    const bookmarksFile = await upsertDriveFile(
      token,
      'bookmarks.md',
      exportPageBookmarksMarkdown(page, workspace.bookmarks),
      'text/markdown',
      pageFolder.id,
    );
    const conversationsFile = await upsertDriveFile(
      token,
      'conversation-history.md',
      exportPageConversationsMarkdown(page, workspace.conversations, workspace.messages),
      'text/markdown',
      pageFolder.id,
    );
    syncedFiles.push(bookmarksFile, conversationsFile);
  }

  return {
    rootFolderId: rootFolder.id,
    notesFolderId: notesFolder.id,
    syncedFiles,
    syncedAt: new Date().toISOString(),
  };
};
