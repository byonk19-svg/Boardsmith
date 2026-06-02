# Hosted Deployment Status

Date: June 2, 2026

## Summary

Boardsmith is linked to Vercel and the required hosted environment variable names are present for Preview and Production. Hosted route smoke is still blocked before the app by Vercel-level access protection, so the Boardsmith app-level `/access` gate has not been verified on the hosted deployment yet.

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

Hosted smoke routes currently return `401 Unauthorized` from Vercel before Boardsmith route handling. The response sets a Vercel SSO nonce cookie, which indicates provider-level protection is active before the app-level private MVP gate.

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

Hosted access-gate behavior was not verified because Vercel-level protection returns `401 Unauthorized` before Boardsmith routes render.

## Server-Only Secret Status

Code inspection confirms:

- `SUPABASE_SERVICE_ROLE_KEY` is used by the server storage layer.
- `OPENAI_API_KEY` is used by server-side generation code.
- No client component references `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `BOARDSMITH_ACCESS_PASSWORD`.

Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as server-only hosted environment variables. Do not configure them with `NEXT_PUBLIC_` prefixes.

## Hosted Smoke Status

Hosted smoke could not complete because Vercel-level protection blocked the app before Boardsmith routes rendered.

Attempted unauthenticated hosted checks:

- root route returned `401 Unauthorized` from Vercel
- `/projects` returned `401 Unauthorized` from Vercel
- wrong-password POST to `/access/verify` returned `401 Unauthorized` from Vercel
- Generate Plan POST returned `401 Unauthorized` from Vercel

Not run because provider-level protection blocked the app:

- root route on hosted URL
- `/projects` redirect to `/access`
- wrong password rejection
- correct password access
- project creation
- notes save/reload
- duplicate project
- generated plan save
- latest plan render
- print preview render
- protected POST route checks

## Missing Setup

Before hosted verification can continue:

1. Decide whether Vercel-level deployment protection is intentional for this private MVP.
2. If Vercel protection is intentional, perform hosted smoke from an authenticated Vercel browser session or configure an approved bypass for smoke testing.
3. If the Boardsmith `BOARDSMITH_ACCESS_PASSWORD` gate should be the primary protection, adjust Vercel protection so the app can render `/access`, then rerun the hosted smoke.
4. Confirm Supabase cloud migrations remain applied.
5. Run the checklist in `docs/HOSTED_DEPLOYMENT_DRY_RUN.md` against the hosted URL.

Do not share the hosted URL until either provider-level protection is intentionally accepted or the Boardsmith app-level access gate is verified on the hosted deployment.

## Recommendation

Status: provider linked and env names present, but hosted app smoke is blocked by Vercel-level protection.

Do not share Boardsmith as a hosted MVP yet. It is not ready to share privately until the intended access model is confirmed and the hosted smoke checklist passes. If Vercel-level protection is the intended access model, smoke it from an authorized session. If Boardsmith's private MVP gate is the intended access model, allow the hosted app to reach `/access` and verify `BOARDSMITH_ACCESS_PASSWORD` there.

Browser print remains the supported MVP output path. Do not start app-generated PDF/export work before hosted private access is verified.
