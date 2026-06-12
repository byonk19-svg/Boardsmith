# Boardsmith UI Dogfood Review

Date: June 11, 2026

Scope: visual and flow review after the recent UI polish sequence. This is documentation only. No app behavior, data model, generation flow, auth, export behavior, dependencies, tests, or runtime code changed as part of this review.

Reviewed state:

- `main...origin/main`
- Dashboard and protected app pages reviewed through a temporary local `next start` server on port 3021 with the access gate disabled for that process only.
- Access gate reviewed on the existing local dev server.
- Existing local project data was used. No project create, generate, archive, restore, notes, build-log, or print actions were submitted.

Recent polish reflected in this review:

- Generated detail reading-order polish.
- Intake starter compaction.
- Print sheet readability.
- Browser print action clarity.
- Dashboard and project list polish.

## Overall Read

Boardsmith now reads more like a private woodworking workspace than a raw CRUD list. The dashboard gives a useful first answer to "what should I work on next?", the intake starts manual entry sooner, and the print route clearly says browser print is the supported output path.

The remaining friction is concentrated in the project detail page. Even after the review-before-building summary, the page still mixes shop actions, deterministic review internals, output readiness notes, plan revision, comparison, printable plan content, history, notes, and build log in one long route. That is honest and useful for dogfood, but it is still the place where a private user can feel the most UI weight.

## Screen Notes

### Access Gate

What feels clear:

- The page plainly says this is private MVP access.
- The warning that this is not multi-user authentication is visible before submit.
- The form has one job and the `Continue` action is obvious.

What feels too dense:

- Not dense. This is one of the clearest screens.

Mobile concerns:

- Low risk. The content is short and centered.

Copy issues:

- Copy is honest. No change needed now.

Next-action clarity:

- Clear. Enter password, continue.

Implementation timing:

- Later. No UI implementation needed now.

### Dashboard

What feels clear:

- The top metrics quickly frame the workspace: total projects, generated plans, projects needing plans, and latest update.
- The new work queue makes the next two likely actions clear: open a draft to generate, or open/print a generated plan.
- Recent cards now have useful next-step copy instead of just project metadata.

What feels too dense:

- With real dogfood data, the dashboard is longer than before, but the added queue is useful enough to justify the extra section.
- The starter section is still below the recent list, which is fine for a returning-user dashboard.

Mobile concerns:

- Cards stack cleanly. The page is longer on mobile, but the first viewport should still provide useful state and primary actions.

Copy issues:

- `Ready to review or print` is understandable, but could eventually become `Ready for review` if print starts to feel over-emphasized.

Next-action clarity:

- Strong. `Open to generate`, `Open project`, and `Print build sheet` are concrete.

Implementation timing:

- Later. Dogfood before changing again.

### Project List

What feels clear:

- Summary metrics before filters make the list feel less like a search form and more like a workspace overview.
- Search, workspace, and apply are the only always-visible filter controls.
- Advanced filters are grouped under `More filters`, and they open when advanced filters are active.
- Cards clearly separate plan state, history, notes, record state, and actions.

What feels too dense:

- Real local data produced 26 active projects, so the page is still very long.
- Each card carries several signals plus archive controls. This is useful, but repeated 26 times it becomes a lot to scan.
- Built projects without generated plans can read oddly: `Built` plus `Needs generated plan` may be technically true but cognitively mixed.

Mobile concerns:

- The filter area is much lighter than before, but a long stack of full cards will still require a lot of scrolling.
- The archive form and helper copy on every active card add mobile height.

Copy issues:

- `Needs generated plan` may not be the right next-step label for built records with no plan. Consider treating built records as record-review first.
- `Workspace` is calmer than `Archive`, but users may need one dogfood pass to see if it is obvious enough.

Next-action clarity:

- Good for draft and generated projects.
- Slightly weaker for built/no-plan projects because the displayed state can imply the next action is generation even when review of the build record may be more natural.

Implementation timing:

- Now-ish if one more UI task is desired. This is narrower than a full detail-page redesign and directly visible in the current local data.

### New Project Intake

What feels clear:

- Manual entry starts quickly.
- The collapsed starter chooser preserves examples without letting them dominate the top of the form.
- The form sections are plain and task-oriented: basics, size/material, tools/safety, use/constraints, before saving.

What feels too dense:

- The form is still long, but it is appropriately long for the required intake data.
- Tool checkboxes take meaningful space, but the grouping is understandable.

Mobile concerns:

- The first manual field is reachable much sooner than before.
- Later sections still require sustained scrolling.

Copy issues:

- No urgent copy issue. The safety/context copy is doing real work.

Next-action clarity:

- Clear. Fill intake, save project intake.

Implementation timing:

- Later. Let real manual entry reveal any remaining pain.

### Project Detail With No Plan

What feels clear:

- The top action area and `Recommended next step` make the first generation path obvious.
- The no-plan empty state explains that validated plans are saved only after generation.

What feels too dense:

- The page still shows template guidance, project structure, material summary, future output notes, and record forms before/around the no-plan state.
- For a draft with no generated plan, the internal planning model can feel more prominent than the simple next action.

Mobile concerns:

- Mobile users must pass several review/internal sections before reaching the no-plan explanation and record area.
- The page is understandable, but it is not compact.

Copy issues:

- `Future output notes` appears even when the current MVP output path is browser print only. The guardrail copy is honest, but the concept may distract from "generate first plan."

Next-action clarity:

- Good at the top. Weaker after scrolling into internal sections.

Implementation timing:

- Candidate for next implementation. A no-plan detail compaction pass could be smaller than touching the generated-plan page.

### Project Detail With Generated Plan

What feels clear:

- The `Recommended next step` panel works well, especially for missing cut dimensions.
- `Review before building` gives the right high-level checklist before the long plan content.
- `Review cut list`, `Open questions`, and browser print links are concrete.

What feels too dense:

- This remains the densest screen in the app.
- The page still interleaves user-facing shop work with internal review terms: project structure, deterministic model, plan review, output readiness notes, tweak, comparison, printable plan, history, notes, and build log.
- UI-04C demotes output-readiness details into a secondary disclosure, but the generated detail page remains long.

Mobile concerns:

- The top summary helps, but the full page is a long scroll with many similarly weighted panels.
- Section navigation helps desktop scanning more than mobile scanning.

Copy issues:

- UI-04B normalized the main print action label to `Print build sheet` across project detail and the print route.
- UI-04C renamed the future-output panel to `Output readiness notes` and keeps the browser-print/no-export warning in the summary.

Next-action clarity:

- Strong at the top.
- Weaker in the middle, where internal review panels compete with the build sheet.

Implementation timing:

- High impact. This is the strongest candidate if the next batch is UI implementation.

### Print Preview

What feels clear:

- The top toolbar now clearly says `Print build sheet`.
- `Print build sheet` is an obvious action and the copy says it opens the browser print dialog only.
- The no-PDF/CAD/CNC/export/download message is visible before the sheet.
- The print sheet sequence is practical: snapshot, visuals, checklist, materials, cut checklist, build guide, appendix.

What feels too dense:

- The sheet is intentionally long for generated plans with warnings and missing dimensions.
- The review appendix is still large, but it is properly lower in the sequence.

Mobile concerns:

- On-screen mobile preview will be long, but this route is primarily for print.
- The toolbar stacks and should remain understandable.

Copy issues:

- No urgent issue. The route does what UI-02C intended.

Next-action clarity:

- Clear. Back to project or print build sheet.

Implementation timing:

- Later. Do a physical print check before changing more.

## Top Findings

1. Project detail is now the main density problem.
   The dashboard, intake, and print route are clearer after recent polish. The generated detail route still carries too many equally weighted sections for one continuous page.

2. No-plan detail can be simplified before generated-detail gets another large pass.
   For drafts, the user mostly needs intake review, generate action, and record context. Template guidance and build-model internals currently make the draft state feel more technical than necessary.

3. Project list cards are clearer but still tall at real dogfood volume.
   The metrics and filter grouping help, but 26 active projects means repeated archive controls and record signals create a long page.

4. Print naming has been normalized.
   UI-04B uses `Print build sheet` as the main project-detail and print-route action label while keeping browser-print/no-export explanation copy.

5. Output readiness language is secondary now, but still present.
   UI-04C demotes `Output readiness notes` into a secondary disclosure and keeps the no-export guardrail. The generated page still contains internal review concepts that may need another dogfood pass.

## Recommended Next UI Tasks

1. UI-04: Project detail density and mobile polish.
   Highest impact. Rebalance generated detail so immediate shop-readiness work stays dominant and internal/future-output review panels are visually secondary or tucked lower. Do not change generation, schemas, routes, or export behavior.

2. UI-04A: No-plan project detail compaction.
   Smaller alternative. For projects without generated plans, make the first scan path: intake summary, review triggers, generate action, and project record. Move or visually compress template/build-model/future-output internals.

3. UI-05: Project list high-volume scan polish.
   If project-list dogfood remains annoying, reduce repeated card height for dense local data. Candidate patterns: compact row mode, archive action tucked behind details, or record signals collapsed until needed. Preserve filters and routes.

## UI-04A Follow-Up

The no-plan project detail state now starts with a saved-intake summary after the recommended next step, keeps only `Intake` and `Record` in the no-plan section navigation, shows the no-generated-plan empty state before technical planning details, and moves derived template/structure context into a secondary disclosure.

This resolves the smallest project-detail density issue identified in the dogfood pass. Generated-plan detail density remains the larger follow-up if real use still feels heavy.

## Recommendation

After UI-04A, the next implementation task should only continue into generated-detail density/mobile polish if dogfood still shows the long generated page is slowing review. Shared component cleanup should wait until another pass proves duplication is causing maintenance pain rather than just existing in markup.
