---
name: accurate-commits
description: Accurate Git commits plus optional session handoff. Sync with main, stage by intent, verify the index, avoid junk paths, push safely, and when requested land the branch by merging it into main. Use for commits, PR prep, pre-push, landing work, or chat wrap-up and handoff.
version: 1.2.0
---

# Accurate commits (Boardsmith)

**Boardsmith copy.** Keep this repo-local skill aligned with the workflow the user expects for intentional commits.

Guide a safe, intentional commit or a small series of commits. Do not rush `git add .`.

## When to use

- User is ready to `commit`, `push`, `open a PR`, or `merge to main`
- Working tree mixes several concerns (UI + config + tests)
- User wants one commit = one intent
- User is switching chats and wants a clean handoff (memory + docs + git)

## How to invoke (Codex)

- Ask the agent to read and follow `.agents/skills/accurate-commits/SKILL.md`
- Or: `Run the accurate-commits skill before I push.`
- Or: `accurate-commits wrap-up - I'm switching context.`

## Repo-specific rules

- Boardsmith is a private MVP woodworking planning app. Preserve planning-aid and woodworking safety boundaries.
- Do not introduce migrations, packages, auth, public sharing, payments, file export, image upload, FreeCAD, 3D CAD, or external services unless explicitly requested.
- Before committing, run the project-required verification stack unless the user explicitly narrows the scope: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.
- Keep `.next/`, screenshots, browser artifacts, logs, generated temp folders, and local tool output out of commits unless the user explicitly asks to version them.
- If `next-env.d.ts` changes during local Next runs, inspect it before staging. Do not commit local typegen drift unless it is intentional.
- Use PowerShell-safe quoting for paths. Dynamic routes like `app\projects\[id]\page.tsx` should be read with `-LiteralPath`.

## Decide the landing target first

Pick one mode before making git moves:

- `branch-only`: commit and push the feature branch, or prepare a PR
- `land-on-main`: finish the branch work and merge it into `main`

If the user explicitly asks to merge, land, ship, or "make sure it gets to main", use `land-on-main`.
If the user only asked for a commit, push, or PR, stay in `branch-only`.

## Procedure (follow in order)

### 1. Baseline

**bash / zsh**

```bash
cd "$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
git status -sb
git fetch origin
```

**PowerShell (Windows)**

```powershell
cd "C:\dev\boardsmith"
git status -sb
git fetch origin
```

State: current branch, ahead/behind, and whether there are untracked (`??`) trees.

### 2. Exclude junk (do not commit unless explicitly requested)

Treat as out of scope unless the user says to version them:

- `.gemini/`, `.kiro/`, `.opencode/`, `.trae/`, `.trae-cn/`, `.pi/`, `.rovodev/`, and similar generated skill/plugin trees
- Ad-hoc `README.txt`, one-off tooling, unless it is real project infrastructure

If they keep appearing: suggest adding patterns to `.gitignore` once.

### 3. Sync the working branch with `main`

```bash
git merge origin/main
# or: git rebase origin/main   (only if the user prefers rebasing; warn that it rewrites history)
```

Resolve conflicts, then run the checks the user cares about (for example `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`).

### 4. Slice work: one commit = one intent

Group files by story (for example "project intake measurement copy", "design docs", "tooling config").

For each commit:

1. Stage only paths for that story:

   ```bash
   git add "app/projects/new/page.tsx" "tests/project-form-routes.test.ts"
   ```

   Use `git add -p` when one file contains two stories.

2. Verify the index:

   ```bash
   git diff --cached --stat
   git diff --cached
   ```

   If anything is wrong: `git restore --staged -- <file>` or `git restore --staged -p`.

3. Commit with a why-first subject line. This repo often uses Lore trailers; see `AGENTS.md`.

   ```bash
   git commit -m "Clarify wall shelf measurements" -m "..."
   ```

4. Repeat until `git status` is clean for intentional tracked changes.

### 5. Verify branch scope before any push or merge

```bash
git log --oneline origin/main..HEAD
```

Confirm the commit list matches what should ship.

### 6. Choose the finish path

#### Path A: branch-only

Use this when the user wants a commit, push, or PR but did not ask to land directly on `main`.

```bash
git push -u origin "<branch-name>"
```

If pre-push is slow or ESLint walks build output: recommend fixing `lint` / ignore patterns. `--no-verify` is an emergency escape, not the default.

#### Path B: land-on-main

Use this when the user asked to merge to `main`, land the work, or otherwise complete integration.

1. Make sure branch verification already passed.
2. Switch to `main` and fast-forward it:

   ```bash
   git checkout main
   git pull --ff-only origin main
   ```

3. Merge the working branch into `main`:

   ```bash
   git merge --no-ff "<branch-name>"
   ```

   If the repo or user prefers fast-forward-only and the history allows it, `git merge --ff-only "<branch-name>"` is also fine.

4. Re-run the appropriate verification on `main`. Full pass before merge or deploy is preferred:

   ```bash
   npm test
   npm run lint
   npm run typecheck
   npm run build
   git diff --check
   ```

5. Push `main`:

   ```bash
   git push origin main
   ```

6. Only after the push succeeds, say the work is merged to `main`.

### 6A. If GitHub says the merge failed, correct the blocker instead of stopping

Treat a GitHub merge failure as a diagnosis-and-fix loop, not as the end of the workflow.

1. Identify the actual blocker first:

   ```bash
   gh auth status
   gh pr view <number> --json state,isDraft,mergeable,mergeStateStatus,reviewDecision,url
   gh pr checks <number>
   ```

2. Fix the class of problem GitHub is reporting:

- If the branch is behind `main`, sync it with `origin/main`, resolve conflicts, rerun verification, and push the updated branch.
- If required checks failed, inspect the failing GitHub Actions logs, fix the real code or config problem, rerun verification locally, then push.
- If the PR is still draft, mark it ready. If the GitHub connector path is flaky, prefer `gh pr ready <number>`, then re-fetch once or twice before assuming it failed.
- If mergeability is blocked by conflicts, resolve the conflicts locally on the branch instead of trying to force the merge in GitHub.
- If GitHub reports branch protection, missing approvals, merge queue requirements, or missing permissions, fix what is within repo control and escalate only the remaining policy or access gate.

3. After each fix, re-check the PR state:

   ```bash
   gh pr view <number> --json isDraft,mergeable,mergeStateStatus,reviewDecision,url
   gh pr checks <number>
   ```

4. Continue until the PR is mergeable or until the only remaining blocker is missing authority outside the agent's control.

5. Do not report "GitHub merge failed" without naming the concrete blocker and the attempted remediation.

### 7. Session wrap-up (switching chats / handoff)

Run when the user is closing a session or switching threads so the next chat is not guessing.

Do not treat "update docs" as mandatory every time. Only touch project memory when something actually changed for the next person or the next model.

| Artifact                      | Update when...                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `README.md` / `docs/SETUP.md` | Onboarding, install steps, env vars, or supported commands changed.                                                                         |
| `PRODUCT.md` / `DESIGN.md`    | Product framing, design rules, or private MVP guardrails changed.                                                                           |
| `docs/` task/checkpoint files | User wants a dated checkpoint, task ledger update, or durable handoff note. Optional for small fixes.                                       |

Skip docs if the session was only exploratory, typo-level, or the existing project truth is still accurate.

Verification before handoff should match risk:

```powershell
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Use a subset for tiny changes; full pass before merge or deploy.

Git after doc edits: `README.md`, `PRODUCT.md`, `DESIGN.md`, `.impeccable/design.json`, and `docs/` edits deserve their own small commit when they are a separate intent. Do not hide doc updates inside unrelated code commits unless the user explicitly wants one squashed commit.

## Agent checklist

- [ ] `git status` reviewed; junk paths not staged
- [ ] `origin/main` merged into the working branch (or rebase agreed) before finalizing
- [ ] Each commit: `git diff --cached` reviewed
- [ ] Commit messages describe intent, not only diffs
- [ ] Branch scope matches `git log origin/main..HEAD`
- [ ] If `land-on-main`: branch merged into `main`, verification rerun on `main`, and `git push origin main` succeeded
- [ ] If GitHub merge failed at any point: concrete blocker identified, fix attempted, and PR state re-checked
- [ ] Handoff: docs updated only if truth changed; otherwise say the existing docs still match

Open this file, then execute the procedure and narrate which step you are on.
