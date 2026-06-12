# Boardsmith UI Polish Checkpoint

Date: June 12, 2026

Scope: end-to-end private MVP UI review after the recent polish sequence. This checkpoint is documentation-only. No app code, tests, schema, routes, OpenAI behavior, auth, export behavior, dependencies, or persisted project data were changed.

Review method:

- Checked the working tree before review: clean at `main...origin/main`.
- Used the existing local app on port 3000 to inspect the private access screen directly.
- Used a temporary local server on port 3021 with `BOARDSMITH_ACCESS_PASSWORD` empty for protected-page visual review only.
- Reviewed existing local/demo project data only.
- Did not submit create, generate, revise, archive, restore, notes, build-log, print-dialog, or settings actions.

## Overall Recommendation

Stop UI polish for now.

The recent sequence has made the main workflow cohesive enough for private MVP use: dashboard/list, intake, no-plan detail, generated detail, and print build sheet all now expose the next action early and explain the browser-print/no-export posture clearly. The remaining roughness is mostly demo-data hygiene, real-print validation, and long-form planning content that should be tested through real use before another UI pass.

Recommended next lane: product readiness/demo validation, not another broad UI implementation task.

## Access Gate

Route reviewed: `/access?returnTo=%2F`

What feels clearer:

- The page plainly says this is private MVP access.
- The temporary nature of the gate is explicit: it is not multi-user authentication.
- The caution about storage setup and sensitive production/customer data is visible before entry.

What still feels dense or confusing:

- Nothing urgent. The form is intentionally sparse and clear.

Mobile concerns:

- The global navigation remains visible above the gate, but the gate content itself is short enough that it should remain manageable.

Fix now or defer:

- Defer. No UI change is needed for the access gate right now.

## Dashboard

Route reviewed: `/`

What feels clearer:

- The page now answers the workspace state quickly: total projects, generated plans, drafts that still need plans, and latest update.
- The two work lanes are obvious: a project that needs generation and a project ready to review or print.
- Primary actions are direct: `New Project`, `View Projects`, `Open to generate`, `Open project`, and `Print build sheet`.

What still feels dense or confusing:

- Local smoke/demo project names and some project-type mismatches still reduce confidence in the sample workspace. For example, a planter-like title can appear with a door-hanger type. This is a data/demo hygiene issue more than a layout issue.

Mobile concerns:

- The dashboard content is longer than a pure landing screen, but it is now structured around state and next action rather than decorative content.

Fix now or defer:

- Defer UI work. Clean or curate demo data only if this workspace will be used for a live walkthrough.

## Project List

Route reviewed: `/projects`

What feels clearer:

- Summary metrics appear before filters and make the list state legible.
- The primary filter row is focused on search/workspace/apply.
- Advanced controls are grouped under `More filters`, which keeps the first scan lighter.
- Cards now expose plan state, history, notes, record state, and state-aware actions.

What still feels dense or confusing:

- With 26 active local projects, the page is naturally long.
- Repeated archive controls and smoke-test titles add visual noise in the current dataset.

Mobile concerns:

- The filter compaction is a real improvement, but long project names and repeated card actions will still make the mobile list feel heavy with this much demo data.

Fix now or defer:

- Defer. Do not add more project-list UI until real dogfood shows whether volume, title hygiene, or action grouping is the actual problem.

## New Project Intake

Route reviewed: `/projects/new`

What feels clearer:

- Manual intake now starts immediately after the page intro and compact starter disclosure.
- The collapsed `Start from an example` section keeps starters available without competing with the first form fields.
- Section copy explains the job of each input group without feeling like a marketing page.

What still feels dense or confusing:

- The form is still long because the project intake itself is substantive: basics, dimensions, material, tools, use, constraints, and safety context.

Mobile concerns:

- The first manual field is reachable much sooner than before. The remaining length is expected for a careful woodworking intake.

Fix now or defer:

- Defer. The next intake improvements should come from real completion friction, not layout speculation.

## No-Plan Project Detail

Route reviewed: `/projects/ad86029c-1218-4c6d-b40a-03947b64a6aa`

What feels clearer:

- The page clearly says there is no generated plan yet.
- `Generate Plan` is the primary action, with intake review positioned before generation.
- Planning internals are secondary in a disclosure instead of competing with the no-plan task.
- Project notes and build log are grouped as a record section below the review path.

What still feels dense or confusing:

- The record section is still form-heavy, but it appears after the no-plan decision path and no longer distracts from first generation.

Mobile concerns:

- The no-plan summary and intake review now appear early enough for a mobile user to understand what to do without scanning the whole record.

Fix now or defer:

- Defer. No-plan detail is in a good private-MVP state.

## Generated Project Detail

Route reviewed: `/projects/c43eb362-190c-42ab-b4f7-c3ee73a93322`

What feels clearer:

- The recommended next step is prominent and specific.
- The generated-plan checklist now gives a practical scan path: cut list, materials, safety notes, open questions, and print.
- `Print build sheet` wording is consistent.
- Output-readiness/export language is demoted and keeps the browser-print/no-export boundary clear.

What still feels dense or confusing:

- This remains the longest app surface because it includes intake, review triggers, template guidance, deterministic structure, cut-list review, plan review, revision, comparison, printable content, history, notes, and build log.
- Some technical labels such as template guidance, output readiness, and deterministic planning model are still visible. They are no longer first-order blockers, but they are still internal-facing.

Mobile concerns:

- The top of the page is now oriented enough for mobile use. The full generated detail page should still be considered a long review document rather than a compact task screen.

Fix now or defer:

- Defer. Do not keep compressing generated detail until repeated real use shows a specific section that should move, collapse, or rename.

## Print Build Sheet

Route reviewed: `/projects/c43eb362-190c-42ab-b4f7-c3ee73a93322/print`

What feels clearer:

- The top toolbar says `Print build sheet`, links back to the project, and explains that the button opens the browser print dialog only.
- The no-PDF/no-CAD/no-CNC/no-export/download boundary is explicit.
- The sheet starts with build snapshot, visuals, check-before-building, materials, cut checklist, build guide, and then review appendix.

What still feels dense or confusing:

- Complex generated plans will still produce long print sheets.
- Some reviewed sample data has placeholder/missing dimensions, but the sheet calls that out instead of hiding it.

Mobile concerns:

- Print preview is primarily a browser-print workflow. Mobile review is useful, but the main readiness check should be real browser print preview and paper/PDF destination inspection.

Fix now or defer:

- Defer UI work. A future readiness pass should validate physical/browser print pagination with representative generated plans.

## Top Findings

1. The main UI sequence now has a coherent next-action path from dashboard to intake, detail, generated review, and print build sheet.
2. The strongest remaining friction is not UI polish; it is local/demo data quality and real-output validation.
3. Generated detail is still long, but the top-level reading order is now good enough to stop broad density work.
4. The print workflow is clear about browser print and no export/download behavior.
5. More UI work should wait for repeated dogfood friction rather than continuing speculative compaction.

## Recommended Next Work

1. Stop UI polish for now and move to product readiness/demo validation.
2. If a live walkthrough is planned, clean or curate local demo project data so titles, project types, and plan states tell a trustworthy story.
3. Run a focused browser-print readiness check with representative generated plans, including page breaks and printer/PDF destination preview, without adding app-generated export behavior.

