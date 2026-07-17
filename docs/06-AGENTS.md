# Agent Skill Registry — v1.0 (Lazy-Loaded Index)

**Do NOT auto-load any skill files.** Read this index first to determine if a skill is needed, then `read_file` the specific skill file.

---

## Workspace Skills (`.agents/skills/`)

| Skill ID | Trigger Keywords | File Path | Est. Tokens | Description |
|----------|-----------------|-----------|-------------|-------------|
| `caveman` | default coding, edits, reviews, commits | `.agents/skills/caveman/caveman/SKILL.md` | ~1.3k | Ultra-compressed communication mode. Cuts output tokens 65%. |
| `caveman-commit` | commit messages, /commit | `.agents/skills/caveman/caveman-commit/SKILL.md` | ~0.6k | Conventional Commits message generator. |
| `caveman-compress` | compress memory files, /caveman-compress | `.agents/skills/caveman/caveman-compress/SKILL.md` | ~1.1k | Compress natural language files into caveman format. |
| `caveman-review` | code review, /caveman-review | `.agents/skills/caveman/caveman-review/SKILL.md` | ~0.8k | Caveman-style code review workflow. |
| `caveman-help` | help, /caveman-help | `.agents/skills/caveman/caveman-help/SKILL.md` | ~0.5k | Caveman help system. |
| `caveman-stats` | stats, /caveman-stats | `.agents/skills/caveman/caveman-stats/SKILL.md` | ~0.5k | Caveman statistics workflow. |
| `chrome-wiki` | Chrome extension, WXT, MV3, background/content scripts | `.agents/skills/chrome-wiki/skills.md` | ~8k | Chrome extension development, WXT framework, MV3 manifest. |
| `google-drive-api` | Google Drive, OAuth, file upload | `.agents/skills/google-drive-api-developer/skills.md` | ~10k | Drive REST API, OAuth 2.0, file/folder management. |
| `github-formatting` | GitHub URL formatting | `.agents/skills/github-formatting/skills.md` | ~2k | GitHub URL formats (HTTPS, SSH, ZIP, API). |
| `js-text-library` | Anime.js, text animation | `.agents/skills/js-text-library/skills.md` | ~3k | Text animation libraries (Anime.js, Baffle.js, etc.). |
| `transformer.js` | Transformers.js, ONNX, local AI | `.agents/skills/transformer.js/skills.md` | ~5k | Local AI inference, embedding-based RAG, model loading. |

## Design System Skills (`.agents/skills/awesome-design-skills-main/skills/`)

67 design languages. **Only ONE may be active at a time.** Active design defined in root `DESIGN.md`.

| Design | Slug | Description |
|--------|------|-------------|
| Agentic | `agentic` | AI-native design for agentic interfaces |
| Ant Design | `ant` | Ant Design system adaptation |
| Bento | `bento` | Grid-based bento box layouts |
| Brutalism | `brutalism` | Raw, unpolished, honest materials |
| Claymorphism | `claymorphism` | Soft 3D clay-like UI elements |
| Glassmorphism | `glassmorphism` | Frosted glass, translucent layers |
| Minimal | `minimal` | Whitespace, restraint, clarity |
| Neobrutalism | `neobrutalism` | Bold borders, raw aesthetics |
| Shadcn | `shadcn` | shadcn/ui component style |
| *(+58 more — see full index at `.agents/skills/awesome-design-skills-main/skills/index.json`)* | | |

**Usage**: User says "use glassmorphism" → read `.agents/skills/awesome-design-skills-main/skills/glassmorphism/SKILL.md` → update `DESIGN.md`.

## Cline-Specific Skills (`.clinerules/skills/`)

38 skills available. **Do NOT load unless explicitly invoked via `use_skill` tool.**

| Skill Name | Trigger | Description |
|-----------|---------|-------------|
| `frontend-design` | UI/UX tasks, custom designs | Production-grade frontend interfaces |
| `review-team` | code review request | Multi-agent code review |
| `playground` | interactive HTML tool | Creates interactive HTML playgrounds |
| *(+35 more — list `.clinerules/skills/` to discover)* | | |

## Context TTL
- Skills loaded for a sub-task expire when the sub-task completes.
- Do not carry skill context across unrelated tasks (e.g., don't keep `frontend-design` loaded when debugging background scripts).