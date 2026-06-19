# Boardsmith Private MVP Readiness

Date: June 15, 2026

## Current Status

Boardsmith is a private MVP woodworking planning app. It is ready for a small private MVP demo/use test with intended users who can pass the active hosted access layers. It is not ready for public sharing, production multi-user use, fabrication approval, or export/CAD workflows.

The current hosted posture is private-MVP ready: Vercel is linked, required hosted environment variable names are present, hosted route smoke passes through the intended protected access path, authorized hosted archive/restore and `Tweak this plan` smoke have passed, and the post-push wall-shelf dogfood fix was verified on hosted. Do not share the hosted URL publicly. Share only with intended private users who can pass the active Vercel and/or Boardsmith access layers.

## Final Private MVP Readiness Checkpoint

Date: June 15, 2026

Checked branch: `main` synced with `origin/main`.

Checked commits:

- `70ec2d1 Document hosted dogfood follow-up`
- `63e6107 Harden wall shelf dogfood states`
- `0e3e735 Harden generation lifecycle states`

Go/no-go recommendation: **Go for a small private MVP demo/use test.**

This is a private-use go, not a public launch. Boardsmith is coherent enough for the owner or a very small trusted private group to create supported projects, generate reviewable plans, understand blocked/failure states, revisit saved plan versions, and use browser print sheets. Keep expectations explicit: every output is a planning aid that requires human review before cutting, mounting, loading, finishing, or using.

What is now verified:

- Project creation works from the structured intake flow for supported beginner-friendly project types.
- Hosted route smoke reaches `/` and `/projects` through the intended protected access path.
- Hosted project generation can produce useful wall-shelf/simple project packets with Plan Review, Cut Checklist, Buying Plan, Materials and Parts, plan history, and browser print preview.
- Deterministic invalid connected multi-shelf generation redirects to safe shelf-layout feedback without saving a plan.
- Archived direct generation is blocked with restore-before-generating copy while existing archived plans and print sheets remain viewable.
- Empty revision input leaves the saved latest plan unchanged.
- Projects whose latest attempt failed while an older saved plan remains available now say the latest attempt failed instead of implying there is no usable saved plan.
- Five separate wall shelves with individual board thickness now generate successfully on hosted and render Buying Plan instead of hitting `shelf_layout_invalid`.
- Wall-shelf Buying Plan appears after Cut Checklist and before Materials and Parts on detail and print, groups modeled wood pieces by material, and keeps stock length as review/selection language instead of inventing a purchase.
- Browser print remains the supported private MVP output path.

Remaining known limitations:

- Generated plan quality can still vary. Connected shelf units and child-adjacent ledges may be blocked by generated-plan review; this is acceptable safety posture until repeated examples justify a narrow prompt/model slice.
- Buying Plan is still conservative. It does not choose exact stock boards, optimize cuts, price materials, choose vendors, or produce a complete shopping list.
- Hardware and fastener guidance remains split across Buying Plan, Materials and Parts, and review notes because exact bracket/anchor choices depend on wall structure, expected load, and real site review.
- The hosted access model still relies on private access layers, not production auth, per-user ownership, or RLS.
- Browser print is usable but not a generated PDF/download/export system.
- Boardsmith still does not provide engineering review, load ratings, wall-safety guarantees, child-safety certification, CAD/CNC output, public sharing, shopping, pricing, vendor, inventory, payments, or subscriptions.

Recommended next 3 tasks:

1. Keep using the wall-shelf Buying Plan manually; only expand behavior if stock-length selection or hardware grouping remains repeatedly annoying.
2. Collect repeated generation-quality friction from real supported projects before changing prompts.
3. Rerun hosted smoke after any future deployment, env-var, access-gate, archive, project detail, generation, or `Tweak this plan` change.

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

1. Completed by `private-mvp-1.0`: the archived-project caveat was closed, project-detail navigation was polished and smoke-tested, versioning/revision copy was tightened, and a fresh hosted end-to-end dogfood project completed without product defects.

## Private MVP 1.0 Baseline

Checkpoint: `private-mvp-1.0`.

This checkpoint captures Boardsmith as a private MVP planning baseline after the hosted archive, hosted `Tweak this plan`, project-detail navigation, versioning-copy, and fresh end-to-end dogfood passes. It is a pause point for manual use and product judgment, not a public launch or fabrication/export milestone.

Verified hosted behavior:

- Authenticated hosted route smoke passes through the protected hosted access path.
- Project list and project detail pages work for active, archived, no-plan, generated-plan, and revised-plan states.
- No-plan projects show first-time generation copy and omit absent plan-only actions.
- First plan generation works for a clearly labeled non-critical supported hosted dogfood project.
- `Tweak this plan` works as a one-shot revision flow.
- The revised plan becomes the latest plan.
- The prior plan remains in plan history.
- Revised-vs-prior comparison works.
- Browser print preview works and remains the supported build-facing output path.
- Project notes and build-log notes save and render.
- Archive and restore work.
- Archived projects remain viewable and block revision creation until restored.
- Hosted dogfood output avoids recording hosted URLs, screenshots, secrets, project refs, connection strings, row data, cookies, request headers, session-file contents, and sensitive logs.

Guardrails reconfirmed:

- Boardsmith remains private-MVP-only and planning-aid-only.
- Generated plans are not professional engineering review, structural approval, construction approval, fabrication-ready output, wall-safety guarantees, child-safety certification, or load ratings.
- `Tweak this plan` is a one-shot plan revision that creates another saved plan version; it is not multi-turn chat, background agent work, construction approval, or fabrication approval.
- Browser print remains enough for the private MVP baseline.
- No public launch, real auth/RLS expansion, production multi-user assumption, app-generated PDF, SVG export/download, DXF, CAD, CNC, export pipeline, image upload, public sharing, marketplace, shopping, pricing, vendor, purchasing, inventory, payment, subscription, permanent delete, bulk archive, folders, tags, or new project type exists.

Recommended next direction:

1. Pause broad feature work and use Boardsmith manually as a private planning aid.
2. Select the next major lane only after repeated manual dogfood shows the same pain point.
3. Do not start app-generated PDF/export, CAD/CNC, public sharing, marketplace/shopping, auth expansion, delete, or new project type work without an explicit scoped task and required approvals.

## What Works Now

- Project creation from `/projects/new`.
- Plain-language idea drafting from the dashboard or `/projects/new` via `/projects/draft`, with editable setup fields, parser review notes, and supported/concept/unsupported/blocked draft status before save.
- Natural-language concept-only or unsupported drafts no longer silently default into wall-shelf setup; they require explicit supported-template resolution before project creation, while safety-blocked drafts are refused at the create route.
- Private workspace dashboard with project counts, latest update date, recent project shortcuts, empty state, idea-draft entry, and starter example links.
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
- One-shot `Tweak this plan` active-project revision flow for prose-only changes that saves revised output as a new generated-plan version, preserves the previous version in history, and redirects into revised-vs-prior comparison.
- Structural or safety-sensitive revision requests are classified and blocked or redirected before regeneration instead of silently saving a full new plan.
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
- Conservative planter-box part labels now flow through the printable manifest, project detail materials/parts section, and browser print materials/parts section.
- Unsupported woodworking-adjacent ideas can render concept-only guidance and mini options without cut lists, build steps, or packet visuals.
- Connection planning aids from existing build-model connection data.
- Beginner-friendly build step cards from existing generated plan and build-model operation data.
- Export architecture decision remains browser-print-first for the private MVP; app-generated PDF is not approved.
- Duplicate project action that copies intake details without generated plans, notes, history, or build log.
- Project notes.
- Build log fields for completion status, completion date, actual material, plan changes, and lessons learned.
- Project list search, updated-first ordering, filters for project type/status/plan state/record state, compact scan badges, and clear open/latest-plan/generate actions.
- Project detail navigation polish with no-print section jump links and grouped project actions, hosted-smoked across latest-plan, no-plan, archived, and print-preview states.
- Optional private access gate through `BOARDSMITH_ACCESS_PASSWORD`.
- Vercel project link and hosted env var name readiness.
- User-supplied authorized hosted smoke for access gate, project creation, notes, build log, generation, review surfaces, duplicate project, project list indicators, and browser print preview.
- Hosted archive migration checks attempted on June 8, 2026; `public.projects.archived_at` was still missing from the hosted Supabase persistence path on the Task 71C retry, then Task 71E applied `20260607183000_add_project_archive_metadata.sql` through the linked Supabase CLI path and verified the app-facing `projects.id, archived_at` read path.
- Hosted archive/restore UI smoke was blocked from this Codex environment because the latest ready production deployment returned Vercel-level `401` protection before Boardsmith route handling on the Task 71F route checks.
- Authorized manual hosted archive smoke passed on June 8, 2026 with no caveats: `/projects` loaded, Active excluded archived projects, Archived showed archived projects, All showed both active and archived projects, archive and restore worked on a clearly labeled non-critical test project, dashboard default state excluded archived projects, archived project detail and print preview remained accessible, and copy avoided permanent delete/data-loss wording.
- Authenticated hosted `Tweak this plan` active-project UI smoke passed on June 10, 2026: route smoke reached `/projects` without a hosted-login blocker, the active revision flow saved a new latest plan while preserving the prior version, revised-vs-prior comparison and `Revised` history marker appeared, the revised latest print preview rendered expected shop-plan sections, and forbidden engineering/approval/load/CAD/CNC/export-certainty copy was absent.
- Hosted archived-project `Tweak this plan` blocking smoke passed on June 10, 2026: a clearly labeled non-critical smoke/test project with a latest plan was archived during smoke, the Archived filter exposed it, Active excluded it, archived detail stayed accessible, restore action was visible, the revision form was absent until restore, and archived print preview rendered expected shop-plan sections.
- Hosted project-detail navigation smoke passed on June 10, 2026: `Project sections` links targeted rendered sections for latest-plan pages, no-plan pages omitted absent plan-only links, `Project actions` preserved existing actions, archived detail still blocked revisions until restore, and browser print preview omitted the no-print navigation/action polish.
- Fresh hosted end-to-end dogfood passed on June 10, 2026: a clearly labeled non-critical supported project was created, generated a first validated plan, created a one-shot revised plan, preserved the prior version in history, showed revised-vs-prior comparison, rendered browser print preview, saved notes and build-log notes, archived, and restored without product defects.

## What Is Not Verified Yet

- Whether Vercel-level deployment protection, the Boardsmith `/access` gate, or both should be the long-term private hosted access model.
- Hosted behavior after any future deployment, env-var change, migration, access-gate change, archive-related code change, or `Tweak this plan` code change until the hosted smoke checklist is rerun.
- The new idea-drafting status lifecycle, concept-only guidance, planter-box part-label rendering, and revision-intent blocking paths have local automated coverage but have not yet had a fresh hosted smoke pass after this implementation.

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

## Private MVP Dogfood Readiness Checkpoint

Date: June 11, 2026

Checked baseline commit: `b4702b4 Harden project detail action errors`

Purpose: confirm the recent private MVP polish chain is stable enough for another real dogfood pass. This was a repo-health checkpoint only; it did not intentionally add features, change schema, change auth, change generation behavior, or add export functionality.

Working tree note: final verification was run against the current working tree, not a clean `b4702b4` checkout. The tree still contains uncommitted project-detail `Review before building` summary UI/test changes and an untracked `docs/UI_WIREFLOW.md`; these were not part of this checkpoint and should be resolved before a formal dogfood pass.

Verification results:

- `npm test` passed: 39 test files, 217 tests.
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm run build` passed.
- `git diff --check` passed.

Recent checkpoint commits reviewed:

- `b4702b4 Harden project detail action errors`
- `16a4cce Polish project guidance and intake flow`
- `225335c Polish archived project read-only state`
- `07e90e4 Polish private MVP trust copy`
- `7a5bebc Document private MVP 1.0 baseline`

Walkthrough areas checked through rendered-page tests and source inspection:

- Access gate copy includes private MVP storage caution, with no auth behavior change.
- Dashboard cards use clear project actions and avoid duplicate same-destination latest-plan CTAs.
- Project list keeps search and archive visible, groups advanced filters under `More filters`, and maps known/unknown `?error=` values to safe copy.
- New project intake has compact starter examples, a good-input example, grouped fields, safe invalid-intake and unknown-starter copy, and a loading state.
- No-plan project detail shows recommended next-step guidance and explains that only validated plans are saved.
- Generated-plan detail points users toward review, cut list, assumptions/open questions, and `Browser print plan`.
- Safety wording uses `Review triggers` and keeps unresolved cut-dimension warnings prominent.
- Archived project detail remains read-only, with restore as the edit-enabling action and read-only plan/history/print/review access preserved.
- Browser print plan copy stays browser-print-only and does not imply PDF, CAD, SVG, DXF, CNC, or fabrication-ready output.

Issues found:

- No verification blocker found during this checkpoint.
- Working tree is not clean after `b4702b4`: uncommitted project-detail `Review before building` summary UI/test changes and untracked `docs/UI_WIREFLOW.md` remain. They were left untouched because they are outside this repo-health checkpoint.

Tiny fixes made:

- Added this checkpoint note only.

Recommended next dogfood project types:

- Simple cutting board
- Basic wall shelf
- Planter box
- Small storage crate
- Simple shop organizer

## Generated Plan Dogfood And Print-Readability Checkpoint

Date: June 11, 2026

Checked commit: `59437e1 Polish generated plan review order`

Purpose: dogfood the generated-plan reading order, browser-print plan, and review-before-building flow from a cautious private MVP woodworking perspective. This checkpoint used existing starter examples, rendered-page tests, print-preview tests, and source inspection. It did not create project records, invoke live generation, mutate hosted data, add features, change schema, change auth, or add export functionality.

Scenarios reviewed:

- Basic wall shelf: covered by existing generated shelf detail and print-preview fixtures. Review triggers, wall-mounting cautions, cut list, materials, open questions, browser print plan, and plan-history paths are visible.
- Planter box: covered by starter intake and rendered print-preview diagram/build-guide coverage for planter box pieces, outdoor/drainage review, and manual weight review.
- Simple shop organizer: covered by the desktop organizer starter, which keeps the project small, indoor, beginner-friendly, and non-load-rated.
- Small decorative tray/cutting-board-adjacent flat project: covered by the decorative tray starter and wood-sign-style/simple flat-panel rendering paths. Food-contact and carrying/load-bearing use remain excluded in starter copy.
- Simple riser/storage-adjacent project: covered by the cordless lamp riser starter and generated-plan rendering paths for a small freestanding flat-board project without electrical work.

Print/readability findings:

- Browser print plan wording is consistent and continues to state that no PDF or CAD download is generated.
- Print preview keeps navigation outside the print output and centers the printed flow on Build Snapshot, Project Visuals, Check Before Building, Materials and Parts, Cut Checklist, Build Guide, and Review Appendix.
- Review triggers remain visible and are framed as conservative triggers, not confirmed hazards.
- Cut-list tables include a mobile horizontal-scroll hint and print-friendly checklist markers.
- Materials, pieces, tools, assumptions, open questions, and planning-aid reminders are visible before or inside the review appendix.
- Existing rendered tests cover unresolved dimensions on project detail; no new print-specific unresolved-dimension defect was found in this checkpoint.

Project-detail readability findings:

- `Recommended next step` remains state-aware and appears before the generated-plan review summary.
- `Review before building` now acts as a compact checklist, not an edit flow.
- No-plan projects do not show the generated-plan checklist.
- Archived projects preserve read-only framing and omit edit-enabling actions except restore.
- Browser print links and `#open-questions` / `#cut-list-to-verify` anchors are covered by rendered tests.

Tiny fixes made:

- No app code fix was needed during this dogfood checkpoint.

Issues deferred:

- A real manual print pass should still inspect physical/page-preview pagination and whether wide cut-list rows wrap acceptably in the browser print dialog.
- Plan quality/generation quality should be the next improvement area if repeated dogfood shows weak assumptions, missing dimensions, or vague build steps in real generated output.

Recommended next step:

1. Run a real manual print/readability pass on a small wall shelf or planter box using the browser print dialog.
2. If the UI reads well, shift the next improvement lane from UI polish to generated plan quality.

## Real Browser Print-Readability Checkpoint

Date: June 11, 2026

Checked commit: `c772dea Update private MVP readiness checkpoint`

Purpose: validate browser print as the private MVP output path using actual browser rendering, then make only tiny print-readability fixes. This pass did not add export functionality, change plan generation, change data contracts, change auth, add packages, or mutate project records.

Method:

- Confirmed the working tree was clean and recent history included the generated-plan dogfood checkpoint.
- Started from the documented local workflow. A separate dev server was already running, so the pass used `next build` plus `next start` on a temporary local port.
- Attempted to force the ignored `.data/dogfood-58b.json` fixture, but `.env.local` kept Supabase persistence configured. The pass stayed read-only and used existing dogfood/smoke records visible through the local server. No POST actions, plan generation, archive/restore actions, or hosted-data mutations were performed.
- Used Chrome headless browser rendering to create screen captures and browser-generated print PDFs under ignored `.next/print-review*` folders.
- Used bundled PDF tooling to inspect page counts and confirm print-only content.

Scenarios reviewed:

- Bathroom wall shelf: `Dogfood Retry 2 20260601 - Bathroom Wall Shelf`.
- Outdoor planter box: `Dogfood Retry 20260601 - Outdoor Planter Box`.
- Cordless lamp riser: `Dogfood Retry 20260601 - Cordless Lamp Riser`.
- Toddler book ledge: `Dogfood Retry 3 20260601 - Toddler Book Ledge`.
- Non-critical pantry sign: `Dogfood 20260610 20260610185545 - Non-critical pantry sign`.

Browser print findings:

- Browser print PDFs hid app navigation and the back-to-project toolbar.
- Project title, planning-aid warning, build snapshot, project visuals, review checklist, materials, cut checklist, build guide, review appendix, review triggers, open questions, and no-PDF/CAD copy remained visible.
- Before the tiny CSS fix, longer visual sections could leave the next workflow heading on the tail end of a visual-diagram page. The content was readable, but the printed sequence felt less intentional.
- The current print plan did not provide an obvious handwritten note area.

Tiny fixes made:

- Added print page-break hints before Check Before Building, Cut Checklist, Build Guide, and Review Appendix.
- Added a print-only, non-persistent Shop notes area with blank space for handwritten notes.
- Updated the existing print-preview rendering test to cover the new print-only note area and page-break class.

Issues deferred:

- The browser print output is usable for private MVP dogfood, but complex generated plans can still run 10-12 pages because project visuals and review details are intentionally explicit.
- A true physical paper pass should still check printer margins, ink density, and whether the blank notes area is enough in shop use.
- No shop-organizer or decorative-tray generated print route was available in the reachable read-only records; those project types should be reviewed when real generated examples exist.

Recommended next step:

Shift from UI print polish to generated-plan quality unless repeated manual printing exposes a concrete paper-layout problem.

## Multi-Shelf Wall-Shelf Guardrail Checkpoint

Date: June 14, 2026

Checked commit: `6c89bf0 Guard multi-shelf wall shelf plans`

Purpose: close a trust gap found during wall-shelf visual QA. Boardsmith should not make an impossible or incomplete multi-shelf wall shelf look like a polished, complete build packet.

Guardrail behavior now recorded:

- Invalid five-shelf wall shelf generation is blocked when the saved intake says the total project height is `0.1 in`.
- The blocked-generation feedback tells the user that the total project height looks too small and asks for the full top-to-bottom height, such as `60 in`.
- Stale invalid saved plans render as review-needed instead of complete trusted packets.
- Hero visuals and print/detail summaries avoid presenting impossible height as a valid `Height 0.1 in` dimension.
- Connected shelf units now require support/frame review or modeled support/frame placeholder pieces before they can be treated as complete.
- Build Guide wording avoids calling unresolved wall/connected shelf units freestanding unless the model truly supports that.
- Valid five-shelf wall shelf and single wall shelf regressions still pass.

Verification:

- Manual local checks covered the invalid five-shelf connected wall shelf, a valid five-shelf wall shelf with realistic total height, and a single wall shelf on detail and print routes.
- Validation passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- No schema, package, lockfile, migration, hosted Supabase, auth, export, CAD/CNC, or app-generated PDF changes were introduced.

## Wall-Shelf Packet Flow Checkpoint

Date: June 14, 2026

Checked commit: `22a5d32 Polish wall shelf plan packet flow`

Purpose: record the wall-shelf plan-packet flow polish after the guardrail, diagram view model, deterministic renderer, cut diagram view model, cut renderer, build step view model, and deterministic step-card work. Boardsmith detail and print views now read more like a build packet while preserving the planning-aid and browser-print-only boundaries.

Packet flow now centers on:

- `Build Snapshot`
- `Project Visuals`
- `Cut Diagram`
- `Materials and Parts`
- `Build Guide`
- `Check Before Building`
- `Reference Notes`

Checkpoint behavior now recorded:

- Detail and print routes follow the same core packet order: Snapshot -> Visuals -> Cut -> Materials -> Build -> Check -> Reference.
- Generated prose summary moved lower into reference notes so deterministic build-packet sections lead the experience.
- The invalid five-shelf wall shelf with `0.1 in` total height remains review-needed before build steps and does not present a trusted complete packet.
- Valid five-shelf wall shelf and single wall shelf regressions passed after the packet-flow polish.

Verification:

- Validation passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- No schema, package, lockfile, migration, hosted Supabase, PDF, CAD, CNC, export, cut-optimization, or AI-image changes were introduced.

## Wall-Shelf Buying Plan Checkpoint

Date: June 14, 2026

Checked commit: `258e2f5 Add wall shelf buying plan view model`

Purpose: record the first conservative Buying Plan layer for wall shelves. The feature keeps the data path deterministic: Build Model -> Cut View Model -> Buying Plan View Model -> deterministic renderer.

Packet flow now centers on:

- `Build Snapshot`
- `Project Visuals`
- `Cut Checklist`
- `Buying Plan`
- `Materials and Parts`
- `Build Guide`
- `Check Before Building`
- `Reference Notes`

Checkpoint behavior now recorded:

- Detail and print routes follow the updated packet order: Snapshot -> Visuals -> Cut -> Buying Plan -> Materials -> Build -> Check -> Reference.
- Buying Plan appears between `Cut Checklist` and `Materials and Parts` on detail and print pages.
- Buying Plan groups Build Model cut pieces by material so shelf boards can be reviewed as a material-planning aid.
- Stock length remains selection/review language; Boardsmith does not invent an exact stock-board purchase.
- No price, vendor, inventory, CAD, CNC, app-generated PDF, export, cut-optimization, or AI-image behavior was introduced.
- The invalid five-shelf wall shelf with `0.1 in` total height remains review-needed and does not present a trusted complete packet.
- Single shelf and valid five-shelf wall shelf regressions passed.

Verification:

- Browser verification included a disposable local valid five-shelf wall shelf with `60 in` total height.
- Validation passed: `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, and `git diff --check`.
- No schema, package, lockfile, migration, hosted Supabase, pricing, vendor, inventory, PDF, CAD, CNC, export, cut-optimization, or AI-image changes were introduced.

## Recommended Next 3 Tasks

1. Keep using the wall-shelf Buying Plan manually; only expand behavior if stock-length selection or hardware grouping remains repeatedly annoying.
2. Collect repeated generation-quality friction from real supported projects before changing prompts.
3. Rerun hosted smoke after any future deployment, env-var, access-gate, archive, project detail, generation, or `Tweak this plan` change.
