# Feature Checklist — v1.0

Current active version. Older v0.1/v0.2 features are archived in collapsible blocks below.

---

## v1.0 Phase 1 — Capture & Full Window (✅ Done)

- [x] Capture Tab button in top bar — extracts title, URL, meta description, OG tags, selected text
- [x] Right-click context menu "Send to Personal Slack" (page, selection, link, image)
- [x] Keyboard shortcut `Ctrl+Shift+S` / `Cmd+Shift+S`
- [x] Background relay: context menu/shortcut → side panel via `chrome.runtime.sendMessage`
- [x] Pending capture fallback to `chrome.storage.local` when side panel is closed
- [x] "Full" button opens 90% popup window
- [x] `entrypoints/popup/` — separate entrypoint rendering `<App fullWindow={true} />`
- [x] Sidebar toggle via brand icon (PanelRightOpen/PanelRightClose)
- [x] Capture Modes (Full / Standard / Minimal) — dropdown UI on capture button for flexible content capture
- [x] Enhanced capture message format — mode badge emoji, relative timestamp, host, ISO timestamp footer
- [x] Toast notifications for capture feedback (success/error)

## v1.0 Phase 2 — Tab Melting & Slash Commands (✅ Done)

- [x] `/melt-tabs` — tab dump grouped by session. Extension popup windows filtered out. "Restore Session" button. Does NOT close tabs.
- [x] `/melt-tabs <sessionId>` — restricts to one session
- [x] `/summarize` — capture tab + keyword-density scoring
- [x] `/todo` — regex scan all messages for `- [ ]` / `- [x]`
- [x] `/todos` — interactive checklist with clickable toggles, persists to source
- [x] `/ask [query]` — keyword search across message bodies, top 5 results
- [x] Slash suggestion popup — dynamic filtering, keyboard navigation
- [x] Melted Tabs page with `PageKind: 'melted-tabs'` and dedicated inbox

## v1.0 Post-Phase-2 Enhancements (✅ Done)

- [x] Collapsible markdown preview (collapsed by default, toggle always visible)
- [x] Auto-growing composer textarea (56px → up to 40vh)
- [x] Embedded Send button inside composer box
- [x] Pin icon (Pin icon instead of misleading Star)
- [x] Status messages auto-fade after 5 seconds
- [x] Per-message hover toolbar (Copy, Send-to-page, Delete)
- [x] Keyboard-first composer (Esc blurs, ↑ loads last message)
- [x] Auto-tag by content (GitHub → `github`, YouTube → `video`, etc.)
- [x] Clipboard Markdown export ("Copy MD" button in top bar)
- [x] Interactive `/todos` checklist with toggle persistence
- [x] Onboarding tour (4-step overlay, re-triggerable from Settings)
- [x] Send-to-page popup overlay (matches onboarding styling)
- [x] Custom PageSelect component (replaces browser-native dropdown)

## v1.0 Design Migration — Neobrutalism (✅ Done)

- [x] Migrate from Custom Dark Theme to Neobrutalism design system
- [x] **Dual-mode theme**: both light and dark themes fully polished
- [x] Light mode: warm off-white surface (`#FBFBF9`), navy borders (`#1C293C`)
- [x] Dark mode: near-black warm surface (`#0F1419`), warm white borders (`#FBFBF9`)
- [x] Yellow primary accent (`#FDC800`) — unchanged in both modes
- [x] Purple secondary (`#432DD7` light / `#A78BFA` dark)
- [x] Offset hover states with `translate(-2px, -2px)`
- [x] Inter + JetBrains Mono typography via Google Fonts
- [x] Sharp corners (4px max radius) on primary buttons
- [x] 3px focus outlines for accessibility
- [x] Both sidepanel and popup entrypoints updated
- [x] DESIGN.md updated with new tokens and patterns

## v1.0 Theme Toggle (✅ Done - Phases 1-6)

- [x] **Phase 1**: Remove legacy CSS aliases and dead `.dark` class (cleanup)
- [x] **Phase 2**: Implement theme toggle UI (sun/moon icons in More actions dropdown)
- [x] **Phase 2**: Wire `.dark` class toggle on `<html>` element
- [x] **Phase 2**: Persist theme preference to `chrome.storage.local` (`theme-preference` key)
- [x] **Phase 2**: System preference fallback via `prefers-color-scheme: dark`
- [x] **Phase 3**: Refactor monolithic `styles.css` into modular architecture:
  - `tokens.css` — CSS variables, theme tokens
  - `layout.css` — app-shell, rail, sidebar, main-panel
  - `components.css` — buttons, cards, inputs, tags, modals
  - `chat.css` — markdown, message stream, composer
  - `views.css` — gallery, bookmarks, settings
  - `animations.css` — keyframes, transitions
  - `responsive.css` — media queries, print
- [x] **Phase 4**: Add skeleton loading states, micro-interactions, custom scrollbars, `--space-5` (20px)
- [x] **Phase 5**: Accessibility improvements — dedicated `--color-focus`, `prefers-contrast` support, keyboard improvements

## v1.0 Phase 3 — Local AI Teammate (🔄 Planned)

- [ ] Transformers.js integration with `Xenova/all-MiniLM-L6-v2`
- [ ] `/summarize` upgrade with sentence-transformers extractive scoring
- [ ] `/ask` upgrade with cosine similarity semantic search
- [ ] Model downloaded on first use (~80 MB), cached in IndexedDB

## v1.0 Phase 4 — Canvas & Quality-of-Life (🔄 Planned)

- [ ] Markdown scratchpad split-screen (canvas)
- [ ] Emoji reactions under messages (⭐ pins, 📁 archives, ✅ marks done)
- [ ] Drag-and-drop text/links from browser tabs into chat area
- [ ] OG link preview fetch via internal helper

---

<details>
<summary><b>Archived: v0.1 Features (retired)</b></summary>

- [x] Chrome side panel from action button
- [x] Local conversation pages (Bookmarks page default)
- [x] Markdown preview + rendering
- [x] Conversation history, gallery, bookmark gallery
- [x] Tags, pinned threads, archive, search
- [x] Automatic URL extraction from messages
- [x] Internal bookmarks + Chrome `Personal Slack` folder
- [x] YouTube thumbnail detection
- [x] JSON backup/restore, Markdown export
- [x] Google Drive export plumbing (OAuth placeholder)
</details>

<details>
<summary><b>Archived: v0.2 Features (retired)</b></summary>

- [x] Gemini bookmark sync prompt export
- [x] Google Drive notes sync (per-page `bookmarks.md` + `conversation-history.md`)
- [x] Anime.js integration (AnimatedShortPreview for ≤3 words or smiley)
- [x] Link preview cards per message
- [x] GitHub URL detection + action panels (formats, work, tracking, API)
- [x] Drive sync config UI in Settings (toggle, root folder, notes folder, last synced)
- [x] `isShortPreviewCandidate()` detection for animated preview
</details>