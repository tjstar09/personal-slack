# Standard Operating Procedure: Working with AI on This Repo (Token-Optimized)

> **Git Workflow Note**: Branching strategy (feature branch, verify, push, 3 options, merge on approval) is in `.clinerules/autonomous-workspace.md` — Cline injects it automatically. You don't need to mention it in prompts.

---

## 1. Universal Blanket Prompt (Use for ANY New Task)

Copy-paste this into a **new Cline chat** for every task:

```
@docs/01-REPOMAP.md @docs/04-ARCHITECTURE.md

Task: [one-line description]

Details:
- [bullet points with specifics]
- [what files to touch, if known]
- [expected behavior or outcome]

Constraints:
- Manifest V3, TypeScript Strict
- No `any` types
- Follow existing patterns in the codebase
```

**Why this works**: ~6.5k tokens total (REPOMAP + ARCHITECTURE). No auto-loading of docs or skills.

### Example

```
@docs/01-REPOMAP.md @docs/04-ARCHITECTURE.md

Task: Add a new slash command /archive that moves the current conversation to an archive page.

Details:
- New command in commands.ts following the same pattern as /melt-tabs
- Archived conversations appear in a new page named "Archive" in the rail
- Store archived messages under pages[].archivedConversations in the workspace data model
- Add a new ViewMode for the archive view

Constraints:
- Manifest V3, TypeScript Strict
- No new dependencies
- No `any` types
```

---

## 2. Design Change Prompt (Using Awesome Design Skills)

**Pattern:**

```
@docs/01-REPOMAP.md @docs/04-ARCHITECTURE.md

Task: Change the UI design to [design-name] from the awesome-design-skills.

1. Read the skill file: .agents/skills/awesome-design-skills-main/skills/[slug]/SKILL.md
2. Read the design reference: .agents/skills/awesome-design-skills-main/skills/[slug]/DESIGN.md
3. Update root DESIGN.md with the new design tokens
4. Implement the design in styles.css (CSS variables, components, layout)
5. Verify build passes

Current design is Neobrutalism. Replace entirely — do not mix styles.
```

### Example: Change to Glassmorphism

```
@docs/01-REPOMAP.md @docs/04-ARCHITECTURE.md

Task: Change the UI design to glassmorphism from the awesome-design-skills.

1. Read: .agents/skills/awesome-design-skills-main/skills/glassmorphism/SKILL.md
2. Read: .agents/skills/awesome-design-skills-main/skills/glassmorphism/DESIGN.md
3. Update root DESIGN.md with glassmorphism tokens
4. Implement in styles.css (frosted glass, translucent layers, backdrop blur)
5. Verify: cd v1.0 && npx tsc --noEmit && npm run build

Current design is Neobrutalism. Full replacement — do not mix styles.
```

### One-Liner Shortcut

Once the AI is familiar, you can just say:

```
Change the design to glassmorphism. Read the awesome-design skill and update styles.css.
```

---

## 3. Invoking Other Skills

**Syntax:** `Use @skill-<name> for [task]`

| You Say | What Loads |
|---------|-----------|
| `@skill-frontend-design` | `.clinerules/skills/frontend-design/` (Cline `use_skill` tool) |
| `@skill-chrome-wiki` | `.agents/skills/chrome-wiki/skills.md` |
| `@skill-google-drive` | `.agents/skills/google-drive-api-developer/skills.md` |
| `@skill-caveman` | `.agents/skills/caveman/caveman/SKILL.md` |
| `@skill-caveman-commit` | `.agents/skills/caveman/caveman-commit/SKILL.md` |
| `@skill-transformer` | `.agents/skills/transformer.js/skills.md` |

**Rule**: Only invoke skills you actually need.

---

## 4. Context Hygiene

| Do | Don't |
|----|-------|
| ✅ Start a **new chat** for each feature/bug | ❌ Pile tasks into one chat |
| ✅ Say **"compact"** when context gets long | ❌ Let context bloat |
| ✅ Share **file paths** instead of errors | ❌ Paste 500-line error logs |
| ✅ Use `@` to reference specific files | ❌ Expect AI to auto-discover |
| ✅ End with **"summarize for git commit"** | ❌ Leave AI to guess changes |

---

## 5. Cline Settings

| Setting | Value |
|---------|-------|
| Auto-Compact | **ON** |
| Custom Instructions (Cline UI) | **CLEAR** — uses `.clinerules/autonomous-workspace.md` instead |

---

## 6. Expected Token Savings

| Metric | Before | After |
|--------|--------|-------|
| Forced prefix per Turn 1 | ~28k tokens | ~0.6k tokens |
| Cached reads | ~90% | **<5%** |
| Total tokens (8 features) | ~26M | **~2-3M** |

---

## 7. Troubleshooting

| Problem | Response |
|---------|----------|
| AI loaded too many docs | "Stop. Don't read docs unless I @ them." |
| AI loaded skill you didn't ask for | "Drop the [skill-name] context." |
| Context too long | "Compact. Summarize what we've done." |
| AI too verbose | "Be concise. Use caveman mode if needed." |