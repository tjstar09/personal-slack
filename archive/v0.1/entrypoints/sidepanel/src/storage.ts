import { createDefaultWorkspace, normalizeWorkspace, STORAGE_KEY } from './data';
import type { WorkspaceData } from './types';

const hasChromeStorage = () => typeof chrome !== 'undefined' && Boolean(chrome.storage?.local);

export const loadWorkspace = async (): Promise<WorkspaceData> => {
  if (!hasChromeStorage()) {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeWorkspace(JSON.parse(raw)) : createDefaultWorkspace();
  }

  const result = await chrome.storage.local.get(STORAGE_KEY);
  return result[STORAGE_KEY] ? normalizeWorkspace(result[STORAGE_KEY] as WorkspaceData) : createDefaultWorkspace();
};

export const saveWorkspace = async (workspace: WorkspaceData) => {
  if (!hasChromeStorage()) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(workspace));
    return;
  }

  await chrome.storage.local.set({ [STORAGE_KEY]: workspace });
};
