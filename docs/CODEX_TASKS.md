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

## Task 38A - Private MVP Access Gate

- [x] Add an optional `BOARDSMITH_ACCESS_PASSWORD` server-side access gate.
- [x] Redirect protected app routes to `/access` when the gate is enabled and no valid cookie is present.
- [x] Set an HTTP-only cookie with a derived verifier after correct password entry.
- [x] Keep local development directly usable when the password env var is unset.
- [x] Document that this is a temporary private MVP gate, not full authentication.

## Task 39A - Duplicate Project Action

- [x] Add a project detail action to duplicate an existing project.
- [x] Copy project intake/details into a new draft project.
- [x] Exclude generated plans and plan history from the duplicate.
- [x] Keep duplicate projects usable for fresh generation.

## Task 40A-B - Project Notes

- [x] Add simple project notes.
- [x] Add and apply the `projects.notes` Supabase migration.
- [x] Verify cloud-backed note save/reload behavior.
- [x] Confirm duplicate projects reset notes to empty.

## Task 41A - Combined Private MVP Smoke QA

- [x] Smoke test no-password local behavior.
- [x] Smoke test the private MVP access gate with a temporary password.
- [x] Smoke test cloud-backed notes save/reload and duplicate reset behavior.
- [x] Smoke test duplicate project behavior without copying generated plans/history.
- [x] Smoke test blocked generation feedback without persisting invalid output.
- [x] Smoke test successful cloud-backed generation, review surfaces, and browser print preview.
- [x] Document results in `docs/PRIVATE_MVP_SMOKE_QA.md`.

## Task 42A - Hosting And Deployment Readiness

- [x] Document required hosted private MVP environment variables.
- [x] Document access-gate behavior, protected routes/actions, server-only secret boundaries, hosting smoke checks, rollback notes, and non-goals.
- [x] Confirm no client component references `SUPABASE_SERVICE_ROLE_KEY` or `OPENAI_API_KEY`.
- [x] Keep browser print as the supported MVP output path.
- [x] Confirm no deployment was performed.

## Task 43A - Hosted Deployment Dry Run

- [x] Add a hosted deployment dry-run checklist.
- [x] Capture likely Vercel or similar Next.js hosting assumptions.
- [x] Capture required hosted env vars, optional local-only env vars, secret handling, pre-deploy checks, post-deploy smoke, rollback, and non-goals.
- [x] Inspect deployment-sensitive files: `package.json`, `.env.example`, `proxy.ts`, access gate files, Supabase storage, and OpenAI generation usage.
- [x] Confirm no deployment was performed.

## Task 44A - Hosted Provider Readiness Check

- [x] Confirm local working tree was clean before the check.
- [x] Inspect hosted deployment dry-run docs, deployment readiness docs, `.env.example`, `package.json`, `proxy.ts`, access gate files, Supabase storage, and OpenAI generation usage.
- [x] Confirm required hosted env vars are documented without printing secret values.
- [x] Confirm no client component references `SUPABASE_SERVICE_ROLE_KEY`, `OPENAI_API_KEY`, or `BOARDSMITH_ACCESS_PASSWORD`.
- [x] Confirm the checkout is linked to Vercel and required env var names are present for Preview and Production.
- [x] Confirm Vercel-level protection currently returns `401 Unauthorized` before Boardsmith app routes render.
- [x] Document hosted deployment status in `docs/HOSTED_DEPLOYMENT_STATUS.md`.
- [x] Confirm no deployment was performed.

## Task 44C - Authorized Hosted Smoke Results

- [x] Attempt to reach the hosted deployment from the available browser automation session.
- [x] Confirm the available browser session reaches Vercel login before Boardsmith loads.
- [x] Initially document that manual smoke results from a user-authenticated Vercel browser session had not been supplied yet.
- [x] User-authenticated Vercel browser session loads the hosted app past Vercel protection.
- [x] Boardsmith `/access` gate is verified on the hosted app.
- [x] Hosted project creation, notes, duplicate, generation, latest plan, and print preview are verified.

## Task 45A - Plan History Comparison

- [x] Add a read-only plan comparison panel for generated plan history.
- [x] Compare the latest plan against a selected older plan version when history exists.
- [x] Summarize practical summary, material, cut-list, step, Plan Review, and Export Readiness differences.
- [x] Show calm empty-state copy when only one generated plan exists.
- [x] Keep comparison read-only with no generation, export, schema, package, cloud, or auth changes.

## Task 46A - Build / Completion Log Foundation

- [x] Add a project detail Build log section for completion status, completion date, actual material, plan changes, and lessons learned.
- [x] Persist build log fields through local JSON fallback and Supabase storage code.
- [x] Add local migration `20260602161405_add_project_build_log.sql`.
- [x] Keep the build log plain text and read/write only; no uploads, pricing, shopping, export, CAD, CNC, or AI behavior.

## Task 46B - Build Log Cloud Migration

- [x] Apply `20260602161405_add_project_build_log.sql` to Supabase cloud.
- [x] Confirm remote migration history includes `20260602161405`.
- [x] Confirm cloud schema includes `build_completed`, `build_completed_at`, `build_actual_material`, `build_plan_changes`, and `build_lessons_learned`.
- [x] Smoke test cloud-backed build-log save/reload on a clearly labeled smoke project.
- [x] Confirm a duplicate-style project starts with an empty build log by default.

## Task 47A - Project Detail MVP Polish

- [x] Move private notes and real-build details into a final Project record section.
- [x] Keep project detail flow ordered as intake, template guidance, project structure, generated-plan review, printable plan sheet, plan history, and project record.
- [x] Add calm empty states for blank project notes and build log details.
- [x] Preserve planning-aid, no-certification, no-load-rating safety language.
- [x] Keep the pass limited to UI organization, helper copy, rendering tests, and docs.

## Task 48A - Private MVP Readiness Checkpoint

- [x] Add `docs/PRIVATE_MVP_READINESS.md` as a concise current-state checkpoint.
- [x] Summarize verified private MVP capabilities, including persistence, generation, review surfaces, duplicate, notes, build log, access gate, and browser print preview.
- [x] Document hosted readiness gap at the time: Vercel/env-name readiness existed, but authorized hosted browser smoke had not passed yet.
- [x] Capture local and hosted smoke checklists.
- [x] Restate non-goals around PDF/SVG/DXF/CAD/CNC/export, public sharing, safety certification, shopping, pricing, vendor, and inventory scope.

## Task 49A - Project List MVP Usability

- [x] Improve `/projects` cards with status, latest-plan presence, plan version count, notes/build-log indicators, updated date, and next-action links.
- [x] Improve the no-projects empty state with a clearer private planning-record prompt and first-project action.
- [x] Make the dashboard latest-project metric link to the current latest project.
- [x] Keep the pass limited to existing project and generated-plan data with no schema, storage, Supabase, OpenAI, export, auth, package, hosted, or public-sharing changes.

## Task 50A - Local MVP Dogfood Smoke

- [x] Run a local fallback dogfood smoke with `BOARDSMITH_ACCESS_PASSWORD` enabled and Supabase env vars kept out of the dev process.
- [x] Verify access gate redirect, wrong-password rejection, correct-password access, dashboard, project list, new project creation, no-plan detail state, notes save, build-log save, generation, latest plan render, review surfaces, duplicate project, browser print preview, and project-list indicators.
- [x] Confirm local OpenAI generation saved one validated smoke plan and did not require Supabase cloud writes.
- [x] Confirm duplicate project starts without generated plans, notes, or build-log content.
- [x] Fix project creation failure handling so malformed intake redirects to friendly user-facing copy instead of raw validation details.
- [x] Keep generated dev-server files, temporary smoke data, logs, and scripts out of the committed diff.

## Task 50B - Project Intake Validation Fix

- [x] Fix hosted smoke blocker where ordinary dimensions like `12`, `8`, `4`, and material thickness `0.75` were rejected by browser number input step validation.
- [x] Align project intake number controls with the server schema by accepting practical decimal values without unusual nearest-valid-value browser prompts.
- [x] Preserve safe entered intake values through friendly `invalid_intake` redirects with a short-lived server-set draft cookie.
- [x] Keep raw validation/Zod details out of URLs and user-facing copy.
- [x] Add focused form-route tests for normal dimensions, decimal thickness, friendly invalid-intake copy, draft preservation, and successful project creation.

## Task 50C - Hosted MVP Smoke Pass

- [x] Record user-supplied authorized Vercel browser smoke results in `docs/HOSTED_DEPLOYMENT_STATUS.md`.
- [x] Confirm hosted Boardsmith `/access` rendered, wrong password was rejected, and correct `BOARDSMITH_ACCESS_PASSWORD` granted access.
- [x] Confirm hosted dashboard, project list, New Project, project creation, notes, build log, generation, latest plan, review surfaces, print preview, duplicate project, and project-list indicators passed smoke.
- [x] Update `docs/PRIVATE_MVP_READINESS.md` to reflect that authorized hosted browser smoke has passed after the project-intake validation fix.
- [x] Keep the update docs-only with no hosted URL, secrets, screenshots, deployment, app behavior, migrations, packages, cloud schema changes, OpenAI changes, export/CAD work, auth-provider work, public sharing, or shopping/pricing/vendor scope.

## Task 51A - Private MVP Release Checkpoint

- [x] Confirm `main` is clean at `ffab0a3` before checkpoint docs.
- [x] Document `private-mvp-0.1` as the first privately hosted and smoke-tested MVP checkpoint.
- [x] Record that local MVP dogfood and authorized hosted Vercel browser smoke passed.
- [x] Keep the checkpoint private-only and not public-launch ready.
- [x] Keep the pass docs/git-only with no app behavior, deployment, migration, package, cloud schema, OpenAI, export/CAD, auth-provider, public sharing, shopping/pricing/vendor, secret, hosted URL, screenshot, or runtime-data changes.

## Task 52A - New Project Intake Examples

- [x] Add practical low-risk project examples to the New Project page.
- [x] Add a concise intake checklist for dimensions, material/thickness, tools, use context, mounting, finish, and safety-sensitive use.
- [x] Clarify that Boardsmith is a planning aid and may block drafts that fail validation or review.
- [x] Add focused rendering coverage for the new examples and checklist copy.
- [x] Keep the pass limited to UI/copy/tests/docs with no schema, storage, Supabase, OpenAI, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 52B - Intake Example Dogfood

- [x] Run a local private dogfood smoke using local JSON fallback and the New Project example descriptions or close variants.
- [x] Confirm all five examples could create projects successfully: freestanding plant display board, lamp riser, desktop organizer, outdoor planter box shell, and decorative catchall tray.
- [x] Generate validated plans for all five examples after tightening example copy to avoid unsafe or confusing capacity, mounting, electrical, and multi-piece assumptions.
- [x] Confirm generated project detail pages render latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and planning-aid safety copy.
- [x] Confirm browser print preview renders for the generated dogfood projects.
- [x] Keep the pass limited to copy/tests/docs with no schema, storage, Supabase cloud, OpenAI prompt/schema/model, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 53A - Example Starter Prefill

- [x] Add short `?example=` starter links for each dogfooded New Project example.
- [x] Prefill editable starter values for title, project type, skill level, dimensions, material/thickness, tools, style notes, and intended use.
- [x] Keep the blank manual intake flow unchanged.
- [x] Preserve invalid-intake draft behavior so user-entered values still win after a failed submit.
- [x] Keep starter copy clear that the values must be reviewed and remain a planning aid, not certified or load-rated guidance.
- [x] Keep the pass limited to UI/form usability, helper data, rendering tests, and docs with no schema, storage, Supabase cloud, OpenAI, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 53B - Example Starter Dogfood

- [x] Run a local private dogfood smoke using local JSON fallback for all five `?example=` starter links.
- [x] Confirm plant display board, lamp riser, desktop organizer, planter box shell, and decorative tray starters prefill the expected editable fields.
- [x] Confirm edited starter values can be submitted and each starter creates a draft project successfully.
- [x] Confirm the blank manual New Project flow still works.
- [x] Confirm invalid-intake draft preservation takes priority over selected starter values.
- [x] Generate validated saved plans for two starter-created projects and confirm latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and browser print preview render.
- [x] Confirm the current commit has a READY production Vercel deployment and that unauthenticated terminal access to a starter route remains blocked by Vercel protection before Boardsmith renders.
- [x] Keep the pass limited to QA/docs with no code fixes, schema, storage, Supabase cloud, OpenAI prompt/schema/model, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 54A - Generated Plan Readability Polish

- [x] Split the latest generated plan sheet into clearer review groups: overview, plan at a glance, materials, cut list, build steps, modeled operations, safety notes, assumptions, open questions, finishing notes, beginner tips, and future export notes.
- [x] Preserve Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, Plan History, Plan Comparison, Project Record, and browser print preview behavior.
- [x] Keep the copy clear that generated plans are planning aids and not engineering reviews, certifications, load ratings, wall-safety guarantees, child-safety certifications, or fabrication-ready output.
- [x] Add focused rendering coverage for the new generated-plan group labels.
- [x] Keep the pass limited to UI/copy/readability and docs with no schema, storage, Supabase cloud, OpenAI, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 54B - Generated Plan Readability Dogfood

- [x] Inspect existing local fallback data and confirm it included a no-plan project and one generated project with plan history, but not enough breadth for three generated-plan states.
- [x] Run a temporary local JSON fallback dogfood smoke covering no-plan, one-plan starter-created, one-plan manual, and multiple-plan history projects without touching Supabase cloud or persistent local data.
- [x] Confirm the polished latest generated plan renders overview, plan at a glance, materials, cut list, build steps, modeled operations, safety notes, assumptions, open questions, finishing notes, beginner tips, and future export notes.
- [x] Confirm Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, Plan History, Plan Comparison, Project Record, and browser print preview still render.
- [x] Confirm no tiny UI/copy/rendering fixes were needed.
- [x] Keep the pass limited to QA/docs with no schema, storage, Supabase cloud, OpenAI, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 55A - Post-MVP Polish Checkpoint

- [x] Update `docs/PRIVATE_MVP_READINESS.md` with the current post-`private-mvp-0.1` polish state.
- [x] Summarize New Project intake examples, intake example dogfood, example starter links, starter dogfood, generated-plan readability polish, and generated-plan readability dogfood.
- [x] Reconfirm private-only, planning-aid-only guardrails and the absence of engineering/certification/load-rating claims.
- [x] Reconfirm no app-generated PDF, SVG, DXF, CAD, CNC, export pipeline, public sharing, shopping, pricing, vendor, or inventory scope exists.
- [x] Add narrow recommended next directions: print preview polish, project list filtering/search, a second private checkpoint tag, or an export architecture decision note without implementation.
- [x] Keep the pass docs-only with no app behavior, schema, storage, Supabase cloud, OpenAI, validation, export/CAD, auth/deployment, package, public-sharing, or shopping/pricing/vendor changes.

## Task 56A - Project List Filtering And Search

- [x] Add query-param-driven project search on `/projects`.
- [x] Add project type, status, plan state, and project record filters using existing project and generated-plan data only.
- [x] Show filtered result counts and a calm no-results state with clear-filter and new-project actions.
- [x] Preserve the existing no-projects empty state.
- [x] Add focused rendering coverage for filtered results, selected filter values, and no-results behavior.
- [x] Keep the pass limited to server-rendered list usability with no schema, storage, Supabase cloud, OpenAI, export/CAD, auth/deployment, package, public-sharing, shopping/pricing/vendor changes.

## Task 57A - Private MVP 0.2 Checkpoint

- [x] Document `private-mvp-0.2` as the first post-MVP polish checkpoint.
- [x] Record that the checkpoint includes intake examples and starters, generated-plan readability polish, and project list filtering/search.
- [x] Keep the checkpoint private-only and planning-aid only.
- [x] Keep the pass limited to docs/git with no app behavior beyond the already verified project-list filtering slice, no deployment, migration, package, cloud schema, OpenAI, export/CAD, auth-provider, public sharing, shopping/pricing/vendor, secret, hosted URL, screenshot, or runtime-data changes.

## Recommended Next Tasks

1. [ ] Small print preview polish if manual browser printing reveals layout or copy issues.
2. [ ] Revisit export architecture notes only as a decision document, not implementation.

## Remaining Hardening

- [ ] Add authenticated Supabase RLS when auth is intentionally introduced.
- [ ] Add Playwright smoke tests once runtime workflows stabilize.
