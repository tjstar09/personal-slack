# Agent Skill Registry

See `docs/06-AGENTS.md` — the skill registry has been migrated to a **lazy-loaded index**.

**New rule**: Skills are loaded **on-demand only**. Do NOT auto-load any skill files on session start. Check `docs/06-AGENTS.md` first to determine if a skill is needed, then `read_file` the specific skill file.