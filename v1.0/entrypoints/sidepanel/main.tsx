/**
 * SIDE PANEL ENTRYPOINT — Personal Slack v1.0
 *
 * Renders the main <App> component inside the Chrome side panel.
 * This entrypoint is loaded by entrypoints/sidepanel/index.html.
 *
 * Contrast with entrypoints/popup/main.tsx which renders the same <App>
 * component with fullWindow={true} for the popup overlay mode.
 */
import React from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './src/App';
import './src/styles/index.css';

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);