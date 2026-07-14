# Capture Button — Feature Plan (Saved for Future Implementation)

This document records the feature discussion and architectural plan for improving the capture button experience. Implement when ready on a dedicated `feature/capture-overhaul` branch.

---

## Overview

8 improvements proposed:

1. **Split-button Capture** — main "Capture" action + dropdown "Capture & Send"
2. **Capture Preview Popup** — overlay with rendered preview + Discard/Edit/Send buttons
3. **Inline Visual Feedback (Toast)** — top-right toast replacing bottom-left status for captures
4. **Smart Capture Modes** — Full (default) / Standard / Minimal, cycle via badge on button
5. **Capture History Dropdown** — clock icon, last 10 captures with favicon + title + timestamp
6. **Auto-Expand Markdown Preview** — on Edit action, auto-expand the collapsible preview
7. **Enhanced Capture Message Format** — richer markdown with mode badge, timestamp, favicon, better sections
8. **Mode Cycling on Existing Captures** — user can cycle capture mode even after capture is done (re-capture)

---

## UX Flow

```
User clicks Capture
  → captureTab() runs with current mode (Full/Standard/Minimal)
  → Capture Preview Popup appears (overlay)
    → Shows rendered capture + mode indicator
    → User can:
      a) Send → posts message directly to current conversation
      b) Edit → moves content to composer (auto-expands preview)
      c) Discard → closes popup, nothing saved
      d) Cycle mode → re-captures with new mode, updates preview

User clicks "Capture & Send" (split-button dropdown item)
  → captureTab() runs with current mode
  → Posts directly to current conversation
  → Toast notification: ✅ "Captured: [page title]"
```

---

## Components to Build

### A. Capture Button Redesign (`App.tsx` top-bar)
- **Split-button**: Main section (Capture) + dropdown arrow ▼
- **Mode badge**: Small pill on button showing current mode (`F` / `S` / `M`)
- **Click on mode badge**: Cycles through Full → Standard → Minimal → Full
- **Dropdown** from ▼ arrow:
  - "Capture & Send" — direct post, no preview
  - "Capture to Draft" — show preview popup (same as main click)
  - Separator
  - Current mode indicator + option to change
- **Visual feedback**: Button briefly shows checkmark (✅) with green tint for 1.5s on success, or ❌ red for failure

### B. Capture Preview Popup (new overlay in `App.tsx`)
- **Overlay style**: Centered card (matching existing onboarding/send-to styling), ~500-600px wide
- **Content**:
  - **Header**: "Capture Preview" + X close button
  - **Rendered preview**: Shows the markdown fully rendered (links, OG image, blockquotes)
  - **Mode bar**: Current mode indicator (clickable to cycle) + "Re-capture" button
  - **Footer actions**:
    - **Discard** (secondary/danger) — closes popup, discards
    - **Edit** (secondary) — moves content to composer textarea + auto-expands markdown preview, closes popup
    - **Send** (primary/accent) — posts to current conversation, shows toast, closes popup
- **Keyboard**: Esc to close, Enter to Send

### C. Capture History Dropdown
- **Trigger**: Small clock/history icon button next to capture button
- **Dropdown**: Shows last 10 captures with:
  - Page favicon (via `https://www.google.com/s2/favicons?domain=...`)
  - Page title (truncated)
  - Domain
  - Timestamp (relative: "2 min ago")
- **Click item**: Opens that capture in the preview popup
- **Storage**: In-memory array (last 10), optionally pinned history in workspace data
- **Clear**: "Clear history" option at bottom

### D. Toast Notification System
- **Position**: Fixed top-right, near the capture button area
- **Style**: Minimal card with icon + message, auto-fades after 3s
- **Types**:
  - ✅ Success: "Captured: [title]"
  - ✅ Sent: "Capture posted to [conversation name]"
  - ❌ Error: "Capture failed: [reason]"
- Reuses status infrastructure but adds a dedicated toast component for captures

### E. Capture Mode System

| Mode | Extraction | Use Case |
|---|---|---|
| **Full** (default) | OG tags + meta desc + selected text + OG image + enhanced formatting with timestamp | Rich captures, articles, documentation |
| **Standard** | Title + URL + meta description + selected text | Clean captures without OG clutter |
| **Minimal** | Title + URL only | Quick link-sharing, formatting not needed |

- **State**: `captureMode` state in App.tsx, persisted per session
- **Mode cycling**: Click the mode badge on the button to cycle; also in preview popup

### F. Enhanced Capture Message Format

Current format is basic markdown. Proposed enhanced format:

```markdown
📸 **Full Capture** · [Title](url) · *host* · Captured {time ago}

---
**Description**: {meta/og description}
---

{OG image if present}

> Selected text (if present)

---
*Captured at {ISO timestamp} from {domain}*
```

Key additions: mode badge emoji, relative time, ISO timestamp in footer, better section dividers.

---

## File Changes Summary

| File | Changes |
|---|---|
| `App.tsx` | Split-button capture, mode state, preview popup overlay, history dropdown, toast component, auto-expand preview, capture history array |
| `captureTab.ts` | Add mode parameter, extraction variants (minimal/standard/full), enhanced markdown builder |
| `styles.css` | Styles for split-button, preview popup, mode badge, history dropdown, toast |
| `types.ts` | Add `CaptureMode` type, `CaptureHistoryEntry` interface |
| `background.ts` | Update `buildQuickCaptureBody` to accept mode + enhanced format |
| `docs/` | Update features, architecture, element reference |

---

## Implementation Order

1. Capture Mode system — types, state, mode indicator, cycling
2. Enhanced capture message format — richer markdown with timestamp/mode/favicon
3. Split-button capture button — main action + dropdown
4. Capture Preview Popup — overlay with Discard/Edit/Send
5. Toast notification — top-right feedback (merged visual feedback)
6. Capture History Dropdown — clock icon + last 10 captures
7. Auto-expand preview on Edit — CSS/state tweak