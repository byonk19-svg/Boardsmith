# Technical Plan

## Stack

- Next.js App Router
- TypeScript
- Tailwind CSS
- Supabase schema with auth deferred
- OpenAI Responses API structured output
- Zod validation
- Server actions
- Vitest for pure utility tests

## Data

The MVP uses a repository layer:

- Supabase when `NEXT_PUBLIC_SUPABASE_URL` plus a server key are configured.
- Local private JSON storage in `.data/boardsmith.json` otherwise.

This keeps the app usable before auth and hosted database setup while preserving the final table shape.

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

Auth and RLS are deferred for this private MVP. Before production or multi-user use, enable authentication and per-user ownership columns/policies.
