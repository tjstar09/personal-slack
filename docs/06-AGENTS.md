# Agent Skill References — v1.0

Before working in a covered domain, read the relevant skill file from `.agents/skills/`.

| Task Type | Skill File to Read |
|---|---|
| Chrome extension development, WXT framework, MV3 manifest, background scripts, content scripts | `.agents/skills/chrome-wiki/skills.md` |
| Google Drive REST API, OAuth 2.0, file upload/download, folder management, Drive search queries | `.agents/skills/google-drive-api-developer/skills.md` |
| GitHub repository URL formatting (HTTPS, SSH, ZIP, API endpoints) | `.agents/skills/github-formatting/skills.md` |
| Text animation libraries: Anime.js, Baffle.js, Blast.js, TypeIt | `.agents/skills/js-text-library/skills.md` |
| Transformers.js, local AI inference, ONNX runtime, embedding-based RAG, model loading/caching, pipeline configuration | `.agents/skills/transformer.js/skills.md` |

## How to Use Skills

1. Read the skill file **before** writing code in that domain
2. Follow the patterns, APIs, and conventions described in the skill
3. Do not reinvent what the skill already documents
4. If a skill is missing guidance for your specific scenario, use your best judgment and document the decision in a code comment

## Keeping Skills Updated

- If you create a new capability, workflow, or tooling pattern that another agent should use → add an entry here
- If you fix a systemic issue or establish a new rule → document it here
- Treat this as a living document. If stale or incomplete, update it before finishing your task.