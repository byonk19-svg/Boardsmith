# Deployment Readiness

Date: June 2, 2026

## Purpose

This document captures the requirements for safely hosting Boardsmith as a private MVP. It is a readiness checklist, not a deployment record.

Do not deploy Boardsmith to a public URL without `BOARDSMITH_ACCESS_PASSWORD` or stronger access control.

## Current Hosting Posture

Boardsmith can be hosted as a private MVP when the required server environment variables are configured and the private access gate is enabled.

Current output support is browser print only. The app has no app-generated PDF, SVG, DXF, CAD, CNC, download, or export pipeline.

## Required Production Environment Variables

- `OPENAI_API_KEY`: server-only OpenAI API key for live plan generation.
- `OPENAI_MODEL`: OpenAI model name. If omitted, the app defaults to `gpt-4.1-mini`.
- `NEXT_PUBLIC_SUPABASE_URL`: browser-safe Supabase project URL.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: browser-safe Supabase anon key, reserved for future authenticated/client flows.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only Supabase service-role key for the current private no-auth MVP repository layer.
- `BOARDSMITH_ACCESS_PASSWORD`: private MVP access password for hosted deployments.

## Optional Local Environment Variables

- `BOARDSMITH_DATA_FILE`: optional local JSON fallback path override for isolated local runs or tests.

## Access Gate Behavior

- If `BOARDSMITH_ACCESS_PASSWORD` is not set, local/dev usage remains directly accessible.
- If `BOARDSMITH_ACCESS_PASSWORD` is set, protected routes redirect to `/access` until a valid access cookie is present.
- The access form posts the password server-side.
- A correct password sets an HTTP-only verifier cookie.
- The raw password is not stored in the cookie.
- This gate is temporary private MVP protection. It is not full authentication, multi-user authorization, or per-user access control.

## Protected Routes And Actions

When the access password is configured, verify the gate protects:

- project list pages
- project detail pages
- project creation pages and actions
- Generate Plan POST routes
- project notes POST routes
- duplicate project POST routes
- browser print preview routes
- settings

Static assets and framework internals should remain reachable so the access page can render correctly.

## Server-Only Secret Boundaries

`SUPABASE_SERVICE_ROLE_KEY` must never be exposed client-side. Do not place it in a `NEXT_PUBLIC_` variable, client component, browser-visible log, committed file, screenshot, or hosted frontend config.

`OPENAI_API_KEY` must never be exposed client-side. It should only be used by server-side generation code.

The current code inspection found:

- `SUPABASE_SERVICE_ROLE_KEY` is referenced by the server storage layer.
- `OPENAI_API_KEY` is referenced by server-side generation and setup-status rendering.
- No client component references `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY`.

Re-run this inspection before sharing a hosted URL.

## Hosting Checklist

1. Confirm the hosted environment has all required production env vars.
2. Confirm `BOARDSMITH_ACCESS_PASSWORD` is set before sharing any hosted URL.
3. Confirm `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` are configured as server-only secrets.
4. Confirm Supabase migrations have been applied, including the atomic generated-plan save RPC and `projects.notes`.
5. Run `npm run build`.
6. Deploy only after the build is green.
7. Open the hosted URL without an access cookie and confirm protected routes redirect to `/access`.
8. Confirm a wrong password is rejected.
9. Confirm the correct password allows app access and sets an HTTP-only cookie.
10. Create one clearly labeled private smoke project.
11. Generate one plan and confirm it saves, renders as latest, and keeps invalid output out of persistence.
12. Save and reload one project note.
13. Duplicate the smoke project and confirm generated plans/history/notes are not copied.
14. Open the browser print preview route for the generated project.
15. Confirm browser print remains the only MVP output path.

## Post-Deploy Smoke Routes

Check these routes on the hosted URL:

- `/`
- `/projects`
- `/projects/new`
- `/settings`
- `/projects/[id]` for one existing generated project
- `/projects/[id]/print` for one existing generated project

Also verify these POST routes are protected without a valid access cookie:

- `/projects/create`
- `/projects/[id]/generate`
- `/projects/[id]/notes`
- `/projects/[id]/duplicate`

## Rollback Notes

If the access gate fails on a hosted URL:

1. Stop sharing the URL immediately.
2. Disable or unpublish the deployment if possible.
3. Fix the hosted `BOARDSMITH_ACCESS_PASSWORD` configuration.
4. Rotate the access password if it was shared too broadly.
5. Rotate `SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` if either secret may have been exposed.
6. Re-run the hosted access-gate smoke before sharing the URL again.

## Non-Goals

- No full auth provider.
- No public launch.
- No public sharing.
- No payments or subscriptions.
- No app-generated PDF export.
- No export/download pipeline.
- No SVG, DXF, CAD, FreeCAD, CNC, nesting, optimization, or production fabrication files.
- No shopping list, pricing, vendor, inventory, marketplace, or purchasing integrations.
- No new project types.

## Deployment Recommendation

Boardsmith is ready for a private hosted MVP only after the hosting environment is configured with `BOARDSMITH_ACCESS_PASSWORD` and server-only Supabase/OpenAI secrets, and the hosted smoke checklist above passes.

Do not start app-generated PDF/export work until the hosted private MVP surface has been verified.
