# Personal Slack — Current Design Language

This document defines the active design system for the Personal Slack extension. It serves as the single source of truth for design tokens, component patterns, and visual identity.

**Active Design**: Custom Dark Theme (derived from `v1.0/entrypoints/sidepanel/src/styles.css`)
**Last Updated**: 2025-07-16

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--bg` | `#111418` | Primary background |
| `--bg-elevated` | `#161b22` | Elevated surfaces (cards, modals) |
| `--panel` | `#1c2128` | Panel backgrounds |
| `--panel-2` | `#21262d` | Secondary panels |
| `--panel-3` | `#30363d` | Tertiary panels, hover states |
| `--line` | `#30363d` | Borders, dividers |
| `--line-strong` | `#484f58` | Strong borders, focus rings |
| `--text` | `#e6edf3` | Primary text |
| `--text-muted` | `#8b949e` | Secondary text |
| `--muted` | `#6e7681` | Muted text, placeholders |
| `--accent` | `#25c2a0` | Primary accent (teal) |
| `--accent-weak` | `#25c2a033` | Weak accent backgrounds |
| `--accent-strong` | `#1ea88c` | Strong accent (hover/active) |
| `--accent-gold` | `#f0b429` | Secondary accent (gold) |
| `--accent-gold-weak` | `#f0b42933` | Weak gold backgrounds |
| `--danger` | `#f85149` | Error, destructive actions |
| `--danger-weak` | `#f8514933` | Weak danger backgrounds |
| `--success` | `#3fb950` | Success states |
| `--info` | `#58a6ff` | Info states, links |

### Typography

| Token | Value |
|-------|-------|
| `--font-family` | `'Outfit', 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

**Scale** (approximate, from CSS):
- Display: 2.5rem / 32px
- H1: 1.5rem / 24px
- H2: 1.25rem / 20px
- Body: 0.875rem / 14px
- Small: 0.75rem / 12px
- Micro: 0.625rem / 10px

### Spacing Scale

Base unit: 4px

| Token | Value |
|-------|-------|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |
| `--space-16` | 64px |

### Border Radius

| Token | Value |
|-------|-------|
| `--radius-sm` | 4px |
| `--radius-md` | 6px |
| `--radius-lg` | 8px |
| `--radius-xl` | 12px |
| `--radius-full` | 9999px |

### Shadows

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.3)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.35)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.4)` |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.45)` |
| `--shadow-glow` | `0 0 0 3px var(--accent-weak)` |

### Transitions

| Token | Value |
|-------|-------|
| `--transition-fast` | `120ms ease` |
| `--transition-normal` | `200ms ease` |
| `--transition-slow` | `300ms ease` |

### Z-Index Scale

| Layer | Value |
|-------|-------|
| Base | 1 |
| Dropdown | 100 |
| Modal/Overlay | 1000 |
| Toast | 2000 |
| Onboarding | 3000 |

---

## Visual Identity

### Brand Personality
- **Technical, developer-focused, efficient**
- Dark-first interface optimized for side-panel usage
- Subtle depth via noise texture and layered elevation
- Teal accent conveys trust, clarity, modern tooling

### Key Visual Characteristics
1. **Dark theme by default** — reduces eye strain in side panel context
2. **Noise texture overlay** — adds tactile depth without heaviness
3. **Elevation layers** — 4 distinct panel levels create hierarchy
4. **Rounded corners (6-8px)** — friendly but precise
5. **Subtle glow on focus** — accessibility-first focus states
6. **Micro-interactions** — hover lift, smooth transitions

---

## Component Patterns

### Buttons

| Variant | Background | Border | Text | Usage |
|---------|------------|--------|------|-------|
| Primary | `--accent` | none | `#0d1117` | Main actions |
| Secondary | transparent | `--line` | `--text` | Secondary actions |
| Ghost | transparent | none | `--text-muted` | Subtle actions |
| Danger | `--danger` | none | white | Destructive |
| Icon | transparent | none | `--text-muted` | Toolbar actions |

**States**: hover (brighten 10%), active (darken 10%), focus (glow ring), disabled (opacity 0.4)

### Inputs
- Background: `--panel`
- Border: `--line` (default), `--accent` (focus)
- Text: `--text`
- Placeholder: `--muted`
- Radius: `--radius-md`
- Height: 32px minimum

### Cards / Panels
- Background: `--panel` or `--panel-2`
- Border: `1px solid var(--line)`
- Radius: `--radius-lg`
- Padding: `--space-4` (16px)

### Navigation
- **Rail**: 56px fixed, icon-only, `--panel` background
- **Sidebar**: 180-255px, collapsible, `--bg-elevated`
- **Active states**: `--accent-weak` background + `--accent` left border

### Typography Hierarchy
- **Page titles**: 20px, weight 600, `--text`
- **Section headers**: 12px, weight 700, uppercase, tracking 0.5px, `--muted`
- **Body**: 14px, weight 400, `--text`
- **Meta/small**: 12px, weight 400, `--text-muted`
- **Code**: 13px, `--font-mono`, `--accent-gold`

---

## Accessibility Standards

- **Contrast**: All text meets WCAG 2.2 AA (4.5:1 normal, 3:1 large)
- **Focus**: Visible 3px glow ring using `--accent-weak`
- **Motion**: Respects `prefers-reduced-motion`
- **Keyboard**: All interactive elements reachable and operable
- **ARIA**: Proper labels, roles, and live regions for dynamic content

---

## Anti-Patterns (What to Avoid)

- ❌ Mixing design tokens from other design systems
- ❌ Hardcoding color values instead of using CSS variables
- ❌ Using more than 3 elevation levels simultaneously
- ❌ Adding decorative animations without purpose
- ❌ Breaking the 4px spacing grid without 4px base spacing
- ❌ Overriding focus styles for aesthetics

---

## Quality Gates

Before merging UI changes:
- [ ] All colors reference design tokens (CSS variables)
- [ ] Spacing uses 4px increments
- [ ] Focus states visible and accessible
- [ ] Dark theme renders correctly (no hardcoded light colors)
- [ ] Components work at 420px min-width (side panel constraint)
- [ ] No console errors/warnings in devtools

---

## Migration Notes

When switching to a new design skill (e.g., from `.agents/skills/awesome-design-skills-main/skills/glassmorphism/`):

1. Read the skill's `SKILL.md` for AI implementation rules
2. Read the skill's `DESIGN.md` for human-readable design intent
3. Update **this file** (`DESIGN.md`) with the new tokens and patterns
4. Migrate CSS variables in `styles.css` to match new tokens
5. Update component implementations to follow new patterns
6. Run quality gates checklist above

---

## References

- Current implementation: `v1.0/entrypoints/sidepanel/src/styles.css`
- Available design skills: `.agents/skills/awesome-design-skills-main/skills/`
- Design skill registry: `.agents/skills/awesome-design-skills-main/skills/index.json`