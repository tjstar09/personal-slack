# Cline Rules: Personal Slack Capture Extension

## Global Constraints
- Manifest V3, TypeScript (Strict), ES Modules.
- Chrome APIs: `chrome.tabs`, `chrome.sidePanel`, `chrome.storage`, `chrome.runtime`, `chrome.scripting`, `chrome.contextMenus`, `chrome.windows`, `chrome.identity`, `chrome.bookmarks`, `chrome.commands`.
- State: React useState + useEffect autosave (No Redux/Zustand).
- Styling: CSS variables (Theming) + flat CSS (`styles.css`).

## Context Protocol (CRITICAL FOR TOKENS)
- **NEVER** auto-read `docs/`, `agents/`, `starter_prompt.md` on new turns.
- **TURN 1 ONLY**: User will provide `@REPOMAP @ARCHITECTURE` if needed.
- **ON-DEMAND ONLY**: Use `read_file` for specific implementation details.
- **SKILLS**: Do NOT load `agents/skills/*` or `.clinerules/skills/*` unless:
  1. User explicitly says "Use @skill-<name>".
  2. Task matches a skill trigger in `docs/06-AGENTS.md` (check index first via `read_file`).
- **CONTEXT TTL**: Knowledge from skills/docs expires at end of sub-task. Do not carry `frontend-design` context into `background-script` debugging.

## Workflow
1. **Plan** (Turn 1): Analyze task. Read `@REPOMAP` if provided. Propose plan. **No Code.**
2. **Implement** (Turn 2+): Write code. Read specific files via tools.
3. **Verify**: Run `cd v1.0 && npx tsc --noEmit && npm run build`.
4. **Compact**: Summarize changes for user/git commit.

## Git Workflow Enforcement (CRITICAL — Prevents Direct-to-Main Mistakes)
- **Always branch first**: Create `feature/<name>` from `main`. Never commit directly to `main`.
- **Verify before commit**: Run `cd v1.0 && npx tsc --noEmit && npm run build` and ensure it passes.
- **Push before review**: Push the feature branch to GitHub before asking for approval.
- **Present exactly 3 options** after pushing:
  1. ✅ Changes approved. Merge to main.
  2. 🔧 Changes working but need more modifications.
  3. ❌ Changes not working. Investigate and fix.
- **Merge only on approval**: Only merge to `main` after the user selects option 1.
- **Clean up**: After merge, ask whether to delete or keep the feature branch.

## Startup Pipeline
- On Turn 1: Read `starter_prompt.md` if present (once per session). Do NOT re-read on subsequent turns.
- Do NOT auto-load any skill files. Skills are on-demand only.
- Output max 1 sentence confirming loaded context, then proceed.
