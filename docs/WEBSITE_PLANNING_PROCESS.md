# Boardsmith Website Planning Process

Date: June 15, 2026

This is the multi-session planning asset for making Boardsmith's website experience better without jumping straight into implementation. It mirrors the Grill -> Research -> Prototype -> PRD -> Issues -> Implement -> Review process, but narrows it to Boardsmith's current private-MVP posture.

## Current Interpretation Of Website

For the current repo, "website" means the private Boardsmith web app experience: access gate, dashboard, project list, intake, project detail, generated plan review, `Tweak this plan`, project record, archive/restore, and browser print plan.

It does not mean a public marketing site, launch page, marketplace, public gallery, shopping flow, pricing page, auth expansion, export product, CAD tool, or subscription funnel.

## Existing Source Docs

Read these before planning any website changes:

1. `PRODUCT.md` - product purpose, user, brand personality, anti-references, design principles.
2. `docs/VISION.md` - north star, plan-packet quality bar, visual strategy, long-term boundaries.
3. `DESIGN.md` - design system, component posture, page hierarchy rules, prohibited visual directions.
4. `docs/UI_WIREFLOW.md` - current routes, actions, states, and known UI friction.
5. `docs/UX_POLISH_AUDIT.md` - backlog of practical UX issues and larger post-MVP ideas.
6. `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` - evidence from actual hosted/manual use.
7. `docs/PRIVATE_MVP_READINESS.md` - current readiness, guardrails, smoke expectations, and known limitations.
8. `docs/CODEX_TASKS.md` - completed work, checkpoint history, and current narrow next-task posture.
9. `CONTEXT.md` - canonical domain language for Grill/PRD/issue work.

## Planning Gaps This File Closes

- The repo had strong product, design, readiness, and dogfood docs, but no single phase plan for future website work.
- The Matt-style skills are installed locally, but the repo still needs explicit agent setup docs before skills such as `to-prd`, `to-issues`, and `triage` can publish work predictably.
- The repo did not have a root `CONTEXT.md` glossary for `grill-with-docs`; that glossary now captures the current Boardsmith language.
- No website implementation lane should start until the desired outcome is narrower than "make a great website."

## Phase Plan

### 1. Grill

Goal: resolve the shape of the website improvement before writing a PRD or code.

Use `grill-with-docs` against the source docs above. Ask one question at a time, and answer from the repo when possible.

Required decisions:

- What does "great website" mean for this private MVP: faster project resumption, clearer first-time orientation, better plan review, stronger print flow, or calmer trust/safety posture?
- Which lifecycle state is the priority: first visit, no-plan project, generated-plan project, revised-plan project, archived project, or browser print plan?
- Which user outcome proves the pass worked?
- How does the pass support the long-term direction of universal intake with gated build packets?
- Which existing guardrails are non-negotiable for the pass?
- What will explicitly remain out of scope?

Recommended starting answer:

Boardsmith should optimize for a private user opening the app, finding the right project state, understanding the next safe action, and reaching a reviewable browser print plan without mistaking the app for approval, export, CAD, shopping, or public sharing software.

Long-term, Boardsmith should accept broad project ideas but generate full visual build packets only when the project is supported, safe enough, and detailed enough. Unsupported, ambiguous, or high-risk ideas should receive targeted questions, concept-level guidance, or a clear refusal to produce build instructions.

Before full generation, the app should help the user understand what information is missing for safe plan generation. Missing details should be specific and actionable: dimensions, mounting method, material thickness, support/frame details, intended loads, use context, tools, finish exposure, and child-adjacent or other safety-sensitive use.

### 2. Research

Goal: collect evidence only when the implementation path has unknowns.

Use research for:

- hard-to-evaluate interaction patterns;
- accessibility or mobile behavior questions;
- print workflow expectations;
- examples of dense planning/workbench software;
- current framework behavior that may have changed.

Skip research when the issue is already answered by current dogfood notes, rendered route tests, or the design system.

Output, if needed: `docs/WEBSITE_RESEARCH.md` with short findings, tradeoffs, and which findings apply to Boardsmith. Do not turn research into a broad feature wish list.

### 3. Prototype

Goal: answer a design or state question before production implementation.

Use throwaway prototypes only when a decision is hard to reason about in prose:

- UI prototype: multiple route/layout variations for one screen state, clearly marked throwaway.
- Logic prototype: a tiny state model if lifecycle behavior is ambiguous.

Prototype questions that might be worth testing:

- Should the project detail page keep jump links, switch to a sticky section rail, or use state-specific summaries?
- Should first-run orientation be a checklist, sample project, or stronger empty state?
- Should browser print actions be framed as a separate build-packet step or remain embedded in project detail?

Discard the prototype after it answers the question. Capture only the decision in a PRD, issue, or ADR if it is genuinely hard to reverse.

### 4. PRD

Goal: turn the resolved direction into a bounded product spec.

Create a PRD only after Grill has narrowed the lane. The PRD should include:

- problem statement from the user's point of view;
- solution from the user's point of view;
- extensive user stories for the selected lifecycle state;
- implementation decisions without brittle file-path detail;
- test seams and prior-art tests;
- out-of-scope list that repeats Boardsmith guardrails;
- QA notes for manual dogfood and browser print where relevant.

Good PRD candidates:

- Clarification Gate for safe generation readiness.
- Visual Plan Packet for supported wall shelves.
- Project detail orientation pass.
- First-run private workspace orientation.
- Browser print plan confidence pass.
- Generated-plan reading-order pass.
- Mobile project-list/detail density pass.

Bad PRD candidates:

- "Make the app better."
- "Public launch website."
- "Add marketing page."
- "Add PDF/export/auth/shopping because the site feels incomplete."

Recommended PRD split:

1. Clarification Gate for safe generation readiness.
2. Visual Plan Packet for supported wall shelves.

Keep the two PRDs paired in the roadmap, but do not collapse them into one implementation lane. The Clarification Gate should establish how Boardsmith identifies missing, ambiguous, or safety-sensitive details before generation. The Visual Plan Packet should assume the project has already passed the gate and focus on deterministic visual plan quality.

Clarification Gate screen output:

- Ready for full plan: enough detail exists for a supported safe template.
- Needs details: specific missing fields or questions must be answered before generation.
- Concept only: the idea is adjacent to supported work, but not enough for a full build packet.
- Unsupported: Boardsmith can discuss constraints, but should not produce cut lists or build steps.
- Blocked for safety: the project is too high-risk for build instructions.

For "Needs details," ask concrete project questions instead of showing generic validation errors: final outside dimensions, material and thickness, mounting method, expected use or load, child-adjacent/climbing/seating/sleeping/overhead/structural risk, available tools, finish, and exposure conditions.

### 5. Issues

Goal: split the PRD into narrow implementation tickets with blocking relationships.

Each issue should be small enough to verify independently and must say:

- lifecycle state affected;
- user-visible behavior;
- forbidden scope;
- tests or manual checks required;
- whether hosted smoke is required;
- whether browser print must be checked.

Before using `to-issues`, finish repo agent setup so the skill knows whether issues belong in GitHub or local markdown.

### 6. Implement

Goal: ship one narrow issue at a time.

Implementation rules:

- Keep changes scoped to the selected lifecycle state.
- Prefer deletion and simplification over adding new abstractions.
- Do not add routes, packages, migrations, auth, export, image upload, public sharing, marketplace, shopping, pricing, vendor, or payment scope unless explicitly selected and approved.
- Preserve all safety and planning-aid warnings.
- Use existing Next.js, Tailwind, test, and route patterns.

Required verification before commit:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

Add hosted smoke only when the change touches deployment, access gate, archive, project detail lifecycle, generation, `Tweak this plan`, or print behavior.

Use `npm run test:e2e` for local browser-visible route, lifecycle, generated-packet, and print-route regressions. Use `npm run smoke:hosted` for protected hosted-path checks, and keep manual browser print inspection for layout or pagination changes that Playwright route smoke cannot prove.

### 7. Review

Goal: prove the pass did not create lifecycle confusion or unsafe trust.

Review checklist:

- The affected lifecycle state has clear entry, exit, visibility, and reversal behavior.
- No action appears available when the state blocks it.
- The next safe action is visible.
- Warnings use text, not color alone.
- Browser print remains browser-print-only unless export work was explicitly approved.
- Generated plan language still reads as planning aid, not approval.
- Mobile layout is not blocked by navigation, filters, jump links, or tables.
- Tests cover the critical path and edge cases.

## Parallel Planning Lanes

These can run in parallel during Grill or PRD drafting:

- Product lane: user outcome, private-MVP boundary, non-goals.
- UX lane: route flow, lifecycle states, next actions, mobile density.
- Visual lane: design-system fit, hierarchy, spacing, component vocabulary.
- Trust lane: safety copy, warning prominence, no overclaiming.
- Content lane: button labels, section names, empty states, error copy.
- Verification lane: rendered route tests, storage tests, hosted smoke, browser print checks.

## Current Recommendation

Do not start implementation from the phrase "great website." The repo already has enough docs to begin a strong planning pass, but the next valuable step is a Grill session that narrows the target lifecycle state and success measure.

Recommended first Grill question:

> When you say "great website," should this pass optimize the private workspace/app experience that already exists, or are you intentionally opening a separate public-facing website direction?

Recommended answer:

Keep this as private workspace/app experience for now. A public-facing site is a different product direction and conflicts with the current private-MVP pause posture unless explicitly chosen.
