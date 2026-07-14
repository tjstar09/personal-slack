/**
 * POPUP ENTRYPOINT — Full Window Mode
 *
 * Renders the same <App> component as the side panel, but with
 * fullWindow={true}. This triggers the full-window CSS layout and
 * hides the "Full" button (you can't go full-screen from full-screen).
 *
 * WHY A SEPARATE ENTRYPOINT:
 *   WXT generates separate HTML pages for each entrypoint in entrypoints/.
 *   The popup is opened via chrome.windows.create({ url: 'popup.html' })
 *   from the App.tsx "Full" button. It shares all the same source code
 *   as the side panel — only the entrypoint differs.
 *
 * WHY IMPORTS FROM ../sidepanel/src/App:
 *   Both entrypoints live under entrypoints/, so the relative path
 *   from entrypoints/popup/ to entrypoints/sidepanel/src/ is valid.
 *   This avoids duplicating the entire App component just for a prop.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '../sidepanel/src/App';
import '../sidepanel/src/styles.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App fullWindow={true} />
  </React.StrictMode>,
);