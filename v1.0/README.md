# Personal Slack Sidebar v1.0

> **Documentation**: All project documentation has moved to `docs/` at the repository root. Start at `docs/00-START.md` for routing.
>
> **Archive**: v0.1 and v0.2 have been retired. Their source code lives in `archive/v0.1/` and `archive/v0.2/`. Full feature histories for those versions are preserved in `docs/02-FEATURES.md` (collapsible sections) and `docs/03-BUGS.md` (historical pitfalls table).

A WXT Manifest V3 Chrome extension that opens a local Slack-style workspace in Chrome's side panel, with tab capture, full-window overlay, slash commands, AI teammate, canvas scratchpad, and Google Drive sync.

## Features

### Phase 1 — Capture & Full Window (✅ Complete)
- **Capture Tab**: Click "Capture" in the top bar to extract the current browser tab's title, URL, meta description, Open Graph tags, and selected text. Injects a content script via `chrome.scripting.executeScript`. If script injection fails (CSP-restricted pages like Google about page), gracefully falls back to basic title + URL capture.
- **Right-Click Capture**: Context menu item "Send to Personal Slack" on pages, selections, links, and images. If the side panel is open, fills the composer for review. If closed, auto-posts directly to the Bookmarks/Inbox conversation with `capture` tag.
- **Keyboard Shortcut**: `Ctrl+Shift+S` / `Cmd+Shift+S` — same behavior as right-click (composer if panel open, auto-post if closed).
- **Full Window Mode**: "Full" button opens a popup window at 90% screen size overlaying the current tab. Shares the same React `<App>` component via `entrypoints/popup/`. The Full button is hidden when already in full-window mode.
- **Sidebar Toggle**: Brand icon (top of the rail) toggles sidebar visibility — `PanelRightOpen`/`PanelRightClose` icons.

### Phase 2 — Tab Melting & Slash Commands (✅ Complete)
 - `/melt-tabs`: Generates a tab dump grouped by **all sessions** (browser windows) with recognizable session headers (focused tab title + tab count). Extension popup windows are filtered out. Each session includes a "Restore Session" button to reopen all its tabs. `No args` → lists tabs across all browser sessions. `/melt-tabs 42` → lists tabs from session ID 42 only. Works correctly in both side panel and full-window popup modes. Does NOT close any tabs. Switches to the "Melted Tabs" page with tags `melted-tab`, `YYYY-MM-DD`.
 - `/summarize`: Captures the current tab and extracts key bullet points using keyword-density scoring (extractive summarization).
 - `/todo`: Scans all messages in the workspace for `- [ ]` / `- [x]` checkbox patterns.
 - `/todos`: Creates an interactive checklist from checkboxes found in the workspace. Click any checkbox to toggle it — changes persist in the source message immediately.
 - `/ask [query]`: Searches all message bodies for matching text, returning top 5 results with thread name and date.
 - **Slash command suggestions**: Type `/` in the composer to see a dynamic list of available commands. Filter narrows as you type. Navigate with Arrow keys, select with Enter/Tab, dismiss with Escape.

### Quality-of-Life Fixes
- **Collapsible markdown preview**: Preview area is collapsed by default. The toggle button stays visible (~36px row). Expanding reveals the full preview. Message stream expands to fill freed space.
- **Auto-growing composer textarea**: Textarea starts at 56px and grows upward as the user types, up to 40vh, then becomes scrollable. Never overlaps other elements.
- **Embedded Send button**: The Send button now lives inside the composer's bordered input box, to the right of the textarea and separated by a `border-left` divider. The textarea no longer has its own border/background. Removing the separate Send row lets the freed vertical space flow to the message history automatically.
- **Pin icon**: Conversation pin button now shows a `Pin` icon instead of `Star` for clarity.
- **Status messages**: Disappear automatically after 5 seconds with a fade-out animation. Positioned at bottom-left (not overlapping the Send button).
- **Melted Tabs page**: Default workspace now includes a "Melted Tabs" page with "Melted Tabs Inbox" conversation for `/melt-tabs` output.

### Phase 3 — Local AI Teammate (🔄 Planned)
- Transformers.js integration with `Xenova/all-MiniLM-L6-v2` for local embedding-based RAG.
- `/summarize` upgrade with proper sentence-transformers extractive scoring.
- `/ask` upgrade with cosine similarity semantic search.

### Phase 4 — Canvas & Quality-of-Life (🔄 Planned)
- Markdown scratchpad split-screen (canvas) for long-form brainstorming.
- Emoji reactions under messages (⭐ pins, 📁 archives, ✅ marks done).
- Drag-and-drop text/links from browser tabs into the chat area.
- OG link preview fetch via internal helper for richer link cards.

### v2 Carryover Features
- Chrome side panel opened from the extension action button.
- Local conversation pages with a default `Bookmarks` page.
- Markdown preview above the composer and markdown rendering in message history.
- Conversation history, gallery view, bookmark gallery, tags, pinned threads, archive, and search.
- Automatic URL extraction from posted messages.
- Internal bookmarks plus Chrome bookmark creation in a `Personal Slack` folder.
- Video link detection with YouTube thumbnails.
- JSON backup, JSON restore, and Markdown export.
- Gemini bookmark sync prompt export.
- Google Drive file export (JSON + Markdown + Gemini prompt) and notes sync (per-page folder structure).
- Anime.js animated short preview for ≤3 words or smiley input.
- GitHub URL detection with action panels (formats, work, tracking, API endpoints).
- Link preview cards per message.

## Development

```bash
cd v1.0
npm install
npm run dev
```

Load the generated extension from `.output/chrome-mv3` at `chrome://extensions` with Developer mode enabled.

## Production Build

```bash
cd v1.0
npm run build
```

Load or package `.output/chrome-mv3`.

## Google Drive Export Setup

1. Create a Google Cloud OAuth client for a Chrome extension.
2. Use the extension ID from Chrome after loading the unpacked extension.
3. Replace the `oauth2.client_id` placeholder in `wxt.config.ts` with your real client ID.
4. Rebuild and reload the extension.

The manifest already requests `identity` and `https://www.googleapis.com/auth/drive.file`.

## Version History

| Version | Status | Directory | Notes |
|---------|--------|-----------|-------|
| v0.1 | 🟤 Retired | `archive/v0.1/` | Original WXT side panel with bookmarks, markdown, JSON backup |
| v0.2 | 🟤 Retired | `archive/v0.2/` | Gemini prompt export, Drive notes sync, anime.js animations, link previews, GitHub action panels, animated short preview |
| v1.0 | 🟢 Active | `v1.0/` | Capture tab, context menu, keyboard shortcut, full-window popup, sidebar toggle, slash commands (`/melt-tabs`, `/summarize`, `/todo`, `/ask`), Melted Tabs page, collapsible preview with toggle preserved, auto-growing composer, status fade animation, Send-to-page popup overlay |

## Code Documentation

All v1.0 source files have been annotated with comprehensive human-readable AND AI-readable comments covering:
- File purpose and design rationale
- Why specific patterns were chosen over alternatives
- Trade-offs and edge cases
- Interactions with other files in the project
- Architecture decisions

This ensures that a new AI session with zero context can read the `docs/` directory + any source file and understand the full application.

### AI Onboarding

1. Read `docs/00-START.md` for routing
2. Follow the task-specific doc chain (see routing table in `00-START.md`)
3. Read the minimum source files needed
4. Verify: `npx tsc --noEmit && npm run build`
5. Update `docs/` and this file if your change affects features, bugs, or architecture

## Next Additions

- Phase 3: Local AI teammate with Transformers.js embeddings + RAG
- Phase 4: Canvas scratchpad, emoji reactions, drag-and-drop, OG link scraping
