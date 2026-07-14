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
}

// Track if script injection succeeded at module level for the first run
let scriptInjectionSucceeded = false;

export const captureTab = async (): Promise<TabCaptureData> => {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id || !tab.url) {
      // No active tab — could happen during shutdown or in a private window
      return {
        title: '', url: '', host: '', metaDescription: '',
        ogTitle: '', ogDescription: '', ogImage: '', selectedText: '', markdown: '',
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
    });

    return { title, url, host, metaDescription, ogTitle, ogDescription, ogImage, selectedText, markdown };
  } catch {
    // Complete failure — return empty result. App.tsx handles this with an error message
    // outside this function to avoid coupling error UI with extraction logic.
    return {
      title: '', url: '', host: '', metaDescription: '',
      ogTitle: '', ogDescription: '', ogImage: '', selectedText: '', markdown: '',
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

  // Title with link
  if (data.title) {
    lines.push(`## [${data.title}](${data.url})`);
  } else {
    lines.push(`## [${data.url}](${data.url})`);
  }

  lines.push('');
  lines.push(`**Source**: ${data.host}`);
  lines.push('');

  // OG image
  if (data.ogImage) {
    lines.push(`![](${data.ogImage})`);
    lines.push('');
  }

  // OG title (if different from page title)
  // This handles cases where og:title is the original article title
  // while the visible page title has been modified with site branding.
  if (data.ogTitle && data.ogTitle !== data.title) {
    lines.push(`**${data.ogTitle}**`);
    lines.push('');
  }

  // Description — prefer OG over standard meta
  const description = data.ogDescription || data.metaDescription;
  if (description) {
    lines.push(description);
    lines.push('');
  }

  // Selected text — formatted as a blockquote
  if (data.selectedText) {
    lines.push('---');
    lines.push('');
    lines.push('> ' + data.selectedText.trim().replace(/\n/g, '\n> '));
    lines.push('');
  }

  return lines.join('\n').trim();
}