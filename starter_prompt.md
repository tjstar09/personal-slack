# Starter Prompt — Personal Slack

This is the entry point for AI agents. Read this first, then follow the routing below.

---

## 1. Mandatory Context Loading

Before writing any code, read the following **in this order**:

1. **`docs/00-START.md`** — Routing decision tree. Tells you which docs to read for your task.
2. **`docs/01-REPOMAP.md`** — Directory tree and file responsibilities.
3. **`docs/02-FEATURES.md`** (if adding a feature) or **`docs/03-BUGS.md`** (if fixing a bug)
4. **`docs/04-ARCHITECTURE.md`** (if understanding data flow or design)
5. **`docs/05-BUILD.md`** (if building or verifying)
6. **`docs/06-AGENTS.md`** (if invoking an agent or working in a skill-covered domain)
7. **`docs/07-ELEMENT-REFERENCE.md`** (if addressing or modifying UI elements — provides friendly names, hierarchy, position, neighbors, and CSS selectors)
8. **`docs/08-DOCUMENTATION.md`** (if contributing changes — read to understand which docs to update and when)
9. **`docs/09-GIT-WORKFLOW.md`** (mandatory — read before creating branches or committing)
10. **`docs/10-CAPTURE-FEATURE-PLAN.md`** (only if working on the capture button overhaul)
11. **Relevant skill files** from `.agents/skills/` (see `docs/06-AGENTS.md`)

Do not read all docs — read only what your task needs. See `docs/00-START.md` for the routing table.

---

## 2. Your Mission

1. Read the files listed in your routing above (mandatory)
2. Read the minimum source files needed
3. Make changes using `replace_in_file` (preferred) or `write_to_file`
4. Verify: `cd v1.0 && npx tsc --noEmit && npm run build`
5. Update `docs/` files and `v1.0/README.md` if your change affects features, bugs, or architecture. Use `docs/08-DOCUMENTATION.md` as the source of truth for which docs to update.
6. Report results concisely
7. Follow the review/merge workflow in `docs/09-GIT-WORKFLOW.md` — present exactly 3 approval options to the user after pushing a feature branch

**Do not skip context loading. Do not reinvent patterns. Do not panic on npm warnings. Build first, optimize later.**
