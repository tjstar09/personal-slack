/**
 * STORAGE ABSTRACTION — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Provides loadWorkspace() and saveWorkspace() as a thin wrapper around
 * chrome.storage.local. This abstraction exists so the rest of the codebase
 * never calls chrome.storage.local directly — making future migration
 * (e.g. to a different storage backend or separate keys) easier.
 *
 * =====================================================================
 * FALLBACK TO localStorage
 * =====================================================================
 * In development or testing environments where chrome.storage.local may
 * not be available, we fall back to the browser's localStorage. This
 * ensures the app still works in non-extension contexts.
 *
 * =====================================================================
 * NORMALIZATION
 * =====================================================================
 * Both load paths pass the raw data through normalizeWorkspace() from
 * data.ts. This handles:
 *   - Schema migrations (when schemaVersion increments)
 *   - Missing or empty arrays (fills with defaults)
 *   - Missing page/conversation IDs (selects first available)
 * See normalizeWorkspace in data.ts for the migration logic.
 */
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