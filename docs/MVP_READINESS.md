# Boardsmith MVP Readiness

## Status

Boardsmith is a private MVP woodworking planning app. The current baseline is verified for local JSON fallback, Supabase-backed persistence, live OpenAI structured-output generation, generated-plan validation, build-model storage, plan history, user-facing Plan Review status, Export Readiness, Material Summary, Cut List Review, a manifest-backed Printable Plan Sheet, browser print preview at `/projects/[id]/print`, blocked-generation feedback, and an optional private MVP access gate.

The app is ready for continued private MVP hardening. It is not ready for public multi-user production use, paid use, public sharing, certified safety workflows, CAD/CNC workflows, or file export workflows.

## Current Verified Capabilities

- App routes load for `/`, `/projects`, `/projects/new`, `/projects/[id]`, and `/settings`.
- Project creation works from `/projects/new`.
- Project detail pages render project metadata, project intake, safety flags, template-driven context, Project Structure, Material Summary, Cut List Review, latest generated plan, Plan Review, Export Readiness, Printable Plan Sheet, browser print preview link, and plan history.
- Local JSON fallback persists projects and generated plans in `.data/boardsmith.json` when Supabase env vars are absent.
- `BOARDSMITH_DATA_FILE` can point the local fallback at a different JSON file for isolated local runs or tests.
- Supabase-backed persistence works when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
- Missing `OPENAI_API_KEY` behavior is graceful and does not save placeholder plans.
- Live OpenAI generation has been verified.
- Generated plans validate against the Zod generated-plan schema before save.
- Generated plans are checked against deterministic build-model quality rules before save when a build model is available.
- Build model JSON is stored with generated plan versions.
- Older generated plan rows without build-model JSON remain readable through a derived compatibility model.
- Plan history preserves previous generated plans and marks the latest version.
- Plan Review summarizes passed, warning, and blocked states for generated plans.
- Export Readiness summarizes not-ready, needs-review, and ready-for-future-polish states without creating export files.
- Material Summary groups primary materials, hardware/fasteners, finish/optional supplies, and material assumptions.
- Cut List Review surfaces missing dimensions, vague pieces, quantity issues, duplicate-looking entries, and cutting reminders.
- `createPrintablePlanManifest` gathers project, generated plan, build model, review, material, cut-list, safety, assumption, disclaimer, and future export note data for print-facing rendering.
- The Printable Plan Sheet consumes the printable plan manifest.
- `/projects/[id]/print` renders a browser print preview for an existing generated plan and tells users to use the browser print dialog for paper copies.
- `BOARDSMITH_ACCESS_PASSWORD` can enable a temporary private MVP password gate for hosted deployments.

## Verified Smoke Flows

- Load `/`.
- Load `/projects`.
- Load `/projects/new`.
- Load `/settings`.
- Create a new project through `/projects/new`.
- Confirm redirect to `/projects/[id]`.
- Confirm project list/detail data loads from Supabase when Supabase is configured.
- Confirm the same create/list/detail flow uses local JSON fallback when Supabase is not configured.
- Generate a plan with `OPENAI_API_KEY` present.
- Confirm generated output validates before save.
- Confirm generated plan saves to Supabase.
- Confirm latest plan displays on the project detail page.
- Generate a second plan and confirm plan history keeps the previous version.
- Confirm Project Structure and Plan Review render on generated-plan detail pages.
- Confirm Material Summary, Cut List Review, Export Readiness, and Printable Plan Sheet render on generated-plan detail pages.
- Open `/projects/[id]/print` for an existing generated project.
- Confirm browser print preview renders review sections and planning-aid safety copy.

## Environment Setup Checklist

1. Run `npm install`.
2. Copy `.env.example` to `.env.local`.
3. For local fallback only, leave Supabase variables blank.
4. For live generation, set `OPENAI_API_KEY`.
5. Optionally set `OPENAI_MODEL`; it defaults to `gpt-4.1-mini`.
6. Start development with `npm run dev`.
7. Before committing, run the full verification suite.

Environment variables:

- `OPENAI_API_KEY`: required for live AI plan generation.
- `OPENAI_MODEL`: optional OpenAI model override.
- `NEXT_PUBLIC_SUPABASE_URL`: required for Supabase persistence.
- `SUPABASE_SERVICE_ROLE_KEY`: server-only key required for the current private no-auth Supabase persistence path.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: reserved for future authenticated/client flows and not sufficient for current private MVP writes.
- `BOARDSMITH_DATA_FILE`: optional local fallback JSON path override.
- `BOARDSMITH_ACCESS_PASSWORD`: optional private MVP password gate. Leave blank for local-only development without the gate.

## Private MVP Access Gate

If `BOARDSMITH_ACCESS_PASSWORD` is unset, Boardsmith remains directly usable for local development.

If `BOARDSMITH_ACCESS_PASSWORD` is set, the app redirects protected routes to `/access`. The access form posts the password server-side and sets an HTTP-only cookie containing a derived verifier, not the raw password. This protects project creation, project detail routes, Generate Plan routes, settings, and browser print preview routes behind the same temporary gate.

This is not full authentication, per-user authorization, or multi-user account management. Use real auth and per-user RLS before public multi-user production use.

## Supabase Setup Checklist

1. Create or select a Supabase project.
2. Set `NEXT_PUBLIC_SUPABASE_URL` in `.env.local`.
3. Set `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`.
4. Keep `SUPABASE_SERVICE_ROLE_KEY` out of client code, browser-visible logs, committed files, and `NEXT_PUBLIC_` variables.
5. Apply the SQL migrations in `supabase/migrations/`.
6. Confirm `projects` and `generated_project_plans` exist.
7. Confirm `generated_project_plans.build_model_json` exists and is nullable.
8. Confirm private MVP grants allow server-only `service_role` access.
9. Run the project create/list/detail smoke through the app.

Current Supabase posture:

- Auth is deferred.
- Per-user ownership and authenticated RLS policies are deferred.
- Anonymous and authenticated table access should not be used for private MVP writes.
- The repository layer uses `SUPABASE_SERVICE_ROLE_KEY` server-side only.

## OpenAI Setup Checklist

1. Set `OPENAI_API_KEY` in `.env.local`.
2. Optionally set `OPENAI_MODEL`.
3. Start the app.
4. Create or open a project with enough dimensions and material data for a useful plan.
5. Submit Generate Plan from the project detail page.
6. Confirm the app either saves a validated plan or shows a clear error.
7. Confirm no generated output is saved if schema validation or deterministic quality checks fail.

Current generation behavior:

- Uses OpenAI structured output.
- Parses JSON and validates it with Zod.
- Includes deterministic safety flags, project-type template hints, and build-model context.
- Rejects unvalidated output.
- Rejects output that conflicts with build-model quality checks when a build model is available.
- Saves the generated plan, rendered Markdown, warnings, assumptions, confidence, model name, latest-plan marker, and build-model JSON.

## Safety Limitations

Boardsmith plans are planning aids only.

Boardsmith does not provide:

- structural engineering review
- load ratings
- child or baby safety certification
- wall-mounting safety guarantees
- professional safety approval
- tool-manual replacement
- CAD/CNC manufacturability guarantees

Users must manually review dimensions, materials, tool choice, PPE, wall structure, fasteners, anchors, finish labels, and all safety assumptions before cutting or building.

The Plan Review panel can surface deterministic issues and warnings, but it cannot verify real-world material condition, wall construction, load capacity, installation safety, or user skill.

## Known Caveats

- This is a private MVP with optional password-gate protection, not full auth.
- Supabase persistence currently depends on a server-only service-role key.
- Local JSON fallback is private local storage, not a sync system.
- Existing generated plans without `build_model_json` use a derived compatibility model on read.
- The Plan Review summary is computed on read; it is not stored as a separate review record.
- The build model is not CAD and is not a manufacturing model.
- Export readiness notes and browser print preview exist, but app-generated PDF/SVG/DXF export does not.
- Browser print preview is not a download pipeline and does not generate files.
- The app has no image upload, public sharing, marketplace flow, subscriptions, payments, FreeCAD, CAD, or CNC features.

## Deferred Features

- Full authentication and per-user RLS.
- Public sharing.
- Payments and subscriptions.
- Marketplace or Etsy workflows.
- Image upload.
- App-generated PDF export.
- SVG/PDF/DXF export.
- FreeCAD, CAD, CNC, or router-specific output.
- New project types beyond the current supported beginner-friendly set.
- Load-rating or professional safety workflows.

## Recommended Next Task Order

1. Verify the private MVP access gate in any hosted environment before sharing a URL.
2. Decide whether to stay with browser print, approve a server-side HTML-to-PDF dependency spike, or defer PDF.
3. If approved, implement the narrow PDF spike from `docs/PDF_EXPORT_SPIKE_PLAN.md`.
4. Or polish print preview if manual use reveals issues.
5. Later SVG research note.
6. Much later DXF/CAD/CNC research.

## Internal Release Checklist

Use [docs/INTERNAL_RELEASE_CHECKLIST.md](INTERNAL_RELEASE_CHECKLIST.md) before starting real export-generation work. It captures the current manual smoke checklist, safety limits, non-goals, and browser print preview status.

Use [docs/EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md) for the export approach decision. It keeps browser print preview, future PDF work, SVG research, and later DXF/CAD/CNC research separated.

Use [docs/PDF_EXPORT_SPIKE_PLAN.md](PDF_EXPORT_SPIKE_PLAN.md) before adding app-generated PDF. It recommends browser print for the current MVP and a separate approval gate before any server-side PDF renderer dependency.

## Verification Checklist

Run before committing readiness or app changes:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```
