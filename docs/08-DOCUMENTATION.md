# Documentation Update Policy

This file specifies what documentation must be updated and when.

## When to Update Documentation

Update the relevant docs whenever you:

- **Fix a bug** — record it in `03-BUGS.md`
- **Add a feature** — add it to `02-FEATURES.md`; if it changes data flow or design, also update `04-ARCHITECTURE.md`
- **Change architecture/data flow** — update `04-ARCHITECTURE.md`
- **Change build/verification/OAuth setup** — update `05-BUILD.md`
- **Modify UI elements** — update `07-ELEMENT-REFERENCE.md`
- **Refactor code without behavior change** — no doc update required unless it affects understanding of the system
- **Add or update a skill** — update `06-AGENTS.md` with the new skill entry, description, and file path

## Required Docs by Change Type

| Change Type | Required Updates |
|-------------|------------------|
| Bug fix | `03-BUGS.md` (add issue entry with symptom/cause/fix/avoidance) |
| New feature | `02-FEATURES.md` (add checklist item), possibly `04-ARCHITECTURE.md` |
| UI change | `07-ELEMENT-REFERENCE.md` if element Addressing, hierarchy, or neighbors change |
| Build change | `05-BUILD.md` |
| Architecture change | `04-ARCHITECTURE.md`, possibly `01-REPOMAP.md` if file responsibilities shift |
| Add/update workspace skill in `.agents/skills/` | `06-AGENTS.md` (add entry to workspace skills table with task type and skill file path) |
| Add/update Cline-specific skill in `.clinerules/skills/` | `06-AGENTS.md` (add entry to Cline-specific skills table with skill name and purpose) |

## Bug Documentation Format

Each bug entry in `03-BUGS.md` must include:

```markdown
### Issue N — Short title
- **Symptom**: User-visible description
- **Cause**: Technical root cause
- **Fix**: What changed and why it works
- **Avoid**: How to prevent this class of bug in future work
```

## REFACTOR_REMARKS Policy

If the prompt includes a `REFACTOR_REMARKS:` section, append a concise note there summarizing the doc updates you made. This gives the requester a fast trace without reading full files.

## Skill Documentation Policy

When adding or updating any skill, follow these rules:

1. **Always update `06-AGENTS.md`** — add the skill to the appropriate table (workspace skills or Cline-specific skills)
2. **Skills in `.agents/skills/`** — must be listed in `06-AGENTS.md` with:
   - Task type(s) the skill covers
   - Path to the skill file (e.g., `.agents/skills/chrome-wiki/skills.md`)
3. **Skills in `.clinerules/skills/`** — must be listed in `06-AGENTS.md` with:
   - Skill name as registered for `use_skill`
   - Brief purpose/description
4. **Planning usage** — if a skill applies to the planned work, the plan must:
   - Identify the skill(s) by name/path
   - State why the skill is relevant
   - Confirm the skill file will be read before implementation
5. **Act mode usage** — before implementing any step in a skill-covered domain:
   - Read the skill file specified in `06-AGENTS.md`
   - Follow the patterns, APIs, and conventions documented there
   - Do not reinvent what the skill already documents

## Starter Prompt Requirement

The `starter_prompt.md` already requires doc updates for feature, bug, and architecture changes. This file exists so the rule is explicit in the docs folder, not only in the bootstrap prompt.
