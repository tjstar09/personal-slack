Here is a structured, phased implementation plan to systematically address the code review findings. By tackling the P0 items first, we ensure the extension's core integrity and security before moving into architecture and polish.

## Phase 1: Core Integrity & Security (P0)

These are drop-everything fixes that address data loss, infinite loops, and severe XSS vulnerabilities.

1. **Fix Broken Drive Integration:** P0 | chromeIntegrations.ts.
The current Drive implementation references missing variables and functions, breaking the build or runtime.

* **Action:** If Drive is out of scope for v1.0, comment out or remove the broken functions (`ensureDriveFolder`, `exportWorkspaceToDrive`).
* **Alternative:** If required for v1.0, define `escapeDriveQueryValue`, `parentQuery`, and implement `uploadDriveFile` using the standard Google Drive REST API.


2. **Implement Autosave Debouncing:** P0 | App.tsx.
Writing to `chrome.storage.local` on every keystroke will hit rate limits and lag the UI.

* **Action:** Wrap the `saveWorkspace` call in `App.tsx` (lines 280-283) using a debounce utility (e.g., `lodash/debounce` or a custom `setTimeout` wrapper) set to 500ms–1000ms.


3. **Add Timeout to executeScript:** P0 | captureTab.ts.
Hanging tabs block the capture pipeline indefinitely.

* **Action:** Wrap the `executeScript` call (lines 92-107) in a `Promise.race` alongside a `setTimeout` that rejects after 10 seconds, allowing the UI to recover or fallback gracefully.


4. **Fix Background Auto-Post Race Condition:** P0 | background.ts.
Concurrent background writes are overwriting each other.

* **Action:** Implement a basic mutex locking mechanism in `chrome.storage.session` or use an `updatedAt` version check before committing writes in `autoPostCapture` (lines 89-102).


5. **Sanitize Markdown Injection Vectors:** P0 | background.ts & App.tsx.
Unsanitized page data can lead to XSS via ReactMarkdown.

* **Action:** Strip or escape characters like `[` , `]`, `(`, and `)` from page titles and selection text in `background.ts` before interpolating them into markdown.
* **Action:** Restrict the `restore:` and `todo:` protocol handlers in `App.tsx` to only accept allowlisted URL schemes (`http:`, `https:`).


---

## Phase 2: Accessibility & Safety Polish (P1)

With the app stable and secure, we address high-impact UX, accessibility blockers, and secondary security checks.

| Feature | Target File(s) | Implementation Approach |
| --- | --- | --- |
| **Bookmark Scheme Validation** | `chromeIntegrations.ts` | Intercept the URL before calling `chrome.bookmarks.create` and enforce `http://` or `https://` schemes to prevent `javascript:` bookmark injection. |
| **Workspace Reset Confirmation** | `App.tsx` | Wrap the reset execution (lines 2345-2348) in a `window.confirm("Are you sure you want to delete all workspace data?")` or a custom UI modal. |
| **Slash Command A11y** | `App.tsx` | Add `onKeyDown` (handling Enter/Space) to the suggestion list items (lines 1754-1772). Add `role="listbox"` to the container and `role="option"` to items. |
| **Page Rail & Button A11y** | `App.tsx` | Add `aria-label={page.name}` to the rail buttons (lines 1046-1058), the capture badge, and the trash icon delete button. |

---

## Phase 3: Architectural Refactoring & Testability (P2)

This phase addresses the "God Component" and prepares the codebase for long-term maintainability.

1. **Deconstruct App.tsx:** P2 | App.tsx & New Components.
Break down the 2,400+ line monolith into focused feature components.

* **Action:** Create separate files for `CaptureManager.tsx`, `CommandPalette.tsx`, `SettingsView.tsx`, and `ChatView.tsx`. Pass state down via props or a React Context provider (`WorkspaceProvider`).


2. **Extract Chrome API Adapters:** P2 | App.tsx -.
services/">
Move side-effecting Chrome APIs out of UI components to allow rendering without the extension context.

* **Action:** Create a `services/` directory. Move `chrome.tabs.create` calls behind a `TabsService.openTab(url)` interface, and `chrome.bookmarks` into a `BookmarksService`.


3. **Scope Down Scope Creep:** P2 | githubLinks.ts & Commands.
Reduce surface area for v1.0.

* **Action:** Remove or feature-flag the GitHub repo detection logic if it's not strictly necessary for v1.0 launch. Limit default slash commands to the core set (`/melt-tabs`, `/summarize`).


4. **Establish Test Infrastructure:** P2 | package.json & Tests.
Ensure regressions don't slip back in.

* **Action:** Install Vitest and React Testing Library. Write baseline tests for the newly extracted pure functions (like the Markdown sanitizer) and the debounced autosave logic.


---

## Phase 4: Optimization & Cleanup (P3)

Final touches to improve the developer experience and system performance.

1. **Build-Time OAuth Check:** Add a validation script to `wxt.config.ts` that fails the build if `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID` is detected, ensuring developers don't deploy broken Drive features.
2. **Consolidate Utilities:** Create a `utils/` folder and centralize `createId`, `formatRelativeTime`, and `extractHost` so they are imported by both background scripts and UI components, rather than duplicated.
3. **Actionable Errors:** Update error toasts (like the Drive export failure) to include specific instructions (e.g., "Google OAuth Client ID is missing. Check the Extension Settings to configure.").