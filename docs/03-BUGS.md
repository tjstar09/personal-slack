# Bug History & Pitfalls — v1.0

All known bugs, their fixes, and how to avoid repeating them.

---

## Applied Fixes

### Issue 1 — Status overlap + persistence
- **Symptom**: Status messages overlapped the Send button and never disappeared.
- **Cause**: `setStatus()` without auto-clear. 30+ scattered calls across slash commands.
- **Fix**: Centralized through `showStatus()` callback. Status positioned bottom-left. Auto-fade: `statusFadeIn` (0.2s) + `statusFadeOut` (0.4s, starts at 4.6s). Messages gone after 5s.
- **Avoid**: Always use `showStatus()` — never call `setStatus()` directly.

### Issue 2 — Context menu auto-post when panel closed
- **Symptom**: Captures lost when side panel was closed.
- **Cause**: `chrome.runtime.sendMessage` throws when no receiver exists.
- **Fix**: Try `sendMessage` first; on failure, import `addDraftToWorkspace` and auto-post to Bookmarks/Inbox with `capture` tag.
- **Avoid**: Always provide a fallback path for when the side panel is closed.

### Issue 3 — /melt-tabs closes Chrome windows
- **Symptom**: `/melt-tabs` closed all tabs including extension popup windows.
- **Cause**: Tab-closing logic was too aggressive.
- **Fix**: Removed all tab-closing logic. Now only generates a dump for review. Tags: `['melted-tab', dateStr]`.
- **Avoid**: Never close tabs without explicit user confirmation. List instead.

### Issue 3b — Melted Tabs page missing
- **Symptom**: `/melt-tabs` output had no dedicated home.
- **Fix**: Added `PageKind: 'melted-tabs'` to types. Default workspace includes a Melted Tabs page with Melted Tabs Inbox conversation. `/melt-tabs` auto-switches to this page.

### Issue 4 — Brand icon non-functional
- **Symptom**: Brand icon was a `<div>` — not clickable.
- **Fix**: Changed to `<button>` that toggles `sidebarCollapsed` state. Shows `PanelRightClose` when collapsed, `PanelRightOpen` when expanded.
- **Avoid**: Interactive elements should use `<button>`, not `<div>`.

### Issue 5 — Capture fails on CSP-restricted pages
- **Symptom**: `chrome.scripting.executeScript` fails on pages like Google about page.
- **Cause**: CSP blocks injected scripts. Single try-catch returned empty result, falsely showing "chrome:// page" error.
- **Fix**: Wrap `executeScript` in its own try-catch. On failure, fall back to basic title + URL markdown.
- **Avoid**: Always have a fallback for script injection failures.

### Issue 6 — /melt-tabs shows "Untitled" for all tabs
- **Symptom**: All tabs showed "Untitled" — no titles or URLs.
- **Cause**: Missing `"tabs"` permission. `chrome.tabs.query()` returns empty `title`/`url` for non-active tabs without it. `activeTab` only covers the focused tab.
- **Fix**: Added `"tabs"` to `wxt.config.ts` permissions array.
- **Avoid**: If you need tab metadata beyond the active tab, request `"tabs"` permission.

### Issue 7 — Preview toggle hidden when collapsed
- **Symptom**: Toggle button was invisible when preview was collapsed.
- **Cause**: Grid template set to `0px` for the entire row.
- **Fix**: Changed grid template from `0px` to `auto` for the toggle row. Preview content hidden with `display: none` inside collapsed state.
- **Avoid**: Keep interactive controls visible even when their content is hidden.

### Issue 8 — Long messages overflow bubble
- **Symptom**: Long unbroken strings overflowed the message bubble.
- **Fix**: Added `word-break: break-word; overflow-wrap: break-word;` to `.message-bubble`. Removed `overflow: hidden`.
- **Avoid**: Always set `overflow-wrap: break-word` on text containers.

### Issue 9 — Message stream collapsed/overlapping
- **Symptom**: Messages overlapped each other.
- **Fix**: Removed `overflow: hidden` from `.message-bubble`. Each message renders at full height. `.message-stream` handles scrolling.
- **Avoid**: Don't clip content inside message bubbles — let the stream scroll.

### Issue 10 — Slash suggestions hidden after embedded Send button
- **Symptom**: Slash suggestions popup was clipped.
- **Cause**: `overflow: hidden` on `.composer-textarea-wrapper` (added to clip the Send button) also clipped the absolutely-positioned `.slash-suggestions` popup.
- **Fix**: Removed `overflow: hidden` from wrapper. Send button inset by `margin: 6px` — no clipping needed.
- **Avoid**: `overflow: hidden` on a parent clips absolutely-positioned children. Use margins instead.

### Issue 11 — Page picker used native dropdown
- **Symptom**: OS-standard `<select>` was inconsistent with dark theme.
- **Fix**: Replaced with custom `PageSelect` component reusing `.slash-suggestions` dark styling. Closes on outside click/Escape. Shows icon + name.
- **Avoid**: Native `<select>` can't be styled consistently. Build custom components.

### Issue 12 — More-options dropdown hidden behind stacked layers
- **Symptom**: "More" dropdown in the top bar appeared extremely faint / unusable, like it was loading behind other layers.
- **Cause**: `.top-bar` has `backdrop-filter`, which creates a new stacking context. The dropdown was rendered inside that context with `z-index: 100`, but sibling layers outside that context still painted above it.
- **Fix**: Render the "More" menu via `createPortal(..., document.body)` so it escapes the stacking context. Position it with `position: fixed` based on the button's `getBoundingClientRect()`, with `z-index: 9999`. Status message also bumped to `z-index: 9999`.
- **Avoid**: Dropdowns/popovers near elements with `backdrop-filter`, `opacity < 1`, or CSS transforms should be portaled to `document.body`.

### Issue 13 — Composer textarea and Send button layout broken
- **Symptom**: Textarea was cluttered to the right, Send button grew with textarea, and the area could be dragged horizontally.
- **Cause**: Missing flex constraints on the composer wrapper and textarea; no explicit Send button sizing.
- **Fix**: Added `min-width: 0` to `.composer-textarea-wrapper`. Set textarea to `flex: 1 1 auto`, `resize: vertical`, and bounded heights. Set Send button to `flex: 0 0 auto` with fixed height, removing it from the shared button stack styles that made it grow.
- **Avoid**: Always constrain flex children with `min-width: 0` and explicit `flex` values; prevent textarea horizontal resize with `resize: vertical`.

### Issue 14 — Send-to-page overlay rendered as bottom-bar text, unusable
- **Symptom**: Clicking the per-message "Send to page" button did not open a popup. Instead a stray block of page names appeared pinned at the bottom of the main panel and was not interactive. (Known issue, reported earlier.)
- **Cause**: The `.sendto-overlay` / `.sendto-card` elements had **no CSS**. They rendered in normal document flow at the end of `.main-panel`, appearing as a bottom strip. The inner page list reuses `.slash-suggestions`, which is `position: absolute; bottom: 100%` for the composer popup — so inside the card it drifted out of place and was unclickable.
- **Fix**: Added overlay CSS: `.sendto-overlay` / `.onboarding-overlay` are now `position: fixed; inset: 0; z-index: 9999` flex-centered modals with a dimmed backdrop. `.sendto-card` / `.onboarding-card` are centered cards. The inner `.sendto-card .slash-suggestions` is neutralized to `position: static` so the page list flows normally inside the card; items get a bordered, clickable style.
- **Avoid**: Any new overlay/modal (overlay + card pattern) must have its own fixed/absolute positioning CSS. Do not reuse `.slash-suggestions` (which is absolutely positioned for the composer) inside a container without resetting `position` to `static`.

---

## Historical Pitfalls (from v0.2 → v1.0 migration)

| Pitfall | What Happened | How to Avoid |
|---|---|---|
| Single try-catch in `captureTab()` | CSP failures returned empty result, falsely showing "chrome:// page" error | Wrap `executeScript` in its own try-catch; always fall back to title+URL |
| Tab-closing in `/melt-tabs` | Closed all tabs including extension windows | Never close tabs without explicit user confirmation; list instead |
| `setStatus()` without auto-clear | Status messages persisted and overlapped Send button | Always use `showStatus()` which auto-clears after 5s |
| `chrome.runtime.sendMessage` without fallback | Captures lost when side panel was closed | Try `sendMessage` first; on failure, write directly to `chrome.storage.local` |
| Direct `setStatus` calls in slash commands | 30+ scattered calls for status updates | Centralize through `showStatus()` callback |