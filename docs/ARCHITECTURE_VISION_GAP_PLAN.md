# Plan: Architecture And Vision Gap Closure

**Generated**: June 19, 2026
**Estimated Complexity**: High
**Status**: Historical implementation plan. Several original gaps listed below have since been closed; use `docs/ARCHITECTURE.md`, `docs/VISION.md`, and current tests as the source of truth for live architecture. Remaining work should be interpreted from the implementation status sections, not from the original overview bullets.

## Overview

This plan closes the main gaps between the current Boardsmith implementation and `docs/ARCHITECTURE.md` / `docs/VISION.md` without expanding into public-product, auth, export, image-upload, marketplace, or CAD scope.

The current app is already close to the documented private-MVP architecture: structured intake, deterministic safety flags, Build Model draft generation, OpenAI structured plan output, Zod validation, generated-plan history, archive/restore lifecycle, and browser print are present. The largest remaining gaps are now product-depth gaps:

- Natural-language intake is now a first-class drafting flow for supported/concept/unsupported/blocked draft states.
- Safe explicit width, depth, material, material-thickness, shelf-layout, shelf-count, and shelf-spacing revisions now update structured intake before regeneration; height, support/mounting, cut-list, ambiguous, and safety-sensitive changes remain manual or blocked.
- The rich plan-packet pipeline is strongest for wall shelves and not yet broadly proven across other supported templates.
- Unsupported woodworking-adjacent drafts can produce bounded concept guidance before save; saved project setup still requires a supported project type.
- The visual plan packet still needs stronger model-driven consistency before it reaches the long-term vision.

The implementation strategy is:

1. Keep wall shelves as the golden template and finish the full deterministic packet loop there.
2. Add structured change planning so revisions do not silently remain prose-only full regenerations.
3. Add natural-language intake as a field-drafting layer that feeds the existing structured form and clarification gate.
4. Copy the proven packet pattern to one next low-risk template.
5. Add concept-only handling for ambiguous and unsupported ideas without generating full build packets.

## Guardrails

- Do not add app-generated PDF, SVG download, DXF, CAD, CNC, FreeCAD, image upload, public sharing, auth, subscriptions, payments, marketplace, pricing, vendors, cart, inventory, or new external services.
- Do not introduce migrations or packages without explicit approval.
- Keep every generated or rendered output framed as a planning aid.
- Preserve browser print as the only output path.
- Keep AI prose explanatory. Dimensions, cut lists, material math, diagrams, safety gates, and packet readiness must come from structured intake, Build Model data, deterministic view models, and schema-validated generated plans.
- Continue using TypeScript, Zod, deterministic tests, and local component patterns.
- Before code implementation in this Next.js version, read the relevant `node_modules/next/dist/docs/` guide for any touched route/API pattern.

## Definition Of Done

The gap plan is complete when:

- A wall-shelf plan packet consistently uses the same deterministic part labels across hero visual, dimensioned views, exploded/assembly view, cut diagram, buying plan, materials/parts, build steps, detail page, and print sheet.
- A wall-shelf plan with missing or unsafe support details remains visibly blocked or review-needed in every packet surface.
- Natural-language intake can draft structured fields but does not save unvalidated freeform build truth.
- Revision requests that imply dimension, layout, material, support, safety, or cut-list changes produce an explicit structured-change decision before regeneration.
- At least one non-wall-shelf supported template has a first typed view-model pipeline modeled after the wall-shelf pattern.
- Ambiguous and unsupported ideas produce targeted questions, concept-only guidance, or blocked safety messaging instead of full build packets.
- `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` pass before any commit.

## Sprint 0: Baseline And Evidence

**Goal**: Freeze the current truth so later implementation does not drift from private-MVP boundaries.

**Demo/Validation**:

- Audit doc references still match live code.
- Existing tests pass before functional changes.
- No behavior change in this sprint unless an obvious doc/code mismatch is found.

### Task 0.1: Refresh Gap Inventory

- **Location**: `docs/PRIVATE_MVP_READINESS.md`, `docs/CODEX_TASKS.md`, `docs/ARCHITECTURE_VISION_GAP_PLAN.md`
- **Description**: Convert the gap audit into a short current-state checklist: wall-shelf maturity, revision limitations, intake limitations, unsupported/concept flow, and template coverage.
- **Dependencies**: None.
- **Acceptance Criteria**:
  - The current top gaps are listed with exact affected modules.
  - The note explicitly says this is private-MVP planning, not a launch roadmap.
  - No app behavior changes.
- **Validation**:
  - `git diff --check`

### Task 0.2: Add Golden Fixtures For Packet Comparisons

- **Location**: `tests/project-test-helpers.ts`, `tests/fixtures/` if a fixture folder is introduced, wall-shelf test files under `tests/`
- **Description**: Establish canonical test projects for a ready single wall shelf, ready separate wall shelves, connected shelf with support/frame modeled, connected shelf with support unresolved, impossible-height connected shelf, and archived project with saved plan.
- **Dependencies**: Task 0.1.
- **Acceptance Criteria**:
  - Fixtures are deterministic and do not require hosted data or OpenAI calls.
  - Existing wall-shelf tests can reuse them.
  - Fixture names make safety state obvious.
- **Validation**:
  - `npm test -- tests/wall-shelf-diagram-view-model.test.ts tests/wall-shelf-cut-diagram-view-model.test.ts tests/wall-shelf-build-step-view-model.test.ts`

### Task 0.3: Add Packet Consistency Snapshot Tests

- **Location**: `tests/printable-plan-manifest.test.ts`, `tests/project-detail-build-model.test.ts`, `tests/print-preview-page.test.ts`
- **Description**: Add tests that assert the same key part labels and review/blocking states appear in detail and print packet paths for canonical wall-shelf fixtures.
- **Dependencies**: Task 0.2.
- **Acceptance Criteria**:
  - Labels are checked across cut checklist, buying plan, materials/parts, build guide, and print.
  - Review-only placeholders do not receive stable part labels that make them look build-ready.
  - Browser-print-only language remains present.
- **Validation**:
  - `npm test -- tests/printable-plan-manifest.test.ts tests/project-detail-build-model.test.ts tests/print-preview-page.test.ts`

## Sprint 1: Finish Wall-Shelf Packet Semantics

**Goal**: Make wall shelves the complete pattern that future templates can copy.

**Demo/Validation**:

- A ready wall-shelf plan reads as a coherent build packet.
- An unresolved connected shelf is visibly not build-ready.
- No renderer invents missing supports, fasteners, joinery, or load claims.

### Task 1.1: Centralize Wall-Shelf Packet Status

- **Location**: `lib/plans/wall-shelf-plan-readiness-view-model.ts`, `lib/plans/printable-plan-manifest.ts`, `app/projects/[id]/WallShelfPlanReadiness.tsx`
- **Description**: Ensure wall-shelf packet readiness is the single status source for ready, needs-review, and blocked wall-shelf packet surfaces.
- **Dependencies**: Sprint 0.
- **Acceptance Criteria**:
  - Ready, needs-review, and blocked statuses have deterministic reasons and actions.
  - Detail and print use the same readiness status.
  - Impossible geometry and unresolved connected support cannot show a build-ready status.
- **Validation**:
  - `npm test -- tests/wall-shelf-plan-readiness-view-model.test.ts tests/printable-plan-manifest.test.ts`

### Task 1.2: Strengthen Part Identity Contract

- **Location**: `lib/plans/wall-shelf-part-schedule-view-model.ts`, `lib/plans/wall-shelf-cut-diagram-view-model.ts`, `lib/plans/wall-shelf-stock-board-view-model.ts`, `app/projects/[id]/WallShelfCutDiagram.tsx`, `app/projects/[id]/WallShelfBuyingPlan.tsx`
- **Description**: Make deterministic part labels the shared contract for assigned build-ready pieces, while review-only support placeholders stay clearly unlabeled or marked review-only.
- **Dependencies**: Task 1.1.
- **Acceptance Criteria**:
  - All assigned labels originate from the part schedule.
  - Cut diagram, buying plan, material rows, and build-step cards display the same assigned labels.
  - Review-only placeholders cannot be mistaken for cut-ready parts.
- **Validation**:
  - `npm test -- tests/wall-shelf-part-schedule-view-model.test.ts tests/wall-shelf-cut-diagram-view-model.test.ts tests/wall-shelf-stock-board-view-model.test.ts`

### Task 1.3: Add Beginner-Critical Connection Callouts

- **Location**: `lib/plans/wall-shelf-diagram-view-model.ts`, `app/projects/[id]/WallShelfDiagrams.tsx`, `lib/plans/wall-shelf-build-step-view-model.ts`
- **Description**: Add deterministic callouts for modeled support/frame or mounting review states without selecting anchors, brackets, or load ratings.
- **Dependencies**: Task 1.2.
- **Acceptance Criteria**:
  - Modeled supports show as modeled supports.
  - Missing supports show as support/frame review.
  - Mounting callouts mention studs/anchors/fasteners only as review requirements, not recommendations or guarantees.
- **Validation**:
  - `npm test -- tests/wall-shelf-diagram-view-model.test.ts tests/wall-shelf-diagrams-render.test.ts tests/wall-shelf-build-step-view-model.test.ts`

### Task 1.4: Manual Wall-Shelf Packet Dogfood

- **Location**: `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`, optional ignored `output/` screenshots only if needed and not committed
- **Description**: Use realistic private wall-shelf ideas to inspect detail and browser print packet flow. Record repeated friction only.
- **Dependencies**: Tasks 1.1-1.3.
- **Acceptance Criteria**:
  - At least three wall-shelf scenarios are inspected: single shelf, separate shelves, connected shelf needing support review.
  - Findings distinguish defects from future polish.
  - No hosted URLs, secrets, screenshots, or local runtime data are committed.
- **Validation**:
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`

## Sprint 2: Structured Revision Lifecycle

**Goal**: Stop treating every natural-language tweak as a blind full-plan regeneration when the request implies structured project changes.

**Demo/Validation**:

- A harmless copy/detail tweak can still create a new plan version.
- A dimension/layout/material/support/safety/cut-list tweak produces a structured-change review path before regeneration.
- Archived and no-plan states remain blocked as they are today.

### Task 2.1: Classify Revision Intent

- **Location**: `lib/plans/revision-input.ts`, new `lib/plans/revision-intent.ts`, `tests/revision-input.test.ts` or new `tests/revision-intent.test.ts`
- **Description**: Add deterministic classification for revision instructions: prose-only, dimension change, layout change, material change, support/mounting change, safety-sensitive change, cut-list change, unsupported/ambiguous.
- **Dependencies**: Sprint 1.
- **Acceptance Criteria**:
  - Classification is conservative and test-covered.
  - Safety/support/cut-list/dimension changes are never treated as plain prose-only tweaks.
  - Empty and too-long validation remains unchanged.
- **Validation**:
  - `npm test -- tests/revision-intent.test.ts tests/tweak-plan-route.test.ts`

### Task 2.2: Add Revision Decision Model

- **Location**: new `lib/plans/revision-decision.ts`, `app/projects/[id]/revise/route.ts`, `app/projects/[id]/TweakPlanForm.tsx`, `tests/tweak-plan-route.test.ts`
- **Description**: Use revision intent to decide whether revision may proceed, needs structured project edits first, or must be blocked for safety/unsupported scope.
- **Dependencies**: Task 2.1.
- **Acceptance Criteria**:
  - Prose-only safe revisions keep the current new-version behavior.
  - Structural changes redirect to a clear project-detail message explaining which saved fields must change first.
  - No plan version is saved when a structural revision is blocked.
- **Validation**:
  - `npm test -- tests/tweak-plan-route.test.ts tests/project-detail-build-model.test.ts`

### Task 2.3: Structured Change Review UI

- **Location**: `app/projects/[id]/page.tsx`, `app/projects/[id]/TweakPlanForm.tsx`, maybe `lib/projects/project-detail-errors.ts`
- **Description**: Add a compact, non-editing panel that explains blocked structural revisions and points to the relevant intake/readiness section.
- **Dependencies**: Task 2.2.
- **Acceptance Criteria**:
  - User sees why the tweak did not create a new plan.
  - The copy distinguishes editing saved project fields from regenerating plan prose.
  - No new route, migration, or package is added.
- **Validation**:
  - `npm test -- tests/project-detail-build-model.test.ts tests/tweak-plan-route.test.ts`

### Task 2.4: Add Safe Structured Update Path For Shelf Layout Only

- **Location**: `app/projects/[id]/shelf-layout/route.ts`, `lib/projects/shelf-layout-validation.ts`, `tests/project-shelf-layout-route.test.ts`
- **Description**: Treat shelf-layout repair as the first structured-change path, since it already exists and is central to wall-shelf safety.
- **Dependencies**: Task 2.3.
- **Acceptance Criteria**:
  - Shelf-layout repair remains unavailable when archived.
  - Invalid connected shelf geometry remains blocked.
  - After repair, generation can proceed only when clarification gate allows it.
- **Validation**:
  - `npm test -- tests/project-shelf-layout-route.test.ts tests/project-planning-lifecycle.test.ts`

## Sprint 3: Natural-Language Intake Drafting

**Goal**: Let users start with natural language while preserving structured fields as the saved source of truth.

**Demo/Validation**:

- A user can paste a project idea and receive a draft structured intake.
- The draft is editable before save.
- Missing safety-critical fields still trigger clarification instead of full generation.

### Task 3.1: Define Intake Draft Schema

- **Location**: `lib/projects/intake-draft.ts`, new `lib/projects/natural-language-intake.ts`, `tests/intake-draft.test.ts` or new `tests/natural-language-intake.test.ts`
- **Description**: Define a draft result schema for parsed natural-language intake: extracted fields, confidence, missing fields, safety-sensitive hints, and unsupported/high-risk hints.
- **Dependencies**: Sprint 2.
- **Acceptance Criteria**:
  - Draft schema does not allow unvalidated arbitrary JSON to become a project.
  - Draft values map onto existing `ProjectIntake` fields.
  - Missing or ambiguous values remain missing, not guessed.
- **Validation**:
  - `npm test -- tests/natural-language-intake.test.ts tests/project-form-routes.test.ts`

### Task 3.2: Add Deterministic First-Pass Parser

- **Location**: `lib/projects/natural-language-intake.ts`, `tests/natural-language-intake.test.ts`
- **Description**: Implement a conservative local parser for dimensions, obvious project type words, material thickness, material family, wall-shelf layout hints, mounting/support hints, load/use hints, and safety blockers.
- **Dependencies**: Task 3.1.
- **Acceptance Criteria**:
  - Parser extracts obvious data only.
  - Ambiguous dimensions are flagged, not silently assigned.
  - High-risk text produces blocked/concept-only hints.
  - No OpenAI call is introduced in this task.
- **Validation**:
  - `npm test -- tests/natural-language-intake.test.ts tests/clarification-gate.test.ts`

### Task 3.3: Add Intake Draft Route

- **Location**: new `app/projects/draft/route.ts`, `lib/projects/intake-draft.ts`, `tests/project-form-routes.test.ts`
- **Description**: Add a POST route that accepts natural-language idea text, creates an editable draft cookie, and redirects to `/projects/new` with fields prefilled.
- **Dependencies**: Task 3.2.
- **Acceptance Criteria**:
  - Route never creates a project directly.
  - Draft cookie uses existing draft machinery where possible.
  - Invalid or empty input returns calm feedback.
  - No raw parser internals are exposed.
- **Validation**:
  - `npm test -- tests/project-form-routes.test.ts tests/natural-language-intake.test.ts`

### Task 3.4: Add Start-With-Idea UI

- **Location**: `app/page.tsx`, `app/projects/new/page.tsx`, `app/projects/new/ProjectIntakeFormEnhancements.tsx`
- **Description**: Add a private-MVP workbench entry point where the user can paste an idea and review extracted structured fields before saving.
- **Dependencies**: Task 3.3.
- **Acceptance Criteria**:
  - First screen remains a usable workspace, not a marketing page.
  - The generated draft is visibly editable.
  - Safety-sensitive missing details remain visible in the existing clarification/readiness flow.
- **Validation**:
  - `npm test -- tests/dashboard-page.test.ts tests/project-form-routes.test.ts`
  - Manual browser check for `/` and `/projects/new`

### Task 3.5: Optional AI-Assisted Intake Parser Spike

- **Location**: `docs/NATURAL_LANGUAGE_INTAKE_SPIKE.md`, later code only with explicit approval
- **Description**: Research whether existing OpenAI structured output should be used to improve intake parsing after the deterministic parser exists.
- **Dependencies**: Task 3.4.
- **Acceptance Criteria**:
  - Spike documents schema, failure modes, cost controls, and safety boundaries.
  - No production AI intake parser is added without explicit follow-up approval.
- **Validation**:
  - `git diff --check`

## Sprint 4: One Next Template Packet

**Goal**: Prove the wall-shelf pattern can generalize without broad template churn.

**Demo/Validation**:

- One non-wall-shelf supported template gains typed packet view models.
- Existing generic diagrams remain as fallback for other templates.
- No unsupported category becomes a full build packet.

### Task 4.1: Choose The Next Template From Dogfood

- **Location**: `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`, `docs/CODEX_TASKS.md`
- **Description**: Pick exactly one next low-risk template based on repeated private use. Candidate default: `planter_box`, because it has dimensional structure, material/exposure review, and useful cut/material packet needs without wall-mounting complexity.
- **Dependencies**: Sprint 1 dogfood.
- **Acceptance Criteria**:
  - Choice is justified by observed friction, not feature ideation.
  - Scope says one template only.
  - Known exclusions are listed.
- **Validation**:
  - `git diff --check`

### Task 4.2: Add Template Part Schedule View Model

- **Location**: new `lib/plans/planter-box-part-schedule-view-model.ts` if `planter_box` is selected, plus tests
- **Description**: Model deterministic part labels and review-only states for the selected template.
- **Dependencies**: Task 4.1.
- **Acceptance Criteria**:
  - Part labels derive from Build Model pieces.
  - Missing dimensions/materials produce needs-review.
  - No renderer invents drainage, fasteners, supports, or outdoor durability claims.
- **Validation**:
  - New focused view-model test
  - `npm test -- tests/create-build-model-draft.test.ts`

### Task 4.3: Add Template Cut/Material View Model

- **Location**: new selected-template cut/material view-model files, `lib/plans/printable-plan-manifest.ts`
- **Description**: Add a deterministic cut/material packet layer for the selected template, modeled after wall-shelf cut and buying-plan patterns.
- **Dependencies**: Task 4.2.
- **Acceptance Criteria**:
  - Cut rows use shared part labels.
  - Material planning remains review-only and non-vendor-specific.
  - Outdoor/humidity or finish caveats remain visible where applicable.
- **Validation**:
  - New focused tests
  - `npm test -- tests/material-summary.test.ts tests/cut-list-review.test.ts tests/printable-plan-manifest.test.ts`

### Task 4.4: Add Template Diagram/Render Surface

- **Location**: new selected-template component under `app/projects/[id]/`, selected-template diagram model under `lib/diagrams/` or `lib/plans/`
- **Description**: Add a simple deterministic SVG/CSS diagram for the selected template that uses view-model data and safe fallbacks.
- **Dependencies**: Task 4.3.
- **Acceptance Criteria**:
  - Dimension labels are from structured model data.
  - Missing data produces fallback/review messages.
  - Print and detail use the same view model.
- **Validation**:
  - New render test
  - `npm test -- tests/print-preview-page.test.ts tests/project-detail-build-model.test.ts`

### Task 4.5: Template Packet Dogfood

- **Location**: `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`, `docs/PRIVATE_MVP_READINESS.md`
- **Description**: Dogfood the selected template through project detail and browser print, then update readiness notes.
- **Dependencies**: Tasks 4.2-4.4.
- **Acceptance Criteria**:
  - At least two realistic selected-template examples reviewed.
  - Gaps are documented before starting another template.
  - No second template is started in this sprint.
- **Validation**:
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `git diff --check`

## Sprint 5: Concept-Only And Ambiguous Idea Flow

**Goal**: Make ambiguous/unsupported ideas useful without producing unsafe full build packets.

**Demo/Validation**:

- Unsupported woodworking-adjacent ideas get concept-only guidance or questions.
- High-risk ideas are blocked.
- Ambiguous supported ideas produce targeted questions before full generation.

### Task 5.1: Define Concept Brief Schema

- **Location**: new `lib/projects/concept-brief.ts`, `tests/concept-brief.test.ts`
- **Description**: Define a deterministic concept brief structure with title, category, why not full plan, questions, safe next step, and optional rough dimensions from confirmed input only.
- **Dependencies**: Sprint 3.
- **Acceptance Criteria**:
  - Concept brief cannot contain cut lists or build steps.
  - High-risk blockers produce blocked messaging, not concept encouragement.
  - Confirmed dimensions may be shown, guessed dimensions may not.
- **Validation**:
  - `npm test -- tests/concept-brief.test.ts tests/clarification-gate.test.ts`

### Task 5.2: Render Concept/Unsupported Panel

- **Location**: `app/projects/[id]/page.tsx`, maybe `app/projects/new/page.tsx`
- **Description**: Show concept-only and unsupported status as a helpful review surface with questions and safe next action.
- **Dependencies**: Task 5.1.
- **Acceptance Criteria**:
  - Full generation remains disabled.
  - Copy avoids build-ready, approval, certification, load, CAD, PDF, and shopping claims.
  - User can understand whether to revise intake, choose a supported template, or stop.
- **Validation**:
  - `npm test -- tests/project-detail-build-model.test.ts tests/clarification-gate.test.ts`

### Task 5.3: Add 2-3 Mini Concept Option Drafts For Ambiguous Safe Ideas

- **Location**: `lib/projects/concept-brief.ts`, `app/projects/[id]/page.tsx`, tests
- **Description**: For safe woodworking-adjacent ambiguous ideas, show up to three bounded concept options without cut lists, build steps, or packet visuals.
- **Dependencies**: Task 5.2.
- **Acceptance Criteria**:
  - Options include rough category, difficulty, key confirmed dimensions if present, tools/material overview, pros/cons, and questions.
  - Options do not generate full build packets.
  - High-risk ideas bypass options and remain blocked.
- **Validation**:
  - `npm test -- tests/concept-brief.test.ts tests/project-detail-build-model.test.ts`

## Sprint 6: Packet Quality Ratchet

**Goal**: Raise the whole product toward the vision while keeping scope bounded.

**Demo/Validation**:

- Wall shelf and the selected next template both have coherent packet tests.
- Natural-language drafts and structural revisions preserve the source-of-truth rules.
- The readiness docs reflect the new private-MVP posture.

### Task 6.1: Add Cross-Packet Contract Tests

- **Location**: new `tests/plan-packet-contract.test.ts`
- **Description**: Add reusable assertions for packet sections: Build Snapshot, Hero Visual, Project Visuals, Check Before Building, Materials and Parts, Cut Checklist, Build Guide, Reference Review Notes, browser-print-only copy, and forbidden language.
- **Dependencies**: Sprints 1-5.
- **Acceptance Criteria**:
  - Contract tests cover wall shelf and the selected next template.
  - Unsupported/concept-only plans do not satisfy full packet contract.
  - Forbidden claims remain blocked.
- **Validation**:
  - `npm test -- tests/plan-packet-contract.test.ts`

### Task 6.2: Update Architecture And Vision Current-State Notes

- **Location**: `docs/ARCHITECTURE.md`, `docs/VISION.md`, `docs/PRIVATE_MVP_READINESS.md`
- **Description**: Refresh current-state sections only after implementation has landed. Keep target direction unchanged unless product intent changes.
- **Dependencies**: Task 6.1.
- **Acceptance Criteria**:
  - Docs state which templates have typed packet support.
  - Docs distinguish deterministic intake drafting from future AI-assisted intake if AI has not been added.
  - Current output remains browser print only.
- **Validation**:
  - `git diff --check`

### Task 6.3: Full Verification And Private Smoke

- **Location**: repo root, `docs/PRIVATE_MVP_READINESS.md`, `docs/HOSTED_DEPLOYMENT_STATUS.md` if hosted smoke is run
- **Description**: Run the full local verification stack. Run hosted smoke only if deployment/config changed or the user explicitly wants hosted validation.
- **Dependencies**: Task 6.2.
- **Acceptance Criteria**:
  - Local verification passes.
  - Hosted smoke status is current if applicable.
  - Readiness doc records what is and is not verified.
- **Validation**:
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `git diff --check`
  - Optional: `npm run smoke:hosted`

## Parallelization Map

- Sprint 0 tasks should run sequentially.
- Sprint 1 tasks are mostly sequential because readiness and part identity are shared contracts.
- Sprint 2 can start after Sprint 1 tests stabilize; Task 2.1 can be developed independently of UI.
- Sprint 3 can start after Task 2.1 if revision classification and natural-language intake share utility patterns.
- Sprint 4 should wait until wall-shelf packet contracts are stable.
- Sprint 5 can run after the clarification gate and natural-language draft behavior are stable.
- Sprint 6 must wait until implementation sprints complete.

## Testing Strategy

- Keep unit tests close to deterministic rules: intake parsing, clarification gate, revision intent, build model, view models, packet readiness, and concept brief generation.
- Keep rendered route tests for detail page, print page, dashboard/new-project entry points, and failure/blocked states.
- Never depend on live OpenAI calls in tests.
- For AI generation changes, test prompt context construction, schema validation, deterministic quality checks, and failure classification.
- For browser print changes, use rendered markup tests first and manual browser inspection when layout changes materially.
- Full verification before commit:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Potential Risks And Gotchas

- Natural-language intake can easily become unvalidated prompt magic. Mitigation: first ship a deterministic draft parser that only pre-fills editable structured fields.
- Revision classification can frustrate users if it blocks too much. Mitigation: start with clear copy and a narrow shelf-layout repair path before broader structured edit flows.
- Template expansion can dilute wall-shelf quality. Mitigation: add only one next template and require packet contract tests before another.
- Concept options can look like full plans if they include too much detail. Mitigation: no cut lists, no build steps, no packet visuals, no build-ready language.
- Buying Plan can drift into shopping. Mitigation: keep stock/material language review-only and test against vendor, price, cart, inventory, and optimized-cut claims.
- Print packet polish can become export scope. Mitigation: preserve browser print only until explicit approval for any generated output file.
- Existing `.env.local` may point at Supabase during manual dogfood. Mitigation: avoid mutating hosted/shared data unless explicitly doing hosted smoke, and keep dogfood records clearly labeled.

## Rollback Plan

- Each sprint should be committed separately.
- If natural-language intake causes confusion, remove the draft route/UI while preserving deterministic parser tests for future use.
- If revision intent blocks too aggressively, disable only the new structural-block branch and keep existing empty/too-long/archive/no-plan guards.
- If selected-template packet work becomes too broad, keep the part schedule and stop before render surfaces.
- If any packet renderer creates unsafe or unsupported implications, revert the renderer first and keep the underlying view model tests as the next repair target.

## Recommended Initial Implementation Order

1. Sprint 0: baseline fixtures and packet consistency tests.
2. Sprint 1: wall-shelf packet status, part identity, and connection callouts.
3. Sprint 2: revision intent classification and structural-change blocking.
4. Sprint 3: deterministic natural-language intake draft.
5. Sprint 4: one next template packet.
6. Sprint 5: concept-only/ambiguous idea handling.
7. Sprint 6: cross-packet contract tests and docs refresh.
