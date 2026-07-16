# Architecture & Design Decisions — v1.0

---

## Key Technical Decisions

### 1. Framework: WXT
WXT abstracts Chrome MV3 manifest generation. `entrypoints/` map directly to extension pages (background, sidepanel, popup). No manual `manifest.json` editing.

### 2. State Management: React useState + useEffect Autosave
- Full workspace is a single JSON blob in `chrome.storage.local`
- `useState` for reactive UI, `useEffect` triggers `saveWorkspace()` on state change
- Trade-off: Simple, no external state library. Works for single-user local extension.
- `normalizeWorkspace()` handles data migration when schema changes

### 3. Capture Flow
```
User clicks Capture (or right-click / keyboard shortcut)
  → captureTab() queries active tab
  → chrome.scripting.executeScript injects extractPageData()
  → Gets: title, URL, meta description, OG tags, selected text
  → Formats as structured markdown (respecting capture mode: Full/Standard/Minimal)
  → Sets draft in composer for review (or posts directly via "Capture & Send")
```
- No separate content script file needed — function is serialized and injected
- CSP fallback: if `executeScript` fails, produces markdown from basic title + URL
- **Capture Modes** (Full/Standard/Minimal): Determine how much metadata is extracted and included in the markdown output
  - **Full** (default): OG tags, meta description, selected text, OG image, enhanced formatting with timestamp
  - **Standard**: Title, URL, meta description, selected text
  - **Minimal**: Title + URL only
- **Toast Notifications**: Top-right feedback for capture success/error/sent status

### 4. Context Menu Relay
```
Context menu click / keyboard shortcut
  → background.ts receives event
  → chrome.runtime.sendMessage to side panel
  → If side panel is open: fills composer for review
  → If sendMessage throws (panel closed): falls back to chrome.storage.local
  → On next panel open: checks storage for pending captures
```

### 5. Slash Commands
- Intercepted in `postMessage()` before normal send flow
- Commands fill the composer with results for review — they do NOT post directly
- `/melt-tabs` generates a tab dump but never closes tabs
- `/todos` creates interactive checklists via custom protocol link handler in markdown renderer

### 6. Full Window Mode
- `chrome.windows.create({ type: 'popup', width: '90%', height: '90%' })`
- Shares the same `<App>` component via `entrypoints/popup/`
- `fullWindow` prop toggles CSS layout classes and hides the "Full" button

### 7. Collapsible Preview
- CSS grid `grid-template-rows` switch on `.preview-hidden` class
- Toggle row: `auto` (always visible, ~36px)
- Preview content row: `0px` when collapsed, `auto` when expanded (via nested CSS)
- Content hidden with `display: none` inside collapsed state

### 8. Auto-Growing Textarea
- JS-driven height recalculation on `draft.body` change
- Resets to `auto`, then sets to `Math.min(scrollHeight, 40vh)`
- Interior message stream contracts as textarea expands
- Never overlaps other elements

### 9. Embedded Send Button
- Send button is a child of `.composer-textarea-wrapper`
- Rendered as right-side control inside the same bordered input box
- `border-left` divider separates it from textarea
- Textarea has transparent border/background — wrapper provides the border
- No `overflow: hidden` on wrapper (would clip slash suggestions popup)

---

## Data Flow

```
User types message → postMessage()
  → If starts with "/": parseSlashCommand() → execute command → setDraft result
  → If normal message: addDraftToWorkspace() → saveWorkspace() → re-render

Capture flow:
  captureTab() → markdown → setDraft → user reviews → postMessage() → save

Load flow:
  loadWorkspace() → normalizeWorkspace() → useState → render
  useEffect → saveWorkspace() on every state change
```

---

## Data Model (types.ts)

```
WorkspaceData
├── pages: Page[]
│   ├── id, name, kind (bookmarks | notes | melted-tabs), icon, color
│   ├── conversations: Conversation[]
│   │   ├── id, title, created, updated, pinned, archived
│   │   ├── messages: Message[]
│   │   │   ├── id, body, author, timestamp, tags, bookmarks[]
│   │   │   └── bookmarks: Bookmark[]
│   │   └── bookmarks: Bookmark[] (page-level)
│   └── bookmarks: Bookmark[]
├── currentPageId, currentConversationId
├── viewMode: ViewMode (chat | gallery | bookmarks | settings)
└── schemaVersion: number
```

---

## File Interaction Map

```
App.tsx ──┬── captureTab.ts     (capture button)
          ├── commands.ts       (slash commands)
          ├── data.ts           (workspace CRUD, URL parsing, auto-tags)
          ├── exports.ts        (markdown/JSON export)
          ├── storage.ts        (load/save)
          ├── chromeIntegrations.ts  (bookmarks, Drive)
          └── githubLinks.ts    (GitHub URL detection)

background.ts ──┬── App.tsx (via sendMessage)
                └── data.ts (auto-post fallback when panel closed)
```

---

## Chrome API Surface

| API | Used For |
|---|---|
| `chrome.sidePanel` | Side panel open/close behavior |
| `chrome.storage.local` | Workspace persistence |
| `chrome.scripting.executeScript` | Tab capture (inject extraction function) |
| `chrome.tabs.query` | Get active tab, list all tabs for `/melt-tabs` |
| `chrome.contextMenus` | Right-click "Send to Personal Slack" |
| `chrome.runtime.sendMessage` | Background → side panel relay |
| `chrome.windows.create` | Full window popup |
| `chrome.identity.getAuthToken` | Google Drive OAuth |
| `chrome.bookmarks.create` | Chrome bookmark integration |
| `chrome.commands` | Keyboard shortcut `Ctrl+Shift+S` |