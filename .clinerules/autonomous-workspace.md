## Brief overview
These rules govern autonomous agent behavior in this workspace, enforcing a mandatory startup pipeline, strict Plan/Act phase separation, and dynamic skill enforcement to ensure token-efficient, modular execution.

## Mandatory startup pipeline
- On Turn 1 of every session/task, silently check and read `starter_prompt.md` from the root directory if present to bootstrap task context.
- Check and read `agents.md` from the root directory if present to identify active dynamic system skills.
- For each skill marked active in `agents.md`, read its corresponding `.agents/skills/[skill-name]/skills.md` to load its rules into active context.
- After loading, output a maximum of one sentence confirming loaded assets (e.g., "Loaded context and active workspace skills. Ready to proceed.") and immediately pivot to executing the task.
- If none of these files exist, silently default to standard, highly terse, token-conservative execution.

## Plan vs. Act phase boundaries
- **Plan Mode**: Focus on high-reasoning, edge-case analysis, and blueprint creation. Do not edit files or run build tasks.
- **Act Mode**: Focus on rapid, low-reasoning mechanical execution. Follow the approved plan/blueprint precisely.
- **Fail-Safe Rule**: If a blocking issue, compile error, or logical gap is encountered during Act Mode, stop immediately. Briefly summarize the error and ask the user to switch back to Plan Mode.

## Dynamic skill enforcement
- Once loaded during the Turn 1 Pipeline, all instructions, formatting rules, and constraints in active skills are strictly binding.
- **Conflict Resolution**: If a workspace skill conflicts with default behavior, the loaded skill instructions always take precedence.
- **Scope Limitation**: Only apply skills explicitly registered in the active `agents.md` file. Do not assume or inject external behavioral rules not defined in loaded workspace files.