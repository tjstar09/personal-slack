import { defineConfig } from 'wxt';

export default defineConfig({
  modules: ['@wxt-dev/module-react'],
  manifest: {
    name: 'Personal Slack Sidebar',
    short_name: 'Personal Slack',
    description:
      'A local Slack-style Chrome side panel for markdown conversations, bookmarks, tags, history, backup, restore, and Drive export.',
    version: '0.1.0',
    minimum_chrome_version: '149',
    permissions: ['bookmarks', 'identity', 'sidePanel', 'storage'],
    host_permissions: ['https://www.googleapis.com/*'],
    action: {
      default_title: 'Open Personal Slack',
    },
    oauth2: {
      client_id: 'REPLACE_WITH_GOOGLE_OAUTH_CLIENT_ID.apps.googleusercontent.com',
      scopes: ['https://www.googleapis.com/auth/drive.file'],
    },
  },
});
