# Architecture Review Follow-Through Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the in-scope private-MVP gaps from the architecture/vision audit without expanding into public-product, auth, export, CAD, shopping, marketplace, or speculative AI prompt work.

**Architecture:** Keep `PrintablePlanManifest` and `printable-plan-packet` as the source-of-truth modules. Deepen only the app-layer packet dispatch module that both project detail and Browser Print Plan routes need, while leaving route-specific summaries and print-table implementation local.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, Vitest, hosted smoke helper.

---

## Independent Agent Lanes

- **Architecture lane:** Identify whether detail/print route drift is real and define the smallest shared module. Completion standard: exact files, no broad shared renderer, no deferred product scope.
- **Dogfood evidence lane:** Inspect existing dogfood docs and tests for repeatable generated-plan evidence gaps. Completion standard: concrete evidence capture recommendation without speculative prompt/schema tuning.
- **Docs lane:** Audit architecture, vision, readiness, hosted status, real dogfood, and task ledger drift. Completion standard: exact doc edits only where traceability is missing.
- **Verification lane:** Define and run safe validation for route/content smoke and local tests without mutating production data or recording secrets.

## Tasks

### Task 1: Shared Packet Dispatch Module

**Files:**
- Create: `app/projects/[id]/PlanPacketSections.tsx`
- Modify: `app/projects/[id]/page.tsx`
- Modify: `app/projects/[id]/print/page.tsx`
- Modify: `tests/plan-packet-contract.test.ts`

- [x] Add `PlanPacketHeroVisual`, `PlanPacketProjectVisuals`, `PlanPacketReadinessSection`, `PlanPacketCutDiagram`, `PlanPacketBuyingPlan`, and `PlanPacketBuildGuide`.
- [x] Use the shared module from the detail route while preserving detail-only summaries, generated-cut table, warning copy, and reference notes.
- [x] Use the shared module from the Browser Print Plan route while preserving print-only snapshot, checkbox table, compact review details, and shop notes.
- [x] Add a packet contract test that renders the shared module for wall shelf and planter manifests.
- [x] Verify focused routes with `npm test -- tests/plan-packet-contract.test.ts tests/project-detail-build-model.test.ts tests/print-preview-page.test.ts`.

### Task 2: Evidence And Traceability Docs

**Files:**
- Modify: `docs/ARCHITECTURE_VISION_GAP_PLAN.md`
- Modify: `docs/CODEX_TASKS.md`
- Modify: `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md`

- [x] Record that a broad shared detail/print renderer remains intentionally shallow, but the shared packet dispatch module now owns repeated template switching.
- [x] Add a task-ledger entry for the architecture review follow-through and hosted detail/print smoke evidence.
- [x] Add planter dogfood evidence criteria so the remaining generated-plan quality gap can be closed by real projects rather than prompt speculation.
- [x] Keep out-of-scope public/auth/export/marketplace/CAD work out of the plan.

### Task 3: Validation And Closeout

**Files:**
- No intended source files beyond Tasks 1 and 2.

- [x] Run focused tests for the shared packet module and route renderers.
- [x] Run hosted route/content smoke through the protected path with sanitized output.
- [x] Run hosted browser validation for access, detail, Browser Print Plan click-through, and keyboard tabbing with sanitized output.
- [x] Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.
- [x] Review the diff for scope, safety language, and private-MVP boundaries.
- [x] Commit only after verification passes.
