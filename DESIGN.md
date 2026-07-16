# Personal Slack — Current Design Language

This document defines the active design system for the Personal Slack extension. It serves as the single source of truth for design tokens, component patterns, and visual identity.

**Active Design**: Neobrutalism (from `.agents/skills/awesome-design-skills-main/skills/neobrutalism/`)
**Last Updated**: 2025-07-16

---

## Design Tokens

### Color Palette

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#FDC800` | Primary accent (yellow) — main actions, highlights |
| `--color-secondary` | `#432DD7` | Secondary accent (purple) — secondary actions |
| `--color-success` | `#16A34A` | Success states, confirmations |
| `--color-warning` | `#D97706` | Warning states |
| `--color-danger` | `#DC2626` | Error, destructive actions |
| `--color-surface` | `#FBFBF9` | Primary background, cards, panels |
| `--color-text` | `#1C293C` | Primary text, borders |
| `--color-neutral` | `#FBFBF9` | Neutral backgrounds (same as surface) |
| `--color-border` | `#1C293C` | All borders (bold, high contrast) |
| `--color-muted` | `#6B7280` | Muted text, placeholders, secondary info |

### Typography

| Token | Value |
|-------|-------|
| `--font-family` | `'Inter', 'Geist', ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif` |
| `--font-mono` | `'JetBrains Mono', 'Fira Code', ui-monospace, SFMono-Regular, Menlo, Consolas, monospace` |

**Scale** (approximate, from CSS):
- Display: 2.1875rem / 35px
- H1: 1.5rem / 24px
- H2: 1.25rem / 20px
- Body: 0.9375rem / 15px
- Small: 0.8125rem / 13px
- Micro: 0.6875rem / 11px

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
| `--radius-md` | 8px |
| `--radius-lg` | 12px |
| `--radius-xl` | 16px |
| `--radius-full` | 9999px |

### Shadows

Neobrutalism uses **bold borders instead of shadows** for elevation. Minimal shadow tokens kept for backward compatibility:

| Token | Value |
|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.05)` |
| `--shadow-md` | `0 4px 12px rgba(0,0,0,0.1)` |
| `--shadow-lg` | `0 8px 24px rgba(0,0,0,0.15)` |
| `--shadow-xl` | `0 16px 48px rgba(0,0,0,0.2)` |

**Primary elevation**: `border: 3px solid var(--color-border)` + `transform: translate(-2px, -2px)` on hover/active

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
- **Bold, raw, high-contrast, developer-focused**
- Light-first interface optimized for side-panel usage
- Sharp edges, thick borders, vivid accent colors
- No gradients, no glows, no subtle shadows — honest, unapologetic UI

### Key Visual Characteristics
1. **Light theme only** — warm off-white surface (`#FBFBF9`)
2. **Thick borders everywhere** — 2-4px solid `#1C293C` on all interactive elements
3. **High contrast** — navy text (`#1C293C`) on warm white
4. **Yellow primary** (`#FDC800`) for CTAs, purple secondary (`#432DD7`) for alternatives
5. **Offset hover states** — elements shift `translate(-2px, -2px)` with border emphasis
6. **No border-radius on primary buttons** — sharp corners (4px max for inputs)
7. **Monospace for labels/captions** — JetBrains Mono for technical feel

---

## Component Patterns

### Buttons

| Variant | Background | Border | Text | Usage |
|---------|------------|--------|------|-------|
| Primary | `--color-primary` | 3px solid `--color-border` | `--color-text` | Main actions |
| Secondary | `--color-surface` | 3px solid `--color-border` | `--color-text` | Secondary actions |
| Ghost | transparent | 2px solid transparent | `--color-text` | Subtle actions |
| Danger | `--color-danger` | 3px solid `--color-border` | white | Destructive |
| Icon | transparent | 2px solid transparent | `--color-muted` | Toolbar actions |

**States** (all variants):
- **Default**: as above
- **Hover**: `transform: translate(-2px, -2px)`, border remains
- **Active**: `transform: translate(1px, 1px)`
- **Focus**: `outline: 3px solid var(--color-border)`, `outline-offset: 2px`
- **Disabled**: `opacity: 0.4`, `cursor: not-allowed`, no transform

### Inputs

- Background: `--color-surface`
- Border: `3px solid var(--color-border)`
- Text: `--color-text`
- Placeholder: `--color-muted`
- Radius: `--radius-sm` (4px)
- Height: 40px minimum
- **Focus**: `outline: 3px solid var(--color-border)`, `outline-offset: 2px`

### Cards / Panels

- Background: `--color-surface`
- Border: `3px solid var(--color-border)`
- Radius: `--radius-md` (8px)
- Padding: `--space-4` (16px)
- **Hover**: `transform: translate(-2px, -2px)`

### Navigation

- **Rail**: 56px fixed, icon-only, `--color-surface` background, `3px solid var(--color-border)` right border
- **Sidebar**: 180-255px, collapsible, `--color-surface` background
- **Active states**: `--color-primary` background + `--color-border` left border (4px)

### Typography Hierarchy

- **Page titles**: 20px, weight 700, `--color-text`
- **Section headers**: 12px, weight 700, uppercase, tracking 0.5px, `--color-muted`, font: `--font-mono`
- **Body**: 14px, weight 400, `--color-text`
- **Meta/small**: 12px, weight 400, `--color-muted`
- **Code**: 13px, `--font-mono`, `--color-secondary`

---

## Accessibility Standards

- **Contrast**: All text meets WCAG 2.2 AA (4.5:1 normal, 3:1 large) — navy on warm white = 12.6:1
- **Focus**: Visible 3px outline using `--color-border` with 2px offset
- **Motion**: Respects `prefers-reduced-motion` — disable transforms/transitions
- **Keyboard**: All interactive elements reachable and operable
- **ARIA**: Proper labels, roles, and live regions for dynamic content

---

## Anti-Patterns (What to Avoid)

- ❌ Mixing design tokens from other design systems
- ❌ Hardcoding color values instead of using CSS variables
- ❌ Using shadows for elevation — use thick borders + offset transforms
- ❌ Rounded corners on primary buttons — keep sharp (4px max)
- ❌ Subtle/low-contrast borders — always 2px minimum, 3-4px for interactive
- ❌ Gradients, glows, or blur effects
- ❌ Breaking the 4px spacing grid
- ❌ Overriding focus styles for aesthetics

---

## Quality Gates

Before merging UI changes:

- [ ] All colors reference design tokens (CSS variables)
- [ ] Spacing uses 4px increments
- [ ] Focus states visible and accessible (3px outline)
- [ ] Light theme renders correctly (no hardcoded dark colors)
- [ ] Components work at 420px min-width (side panel constraint)
- [ ] No console errors/warnings in devtools
- [ ] Hover/active/focus states tested on all interactive elements
- [ ] `prefers-reduced-motion` respected

---

## Migration Notes

When switching to a new design skill (e.g., from `.agents/skills/awesome-design-skills-main/skills/neobrutalism/`):

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
- Neobrutalism skill: `.agents/skills/awesome-design-skills-main/skills/neobrutalism/SKILL.md`