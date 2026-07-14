/**
 * BACKGROUND SERVICE WORKER — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * This is the extension's non-persistent service worker (Manifest V3).
 * It runs in the background and handles:
 *
 *   1. Side panel configuration — ensures the side panel opens when the
 *      extension toolbar icon is clicked.
 *   2. Context menu creation — adds "Send to Personal Slack" to page,
 *      selection, link, and image right-click contexts.
 *   3. Capture relay — when a context menu item or keyboard shortcut is
 *      used, this worker formats a markdown body and tries to send it to
 *      the side panel UI via chrome.runtime.sendMessage(). If the side
 *      panel is closed, it falls back to writing directly to storage.
 *
 * =====================================================================
 * WHY A BACKGROUND WORKER
 * =====================================================================
 * Manifest V3 requires non-persistent service workers instead of persistent
 * background pages. This worker:
 *   - Wakes up on install, startup, context menu clicks, and commands
 *   - Has no DOM access (cannot read page content directly)
 *   - Communicates with the side panel via message passing
 *   - Uses chrome.storage.local as the shared data layer
 *
 * =====================================================================
 * INTERACTION WITH OTHER FILES
 * =====================================================================
 *   data.ts       → addDraftToWorkspace, normalizeWorkspace, createDefaultWorkspace
 *   captureTab.ts → Skip — captureTab runs in side panel, not background
 *   App.tsx       → Receives 'capture-tab' messages via chrome.runtime.onMessage
 *
 * =====================================================================
 * IMPORTANT — Import Path
 * =====================================================================
 * The import from './sidepanel/src/data' works because WXT resolves
 * entrypoint-relative paths. The background.ts and sidepanel/ are sibling
 * entrypoints under entrypoints/.
 */
import {
  addDraftToWorkspace,
  BOOKMARKS_PAGE_ID,
  createDefaultWorkspace,
  normalizeWorkspace,
  STORAGE_KEY,
} from './sidepanel/src/data';

export default defineBackground(() => {
  // --- Side panel behavior ---
  // Uses the sidePanel API to auto-open when the extension icon is clicked.
  // Without this, the user would need to manually open the side panel each time.
  const configureSidePanel = () => {
    if (!chrome.sidePanel?.setPanelBehavior) return;
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.warn('Unable to configure side panel behavior', error));
  };

  chrome.runtime.onInstalled.addListener(configureSidePanel);
  chrome.runtime.onStartup.addListener(configureSidePanel);
  configureSidePanel();

  // --- Context menu for capture ---
  // Registers the right-click menu item on install. Uses removeAll first to
  // prevent duplicate entries on extension reload.
  chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.removeAll();
    chrome.contextMenus.create({
      id: 'send-to-personal-slack',
      title: 'Send to Personal Slack',
      contexts: ['page', 'selection', 'link', 'image'],
    });
  });

  /**
   * Auto-post a captured body to the workspace when the side panel is closed.
   * This function loads the workspace from chrome.storage.local, adds the
   * capture as a new message in the Bookmarks/Inbox conversation, and saves.
   *
   * WHY THIS PATTERN:
   *   When the side panel is open, captures go to the composer for review.
   *   When closed, we don't want to lose the capture entirely. Direct write
   *   is safer than a "pending" storage approach since the user can set the
   *   side panel to never open.
   */
  const autoPostCapture = (body: string) => {
    chrome.storage.local.get(STORAGE_KEY, (result) => {
      const raw = result[STORAGE_KEY];
      const workspace = raw ? normalizeWorkspace(raw as Parameters<typeof normalizeWorkspace>[0]) : createDefaultWorkspace();
      const inbox = workspace.conversations.find((c) => c.pageId === BOOKMARKS_PAGE_ID);
      if (!inbox) return;
      const nextWorkspace = addDraftToWorkspace(workspace, inbox.id, {
        body,
        tags: ['capture'],
        pageId: BOOKMARKS_PAGE_ID,
      });
      chrome.storage.local.set({ [STORAGE_KEY]: nextWorkspace });
    });
  };

  // --- Context menu click handler ---
  // Determines what was right-clicked (page, selection, link, image) and
  // builds an appropriate markdown body, then attempts relay to the side panel.
  chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== 'send-to-personal-slack') return;

    let url = '';
    let text = '';

    // Determine the URL and text based on what was right-clicked
    if (info.linkUrl) {
      // Right-clicked a link → capture the link URL itself, not the page
      url = info.linkUrl;
      text = info.selectionText || url;
    } else if (info.srcUrl) {
      // Right-clicked an image/media element
      url = info.srcUrl;
      text = info.selectionText || url;
    } else if (info.selectionText) {
      // Right-clicked with text selected
      url = tab?.url || info.pageUrl || '';
      text = info.selectionText;
    } else {
      // Right-clicked on the page with no selection
      url = tab?.url || info.pageUrl || '';
      text = info.selectionText || '';
    }

    const body = buildQuickCaptureBody(tab?.title || '', url, text);

    // Try sending to side panel if open — fills composer for review
    chrome.runtime
      .sendMessage({ type: 'capture-tab', data: { body, tags: ['capture'] } })
      .catch(() => {
        // Side panel not open — auto-post directly to workspace
        autoPostCapture(body);
      });
  });

  // --- Keyboard shortcut handler ---
  // Ctrl+Shift+S / Cmd+Shift+S captures the active tab.
  // Same relay logic as the context menu: side panel open → composer,
  // side panel closed → auto-post.
  chrome.commands.onCommand.addListener((command) => {
    if (command !== 'capture-tab') return;

    chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
      if (!tab?.id || !tab.url) return;
      const body = buildQuickCaptureBody(tab.title || '', tab.url, '');

      chrome.runtime
        .sendMessage({ type: 'capture-tab', data: { body, tags: ['capture'] } })
        .catch(() => {
          autoPostCapture(body);
        });
    });
  });
});

/**
 * Build a quick markdown body from a tab's title, URL, and optional selected text.
 * This is used for the "fast capture" path (context menu, keyboard shortcut).
 * The full capture path (captureTab.ts) does a richer extraction with OG tags.
 *
 * WHY A SEPARATE FUNCTION:
 *   The background worker cannot call captureTab() because it has no DOM access.
 *   This inline formatter provides a solid fallback with just the data points
 *   available to the worker (title, URL from chrome.tabs).
 */
function buildQuickCaptureBody(title: string, url: string, selectedText: string): string {
  const lines: string[] = [];
  lines.push(`## [${title || url}](${url})`);
  lines.push('');
  lines.push(`**Source**: ${extractHost(url)}`);
  lines.push('');

  if (selectedText) {
    lines.push('---');
    lines.push('');
    lines.push('> ' + selectedText.trim().replace(/\n/g, '\n> '));
    lines.push('');
  }

  return lines.join('\n').trim();
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}