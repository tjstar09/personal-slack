# Personal Slack — Quickstart Guide

Read this file **first** to route yourself to the right documentation. Do not read all docs — read only what your task needs.

---

## Mandatory First Step

Before writing any code, read the files in the order specified by your task below. Do not skip this — every task requires context.

---

## Branch & Merge Strategy — READ BEFORE ALTERING ANY CODE

**Core Rules (must follow before any code change):**

- **Always branch first**: Create `feature/<name>` from `main`. Never commit directly to `main`.
- **Verify before commit**: Run `cd v1.0 && npx tsc --noEmit && npm run build` and ensure it passes.
- **Push before review**: Push the feature branch to GitHub (if remote exists) before asking for approval.
- **Present exactly 3 options**: After pushing, show the user:
  1. ✅ Changes approved. Merge to main.
  2. 🔧 Changes working but need more modifications.
  3. ❌ Changes not working. Investigate and fix.
- **Merge only on approval**: Only merge to `main` after the user selects option 1.
- **Clean up**: After merge, ask whether to delete or keep the feature branch.

For the full procedure, see `docs/09-GIT-WORKFLOW.md`.

---

## Routing: Which Docs to Read

| If your task is… | Read these files in order |
|---|---|
| **First time in repo** | `00-START.md` → `01-REPOMAP.md` → `02-FEATURES.md` → `04-ARCHITECTURE.md` → `05-BUILD.md` |
| **Fix a bug** | `01-REPOMAP.md` → `03-BUGS.md` → relevant source file |
| **Add a feature** | `01-REPOMAP.md` → `02-FEATURES.md` → `04-ARCHITECTURE.md` → relevant source files |
| **Build / verify** | `01-REPOMAP.md` → `05-BUILD.md` |
| **Setup OAuth / Drive** | `01-REPOMAP.md` → `05-BUILD.md` (OAuth section) |
| **Work on AI / Transformers** | `01-REPOMAP.md` → `04-ARCHITECTURE.md` → `.agents/skills/transformer.js/skills.md` |
| **Chrome extension / WXT** | `01-REPOMAP.md` → `.agents/skills/chrome-wiki/skills.md` |
| **Find what version does X** | `02-FEATURES.md` |
| **Understand data flow** | `04-ARCHITECTURE.md` |
| **All tasks (including styling/design/refactor)** | **Must follow `09-GIT-WORKFLOW.md`** |

## Mandatory Planning Checklist

**Before writing any code or making any changes**, complete these steps:

1. [ ] **Create feature branch**: `git checkout -b feature/<name>` from `main`
2. [ ] **Verify build**: `cd v1.0 && npx tsc --noEmit && npm run build` (must pass)
3. [ ] **Plan includes**: Git workflow steps (branch, commit, push, present 3 options, merge only on approval)

This checklist is mandatory for **all** tasks — features, bug fixes, styling, refactors, documentation updates, etc.

---

## Reference Files (Read Only If Needed)

| File | When to Read |
|---|---|
| `06-AGENTS.md` | When you need to invoke an AI agent for a sub-task |
| `07-ELEMENT-REFERENCE.md` | When addressing or modifying UI elements — provides friendly names, hierarchy, position, neighbors, and CSS selectors |
| `08-DOCUMENTATION.md` | When contributing changes — tells you which docs to update and when |
| `09-GIT-WORKFLOW.md` | When needing git commands, branch strategy, or commit conventions |
| `10-CAPTURE-FEATURE-PLAN.md` | When working on the capture button feature overhaul |
| Archive `archive/` | When you need v0.1 or v0.2 source code for reference (retired) |

---

## Skill Files (Domain-Specific Guidance)

Before working in a covered domain, read the relevant skill:

| Skill | Covers |
|---|---|
| `.agents/skills/chrome-wiki/skills.md` | Chrome extension, WXT, MV3, background/content scripts |
| `.agents/skills/google-drive-api-developer/skills.md` | Google Drive REST API, OAuth, file/folder management |
| `.agents/skills/github-formatting/skills.md` | GitHub URL formatting |
| `.agents/skills/js-text-library/skills.md` | Anime.js text animation |
| `.agents/skills/transformer.js/skills.md` | Transformers.js, ONNX, local AI inference |
| **`.clinerules/skills/frontend-design/skills.md`** | Frontend design, styling, aesthetics, production-grade UI |

## Git Workflow Enforcement

**All tasks must follow the branch and merge strategy documented in `docs/09-GIT-WORKFLOW.md`.**

This is not optional. The workflow applies to:
- New features
- Bug fixes
- Styling / design changes
- Refactors
- Documentation updates
- Any change to the codebase

The core rules are:
1. Always create a `feature/<name>` branch from `main`
2. Verify build passes before committing
3. Push the feature branch before asking for review
4. Present exactly 3 approval options
5. Merge to `main` only after explicit approval
6. Clean up feature branch after merge

See `docs/09-GIT-WORKFLOW.md` for the complete procedure.

---

## Your Mission

1. Read the files listed in your routing above (mandatory)
2. Read the minimum source files needed
3. Make changes using `replace_in_file` (preferred) or `write_to_file`
4. Verify: `cd v1.0 && npx tsc --noEmit && npm run build`
   - **Windows note**: If you see `The token '&&' is not a valid statement separator`, use `cmd /c "cd /d v1.0 && npx tsc --noEmit"` instead.
5. Update `docs/` files and `v1.0/README.md` if your change affects features, bugs, or architecture
6. Report results concisely

Do not skip context loading. Do not reinvent patterns. Build first, optimize later.