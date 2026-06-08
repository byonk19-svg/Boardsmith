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

## Task 58A - Export Boundary Decision Refresh

- [x] Revisit export architecture notes as a decision document, not implementation.
- [x] Record that `private-mvp-0.2` stays with browser print preview as the supported MVP output path.
- [x] Keep app-generated PDF gated behind explicit output-need and renderer-dependency approval.
- [x] Keep SVG, DXF, CAD, CNC, shopping, pricing, vendor, inventory, public sharing, and auth-provider work out of scope.
- [x] Keep the pass docs-only with no routes, buttons, downloads, packages, migrations, Supabase cloud changes, OpenAI changes, export implementation, runtime data, deployment, or hosted URL changes.

## Task 56A - Browser Print Preview Polish + Planning Diagram Foundation

- [x] Add a beginner-friendly print-preview `Before you build` summary using existing manifest/build-model facts.
- [x] Add deterministic browser-rendered planning diagram data for shelf boards, book ledges, planter boxes, and connection summaries.
- [x] Render `Planning diagrams` on project detail generated plan sheets and browser print preview pages.
- [x] Keep every diagram section labeled `Planning diagram — not to scale.` with fallback copy for unsupported project shapes.
- [x] Make the print-preview cut list checklist-friendly with a blank `Cut?` column.
- [x] Keep the pass browser-rendered only with no data-model changes, schema migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, downloads, PDF, SVG export, DXF, CAD, CNC, sharing, shopping, pricing, vendor, inventory, marketplace, payments, or subscriptions.

## Task 56B - Planning Diagram Dogfood Pass

- [x] Dogfood simple shelf, book ledge, planter box, and door-hanger fallback project routes using a temporary local data file.
- [x] Confirm project detail and print-preview routes render `Planning diagrams` and `Planning diagram — not to scale.` where expected.
- [x] Confirm print preview renders the `Before you build` summary and checklist-style `Cut?` cut-list column.
- [x] Confirm unsupported door-hanger-style plans fall back calmly without inventing a diagram.
- [x] Tighten diagram-card print spacing by keeping the not-to-scale warning at the section level instead of repeating it in every card.
- [x] Confirm rendered dogfood routes do not add downloads, app-generated PDF, SVG export, DXF, CAD, CNC, fabrication-ready claims, load ratings, wall-safety guarantees, structural approval, schema changes, migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, package changes, new project types, sharing, shopping, pricing, vendor, inventory, marketplace, payments, or subscriptions.

## Task 57A - Connection Diagram Polish

- [x] Improve planning-diagram connection data from existing `buildModel.connections` only.
- [x] Show readable source piece → connection type / hardware → target piece relationships with location text.
- [x] Surface strength-critical connections as `Needs manual review` and non-critical connections as `Verify before building`.
- [x] Render a compact `How pieces connect` / `Connection planning aid` card in project detail and browser print preview.
- [x] Add a calm connection fallback: `No modeled connections available yet. Review the build steps before assembling.`
- [x] Keep `Planning diagram — not to scale.` visible at the section level and preserve no-export/no-CAD/no-CNC/no-load-rating safety boundaries.
- [x] Keep the pass limited to UI/copy/helper/test/docs using existing data only, with no schema migrations, Supabase/cloud changes, OpenAI changes, package changes, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, new project types, sharing, shopping, pricing, vendor, or inventory work.

## Task 57B - Connection Diagram Dogfood Pass

- [x] Dogfood simple shelf, book ledge, planter box, and wood-sign fallback routes using a temporary local data file.
- [x] Confirm `How pieces connect`, `Connection planning aid`, `Needs manual review`, `Verify before building`, and section-level `Planning diagram — not to scale.` render where expected.
- [x] Confirm supported no-connection fallback remains available for supported diagrams with missing connection data.
- [x] Polish relationship copy to read `source piece → connection type with hardware → target piece`.
- [x] Make the connection card more print-friendly by spanning the diagram grid, using a compact marker-only SVG, and laying connection rows out in columns on wider screens.
- [x] Confirm dogfood routes avoid CAD-ready, CNC-ready, fabrication-ready, construction-approval, structural-approval, child-safety-approval, load-rating, download, export, schema, migration, Supabase/cloud, OpenAI, package, new-project-type, shopping, pricing, vendor, and inventory scope.

## Task 58A - Build Step Cards

- [x] Add deterministic build-step card data from existing generated plan steps and build-model operations only.
- [x] Render compact beginner-friendly step cards in project detail and browser print preview.
- [x] Show step number, title, instructions, phase label, tools, time, safety note, related operation, and related pieces when safely available.
- [x] Fall back to `Build step` and omit invented operation/piece relationships for ambiguous steps.
- [x] Keep the pass limited to UI/copy/helper/test/docs with no schema migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, shopping, pricing, vendor, inventory, marketplace, payments, subscriptions, or new project types.

## Task 58B - Build Step Cards Dogfood Pass

- [x] Dogfood simple shelf, book ledge, planter box, wood-sign-style, ambiguous-step, and print-preview step-card scenarios through helper/rendering coverage.
- [x] Attempt direct browser inspection with an ignored local dogfood data file; local `.env.local` Supabase configuration forced cloud lookup for dogfood IDs, so browser route inspection was blocked and rendered markup checks were used as fallback.
- [x] Tighten operation matching so related pieces do not appear from sequence number and tool overlap alone.
- [x] Treat attach-with-screws fallback wording as `Fasten` instead of over-labeling it as assembly.
- [x] Make compact print cards tighter and rename the related-operation label to the beginner-friendlier `Modeled step`.
- [x] Keep the pass limited to UI/copy/helper/test/docs with no schema migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, shopping, pricing, vendor, inventory, marketplace, payments, subscriptions, or new project types.

## Task 59A - Visual Planning Usability Checkpoint

- [x] Document `private-mvp-0.3` as the visual planning usability checkpoint because `private-mvp-0.2` already exists for the earlier post-MVP polish checkpoint.
- [x] Summarize browser print preview polish, deterministic planning diagrams, planning diagram dogfood, connection planning aids, connection dogfood, beginner-friendly build step cards, and build step card dogfood.
- [x] Reconfirm Boardsmith remains private-MVP-only and planning-aid-only.
- [x] Reconfirm browser-rendered UI and browser print preview remain the only current output path.
- [x] Reconfirm no app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, public sharing, shopping, pricing, vendor, inventory, marketplace, payments, subscriptions, professional review, structural approval, wall-safety guarantee, child-safety certification, load rating, fabrication-ready claim, or construction approval was added.
- [x] Keep the pass limited to docs/checkpoint/tag work with no product UI, schema, storage, Supabase/cloud, OpenAI prompt/model/schema, package, runtime data, hosted URL, screenshot, secret, log, export, sharing, shopping, pricing, vendor, or inventory changes.

## Task 60A - Plan Review Action Checklist

- [x] Add deterministic `createPlanActionChecklist` helper using existing build-model, material-review, cut-list-review, and generated-plan review data only.
- [x] Render `Check these before building` in the project detail generated plan sheet and browser print preview.
- [x] Keep the checklist read-only with paper-style markers and no persisted checked state.
- [x] Surface beginner-friendly dimensions, material-thickness, cut-list, safety, hardware, mounting, finish, unresolved-question, and fallback review actions where the existing data supports them.
- [x] Preserve private-MVP planning-aid guardrails with no professional approval, structural approval, wall-safety guarantee, child-safety certification, load rating, fabrication-ready claim, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, shopping, pricing, vendor, inventory, marketplace, payments, subscriptions, schema migration, Supabase/cloud, OpenAI prompt/model/schema, or package changes.

## Task 60B - Plan Review Action Checklist Dogfood Pass

- [x] Dogfood checklist output across simple shelf, book ledge, planter box, wood-sign safety, and low-issue fallback scenarios through helper and rendered print-preview coverage.
- [x] Broaden safety checklist wording to `Review flagged safety notes.` so outdoor, child-adjacent, mounting, and structural review cases read naturally.
- [x] Prevent hardware-only unknowns and quantity-review notes from creating a confusing materials checklist item when hardware/unresolved-question actions already cover the review.
- [x] Fix singular unresolved-question copy and keep high-priority checklist items sorted before recommended items.
- [x] Confirm rendered print-preview cases include the checklist, safe fallback, no persistent checked state, and no CAD/CNC/export/load-rating/approval claims.
- [x] Keep the pass limited to helper copy/deduping, rendering tests, and docs with no persistent checklist state, schema fields, migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project types, shopping, pricing, vendor, or inventory work.

## Task 61A - Print Plan UX Redesign

- [x] Redesign `/projects/[id]/print` as a beginner-friendly shop-plan flow: `Build Snapshot`, `Project Visuals`, `Check Before Building`, `Materials and Parts`, `Cut Checklist`, `Build Guide`, and `Review Details`.
- [x] Make the planning diagrams a primary print-preview section with a larger first visual while keeping the section-level `Planning diagram â€” not to scale.` warning.
- [x] Keep the cut list checklist-style and print-friendly with a `Cut?` column plus compact status checks.
- [x] Demote detailed review and planning-aid safety language into `Review Details` and remove prominent export-readiness/future-export sections from the print flow.
- [x] Keep the pass browser-rendered only with existing manifest/build-model data and no schema, storage, Supabase/cloud, OpenAI prompt/model/schema, package, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 61B - Print Plan UX Dogfood Pass

- [x] Dogfood the redesigned print hierarchy across rendered simple shelf, book ledge, planter box, door-hanger fallback, high-review, low-issue, diagram, checklist, and build-step-card coverage.
- [x] Tighten the first printed page by replacing internal `Confidence` / `Build model` header facts with beginner-facing plan date, difficulty, and time estimate facts.
- [x] Add `Major pieces` and `First check` to the `Build Snapshot` so the first page answers what the major parts are and what to review before cutting or building.
- [x] Keep `Project Visuals` early, keep `Cut?` in the compact cut checklist, and keep `Review Details` after the build flow.
- [x] Attempt direct browser inspection against the local generated print route; the local private access gate redirected to `/access`, so rendered-route and helper tests were used as fallback without inspecting or committing secrets.
- [x] Keep the pass limited to UI/copy/layout/tests/docs with no schema, database, migration, Supabase/cloud, OpenAI, package, persistent checklist state, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 62A - High-Quality Project Visuals

- [x] Add deterministic project anatomy visual data with width, height, depth, material thickness, material, and major piece labels from existing build-model data.
- [x] Add deterministic three-view planning diagram data for dimensioned projects, with front, top, and side views plus dimension callouts.
- [x] Add a compact `Visual piece inventory â€” planning aid only.` from modeled pieces, quantities, dimensions, and materials.
- [x] Render the richer Project Visuals treatment in browser print preview while keeping project detail on the shorter existing diagram cards.
- [x] Preserve section-level `Planning diagram â€” not to scale.` language and fallback copy for unsupported or insufficient visual data.
- [x] Attempt direct browser inspection against the local generated print route; the local private access gate redirected to `/access`, so rendered-route and helper tests were used as fallback without inspecting or committing secrets.
- [x] Keep the pass browser-rendered only with no schema, database, migration, Supabase/cloud, OpenAI prompt/model/schema, package, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 62B - Project Visuals Dogfood Pass

- [x] Dogfood the higher-quality print visuals through rendered simple shelf, wall-mounted shelf, book ledge, planter box, door-hanger fallback, and insufficient-dimension coverage.
- [x] Reduce print visual clutter by keeping the richer anatomy, three-view, visual piece inventory, and connection aid while suppressing duplicate overview and piece-relationship cards in the featured print view.
- [x] Clean the visual piece inventory label to `Visual piece inventory - planning aid only.` and keep the section-level `Planning diagram — not to scale.` warning readable.
- [x] Attempt direct browser inspection against the local generated print route; the local private access gate redirected to `/access`, so rendered-route and helper tests were used as fallback without inspecting or committing secrets.
- [x] Keep the pass limited to UI/copy/layout/tests/docs with no schema, database, migration, Supabase/cloud, OpenAI prompt/model/schema, package, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 63A - Print Plan Compression and Scannability Pass

- [x] Tighten the print header by using a shorter planning-aid caution and a first-sentence project summary instead of a longer intro block.
- [x] Compact `Build Snapshot` to beginner-facing size, material, difficulty, time, major pieces, and first-check facts.
- [x] Make `Materials and Parts` more scannable with compact material and piece rows while moving dense material review notes lower.
- [x] Make print build-step cards more procedural with a `Do this` instruction block and less print-only metadata.
- [x] Rename the dense lower section to `Review Appendix` and move safety, assumptions, material notes, build sequence notes, finishing notes, and planning-aid reminders there.
- [x] Preserve Project Visuals, Cut Checklist with `Cut?`, browser-rendered-only output, private-MVP planning-aid positioning, and no schema, database, migration, Supabase/cloud, OpenAI prompt/model/schema, package, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 63B - Print Readability Screenshot Cleanup

- [x] Tighten Project Visuals spacing and print heights while keeping the anatomy, three-view, visual piece inventory, and connection aid early in the plan.
- [x] Keep only the highest-priority checklist items in the main `Check Before Building` flow and move lower-priority checklist notes into the appendix.
- [x] Make material and piece rows slightly denser with less prose-heavy detail.
- [x] Suppress generic repeated compact build-step warning blocks while keeping specific safety/check notes available.
- [x] Make `Review Appendix` denser and lower priority with compact reference lists for checklist, material, finishing, and planning-aid notes.
- [x] Attempt direct Browser inspection against the local print route; the local private access gate redirected to `/access`, so rendered-route tests were used as fallback without inspecting or committing secrets.
- [x] Keep the pass limited to UI/copy/layout/tests/docs with no schema, database, migration, Supabase/cloud, OpenAI prompt/model/schema, package, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, sharing, new project type, shopping, pricing, vendor, or inventory changes.

## Task 64A - Print Plan Usability Checkpoint

- [x] Document `private-mvp-0.4` as the print plan usability checkpoint after action checklist, print-layout redesign, higher-quality visuals, compression, and screenshot cleanup.
- [x] Summarize the browser print-preview shop-plan flow: `Build Snapshot`, `Project Visuals`, `Check Before Building`, `Materials and Parts`, `Cut Checklist`, `Build Guide`, and `Review Appendix`.
- [x] Reconfirm Boardsmith remains private-MVP-only, planning-aid-only, and browser-rendered-only.
- [x] Reconfirm no app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, public sharing, shopping, pricing, vendor, inventory, marketplace, payment, subscription, professional approval, structural approval, wall-safety guarantee, child-safety certification, load rating, fabrication-ready claim, or construction approval was added.
- [x] Keep the checkpoint docs/tag-only with no product UI, schema, storage, Supabase/cloud, OpenAI prompt/model/schema, package, runtime data, hosted URL, screenshot, secret, log, ignored dogfood data, export, sharing, shopping, pricing, vendor, or inventory changes.

## Task 65A - Project List Search and Filtering Polish

- [x] Keep `/projects` discovery simple and URL-query based using existing project and generated-plan data only.
- [x] Sort projects by most recent update first in both the rendered project list and storage layer, with deterministic tie-breakers for local data.
- [x] Preserve case-insensitive search across project title, intended use, style notes, material, notes, build record text, and safety flags.
- [x] Keep compact filters for project type, status, generated-plan presence, and private record state without adding schema fields or folders/tags.
- [x] Tighten project-card scanability with compact status, plan/history/notes/record signals, updated date, and preserved open/latest-plan/project-record actions.
- [x] Add focused coverage for updated ordering, search, type/status/plan filters, empty filter state, action links, and Supabase/local storage ordering.
- [x] Keep the pass private-MVP-safe with no schema migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, auth changes, public sharing, folders, archive/delete, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, shopping, pricing, vendor, or inventory work.

## Task 65B - Project List Search and Filters Dogfood Pass

- [x] Dogfood the `/projects` list through rendered crowded-list, updated-order, search, combined-filter, no-plan, built-status, no-results, and action-link coverage.
- [x] Make the filter panel slightly denser and clarify the generated-plan filter as `Plan state` / `Has latest plan`.
- [x] Make project cards more compact by turning the plan/history/notes/record signals into inline scan badges while preserving title, type, dimensions, status, updated date, and actions.
- [x] Simplify the no-results copy to point users directly back to all projects.
- [x] Confirm local and Supabase project reads still sort by `updated_at` and that default rendering does not hide crowded projects.
- [x] Attempt direct browser inspection against `/projects`; the local private access gate redirected to `/access`, so rendered-route and storage tests were used as fallback without inspecting secrets.
- [x] Keep the pass project-list-only with no delete/archive, folders/tags, bulk actions, public sharing, auth/multi-user changes, schema fields, migrations, Supabase/cloud changes, OpenAI prompt/model/schema changes, packages, shopping, pricing, vendor, inventory, generated PDF, SVG export/download, DXF, CAD, CNC, or export work.

## Task 66A - Project List Usability Checkpoint

- [x] Document `private-mvp-0.5` as the project-list usability checkpoint after search, filters, updated-first ordering, crowded-list dogfood, compact cards, and clearer actions.
- [x] Reconfirm Boardsmith remains private-MVP-only and planning-aid-only.
- [x] Reconfirm no archive/delete, folders, tags, public sharing, marketplace behavior, auth expansion, production multi-user assumption, schema migration, Supabase/cloud change, OpenAI prompt/model/schema change, package change, app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, shopping, pricing, vendor, or inventory work was added.
- [x] Keep the checkpoint docs/tag-only with no product UI, runtime data, hosted URL, screenshot, secret, log, ignored dogfood data, export, sharing, shopping, pricing, vendor, or inventory changes.

## Task 67A - Dashboard Usability Polish

- [x] Rework the dashboard into a private Boardsmith workspace command center instead of a marketing-style landing page.
- [x] Add compact project counts for total projects, projects with generated plans, projects needing generated plans, and the most recently updated project.
- [x] Show recent project shortcuts with updated date, type/dimensions, status, plan state, `Open project`, and `View latest plan` or `Generate plan` actions from existing project/plan data only.
- [x] Add a friendly no-projects empty state and gentle starter example links using existing intake examples.
- [x] Preserve private-MVP planning-aid positioning without public sharing, export, CAD, CNC, marketplace, auth expansion, schema, Supabase/cloud, OpenAI, package, archive/delete, folders/tags, shopping, pricing, vendor, or inventory scope.
- [x] Add focused dashboard rendering coverage for recent projects, latest-plan action, generate-plan action, counts, empty state, starter links, and forbidden public-sharing/export/CAD/CNC wording.

## Task 67B - Dashboard Screenshot Cleanup

- [x] Replace the awkward long-title `Most recent` stat value with a compact `Latest update` date while keeping the full project title in the recent-project list.
- [x] Tighten recent project cards with smaller padding, denser status badges, and layout constraints so long titles do not crowd actions.
- [x] Clarify clickable starter cards with a visible `Use starter ->` affordance.
- [x] Keep the pass limited to dashboard UI/copy/tests/docs with existing data only and no schema, Supabase/cloud, OpenAI, package, archive/delete, folders/tags, auth, public sharing, generated PDF, SVG export/download, DXF, CAD, CNC, shopping, pricing, vendor, or inventory work.

## Task 68A - Dashboard Usability Checkpoint

- [x] Document `private-mvp-0.6` as the dashboard usability checkpoint after the command-center dashboard polish and screenshot cleanup.
- [x] Summarize the dashboard state: private workspace, project counts, latest update date, recent project shortcuts, clear `Open project` / `View latest plan` / `Generate plan` actions, empty state, and existing starter links with `Use starter ->`.
- [x] Reconfirm Boardsmith remains private-MVP-only and planning-aid-only.
- [x] Reconfirm no archive/delete, folders, tags, public sharing, marketplace behavior, auth expansion, production multi-user assumption, schema migration, Supabase/cloud change, OpenAI prompt/model/schema change, package change, app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, shopping, pricing, vendor, or inventory work was added.
- [x] Keep the checkpoint docs/tag-only with no product UI, runtime data, hosted URL, screenshot, secret, log, ignored dogfood data, export, sharing, shopping, pricing, vendor, or inventory changes.

## Task 69A - Project Archive Foundation

- [x] Add nullable `projects.archived_at` archive metadata with local JSON fallback defaults so older projects remain active when the field is missing.
- [x] Add archive and restore project actions that preserve project intake, notes, build logs, generated plans, and plan history.
- [x] Hide archived projects from the default `/projects` view and dashboard counts/recent shortcuts.
- [x] Add `/projects` archive filtering for active, archived, and all projects while preserving search, project type, status, plan-state, and record filters.
- [x] Show archived project detail pages with a visible archived banner, restore action, latest plan access, and browser print preview access.
- [x] Add Supabase migration `20260607183000_add_project_archive_metadata.sql`; cloud application is intentionally not part of this task.
- [x] Keep this as archive/hide only: no delete, folders/tags, auth expansion, public sharing, OpenAI changes, packages, export/CAD/CNC work, shopping, pricing, vendor, or inventory features.

## Task 69B - Project Archive Dogfood Pass

- [x] Dogfood archive and restore through rendered route coverage for list actions, archived/all/active filters, dashboard exclusion, archived detail pages, detail restore, and archived print preview access.
- [x] Tighten archive-filter empty-state copy so restored projects clearly return to the Active projects view.
- [x] Confirm archive copy preserves project records and generated plans without implying permanent delete or data loss.
- [x] Keep the pass limited to small copy/tests/docs with no delete, soft-delete expansion, bulk archive, undo toast system, public sharing, auth expansion, package changes, export/CAD/CNC work, image upload, shopping, pricing, vendor, inventory, marketplace, or new project types.

## Task 70A - Archive Usability Checkpoint

- [x] Document `private-mvp-0.7` as the archive/restore usability checkpoint after the archive foundation and dogfood pass.
- [x] Summarize archive behavior as a private project-organization aid that hides inactive dogfood and smoke-test projects without deleting project records or generated plans.
- [x] Reconfirm Boardsmith remains private-MVP-only and planning-aid-only.
- [x] Reconfirm permanent delete, bulk archive, undo toast system, public sharing, auth expansion, production multi-user assumptions, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, shopping, pricing, vendor, inventory, marketplace, and new project types remain out of scope.
- [x] Keep the checkpoint docs/tag-only with no product UI, schema, migration, Supabase cloud push, OpenAI prompt/model/schema change, package change, runtime data, hosted URL, screenshot, secret, log, export, sharing, shopping, pricing, vendor, or inventory changes.

## Task 71A - Hosted Archive Migration Readiness Check

- [x] Confirm this checkout still has no `supabase/config.toml`, so there is no local Supabase reset target here.
- [x] Confirm the archive migration exists at `supabase/migrations/20260607183000_add_project_archive_metadata.sql` and adds nullable `projects.archived_at`.
- [x] Document a hosted archive migration readiness checklist covering hosted column verification, manual application through the approved hosted Supabase path, archive/restore smoke, Archived and All filters, dashboard exclusion, archived detail and print-preview access, and missing-column mitigation.
- [x] Confirm no Supabase cloud push was performed from this checkout.
- [x] Keep the pass docs/checklist-only with no app features, schema changes, migrations, package changes, public sharing, export/CAD/CNC work, image upload, shopping, pricing, vendor, inventory, auth expansion, production multi-user changes, delete, bulk archive, or undo toast system.

## Task 71B - Hosted Archive Migration Confirmation and Smoke

- [x] Inspect current hosted archive readiness docs, deployment status docs, private readiness docs, task ledger, repo state, and Supabase config state.
- [x] Confirm this checkout still has no `supabase/config.toml`, so no local reset or project-specific Supabase cloud push path is available here.
- [x] Run a secret-safe, read-only hosted Supabase persistence check without printing env values or project data.
- [x] Confirm the hosted persistence path currently returns Postgres `42703` because `projects.archived_at` does not exist.
- [x] Mark hosted archive/restore smoke blocked pending manual application of `supabase/migrations/20260607183000_add_project_archive_metadata.sql` through the approved hosted Supabase path.
- [x] Confirm no archive/restore hosted actions and no Supabase cloud push were performed from this checkout.

## Task 71C - Hosted Archive Migration Confirmation and Smoke Retry

- [x] Inspect current hosted archive readiness docs, hosted deployment status docs, private readiness docs, task ledger, repo state, and Supabase config state.
- [x] Re-run the secret-safe, read-only hosted Supabase persistence check without printing env values or project data.
- [x] Confirm the hosted persistence path still returns Postgres `42703` because `projects.archived_at` does not exist.
- [x] Keep hosted archive/restore smoke blocked; no hosted archive, restore, filter, dashboard, detail, or print-preview smoke actions were run against hosted data.
- [x] Confirm no Supabase cloud push was performed from this checkout.
- [x] Document that the manual hosted migration step is still required before rerunning the hosted archive smoke checklist.

## Task 71D - Manual Hosted Archive Migration Runbook

- [x] Add a copy-paste-ready manual hosted migration runbook to `docs/HOSTED_ARCHIVE_MIGRATION_READINESS.md`.
- [x] Include the local migration file path, exact `archived_at` migration SQL, verification query, success criteria, blocked criteria, and reminder to use the correct hosted Supabase project.
- [x] Reconfirm secrets, hosted URLs, screenshots, connection strings, and raw env values should not be pasted into docs, chat, commits, issue comments, or logs.
- [x] Reconfirm hosted archive smoke should run only after the hosted `projects.archived_at` column exists.
- [x] Keep the pass docs-only with no app features, schema changes, migration edits, package changes, Supabase cloud push, delete, bulk archive, undo toast system, export/CAD/CNC work, image upload, public sharing, marketplace, shopping, pricing, vendor, auth expansion, or new project types.

## Task 71E - Hosted Archive Migration Push

- [x] Confirm the local ignored Supabase CLI link can reach the hosted database even though no committed `supabase/config.toml` exists.
- [x] Run `supabase db push --dry-run` and confirm the only pending remote migration is `20260607183000_add_project_archive_metadata.sql`.
- [x] Apply the archive migration to hosted Supabase with `supabase db push --yes`.
- [x] Confirm linked migration history shows `20260607183000` on both local and remote.
- [x] Confirm a secret-safe app-facing Supabase read of `projects.id, archived_at` passes without printing secrets, hosted URLs, project refs, connection strings, or row data.
- [x] Keep the pass limited to the approved archive migration push and docs status updates; no app code, migration file, schema file, package, auth, export, delete, bulk archive, public sharing, marketplace, shopping, pricing, vendor, or inventory changes were made.

## Task 71F - Hosted Archive/Restore UI Smoke

- [x] Inspect hosted archive readiness docs, hosted deployment status docs, private readiness docs, task ledger, repo state, and hosted archive migration status.
- [x] Attempt secret-safe hosted route checks against the latest ready production deployment without printing hosted URLs, secrets, project refs, connection strings, row data, screenshots, or sensitive logs.
- [x] Confirm `/`, `/projects`, `/projects?archive=archived`, and `/projects?archive=all` return Vercel-level `401` protection before Boardsmith route handling from this Codex environment.
- [x] Keep hosted archive/restore UI smoke blocked from this environment because the intended private access layer prevents route rendering.
- [x] Document the authorized manual hosted archive smoke result: `/projects` loaded; Active excluded archived projects; Archived showed archived projects; All showed both active and archived projects; archive and restore worked on a clearly labeled non-critical test project; dashboard excluded archived projects by default; archived detail and print preview remained accessible; copy avoided permanent delete/data-loss wording; and no caveats were reported.
- [x] Confirm no hosted archive action, restore action, project mutation, row-data inspection, Supabase cloud push, app code change, package change, export/CAD/CNC work, delete, bulk archive, auth expansion, public sharing, marketplace, shopping, pricing, vendor, inventory, or new project type was added.

## Task 72A - Hosted Archive Completion Checkpoint

- [x] Document `private-mvp-0.8` as the hosted archive/restore completion checkpoint after archive foundation, archive dogfood, migration readiness, hosted migration application, and authorized manual hosted smoke.
- [x] Summarize hosted archive completion: hosted Supabase archive migration applied, app-facing `projects.id, archived_at` read path verified, `/projects` loaded, Active/Archived/All filters behaved correctly, archive and restore worked on a non-critical test project, dashboard excluded archived projects, archived detail and print preview remained accessible, and copy avoided permanent delete/data-loss wording.
- [x] Reconfirm archive/restore is private workspace organization only, not permanent delete, data-retention infrastructure, public sharing, collaboration, marketplace behavior, fabrication/engineering/structural approval software, CAD/CNC/export software, or public-launch readiness.
- [x] Keep the checkpoint docs/tag-only with no app features, schema changes, migrations, package changes, Supabase cloud push, permanent delete, bulk archive, undo toast system, export/CAD/CNC work, image upload, public sharing, marketplace, shopping, pricing, vendor, auth expansion, production multi-user changes, or new project types.

## Task 73A - Tweak This Plan Planning Pass

- [x] Add `docs/TWEAK_THIS_PLAN_PLAN.md` to scope the smallest safe private-MVP version of `Tweak this plan`.
- [x] Recommend a one-shot revision form on the latest generated plan that sends the project intake, latest plan JSON, latest build model, and one plain-English revision instruction to OpenAI as structured context.
- [x] Recommend saving revisions as new generated plan versions through existing history/versioning instead of mutating old plans.
- [x] Keep the first slice no-schema by reusing existing generated-plan schema, Zod validation, deterministic quality checks, `saveGeneratedPlan`, and plan comparison.
- [x] Document conservative boundaries for core intake changes such as dimensions, material changes, and wall-mounting removal when they conflict with the saved project intake or build model.
- [x] Document UI copy, prompt/context shape, validation gates, failure states, and focused implementation test coverage.
- [x] Keep this pass docs/planning-only with no app code, schema changes, migrations, packages, multi-turn chat, background agents, export/CAD/CNC work, image upload, public sharing, marketplace, shopping, pricing, vendor, auth expansion, production multi-user changes, permanent delete, bulk archive, or new project types.

## Task 73B - Add Narrow Tweak This Plan Foundation

- [x] Add a one-shot `Tweak this plan` form on active project detail pages when a latest generated plan exists.
- [x] Keep archived projects viewable but block revised-plan generation until the project is restored.
- [x] Add a `/projects/[id]/revise` POST route that reads one plain-English revision instruction, uses existing project data, latest generated plan JSON, and latest saved build model context, then saves a revised result as a new generated plan version.
- [x] Preserve the prior plan version and redirect successful revisions to `compare_plan=<priorLatestPlanId>` so the existing plan comparison panel opens against the old latest version.
- [x] Reuse the existing OpenAI structured-output schema, Zod validation, deterministic plan-quality checks, `saveGeneratedPlan`, and plan history/versioning without schema changes or migrations.
- [x] Add deterministic revision context and a no-schema `Revision request: ...` assumption marker that is re-validated before save.
- [x] Add focused helper, route, and project-detail rendering coverage for revision context, successful save, validation failure, empty/overlong notes, no-plan state, archived-project behavior, comparison redirect, and forbidden chat/export/CAD/CNC wording.
- [x] Keep the slice narrow with no multi-turn chat, background agents, image upload, permanent delete, bulk archive, PDF/SVG/DXF/CAD/CNC export, public sharing, marketplace, shopping, pricing, vendor, auth expansion, production multi-user changes, hosted Supabase changes, packages, schema changes, migrations, or new project types.

## Task 73C - Dogfood Tweak This Plan Usability

- [x] Dogfood the no-plan, active latest-plan, successful revision, failed revision, archived project, and comparison/history states through rendered-route and helper coverage.
- [x] Confirm no-plan projects do not show the revision form and still nudge users toward generating the first plan.
- [x] Confirm active projects with a latest generated plan show a compact one-shot form with new-version and manual-review copy.
- [x] Confirm archived project details, plan history, and print-preview links remain viewable while revision creation stays blocked until restore.
- [x] Tighten successful revision copy so users know the new latest plan is being compared with the previous version.
- [x] Tighten the comparison panel copy for revised redirects so it reads as revised-vs-prior rather than generic history comparison.
- [x] Add a no-schema `Revised` history marker derived from the existing `Revision request: ...` assumption prefix.
- [x] Update focused rendering coverage and `docs/TWEAK_THIS_PLAN_PLAN.md` implementation notes.
- [x] Keep the dogfood pass narrow with no schema changes, migrations, packages, multi-turn chat, background agents, image upload, permanent delete, bulk archive, PDF/SVG/DXF/CAD/CNC export, public sharing, marketplace, shopping, pricing, vendor, auth expansion, production multi-user changes, hosted Supabase changes, or new project types.

## Task 73D - Hosted Tweak This Plan Smoke

- [x] Inspect hosted deployment status, private readiness docs, task ledger, current repo state, and the `Tweak this plan` implementation status.
- [x] Attempt a secret-safe hosted route check against a ready deployment target without printing hosted URLs, secrets, project refs, connection strings, row data, screenshots, or sensitive logs.
- [x] Confirm `/` returns Vercel-level `401` before Boardsmith route handling from this Codex environment.
- [x] Confirm `/projects` returns Vercel-level `401` before Boardsmith route handling from this Codex environment.
- [x] Keep hosted `Tweak this plan` UI smoke blocked from this environment because the intended private hosted access layer prevents route rendering.
- [x] Confirm no hosted revision, generation, archive, restore, project mutation, row-data inspection, Supabase cloud action, app code change, package change, schema change, migration, export/CAD/CNC work, delete, bulk archive, auth expansion, public sharing, marketplace, shopping, pricing, vendor, inventory, or new project type was added.
- [x] Document the manual hosted smoke steps still required from an authorized private hosted browser session in `docs/HOSTED_DEPLOYMENT_STATUS.md`.

## Recommended Next Tasks

1. [ ] Run the documented manual hosted `Tweak this plan` smoke from an authorized private browser session and record the result without URLs, secrets, screenshots, row data, or sensitive logs.
2. [ ] Consider a `private-mvp-0.9` checkpoint after authorized hosted `Tweak this plan` smoke passes.
3. [ ] Consider project detail navigation polish if dogfood shows users lose their place moving between the dashboard, project list, detail pages, and print preview.

## Remaining Hardening

- [ ] Add authenticated Supabase RLS when auth is intentionally introduced.
- [ ] Add Playwright smoke tests once runtime workflows stabilize.
