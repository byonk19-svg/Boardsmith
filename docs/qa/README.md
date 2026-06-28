# Boardsmith QA Workbook

`boardsmith-feature-user-story-ledger.xlsx` is the canonical QA workbook for active feature/user-story tracking.

Use it for the operational backlog:

- `Feature Stories` inventories supported app behaviors, expected behavior, source-of-truth code/docs, and current verification coverage.
- `Testing Log` records command and scenario-level verification evidence.
- `QA Backlog` is the active queue for dogfood friction, defects, UX/logistical issues, retest needs, and leave-alone decisions.
- `Status Vocabulary` defines the allowed triage/status language used by the workbook.

Workflow:

1. Start browser dogfood or QA from the relevant `Feature Stories` rows.
2. Log new confirmed friction in `QA Backlog` with scenario, page/flow, user goal, what happened, why it matters, severity, confidence, owner, next action, and retest status.
3. Pull fix batches from high-confidence `Must fix before private MVP/demo` or repeated `Should fix soon` rows.
4. After implementation, update the same backlog rows with commit/PR, retest result, and closure status.
5. Use `docs/REAL_PROJECT_DOGFOOD_FINDINGS.md` only for sanitized historical evidence and `docs/CODEX_TASKS.md` only for accepted or completed implementation work.

Do not store secrets, hosted URLs, project IDs, row data, cookies, request headers, or sensitive screenshots in the workbook.
