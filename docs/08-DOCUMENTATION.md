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

## Required Docs by Change Type

| Change Type | Required Updates |
|-------------|------------------|
| Bug fix | `03-BUGS.md` (add issue entry with symptom/cause/fix/avoidance) |
| New feature | `02-FEATURES.md` (add checklist item), possibly `04-ARCHITECTURE.md` |
| UI change | `07-ELEMENT-REFERENCE.md` if element Addressing, hierarchy, or neighbors change |
| Build change | `05-BUILD.md` |
| Architecture change | `04-ARCHITECTURE.md`, possibly `01-REPOMAP.md` if file responsibilities shift |

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

## Starter Prompt Requirement

The `starter_prompt.md` already requires doc updates for feature, bug, and architecture changes. This file exists so the rule is explicit in the docs folder, not only in the bootstrap prompt.