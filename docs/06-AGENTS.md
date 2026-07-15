# Agent Skill References — v1.0

## Skill Directories

This project uses two skill directories:

| Directory | Purpose | Version Control |
|-----------|---------|-----------------|
| `.agents/skills/` | Workspace-specific skills, committed to git | Tracked |
| `.clinerules/skills/` | Cline-native skills, excluded from gitignore | Ignored |

## Workspace Skills (`.agents/skills/`)

Before working in a covered domain, read the relevant skill file from `.agents/skills/`.

| Task Type | Skill File to Read |
|---|---|
| **Default workflow — use for all routine coding operations if `.agents/skills/caveman/` exists** | `.agents/skills/caveman/SKILL.md` |
| Chrome extension development, WXT framework, MV3 manifest, background scripts, content scripts | `.agents/skills/chrome-wiki/skills.md` |
| Google Drive REST API, OAuth 2.0, file upload/download, folder management, Drive search queries | `.agents/skills/google-drive-api-developer/skills.md` |
| GitHub repository URL formatting (HTTPS, SSH, ZIP, API endpoints) | `.agents/skills/github-formatting/skills.md` |
| Text animation libraries: Anime.js, Baffle.js, Blast.js, TypeIt | `.agents/skills/js-text-library/skills.md` |
| Transformers.js, local AI inference, ONNX runtime, embedding-based RAG, model loading/caching, pipeline configuration | `.agents/skills/transformer.js/skills.md` |
| Caveman commit workflows | `.agents/skills/caveman-commit/SKILL.md` |
| Caveman compression workflows | `.agents/skills/caveman-compress/SKILL.md` |
| Caveman help workflows | `.agents/skills/caveman-help/SKILL.md` |
| Caveman review workflows | `.agents/skills/caveman-review/SKILL.md` |
| Caveman stats workflows | `.agents/skills/caveman-stats/SKILL.md` |

## Cline-Specific Skills (`.clinerules/skills/`)

Cline-native skills are stored in `.clinerules/skills/` and are excluded from version control. These skills provide Cline-specific capabilities and integrations.

To discover available Cline-specific skills, list `.clinerules/skills/`. Each subdirectory contains a `SKILL.md` with usage instructions.

Common Cline-specific skills include:

| Skill Name | Purpose |
|---|---|
| `frontend-design` | Create distinctive, production-grade frontend interfaces with high design quality |
| `amazon-location-service` | Integrates Amazon Location Service APIs for AWS applications |
| `amplify-workflow` | Build and deploy full-stack web and mobile apps with AWS Amplify Gen2 |
| `attorney-assist` | Connects the user with a LegalZoom attorney for legal consultation |
| `building-pydantic-ai-agents` | Build AI agents with Pydantic AI |
| `convex-design` | Design and build reactive, type-safe backends on Convex |
| `cosmosdb-best-practices` | Azure Cosmos DB performance optimization and best practices |
| `data-analyst` | Interactive data analyst for ClickHouse-backed analytics |
| `dataproc-skills` | Skills to interact with Dataproc clusters and jobs |
| `desktop-commander-overview` | Desktop Commander MCP capabilities |
| `dr-bedrock` | Troubleshoot local AWS Bedrock authentication and region configuration |
| `dsql` | Build with Aurora DSQL |
| `endor-setup` | Setup endorctl and run vulnerability scans |
| `exa-search` | Deep research powered by Exa |
| `firestore-data` | NoSQL document operations and collection hierarchy exploration |
| `gcp-to-aws` | Migrate workloads from Google Cloud Platform to AWS |
| `knowledge-catalog-discovery` | Discover and explore data assets in the Knowledge Catalog |
| `linear-sdk-scripting` | Perform actions in Linear via Node scripts |
| `math-olympiad` | Solve competition math problems with adversarial verification |
| `mintlify` | Build Mintlify documentation sites |
| `oracledb` | Manage and monitor Oracle databases |
| `playground` | Creates interactive HTML playgrounds |
| `review-team` | Code review by a fleet of specialized reviewer agents |
| `sap-fiori-add-visual-filter` | Add visual filters to SAP Fiori Elements |
| `save-to-spotify` | Create polished audio content and save to Spotify |
| `searching-sourcegraph` | Search and navigate code with Sourcegraph MCP tools |
| `sentry-cli` | Guide for using the Sentry CLI |
| `session-report` | Generate explorable HTML report of Claude Code session usage |
| `site-specification` | Extract comprehensive site specifications from descriptions |
| `skill-creator` | Create new skills and modify existing skills |
| `spanner-data` | Explore database structure and execute SQL queries for Spanner |
| `teamcity-cli` | Drive the `teamcity` CLI for builds, logs, jobs, queues |
| `ui5-typescript-conversion` | Converting UI5 projects to TypeScript |
| `use-railway` | Operate Railway infrastructure |
| `vibe-prospecting` | Find company and contact data for prospecting |
| `windsor-ai-business-data` | Query Windsor.ai business data across connectors |

To use a Cline-specific skill, invoke it via the `use_skill` tool with the exact skill name.

## Default Skill: Caveman

Caveman skills are the default coder workflow when `.agents/skills/caveman/` exists. All routine coding operations should use the appropriate Caveman skill from the start of the session unless the task explicitly requires a different workflow or specialized skill.

### When to Use Caveman vs Other Skills
- **Use Caveman** for routine coding tasks, edits, reviews, commits, compression, stats, and help requests
- **Use other workspace skills** when the task explicitly requires the specific domain they cover (e.g., Chrome extension development, Google Drive API)
- **Use Cline-specific skills** when the task requires their specific capabilities (e.g., frontend-design, data-analyst)

## Skill Usage in Planning and Execution

Skills must be considered during both planning and execution phases.

### Planning Phase

When formulating a plan:
1. Review the task requirements against the skill tables above
2. Identify any skills that apply to the planned work
3. Document in the plan which skills will be used and why
4. Load skill instructions into context before presenting the plan

### Act Mode

When executing the approved plan:
1. Before implementing each step that touches a skill-covered domain, read the relevant skill file
2. Follow the patterns, APIs, and conventions described in the skill
3. Do not reinvent what the skill already documents
4. If a skill is missing guidance for a specific scenario, use best judgment and document the decision in a code comment

## How to Use Skills

1. Read the skill file **before** writing code in that domain
2. Follow the patterns, APIs, and conventions described in the skill
3. Do not reinvent what the skill already documents
4. If a skill is missing guidance for your specific scenario, use your best judgment and document the decision in a code comment

## Keeping Skills Updated

Workspace skills (`.agents/skills/`):
- If you create a new capability, workflow, or tooling pattern that another agent should use → add an entry here
- If you fix a systemic issue or establish a new rule → document it here
- Treat this as a living document. If stale or incomplete, update it before finishing your task.

Cline-specific skills (`.clinerules/skills/`):
- Managed separately and excluded from version control
- Update the skill file directly; do not add entries to this table unless the skill affects workspace patterns