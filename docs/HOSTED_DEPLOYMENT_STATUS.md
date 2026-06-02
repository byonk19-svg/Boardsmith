# Hosted Deployment Status

Date: June 2, 2026

## Summary

Boardsmith is locally ready for a private hosted deployment dry run, but the actual hosted provider configuration is not ready to verify from this checkout yet.

No deployment was performed.

## Hosting Provider Status

Intended provider: Vercel or a similar Next.js host.

Current local provider status:

- Vercel CLI is installed.
- This checkout is not linked to a Vercel project.
- `.vercel/project.json` is not present.
- `vercel env ls` cannot inspect hosted environment variables until the project is linked.
- `vercel whoami` reports the local token is invalid, so Vercel login must be refreshed before provider checks can continue.

Because the project is not linked and authenticated locally, hosted env vars and hosted smoke routes were not verified in this pass.

## Env Var Checklist Status

The required hosted env vars are documented in `.env.example`, `docs/DEPLOYMENT_READINESS.md`, and `docs/HOSTED_DEPLOYMENT_DRY_RUN.md`.

Hosted provider values were not inspected and no secret values were printed.

| Variable | Hosted readiness status |
| --- | --- |
| `OPENAI_API_KEY` | Required; not verified in hosted provider |
| `OPENAI_MODEL` | Required/recommended; not verified in hosted provider |
| `NEXT_PUBLIC_SUPABASE_URL` | Required; not verified in hosted provider |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Required as documented browser-safe config; not verified in hosted provider |
| `SUPABASE_SERVICE_ROLE_KEY` | Required server-only secret; not verified in hosted provider |
| `BOARDSMITH_ACCESS_PASSWORD` | Required before sharing any hosted URL; not verified in hosted provider |
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

Hosted access-gate behavior was not verified because no hosted deployment or linked provider configuration was available.

## Server-Only Secret Status

Code inspection confirms:

- `SUPABASE_SERVICE_ROLE_KEY` is used by the server storage layer.
- `OPENAI_API_KEY` is used by server-side generation code.
- No client component references `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `BOARDSMITH_ACCESS_PASSWORD`.

Keep `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` as server-only hosted environment variables. Do not configure them with `NEXT_PUBLIC_` prefixes.

## Hosted Smoke Status

Hosted smoke was not run because deployment/provider configuration was not available from this checkout.

Not run:

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

1. Log in to Vercel or the chosen hosting provider.
2. Link/import the GitHub repo into the hosting provider.
3. Configure the project as a Next.js app using `npm run build`.
4. Set the required hosted env vars without exposing secret values.
5. Confirm `BOARDSMITH_ACCESS_PASSWORD` is set before sharing any hosted URL.
6. Confirm Supabase cloud migrations remain applied.
7. Run the checklist in `docs/HOSTED_DEPLOYMENT_DRY_RUN.md` against the hosted URL.

For Vercel CLI specifically, the next local commands are expected to be:

```bash
vercel login
vercel link
vercel env ls
```

Do not run `vercel deploy` or create a public deployment until the environment configuration is verified.

## Recommendation

Status: needs provider setup.

Keep Boardsmith local-only for now. It is not ready to share privately from a hosted URL until the hosting provider is linked, required env vars are configured, `BOARDSMITH_ACCESS_PASSWORD` is verified on the hosted deployment, and the hosted smoke checklist passes.

Browser print remains the supported MVP output path. Do not start app-generated PDF/export work before hosted private access is verified.
