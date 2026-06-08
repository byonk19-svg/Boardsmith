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

After `private-mvp-0.7`, hosted archive/restore depends on `public.projects.archived_at` existing in the hosted Supabase database. This checkout has no `supabase/config.toml`, so Codex did not run a Supabase cloud push from here.

Task 71B ran a secret-safe, read-only hosted persistence check on June 8, 2026. The check returned Postgres error `42703`: `column projects.archived_at does not exist`. Hosted archive/restore smoke is blocked until `supabase/migrations/20260607183000_add_project_archive_metadata.sql` is applied through the approved hosted Supabase path. After applying the migration, rerun [docs/HOSTED_ARCHIVE_MIGRATION_READINESS.md](HOSTED_ARCHIVE_MIGRATION_READINESS.md).

Task 71C reran the same secret-safe hosted persistence check on June 8, 2026 after the expected manual migration window. The check still returned Postgres `42703`, so hosted archive/restore smoke remains blocked and no archive/restore hosted actions were run.

## Recommendation

Status: provider linked, hosted env names present, and user-supplied authorized hosted smoke passed.

Boardsmith is safe to share only with intended private users who can pass the active access layers. Keep Vercel-level protection and/or the Boardsmith `/access` gate in place while real OpenAI and Supabase keys are configured.

Browser print remains the supported MVP output path. Do not start app-generated PDF/export work as part of hosted smoke follow-up.
