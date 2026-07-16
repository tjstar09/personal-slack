# Awesome Design Skills 

<br>

> A curated registry of 67 design system skill files for AI-powered agentic tools like [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview), [Cursor](https://www.cursor.com/), [Codex](https://openai.com/index/codex/), and others. Pull any skill into your project with a single command.

Each skill now ships as a folder with:
- `SKILL.md` for AI-agent instructions (tokens, component rules, accessibility constraints, quality gates)
- `DESIGN.md` for human-readable design intent, rationale, and implementation notes


## What is a Design Skill?

A design skill is a folder containing `SKILL.md` and `DESIGN.md`.

`SKILL.md` acts as the instruction source for AI agents and LLMs. It contains:

- **Brand & mission** — the design philosophy and visual identity
- **Style foundations** — typography scale, color palette, spacing system
- **Component families** — buttons, inputs, cards, modals, navigation, and more
- **Accessibility rules** — WCAG 2.2 AA compliance, keyboard-first interactions
- **Writing tone** — content and voice guidelines
- **Do/Don't rules** — explicit patterns and anti-patterns
- **Quality gates** — testable acceptance criteria for code review

`DESIGN.md` is a companion document for human readers and maintainers. It captures:

- **Design overview** — concise summary of the visual direction
- **Rationale and references** — context for why patterns/tokens exist
- **Maintenance notes** — guidance for keeping design decisions aligned over time

When an AI agent reads a skill file, it follows the `SKILL.md` guidelines to generate UI code that is consistent, accessible, and true to the design system.


## Registry Structure

Each skill lives in its own folder under `skills/`:

```
skills/
├── index.json          # Slug-keyed map for fast CLI lookups
├── glassmorphism/
│   ├── SKILL.md        # AI-agent instruction file
│   └── DESIGN.md       # Human-readable design companion
├── brutalism/
│   ├── SKILL.md
│   └── DESIGN.md
├── minimal/
│   ├── SKILL.md
│   └── DESIGN.md
└── ...
```

The `index.json` file maps each slug to its skill path:

```json
{
  "glassmorphism": {
    "slug": "glassmorphism",
    "name": "Glassmorphism",
    "skillPath": "skills/glassmorphism/SKILL.md"
  }
}
```


## License

[MIT License](LICENSE) &copy; Built and maintained by [Bergside](https://github.com/bergside).