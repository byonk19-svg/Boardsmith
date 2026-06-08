# Boardsmith

Boardsmith is a private MVP web app for generating detailed, reviewable woodworking and craft project plans. Users enter project details, the app applies deterministic safety and template context, then OpenAI returns structured JSON that is validated before it can be saved.

## Private MVP Checkpoint

Current checkpoint: `private-mvp-0.6`, created after the dashboard usability pass.

This checkpoint records that local MVP dogfood and authorized hosted Vercel browser smoke passed, including the Boardsmith password gate, hosted project creation, notes, build log, plan generation, review surfaces, duplicate project, and browser print preview. It also includes post-MVP polish for intake examples and starters, generated-plan readability, browser-rendered visual planning aids, the improved browser print shop-plan flow, project-list search/filter/order polish, and a private workspace dashboard with recent-project shortcuts and starter links. Boardsmith remains private-only and is not public-launch ready.

## Current MVP Capabilities

- Next.js App Router application shell.
- Project intake for supported beginner-friendly project types.
- Private local JSON fallback plus verified Supabase-backed persistence.
- Deterministic safety-review flags before AI generation.
- Project-type template hints used in AI prompt context.
- Zod-validated generated plan schema.
- OpenAI structured-output generation that rejects invalid JSON.
- Deterministic Boardsmith Build Model project structure saved with generated plan versions.
- Plan Review panel that surfaces blocking issues, warnings, manual-review reminders, and planning-aid safety copy.
- Export Readiness checks for future printable/SVG/PDF-style work without generating export files.
- Material Summary and Cut List Review sections for deterministic review before building.
- Manifest-backed Printable Plan Sheet on project detail pages.
- Browser print preview route at `/projects/[id]/print` with a shop-plan flow for paper-copy review through the user's browser print dialog.
- Browser-rendered project anatomy, three-view planning diagram, visual piece inventory, connection planning aids, action checklist, and beginner-friendly build step cards for supported generated plans.
- Private dashboard with project counts, latest update date, recent project shortcuts, empty state, and starter example links.
- Project detail pages with project metadata, safety flags, template hints, material summary, latest generated plan, browser print preview link, and generated plan history.
- Project list search, updated-first ordering, filters for project type/status/plan state/record state, compact scan badges, and clear open/latest-plan/generate actions.
- Optional private MVP password gate for hosted deployments.

## Supported Project Types

- Door hanger
- Layered cutout
- Wood sign
- Simple shelf
- Planter box

Complex furniture, CAD, exports, public sharing, image upload, payments, and marketplace workflows are intentionally deferred.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `OPENAI_API_KEY` to `.env.local` before using plan generation. If Supabase variables are not configured, the private MVP stores data in `.data/boardsmith.json`. Use `BOARDSMITH_DATA_FILE` only when you need to point the local fallback at a different JSON file, such as isolated test data.

If Boardsmith is deployed to a public URL with real OpenAI or Supabase keys, set `BOARDSMITH_ACCESS_PASSWORD` before sharing the URL. When this variable is present, app routes require the private MVP password before use. The gate stores a derived HTTP-only cookie value, not the raw password. This is temporary private-MVP protection, not full authentication or multi-user accounts.

Required or commonly used environment variables:

- `OPENAI_API_KEY`: required only for live plan generation.
- `OPENAI_MODEL`: optional, defaults to `gpt-4.1-mini`.
- `NEXT_PUBLIC_SUPABASE_URL`: required with `SUPABASE_SERVICE_ROLE_KEY` for Supabase persistence.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key for the current private no-auth MVP repository layer.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: reserved for future authenticated/client flows.
- `BOARDSMITH_DATA_FILE`: optional local JSON fallback override.
- `BOARDSMITH_ACCESS_PASSWORD`: optional private MVP password gate for hosted deployments.

### Supabase persistence

Supabase is optional for local development. The app uses Supabase only when the runtime has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it through `NEXT_PUBLIC_` variables, client components, browser logs, or committed files. For the current private no-auth MVP, use the service-role key only from server-rendered routes/pages through the repository layer.

Apply the SQL in `supabase/migrations/` before running a Supabase-backed smoke. The migrations create `projects`, `generated_project_plans`, the latest-plan partial unique index, the `updated_at` trigger, nullable `build_model_json` plan-version storage, and private MVP grants for server-only `service_role` access.

To verify Supabase persistence, create `.env.local` from `.env.example`, set the Supabase values above, start the dev server, then create a project through `/projects/new`. The project should redirect to `/projects/[id]`, appear in `/projects`, and continue to load with `.data/boardsmith.json` unchanged. If the Supabase env vars are absent, the same flow uses the private local JSON fallback.

Generated plans are saved only after Zod schema validation. When a deterministic build model is available, the app also checks generated output for project type, bounded dimensions, required safety warnings, cut-list material/piece alignment, and overconfident safety claims. Valid saved plan versions include `build_model_json` so older plan history can remain reproducible. Older rows without stored build-model JSON are still readable; the detail page derives a compatibility model and shows that in the review copy.

For the current readiness snapshot and next task order, see [docs/MVP_READINESS.md](docs/MVP_READINESS.md), [docs/INTERNAL_RELEASE_CHECKLIST.md](docs/INTERNAL_RELEASE_CHECKLIST.md), and [docs/DEPLOYMENT_READINESS.md](docs/DEPLOYMENT_READINESS.md).

## Verification

Run these before committing:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

## Safety Limitations

Generated plans are planning aids only. Users must review all dimensions, tool choices, wall-mounting details, load assumptions, and safety steps before cutting or building. The app does not provide structural engineering, child-furniture certification, load ratings, or professional safety approval.

## Deferred Roadmap

- Full authentication and per-user row-level security.
- SVG/PDF/DXF export.
- App-generated PDF downloads.
- CNC/router-specific output.
- 3D CAD or FreeCAD integration.
- Image upload or generated imagery.
- Marketplace, Etsy, payments, subscriptions, and public sharing.
