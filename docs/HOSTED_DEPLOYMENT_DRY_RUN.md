# Hosted Deployment Dry Run

Date: June 2, 2026

## Purpose

This is a practical handoff checklist for hosting Boardsmith as a private MVP. It prepares the deployment steps and smoke checks without deploying the app.

Do not share a hosted Boardsmith URL until the private access gate has been verified on that hosted URL.

## Hosting Target Assumptions

Boardsmith is a Next.js App Router app and should be deployable to Vercel or a similar Next.js hosting provider that supports:

- Next.js `16.2.6`
- React `19.2.6`
- server-side environment variables
- middleware/proxy route protection
- Node.js runtime support for server-side Supabase and OpenAI calls

Expected commands:

- Install: `npm install`
- Build: `npm run build`
- Start locally after build: `npm run start`

Expected production build shape:

- dynamic app routes for project pages, settings, access, notes, duplicate, generate, and print preview
- static `/projects/new`
- middleware/proxy enabled for the private access gate

## Required Hosted Environment Variables

Configure these in the hosting provider before deployment:

- `OPENAI_API_KEY`: server-only OpenAI key for live generation.
- `OPENAI_MODEL`: model name; current default is `gpt-4.1-mini`.
- `NEXT_PUBLIC_SUPABASE_URL`: browser-safe Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase anon key, currently reserved for future authenticated/client flows.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key for private MVP persistence.
- `BOARDSMITH_ACCESS_PASSWORD`: required for any public or shared hosted URL.

## Optional Or Local-Only Environment Variables

- `BOARDSMITH_DATA_FILE`: optional local JSON fallback path for isolated local runs or tests.

Do not rely on `BOARDSMITH_DATA_FILE` for hosted production persistence. Hosted filesystem storage may be ephemeral. Use Supabase-backed persistence for hosted private MVP smoke checks.

## Secret Handling

- Keep `SUPABASE_SERVICE_ROLE_KEY` server-only.
- Keep `OPENAI_API_KEY` server-only.
- Do not expose service-role or OpenAI keys through `NEXT_PUBLIC_*` variables.
- Do not commit `.env`, `.env.local`, hosted env exports, screenshots containing secrets, logs containing secrets, or runtime data.
- Treat `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as browser-visible values.
- Rotate `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY` immediately if either is exposed.

Current code inspection found no client component referencing `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `BOARDSMITH_ACCESS_PASSWORD`.

## Pre-Deploy Checklist

1. Confirm local branch is `main`.
2. Confirm latest local `main` matches `origin/main`.
3. Confirm working tree is clean.
4. Confirm Supabase cloud migrations are applied, including:
   - atomic generated-plan save RPC
   - `projects.notes`
5. Choose a private `BOARDSMITH_ACCESS_PASSWORD`.
6. Configure all required hosted environment variables in the hosting provider.
7. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are server-only secrets in the hosting provider.
8. Confirm no service-role or OpenAI key is configured as `NEXT_PUBLIC_*`.
9. Run `npm install` if dependencies are not already installed.
10. Run `npm run build`.
11. Run the standard verification suite:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

Do not deploy if any check fails.

## Post-Deploy Smoke Checklist

Run these checks on the hosted URL before sharing it.

### Access Gate

1. Visit `/`.
2. Visit `/projects` without an access cookie.
3. Confirm `/projects` redirects to `/access`.
4. Submit the wrong password.
5. Confirm the wrong password is rejected and does not grant app access.
6. Submit the correct password.
7. Confirm access is granted.
8. Confirm the access cookie is HTTP-only and does not contain the raw password.

### Protected Routes And Actions

Without a valid access cookie, verify these routes/actions redirect to `/access`:

- `/projects`
- `/projects/new`
- `/settings`
- `/projects/[id]`
- `/projects/[id]/print`
- `POST /projects/create`
- `POST /projects/[id]/generate`
- `POST /projects/[id]/notes`
- `POST /projects/[id]/duplicate`

### Private MVP Workflow

1. Create a clearly labeled hosted smoke project.
2. Confirm redirect to the new project detail page.
3. Save a project note.
4. Reload the project detail page and confirm the note persists.
5. Duplicate the project.
6. Confirm the duplicate does not copy notes, generated plans, or plan history.
7. Generate one clearly labeled smoke plan.
8. Confirm the latest plan renders.
9. Confirm Plan Review renders.
10. Confirm Export Readiness renders.
11. Confirm Material Summary and Cut List Review render.
12. Confirm browser print preview renders at `/projects/[id]/print`.
13. Confirm browser print remains the supported MVP output path.

### Blocked Generation Feedback

If practical, trigger or reuse a project that causes deterministic review blocking.

Confirm:

- the project detail page shows calm blocked-generation feedback
- the page says no plan was saved
- raw Zod/schema/internal quality errors are not exposed
- invalid output is not persisted

## Rollback Plan

If the hosted smoke fails:

1. Do not share the URL.
2. Remove, disable, or restrict the deployment URL.
3. Fix the hosted environment configuration.
4. Rotate `BOARDSMITH_ACCESS_PASSWORD` if it was shared too broadly.
5. Rotate `OPENAI_API_KEY` and `SUPABASE_SERVICE_ROLE_KEY` if either may have been exposed.
6. Re-run the full hosted smoke checklist before sharing the URL again.

## Non-Goals

- No deployment in this dry-run task.
- No full auth provider.
- No public launch.
- No public sharing.
- No payments or subscriptions.
- No image upload.
- No marketplace, shopping, pricing, vendor, purchasing, or inventory features.
- No app-generated PDF export.
- No SVG, DXF, CAD, FreeCAD, CNC, nesting, optimization, or production fabrication files.
- No new project types.

## Recommendation

The next step is to run this checklist against the actual hosting provider configuration before sharing any hosted Boardsmith URL.

Do not begin app-generated PDF/export work until the hosted private MVP surface is verified.
