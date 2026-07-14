# Build, Verification & OAuth Setup — v1.0

---

## Commands

All commands run from `v1.0/`:

```bash
cd v1.0
npm install        # Install dependencies
npm run dev        # Development mode (auto-reload)
npm run build      # Production build → .output/chrome-mv3/
npm run lint       # TypeScript check (tsc --noEmit)
```

## Load Extension

1. Go to `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked**
4. Select `v1.0/.output/chrome-mv3`

## Verification Sequence

After making changes, verify with this exact sequence:

```bash
cd v1.0
npx tsc --noEmit   # Should produce 0 errors
npm run build      # Should complete with "Built extension in X.XXXs"
```

**Windows note**: In PowerShell or cmd.exe, `&&` is not a valid statement separator. If you see `The token '&&' is not a valid statement separator`, use `cmd /c` instead:

```bash
cmd /c "cd /d v1.0 && npx tsc --noEmit"
cmd /c "cd /d v1.0 && npm run build"
```

- If `tsc --noEmit` shows errors from YOUR changes (not `chrome`), fix them.
- If `npm run build` fails, read the error — it will be from your changes.

## Known Quirks

### Chrome API Type Errors in Editor
You will see `Cannot find name 'chrome'` TypeScript errors in VS Code. **These are false positives.**
- WXT generates Chrome API types at build time inside `.wxt/types/`
- `npx tsc --noEmit` (which WXT runs under the hood) **will pass with 0 errors**
- If `npx tsc --noEmit` passes, the `chrome` errors in the editor are irrelevant
- Do not attempt to fix these by adding `declare const chrome` or installing extra type packages

### npm Errors During Install
During `npm install`, you may see:
- Deprecation warnings (`prebuild-install`, etc.)
- Vulnerability audit messages (1 low, 2 moderate, 8 high, 4 critical)
- Spinner/progress artifacts in terminal output

**Do not loop on these.** Run `npm install` once and proceed. The vulnerabilities are in dev dependencies (WXT, Vite, esbuild) and are not security risks for a local-only extension.

If `npm install` fails with an actual error (not warnings), then investigate.

---

## OAuth Setup (Google Drive)

Drive export cannot work until the extension has a real Google OAuth client.

1. Create a **Google Cloud project**
2. Create an **OAuth 2.0 Client ID** for **Chrome Extension**
3. Use the extension ID from `chrome://extensions` after loading the unpacked extension
4. Replace the `oauth2.client_id` placeholder in `v1.0/wxt.config.ts` with your real client ID
5. Rebuild and reload the extension

The manifest already requests:
- `identity` permission
- `https://www.googleapis.com/auth/drive.file` scope

### OAuth Notes
- `chrome.identity.getAuthToken` handles the token lifecycle (interactive + silent auth)
- Drive API uses multipart upload for file creation/update
- Folder management: `ensureFolder()` creates if not exists, `findFolder()` searches by name
- File upsert: checks for existing file by name in folder, creates or updates accordingly