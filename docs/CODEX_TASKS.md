# Codex Tasks

## Task 00 - Repo Foundation

- [x] Create Next.js/TypeScript foundation.
- [x] Add README, AGENTS, PRD, technical plan, task list, and env example.

## Task 01 - App Shell

- [x] Add routes: `/`, `/projects`, `/projects/new`, `/projects/[id]`, `/settings`.
- [x] Add simple navigation.
- [x] Use clean, modern, neutral styling.

## Task 02 - Data Model

- [x] Add Supabase schema for `projects` and `generated_project_plans`.
- [x] Document auth/RLS as deferred.

## Task 03 - Project Intake Form

- [x] Build `/projects/new` form.
- [x] Save project and redirect to details.
- [x] Do not call AI on initial submit.

## Task 04 - Plan Schema

- [x] Add Zod generated-plan schema.
- [x] Add validation tests.

## Task 05 - AI Generation Service

- [x] Add OpenAI structured-output service.
- [x] Validate AI output before saving.
- [x] Add `generateProjectPlan(projectId)` server action.

## Task 06 - Generate Plan Button

- [x] Show project intake details.
- [x] Generate and save plan.
- [x] Display plan sections.

## Task 07 - Plan Rendering Polish

- [x] Add printable layout, section cards, cut-list table, warnings, needs-review badges, and beginner tips.

## Task 08 - Deterministic Safety Flags

- [x] Add `calculateSafetyReviewFlags(project)`.
- [x] Add tests.

## Task 09 - Template Hints

- [x] Add deterministic template hints by project type.
- [x] Use hints in AI prompt context.

## Task 10 - Project History

- [x] Show all generated plans.
- [x] Regenerate without overwriting previous plans.
- [x] Mark latest plan.

## Task 11 - MVP Documentation

- [x] Update README and docs with setup, env vars, current capabilities, limitations, safety limitations, and roadmap.

## Task 12 - Supabase Persistence

- [x] Connect the private MVP repository layer to Supabase when server env vars are configured.
- [x] Keep local JSON fallback behavior intact when Supabase is not configured.
- [x] Verify project create/list/detail flow against Supabase.

## Task 13 - Live AI Generation Smoke

- [x] Verify live OpenAI generation with Supabase-backed persistence.
- [x] Confirm generated plans validate against Zod before saving.
- [x] Confirm plan history preserves previous versions.
- [x] Confirm missing `OPENAI_API_KEY` behavior is graceful.

## Task 14 - Boardsmith Build Model Foundation

- [x] Add the Boardsmith Build Model schema, fixtures, and validation tests.
- [x] Derive a deterministic project structure from project intake, template hints, and safety flags.
- [x] Render Project Structure on the project detail page.
- [x] Store nullable `build_model_json` with generated plan versions.

## Task 15 - Material Summary

- [x] Render a read-only material summary from the displayed build model.

## Task 16 - Build-Model-Aware Generation

- [x] Pass build-model context into the AI prompt.
- [x] Reject schema-valid generated plans when deterministic quality checks find blocking conflicts.

## Task 17 - Plan History Hardening

- [x] Preserve previous generated plans.
- [x] Mark one latest plan.
- [x] Keep older plans readable when they do not have stored build-model JSON.

## Task 18A - Generated Plan Review UI

- [x] Add a Plan Review panel for the latest generated plan.
- [x] Surface passed/warnings/blocked status, issue counts, blocking issues, warnings, manual-review reminders, and planning-aid safety copy.
- [x] Add compact review badges to plan history.

## Task 20A - Export Readiness Checks

- [x] Add deterministic export-readiness checks without adding export files.
- [x] Surface readiness status on project detail pages.

## Task 21A - Printable Plan Polish

- [x] Improve generated plan presentation as a reviewable Printable Plan Sheet.
- [x] Keep browser print support separate from file export.

## Task 22A - Project Examples And Template Guidance

- [x] Improve project intake examples and template guidance copy.
- [x] Keep supported project types unchanged.

## Task 23A - Material Summary Refinement

- [x] Group primary materials, hardware/fasteners, finish/optional supplies, and material review notes.
- [x] Keep the display read-only without shopping, pricing, or vendor behavior.

## Task 24A - Cut List Review

- [x] Surface cut-list review counts and warnings.
- [x] Keep the display read-only without optimization, nesting, sheet layout, or production cut files.

## Task 25A/B - Printable Plan Manifest

- [x] Add `createPrintablePlanManifest`.
- [x] Wire the Printable Plan Sheet to the manifest as its primary data source.

## Task 26A - Browser Print Preview

- [x] Add `/projects/[id]/print` browser print preview page.
- [x] Add project detail link to browser print preview.
- [x] Keep print preview read-only with no download or app-generated export pipeline.

## Task 27A - Internal MVP Release Checklist

- [x] Add internal MVP release checklist and status docs.
- [x] Capture verified flows, caveats, non-goals, and next task order.

## Task 28A - Export Architecture Decision Note

- [x] Document that future exports should consume `createPrintablePlanManifest`.
- [x] Document export phases, PDF approach options, safety boundaries, data boundaries, testing expectations, and non-goals.
- [x] Keep this as docs-only with no export implementation.

## Task 29A - PDF Export Spike Plan

- [x] Document the recommended first PDF approach.
- [x] Confirm no PDF package is currently installed.
- [x] Keep this as docs/planning-only with no routes, buttons, downloads, packages, or PDF generation.

## Task 30A - MVP Dogfood QA

- [x] Document realistic dogfood findings for five MVP woodworking scenarios.
- [x] Confirm browser print remains enough for the private MVP.
- [x] Recommend isolated live generation dogfood before PDF/export work.

## Task 31A - Live Generation Dogfood QA

- [x] Run live OpenAI generation against five isolated Supabase-backed dogfood projects.
- [x] Confirm quality-blocked AI output is not persisted.
- [x] Confirm one generated plan saved with stored `build_model_json` and rendered the current review surfaces.
- [x] Recommend prompt/model alignment before any PDF/export work.

## Task 32A - Prompt/Model Alignment

- [x] Tighten generation prompt context around overclaim wording, review flags, build-model grounding, and template guidance.
- [x] Fix false-positive wall-mounting guidance for explicit freestanding shelf-like risers.
- [x] Re-run the five-scenario live dogfood sweep and improve saved plans from one of five to three of five.
- [x] Preserve strict Zod validation and deterministic quality checks.

## Task 35A-C - Atomic Generated Plan Save

- [x] Add an atomic Supabase RPC for generated-plan saves.
- [x] Verify the migration locally in isolated Postgres.
- [x] Apply the migration to Supabase cloud.
- [x] Confirm cloud-backed plan saves through `save_generated_plan_atomic(...)`.

## Task 36A - Wall-Mounted And Child-Adjacent Generation Alignment

- [x] Improve prompt grounding for exact deterministic review labels, wall mounting review, child-adjacent review, and bathroom humidity/finish review.
- [x] Add deterministic book-ledge build-model pieces for bottom shelf board, back rail, and front lip.
- [x] Add bathroom wall-shelf finish/humidity review grounding.
- [x] Re-run the two remaining live dogfood scenarios and save validated plans for bathroom wall shelf and toddler book ledge.
- [x] Preserve strict Zod validation and deterministic quality checks.

## Task 37A - Blocked Generation Feedback

- [x] Classify generation failures before redirecting back to the project detail page.
- [x] Replace raw blocked-generation errors with calm user-facing feedback.
- [x] Show next-step suggestions for dimensions, materials, mounting, hardware, intended use, wall-mounted work, and child-adjacent projects.
- [x] Preserve missing `OPENAI_API_KEY` guidance without exposing internals.
- [x] Keep blocked or invalid generated output out of persistence.

## Recommended Next Tasks

1. [ ] Add a private MVP deployment safety gate before any public-facing hosting.
2. [ ] Run a full five-scenario live dogfood sweep only if another generation-alignment change is made.
3. [ ] Polish print preview only if manual browser printing reveals issues.
4. [ ] Decide later whether to approve a server-side HTML-to-PDF dependency spike.
5. [ ] Later SVG research note.
6. [ ] Much later DXF/CAD/CNC research.

## Remaining Hardening

- [ ] Add authenticated Supabase RLS when auth is intentionally introduced.
- [ ] Add Playwright smoke tests once runtime workflows stabilize.
