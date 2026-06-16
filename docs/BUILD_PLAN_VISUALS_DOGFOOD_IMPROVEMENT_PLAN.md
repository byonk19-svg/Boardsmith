# Plan: Build Plan And Visual Packet Dogfood Improvements

**Generated**: 2026-06-15
**Estimated Complexity**: Medium-high
**Source**: Manual dogfood screenshots for `Single bathroom shelf` across project detail, generated plan detail, and browser print build sheet.

## Implementation Status

Implemented in Task 90H on 2026-06-15.

Covered fixes:

- Wall-shelf intent is now shared across safety review, clarification gating, build-model drafting, AI prompt context, and printable manifests.
- Missing wall-shelf mounting details now mean `mounting/support method unresolved`, not `freestanding` or `non-mounted`, unless the intake explicitly describes a non-mounted riser/tabletop/display-board use.
- Pre-generation readiness now asks for support method, wall/fastener context, expected use/load, and bathroom/humidity finish context before a full plan is considered ready.
- Single-shelf print snapshot facts omit `Total project height` and show width, depth, and board thickness instead.
- Cut checklist counters distinguish dimension review from plan-level warnings.
- Buying Plan and material summaries avoid duplicate finish/material interpretation and use single-shelf-specific missing-detail language.
- Build Guide tools are operation-specific, and compact readiness cards preserve mounting, buying-plan, and support/frame actions.
- Single-shelf mini diagrams use single-board variants for cut, layout, and support review phases.
- The wall-shelf side-view thickness label is shortened to reduce overlap risk.
- Regression tests protect explicit freestanding shelf-like risers from wall-mounting hardware and review flags.

## Overview

The current wall-shelf packet is usable and cautious, but the dogfood screenshots show several semantic and visual mismatches that make the generated build plan feel less trustworthy than it should:

- A project titled and typed as a wall shelf can still read as `non-mounted` or `freestanding` in some generated/reference copy when mounting details are missing.
- The pre-generation readiness surface can say `Ready for full plan` even though the generated packet immediately needs mounting/support/load/humidity review.
- Cut review status says `NEEDS REVIEW` in one place and `Needs review 0` in another, which reads contradictory.
- Build-step mini diagrams are deterministic but still too generic; some single-shelf steps visually resemble connected-unit placeholders.
- Per-step tools repeat all available tools instead of only the tools relevant to that operation.
- Materials and Buying Plan rows duplicate material concepts and use broad `support/frame gaps` language for a single shelf.
- The print snapshot labels a single shelf board thickness as `Total project height`, which is technically explainable but visually odd.

The fix should not add new product surface area. It should tighten existing deterministic view models, renderers, and tests so the app better helps the user understand what information is missing before trusting a plan.

## Non-Goals

- No migrations.
- No new packages.
- No auth, sharing, uploads, payments, public pages, marketplace behavior, CAD, FreeCAD, CNC, DXF, SVG download, app-generated PDF, image generation, pricing, vendor lookup, or shopping cart.
- No load rating, structural approval, safety guarantee, child-safety claim, or professional certification.
- No freeform AI image generation for build diagrams.
- Do not make the build visuals look fabrication-ready; keep planning-aid and not-to-scale language.

## Screenshot Audit

### What Is Working

- The project detail page has a coherent private-MVP shape: project actions, readiness, no-plan state, intake, review triggers, notes, and build log.
- The generated plan detail page is readable and ordered well: readiness, hero visual, diagrams, cut checklist, buying plan, materials, build guide, check-before-building, reference notes.
- The browser print route is useful and avoids unsupported export claims.
- The hero visual is understandable and no longer has the obvious label overlap from the prior fix.
- The main diagram packet is substantially more useful than prose-only output: exploded view, front elevation, top footprint, side view, cut parts, and mounting review.
- Buying Plan correctly refuses to choose vendor, price, exact stock board, or optimized cut layout.
- Check Before Building is strong and safety-bounded.

### Critical Confusions

1. **Wall shelf vs non-mounted semantics**
   - Screenshots show a wall shelf that is visually and verbally treated as wall-mounted in many places.
   - Other places say or imply `freestanding`, `non-mounted`, `if mounting is considered in the future`, or `no wall support modeled`.
   - For a wall shelf, missing support details should mean `mounting method unresolved`, not `non-mounted`.

2. **Generation readiness is too permissive for wall shelves**
   - Pre-generation screenshots say `Ready for full plan`.
   - The generated packet then immediately asks for support method, studs/anchors, expected load, and bathroom finish/hardware review.
   - This is exactly the kind of missing information the app should surface before generation.

3. **Single shelf height label reads wrong**
   - The print snapshot shows `Total project height 0.75 in`.
   - For a single shelf, that value is board thickness, not a meaningful total project height.
   - This should read as `Board thickness` only, or `Shelf board thickness`, while total height should be omitted or marked `Not applicable for single shelf`.

4. **Cut review counts conflict with warnings**
   - Cut Checklist says `NEEDS REVIEW`.
   - Cut List Review says `NEEDS REVIEW 0` or `Ready to review`.
   - The likely cause is that the view model counts dimension-defective pieces separately from plan-level cut warnings. That distinction is valid internally but confusing externally.

5. **Step mini diagrams are too generic**
   - Step 1, Step 3, and Step 5 visuals sometimes show two dashed horizontal lines or support-frame-like shapes even for a single board shelf.
   - This makes the user wonder whether the plan thinks there are two boards, a connected unit, or placeholders.
   - The mini diagrams need phase-specific single-shelf variants.

6. **Per-step tools are noisy**
   - Several steps show `Tape measure, Pencil, Clamps, Drill, Jigsaw, Circular saw, Miter saw, Sander, Paint brush`.
   - That looks like the user-selected available tool inventory, not the step’s required tools.
   - Step-level tools should be operation-specific; fallback to all available tools should be avoided or explicitly labeled as `Available tools to choose from`.

7. **Buying/material language is too broad for single shelf**
   - `support/frame gaps` sounds like connected-unit language.
   - For a single shelf, the missing detail is mounting hardware/support method, wall type, fasteners, expected load, and stock board length.

8. **Materials duplicate the same board**
   - Materials and Parts can show `3/4 pine board` as a primary material and again as a board quantity row.
   - This is not wrong, but the visual hierarchy makes it feel like duplicate shopping items.

9. **Review notes are still slightly repetitive**
   - Reference Review Notes repeat wall/load disclaimers in several nearby forms.
   - The safety posture is right, but the print sheet would be stronger if review notes were grouped by practical action.

## Success Criteria

- A single wall shelf with missing mounting details never appears as `freestanding` or `non-mounted`.
- Pre-generation readiness asks concrete questions for missing wall-shelf mounting/support/load/finish information when the project text implies wall mounting.
- Single-shelf print snapshot does not show `Total project height 0.75 in`.
- Cut Checklist and Cut List Review use aligned public semantics for review counts and plan-level warnings.
- Build-step mini diagrams clearly show one shelf board for single-shelf projects.
- Build-step tools are step-relevant, not the whole available-tool inventory.
- Buying Plan copy distinguishes single-shelf mounting review from connected-unit support/frame review.
- Materials and Parts reads as a gathering checklist, not duplicate shopping rows.
- Browser print remains the supported output path and still contains all safety disclaimers.
- Full verification passes: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.

## Sprint 1: Wall-Shelf Missing-Information Semantics

**Goal**: Make the app consistently treat a wall shelf with missing mounting details as `mounting method unresolved`, not `non-mounted`.

**Demo/Validation**:
- Create or reuse a single bathroom wall shelf with dimensions and board thickness but no explicit bracket/cleat/anchor/stud details.
- Confirm readiness asks for missing mounting/support/load details before generation, or at minimum flags them as required review.
- Generate a plan and confirm no user-facing packet copy says `freestanding` or `non-mounted`.

### Task 1.1: Define Wall-Shelf Mounting Intent Helper

- **Location**:
  - `lib/projects/clarification-gate.ts`
  - `lib/build-model/create-build-model-draft.ts`
  - possibly new helper in `lib/projects/shelf-layout-intent.ts` or `lib/projects/wall-shelf-intent.ts`
- **Description**:
  - Extract a shared deterministic helper for wall-shelf mounting intent.
  - It should distinguish:
    - explicitly wall-mounted
    - implicitly wall-mounted because project type/text/title says wall shelf, bathroom shelf on wall, mounted, hang, bracket, stud, anchor, cleat
    - explicitly not wall-mounted
    - unknown
  - For `simple_shelf`, project type/title text like `wall shelf` should not be treated as non-mounted just because hardware is missing.
- **Acceptance Criteria**:
  - Helper has focused tests for:
    - `Single bathroom shelf` plus project type `simple_shelf`
    - `Wall shelf`
    - `freestanding riser`
    - `not wall mounted`
    - `shelf board for desktop`
  - The helper does not over-trigger wall mounting for explicit risers or tabletop stands.
- **Validation**:
  - Add/adjust tests in `tests/clarification-gate.test.ts`.
  - Add/adjust tests in `tests/create-build-model-draft.test.ts`.

### Task 1.2: Tighten Clarification Gate For Wall Shelves

- **Location**:
  - `lib/projects/clarification-gate.ts`
  - `app/projects/[id]/WallShelfPlanReadiness.tsx` only if copy needs rendering support
- **Description**:
  - If wall mounting is implied and support method is missing, ask `mounting_support_method`.
  - Add separate concrete questions where data is not present:
    - mounting/support method: bracket, cleat, side support, frame, or other
    - wall type/stud/anchor plan
    - expected load/use
    - finish/humidity context for bathroom/damp use
  - Do not require exact engineering details; require enough review context to prevent the app from sounding complete.
- **Acceptance Criteria**:
  - The single bathroom shelf from screenshots is not silently `Ready for full plan` when mounting/support details are absent.
  - If the user already supplied `metal brackets screwed into studs` and light use, the gate can still be ready while preserving review warnings.
  - Required questions include practical reasons.
- **Validation**:
  - `tests/clarification-gate.test.ts` covers missing and supplied mounting details.
  - Existing ready path for fully specified wall shelves remains green.

### Task 1.3: Remove Stale Non-Mounted Copy For Wall-Shelf Packets

- **Location**:
  - `lib/build-model/create-build-model-draft.ts`
  - `lib/plans/printable-plan-manifest.ts`
  - `lib/plans/material-summary.ts`
  - `lib/ai/generate-project-plan.ts`
- **Description**:
  - Change assumptions and prompt guidance so wall-shelf projects with missing mounting details say:
    - `Mounting/support method is unresolved and must be reviewed before installation.`
  - Only use `freestanding` or `non-mounted` when the intake explicitly says the project is not wall-mounted.
  - Update stale-copy filters so they apply to single wall shelves as well as connected shelf support placeholders.
- **Acceptance Criteria**:
  - No generated detail or print sheet surface for a wall shelf contains `freestanding` or `non-mounted` unless explicitly requested by intake.
  - Lamp risers/tabletop shelves can still say non-mounted when truly non-mounted.
- **Validation**:
  - Extend `tests/print-preview-page.test.ts`.
  - Extend `tests/material-summary.test.ts`.
  - Extend `tests/generate-project-plan.test.ts` for prompt context.

## Sprint 2: Snapshot, Review Counts, And Buying Plan Semantics

**Goal**: Align the user-facing review states with what the packet actually needs.

**Demo/Validation**:
- Print the single bathroom shelf and inspect Build Snapshot, Cut Checklist, Buying Plan, Materials and Parts, and Check Before Building.
- The page should read like one coherent review flow instead of multiple independent subsystems.

### Task 2.1: Fix Single-Shelf Dimension Facts

- **Location**:
  - `lib/plans/printable-plan-manifest.ts`
  - detail page equivalent if it uses separate dimension facts
- **Description**:
  - For `simple_shelf` with `shelf_layout === "single_shelf"`:
    - show `Shelf width`
    - show `Shelf depth from wall`
    - show `Board thickness`
    - omit `Total project height`, or show `Shelf board thickness` instead
  - For `multiple_separate_shelves`, avoid showing total height unless it is actually meaningful.
  - For `multi_shelf_unit`, keep `Total project height`.
- **Acceptance Criteria**:
  - Single shelf print snapshot does not contain `Total project height 0.75 in`.
  - Connected shelf unit still shows total height and blocks impossible total height.
- **Validation**:
  - Update `tests/print-preview-page.test.ts`.
  - Update any failing snapshot/string tests.

### Task 2.2: Align Cut Review Counts With Public Warnings

- **Location**:
  - `lib/plans/wall-shelf-cut-diagram-view-model.ts`
  - `lib/plans/cut-list-review.ts`
  - `app/projects/[id]/WallShelfCutDiagram.tsx`
  - `app/projects/[id]/print/page.tsx`
- **Description**:
  - Keep internal distinction between:
    - dimension-defective pieces
    - plan-level cut warnings
    - material/finish warnings
  - Change public labels so they do not contradict:
    - `Pieces needing dimension review`
    - `Plan warnings`
    - `Cut layout status`
  - If the cut diagram is `NEEDS REVIEW` because of warnings but every piece has dimensions, the facts should say `Pieces needing dimension review: 0` and `Plan warnings: 1`, not generic `Needs review 0`.
- **Acceptance Criteria**:
  - The Cut Checklist warning and count facts make sense together.
  - A pure dimension-missing case still clearly blocks cutting.
- **Validation**:
  - Update `tests/cut-list-review.test.ts`.
  - Update `tests/wall-shelf-cut-diagram-view-model.test.ts`.
  - Update print route assertions.

### Task 2.3: Make Buying Plan Copy Layout-Specific

- **Location**:
  - `lib/plans/wall-shelf-stock-board-view-model.ts`
  - `app/projects/[id]/WallShelfBuyingPlan.tsx`
- **Description**:
  - Replace broad `support/frame gaps` fallback copy with layout-aware copy:
    - single shelf: `Review mounting hardware/support method, dimensions, finish, and stock length before purchasing.`
    - multiple separate shelves: `Review per-shelf mounting hardware, bracket count, dimensions, finish, and stock length before purchasing.`
    - connected unit: `Review support/frame design, dimensions, finish, and stock length before purchasing.`
  - Keep stock length as review-only.
- **Acceptance Criteria**:
  - The single shelf no longer uses connected-unit support/frame language.
  - Connected shelf units still use support/frame language.
  - No vendor, price, store board, shopping cart, or optimizer language is introduced.
- **Validation**:
  - Update `tests/wall-shelf-stock-board-view-model.test.ts`.
  - Update `tests/print-preview-page.test.ts`.

### Task 2.4: Reduce Material Duplication In Print

- **Location**:
  - `app/projects/[id]/print/page.tsx`
  - `lib/plans/material-summary.ts`
- **Description**:
  - In `Materials and Parts`, group primary material and quantity note into one human row where possible:
    - `3/4 pine board`
    - detail: `1 board / 1 planned shelf board`
    - note: `Review finish and hardware for bathroom humidity before building.`
  - Keep `Pieces to cut` separate, but avoid making the same board look like two separate material shopping requirements.
- **Acceptance Criteria**:
  - Single shelf print sheet has one clear board material row plus one clear piece-to-cut row.
  - Hardware/fastener/finish rows remain separate.
- **Validation**:
  - Update `tests/material-summary.test.ts`.
  - Update `tests/print-preview-page.test.ts`.

## Sprint 3: Build-Step Tools And Mini Diagrams

**Goal**: Make the Build Guide feel project-specific and visually honest.

**Demo/Validation**:
- Print and detail views for the single bathroom shelf show step-specific tools and mini diagrams that read as one shelf board plus wall/mounting review.

### Task 3.1: Stop Falling Back To All Tools Per Step

- **Location**:
  - `lib/plans/wall-shelf-build-step-view-model.ts`
  - `lib/build-model/create-build-model-draft.ts`
- **Description**:
  - Assign operation-specific tools in the build model draft:
    - review dimensions/support: tape measure, pencil, stud finder if available, drill only if drilling is actually in scope
    - cut shelf board: measuring/marking plus one selected cutting tool or `cutting tool to review`
    - dry fit: tape measure, pencil, clamps if available
    - sand/prep: sander/sandpaper
    - finish: paint brush/finish applicator
    - mounting review: tape measure, pencil, drill, stud finder if available
  - If operation tools are missing, show `Tools to confirm` rather than the entire inventory.
- **Acceptance Criteria**:
  - Build steps do not repeat jigsaw/circular saw/miter saw/sander/paint brush on every step.
  - Existing plan schema remains unchanged.
  - The app still renders something useful when no tools are supplied.
- **Validation**:
  - Update `tests/wall-shelf-build-step-view-model.test.ts`.
  - Update print route assertions that currently expect generic tool lists.

### Task 3.2: Add Step Mini Diagram Variants By Layout And Phase

- **Location**:
  - `app/projects/[id]/BuildStepCards.tsx`
  - `lib/plans/wall-shelf-build-step-view-model.ts` if the renderer needs an explicit diagram intent field
- **Description**:
  - Replace heuristic `stepDiagramPhase` rendering with explicit mini-diagram intent where practical.
  - Minimum variants:
    - `single_shelf_review`: one board, wall plane, review badge
    - `single_shelf_cut`: one board with one dimension line, no fake segmentation unless cut count > 1
    - `single_shelf_dry_fit`: one board near wall plane, dashed placement line
    - `single_shelf_mounting_review`: one board, wall plane, bracket/cleat placeholders, question marker
    - `single_shelf_finish`: one board with finish strokes
    - `connected_unit_support_review`: side supports/frame placeholder, multiple shelf boards, review badge
  - Keep visible labels short; aria labels can stay more descriptive.
- **Acceptance Criteria**:
  - Single shelf Build Guide mini diagrams never show two shelf boards unless the project has multiple shelves.
  - Mounting-review mini diagram visually communicates missing support method, not a connected frame.
  - Connected shelf mini diagrams still show support/frame review.
- **Validation**:
  - Update `tests/build-step-cards.test.ts`.
  - Add rendered markup checks in `tests/project-detail-build-model.test.ts` or `tests/print-preview-page.test.ts`.
  - Use browser screenshots after implementation for desktop and mobile.

### Task 3.3: Improve Side-View Label Fit

- **Location**:
  - `app/projects/[id]/WallShelfDiagrams.tsx`
  - `app/projects/[id]/diagram-primitives.tsx`
- **Description**:
  - The side-view vertical `Material thickness 0.75 in` label is close to the dimension marker.
  - Move it farther right, shorten to `Thickness 0.75 in`, or use a horizontal callout for compact widths.
- **Acceptance Criteria**:
  - Side view remains readable in detail and print.
  - No SVG text overlaps dimension markers at desktop or mobile widths.
- **Validation**:
  - Extend existing diagram render/layout checks if present.
  - Browser screenshot check for `/projects/:id` and `/projects/:id/print`.

## Sprint 4: Plan Readiness And Reference Notes Polish

**Goal**: Make the final packet feel like a practical review checklist, not repeated warnings from separate systems.

**Demo/Validation**:
- The print sheet should answer: what can I cut, what must I decide before mounting, what should I buy, and what must I review before use.

### Task 4.1: Reorder Readiness Actions By Actual User Sequence

- **Location**:
  - `lib/plans/wall-shelf-plan-readiness-view-model.ts`
  - `app/projects/[id]/WallShelfPlanReadiness.tsx`
- **Description**:
  - For single wall shelves, preferred order:
    1. Mounting/support method unresolved
    2. Expected load/use review
    3. Stock board length selection
    4. Finish/humidity review
    5. Safety review still applies
  - For connected units, support/frame review remains ahead of stock board selection.
- **Acceptance Criteria**:
  - Check Before Building leads with the most safety-relevant unresolved decision.
  - Buying Plan review remains present but secondary to mounting when wall mounting is missing.
- **Validation**:
  - Update `tests/wall-shelf-plan-readiness-view-model.test.ts`.

### Task 4.2: Group Reference Review Notes Into Practical Buckets

- **Location**:
  - `app/projects/[id]/print/page.tsx`
  - `lib/plans/printable-plan-manifest.ts`
- **Description**:
  - Keep the appendix compact.
  - Group notes under:
    - `Mounting/support decisions`
    - `Finish/humidity decisions`
    - `Load/use decisions`
    - `Planning-aid reminder`
  - Deduplicate near-equivalent disclaimers.
- **Acceptance Criteria**:
  - Reference Review Notes no longer repeat `Boardsmith cannot verify...` in multiple adjacent lines unless each line adds a distinct action.
  - Open questions remain visible.
- **Validation**:
  - Update `tests/print-preview-page.test.ts`.

### Task 4.3: Improve Pre-Generation Detail Page Next Step Copy

- **Location**:
  - `app/projects/[id]/page.tsx`
  - `app/projects/[id]/WallShelfPlanReadiness.tsx`
  - `lib/projects/clarification-gate.ts`
- **Description**:
  - When a project is supported but has required wall-shelf details missing, say:
    - `Answer missing mounting questions before generating a full plan`
  - When it can generate with review warnings, say:
    - `Generate a review-first plan`
  - Avoid implying complete readiness when the first generated packet will be blocked by review.
- **Acceptance Criteria**:
  - The first screenshot state would no longer invite immediate generation as the only obvious next action if support method is missing.
- **Validation**:
  - Update `tests/project-detail-build-model.test.ts`.
  - Update `tests/project-detail-errors.test.ts` only if state behavior changes.

## Sprint 5: Visual Quality Pass

**Goal**: Make the packet visuals feel intentionally designed while staying deterministic and safety-bounded.

**Demo/Validation**:
- Desktop and mobile screenshots should show readable, non-overlapping diagrams.
- Print route should be compact enough to be useful on paper.

### Task 5.1: Create A Screenshot Fixture Matrix

- **Location**:
  - `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`
  - `docs/CODEX_TASKS.md`
  - possibly `scripts/hosted-smoke-check.mjs` if lightweight screenshots already exist there
- **Description**:
  - Define the manual/automated scenarios:
    - single bathroom wall shelf with missing mounting method
    - single bathroom wall shelf with brackets/studs/light-use supplied
    - five separate bathroom wall shelves
    - five-shelf connected unit with invalid total height
    - five-shelf connected unit with valid height but missing support/frame
  - For each, capture:
    - project detail before generation
    - generated plan detail
    - print route
    - mobile viewport for hero and diagrams
- **Acceptance Criteria**:
  - There is a repeatable list of screenshots to compare before commit.
- **Validation**:
  - Manual browser screenshots or existing browser automation.

### Task 5.2: Add Browser Layout Assertions For Diagram Text Bounds

- **Location**:
  - existing browser verification script if available
  - otherwise add focused test helper under `tests/` or script under `scripts/`
- **Description**:
  - Check key SVGs for text outside viewBox and obvious overlaps where feasible.
  - Keep this lightweight; do not introduce visual snapshot dependencies or packages.
- **Acceptance Criteria**:
  - Hero visual, WallShelfDiagrams, Cut Diagram, Buying Plan graphic, and BuildStepMiniDiagram pass bounds checks for single shelf and connected shelf cases.
- **Validation**:
  - Run as part of targeted local verification before full test stack.

### Task 5.3: Tune Print Density

- **Location**:
  - `app/projects/[id]/print/page.tsx`
  - `app/projects/[id]/BuildStepCards.tsx`
  - `app/projects/[id]/WallShelfDiagrams.tsx`
  - `app/globals.css` only if print CSS needs a tiny adjustment
- **Description**:
  - Keep each major section useful on paper.
  - Avoid giant repeated warning cards.
  - Preserve `break-inside-avoid` for diagrams and build steps.
  - Do not nest cards inside cards beyond existing repeated item/card surfaces.
- **Acceptance Criteria**:
  - Print route first page contains snapshot and hero cleanly.
  - Diagrams do not split awkwardly.
  - Build steps remain readable but not overly repetitive.
- **Validation**:
  - Browser print preview visual check.
  - `npm run build`.

## Sprint 6: Documentation And Closeout

**Goal**: Record the dogfood-driven decision and ship a verified, bounded change.

**Demo/Validation**:
- Docs explain why the changes happened and what was intentionally deferred.

### Task 6.1: Update Dogfood Findings

- **Location**:
  - `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`
  - `docs/CODEX_TASKS.md`
- **Description**:
  - Add a dogfood entry for single bathroom shelf screenshots.
  - Record fixed frictions:
    - wall-mounted missing info semantics
    - single-shelf height label
    - cut review count naming
    - step-specific tools
    - mini diagram layout variants
  - Record intentionally deferred items:
    - exact stock-board optimizer
    - vendor/pricing
    - PDF/CAD/CNC/downloads
    - structural/load certification
- **Acceptance Criteria**:
  - Docs remain short and task-led, not a broad roadmap.
- **Validation**:
  - `git diff --check`.

### Task 6.2: Full Verification And Commit

- **Location**:
  - repo root
- **Description**:
  - Run the required stack:
    - `npm test`
    - `npm run lint`
    - `npm run typecheck`
    - `npm run build`
    - `git diff --check`
  - Inspect `git status -sb`.
  - Keep `output/` and transient `next-env.d.ts` drift out of the commit unless intentionally changed.
- **Acceptance Criteria**:
  - Only intentional source, tests, and docs are committed.
  - No disposable verification artifacts are staged.
- **Validation**:
  - Clean status after commit/push if requested.

## Suggested Implementation Order

1. Sprint 1 first. The wall-mounted semantic mismatch is the root cause and affects readiness, generated copy, materials, build guide, and print.
2. Sprint 2 next. It clears visible contradictions in the print packet.
3. Sprint 3 next. It directly improves the build plan and images generated.
4. Sprint 4 after that. It improves comprehension without changing data contracts much.
5. Sprint 5 once semantics are stable. Visual polish should not happen before the source-of-truth states are fixed.
6. Sprint 6 at the end.

## Testing Strategy

- **Unit/view-model tests**
  - `tests/clarification-gate.test.ts`
  - `tests/create-build-model-draft.test.ts`
  - `tests/wall-shelf-plan-readiness-view-model.test.ts`
  - `tests/wall-shelf-diagram-view-model.test.ts`
  - `tests/wall-shelf-build-step-view-model.test.ts`
  - `tests/wall-shelf-cut-diagram-view-model.test.ts`
  - `tests/wall-shelf-stock-board-view-model.test.ts`
  - `tests/material-summary.test.ts`

- **Rendered route/component tests**
  - `tests/print-preview-page.test.ts`
  - `tests/project-detail-build-model.test.ts`
  - `tests/build-step-cards.test.ts`
  - `tests/wall-shelf-diagrams-render.test.ts`

- **Manual browser checks**
  - Detail route before generation.
  - Detail route after generation.
  - Print route.
  - Desktop width.
  - Mobile width.
  - Single shelf, multiple separate shelves, connected unit.

- **Required final verification**
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `git diff --check`

## Potential Risks And Gotchas

- Tightening the clarification gate may make some existing projects no longer appear immediately ready. That is acceptable if the questions are concrete and safety-relevant.
- The app must still support explicit non-mounted shelf-like projects such as risers, tabletop shelves, or display boards.
- Existing tests may encode old copy like `Total project height`; update tests only where the new copy is more truthful.
- Removing repeated warnings can accidentally hide safety notes. Deduplicate only near-equivalent notes; preserve distinct actions.
- Step-specific tools may be hard to infer when users select several saw types. Use cautious `cutting tool to review` language instead of choosing a specific saw unless the operation already has one.
- Mini diagrams must remain schematic and not-to-scale. Better visuals should not imply CAD, engineering, or fabrication readiness.

## Rollback Plan

Each sprint should be independently committable. If a later visual/render change causes regressions:

1. Keep Sprint 1 semantic fixes.
2. Revert only the failing renderer or copy change.
3. Preserve tests that protect against stale `freestanding` / `non-mounted` wall-shelf copy.
4. Re-run the full verification stack before shipping.
