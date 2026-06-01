# Boardsmith Internal MVP Release Checklist

## Status Snapshot

Boardsmith is a private MVP woodworking planning app. The current tested baseline supports project intake, Supabase or local JSON persistence, live OpenAI structured-output generation, generated-plan validation, stored build-model JSON, plan history, deterministic review panels, a manifest-backed Printable Plan Sheet, and a browser print preview route at `/projects/[id]/print`.

This checklist is for internal readiness before any real export-generation work. Browser print preview exists. App-generated PDF, SVG, DXF, CAD, CNC, download, pricing, shopping, vendor, inventory, auth, payment, public sharing, and marketplace features do not exist.

## Environment Setup

- [ ] Run `npm install`.
- [ ] Copy `.env.example` to `.env.local`.
- [ ] Decide whether the smoke will use local JSON fallback or Supabase-backed persistence.
- [ ] Start the app with `npm run dev`.
- [ ] Keep `.env.local` and service keys out of git.

## Required Env Vars

- [ ] `OPENAI_API_KEY` is present only when live AI generation will be tested.
- [ ] `OPENAI_MODEL` is optional and may be omitted to use the app default.
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is present only for Supabase-backed persistence.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` is present only server-side for the current private no-auth MVP repository layer.
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is understood as reserved for future authenticated/client flows.
- [ ] `BOARDSMITH_DATA_FILE` is set only when an isolated local JSON fallback path is needed.

## Local JSON Fallback Mode

- [ ] Remove or leave blank Supabase runtime vars.
- [ ] Create a project through `/projects/new`.
- [ ] Confirm redirect to `/projects/[id]`.
- [ ] Confirm `/projects` lists the project.
- [ ] Restart the dev server.
- [ ] Confirm the project still loads from local JSON fallback.

## Supabase-Backed Mode

- [ ] Confirm `NEXT_PUBLIC_SUPABASE_URL` is configured.
- [ ] Confirm `SUPABASE_SERVICE_ROLE_KEY` is configured without printing it.
- [ ] Confirm migrations in `supabase/migrations/` have been applied.
- [ ] Create a project through `/projects/new`.
- [ ] Confirm project list/detail persistence uses Supabase.
- [ ] Confirm `.data/boardsmith.json` is not required for the Supabase-backed smoke.
- [ ] Confirm generated plans save with nullable `build_model_json`.

## OpenAI Generation Happy Path

- [ ] Confirm `OPENAI_API_KEY` is present without printing it.
- [ ] Open an existing project or create one with dimensions, material thickness, tools, and intended use.
- [ ] Submit Generate Plan.
- [ ] Confirm the response validates against the Zod generated-plan schema before save.
- [ ] Confirm deterministic quality checks pass before save.
- [ ] Confirm the latest generated plan appears on the project detail page.
- [ ] Generate a second plan and confirm the first plan remains in history.

## Missing OpenAI Key Failure Path

- [ ] Remove or omit `OPENAI_API_KEY`.
- [ ] Submit Generate Plan from a project detail page.
- [ ] Confirm the app shows setup-focused error copy.
- [ ] Confirm no placeholder or invalid generated plan is saved.
- [ ] Confirm the project remains readable.

## Project Creation

- [ ] `/projects/new` loads.
- [ ] Intake copy asks for useful dimensions, material, tools, constraints, mounting or weight-bearing expectations, indoor/outdoor use, finish preferences, and safety-sensitive use.
- [ ] Supported beginner project types are the only selectable project types.
- [ ] Save redirects to `/projects/[id]`.

## Project Detail Rendering

- [ ] Project metadata renders.
- [ ] Project intake details render.
- [ ] Safety flags render when deterministic flags are triggered.
- [ ] Template Guidance renders as planning guidance, not a finished plan.
- [ ] Project Structure renders from saved `build_model_json` when available.
- [ ] Older plans without `build_model_json` render with a derived compatibility model.

## Plan History

- [ ] Latest generated plan is marked latest.
- [ ] Previous generated plans remain visible.
- [ ] Regenerating does not overwrite previous versions.
- [ ] History rows show compact review status.

## Plan Review

- [ ] Latest plan shows Plan Review.
- [ ] Status can be passed, warnings, or blocked.
- [ ] Blocking issue count, warning count, and notes are visible.
- [ ] Manual-review reminders stay visible.
- [ ] Copy says Boardsmith is a planning aid, not a professional engineering review.

## Export Readiness

- [ ] Latest plan shows Export Readiness.
- [ ] Status can be not ready yet, needs review, or ready for future export polish.
- [ ] Blocking issues and warnings are separated.
- [ ] Copy states no export files are generated.
- [ ] Copy does not imply app-generated PDF, SVG, DXF, CAD, or CNC output exists.

## Material Summary

- [ ] Primary materials are grouped.
- [ ] Hardware and fasteners are grouped.
- [ ] Finish and optional supplies are grouped.
- [ ] Material assumptions and unresolved material questions are visible.
- [ ] Copy reminds the user to verify materials before purchasing or cutting.
- [ ] No shopping list, pricing, vendor, or inventory behavior is present.

## Cut List Review

- [ ] Total pieces, pieces with dimensions, and pieces needing review are visible.
- [ ] Missing names, missing dimensions, vague dimensions, suspicious quantities, possible duplicates, and empty cut-list warnings are surfaced when present.
- [ ] Copy reminds the user to verify measurements before cutting.
- [ ] No nesting, optimization, sheet layout, kerf calculation, diagrams, or production cut file claims are present.

## Printable Plan Sheet

- [ ] The latest generated plan area renders as a readable Printable Plan Sheet.
- [ ] The sheet consumes `createPrintablePlanManifest` as its primary data source.
- [ ] Project summary, metadata, materials, cut list, build steps, operations, safety notes, assumptions, unresolved questions, Plan Review, Export Readiness, disclaimers, and future export notes remain visible.
- [ ] Copy says the plan is a planning aid and must be reviewed before building.

## Browser Print Preview Route

- [ ] Project detail page shows a `Browser print preview` link when a generated plan exists.
- [ ] `/projects/[id]/print` loads for an existing generated plan.
- [ ] Print preview uses `createPrintablePlanManifest` as its primary data source.
- [ ] Print preview includes project summary, generated plan metadata, materials, Cut List Review, operations/build steps, safety notes/flags, assumptions, unresolved questions, Plan Review, Export Readiness, planning-aid disclaimers, and future export notes.
- [ ] Print preview empty state is calm when no generated plan exists.
- [ ] Copy says to use the browser print dialog for a paper copy.
- [ ] No download button or app-generated file output is present.

## Browser Print And Manual Review Notes

- [ ] User-facing copy says: "Use your browser's print dialog if you want a paper copy."
- [ ] User-facing copy says: "Review all dimensions, materials, and safety notes before building."
- [ ] Browser print is treated as a browser capability, not an export pipeline.
- [ ] Future print/export notes remain framed as future internal readiness, not current output generation.

## Safety And Planning-Aid Warnings

- [ ] Plans are described as planning aids only.
- [ ] No structural engineering, load rating, child safety certification, wall safety guarantee, or professional approval is claimed.
- [ ] Wall-mounted work includes stud/anchor cautions.
- [ ] Safety-sensitive uses remain flagged for extra review.
- [ ] Tool guidance does not bypass guards, PPE, or manuals.

## Verification Commands

Run before committing:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

## Manual Smoke Routes

- [ ] `/`
- [ ] `/projects`
- [ ] `/projects/new`
- [ ] `/settings`
- [ ] `/projects/[id]` for one existing generated project
- [ ] `/projects/[id]/print` for one existing generated project

## Known Caveats

- Private MVP has no auth and no per-user ownership.
- Supabase-backed mode currently uses server-only service-role access.
- Local JSON fallback is not a sync system.
- Plan Review is computed on read and not stored as a separate review record.
- Older plans without `build_model_json` use derived compatibility data.
- Browser print preview depends on the user's browser print dialog.
- Browser print preview is not app-generated PDF export.
- Export readiness and future export notes are internal readiness signals only.

## Intentional Non-Goals

- No app-generated PDF export.
- No SVG or DXF generation.
- No CAD, FreeCAD, CNC, router output, nesting, or optimization.
- No download buttons or export routes.
- No image upload or generated imagery.
- No shopping list, pricing, vendor links, inventory, or purchasing behavior.
- No auth, public sharing, payments, subscriptions, marketplace, or Etsy automation.
- No new project types.
- No load ratings or safety certification.

## Recommended Next Task Order

1. Small print-preview polish only if needed.
2. Export architecture decision note.
3. Only then consider a very narrow app-generated PDF spike.
4. Later SVG/DXF research.
5. Much later CAD/FreeCAD/CNC research.
