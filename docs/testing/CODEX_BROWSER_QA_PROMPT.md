# Codex Browser QA Prompt

Paste this into Codex when you want a realistic browser dogfood pass without immediate code changes.

```markdown
Run a realistic browser QA / dogfood pass for this repo.

Goal:
Test the app like a real target user, not just a happy-path click script. Use Playwright and browser workflows where useful. Document friction clearly. Do not change app code, tests, docs, package files, migrations, env files, or config unless I explicitly ask after the findings.

First inspect the repo:
- README and setup docs
- package.json scripts
- Playwright config and existing e2e specs
- app route structure
- current product/MVP/readiness/dogfood docs
- AGENTS.md and docs/testing/DOGFOOD_TESTING.md

Run or prepare the app using repo-local commands. Prefer localhost and isolated local test data. Do not use real payments, real purchases, personal accounts, destructive actions, production data, hosted secrets, cookies, hosted URLs, or cloud mutations unless I explicitly scope that path.

Use existing repeatable checks as a baseline when practical:
- npm run test:e2e

Then perform exploratory browser QA with realistic user goals. Infer app-specific scenarios from the repo docs. For Boardsmith, include scenarios around project intake, dashboard idea drafting, wall-shelf planning, planter-box planning, project library search/filter/archive/restore, notes/build log, plan history/revision lifecycle, and Browser Print Plan readability. Include mobile-width checks when the flow has dense packet content or print/readability risk.

Extra scenarios I want you to include:
<paste extra scenarios here, or leave blank>

For every scenario, record:
1. Scenario name
2. Exact user goal
3. Environment and data mode used
4. Steps taken
5. Where a real user would hesitate
6. Exact page/feature involved
7. What information was missing, vague, misleading, or too late
8. Whether the issue repeated in another scenario
9. Severity:
   - Must fix before private MVP/demo
   - Should fix soon
   - Nice later
   - Not a real issue / leave alone
10. Suggested narrow implementation pass
11. Confidence level: high, medium, or low

Classify findings carefully:
- Do not treat one-off confusion as a product problem.
- Do not recommend broad refactors.
- Do not weaken safety/review boundaries to make a flow pass.
- Do not propose app-generated PDF/export, CAD/CNC, shopping/vendor/pricing, public sharing, auth, package installs, migrations, or hosted/cloud changes unless the evidence directly supports asking me for a separate scoped decision.
- If no repeated issue appears, say to leave the app alone.

Final response format:

## Commands Run

## Scenarios Tested

## Issues Found

Group by:
- Must fix before private MVP/demo
- Should fix soon
- Nice later
- Not a real issue / leave alone

For each issue include:
- page/flow tested
- exact user goal
- what happened
- why it matters
- suggested fix
- confidence level

## Screenshots / Traces

List any generated artifact paths and whether they are ignored. Do not include sensitive hosted data.

## Recommended Next Implementation Batch

Keep this small and evidence-based. If findings do not justify implementation, say so.

## Verification Status

State what passed, what failed, and what was not run.
```

## Notes For Boardsmith

Boardsmith is a private MVP woodworking planning app. Current guardrails:

- Plans are planning aids only.
- Browser print is the supported output path.
- Do not imply PDF/export/download, CAD/CNC, engineering approval, load rating, wall-safety guarantee, child-safety certification, shopping, vendor, pricing, cart, public sharing, or production auth.
- Wall shelves are the strongest deterministic packet path.
- Planter boxes have bounded deterministic packet support and should stay review-first.
- Let repeated private-use friction choose implementation work.
