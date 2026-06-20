# Vision / Architecture Alignment Loop Report

Date: 2026-06-13

## Phase 0 Safety Setup

- Branch: `main`, currently ahead of `origin/main` by one existing commit.
- Uncommitted changes at loop start were related to the active vision/architecture alignment work:
  - `docs/VISION.md`
  - `docs/ARCHITECTURE.md`
  - `app/projects/[id]/ProjectHeroVisual.tsx`
  - `app/projects/[id]/page.tsx`
  - `app/projects/[id]/print/page.tsx`
  - `tests/print-preview-page.test.ts`
  - `tests/project-detail-build-model.test.ts`
- No unrelated pre-existing working-tree changes were found.
- Guardrails in force: no schema changes, packages, auth, public sharing, exports, image upload, PDF generation, AI image generation, vendor/shopping flows, payments, subscriptions, or external services.

## Current Strongest Product Gaps

1. The print preview now closely follows the plan-packet sequence, but the digital generated-plan sheet still has mixed labels and ordering that feel more like an internal review surface than a finished build packet.
2. The project detail page exposes useful deterministic information, but labels such as `Plan at a glance`, `Planning diagrams`, `Materials to verify`, `Cut list to verify`, and `Modeled operations` do not match the core plan structure in `docs/VISION.md`.
3. Wall-shelf diagram coverage is strong for the MVP, but the digital sheet can do more to present the same structured data as "what I am building, what I buy, what I cut, what I review, what I do next."
4. The architecture guardrails are mostly preserved: structured Build Model data drives diagrams, cut-list review, material review, action checklists, and print manifest output.

## Phase 1 Initial Scoring

| Dimension | Score | Notes |
| --- | ---: | --- |
| Vision alignment | 7 | Core flow exists and hero visual has been added, but digital sheet labels/order still drift from the plan-packet structure. |
| Beginner clarity | 7 | Safety and checklist surfaces are clear; some internal terminology still leaks into the generated-plan sheet. |
| Generated project page usefulness | 7 | Strong review and history surfaces, but the main plan packet is not yet as cleanly organized as the print packet. |
| Print/build packet usefulness | 8 | Browser print packet is clean, structured, and build-focused. |
| Diagram usefulness | 7 | Wall-shelf diagrams and deterministic fallbacks are good; hero visual is now model-backed. |
| Visual polish | 7 | Calm workbench styling is consistent; the generated detail page still feels dense in places. |
| Source-of-truth safety | 8 | Build Model and deterministic review remain the source for dimensions, diagrams, materials, and safety surfaces. |
| Wall-shelf golden-template quality | 8 | Wall shelf has the best intake, diagram, review, and print flow. |
| Mobile/readability risk | 6 | Dense plan sections and tables remain the main risk. |
| Test confidence | 8 | Focused render tests, manifest tests, diagram tests, full test suite, lint, typecheck, build, and `git diff --check` have been run during the active alignment work. |

## Iteration 1 - Completed

- Chosen slice: add a deterministic Build Model-backed `Hero Visual` to the project detail plan sheet and browser print packet.
- Why chosen: `docs/VISION.md` says the first "wow" should be the main project visual, while `docs/ARCHITECTURE.md` requires build visuals to come from structured data rather than AI images.
- Files touched:
  - `app/projects/[id]/ProjectHeroVisual.tsx`
  - `app/projects/[id]/page.tsx`
  - `app/projects/[id]/print/page.tsx`
  - `tests/print-preview-page.test.ts`
  - `tests/project-detail-build-model.test.ts`
- Risks:
  - Accidentally implying a generated concept image or buildable CAD output.
  - Duplicating existing diagram visuals without clarifying the planning-aid boundary.
- Tests run:
  - `npm test -- tests/print-preview-page.test.ts`
  - `npm test -- tests/project-detail-build-model.test.ts`
  - `npm test -- tests/plan-diagrams.test.ts tests/printable-plan-manifest.test.ts tests/wall-shelf-diagrams-render.test.tsx`
  - `npm test`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
  - `git diff --check`
- Result: passed. Runtime HTML check confirmed the print packet starts `Build Snapshot -> Hero Visual -> Project Visuals / Diagrams`.

## Iteration 2 - Planned

- Chosen slice: align the digital generated-plan sheet with the core plan-packet structure.
- Why chosen: print already reads like a build packet, but the digital plan sheet still uses internal/debug-like labels and a different order. Aligning labels and grouping improves beginner clarity without changing schemas or generation behavior.
- Files likely touched:
  - `app/projects/[id]/page.tsx`
  - `tests/project-detail-build-model.test.ts`
  - `docs/VISION_ALIGNMENT_LOOP_REPORT.md`
- Risks:
  - Breaking anchor links such as `#open-questions` or `#cut-list-to-verify`.
  - Hiding useful review data while trying to reduce debug-like wording.
  - Over-broad refactor of the project detail page.
- Tests to run:
  - `npm test -- tests/project-detail-build-model.test.ts`
  - `npm test -- tests/print-preview-page.test.ts`
  - `npm run lint`
  - `npm run typecheck`
  - `git diff --check`
- Stop conditions:
  - Required changes spread beyond the project detail plan packet.
  - Useful structured review data cannot be preserved with cleaner labels.
  - Tests fail in a way that is not confidently tied to the intended label/order change.

## Iteration 2 - Result

- Status: implemented.
- Change summary:
  - The digital generated-plan sheet now uses `Build Snapshot`, `Hero Visual`, `Project Visuals / Diagrams`, `Check Before Building`, `Materials and Parts`, `Cut Checklist`, `Buying Plan`, `Build Guide`, and `Reference Review Notes`.
  - The project summary and planning-aid warning now live with the Build Snapshot header instead of a separate `Overview / Summary` section.
  - Later structured review details remain available, but `Modeled operations` no longer appears as a primary plan-packet section.
  - Existing `#cut-list-to-verify` and `#open-questions` anchors were preserved.
- Tests run:
  - `npm test -- tests/project-detail-build-model.test.ts`
- Result: passed.

## Iteration 3 - Planned

- Chosen slice: align browser print packet section labels to the exact shared core plan structure.
- Why chosen: print already follows the right order, but `Project Visuals` and `Reference review notes` do not exactly match the shared vocabulary used in the vision doc and now in the digital plan sheet.
- Files likely touched:
  - `app/projects/[id]/print/page.tsx`
  - `tests/print-preview-page.test.ts`
  - `docs/VISION_ALIGNMENT_LOOP_REPORT.md`
- Risks:
  - Breaking print-preview assertions that check section order.
  - Creating churn beyond label alignment.
- Tests to run:
  - `npm test -- tests/print-preview-page.test.ts`
  - `npm test -- tests/project-detail-build-model.test.ts`
  - `git diff --check`
- Stop conditions:
  - Any required change goes beyond label/order alignment.
  - Print section order becomes ambiguous.

## Iteration 3 - Result

- Status: implemented.
- Change summary:
  - Browser print now uses `Project Visuals / Diagrams` and `Reference Review Notes`, matching the core plan-packet vocabulary.
  - Print section order is `Build Snapshot -> Hero Visual -> Project Visuals / Diagrams -> Check Before Building -> Materials and Parts -> Cut Checklist -> Buying Plan -> Build Guide -> Reference Review Notes`.
- Tests run:
  - `npm test -- tests/print-preview-page.test.ts`
- Result: passed.

## Stop Decision

Stopped after 3 implementation iterations rather than using the fourth loop. The remaining likely improvements are larger product-surface questions around the non-print project detail page density, mobile review, and deeper wall-shelf model quality. Those are real but would broaden this change set beyond a bounded, easy-to-review alignment loop.

## Final Validation

- `npm test -- tests/project-detail-build-model.test.ts tests/print-preview-page.test.ts` passed.
- `npm test` passed.
- `npm run lint` passed.
- `npm run typecheck` initially hit stale Next generated route types, then passed after `npm run build` regenerated `.next`.
- `npm run build` passed.
- `git diff --check` passed with only Windows LF-to-CRLF warnings.
