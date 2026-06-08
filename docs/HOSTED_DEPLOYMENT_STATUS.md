# Hosted Deployment Status

Date: June 3, 2026

## Summary

Boardsmith is linked to Vercel, the required hosted environment variable names are present for Preview and Production, and a user-supplied manual hosted smoke passed from an authorized Vercel browser session after the project-intake validation fix.

No deployment was performed by Codex during this pass.

## Hosting Provider Status

Intended provider: Vercel or a similar Next.js host.

Current local provider status:

- Vercel CLI is installed.
- This checkout is linked to a Vercel project named `boardsmith`.
- `.vercel/project.json` is present locally and ignored by git.
- `vercel whoami` succeeds.
- `vercel env ls` succeeds.
- Existing Vercel production deployments are present.

Unauthenticated terminal checks previously returned `401 Unauthorized` from Vercel before Boardsmith route handling. That remains expected while Vercel-level deployment protection is enabled. Manual smoke from an authorized Vercel browser session can reach the Boardsmith app.

## Env Var Checklist Status

The required hosted env vars are documented in `.env.example`, `docs/DEPLOYMENT_READINESS.md`, and `docs/HOSTED_DEPLOYMENT_DRY_RUN.md`.

Hosted provider values were not printed. Vercel reports the required variable names are present and encrypted for Preview and Production.

| Variable | Hosted readiness status |
| --- | --- |
| `OPENAI_API_KEY` | Present in Vercel; encrypted; Preview and Production |
| `OPENAI_MODEL` | Present in Vercel; encrypted; Preview and Production |
| `NEXT_PUBLIC_SUPABASE_URL` | Present in Vercel; encrypted; Preview and Production |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Present in Vercel; encrypted; Preview and Production |
| `SUPABASE_SERVICE_ROLE_KEY` | Present in Vercel; encrypted; Preview and Production |
| `BOARDSMITH_ACCESS_PASSWORD` | Present in Vercel; encrypted; Preview and Production |
| `BOARDSMITH_DATA_FILE` | Local-only optional override; do not rely on it for hosted persistence |

## Build Status

Local production build status: passed during Task 44A.

Expected hosted build command:

```bash
npm run build
```

The app currently builds as a Next.js `16.2.6` App Router application with proxy/middleware enabled for the private access gate.

## Access Gate Status

Code inspection confirms:

- `BOARDSMITH_ACCESS_PASSWORD` enables the private MVP access gate.
- Protected routes redirect to `/access` when no valid access cookie is present.
- Correct password submission sets an HTTP-only verifier cookie.
- The raw password is not stored in the cookie.
- Static framework assets and access routes remain public so the access page can render.

Hosted access-gate behavior was verified manually from an authorized Vercel browser session. Boardsmith `/access` rendered, a wrong password was rejected, and the correct `BOARDSMITH_ACCESS_PASSWORD` granted app access.

## Server-Only Secret Status

Code inspection confirms:

- `SUPABASE_SERVICE_ROLE_KEY` is used by the server storage layer.
- `OPENAI_API_KEY` is used by server-side generation code.
- No client component references `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `BOARDSMITH_ACCESS_PASSWORD`.

Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as server-only hosted environment variables. Do not configure them with `NEXT_PUBLIC_` prefixes.

## Hosted Smoke Status

Unauthenticated terminal smoke could not complete because Vercel-level protection blocked the app before Boardsmith routes rendered.

Attempted unauthenticated hosted checks:

- root route returned `401 Unauthorized` from Vercel
- `/projects` returned `401 Unauthorized` from Vercel
- wrong-password POST to `/access/verify` returned `401 Unauthorized` from Vercel
- Generate Plan POST returned `401 Unauthorized` from Vercel

Authorized browser checks are recorded separately below because Vercel-level protection prevents unauthenticated terminal smoke from reaching Boardsmith routes.

## Authorized Hosted Smoke Status

Task 50C records the user-supplied manual hosted smoke result from an authorized Vercel browser session.

Passed manual checks:

- Hosted deployment loaded from an authorized Vercel browser session.
- Boardsmith `/access` rendered.
- Wrong Boardsmith password was rejected.
- Correct `BOARDSMITH_ACCESS_PASSWORD` granted access.
- Dashboard loaded.
- Projects list loaded.
- New Project loaded.
- Project intake accepted normal values like `12`, `8`, `4`, and `0.75` after the validation fix.
- Hosted smoke project creation worked.
- Notes saved and persisted after refresh.
- Build log saved and persisted after refresh.
- One validated smoke plan generated successfully.
- Latest plan rendered.
- Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, Plan History, Project Record, and print preview rendered.
- Duplicate project worked and started as a draft without generated plans, notes, or build-log content.
- Project list indicators and next actions looked normal.

No hosted URL, screenshots, raw passwords, or secret values were recorded.

## Missing Setup

Remaining decisions before broader private sharing:

1. Decide whether Vercel-level deployment protection plus Boardsmith `/access` is the intended ongoing private access model.
2. Keep Supabase cloud migrations applied before relying on hosted writes.
3. Rerun the hosted smoke checklist after any deployment, env-var change, migration, or access-gate change.

Do not share the hosted URL publicly. Private sharing is reasonable only with intended users who can pass the chosen access layers.

## Archive Migration Note

After `private-mvp-0.7`, hosted archive/restore depends on `public.projects.archived_at` existing in the hosted Supabase database.

Task 71B ran a secret-safe, read-only hosted persistence check on June 8, 2026. The check returned Postgres error `42703`: `column projects.archived_at does not exist`. Hosted archive/restore smoke is blocked until `supabase/migrations/20260607183000_add_project_archive_metadata.sql` is applied through the approved hosted Supabase path. After applying the migration, rerun [docs/HOSTED_ARCHIVE_MIGRATION_READINESS.md](HOSTED_ARCHIVE_MIGRATION_READINESS.md).

Task 71C reran the same secret-safe hosted persistence check on June 8, 2026 after the expected manual migration window. The check still returned Postgres `42703`, so hosted archive/restore smoke remains blocked and no archive/restore hosted actions were run. Task 71D added a copy-paste-ready manual migration runbook in [docs/HOSTED_ARCHIVE_MIGRATION_READINESS.md](HOSTED_ARCHIVE_MIGRATION_READINESS.md).

Task 71E confirmed the local ignored Supabase CLI link can reach the hosted database even though there is no committed `supabase/config.toml`. `supabase db push --dry-run` showed exactly one pending migration, `20260607183000_add_project_archive_metadata.sql`, and `supabase db push --yes` applied it. A linked migration-list check showed `20260607183000` present on remote migration history, and a secret-safe app-facing Supabase read of `projects.id, archived_at` passed. Hosted archive/restore UI smoke is still pending from the intended private hosted access path.

Task 71F attempted secret-safe hosted route checks for `/`, `/projects`, `/projects?archive=archived`, and `/projects?archive=all` against the latest ready production deployment without recording hosted URLs, secrets, project refs, connection strings, row data, screenshots, or sensitive logs. Each route returned Vercel-level `401` protection before Boardsmith route handling, so the hosted archive/restore UI smoke remains blocked from this Codex environment. No hosted archive or restore action was attempted. Run the archive smoke from an authorized private hosted browser session using a clearly labeled non-critical test project.

The authorized manual hosted archive smoke was then reported as passed on June 8, 2026 with no caveats. Hosted `/projects` loaded; Active excluded archived projects; Archived showed archived projects; All showed both active and archived projects; archive and restore worked on a clearly labeled non-critical test project; the dashboard excluded archived projects by default; archived project detail and print preview remained accessible; and copy avoided permanent delete or data-loss wording. No hosted URLs, screenshots, secrets, project refs, connection strings, row data, or sensitive logs were recorded.

Task 72A documents this as the `private-mvp-0.8` hosted archive completion checkpoint. Archive/restore remains private workspace organization only; permanent delete, public sharing, production multi-user behavior, app-generated PDF, SVG/DXF/CAD/CNC export, shopping, pricing, vendor, inventory, and marketplace work remain out of scope.

## Tweak This Plan Hosted Smoke

Task 73D attempted a secret-safe hosted route check on June 8, 2026 before checkpointing the new one-shot `Tweak this plan` flow.

Result from this Codex environment:

- A ready hosted deployment target was discoverable without printing the hosted URL.
- `/` returned Vercel-level `401` before Boardsmith route handling.
- `/projects` returned Vercel-level `401` before Boardsmith route handling.
- The `Tweak this plan` UI smoke was not run from this environment.
- No hosted revision, generation, archive, restore, project mutation, row-data inspection, Supabase cloud action, or secret-bearing output was attempted.
- No hosted URLs, secrets, project refs, connection strings, row data, screenshots, or sensitive logs were recorded.

Manual hosted smoke still required from an authorized private hosted browser session:

- Open an active non-critical project with a latest generated plan.
- Confirm the `Tweak this plan` form appears.
- Submit one simple revision instruction.
- Confirm the revised plan becomes latest and the old plan remains in history.
- Confirm success copy explains the new latest plan is compared with the previous version.
- Confirm comparison copy reads as revised-vs-prior.
- Confirm the `Revised` marker appears in plan history.
- Confirm print preview works for the revised latest plan.
- Confirm archived projects still block new revisions while preserving detail, plan history, and print-preview access.
- Confirm copy avoids engineering approval, structural approval, wall-safety guarantee, child-safety certification, load rating, fabrication-ready output, CAD/CNC readiness, and export claims.

## Protected Hosted Smoke Automation

Task 73E added a secret-safe protected-hosted smoke path for future checks. Vercel-level Deployment Protection should remain enabled. Instead of weakening protection or recording private hosted URLs, configure a dedicated Vercel Protection Bypass for Automation secret and store it only in a secret-safe environment variable.

Prepared automation path:

- Runbook: [docs/HOSTED_SMOKE_AUTOMATION.md](HOSTED_SMOKE_AUTOMATION.md).
- Route helper: `node scripts/hosted-smoke-check.mjs`.
- Required secret-safe env vars: `BOARDSMITH_HOSTED_SMOKE_URL`, `VERCEL_AUTOMATION_BYPASS_SECRET`, and, when the app-level gate is enabled, `BOARDSMITH_ACCESS_PASSWORD`.
- The helper sends `x-vercel-protection-bypass`, requests the Vercel bypass cookie with `x-vercel-set-bypass-cookie: true`, and then keeps the Boardsmith `/access` gate intact.
- Output is sanitized and does not print the hosted URL, host, bypass secret, access password, cookies, request headers, project refs, row data, or sensitive logs.

The protected-hosted smoke bypass path is documented and locally covered by tests, but it still requires the actual `boardsmith-hosted-smoke` Vercel bypass secret to be configured in a secret-safe local, CI, or Codex environment before rerunning hosted `Tweak this plan` smoke.

## Recommendation

Status: provider linked, hosted env names present, and user-supplied authorized hosted smoke passed.

Boardsmith is safe to share only with intended private users who can pass the active access layers. Keep Vercel-level protection and/or the Boardsmith `/access` gate in place while real OpenAI and Supabase keys are configured.

Browser print remains the supported MVP output path. Do not start app-generated PDF/export work as part of hosted smoke follow-up.
