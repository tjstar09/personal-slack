---
name: google-drive-api-developer
description: Use this skill when developing or maintaining Google Drive integrations, including uploading and downloading files, searching files and folders with complex metadata queries, managing sharing and permissions, working with My Drive and shared drives, applying and querying Drive labels, creating app-specific storage folders or third-party shortcuts, monitoring Drive events, or integrating editor workflows with the Google Drive UI and Google Picker API.
---

# Google Drive API Developer

Use this skill when building apps that use Google Drive as a storage layer through the Google Drive REST API, especially when the work involves authentication with OAuth 2.0, file lifecycle operations, Drive search, collaboration features, or Drive UI integration.[page:1]

## Core capabilities

- Upload files to Drive and download files from Drive.[page:1]
- Search files and folders using complex queries across file metadata fields in the `files` resource.[page:1]
- Manage collaboration by sharing files, folders, and shared drives.[page:1]
- Work with both user-owned My Drive content and collaborative shared drives.[page:1]
- Apply labels to files, read label field values, and search using custom label metadata terms.[page:1]

## UI and app integration

- Integrate editor-style apps with the Google Drive UI so users can create and open Drive files from your app.[page:1]
- Use the Google Picker API alongside Drive to let users browse and select Drive content, returning metadata such as filename, URL, last modified date, and user.[page:1]
- Create third-party shortcuts that point to content stored outside Drive in another datastore or cloud storage system.[page:1]

## Advanced use cases

- Create a dedicated app-specific Drive folder so the app stores its data without needing access to all user content.[page:1]
- Monitor or respond to file activity using Google Drive events.[page:1]
- Build applications that rely on Drive as the underlying cloud storage solution for documents and other files.[page:1]

## Authentication and platform model

The Google Drive API is a REST API for accessing Drive storage from inside an application, and user authorization is based on OAuth 2.0.[page:1]