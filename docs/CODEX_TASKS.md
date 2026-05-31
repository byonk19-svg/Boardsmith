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

## Recommended Next Tasks

1. [ ] Export readiness checks, not export.
2. [ ] Printable plan polish.
3. [ ] Project examples/templates polish.
4. [ ] Material summary refinement.
5. [ ] Cut-list review improvements.
6. [ ] Later: SVG/PDF export foundation.
7. [ ] Much later: CAD/FreeCAD/CNC research.

## Remaining Hardening

- [ ] Add authenticated Supabase RLS when auth is intentionally introduced.
- [ ] Add Playwright smoke tests once runtime workflows stabilize.
