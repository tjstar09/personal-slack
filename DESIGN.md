# Personal Slack — Current Design Language

This document defines the active design system for the Personal Slack extension. It serves as the single source of truth for design tokens, component patterns, and visual identity.

**Active Design**: Neobrutalism (from `.agents/skills/awesome-design-skills-main/skills/neobrutalism/`) — **Dual Mode: Light & Dark**
**Last Updated**: 2025-07-18

---

## Design Tokens

### Color Palette — Light Mode (Default)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#432DD7` | Primary accent (purple) — main actions, highlights |
| `--color-primary-hover` | `#5B3CE6` | Primary hover state |
| `--color-secondary` | `#FDC800` | Secondary accent (yellow) — secondary actions |
| `--color-secondary-hover` | `#F5C000` | Secondary hover state |
| `--color-success` | `#16A34A` | Success states, confirmations |
| `--color-warning` | `#D97706` | Warning states |
| `--color-danger` | `#DC2626` | Error, destructive actions |
| `--color-surface` | `#FBFBF9` | Primary background, cards, panels |
| `--color-surface-elevated` | `#FBFBF9` | Elevated surfaces (modals, dropdowns) |
| `--color-text` | `#1C293C` | Primary text |
| `--color-text-muted` | `#6B7280` | Muted text, placeholders, secondary info |
| `--color-border` | `#1C293C` | All borders (bold, high contrast) |
| `--color-border-subtle` | `#E5E7EB` | Subtle borders for nested elements |
| `--color-neutral` | `#FBFBF9` | Neutral backgrounds (same as surface) |
| `--color-muted` | `#6B7280` | Muted text, placeholders, secondary info |

### Color Palette — Dark Mode (`.dark` class on `<html>`)

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary` | `#A78BFA` | Primary accent (purple) — lightened for dark mode |
| `--color-primary-hover` | `#8B5CF6` | Purple hover |
| `--color-secondary` | `#FDC800` | Secondary accent (yellow) — **unchanged**, pops on dark |
| `--color-secondary-hover` | `#F5C000` | Yellow hover |
| `--color-success` | `#4ADE80` | Success states — lightened for dark mode |
| `--color-warning` | `#FBBF24` | Warning states — lightened for dark mode |
| `--color-danger` | `#F87171` | Error, destructive — lightened for dark mode |
| `--color-surface` | `#0F1419` | Primary background — near-black warm dark |
| `--color-surface-elevated` | `#1C293C` | Elevated surfaces (cards, panels, modals, dropdowns) |
| `--color-text` | `#FBFBF9` | Primary text — warm white |
| `--color-text-muted` | `#D1D5DB` | Muted text, placeholders (lighter for visibility) |
| `--color-border` | `#FBFBF9` | **All borders — warm white (key neobrutalism trait)** |
| `--color-border-subtle` | `#374151` | Subtle borders for nested elements |
| `--color-neutral` | `#0F1419` | Neutral backgrounds (same as surface) |
| `--color-muted` | `#D1D5DB` | Muted text, placeholders, secondary info (lighter for visibility) |

### Theme Toggle Implementation

The theme toggle is implemented via a `.dark` class on the `<html>` element:
- **Light mode (default)**: No class on `<html>`, uses `:root` tokens
- **Dark mode**: `.dark` class on `<html>`, overrides all color tokens
- **Persistence**: User preference saved to `chrome.storage.local` under key `theme-preference`
- **System preference fallback**: On first load, respects `prefers-color-scheme: dark` if no saved preference

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
| `--space-5` | 20px |
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

**Dark mode shadows** (used sparingly):
- `--shadow-sm`: `0 1px 2px rgba(0,0,0,0.3)`
- `--shadow-md`: `0 4px 12px rgba(0,0,0,0.4)`
- `--shadow-lg`: `0 8px 24px rgba(0,0,0,0.5)`
- `--shadow-xl`: `0 16px 48px rgba(0,0,0,0.6)`

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
- **Dual-mode interface** — both light and dark themes fully polished
- Sharp edges, thick borders, vivid accent colors
- No gradients, no glows, no subtle shadows — honest, unapologetic UI

### Key Visual Characteristics
1. **Dual theme support** — both light and dark themes are first-class citizens
2. **Thick borders everywhere** — 2-4px solid borders on all interactive elements
3. **High contrast** — warm white text on near-black (dark) / dark navy on warm off-white (light)
4. **Yellow primary** (`#FDC800`) for CTAs, purple secondary (`#A78BFA` dark / `#432DD7` light) for alternatives
5. **Offset hover states** — elements shift `translate(-2px, -2px)` with border emphasis
6. **No border-radius on primary buttons** — sharp corners (4px max for inputs)
7. **Monospace for labels/captions** — JetBrains Mono for technical feel
8. **Theme toggle** — sun/moon icon button in top bar (More actions dropdown)

---

## Component Patterns

### Buttons

| Variant | Background | Border | Text | Usage |
|---------|------------|--------|------|-------|
| Primary | `--color-primary` | 3px solid `--color-border` | `--color-text` | Main actions |
| Secondary | `--color-surface-elevated` | 3px solid `--color-border` | `--color-text` | Secondary actions |
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

- Background: `--color-surface-elevated`
- Border: `3px solid var(--color-border)`
- Text: `--color-text`
- Placeholder: `--color-text-muted`
- Radius: `--radius-sm` (4px)
- Height: 40px minimum
- **Focus**: `outline: 3px solid var(--color-border)`, `outline-offset: 2px`

### Cards / Panels

- Background: `--color-surface-elevated`
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
- **Section headers**: 12px, weight 700, uppercase, tracking 0.5px, `--color-text-muted`, font: `--font-mono`
- **Body**: 14px, weight 400, `--color-text`
- **Meta/small**: 12px, weight 400, `--color-text-muted`
- **Code**: 13px, `--font-mono`, `--color-secondary`

---

## Dark Mode Specifics

### Border Strategy
- **All interactive borders**: `3px solid var(--color-border)` → warm white (`#FBFBF9`)
- **Subtle/nested borders**: `2px solid var(--color-border-subtle)` → `#374151`
- **Focus outlines**: `3px solid var(--color-border)` → warm white

### Surface Elevation
- **Base surface** (`--color-surface`): `#0F1419` — main background
- **Elevated surface** (`--color-surface-elevated`): `#1C293C` — cards, panels, modals, dropdowns
- **Active/selected states**: `--color-primary` background (`#FDC800`)

### Accent Colors (Adjusted for Dark)
- **Primary (yellow)**: `#FDC800` — **unchanged**, pops perfectly on dark
- **Secondary (purple)**: `#A78BFA` (default) → `#8B5CF6` (hover) — lightened from `#432DD7`
- **Success**: `#4ADE80` — lightened from `#16A34A`
- **Warning**: `#FBBF24` — lightened from `#D97706`
- **Danger**: `#F87171` — lightened from `#DC2626`

---

## Accessibility Standards

- **Contrast**: All text meets WCAG 2.2 AA (4.5:1 normal, 3:1 large) — warm white on near-black = 15.8:1
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
- ❌ Using light mode tokens in dark mode without adaptation
- ❌ Assuming dark mode is the only theme — **both themes must render correctly**

---

## Quality Gates

Before merging UI changes:

- [ ] All colors reference design tokens (CSS variables)
- [ ] Spacing uses 4px increments
- [ ] Focus states visible and accessible (3px outline)
- [ ] **Both light and dark themes render correctly**
- [ ] Components work at 420px min-width (side panel constraint)
- [ ] No console errors/warnings in devtools
- [ ] Hover/active/focus states tested on all interactive elements
- [ ] `prefers-reduced-motion` respected
- [ ] Dark mode borders are warm white (`--color-border`), not dark

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

- Current implementation: `v1.0/entrypoints/sidepanel/src/styles/tokens.css` (modular CSS)
- Available design skills: `.agents/skills/awesome-design-skills-main/skills/`
- Design skill registry: `.agents/skills/awesome-design-skills-main/skills/index.json`
- Neobrutalism skill: `.agents/skills/awesome-design-skills-main/skills/neobrutalism/SKILL.md`