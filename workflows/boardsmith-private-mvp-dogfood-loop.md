# Boardsmith Private MVP Dogfood Loop

Status: Ready.

## Loop

When the user has a real supported woodworking idea, use Boardsmith like a private MVP user, capture points where planning becomes unclear or incomplete, and turn only repeated friction into a narrow implementation pass.

## Purpose

Prevent Boardsmith from drifting into speculative feature work. The loop keeps product work grounded in real private-use friction while preserving the app's planning-aid, browser-print, no-shopping, no-export, and no-certification boundaries.

## Trigger

Event-triggered when the user explicitly asks for a Boardsmith dogfood pass on a real woodworking idea they might actually plan, buy for, print, or build.

## Inputs

- One real, non-critical woodworking idea.
- Intended use and location.
- Rough dimensions and material preference.
- Known constraints such as mounting, outdoor exposure, bathroom humidity, child-adjacent use, available tools, and desired finish.
- Access to localhost, staging, or the protected hosted app.

## Guardrails

- Do not use real payments, purchases, public sharing, real accounts beyond the existing private access path, or destructive actions.
- Do not add product behavior during the exploratory pass.
- Do not treat one-off confusion as a product problem.
- Do not weaken planning-aid, manual-review, no-approval, no-load-rating, no-wall-safety-guarantee, or no-child-safety-certification language.
- Do not start app-generated PDF, SVG, DXF, CAD, CNC, FreeCAD, image upload, public sharing, marketplace, shopping, pricing, vendor, purchasing, inventory, auth expansion, payment, or subscription work from this loop.
- Do not record hosted URLs, project IDs, row data, cookies, request headers, secrets, sensitive screenshots, or runtime data.

## Run Steps

1. Select a real, supported, non-critical project idea.
2. Create or reuse a clearly labeled dogfood project in the private app.
3. Complete intake with realistic dimensions, material, mounting/use context, finish/exposure context, and safety-sensitive details.
4. Generate a plan only when safe and expected for the scenario.
5. Review generated-plan detail, Buying Plan, Build Guide, Check Before Building, project record, and Browser Print Plan.
6. Record each hesitation with the page or feature, what was missing or vague, and whether the project could continue.
7. Update `docs/qa/boardsmith-feature-user-story-ledger.xlsx`: use `Feature Stories` as the behavior inventory, `Testing Log` for commands/scenarios run, and `QA Backlog` for active findings.
8. Repeat with enough similar scenarios to decide whether the same issue repeats.
9. Promote only repeated or blocking friction from `QA Backlog` into a narrow implementation pass.
10. Verify any implementation pass with focused tests and the repo's standard validation commands before commit.
11. Close or advance the same workbook rows after retest, then update sanitized evidence or task docs only as needed.

## Finding Record

Each finding should include:

- Scenario name
- User goal
- Steps taken
- Page or feature involved
- Point where a real user would hesitate
- Missing, vague, or conflicting information
- Whether it repeated in another scenario
- Severity: low, medium, high
- Suggested narrow implementation pass

## Repetition Rule

An issue counts as repeated friction when the same hesitation appears in two similar realistic scenarios.

A single scenario can be promoted without repetition only when it blocks completion or creates a safety, lifecycle, or data-integrity risk.

## Execution Path

Use whichever path matches the risk being tested.

- Use protected hosted access when validating real private-use lifecycle, access-gate, deployment, persistence, generation, archive/restore, or `Tweak this plan` behavior.
- Use local seeded data for packet rendering, visual, copy, layout, and repeatable regression checks.
- Prefer local repeatable tests after a hosted exploratory finding has identified the narrow behavior to protect.

## Checkpoint

After the exploratory pass has grouped findings, Codex presents a repeated-annoyance brief and recommends the narrow implementation pass, if any.

The workbook is the checkpoint source of truth. Update `QA Backlog` before recommending implementation. Use `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` for sanitized historical evidence and `docs/CODEX_TASKS.md` only for accepted, completed, or intentionally deferred implementation work.

The user approves normal product changes before code work begins. Codex may proceed without that approval only for a clear bug, safety issue, lifecycle break, or data-integrity risk.

## Brief

The checkpoint brief should contain:

- What scenarios were run.
- Which `Feature Stories`, `Testing Log`, and `QA Backlog` rows changed.
- Which issues repeated.
- Which issues were one-offs and should not become product work.
- The recommended implementation pass, if any.
- Explicit non-goals preserved.
- Links to the sanitized finding record and any local test artifacts that are safe to keep.

## Raw Notes

Raw unsanitized dogfood notes live only in ignored local scratch under `.tmp/dogfood-notes/`.

Only sanitized summaries go into committed docs. Sanitized summaries must omit hosted URLs, project IDs, row data, cookies, request headers, secrets, sensitive screenshots, and runtime data.

## Output

- Updated workbook rows in `docs/qa/boardsmith-feature-user-story-ledger.xlsx`.
- Updated dogfood findings in `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` or a task-specific dogfood doc only when a sanitized historical summary is useful.
- A narrow implementation pass only when repeated friction justifies it.
- Regression tests for the behavior changed by the implementation pass.
- Updated `docs/CODEX_TASKS.md` when the pass becomes an accepted, completed, or deliberately deferred implementation task.
