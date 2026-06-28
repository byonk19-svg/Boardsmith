<!-- AUTONOMY DIRECTIVE - DO NOT REMOVE -->
YOU ARE AN AUTONOMOUS CODING AGENT.

PRIMARY OBJECTIVE:
Complete the requested task, not a loose subset. Work in small verified slices, keep scope tight, and stop only when the requested end state is genuinely handled.

PROJECT CONTEXT:
Boardsmith is a private MVP woodworking planning app. It uses deterministic templates, schema-validated AI output, and review-first plan packets to produce cautious, reviewable woodworking and craft project plans.

CORE RULES:
- Use TypeScript for app and test code.
- Preserve woodworking safety rules, planning-aid disclaimers, and user-review warnings.
- Use structured AI output; never persist unvalidated JSON.
- Prefer small, verifiable changes over broad rewrites.
- Do not make broad refactors unless the user explicitly asks for that refactor.
- Do not change app behavior during docs-only or QA-discovery tasks.
- Do not commit or push unless the user explicitly asks.
- Update relevant docs when behavior, commands, workflow, safety posture, or tested capability changes.
- Keep generated artifacts, screenshots, traces, logs, `.next/`, `playwright-report/`, `test-results/`, local data files, and secret-bearing files out of commits unless the user explicitly asks to version them.

## When To Plan First

Plan before complex work, cross-cutting changes, browser QA sweeps, migrations, package changes, auth/provider changes, production/cloud work, or anything touching multiple lifecycle states.

For small single-file fixes, a brief stated approach is enough. For larger work, identify the verification path before editing.

## Ask Before Proceeding

Stop and ask only when the next step requires or risks:

- secrets, credentials, cookies, hosted URLs, or session files
- schema migrations or hosted Supabase changes
- package installs, dependency upgrades, or new tools
- destructive actions or data deletion
- auth, provider, access-control, RLS, or production/cloud changes
- unclear woodworking safety or product decisions
- paid services, public sharing, payments, marketplace, shopping, pricing, vendor, inventory, image upload, file export, FreeCAD, CAD, CNC, or subscriptions

Otherwise, make the conservative repo-local choice and keep moving.

## Commands

Install and local setup:

```bash
npm install
cp .env.example .env.local
npm run dev
```

PowerShell equivalent for the env file:

```powershell
Copy-Item .env.example .env.local
npm run dev
```

Common scripts:

```bash
npm run dev
npm run build
npm run start
npm run lint
npm run typecheck
npm test
npm run test:e2e
npm run test:e2e:headed
npm run test:e2e:ui
npm run smoke:hosted
npm audit --audit-level=moderate
git diff --check
```

Required verification before committing app or docs changes unless the user narrows scope:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Also run `npm run test:e2e` for route, form, lifecycle, project packet, browser-visible, or print-route changes. Run `npm audit --audit-level=moderate` before release/dependency closeout or when package files change.

## Playwright And Browser QA

The Playwright config lives in `playwright.config.ts`.

- E2E specs are under `tests/e2e`.
- `npm run test:e2e` runs `npm run build` and then `playwright test`.
- The e2e server uses `next start` on `127.0.0.1` with `PLAYWRIGHT_PORT` defaulting to `3100`.
- E2E persistence defaults to `.data/playwright-e2e.json` through `BOARDSMITH_DATA_FILE`.
- Supabase env vars and `BOARDSMITH_ACCESS_PASSWORD` are cleared for local e2e runs.
- Workers are intentionally serial because the tests share the configured JSON data file.
- Playwright retains screenshots, traces, and video only on failure.

Use browser QA like a realistic first-time user, not only as happy-path automation. Prefer localhost, isolated local JSON data, and non-critical smoke records. Do not use real payments, real purchases, personal accounts, destructive actions, or hosted data unless the user explicitly scopes that path.

Use `docs/qa/boardsmith-feature-user-story-ledger.xlsx` as the canonical active QA backlog. `Feature Stories` is the behavior inventory, `Testing Log` is command/scenario evidence, and `QA Backlog` is where active dogfood friction, defects, retest needs, and leave-alone decisions live. Treat `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` as sanitized historical evidence and `docs/CODEX_TASKS.md` as accepted/completed implementation work, not the active backlog.

For durable dogfood guidance, follow `docs/testing/DOGFOOD_TESTING.md`. For a reusable browser-QA request prompt, use `docs/testing/CODEX_BROWSER_QA_PROMPT.md`.

## App Shape

Current user-facing route areas:

- `/` private dashboard and idea drafting
- `/access` private MVP access gate
- `/projects` project library with filters, archive views, and project actions
- `/projects/new` structured project intake
- `/projects/[id]` project detail, readiness, generation, plan packet, plan history, notes, and build log
- `/projects/[id]/print` browser print plan
- `/settings` private settings surface

Current supported beginner-friendly project types include door hanger, layered cutout, wood sign, simple shelf, and planter box. Wall shelves are the most complete deterministic packet path; planter boxes have bounded deterministic packet support.

## Safety And Product Boundaries

Generated plans are planning aids only. Do not make structural, load-bearing, wall-safety, child-safety, certification, fabrication-ready, CAD-ready, or CNC-ready guarantees.

Flag wall mounting, child/baby use, chairs, stools, benches, ladders, platforms, heavy shelving, electrical/lighted signs, outdoor load exposure, unclear dimensions, and missing material thickness for extra review.

Do not generate unsafe tool instructions for minors. Do not recommend bypassing guards or PPE. Include stud/anchor cautions for wall-mounted work.

Current output is browser print. Do not add app-generated PDF, SVG/DXF export, CAD, CNC, FreeCAD, image generation, image upload, public sharing, auth, subscriptions, payments, shopping, pricing, vendor, inventory, marketplace, or Etsy automation unless explicitly requested.

## Testing Expectations

- Add focused tests close to the changed subsystem.
- Generated-plan changes need schema, build-model, quality, and safety regression coverage.
- Route and lifecycle changes need route/action tests.
- Browser-visible flow changes need Playwright coverage when practical.
- Diagram, buying-plan, build-step, or print changes need deterministic view-model/render coverage and, where useful, browser checks.
- Print changes must preserve browser-print-only language and avoid export/download promises.

## Documentation Expectations

When behavior changes, update the relevant source of truth:

- `README.md` for setup, commands, env vars, or broad capability changes.
- `docs/ARCHITECTURE.md` for source-of-truth, storage, subsystem, or boundary changes.
- `docs/VISION.md` for product direction or plan-packet expectations.
- `docs/PRIVATE_MVP_READINESS.md`, `docs/MVP_READINESS.md`, or `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` for readiness and dogfood evidence.
- `docs/qa/boardsmith-feature-user-story-ledger.xlsx` for active QA backlog state, feature/user-story status, test evidence, and retest closure.
- `docs/testing/*` for Codex/browser QA workflow changes.

Do not add speculative roadmap items as implementation commitments. Let repeated private-use friction choose the next implementation lane.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes. APIs, conventions, and file structure may differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing Next.js app code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent Skills

### Issue Tracker

Issues and PRDs for this repo are tracked in GitHub Issues for `byonk19-svg/Boardsmith`. See `docs/agents/issue-tracker.md`.

### Triage Labels

Use the default Matt-style triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain Docs

This is a single-context repo with root `CONTEXT.md` and optional ADRs under `docs/adr/`. See `docs/agents/domain.md`.
