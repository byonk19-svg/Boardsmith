# Technical Plan

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase schema with auth deferred
- OpenAI Responses API structured output
- Zod validation
- POST route handlers for browser-visible mutations
- Vitest for pure utility tests

## Data

The MVP uses a repository layer:

- Supabase when `NEXT_PUBLIC_SUPABASE_URL` plus a server key are configured.
- Local private JSON storage in `.data/boardsmith.json` otherwise.

This keeps the app usable before auth and hosted database setup while preserving the final table shape.

For the current private no-auth MVP, Supabase persistence should be verified with server-only repository access and `SUPABASE_SERVICE_ROLE_KEY` in local runtime env. Do not expose that key with a `NEXT_PUBLIC_` name or move Supabase writes into client code. `NEXT_PUBLIC_SUPABASE_ANON_KEY` is reserved for future authenticated/client flows and is not enough for the private no-auth persistence smoke.

Project creation and plan generation use explicit POST route handlers for browser-visible form submissions. This keeps the private MVP form flow stable without relying on framework-specific server-action form replay.

## Validation

- Project intake is validated before saving.
- Safety flags are calculated deterministically before AI generation.
- Template hints are selected deterministically by project type.
- Generated plans must validate against the Zod plan schema before persistence.

## AI Generation

The generation service uses OpenAI structured output with a JSON schema and then validates the parsed JSON with Zod. Invalid or missing output is not saved.

## Supabase

`supabase/migrations/0001_initial_schema.sql` defines:

- `projects`
- `generated_project_plans`
- updated-at trigger
- latest-plan constraint support

`supabase/migrations/0002_add_build_model_json_to_generated_plans.sql` adds nullable `build_model_json` to generated plan versions. This keeps BBM versioned with the human-readable plan and remains backward-compatible with older plans that do not have a build model.

`supabase/migrations/20260530225127_harden_private_mvp_grants.sql` enables RLS as a defensive baseline, revokes anonymous/authenticated table access, and grants table access to `service_role` for the current server-only private MVP.

Auth policies are deferred for this private MVP. Before production or multi-user use, add authentication plus per-user ownership columns/policies. Keep future grant decisions deliberate; do not work around policy blockers by exposing anonymous write access.
