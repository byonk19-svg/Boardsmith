# Boardsmith Private MVP Readiness

Date: June 8, 2026

## Current Status

Boardsmith is a private MVP woodworking planning app. It is ready for continued private testing and narrow private hosted use behind the chosen access layers, but it is not ready for public sharing or production multi-user use.

The current hosted posture is private-MVP ready: Vercel is linked, required hosted environment variable names are present, user-supplied authorized hosted browser smoke passed after the project-intake validation fix, authorized hosted archive/restore smoke passed after the archive migration was applied, and authenticated hosted `Tweak this plan` active-flow smoke passed. Do not share the hosted URL publicly. Share only with intended private users who can pass the active Vercel and/or Boardsmith access layers.

## Private MVP Checkpoint

Checkpoint: `private-mvp-0.1`.

This checkpoint marks the first privately hosted and smoke-tested Boardsmith MVP state. Local MVP dogfood passed, authorized hosted Vercel browser smoke passed, and the current private workflow includes project creation, notes, build log, validated plan generation, review surfaces, duplicate project, project-list indicators, and browser print preview.

This is a rollback/reference point for private MVP testing only. It is not a public launch, not a production multi-user release, and not a claim of engineering review, certification, load rating, fabrication readiness, or export/CAD capability.

## Private MVP 0.2 Polish Checkpoint

Checkpoint: `private-mvp-0.2`.

This checkpoint captures the post-`private-mvp-0.1` polish state. The app remains private-only and planning-aid only, but the intake, saved-plan review, and project retrieval flow are easier to use.

Post-checkpoint improvements:

- New Project intake examples for low-risk beginner projects.
- Local dogfood of the intake examples, with example copy tightened to avoid unsafe capacity, mounting, electrical, and multi-piece assumptions.
- Example starter links on `/projects/new` that prefill editable starter details.
- Local dogfood of all example starter links, including edited starter project creation, invalid-intake draft priority, and generation/rendering checks.
- Generated-plan readability polish that separates saved plans into overview, plan at a glance, materials, cut list, build steps, modeled operations, safety notes, assumptions, open questions, finishing notes, beginner tips, and future export notes.
- Generated-plan readability dogfood across no-plan, one-plan, and multiple-plan history states.
- Project list filtering and search across existing project, plan, and project-record states.

Current guardrails remain unchanged:

- Boardsmith is private-only.
- Generated plans are planning aids only.
- No engineering review, certification, load rating, wall-safety guarantee, child-safety certification, or fabrication-ready claim exists.
- Browser print remains the MVP output path.
- No app-generated PDF, SVG, DXF, CAD, CNC, or export pipeline exists.
- No public sharing exists.
- No shopping, pricing, vendor, purchasing, or inventory features exist.

Recommended next directions:

1. Small print preview polish if manual browser printing reveals layout or copy issues.
2. Revisit app-generated PDF only after explicit approval of the output need and renderer dependency.

## Visual Planning Usability Checkpoint

Checkpoint: `private-mvp-0.3`.

This checkpoint captures the browser-rendered visual planning usability layer added after the earlier private MVP polish checkpoint. Boardsmith remains a private MVP and a planning aid only. The new visual planning surfaces make generated plans easier to review in the browser and in browser print preview, but they do not change the safety posture, create downloadable files, or certify that any plan is build-ready.

New visual planning improvements:

- A browser print-preview `Before you build` summary with overall dimensions, main material, piece count, cut-list review count, primary tools, and safety/review reminders.
- A print-friendly cut-list checklist column for paper review.
- Deterministic planning diagrams for supported simple shelf, book ledge, and planter box shapes, with unsupported projects falling back calmly.
- Section-level `Planning diagram - not to scale` warnings for diagram surfaces.
- A connection planning aid that shows modeled piece-to-piece relationships, hardware/fastener wording, location text, and `Needs manual review` when modeled connection data requires extra review.
- Beginner-friendly build step cards that show step number, title, instructions, phase label, tools, time, safety note, modeled step, and related pieces only when a conservative deterministic match exists.

Dogfood and verification coverage:

- Planning diagrams were dogfooded across simple shelf, book ledge, planter box, and fallback project shapes.
- Connection diagrams were dogfooded across simple shelf, book ledge, planter box, no-connection, and fallback states.
- Build step cards were dogfooded across simple shelf, book ledge, planter box, wood-sign-style, ambiguous-step, and print-preview scenarios through helper and rendered markup coverage.
- Direct browser inspection was attempted during the build-step-card dogfood pass with an ignored local data file, but local `.env.local` Supabase configuration forced cloud lookup for dogfood IDs. The pass used rendered markup and helper checks as the fallback for that limitation.
- Earlier local browser dogfood remains bounded to private development routes and did not add hosted URLs, screenshots, secrets, logs, or runtime data to the repository.

Guardrails reconfirmed:

- Boardsmith is private-only.
- Generated plans, diagrams, connections, and step cards are planning aids only.
- No professional engineering review, structural approval, wall-safety guarantee, child-safety certification, load rating, construction approval, fabrication-ready claim, or CNC-ready claim exists.
- Browser-rendered UI and browser print preview remain the only current output path.
- No app-generated PDF, SVG export/download, DXF, CAD, CNC, or export pipeline exists.
- No image upload, public sharing, shopping, pricing, vendor, purchasing, inventory, marketplace, payment, or subscription feature exists.

Recommended next directions:

1. Keep follow-up work narrow and private-MVP-safe: only small copy, spacing, or deterministic review improvements found through dogfood.
2. Do not start app-generated PDF, SVG, DXF, CAD, CNC, public sharing, auth-provider, shopping, pricing, vendor, inventory, marketplace, payment, or subscription work without an explicit task and approval where required.

## Print Plan Usability Checkpoint

Checkpoint: `private-mvp-0.4`.

This checkpoint captures the browser print-preview usability pass after the visual planning checkpoint. Boardsmith remains a private MVP and a planning aid only. The print preview now reads more like a shop-plan flow for private review, but it still does not create downloadable files, certify build safety, or provide fabrication-ready output.

Print-plan flow now centers on:

- `Build Snapshot`
- `Project Visuals`
- `Check Before Building`
- `Materials and Parts`
- `Cut Checklist`
- `Build Guide`
- `Review Appendix`

Print-plan usability improvements:

- Shorter header summary and visible planning-aid caution.
- Compact build snapshot with size, material, difficulty, time, major pieces, and first-check facts.
- Project visuals near the top, including project anatomy, three-view planning diagram, visual piece inventory, and connection planning aid.
- Compact read-only action checklist with lower-priority checklist notes moved into the appendix.
- Denser materials and piece rows for scanning before the cut checklist.
- Checklist-style cut list with a `Cut?` column for paper review.
- Compact procedural build-step cards with `Do this` instructions, tools, pieces, and specific safety/check notes when useful.
- Dense review appendix for safety notes, assumptions, unresolved questions, material review notes, build sequence notes, finishing notes, and planning-aid reminders.

Dogfood and verification coverage:

- Rendered-route tests cover the current print hierarchy, visual section, checklist, material/piece rows, cut checklist, build guide cards, review appendix ordering, and forbidden export/CAD/CNC/approval language checks.
- Browser inspection was attempted during print-layout dogfood and cleanup passes, but the local private access gate redirected print routes to `/access`. Rendered markup tests were used as the fallback without inspecting or committing secrets.
- No hosted URLs, screenshots, logs, ignored dogfood data, runtime data, or secrets were committed.

Guardrails reconfirmed:

- Boardsmith is private-only.
- Generated plans, diagrams, checklists, cut lists, and build-step cards are planning aids only.
- Browser-rendered UI and browser print preview remain the only current output path.
- No app-generated PDF, SVG export/download, DXF, CAD, CNC, or export pipeline exists.
- No professional engineering review, structural approval, wall-safety guarantee, child-safety certification, load rating, construction approval, fabrication-ready claim, CAD-ready claim, or CNC-ready claim exists.
- No image upload, public sharing, shopping, pricing, vendor, purchasing, inventory, marketplace, payment, or subscription feature exists.

Recommended next directions:

1. Keep follow-up work narrow and private-MVP-safe: minor print copy, spacing, fallback wording, or deterministic review clarity only when dogfood reveals a concrete issue.
2. Rerun hosted/private smoke checks after any hosted config, deployment, access-gate, or environment-variable change.
3. Do not start app-generated PDF, SVG, DXF, CAD, CNC, public sharing, auth-provider, shopping, pricing, vendor, inventory, marketplace, payment, or subscription work without an explicit task and approval where required.

## Project List Usability Checkpoint

Checkpoint: `private-mvp-0.5`.

This checkpoint captures the project-list usability pass after the print-plan checkpoint. Boardsmith remains a private MVP and a planning aid only. The `/projects` page is easier to use with a crowded private dogfood list, but it is still a private planning workspace, not public browsing or production project management.

Project-list usability improvements:

- Projects sort by most recently updated first in the rendered list and storage reads.
- Search supports project title, intended use, style notes, material, notes, build-record text, and safety flags.
- Filters support project type, status, generated-plan state, and private record state using existing data only.
- Crowded-list rendered dogfood confirmed the default view does not hide projects.
- Project cards are more compact, with inline scan badges for plan, history, notes, and record state.
- Primary actions remain clear: `Open project`, `View latest plan`, and `Generate plan`.
- Empty and no-result copy is simpler and points users back to all projects.

Dogfood and verification coverage:

- Rendered-route tests cover crowded-list default rendering, updated ordering, search by intended use and style notes, combined filters, built/no-plan filters, no-results state, and project action links.
- Local and Supabase storage tests confirm project reads sort by `updated_at`.
- Direct browser inspection of `/projects` was attempted during the dogfood pass, but the local private access gate redirected to `/access`. Rendered markup and storage tests were used as fallback without inspecting or committing secrets.

Guardrails reconfirmed:

- Boardsmith is private-only.
- Generated plans and project-list indicators are planning aids only.
- No archive/delete, folders, tags, bulk actions, public sharing, marketplace behavior, auth expansion, or production multi-user assumption was added.
- No schema migration, Supabase/cloud change, OpenAI prompt/model/schema change, or package change was added.
- No app-generated PDF, SVG export/download, DXF, CAD, CNC, or export pipeline exists.
- No image upload, shopping, pricing, vendor, purchasing, inventory, marketplace, payment, or subscription feature exists.

Recommended next directions:

1. Consider archive/hide behavior for test projects only if explicitly approved as a separate private-MVP-safe task.
2. Consider small project detail navigation polish if dogfood shows users lose their place moving between the list, detail pages, and print preview.
3. Consider dashboard summary polish only if it helps orient private testers without adding public sharing, auth expansion, folders, tags, marketplace, or export scope.

## Dashboard Usability Checkpoint

Checkpoint: `private-mvp-0.6`.

This checkpoint captures the dashboard usability pass after the project-list checkpoint. Boardsmith remains a private MVP and a planning aid only. The home route now functions as a private workspace command center for resuming project work, checking plan status, and starting a bounded project from existing starter examples.

Dashboard usability improvements:

- `/` is now a private Boardsmith workspace dashboard, not a public/product marketing page.
- Dashboard counts summarize total projects, projects with generated plans, projects needing generated plans, and the latest update date.
- Recent project shortcuts show project metadata and clear `Open project`, `View latest plan`, or `Generate plan` actions.
- The no-projects empty state points users toward creating a first project.
- Starter example cards remain existing editable intake starter links and now show `Use starter ->`.
- Dashboard copy avoids public-sharing, export, CAD, and CNC language.

Dogfood and verification coverage:

- Rendered dashboard tests cover private workspace hierarchy, project counts, recent projects, latest-plan actions, generate-plan actions, starter links, empty state, and forbidden public-sharing/export/CAD/CNC wording.
- Screenshot cleanup replaced the long-title stat value with a compact latest-update date, tightened recent project cards, and clarified starter-card affordance.
- Direct browser inspection was blocked by the local private access gate during the dashboard polish pass, so rendered-route tests were used as fallback without inspecting or committing secrets.

Guardrails reconfirmed:

- Boardsmith is private-only.
- Generated plans, project counts, dashboard shortcuts, and starter links are planning aids only.
- No archive/delete, folders, tags, bulk actions, public sharing, marketplace behavior, auth expansion, or production multi-user assumption was added.
- No schema migration, Supabase/cloud change, OpenAI prompt/model/schema change, or package change was added.
- No app-generated PDF, SVG export/download, DXF, CAD, CNC, or export pipeline exists.
- No image upload, shopping, pricing, vendor, purchasing, inventory, marketplace, payment, or subscription feature exists.

Recommended next directions:

1. Consider archive/hide behavior for dogfood or test projects only if explicitly approved as a separate private-MVP-safe task.
2. Consider project detail navigation polish if dogfood shows users lose their place moving between the dashboard, project list, detail pages, and print preview.
3. Run a hosted smoke/checkpoint review after any hosted config, deployment, access-gate, or environment-variable change.

## Project Archive Usability Checkpoint

Checkpoint: `private-mvp-0.7`.

This checkpoint captures the private-MVP archive/restore usability milestone after the dashboard checkpoint. Boardsmith can now move dogfood, smoke-test, and inactive projects out of the default workspace without deleting project records or generated plans. This is a project-organization aid only, not a public project-management system and not a data-retention or deletion system.

Archive behavior:

- Projects have nullable `archived_at` metadata.
- Existing local JSON projects without archive metadata continue to load as active projects.
- `/projects` defaults to active projects and adds filters for active, archived, and all projects.
- Dashboard counts and recent shortcuts use active projects by default.
- Archived project detail pages remain viewable and keep generated plan and browser print preview access.
- Archive and restore actions preserve project data, notes, build logs, generated plans, and plan history.

Dogfood and verification coverage:

- Rendered-route tests cover archive and restore actions, active/archived/all list filters, dashboard exclusion, archived detail visibility, detail-page restore redirects, restored-project empty-state copy, and archived print-preview access.
- The `/projects` empty state now explains that restored projects return to Active projects, reducing confusion when the Archived filter becomes empty.
- Archive copy was checked to avoid permanent-delete or data-loss language.

Migration status:

- Local migration added: `supabase/migrations/20260607183000_add_project_archive_metadata.sql`.
- Supabase cloud migration application was not performed in this task.
- Hosted smoke should be rerun after applying this migration to any hosted Supabase environment.

Guardrails reconfirmed:

- Archiving is an organization aid only.
- Delete was intentionally not added.
- No folders, tags, public sharing, marketplace behavior, auth expansion, production multi-user assumption, OpenAI prompt/model/schema change, package change, app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, shopping, pricing, vendor, purchasing, inventory, payment, or subscription feature was added.

## Hosted Archive Completion Checkpoint

Checkpoint: `private-mvp-0.8`.

This checkpoint captures the completed hosted archive/restore milestone after the `private-mvp-0.7` archive usability checkpoint. Archive/restore remains private project organization and workspace hygiene: it hides dogfood, smoke-test, or inactive projects from default active workspace views without deleting project records or generated plans.

Hosted completion summary:

- The archive migration `supabase/migrations/20260607183000_add_project_archive_metadata.sql` is applied to hosted Supabase.
- The app-facing hosted Supabase read path for `projects.id, archived_at` passed after migration.
- Authorized manual hosted archive smoke passed on June 8, 2026 with no caveats.
- Hosted `/projects` loaded after private access.
- Active, Archived, and All filters behaved as expected.
- Archive and restore worked on a clearly labeled non-critical test project.
- Dashboard default state excluded archived projects.
- Archived project detail pages remained accessible.
- Archived project browser print preview remained accessible.
- Archive/restore copy avoided permanent delete and data-loss wording.
- No hosted URLs, screenshots, secrets, project refs, connection strings, row data, or sensitive logs were committed.

Guardrails reconfirmed:

- Boardsmith remains private-MVP-only and planning-aid-only.
- Archive/restore is not permanent delete, data-retention infrastructure, production lifecycle management, public sharing, collaboration, or marketplace behavior.
- Permanent delete remains explicitly out of scope.
- Browser print remains the supported MVP output path.
- No app-generated PDF, SVG export/download, DXF, CAD, CNC, fabrication-ready output, engineering review, structural approval, load rating, wall-safety guarantee, child-safety certification, public launch, auth expansion, production multi-user assumption, image upload, shopping, pricing, vendor, purchasing, inventory, marketplace, payment, or subscription feature exists.

Recommended next direction:

1. Completed by `private-mvp-0.9`: the narrow `Tweak this plan` slice was planned, implemented, dogfooded, and smoke-tested through the authenticated hosted active-project flow.

## Hosted Tweak This Plan Checkpoint

Checkpoint: `private-mvp-0.9`.

This checkpoint captures the authenticated hosted `Tweak this plan` milestone after the hosted archive completion checkpoint. Boardsmith now supports the first private-MVP revision loop: generate a plan, submit one plain-English revision request, save the revised result as a new generated-plan version, preserve the prior version in history, and compare the revised latest plan against the previous version.

Hosted completion summary:

- Hosted route smoke passed through the protected hosted access path.
- `/projects` returned `200`, ended at `/projects`, did not land on hosted login, rendered Boardsmith, and had no blocked reason.
- Hosted `Tweak this plan` active-flow smoke passed on a clearly labeled non-critical smoke/test project.
- The revision form was visible, one simple revision was submitted, the revised plan became latest, and the prior plan remained in history.
- Revised-vs-prior success and comparison copy appeared.
- The no-schema `Revised` marker appeared in plan history.
- The revised latest plan's browser print preview rendered the expected shop-plan sections.
- Forbidden engineering approval, structural approval, load-rating guarantee, CAD/CNC readiness, export-readiness, and fabrication-certainty copy was not introduced.
- No hosted URLs, screenshots, secrets, project refs, connection strings, row data, cookies, request headers, session-file contents, or sensitive logs were committed.

Caveat status:

- The original checkpoint caveat was that the archived-project live UI smoke could not be completed during Task 73M because the hosted Archived filter did not expose an archived project card to open in that session. Task 75A closed this caveat on June 10, 2026 by archiving a clearly labeled non-critical smoke/test project with a latest generated plan, confirming the Archived filter exposed it, and confirming archived detail blocked revisions until restore while preserving print preview access.

Guardrails reconfirmed:

- Boardsmith remains private-MVP-only and planning-aid-only.
- `Tweak this plan` creates a new generated-plan version; it is not multi-turn chat, background agent work, fabrication approval, CAD/CNC/export readiness, or construction approval.
- Browser print remains the supported MVP output path.
- Permanent delete, bulk archive, public sharing, marketplace behavior, auth expansion, production multi-user assumption, app-generated PDF, SVG export/download, DXF, CAD, CNC, image upload, shopping, pricing, vendor, purchasing, inventory, payment, and subscription work remain out of scope.

Recommended next directions:

1. Optionally close the archived-project live-smoke caveat by identifying a clearly labeled archived non-critical project and verifying that archived detail blocks revisions while preserving plan/detail/print viewing.
2. Consider project detail navigation polish if dogfood shows users lose their place moving between the dashboard, project list, detail pages, comparison, and print preview.
3. Keep using the app manually before adding broader features; do not start export/CAD/CNC, public sharing, marketplace, auth expansion, delete, or new project type work without an explicit task and approval where required.

## What Works Now

- Project creation from `/projects/new`.
- Private workspace dashboard with project counts, latest update date, recent project shortcuts, empty state, and starter example links.
- Project archive/restore foundation that hides archived projects from the default project list and dashboard while preserving project records and generated plans.
- Hosted project intake accepts normal woodworking values like `12`, `8`, `4`, and material thickness `0.75`.
- Supabase-backed project, generated-plan, notes, duplicate-project, and build-log persistence.
- Local JSON fallback when Supabase env vars are absent.
- OpenAI generated-plan flow when `OPENAI_API_KEY` is present.
- Graceful missing-key and blocked-generation feedback when generation cannot safely save.
- Zod validation before generated plans are persisted.
- Atomic Supabase generated-plan save through `save_generated_plan_atomic(...)`.
- Stored `build_model_json` on generated plan versions.
- Plan history that preserves earlier versions.
- Read-only plan comparison between the latest plan and an older saved version.
- One-shot `Tweak this plan` active-project revision flow that saves revised output as a new generated-plan version, preserves the previous version in history, and redirects into revised-vs-prior comparison.
- Deterministic Plan Review status.
- Deterministic Export Readiness status for future export work.
- Material Summary grouped for review.
- Cut List Review for missing dimensions, vague pieces, quantity issues, and duplicate-looking pieces.
- Manifest-backed Printable Plan Sheet on the project detail page.
- Browser print preview at `/projects/[id]/print`.
- Browser print-preview shop-plan flow with Build Snapshot, Project Visuals, Check Before Building, Materials and Parts, Cut Checklist, Build Guide, and Review Appendix.
- Browser print-preview visual aids: project anatomy, three-view planning diagram, visual piece inventory, and connection planning aid.
- Compact print action checklist, materials/piece rows, checklist-style cut list, and procedural build-step cards.
- Deterministic browser-rendered planning diagrams for supported simple shelf, book ledge, and planter box plans.
- Connection planning aids from existing build-model connection data.
- Beginner-friendly build step cards from existing generated plan and build-model operation data.
- Export architecture decision remains browser-print-first for the private MVP; app-generated PDF is not approved.
- Duplicate project action that copies intake details without generated plans, notes, history, or build log.
- Project notes.
- Build log fields for completion status, completion date, actual material, plan changes, and lessons learned.
- Project list search, updated-first ordering, filters for project type/status/plan state/record state, compact scan badges, and clear open/latest-plan/generate actions.
- Optional private access gate through `BOARDSMITH_ACCESS_PASSWORD`.
- Vercel project link and hosted env var name readiness.
- User-supplied authorized hosted smoke for access gate, project creation, notes, build log, generation, review surfaces, duplicate project, project list indicators, and browser print preview.
- Hosted archive migration checks attempted on June 8, 2026; `public.projects.archived_at` was still missing from the hosted Supabase persistence path on the Task 71C retry, then Task 71E applied `20260607183000_add_project_archive_metadata.sql` through the linked Supabase CLI path and verified the app-facing `projects.id, archived_at` read path.
- Hosted archive/restore UI smoke was blocked from this Codex environment because the latest ready production deployment returned Vercel-level `401` protection before Boardsmith route handling on the Task 71F route checks.
- Authorized manual hosted archive smoke passed on June 8, 2026 with no caveats: `/projects` loaded, Active excluded archived projects, Archived showed archived projects, All showed both active and archived projects, archive and restore worked on a clearly labeled non-critical test project, dashboard default state excluded archived projects, archived project detail and print preview remained accessible, and copy avoided permanent delete/data-loss wording.
- Authenticated hosted `Tweak this plan` active-project UI smoke passed on June 10, 2026: route smoke reached `/projects` without a hosted-login blocker, the active revision flow saved a new latest plan while preserving the prior version, revised-vs-prior comparison and `Revised` history marker appeared, the revised latest print preview rendered expected shop-plan sections, and forbidden engineering/approval/load/CAD/CNC/export-certainty copy was absent.
- Hosted archived-project `Tweak this plan` blocking smoke passed on June 10, 2026: a clearly labeled non-critical smoke/test project with a latest plan was archived during smoke, the Archived filter exposed it, Active excluded it, archived detail stayed accessible, restore action was visible, the revision form was absent until restore, and archived print preview rendered expected shop-plan sections.

## What Is Not Verified Yet

- Whether Vercel-level deployment protection, the Boardsmith `/access` gate, or both should be the long-term private hosted access model.
- Hosted behavior after any future deployment, env-var change, migration, access-gate change, archive-related code change, or `Tweak this plan` code change until the hosted smoke checklist is rerun.

## Non-Goals And Guardrails

Boardsmith does not currently provide:

- app-generated PDF export
- SVG export
- DXF export
- CAD, FreeCAD, CNC, or router-ready output
- production fabrication files
- engineering review, certification, or load ratings
- wall-mounting guarantees
- child or baby safety certification
- public sharing
- full auth or per-user accounts
- payments or subscriptions
- marketplace, Etsy, shopping, pricing, vendor, purchasing, or inventory features
- image upload

Keep generated plans framed as planning aids only. Users must verify dimensions, materials, fasteners, wall conditions, PPE, tool instructions, finish labels, and fit before cutting or building.

## Local Smoke Checklist

Run this before more product work:

1. Confirm `main` is clean and current.
2. Run `npm install` if dependencies are not current.
3. Configure `.env.local` for the intended mode.
4. Start the app with `npm run dev`.
5. Load `/`.
6. Load `/projects`.
7. Load `/projects/new`.
8. Load `/settings`.
9. Create a clearly labeled smoke project.
10. Confirm the project detail page shows intake, template guidance, Project Structure, safety flags, Material Summary, Cut List Review, and the no-plan state.
11. Save project notes and confirm they persist after reload.
12. Save build-log details and confirm they persist after reload.
13. Duplicate the project and confirm the duplicate has no notes, build log, generated plans, or plan history.
14. Generate a plan if `OPENAI_API_KEY` is present.
15. Confirm validation gates either save a valid plan or show calm blocked feedback without persisting invalid output.
16. Confirm latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and plan history render.
17. Generate a second plan only if safe, then confirm plan comparison appears.
18. Open `/projects/[id]/print` and confirm browser print preview renders planning-aid safety copy.

## Hosted Smoke Checklist

Run this only from the intended hosted access path. Do not commit hosted URLs or screenshots. If Vercel-level Deployment Protection blocks automation before Boardsmith route handling, use [docs/HOSTED_SMOKE_AUTOMATION.md](HOSTED_SMOKE_AUTOMATION.md) to configure a dedicated Protection Bypass for Automation secret without disabling Vercel protection.

1. Open the latest Production deployment from the Vercel dashboard while signed in.
2. Confirm Vercel-level protection behavior is intentional.
3. Confirm the site loads after Vercel authorization.
4. Visit `/projects` before Boardsmith access and confirm it redirects to `/access` if the app-level gate is enabled.
5. Submit a wrong Boardsmith password and confirm it is rejected.
6. Submit the correct `BOARDSMITH_ACCESS_PASSWORD` and confirm access is granted.
7. Confirm the raw password is not visible in the UI, browser URL, or logs.
8. Load `/`, `/projects`, `/projects/new`, and `/settings`.
9. Create a clearly labeled hosted smoke project.
10. Save and reload project notes.
11. Save and reload build-log details.
12. Duplicate the project and confirm notes, build log, generated plans, and history are not copied.
13. Generate one clearly labeled smoke plan if safe.
14. Confirm latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, plan history, and Printable Plan Sheet render.
15. Open browser print preview and confirm it renders.
16. If generation is blocked, confirm no invalid output is saved and user-facing feedback does not expose raw Zod, schema, stack trace, or internal error details.

## Required Verification Commands

Run before committing app or docs changes:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

## Recommended Next Step

Keep Boardsmith private and continue with small trust-building polish only. The next recommended step is either a small hosted archived-project smoke check using a clearly labeled archived non-critical project, project detail navigation polish, or more manual dogfood of the existing private planning workflow. Do not start app-generated PDF, SVG, DXF, CAD, CNC, shopping, pricing, vendor, inventory, public sharing, folders/tags, delete, auth expansion, or new project type work without an explicit task and, for PDF, explicit renderer dependency approval.
