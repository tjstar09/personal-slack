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

> **Mandatory if remote exists.** Always push the feature branch before asking for review.
> This allows the user to inspect the diff on GitHub and ensures the branch isn't lost locally.

```bash
git push -u origin feature/capture-preview-overlay
```

### 5. Ask user to review

Present the user with exactly **three options** — no more, no less:

```
1. ✅ Changes approved. Merge to main.
2. 🔧 Changes working but need more modifications.
3. ❌ Changes not working. Investigate and fix.
```

**Do not merge until the user selects option 1.**

### 5a. Handle the user's response

| Option | Action |
|---|---|
| **1 — Approved** | Proceed to step 6 (Merge). |
| **2 — Needs modifications** | Stay on the feature branch. If the user has already described what to change, apply it. If not, ask: "What would you like me to change?" |
| **3 — Not working / investigate** | Stay on the feature branch. Ask the user: "What issue are you seeing? What should I investigate or fix?" Do not proceed to merge until the issue is resolved and the user approves. |

### 6. Merge to main

Only run this after the user has selected **Option 1 (Approved)**.

```bash
git checkout main
git merge feature/capture-preview-overlay
cd v1.0 && npx tsc --noEmit && npm run build   # Verify main still builds
git push
```

> If remote is configured, **always push main after merge**.

### 7. Clean up — present two options to the user

After the merge is complete and pushed, ask:

```
Feature branch merged to main.
1. 🗑️ Delete the feature branch.
2. 📌 Keep the feature branch (decide later).
```

| Option | Action |
|---|---|
| **1 — Delete** | ```bash git branch -d feature/capture-preview-overlay ```<br>```bash git push origin --delete feature/capture-preview-overlay ``` |
| **2 — Keep** | No action. Stay on `main`. Acknowledge: "Branch kept locally and remotely." |

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