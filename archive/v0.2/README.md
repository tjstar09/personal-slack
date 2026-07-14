# Personal Slack Sidebar

A WXT Manifest V3 Chrome extension that opens a local Slack-style workspace in Chrome's side panel.

## Features

- Chrome side panel opened from the extension action button.
- Local conversation pages with a default `Bookmarks` page.
- Markdown preview above the composer and markdown rendering in message history.
- Conversation history, gallery view, bookmark gallery, tags, pinned threads, archive, and search.
- Automatic URL extraction from posted messages.
- Internal bookmarks plus Chrome bookmark creation in a `Personal Slack` folder.
- Video link detection with YouTube thumbnails.
- JSON backup, JSON restore, and Markdown export.
- Google Drive export plumbing for JSON and Markdown files.

## Development

```bash
cd browser
npm install
npm run dev
```

Load the generated extension from `.output/chrome-mv3` at `chrome://extensions` with Developer mode enabled.

## Production Build

```bash
cd browser
npm run build
```

Load or package `.output/chrome-mv3`.

## Google Drive Export Setup

Drive export cannot work until the extension has a real Google OAuth client.

1. Create a Google Cloud OAuth client for a Chrome extension.
2. Use the extension ID from Chrome after loading the unpacked extension.
3. Replace `REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com` in `wxt.config.ts`.
4. Rebuild and reload the extension.

The manifest already requests `identity` and `https://www.googleapis.com/auth/drive.file`.

## Easy Next Additions

- Active tab capture button that saves the current page title, URL, and selected text.
- Reminders and snooze dates on messages or bookmarks.
- Per-page markdown files for Obsidian-style export.
- Lightweight offline full-text index for faster search at larger history sizes.
- Optional content-script link preview extraction for page titles and descriptions.
