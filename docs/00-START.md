# Personal Slack — Quickstart Guide

Read this file **first** to route yourself to the right documentation. Do not read all docs — read only what your task needs.

---

## Mandatory First Step

Before writing any code, read the files in the order specified by your task below. Do not skip this — every task requires context.

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

---

## Reference Files (Read Only If Needed)

| File | When to Read |
|---|---|
| `06-AGENTS.md` | When you need to invoke an AI agent for a sub-task |
| `07-ELEMENT-REFERENCE.md` | When addressing or modifying UI elements — provides friendly names, hierarchy, position, neighbors, and CSS selectors |
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