# Real Project Dogfood Findings

## Date Of Pass

June 10, 2026

## Scope

This pass used the private hosted app through the existing protected hosted smoke path after authenticated route smoke, hosted `Tweak this plan` active-flow smoke, archived revision-blocking smoke, and project-detail navigation smoke had already passed.

The sweep reused clearly labeled non-critical hosted smoke/dogfood projects. No new project records, revisions, archive/restore actions, generated plans, schema changes, migrations, packages, exports, screenshots, or runtime artifacts were created by this pass.

No hosted URL, project ID, project title, row data, cookie, request header, session-file content, screenshot, or sensitive log is recorded in this document.

## Coverage

- Hosted route smoke: passed before the dogfood sweep.
- Project list: loaded through the protected hosted path.
- Project mix: representative non-critical hosted records covered plant-riser/shelf, simple shelf, wood sign, book ledge, and outdoor planter-style projects.
- No-plan project: covered.
- Generated-plan project: covered.
- Revised-plan project using the existing one-shot `Tweak this plan` flow: covered by an existing revised hosted record.
- Notes/build-log usage: covered by an existing project record with saved private record content.
- Browser print preview: opened for a generated-plan project and rendered expected shop-plan sections.
- Archived project state: covered as a control case; archived detail stayed viewable and did not expose a revision form.

## What Worked

- The project list can now support a crowded dogfood workspace: Active/Archived/All, plan state, and record state make it practical to find the right project state without hiding active projects unexpectedly.
- The project detail `Project sections` nav gives a useful map of a long generated-plan page. It makes Project intake, Project structure, Plan Review, Tweak this plan, Plan comparison, Printable Plan Sheet, Plan history, and Project record easier to reach.
- The `Project actions` panel keeps the main actions in one place. Generate Plan, Duplicate project, Browser print preview, Archive/Restore, and Back to projects read as workspace actions rather than scattered links.
- No-plan projects stay understandable. They still show intake, structure, project record, and generate-plan affordances, while omitting absent plan-only navigation and print-preview actions.
- Generated-plan projects are easier to scan than earlier versions of the app. Plan Review, action checklist, visual planning aids, build step cards, plan history, and browser print preview all feel reachable from the detail page.
- Revised-plan projects preserve the core product loop: the revised plan is visible as the latest version, the previous plan remains in history, and the revised marker helps separate revision history from ordinary generations.
- Print preview remains the strongest build-facing surface. Build Snapshot, Project Visuals, Check Before Building, Materials and Parts, Cut Checklist, Build Guide, and Review Appendix give the plan a clearer shop-plan flow.
- Project notes and build log fields are useful as private project memory. The copy correctly frames them as records, not certification or plan approval.

## Confusing Or Rough Edges

- Generated-plan detail pages are necessarily long. The jump nav helps, but it does not show the user's current section or stay visible while scrolling. That is a possible future navigation polish item, not a blocker.
- On a project that already has a generated plan, `Generate Plan` can still read like it might replace the current plan. Existing behavior preserves history, but future copy could make "creates another version" clearer in the actions panel.
- `Tweak this plan` is the right first revision shape, but users may expect a chat-like follow-up loop once they see plain-English revision input. The current one-shot model should remain intentional until repeated dogfood shows a real need.
- Project record is useful, but notes and build-log content sit lower on a long detail page. The nav makes it reachable; further work should avoid turning it into a larger project-management system.
- Print preview is clear, but it remains browser-rendered only. Users may ask for PDF/export after seeing the shop-plan layout; that should stay out of scope until explicitly approved.

## Copy Or Navigation Follow-Ups To Consider

- Consider changing the generated-plan action copy from `Generate Plan` to something like `Generate another plan version` when a latest plan already exists.
- Consider a small current-section or sticky behavior for the no-print project-section nav only if manual use shows users still lose their place.
- Consider adding one sentence near `Tweak this plan` that reinforces it is a one-shot revision, not a chat thread, if users try to use it conversationally.
- Consider making the Project record jump label slightly more descriptive only if users miss notes/build-log fields during manual use.

## Do Not Build Yet

- Do not add app-generated PDF, SVG, DXF, CAD, CNC, or fabrication-ready export work from this dogfood pass.
- Do not add image upload, public sharing, marketplace, shopping, pricing, vendor, purchasing, or inventory behavior.
- Do not add multi-turn AI chat, background agents, new project types, bulk archive, permanent delete, folders, tags, or production multi-user/auth expansion without a separate explicit task.
- Do not weaken the planning-aid, manual-review, no-approval, no-load-rating, no-wall-safety-guarantee, and no-child-safety-certification guardrails.

## Result

No small app defect was found that justified product code changes in this task. The right outcome is to keep using Boardsmith manually and select a narrow follow-up only from a repeated dogfood pain point.

