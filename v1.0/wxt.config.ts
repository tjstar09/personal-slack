/**
 * WXT Configuration — Personal Slack v1.0
 *
 * =====================================================================
 * WHY WXT
 * =====================================================================
 * WXT (https://wxt.dev) abstracts away Chrome/Firefox Manifest V3 boilerplate.
 * It handles:
 *   - TypeScript compilation + bundling (Vite under the hood)
 *   - Manifest generation from this config
 *   - HMR in dev mode (`npm run dev`)
 *   - Type generation for chrome.* APIs (`.wxt/types/`)
 * Instead of writing raw manifest.json + webpack/rollup config, we get a
 * single typed TypeScript config file.
 *
 * =====================================================================
 * PERMISSION RATIONALE
 * =====================================================================
 * Each permission is needed for a specific feature:
 *
 *   bookmarks     → Creating Chrome bookmarks in a "Personal Slack" folder
 *                    when links are posted (see chromeIntegrations.ts)
 *   identity      → OAuth 2.0 for Google Drive (chrome.identity.getAuthToken)
 *   sidePanel     → Mandatory for Chrome side panel extension (the main UI)
 *   storage       → Persisting workspace data locally (chrome.storage.local)
 *   activeTab     → One-time host permission grant when user clicks capture
 *   scripting     → Injecting extractPageData() into active tab for metadata
 *   contextMenus  → Right-click "Send to Personal Slack" on pages/links/images
 *   tabs          → Required by /melt-tabs to read all tab titles & URLs.
 *                    Without this, chrome.tabs.query() returns 'Untitled' for
 *                    all non-active tabs. The activeTab permission only grants
 *                    access to the currently focused tab.
 *
 * host_permissions → Required for Google Drive API fetch() calls
 *
 * =====================================================================
 * OAuth2 — Google Drive
 * =====================================================================
 * The placeholder client_id MUST be replaced with a real Google Cloud OAuth
 * client ID before Drive export will work. Steps:
 *   1. Create a Google Cloud project → OAuth 2.0 Client ID (Chrome Extension)
 *   2. Add the extension ID (from chrome://extensions after loading unpacked)
 *   3. Replace the placeholder below
 *   4. Rebuild
 *
 * The placeholder is intentionally verbose ("REPLACE_WITH_...") so it's
 * impossible to miss during setup.
 *
 * =====================================================================
 * KEYBOARD SHORTCUT
 * =====================================================================
 * "capture-tab" (Ctrl+Shift+S / Cmd+Shift+S) triggers the capture flow:
 *   - Background listener calls chrome.tabs.query → formats title+URL as
 *     markdown → relays to side panel via chrome.runtime.sendMessage
 *   - If side panel is closed, auto-posts to Bookmarks/Inbox directly
 *   - See background.ts + captureTab.ts
 */
import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Personal Slack Sidebar v1.0',
    short_name: 'Personal Slack v1.0',
    description:
      'A local Slack-style Chrome side panel with capture tab, AI teammate, tab melting, canvas, and Drive notes sync.',
    version: '1.0.0',
    minimum_chrome_version: '149',
    permissions: [
      'bookmarks',
      'identity',
      'sidePanel',
      'storage',
      'activeTab',
      'scripting',
      'contextMenus',
      'tabs',
    ],
    host_permissions: ['https://www.googleapis.com/*'],
    action: {
      default_title: 'Open Personal Slack v1.0',
    },
    oauth2: {
      client_id: 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    },
    commands: {
      'capture-tab': {
        suggested_key: {
          default: 'Ctrl+Shift+S',
          mac: 'Command+Shift+S',
        },
        description: 'Capture current tab and send to Personal Slack',
      },
    },
  },
});