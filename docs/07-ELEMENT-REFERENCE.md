# UI Element Reference — Personal Slack v1.0

## Table of Contents
1. [Quick Reference Dictionary](#1-quick-reference-dictionary)
2. [Element Tree](#2-element-tree)
3. [Prompt Patterns](#3-prompt-patterns)
4. [Component → CSS Mapping](#4-component--css-mapping)
5. [Features → Elements Crosswalk](#5-features--elements-crosswalk)

---

## 1. Quick Reference Dictionary

Use these friendly names in prompts. The AI resolves them to exact elements.

| Friendly Name | Canonical ID | CSS Class | Location |
|---|---|---|---|
| brand button | brand | `.brand` | rail |
| capture button | capture-btn | `.command-button[title="Capture current tab"]` | top-bar |
| capture button group | capture-button-group | `.capture-button-group` | top-bar |
| capture mode badge | capture-mode-badge | `.capture-mode-badge` | top-bar > capture-button-group |
| capture dropdown toggle | capture-dropdown-toggle | `.dropdown-toggle` | top-bar > capture-button-group |
| capture dropdown | capture-dropdown | `.capture-dropdown` | top-bar > capture-button-group |
| more actions button | more-btn | `.command-button[title="More actions"]` | top-bar |
| more menu | more-menu | `.slash-suggestions.top-more-menu` | top-bar |
| full window button | full-window-btn | `.icon-button[title="Full Window"]` | top-bar |
| send button | send-btn | `.send-button` | composer |
| tag strip | tag-strip | `.tag-strip` | sidebar |
| page rail | page-rail | `.page-list` | rail |
| page button | page-btn | `.page-button` | rail > page-list |
| new conversation button | new-conv-btn | `.icon-button[title="New conversation"]` | sidebar-header |
| search box | search-box | `.search-box` | sidebar |
| new page input | new-page-input | `.new-page-row input` | sidebar |
| mode tabs | mode-tabs | `.mode-tabs` | sidebar |
| mode button | mode-btn | `.mode-button` | sidebar > mode-tabs |
| conversation card | conversation-card | `.conversation-card` | sidebar > conversation-list |
| pin button | pin-btn | `.mini-button[title="Pin"]` | conversation-card |
| archive button | archive-btn | `.mini-button[title="Archive"]` | conversation-card |
| message bubble | message-bubble | `.message-bubble` | message-stream |
| message actions | message-actions | `.message-actions` | message-bubble |
| copy button | copy-btn | `.mini-button[title="Copy"]` | message-bubble > message-actions |
| send-to-page button | stp-btn | `.mini-button[title="Send to page"]` | message-bubble > message-actions |
| delete button | delete-btn | `.mini-button[title="Delete"]` | message-bubble > message-actions |
| markdown preview | markdown-preview | `.markdown-preview` | chat-view |
| preview toggle | preview-toggle | `.toggle-button` | markdown-preview |
| restore session button | restore-btn | `.restore-session-btn` | markdown-preview / message-bubble |
| message stream | message-stream | `.message-stream` | chat-view |
| inline bookmarks | inline-bookmarks | `.inline-bookmarks` | chat-view |
| bookmark chip | bookmark-chip | `.bookmark-chip` | inline-bookmarks |
| composer | composer | `.composer` | chat-view |
| textarea | composer-textarea | `textarea` | composer |
| composer tools | composer-tools | `.composer-tools` | composer |
| page selector | page-select | `.page-select` | composer-tools |
| tags input | tags-input | `input[placeholder="tags, comma separated"]` | composer-tools |
| slash suggestions | slash-suggestions | `.slash-suggestions` | composer | top-bar |
| slash suggestion item | slash-suggestion-item | `.slash-suggestion-item` | slash-suggestions |
| gallery card | gallery-card | `.gallery-card` | gallery-grid |
| bookmark card | bookmark-card | `.bookmark-card` | bookmarks-grid |
| settings panel | settings-panel | `.settings-panel` | main-panel |
| export button | export-btn | `.command-button.large` | settings-panel > settings-actions |
| Drive sync toggle | drive-sync-toggle | `.drive-toggle input[type="checkbox"]` | settings-panel |
| Drive root folder input | drive-root-input | `.drive-field input` | settings-panel |
| Drive notes folder input | drive-notes-input | `.drive-field input` | settings-panel |
| reset button | reset-btn | `.danger-button` | settings-panel |
| stat card | stat-card | `.stat` | settings-panel > stats-row |
| onboarding overlay | onboarding-overlay | `.onboarding-overlay` | (global) |
| onboarding card | onboarding-card | `.onboarding-card` | onboarding-overlay |
| send-to-page overlay | sendto-overlay | `.sendto-overlay` | (global) |
| send-to-page card | sendto-card | `.sendto-card` | sendto-overlay |
| status message | status-msg | `.main-status` | main-panel |
| animated preview | animated-preview | `.short-preview-animated` | markdown-preview |
| GitHub panel | github-panel | `.github-panel` | message-previews |
| link preview card | link-preview | `.link-preview-card` | message-previews |
| theme toggle (sun) | theme-toggle-sun | `.theme-toggle-sun` | more-menu |
| theme toggle (moon) | theme-toggle-moon | `.theme-toggle-moon` | more-menu |

---

## 2. Element Tree

Hierarchical layout with position, siblings, children, and source references.

### app-shell (`.app-shell`)
- **Path**: root
- **Type**: container
- **Layout**: CSS Grid `grid-template-columns: 56px minmax(180px, 255px) minmax(0, 1fr)`
- **Variant**: `.sidebar-collapsed` collapses middle column
- **Source**: App.tsx ~line 615
- **Children**:
  1. rail (`.rail`)
  2. sidebar (`.sidebar`, conditional on `!sidebarCollapsed`)
  3. main-panel (`.main-panel`)

---

### rail (`.rail`)
- **Path**: app-shell > rail
- **Type**: container
- **Layout**: Flex column, centered
- **Position**: first child of app-shell, always visible
- **Siblings**: sidebar (conditional), main-panel
- **Source**: App.tsx ~line 616
- **Children**:
  - brand (`.brand`)
  - page-list (`.page-list`)

#### brand (`.brand`)
- **Type**: button
- **Purpose**: Toggle sidebar collapsed/expanded
- **Position**: first child of rail
- **Siblings**: page-list
- **Icon**: `PanelRightOpen` or `PanelRightClose`
- **Source**: App.tsx ~line 617

#### page-list (`.page-list`)
- **Type**: container
- **Layout**: Flex column, gap: 10px
- **Position**: second child of rail
- **Siblings**: brand
- **Source**: App.tsx ~line 620
- **Children** (dynamic):
  - page-button (`.page-button`) — one per workspace page
    - variant: `.page-button.active` when selected

##### page-button (`.page-button`)
- **Type**: button
- **Purpose**: Switch to a workspace page
- **Position**: flex row, centered icon + first-letter span
- **Children**: icon (Bookmark or Hash), span (page initial)
- **Source**: App.tsx ~line 622

---

### sidebar (`.sidebar`)
- **Path**: app-shell > sidebar
- **Type**: container
- **Layout**: Flex column, gap: 14px, padding: 16px, overflow hidden
- **Position**: second child of app-shell (conditional)
- **Siblings**: rail (before), main-panel (after)
- **Source**: App.tsx ~line 636
- **Children**:
  - sidebar-header (`.sidebar-header`)
  - search-box (`.search-box`)
  - new-page-row (`.new-page-row`)
  - mode-tabs (`.mode-tabs`)
  - tag-strip (`.tag-strip`, conditional)
  - conversation-list (`.conversation-list`)

#### sidebar-header (`.sidebar-header`)
- **Type**: container
- **Layout**: Flex row, space-between
- **Position**: first child of sidebar
- **Children**: eyebrow + h1 block, new-conv-btn icon-button
- **Source**: App.tsx ~line 637

##### new-conv-btn (`.icon-button[title="New conversation"]`)
- **Type**: button
- **Purpose**: Create a new conversation in the current page
- **Position**: last child of sidebar-header
- **Source**: App.tsx ~line 642

#### search-box (`.search-box`)
- **Type**: input container
- **Layout**: Flex row, centered
- **Position**: second child of sidebar
- **Siblings**: sidebar-header (before)
- **Children**: Search icon, input[placeholder]
- **Source**: App.tsx ~line 647

#### new-page-row (`.new-page-row`)
- **Type**: input container
- **Layout**: Flex row
- **Position**: third child of sidebar
- **Siblings**: search-box (before)
- **Children**: input[placeholder="Create page"], icon-button (create page)
- **Source**: App.tsx ~line 656

##### create-page button (`.icon-button[title="Create page"]`)
- **Type**: button
- **Purpose**: Create a new workspace page
- **Position**: last child of new-page-row
- **Source**: App.tsx ~line 663

#### mode-tabs (`.mode-tabs`)
- **Type**: container
- **Layout**: CSS Grid `grid-template-columns: repeat(4, 1fr)`
- **Position**: fourth child of sidebar
- **Siblings**: new-page-row (before), tag-strip (after)
- **Children** (4):
  - mode-button chat
  - mode-button gallery
  - mode-button bookmarks
  - mode-button settings
- **Source**: App.tsx ~line 668

##### mode-btn (`.mode-button`)
- **Type**: button
- **Purpose**: Switch view mode (chat/gallery/bookmarks/settings)
- **Position**: grid child of mode-tabs
- **Siblings**: other mode buttons
- **Variant**: `.mode-button.active` for selected mode
- **Source**: App.tsx ~line 875 (ModeButton component)

#### tag-strip (`.tag-strip`)
- **Type**: container
- **Layout**: Flex row, gap: 6px, overflow-x: auto
- **Position**: fifth child of sidebar (conditional: `allTags.length > 0`)
- **Siblings**: mode-tabs (before), conversation-list (after)
- **Children**: all-tag button + dynamic tag buttons
- **Source**: App.tsx ~line 676

##### tag (`.tag`)
- **Type**: button
- **Purpose**: Filter conversations by tag
- **Position**: flex row child of tag-strip
- **Variant**: `.tag.active` for selected tag
- **Source**: App.tsx ~line 681

#### conversation-list (`.conversation-list`)
- **Type**: container
- **Layout**: Flex column, gap: 10px, overflow-y: auto
- **Position**: last child of sidebar
- **Siblings**: tag-strip (before)
- **Children** (dynamic): conversation-card per filtered conversation
- **Source**: App.tsx ~line 893 (ConversationList component)

##### conversation-card (`.conversation-card`)
- **Type**: button (article element)
- **Purpose**: Select a conversation
- **Position**: flex column child of conversation-list
- **Variant**: `.conversation-card.active` when selected
- **Children**:
  - conversation-title (title + optional Pin icon)
  - summary paragraph
  - conversation-meta (date + action buttons)
- **Source**: App.tsx ~line 911

###### conversation-title (`.conversation-title`)
- **Type**: container
- **Layout**: Flex row, space-between
- **Children**: span (title text), Pin icon if pinned
- **Source**: App.tsx ~line 919

###### conversation-meta (`.conversation-meta`)
- **Type**: container
- **Layout**: Flex row, space-between
- **Children**: time span, action buttons container
- **Source**: App.tsx ~line 924

###### pin-btn (`.mini-button[title="Pin"]`)
- **Type**: button
- **Purpose**: Toggle conversation pin
- **Position**: child of conversation-meta actions
- **Source**: App.tsx ~line 930

###### archive-btn (`.mini-button[title="Archive"]`)
- **Type**: button
- **Purpose**: Archive conversation
- **Position**: child of conversation-meta actions
- **Source**: App.tsx ~line 938

---

### main-panel (`.main-panel`)
- **Path**: app-shell > main-panel
- **Type**: container
- **Layout**: Flex column, height: 100vh
- **Position**: third child of app-shell
- **Siblings**: rail (before), sidebar (conditional, before)
- **Source**: App.tsx ~line 709
- **Children**:
  - top-bar (`.top-bar`)
  - conditional view (chat-view, gallery-view, bookmarks-view, settings-view)
  - hidden file input
  - status-msg (`.main-status`, conditional)
  - onboarding-overlay (conditional)
  - sendto-overlay (conditional)

#### top-bar (`.top-bar`)
- **Type**: container
- **Layout**: Flex row, space-between, min-height: 70px
- **Position**: first child of main-panel
- **Children**: title block, top-actions
- **Source**: App.tsx ~line 710

##### top-actions (`.top-actions`)
- **Type**: container
- **Layout**: Flex row, gap: 8px
- **Position**: last child of top-bar
- **Children**:
  - capture-btn
  - more-btn
  - more-menu (conditional dropdown)
  - full-window-btn (conditional)
- **Source**: App.tsx ~line 715

###### capture-btn (`.command-button[title="Capture current tab"]`)
- **Type**: button
- **Purpose**: Capture current tab content into composer
- **Position**: first child of top-actions
- **Siblings**: more-dropdown wrapper
- **Source**: App.tsx ~line 716

###### more-btn (`.command-button[title="More actions"]`)
- **Type**: button
- **Purpose**: Toggle more actions dropdown
- **Position**: second child of top-actions
- **Siblings**: capture-btn (before)
- **Source**: App.tsx ~line 726

###### more-menu (`.slash-suggestions.top-more-menu`)
- **Type**: overlay
- **Layout**: absolute positioned below button
- **Position**: child of top-actions, sibling after more-btn
- **Children**: export buttons (Gemini, Markdown, Copy MD, JSON)
- **Source**: App.tsx ~line 736

###### full-window-btn (`.icon-button[title="Full Window"]`)
- **Type**: button
- **Purpose**: Open popup window
- **Position**: last child of top-actions (hidden when fullWindow)
- **Siblings**: more-btn wrapper
- **Source**: App.tsx ~line 757

##### page title block
- **Type**: container
- **Layout**: Flex column
- **Position**: first child of top-bar
- **Children**: eyebrow (`.eyebrow`), h2 title
- **Source**: App.tsx ~line 711

#### status-msg (`.main-status`)
- **Type**: container
- **Purpose**: Show transient status messages
- **Position**: fixed bottom-left, z-index: 10
- **Conditional**: renders when `status` is truthy
- **Animation**: fade in/out over 5s
- **Source**: App.tsx ~line 831

---

### chat-view (conditional, inside main-panel)
- **Path**: main-panel > chat-view
- **Type**: container
- **Layout**: CSS Grid (4 rows)
- **Position**: replaces other views when viewMode === 'chat'
- **Source**: App.tsx ~line 766 (ChatView component)
- **Children**:
  - markdown-preview (`.markdown-preview`)
  - message-stream or empty-page
  - inline-bookmarks (conditional)
  - composer (`.composer`)

#### chat-layout (`.chat-layout`)
- **Type**: container
- **Layout**: `grid-template-rows: minmax(120px, 24vh) minmax(0, 1fr) auto auto`
- **Variant**: `.chat-layout.preview-hidden` collapses preview row to `auto`
- **Source**: App.tsx ~line 1086

#### markdown-preview (`.markdown-preview`)
- **Type**: container
- **Layout**: Grid row 1, min-height: 120px
- **Position**: first child of chat-layout
- **Children**: preview-toggle, preview-content (conditional), animated-preview
- **Source**: App.tsx ~line 1088

##### preview-toggle (`.toggle-button`)
- **Type**: button
- **Purpose**: Collapse/expand markdown preview
- **Position**: first child of markdown-preview
- **Source**: App.tsx ~line 1089

##### preview-content (`.preview-content`)
- **Type**: container
- **Position**: second child (conditional on !previewCollapsed)
- **Children**: markdown-body or animated-preview
- **Source**: App.tsx ~line 1099

###### animated-preview (`.short-preview-animated`)
- **Type**: component
- **Purpose**: Animate short text inputs (≤3 words or smiley)
- **Children**: short-preview-char spans
- **Source**: App.tsx ~line 1486 (AnimatedShortPreview)

###### markdown-body (`.markdown-body`)
- **Type**: container
- **Purpose**: Render draft.body via react-markdown
- **Source**: App.tsx ~line 1103

###### restore-btn (`.restore-session-btn`)
- **Type**: button (rendered from markdown link `restore:` protocol)
- **Purpose**: Restore tabs from a melted session
- **Position**: inside markdown-body / compact
- **Source**: App.tsx ~line 1114 (in ReactMarkdown component map)

#### message-stream (`.message-stream`)
- **Type**: container
- **Layout**: Flex column, gap: 12px, overflow-y: auto
- **Position**: grid row 2, or swap with composer when preview collapsed
- **Children**: message-bubble per visible message
- **Conditional**: `hasConversation ? `<section> : empty-page`
- **Source**: App.tsx ~line 1143

#### empty-page (`.empty-page`)
- **Type**: container
- **Purpose**: Show when no conversation selected
- **Children**: text, command-button (new conversation)
- **Source**: App.tsx ~line 1158

#### inline-bookmarks (`.inline-bookmarks`)
- **Type**: container
- **Layout**: Flex row, gap: 8px, overflow-x: auto
- **Position**: grid row 3 (conditional on bookmarks.length > 0)
- **Children**: bookmark-chip (max 4)
- **Source**: App.tsx ~line 1167

##### bookmark-chip (`.bookmark-chip`)
- **Type**: link
- **Purpose**: Quick access to page bookmarks
- **Children**: thumbnail or icon, title span
- **Source**: App.tsx ~line 1518 (BookmarkChip)

---

## 3. Prompt Patterns

How to reference elements in prompts. Use any of these patterns.

### Pattern 1: Friendly Name (easiest)
Just use the name from the Quick Reference Dictionary.
- "Make the **capture button** green"
- "Hide the **tag strip** when empty"
- "Add a keyboard shortcut to the **brand button**"

### Pattern 2: Location + Friendly Name
Specify where the element lives.
- "In the **composer**, make the **send button** larger"
- "In the **top bar**, add a button after the **capture button**"
- "In the **message bubble**, show the **copy button** by default"

### Pattern 3: Relative Position
Describe the element relative to siblings or parent.
- "Add a divider between the **textarea** and **send button**"
- "Move the **tag strip** above the **mode tabs**"
- "Put the **search box** below the **sidebar header**"

### Pattern 4: Direct CSS Selector (for precision)
Use CSS selectors when names are ambiguous.
- "Style `.gallery-card:hover` to lift up"
- "Make `.message-bubble` rounded on the left only"

### Pattern 5: Functional Reference
Reference by what it does (title, placeholder, aria-label).
- "Change `button[title="Capture current tab"]` to use accent color"
- "Update `input[placeholder="Search conversations, links, tags"]` to clear on Escape"

---

## 4. Component → CSS Mapping

Cross-reference of React components and their primary CSS classes.

| Component Function | File Location | Key CSS Classes |
|---|---|---|
| App | App.tsx ~87 | `.app-shell`, `.sidebar-collapsed` |
| ModeButton | App.tsx ~875 | `.mode-button`, `.mode-button.active` |
| ConversationList | App.tsx ~893 | `.conversation-list`, `.conversation-card` |
| ChatView | App.tsx ~955 | `.chat-layout`, `.markdown-preview`, `.message-stream`, `.composer` |
| MessageBubble | App.tsx ~1236 | `.message-bubble`, `.message-actions`, `.message-meta`, `.markdown-body.compact` |
| MessageLinkPreviews | App.tsx ~1363 | `.message-previews`, `.link-preview-card`, `.github-panel` |
| GitHubRepoPanel | App.tsx ~1398 | `.github-panel`, `.github-action-group` |
| OnboardingTour | App.tsx ~1430 | `.onboarding-overlay`, `.onboarding-card` |
| AnimatedShortPreview | App.tsx ~1486 | `.short-preview-animated`, `.short-preview-char` |
| BookmarkChip | App.tsx ~1518 | `.bookmark-chip` |
| GalleryView | App.tsx ~1527 | `.gallery-grid`, `.gallery-card` |
| BookmarksView | App.tsx ~1552 | `.bookmarks-grid`, `.bookmark-card` |
| SettingsView | App.tsx ~1572 | `.settings-panel`, `.stats-row`, `.stat`, `.settings-actions`, `.drive-sync-controls` |
| Stat | App.tsx ~1686 | `.stat` |
| PageSelect | App.tsx ~1698 | `.page-select`, `.page-select-trigger`, `.page-select-menu` |

---

## 5. Features → Elements Crosswalk

Maps features from `docs/02-FEATURES.md` to the UI elements that implement them.

| Feature | Primary Elements | Notes |
|---|---|---|
| Capture Tab button | `top-bar > top-actions > capture-btn` | Also triggered by right-click menu and `Ctrl+Shift+S` |
| Context menu "Send to Personal Slack" | Background service worker → message relay | No direct UI element; handled in `background.ts` |
| Keyboard shortcut `Ctrl+Shift+S` | Background service worker | Same relay as context menu |
| Full window popup | `full-window-btn` in `top-actions` | Opens `entrypoints/popup/` |
| Sidebar toggle | `brand` button in `rail` | Toggles `.sidebar-collapsed` on `.app-shell` |
| Slash command `/melt-tabs` | `slash-suggestions` in composer | Generates Melted Tabs page content |
| Slash command `/summarize` | `slash-suggestions` in composer | Fills markdown preview + composer |
| Slash command `/todo` | `slash-suggestions` in composer | Scans workspace messages for checkboxes |
| Slash command `/todos` | `slash-suggestions` in composer | Renders interactive checkboxes with `todo:` protocol links |
| Slash command `/ask` | `slash-suggestions` in composer | Keyword search across `workspace.messages` |
| Slash suggestion popup | `slash-suggestions`, `slash-suggestion-item` | Keyboard navigable (↑↓ Enter Esc) |
| Collapsible preview | `markdown-preview > preview-toggle` | Toggles `.chat-layout.preview-hidden` |
| Auto-growing composer textarea | `composer > composer-textarea-wrapper > textarea` | Caps at `40vh` |
| Embedded send button | `composer-textarea-wrapper > send-btn` | Inside bordered input box |
| Pin icon | `pin-btn` in `conversation-meta` | Replaces misleading Star |
| Status messages auto-fade | `main-panel > status-msg` | CSS animation 4.6s + 0.4s |
| Per-message hover toolbar | `message-bubble > message-actions` | Copy, Send-to-page, Delete |
| Keyboard-first composer | `composer-textarea` | Esc blur, ↑ loads last message |
| Auto-tag by content | `tags-input` in composer | `inferAutoTags()` in `data.ts` |
| Clipboard Markdown export | `more-menu` in `top-actions` | Copy MD button |
| Interactive `/todos` | `slash-suggestions` → checkboxes in `markdown-body` | Custom `todo:` protocol handled by `MessageBubble` |
| Onboarding tour | `onboarding-overlay > onboarding-card` | 4-step overlay, anime.js |
| Send-to-page popup | `sendto-overlay > sendto-card` | Overlay matching onboarding styling |
| Custom PageSelect dropdown | `composer-tools > page-select` | Replaces native `<select>` |
| Conversation pin | `pin-btn` in `conversation-meta` | Sets `pinned: true` |
| Conversation archive | `archive-btn` in `conversation-meta` | Sets `archived: true` |
| Gallery view | `gallery-grid > gallery-card` | `viewMode === 'gallery'` |
| Bookmarks view | `bookmarks-grid > bookmark-card` | `viewMode === 'bookmarks'` |
| Settings view | `settings-panel` | `viewMode === 'settings'` |
| Drive export | `export-btn` in settings-actions | JSON, Markdown, Gemini Prompt |
| Drive notes sync | `drive-sync-toggle`, `drive-root-input`, `drive-notes-input` | Settings → Drive Notes Sync section |
| Workspace reset | `reset-btn` in settings-panel | Resets to `createDefaultWorkspace()` |
| Stats dashboard | `stat-card` x4 in stats-row | Pages, Threads, Messages, Bookmarks counts |
| Animated short preview | `animated-preview` in `markdown-preview` | ≤3 words or smiley, anime.js |
| Link preview cards | `link-preview` in `message-previews` | Bookmarks with `thumbnailUrl` |
| GitHub action panels | `github-panel` in `message-previews` | `githubRepos` from `findGitHubRepos()` |
