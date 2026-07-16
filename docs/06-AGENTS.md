# Agent Skill References — v1.0

## Skill Directories

This project uses three skill directories:

| Directory | Purpose | Version Control |
|-----------|---------|-----------------|
| `.agents/skills/` | Workspace-specific skills, committed to git | Tracked |
| `.agents/skills/awesome-design-skills-main/skills/` | Design system skills (67 design languages), committed to git | Tracked |
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

## Design System Skills (`.agents/skills/awesome-design-skills-main/skills/`)

A curated registry of **67 design system skills** for AI-powered agentic tools. Each skill lives in its own folder under `skills/` with:
- `SKILL.md` — AI-agent instruction file (tokens, component rules, accessibility, quality gates)
- `DESIGN.md` — Human-readable design intent, rationale, and implementation notes

The complete registry is defined in `.agents/skills/awesome-design-skills-main/skills/index.json` (slug-keyed map for fast lookups).

### Available Design Skills (67)

| Design | Slug | Description |
|--------|------|-------------|
| Agentic | `agentic` | AI-native design for agentic interfaces |
| Ant Design | `ant` | Ant Design system adaptation |
| Artistic | `artistic` | Expressive, creative visual language |
| Basic | `basic` | Foundational, no-frills design |
| Bento | `bento` | Grid-based bento box layouts |
| Bold | `bold` | High-contrast, assertive visual weight |
| Brutalism | `brutalism` | Raw, unpolished, honest materials |
| Cafe | `cafe` | Warm, inviting, coffee-shop aesthetic |
| Claymorphism | `claymorphism` | Soft 3D clay-like UI elements |
| Clean | `clean` | Crisp, orderly, minimal visual noise |
| Colorful | `colorful` | Vibrant, expressive color usage |
| Contemporary | `contemporary` | Modern, current design trends |
| Corporate | `corporate` | Professional, enterprise-ready |
| Cosmic | `cosmic` | Space-inspired, deep gradients |
| Creative | `creative` | Imaginative, unconventional patterns |
| Dithered | `dithered` | Retro dithering texture effects |
| Doodle | `doodle` | Hand-drawn, sketchy personality |
| Dramatic | `dramatic` | High contrast, theatrical lighting |
| Editorial | `editorial` | Magazine-style typographic layouts |
| Enterprise | `enterprise` | Scalable, governance-ready systems |
| Expressive | `expressive` | Emotion-driven, dynamic visuals |
| Fantasy | `fantasy` | Magical, otherworldly aesthetics |
| Fiction | `fiction` | Narrative-driven design language |
| Flat | `flat` | 2D, no shadows or depth |
| Friendly | `friendly` | Approachable, warm, rounded |
| Futuristic | `futuristic` | Sci-fi, forward-looking aesthetics |
| Geometric | `geometric` | Shape-driven, mathematical precision |
| Glassmorphism | `glassmorphism` | Frosted glass, translucent layers |
| Gradient | `gradient` | Rich gradient-based color system |
| Immersive | `immersive` | Full-bleed, enveloping experiences |
| Impeccable | `impeccable` | Pixel-perfect, refined craftsmanship |
| Levels | `levels` | Layered depth and hierarchy |
| Lingo | `lingo` | Typography-centric, word-focused |
| Material | `material` | Google Material Design adaptation |
| Matrix | `matrix` | Terminal/code-inspired monospace |
| Minimal | `minimal` | Whitespace, restraint, clarity |
| Modern | `modern` | Current best practices, clean |
| Mono | `mono` | Monochromatic, single-hue focus |
| Neobrutalism | `neobrutalism` | Bold borders, raw aesthetics |
| Neon | `neon` | Glowing, dark-mode neon accents |
| Neumorphism | `neumorphism` | Soft extruded, tactile surfaces |
| Pacman | `pacman` | Retro gaming, pixel-art inspired |
| Paper | `paper` | Physical paper texture, layers |
| Perspective | `perspective` | 3D depth, spatial awareness |
| Power | `power` | High-energy, dynamic impact |
| Premium | `premium` | Luxury, high-end polish |
| Professional | `professional` | Business-appropriate, trustworthy |
| Pulse | `pulse` | Rhythmic, animated vitality |
| Refined | `refined` | Polished, sophisticated details |
| Retro | `retro` | Vintage, nostalgic references |
| Riso | `riso` | Risograph print texture aesthetic |
| Roku | `roku` | TV interface, 10-foot experience |
| Sega | `sega` | 90s gaming, blue-sky aesthetic |
| Shadcn | `shadcn` | shadcn/ui component style |
| Sketch | `sketch` | Hand-sketched, wireframe feel |
| Skeumorphism | `skeumorphism` | Real-world material metaphors |
| Sleek | `sleek` | Smooth, streamlined, polished |
| Spacious | `spacious` | Generous whitespace, breathing room |
| Square | `square` | Sharp corners, grid alignment |
| Stitch | `stitch` | Sewn, crafted, textile texture |
| Storytelling | `storytelling` | Narrative flow, sequential design |
| Terracotta | `terracotta` | Earthy, warm clay tones |
| Tetris | `tetris` | Block-based, modular grid |
| Vibrant | `vibrant` | High-saturation, energetic color |
| Vintage | `vintage` | Aged, time-worn patina |

### Design Skill Usage Rules

**⚠️ CRITICAL: Single Design Rule**
- **Only ONE design skill may be active at a time.** Do not load multiple design skills simultaneously.
- The active design is defined in the root `DESIGN.md` file.
- When the user requests a design change, load the selected skill's `SKILL.md` and update `DESIGN.md` accordingly.

**Design Selection Workflow:**
1. User expresses interest in a design (e.g., "use glassmorphism")
2. AI reads the skill's `SKILL.md` from `.agents/skills/awesome-design-skills-main/skills/<slug>/SKILL.md`
3. AI reads the skill's `DESIGN.md` for human context
4. AI updates the root `DESIGN.md` with the new design tokens and patterns
5. AI implements the design in the codebase (CSS variables, components)

**Permanent Design Changes:**
- To change the design language completely, **update the root `DESIGN.md` first**.
- `DESIGN.md` is the single source of truth for the current design language.
- All implementation (CSS, components) must derive from `DESIGN.md`.
- Never mix tokens/rules from multiple design skills.

**When to Use Design Skills vs `frontend-design`:**
- Use **design skills** when implementing a specific design system (tokens, components, patterns from a named design language)
- Use **`frontend-design`** (Cline skill) for general UI/UX guidance, custom designs, or when no specific design system applies

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