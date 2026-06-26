# Dogfood Testing

## Purpose

Dogfood testing in Boardsmith should find real private-MVP friction before Codex proposes implementation work. The goal is not to prove that buttons can be clicked. The goal is to notice where a realistic DIY user would hesitate, misunderstand the next step, distrust the plan, or need repeated unnecessary thinking.

Boardsmith is a private woodworking planning aid. Dogfood work must preserve the current product boundaries: browser print is the supported output path, generated plans require user review, and the app must not imply engineering approval, load rating, child-safety certification, CAD/CNC readiness, shopping, pricing, vendor selection, public sharing, or file export.

## Philosophy

Act like the target user:

- A handy DIY homeowner.
- Comfortable with common tools but still relatively new to woodworking.
- Looking for confidence before buying, cutting, mounting, finishing, or printing a plan.
- Sensitive to missing measurements, vague hardware guidance, unclear safety review, and plan packets that look more complete than they really are.

Do not only click happy paths. Use realistic goals with ordinary mistakes, partial details, cautious safety-sensitive wording, and follow-up questions a real user would have.

Do not treat every annoyance as a product problem. Escalate only issues that block project completion, create safety/product confusion, or repeat across scenarios.

## Default Method

1. Inspect the current repo docs and route/test structure before running QA.
2. Run the app locally unless the user explicitly scopes hosted QA.
3. Prefer isolated local JSON data via `BOARDSMITH_DATA_FILE` and non-critical smoke records.
4. Use Playwright/browser workflows for real navigation, form filling, keyboard/mouse behavior, viewport checks, and print-route inspection.
5. Run existing repeatable checks before relying on exploratory findings:

```bash
npm run test:e2e
```

6. During exploratory browser QA, document findings first. Do not make code changes unless the user explicitly asks for implementation.
7. If a fix is later requested, implement the smallest verifiable change and add or update regression coverage for the confirmed behavior.

## Operational QA Workbook

Use `docs/qa/boardsmith-feature-user-story-ledger.xlsx` as the canonical active QA backlog.

- `Feature Stories` is the inventory of user-facing behaviors, expected behavior, source-of-truth files, edge cases, and current verification coverage.
- `Testing Log` records command and scenario-level evidence.
- `QA Backlog` is the active queue for dogfood friction, defects, UX/logistical issues, retest needs, and leave-alone decisions.
- `Status Vocabulary` defines the allowed severity, confidence, backlog, fix, retest, coverage, and owner values.

For every dogfood pass, update the workbook first. Historical docs are secondary:

- Put new or repeated findings in `QA Backlog`.
- Keep `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` as sanitized historical evidence and summary context.
- Use `docs/CODEX_TASKS.md` only after an implementation batch is accepted, completed, or deliberately deferred.

Each `QA Backlog` row should include scenario, page/flow, user goal, what happened, why it matters, suggested fix, severity, confidence, repeat count, evidence link, whether it should become a Playwright test, owner, next action, fix commit/PR, retest result, and last updated date.

Pull implementation batches only from high-confidence `Must fix before private MVP/demo` rows or repeated/high-confidence `Should fix soon` rows. Close rows as `Closed - Retested Pass` only after retesting the same user behavior, or as `Closed - Leave Alone` when the behavior is an intentional product/safety boundary.

## What To Look For

Record friction when a realistic user experiences:

- confusion about what to do next
- dead ends or no clear recovery path
- repeated unnecessary thinking
- unclear next action
- mismatch between UI wording and actual behavior
- missing validation or validation that appears too late
- unsupported or safety-sensitive projects looking more supported than they are
- missing board length/count, bracket, fastener, support, finish, drainage, liner, or wall/stud review guidance
- plan packets that do not clearly separate build-ready facts from review-needed assumptions
- print-route readability, ordering, pagination, or browser-print confusion
- export/download wording that conflicts with the current browser-print-only posture
- mobile layout issues, overlapping text, unreachable controls, or wide content that cannot be reviewed
- slow or unclear generation/revision feedback
- archive/restore, notes, build-log, or plan-history lifecycle confusion

## Finding Categories

Use these buckets:

- Must fix before private MVP/demo: blocks the primary private user flow, risks unsafe overconfidence, hides invalid state, loses user work, or makes a supported flow impossible to complete.
- Should fix soon: repeated friction that slows or confuses realistic use but has a safe workaround.
- Nice later: polish, convenience, or one-off confusion that does not block private MVP use.
- Not a real issue / leave alone: expected safety boundary, intentional conservative behavior, unsupported scope, or one-off preference without repeated evidence.

## Evidence Required

Each finding must include:

- Page/flow tested.
- Exact user goal.
- Steps taken.
- What happened.
- Why it matters.
- Suggested fix.
- Confidence level: high, medium, or low.

High confidence means the issue repeated, blocked the task, or is directly supported by the app behavior and docs. Medium confidence means the issue is plausible but needs one more scenario or viewport. Low confidence means it is a note to watch, not an implementation reason.

## Scenario Guidance

Infer scenarios from current repo docs before testing. As of this workflow, useful Boardsmith scenarios include:

- single wall shelf with realistic width, depth, board thickness, mounting method, wall/stud context, support count, and light use
- multiple separate wall shelves
- connected wall shelf unit with unresolved support/frame review
- bathroom or humid-location wall shelf
- garage utility shelf with heavier storage language
- toddler or child-adjacent book ledge, treated conservatively
- basic planter box with drainage, liner, outdoor finish, stock-board, and connection review
- raised planter idea that should hit the current template boundary
- dashboard idea drafting before saving
- project list search/filter/archive/restore
- project notes and build-log usage
- plan history and `Tweak this plan` revision lifecycle
- browser print plan review on desktop and mobile widths

Use clearly labeled non-critical test projects. Do not create records that look like real customer or production data.

## Reporting Template

Use this shape for each scenario:

```markdown
### Scenario: <name>

- User goal:
- Environment:
- Steps:
- Point of hesitation:
- Page/feature involved:
- Missing, vague, or mismatched information:
- Repeated elsewhere:
- Severity:
- Suggested narrow implementation pass:
- Confidence:
```

Then summarize:

```markdown
## Repeated-Annoyance Summary

## Must Fix Before Private MVP/Demo

## Should Fix Soon

## Nice Later

## Not A Real Issue / Leave Alone

## Candidate Regression Tests

## Recommended Next Implementation Batch
```

The recommended implementation batch should be small. If nothing repeated or blocked completion, say so and recommend leaving the app alone.

## Artifact Rules

- Do not record secrets, cookies, hosted URLs, project IDs, row data, request headers, screenshots with sensitive hosted data, or session-file contents.
- Keep screenshots, traces, videos, local data files, and browser reports ignored unless the user explicitly asks to preserve them.
- If screenshots or traces are generated, report their local path and whether they are ignored.
- For hosted QA, follow `docs/HOSTED_SMOKE_AUTOMATION.md` and use only secret-safe, authorized paths.
