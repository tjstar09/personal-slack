# Personal Slack — Project Identity (Onboarding Prompt)

**Runs ONCE per task/session.** Do not re-read this file or the docs it references on subsequent turns.

---

## Project Identity

This is a **Chrome Extension (Manifest V3)** for personal knowledge capture — a "Slack for one." Built with **WXT**, **TypeScript (Strict)**, **React**, and **Tailwind CSS / CSS Variables**.

Key capabilities: tab capture, slash commands (/melt-tabs, /todos, /summarize), bookmarks, Google Drive sync, side panel + popup UI.

---

## Core Constraints

- **Manifest V3**, TypeScript Strict, ES Modules.
- **Chrome APIs**: `chrome.tabs`, `chrome.sidePanel`, `chrome.storage`, `chrome.runtime`, `chrome.scripting`, `chrome.contextMenus`, `chrome.windows`, `chrome.identity`, `chrome.bookmarks`, `chrome.commands`.
- **State**: React useState + useEffect autosave to `chrome.storage.local`. No Redux/Zustand.
- **Styling**: CSS variables (theming) + flat CSS (`styles.css`).
- **No `any` types** allowed. Use proper interfaces (defined in `types.ts`).

---

## Workflow Protocol

You are a **Senior Engineer**. Work efficiently:

1. **Do not read docs unless I `@` them or you choose to `read_file` them.** Ask clarifying questions before coding.
2. **TURN 1**: Analyze the task. You may read `@REPOMAP` if needed. Propose a plan. **No code yet.**
3. **IMPLEMENT (Turn 2+)**: Write code. Read specific source files via `read_file` for implementation details.
4. **VERIFY**: Run `cd v1.0 && npx tsc --noEmit && npm run build`.
5. **COMPACT**: Summarize changes for git commit.

Reference docs are at `docs/`. Skills at `agents/skills/`. Skill index: `docs/06-AGENTS.md`.

**Do not skip context loading.** But also **do not auto-load docs** — load on demand.