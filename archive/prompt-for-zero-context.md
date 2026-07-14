# Project Bootstrap & Feature Implementation: Personal Slack Sidebar v3

I am developing a Chrome Extension called **Personal Slack Sidebar** built with **WXT** and **Manifest V3**. I need your help designing and coding the version 3 (v3) upgrade lifecycle. 

Before generating code, you must first ingest the structure and code patterns of our current v2 version.

## Instructions to Establish Context
1. Read the attached **Readme.md** file to understand the architecture, build pipelines, and current features.
2. Review the files inside the attached **browser_v2/** folder to analyze our state management, UI components, background workers, and configuration setup (`wxt.config.ts`).
3. Cross-reference the skills, constraints, and architecture guidelines documented in **Agents.md**.

Once you understand how the current v2 app functions, provide a complete implementation plan and production-ready code to upgrade the extension to v3.

## v3 Core Feature Requirements

### 1. Primary Feature: Local "AI Teammate"
- Integrate a 100% local, offline AI engine using Chrome's native built-in AI (`window.ai` / Gemini Nano) or a lightweight alternative like `Transformers.js`. No external API keys allowed.
- Implement slash commands in the sidebar composer:
  - `/summarize`: Summarises the text content of the active browser tab.
  - `/ask [query]`: Searches through local history/bookmarks to answer user questions using RAG.
  - `/todo`: Scans the active page or recent notes to extract actionable checkboxes.

### 2. Zero-Click Content Capture
- Use `chrome.contextMenus` in the background service worker to add a right-click option: "Send to Personal Slack".
- Highlighting text or right-clicking a link/image and selecting this option must silently push the asset into the local database under the default `#bookmarks` channel.
- Map a global extension shortcut (`Cmd+Shift+S` / `Ctrl+Shift+S`) to instantly save the active URL.

### 3. Tab Hoarding "Auto-Melt"
- Implement a `/melt-tabs` command.
- Read all open tabs in the window via `chrome.tabs`, dump their metadata as a dated message block (e.g., `#tab-dump-YYYY-MM-DD`), and close them safely.

### 4. Native Slack-Style Canvas
- Update the UI layout to feature a split screen or toggle pane.
- Keep the fast-moving chat stream on one side, and add a persistent Markdown scratchpad (Canvas) on the other for permanent notes.

### 5. Quality-of-Life Enhancements
- **Local Link Scraper**: Automatically scrape web page metadata (`og:title`, `og:description`) to render rich preview snippets instead of raw links.
- **Reactions as Tags**: Allow users to tag messages dynamically using emoji reactions (e.g., hitting 📁 moves a message to the archive).
- **Drag-and-Drop**: Accept texts and image objects dragged directly from webpage tabs directly into the side panel interface.

## Expected Output
A comprehensive roadmap split by file updates, complete with TypeScript code blocks matching our current framework paradigms, state management patterns found in `browser_v2`, and the guidelines in `Agents.md`.
