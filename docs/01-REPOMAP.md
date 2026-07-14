# Repository Map

Current active version: **v1.0** (`v1.0/`). Older v0.1 and v0.2 are retired in `archive/`.

---

## Directory Tree

```
personal-slack/
├── docs/                               # Progressive documentation (read this directory)
│   ├── 00-START.md                     # Routing entry point — read first
│   ├── 01-REPOMAP.md                   # THIS FILE — directory tree + file responsibilities
│   ├── 02-FEATURES.md                  # Feature checklists by phase
│   ├── 03-BUGS.md                      # Bug history, fixes, and pitfalls
│   ├── 04-ARCHITECTURE.md              # Design decisions, data flow, patterns
│   ├── 05-BUILD.md                     # Build commands, verification, OAuth setup
│   ├── 06-AGENTS.md                    # AI agent skill references
│   └── 07-ELEMENT-REFERENCE.md         # UI element catalog with addressing scheme
│
├── archive/                            # Retired versions
│   ├── v0.1/                           # First prototype (was browser/)
│   ├── v0.2/                           # Second prototype (was browser-v2/)
│   └── prompt-for-zero-context.md      # Historical bootstrap prompt for v0.2→v1.0
│
├── v1.0/                               # v1.0 — CURRENT ACTIVE VERSION
│   ├── wxt.config.ts                   # WXT manifest config (permissions, OAuth, shortcuts)
│   ├── package.json                    # name: personal-slack-sidebar-v3, v0.3.0
│   ├── tsconfig.json                   # TypeScript config (strict mode, react-jsx)
│   ├── entrypoints/
│   │   ├── background.ts               # Service worker: side panel, context menus, capture relay
│   │   ├── sidepanel/                  # Side panel entrypoint
│   │   │   ├── index.html              # HTML shell
│   │   │   ├── main.tsx                # React mount: <App /> (no fullWindow prop)
│   │   │   └── src/
│   │   │       ├── App.tsx             # Main React component (~960 lines)
│   │   │       ├── captureTab.ts       # Tab metadata extraction + markdown
│   │   │       ├── chromeIntegrations.ts # Chrome bookmarks + Drive API
│   │   │       ├── commands.ts         # Slash command definitions + executors
│   │   │       ├── data.ts             # Data model, defaults, URL parsing
│   │   │       ├── exports.ts          # Markdown/JSON/Gemini export functions
│   │   │       ├── githubLinks.ts      # GitHub URL parser + action links
│   │   │       ├── storage.ts          # chrome.storage.local wrapper
│   │   │       ├── styles.css          # All CSS (~1160 lines)
│   │   │       └── types.ts            # TypeScript interfaces
│   │   └── popup/                      # Full window popup entrypoint
│   │       ├── index.html              # HTML shell
│   │       └── main.tsx                # React mount: <App fullWindow={true} />
│   └── .output/                        # Build output (gitignored)
│
├── .agents/
│   └── skills/
│       ├── chrome-wiki/skills.md       # Chrome extension + WXT guidance
│       ├── google-drive-api-developer/skills.md  # Drive API + OAuth
│       ├── github-formatting/skills.md # GitHub URL formatting
│       ├── js-text-library/skills.md   # Anime.js text animation
│       └── transformer.js/skills.md    # Transformers.js, ONNX, local AI
│
├── starter_prompt.md                   # Slim entry point (redirects to docs/)
├── AGENTS.md                           # Short redirect to docs/06-AGENTS.md
├── context.md                          # (TO BE DELETED — replaced by docs/)
└── oauth.txt                           # (TO BE DELETED — merged into docs/05-BUILD.md)
```

---

## File Responsibilities (v1.0/entrypoints/sidepanel/src/)

| File | Responsibility |
|---|---|
| `App.tsx` | Main UI: rail, sidebar, chat, gallery, bookmarks, settings. State management, capture, slash command wiring, composer, collapsible preview, auto-growing textarea. |
| `captureTab.ts` | `captureTab()` — injects script into active tab, extracts meta/OG/selection, formats as markdown. Falls back to title+URL on CSP failure. |
| `commands.ts` | Slash command definitions (`/melt-tabs`, `/summarize`, `/todo`, `/todos`, `/ask`). Parsing and execution. |
| `chromeIntegrations.ts` | Chrome bookmark creation, Google Drive auth + upload/upsert, folder management. |
| `data.ts` | `createDefaultWorkspace()`, `addDraftToWorkspace()`, URL parsing, bookmark kind detection, YouTube thumbnails, `inferAutoTags()`. |
| `exports.ts` | Pure export functions: Gemini prompt, conversation/page/workspace markdown, clipboard copy. |
| `githubLinks.ts` | GitHub URL detection (HTTPS/SSH/SSH-URL), action link grouping. |
| `storage.ts` | `loadWorkspace()` / `saveWorkspace()` abstraction over `chrome.storage.local` with `localStorage` fallback. |
| `styles.css` | All CSS. Dark theme, grid layout, responsive breakpoint at 560px. |
| `types.ts` | All TypeScript interfaces: `Page`, `Conversation`, `Message`, `Bookmark`, `BookmarkKind`, `PageKind`, `DraftPayload`, `DriveSyncConfig`, `DriveSyncFileStrategy`, `WorkspaceData`, `ViewMode`. |

---

## Version History

| Version | Directory | Status | Description |
|---|---|---|---|
| v0.1 | `archive/v0.1/` | 🟤 Retired | First prototype — basic side panel, bookmarks, markdown, JSON backup, Drive export plumbing |
| v0.2 | `archive/v0.2/` | 🟤 Retired | Fork with Gemini prompt export, Drive notes sync, anime.js, link previews, GitHub action panels |
| v1.0 | `v1.0/` | 🟢 Active | Capture tab, context menu, keyboard shortcut, full-window popup, sidebar toggle, slash commands, melt tabs, collapsible preview, auto-growing composer, per-message toolbar, auto-tag, clipboard export, interactive `/todos`, onboarding tour |
