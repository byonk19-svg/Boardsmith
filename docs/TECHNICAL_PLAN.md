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

Generated plan versions store:

- schema-valid `plan_json`
- rendered `plan_markdown`
- `warnings`, `assumptions`, confidence, model name, and latest-plan marker
- nullable `build_model_json` for the deterministic project structure used during generation

Older plan rows without `build_model_json` remain readable. The project detail page derives a compatibility build model from the saved project intake and surfaces that fallback in the Plan Review copy.

## Validation

- Project intake is validated before saving.
- Safety flags are calculated deterministically before AI generation.
- Template hints are selected deterministically by project type.
- Generated plans must validate against the Zod plan schema before persistence.
- When a build model is available, generated plans must pass deterministic quality checks before persistence.
- Project detail computes a user-facing Plan Review summary on read instead of storing separate quality-review rows.
- The printable plan manifest in `lib/plans/printable-plan-manifest.ts` gathers project, generated plan, build model, Plan Review, Export Readiness, Material Summary, Cut List Review, safety notes, assumptions, unresolved questions, disclaimers, and future export notes into one deterministic structure for print-facing rendering.

## AI Generation

The generation service uses OpenAI structured output with a JSON schema and then validates the parsed JSON with Zod. Invalid or missing output is not saved.

The generation prompt includes deterministic safety flags, project-type template hints, build-model context, and quality rules. The app does not loosen validation to accept weak AI output and does not persist unvalidated output.

If `OPENAI_API_KEY` is missing, generation fails gracefully with setup-focused copy instead of saving a partial or placeholder plan. `OPENAI_MODEL` is optional and defaults to `gpt-4.1-mini`.

## UI Readiness

Current project detail rendering includes:

- project metadata and intake summary
- deterministic safety flags
- project-type template hint effects
- deterministic Project Structure from the Boardsmith Build Model
- material summary
- cut-list review
- latest generated plan
- Plan Review panel with passed/warnings/blocked status, issue counts, blocking messages, warnings, manual-review reminders, and safety disclaimer
- Export Readiness panel for future export polish without generated files
- manifest-backed Printable Plan Sheet
- browser print preview page at `/projects/[id]/print`
- plan history with compact review badges

The Plan Review panel is a planning aid. It does not certify safety, load capacity, wall mounting, or professional engineering approval.

The browser print preview page is read-only and uses the same printable plan manifest as the project detail page. It relies on the user's browser print dialog for paper copies. It is not an app-generated PDF, SVG, DXF, CAD, CNC, download, or export pipeline.

Future export work should follow [docs/EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md). The key decision is that exports consume `createPrintablePlanManifest` instead of scraping rendered page UI or duplicating derivation logic.

The PDF spike plan in [docs/PDF_EXPORT_SPIKE_PLAN.md](PDF_EXPORT_SPIKE_PLAN.md) recommends keeping browser print as the current MVP path and approving any future server-side HTML-to-PDF renderer dependency before implementation.

## Supabase

`supabase/migrations/0001_initial_schema.sql` defines:

- `projects`
- `generated_project_plans`
- updated-at trigger
- latest-plan constraint support

`supabase/migrations/0002_add_build_model_json_to_generated_plans.sql` adds nullable `build_model_json` to generated plan versions. This keeps BBM versioned with the human-readable plan and remains backward-compatible with older plans that do not have a build model.

`supabase/migrations/20260530225127_harden_private_mvp_grants.sql` enables RLS as a defensive baseline, revokes anonymous/authenticated table access, and grants table access to `service_role` for the current server-only private MVP.

Auth policies are deferred for this private MVP. Before production or multi-user use, add authentication plus per-user ownership columns/policies. Keep future grant decisions deliberate; do not work around policy blockers by exposing anonymous write access.
