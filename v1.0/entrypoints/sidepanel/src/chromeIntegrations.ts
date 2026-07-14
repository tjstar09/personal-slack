/**
 * CHROME INTEGRATIONS — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Bridges the extension to two external Chrome services:
 *   1. chrome.bookmarks — saving links to a Chrome-native "Personal Slack" folder
 *   2. Google Drive REST API — uploading files and syncing per-page folder structures
 *
 * =====================================================================
 * DESIGN RATIONALE
 * =====================================================================
 * Why keep these together? Both are "external" integrations (outside
 * chrome.storage.local). They share a common concern: authentication,
 * network requests, and error handling. One file means one place to
 * debug when OAuth or upload issues arise.
 *
 * Why not in the main App component?
 *   Side effects (network calls, bookmark creation) are isolated so
 *   App.tsx stays focused on UI state. chromeIntegrations is a service
 *   layer: given data, performs action.
 *
 * =====================================================================
 * GOOGLE DRIVE — TWO FLOWS
 * =====================================================================
 * exportWorkspaceToDrive() — One-shot upload of 3 files:
 *   personal-slack-backup-YYYY-MM-DD.json
 *   workspace-slug-YYYY-MM-DD.md
 *   personal-slack-gemini-bookmark-sync-YYYY-MM-DD.md
 *
 * syncWorkspaceNotesToDrive() — Per-page folder structure:
 *   Root folder/
 *   └── Notes Sync/
 *       ├── page-name/
 *       │   ├── bookmarks.md (updated each sync)
 *       │   └── conversation-history.md (updated each sync)
 *
 * =====================================================================
 * DRIVE AUTH FLOW
 * =====================================================================
 * Uses chrome.identity.getAuthToken with the OAuth2 client_id from
 * wxt.config.ts. The token is fetched interactively on first use.
 * If client_id is still the placeholder, the function rejects immediately.
 *
 * =====================================================================
 * FALLBACK / EDGE CASES
 * =====================================================================
 * When addChromeBookmark is called:
 *   - Checks if bookmark already exists (by URL in "Personal Slack" folder)
 *   - Creates the folder if it doesn't exist
 *   - Skips duplicate creation if the URL is already bookmarked
 *
 * When Drive upload fails:
 *   - Throws with the API response text for debugging
 *   - App.tsx catches and surfaces a "needs setup" message to user
 */

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

/**
 * Create a Chrome bookmark in the "Personal Slack" folder.
 * Avoids duplicates by checking URL before creating.
 */
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

/**
 * Acquire a Google OAuth token via chrome.identity.
 * Rejects immediately if the client_id in wxt.config.ts is still the placeholder.
 */
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

/**
 * Upload a file to Google Drive using multipart/related.
 * Returns the Drive file object with id and webViewLink.
 */
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

/** Escape single quotes for Drive search query strings */
const escapeDriveQueryValue = (value: string) => value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

/**
 * Authenticated fetch wrapper for Drive API calls.
 * Automatically injects the Bearer token.
 */
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

/** Search Drive files matching a query. Returns normalized fields. */
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

/** Create a Drive folder, returns the created file. */
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

/**
 * Find or create a Drive folder by name under an optional parent.
 * If parentId is provided, searches within that parent only.
 */
const ensureDriveFolder = async (token: string, name: string, parentId?: string) => {
  const folderMime = 'application/vnd.google-apps.folder';
  const parentQuery = parentId ? ` and '${parentId}' in parents` : '';
  const files = await listDriveFiles(
    token,
    `name='${escapeDriveQueryValue(name)}' and mimeType='${folderMime}' and trashed=false${parentQuery}`,
  );
  return files[0] || createDriveFolder(token, name, parentId);
};

/** Find a single file by name in a parent folder. */
const findDriveFile = async (token: string, name: string, parentId: string) => {
  const files = await listDriveFiles(
    token,
    `name='${escapeDriveQueryValue(name)}' and '${parentId}' in parents and trashed=false`,
  );
  return files[0];
};

/**
 * Build multipart request body for Drive file upsert.
 * Reusable because both POST (new file) and PATCH (update) use multipart.
 */
const multipartBody = (metadata: Record<string, unknown>, content: string, mimeType: string) => {
  const boundary = `personal-slack-v1.0-${Date.now()}`;
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

/**
 * Upload or update a file in Drive. If the file exists (by name in parent),
 * PATCH it. Otherwise POST a new file.
 */
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
    : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';

  return driveRequest<DriveFile>(token, url, {
    method: existing ? 'PATCH' : 'POST',
    headers: {
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });
};

/** Filesystem-safe filename: strip illegal chars, truncate */
const safeFileName = (value: string) =>
  value
    .replace(/[<>:"/\\|?*]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'untitled';

/**
 * Export workspace to Drive — one-shot upload of 3 files.
 * Uploads: backup JSON, markdown, and Gemini prompt.
 */
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

/**
 * Sync notes folder structure to Drive — per-page folders.
 * Creates or reuses:
 *   rootFolder/ → notesFolder/ → page-name/ → {bookmarks.md, conversation-history.md}
 *
 * The final result includes ids and timestamps for UI feedback.
 */
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