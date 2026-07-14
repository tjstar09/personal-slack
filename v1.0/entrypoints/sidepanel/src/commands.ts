/**
 * SLASH COMMANDS — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Defines and executes slash commands entered in the composer.
 * Slash commands start with "/" and trigger special behaviors instead
 * of normal message posting.
 *
 * =====================================================================
 * DESIGN RATIONALE
 * =====================================================================
 * Commands are detected in App.tsx's postMessage() BEFORE the normal
 * send flow. This means:
 *   - The user still sees the composer and can cancel/edit
 *   - Commands that need async work (tab query, page capture) can run
 *     without blocking the UI
 *   - Results are placed back into the draft for review before posting
 *
 * WHY NOT a separate command input:
 *   Keeping commands in the same composer makes discovery easier (type
 *   "/" and you see the help). A separate input would require more UI
 *   and break the markdown-first workflow.
 *
 * =====================================================================
 * COMMANDS
 * =====================================================================
 * /melt-tabs        → Lists all tabs from all sessions, grouped by session
 * /melt-tabs <id>   → Lists tabs from a specific session ID only
 * /summarize        → Captures current tab, extracts key sentences
 * /todo             → Scans messages for checkbox patterns
 * /ask [q]          → Keyword search across message bodies
 */

export interface SlashCommand {
  name: string;
  description: string;
  usage: string;
}

export const SLASH_COMMANDS: SlashCommand[] = [
  { name: '/melt-tabs', description: 'List all open tabs as a dated markdown dump', usage: '/melt-tabs [sessionId]' },
  { name: '/summarize', description: 'Summarize the current page in bullet points', usage: '/summarize' },
  { name: '/ask', description: 'Search conversation history for an answer', usage: '/ask [query]' },
  { name: '/todo', description: 'Extract checkboxes from captured text', usage: '/todo' },
  { name: '/todos', description: 'Interactive checklist — click to toggle checkboxes', usage: '/todos' },
];

/**
 * Check if the given text starts with a known slash command.
 * Uses case-insensitive comparison for convenience.
 */
export const isSlashCommand = (text: string): boolean => {
  return SLASH_COMMANDS.some((cmd) => text.trim().toLowerCase().startsWith(cmd.name));
};

/**
 * Parse a slash command from text. Returns the command name and any
 * arguments after it (e.g. "/ask hello world" → { command: '/ask', args: 'hello world' })
 */
export const parseSlashCommand = (text: string): { command: string; args: string } | null => {
  const trimmed = text.trim();
  for (const cmd of SLASH_COMMANDS) {
    if (trimmed.toLowerCase().startsWith(cmd.name)) {
      const args = trimmed.slice(cmd.name.length).trim();
      return { command: cmd.name, args };
    }
  }
  return null;
};

export interface MeltTabsSession {
  id: number | undefined;
  urls: string[];
  titles: string[];
  focusedTabTitle: string | null;
  isActive: boolean;
}

export interface MeltTabsResult {
  body: string;
  tags: string[];
  sessions: MeltTabsSession[];
}

/**
 * Build a human-readable session description using the focused tab title.
 * Falls back to tab count and session type if no focused tab exists.
 *
 * Examples:
 *   Session 1 — 8 tabs — "Google - search query" (Active)
 *
 * WHY focused tab title:
 *   Users recognize their browser sessions by what's open in them, not by
 *   window IDs. The focused tab (the one the user is looking at) is the
 *   most recognizable identifier for a given session.
 */
function describeSession(window: chrome.windows.Window): string {
  const tabCount = window.tabs?.length ?? 0;
  const focusedTab = window.tabs?.find((t: chrome.tabs.Tab) => t.active && t.id !== chrome.tabs.TAB_ID_NONE);
  const titlePart = focusedTab?.title
    ? ` — "${focusedTab.title}"`
    : '';
  const typePart = window.focused ? ' (Active)' : '';
  return `Session ${window.id} — ${tabCount} tab${tabCount === 1 ? '' : 's'}${titlePart}${typePart}`;
}

/**
 * Execute /melt-tabs: query tabs and format them as a dated markdown list.
 *
 * BEHAVIOR BY MODE:
 *   Side panel mode: `currentWindow` refers to the browser window the side
 *     panel is attached to — this works correctly.
 *   Full-window popup mode: the popup IS its own window. `currentWindow`
 *     would only return the popup tab itself, which is useless.
 *
 * EXTENSION POPUP FILTER:
 *   Windows with type='popup' (the extension's full-window popup) are
 *   excluded from the output, since they only contain extension UI.
 *
 * SESSION AWARENESS:
 *   - No args (`/melt-tabs`): Lists tabs from ALL browser sessions, grouped
 *     with recognizable headers (focused tab title).
 *   - With sessionId (`/melt-tabs 42`): Lists tabs from that specific
 *     session only. Use `--all` to explicitly list all sessions.
 *
 * RESTORE FUNCTIONALITY:
 *   Each session header includes a `restore:` link that, when rendered
 *   by a custom ReactMarkdown component, opens all tabs from that session.
 *   The sessions array in the result provides structured data for this.
 *
 * WHY WE DON'T CLOSE TABS:
 *   The original implementation auto-closed tabs, which caused data loss
 *   when users accidentally triggered the command or didn't realize tabs
 *   would close. The safer UX is to LIST tabs for review, then let the
 *   user manually close them after confirming the dump was saved.
 *
 * The output is tagged ['melted-tab', YYYY-MM-DD] and auto-switches
 * the composer to the "Melted Tabs" page for posting.
 */
export const executeMeltTabs = async (args?: string): Promise<MeltTabsResult> => {
  const now = new Date();
  const dateStr = now.toISOString().slice(0, 10);

  // Parse optional sessionId argument
  const requestedSessionId = args && args !== '--all' ? parseInt(args, 10) : null;

  const lines: string[] = [
    `# Tab Dump — ${dateStr}`,
    '',
  ];

  const sessions: MeltTabsSession[] = [];
  let totalTabs = 0;

  if (requestedSessionId && !isNaN(requestedSessionId)) {
    // Melt tabs from a specific session
    const tabs = await chrome.tabs.query({ windowId: requestedSessionId });
    const windows = await chrome.windows.getAll({ populate: false });
    const foundWindow = windows.find((w) => w.id === requestedSessionId);
    const sessionLabel = foundWindow ? describeSession(foundWindow) : `Session ${requestedSessionId}`;

    lines.push(`Exported ${tabs.length} tabs from ${sessionLabel} at ${now.toLocaleTimeString()}.`);
    lines.push('');

    const urls: string[] = [];
    const titles: string[] = [];
    tabs.forEach((tab, index) => {
      if (tab.id === chrome.tabs.TAB_ID_NONE) return;
      const url = tab.url || 'about:blank';
      const title = tab.title || 'Untitled';
      urls.push(url);
      titles.push(title);
      lines.push(`${index + 1}. [${title}](${url})`);
    });
    totalTabs = tabs.length;
    if (foundWindow) {
      const focusedTab = foundWindow.tabs?.find((t: chrome.tabs.Tab) => t.active && t.id !== chrome.tabs.TAB_ID_NONE);
      sessions.push({
        id: foundWindow.id,
        urls,
        titles,
        focusedTabTitle: focusedTab?.title || null,
        isActive: foundWindow.focused || false,
      });
    }
  } else {
    // Melt tabs from all windows, filtering out extension popups
    const windows = await chrome.windows.getAll({ populate: true });
    const browserWindows = windows.filter((w: chrome.windows.Window) => w.type !== 'popup');

    lines.push(`Exported tabs across ${browserWindows.length} session${browserWindows.length === 1 ? '' : 's'} at ${now.toLocaleTimeString()}.`);
    lines.push('');
    lines.push('---');
    lines.push('');

    const focusedTab = windows.find((w) => w.focused && w.type !== 'popup')?.tabs?.find((t: chrome.tabs.Tab) => t.active);

    browserWindows.forEach((window) => {
      const windowTabs = window.tabs?.filter((t) => t.id !== chrome.tabs.TAB_ID_NONE) ?? [];
      if (windowTabs.length === 0) return;

      const sessionLabel = describeSession(window);
      const urls: string[] = [];
      const titles: string[] = [];

      // Build restore link: comma-separated URLs encoded in the link
      const restoreUrls = windowTabs.map((t) => encodeURIComponent(t.url || 'about:blank')).join(',');

      lines.push(`### ${sessionLabel}`);
      lines.push('');

      windowTabs.forEach((tab, tIndex) => {
        const url = tab.url || 'about:blank';
        const title = tab.title || 'Untitled';
        urls.push(url);
        titles.push(title);
        lines.push(`${tIndex + 1}. [${title}](${url})`);
      });

      // Add a restore link that the custom renderer will convert to a button
      const activeIndicator = window === windows.find(w => w.focused) && window.type !== 'popup' ? ' (Active)' : '';
      lines.push(`> [Restore Session](restore:${window.id}:${restoreUrls})${activeIndicator}`);

      sessions.push({
        id: window.id,
        urls,
        titles,
        focusedTabTitle: window.tabs?.find((t: chrome.tabs.Tab) => t.active && t.id !== chrome.tabs.TAB_ID_NONE)?.title || null,
        isActive: window.focused || false,
      });

      totalTabs += windowTabs.length;
      lines.push('');
    });

    lines.push('---');
    lines.push(`**Total: ${totalTabs} tabs across ${browserWindows.length} session${browserWindows.length === 1 ? '' : 's'}.**`);
    lines.push('');
  }

  lines.push('*Tabs listed for review. Click Send to save. No tabs were closed.*');

  return {
    body: lines.join('\n'),
    tags: ['melted-tab', dateStr],
    sessions,
  };
};