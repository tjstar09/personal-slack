# Git Workflow — Personal Slack

## Branch Strategy

```
main ──●────────●────────●────────●────  (always working)
         \      /        /        /
feature/X ──●──        /        /
                      /        /
feature/Y ──●────────●        /
                              /
feature/Z ──●────────────────●
```

| Branch | Purpose |
|---|---|
| **`main`** | Always deployable, working state. Only merged to after verification and approval. |
| **`feature/<name>`** | One branch per feature, fix, or enhancement. Created from `main`, deleted after merge. |

No `develop`, `release`, or `hotfix` branches — unnecessary for a solo project.

---

## Setup (done)

```bash
git init                                    # Initialize repo
git add .                                   # Stage all files
git commit -m "Initial commit — v1.0 working state"
git branch -m master main                   # Rename default branch to main
```

---

## Feature Workflow

### 1. Create a feature branch

```bash
git checkout -b feature/capture-preview-overlay
```

### 2. Make changes, verify build

```bash
cd v1.0 && npx tsc --noEmit && npm run build
```

- If build **fails** → fix until green, or discard:
  ```bash
  git checkout main && git branch -D feature/capture-preview-overlay
  ```

### 3. Commit changes

```bash
git add .
git commit -m "feat: description of the change"
```

### 4. Push to GitHub (if remote is configured)

```bash
git push -u origin feature/capture-preview-overlay
```

### 5. User reviews and approves

- Test the built extension in Chrome
- If rejected → discard the branch (step 2)
- If approved → proceed to merge

### 6. Merge to main

```bash
git checkout main
git merge feature/capture-preview-overlay
cd v1.0 && npx tsc --noEmit && npm run build   # Verify main still builds
git push

# Clean up
git branch -d feature/capture-preview-overlay
git push origin --delete feature/capture-preview-overlay   # if pushed
```

---

## Commit Message Convention

| Prefix | Use case |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `docs:` | Documentation changes |
| `refactor:` | Code restructuring |
| `chore:` | Tooling, build, config |

Examples:
```
feat: capture preview popup with edit/send/discard
fix: status message not clearing on capture error
docs: update element reference for capture button
```

---

## GitHub Remote Setup

```bash
# After creating an EMPTY repo on GitHub (no README, no .gitignore):
git remote add origin https://github.com/YOUR_USER/personal-slack.git
git push -u origin main
```

> ⚠️ Create the GitHub repo **empty** — no README, license, or .gitignore — to avoid merge conflicts.

---

## Branch Protection (Optional)

On GitHub: Settings → Branches → Add rule
- Branch name pattern: `main`
- ☑ Require pull request before merging
- This prevents direct pushes to `main`.