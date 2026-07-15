/**
 * TAB CAPTURE UTILITY — Personal Slack v1.0
 *
 * =====================================================================
 * PURPOSE
 * =====================================================================
 * Extracts rich content from the user's currently active browser tab and
 * formats it as markdown ready to be pasted into the Personal Slack composer.
 *
 * This is the "deep capture" path — used when the user clicks the "Capture"
 * button in the top bar. It produces richer output than the background
 * worker's inline capture (which only has title + URL available).
 *
 * Supports three capture modes:
 *   - Full (default): OG tags + meta desc + selected text + OG image + enhanced formatting
 *   - Standard: Title + URL + meta description + selected text
 *   - Minimal: Title + URL only
 *
 * =====================================================================
 * WHY chrome.scripting.executeScript
 * =====================================================================
 * The side panel is a separate extension page (chrome-extension:// URL).
 * It cannot directly access the DOM of the active tab.
 * chrome.scripting.executeScript injects a function into the target tab,
 * runs it in that tab's context, and returns the result.
 *
 * WHY NOT a persistent content script:
 *   A content script declared in manifest.json would run on every page
 *   load. This function is called only when the user clicks "Capture,"
 *   so injecting on-demand is more efficient and avoids potential
 *   conflicts with page JavaScript.
 *
 * =====================================================================
 * OUTERMOST TRY-CATCH
 * =====================================================================
 * The entire function (chrome.tabs.query + executeScript) is wrapped in a
 * try-catch. Inside, the executeScript call has its own try-catch.
 *
 * This two-level failure handling means:
 *   - If tabs query fails entirely (shouldn't happen) → return empty
 *   - If the active tab has no ID or URL → return empty (edge case)
 *   - If executeScript fails (CSP, restricted pages, chrome:// URLs) →
 *     continue with just title + URL (no OG data)
 *
 * The fallback markdown is always valid because buildCaptureMarkdown
 * handles empty metadata gracefully.
 */
import type { CaptureMode } from './types';

export interface TabCaptureData {
  title: string;
  url: string;
  host: string;
  metaDescription: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  selectedText: string;
  markdown: string;
  mode: CaptureMode;
  timestamp: string; // ISO 8601
}

// Track if script injection succeeded at module level for the first run
let scriptInjectionSucceeded = false;

export const captureTab = async (mode: CaptureMode = 'full'): Promise<TabCaptureData> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      // No active tab — could happen during shutdown or in a private window
      return {
        title: '', url: '', host: '', metaDescription: '',
        ogTitle: '', ogDescription: '', ogImage: '', selectedText: '', markdown: '',
        mode, timestamp: new Date().toISOString(),
      };
    }

    const url = tab.url;
    const host = extractHost(url);
    const title = tab.title || '';

    // Try to extract page metadata via injected script — this may fail on some sites
    // See: CSP restrictions, chrome:// URLs, certain extension pages.
    // When it fails, we still produce a basic markdown with title + URL.
    let metaDescription = '';
    let ogTitle = '';
    let ogDescription = '';
    let ogImage = '';
    let selectedText = '';

    try {
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: extractPageData,
      });
      const pageData = results[0]?.result;
      metaDescription = pageData?.metaDescription || '';
      ogTitle = pageData?.ogTitle || '';
      ogDescription = pageData?.ogDescription || '';
      ogImage = pageData?.ogImage || '';
      selectedText = pageData?.selectedText || '';
      scriptInjectionSucceeded = true;
    } catch {
      // Script injection failed (CSP, restricted page, etc.) — continue with basic data
      // This is a known and expected failure mode. See Issue #5 fix.
    }

    const markdown = buildCaptureMarkdown({
      title, url, host, metaDescription, ogTitle, ogDescription, ogImage, selectedText, markdown: '',
      mode, timestamp: new Date().toISOString(),
    });

    return { title, url, host, metaDescription, ogTitle, ogDescription, ogImage, selectedText, markdown, mode, timestamp: new Date().toISOString() };
  } catch {
    // Complete failure — return empty result. App.tsx handles this with an error message
    // outside this function to avoid coupling error UI with extraction logic.
    return {
      title: '', url: '', host: '', metaDescription: '',
      ogTitle: '', ogDescription: '', ogImage: '', selectedText: '', markdown: '',
      mode, timestamp: new Date().toISOString(),
    };
  }
};

/**
 * This function runs INSIDE the target tab's context. It reads the live DOM
 * to extract metadata that would otherwise be unavailable from outside.
 *
 * WHY QUERYSELECTOR for meta tags:
 *   Open Graph (og:title, og:description, og:image) and standard meta tags
 *   are the most reliable cross-site way to get structured page info.
 *   JSON-LD is more precise but far less consistently implemented.
 *
 * selectedText captures any user-highlighted text for context.
 */
function extractPageData() {
  const getMeta = (name: string): string => {
    const el =
      document.querySelector(`meta[name="${name}"]`) ||
      document.querySelector(`meta[property="og:${name}"]`) ||
      document.querySelector(`meta[property="${name}"]`);
    return (el as HTMLMetaElement)?.content || '';
  };

  return {
    metaDescription: getMeta('description') || getMeta('og:description'),
    ogTitle: getMeta('og:title'),
    ogDescription: getMeta('og:description'),
    ogImage: getMeta('og:image'),
    selectedText: window.getSelection()?.toString() || '',
  };
}

function extractHost(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return 'unknown';
  }
}

function buildCaptureMarkdown(data: TabCaptureData): string {
  const lines: string[] = [];

  // Mode badge emoji
  const modeEmoji = data.mode === 'full' ? '📸' : data.mode === 'standard' ? '📋' : '🔗';
  const modeLabel = data.mode.charAt(0).toUpperCase() + data.mode.slice(1);

  // Title with link + mode badge
  if (data.title) {
    lines.push(`${modeEmoji} **${modeLabel} Capture** · [${data.title}](${data.url}) · *${data.host}* · Captured ${formatRelativeTime(data.timestamp)}`);
  } else {
    lines.push(`${modeEmoji} **${modeLabel} Capture** · [${data.url}](${data.url}) · *${data.host}* · Captured ${formatRelativeTime(data.timestamp)}`);
  }

  lines.push('');
  lines.push('---');
  lines.push('');

  // Full mode: include OG image, OG title, description, selected text
  if (data.mode === 'full') {
    // OG image
    if (data.ogImage) {
      lines.push(`![](${data.ogImage})`);
      lines.push('');
    }

    // OG title (if different from page title)
    if (data.ogTitle && data.ogTitle !== data.title) {
      lines.push(`**${data.ogTitle}**`);
      lines.push('');
    }

    // Description — prefer OG over standard meta
    const description = data.ogDescription || data.metaDescription;
    if (description) {
      lines.push(`**Description**: ${description}`);
      lines.push('');
      lines.push('---');
      lines.push('');
    }

    // Selected text — formatted as a blockquote
    if (data.selectedText) {
      lines.push('> ' + data.selectedText.trim().replace(/\n/g, '\n> '));
      lines.push('');
      lines.push('---');
      lines.push('');
    }
  }

  // Standard mode: title + URL + meta description + selected text
  if (data.mode === 'standard') {
    const description = data.ogDescription || data.metaDescription;
    if (description) {
      lines.push(description);
      lines.push('');
    }
    if (data.selectedText) {
      lines.push('---');
      lines.push('');
      lines.push('> ' + data.selectedText.trim().replace(/\n/g, '\n> '));
      lines.push('');
    }
  }

  // Minimal mode: title + URL only (already rendered above)
  // Footer with ISO timestamp
  lines.push(`*Captured at ${data.timestamp} from ${data.host}*`);

  return lines.join('\n').trim();
}

function formatRelativeTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return `${diffSecs}s ago`;
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}
