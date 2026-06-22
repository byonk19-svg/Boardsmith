<!-- AUTONOMY DIRECTIVE - DO NOT REMOVE -->
YOU ARE AN AUTONOMOUS CODING AGENT.

PRIMARY OBJECTIVE:
Complete the entire feature or task, not just a safe subset. Work in verified slices, continue to the next highest-impact gap after green checks, and stop only when the requested end state is genuinely complete.

PROJECT CONTEXT:
Boardsmith is a private MVP woodworking planning app. It uses deterministic templates and schema-validated AI output to produce cautious, reviewable woodworking and craft project plans.

RULES:
- Use TypeScript throughout.
- Keep tasks narrow and verified.
- Preserve woodworking safety rules and review warnings.
- Use structured AI output; never persist unvalidated JSON.
- Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check` before committing.
- Do not introduce migrations or packages without calling them out.
- Do not add hidden external services.
- Commit only verified work.
- Do not add payments, marketplace features, Etsy automation, FreeCAD, 3D CAD, image generation, file export, auth, public sharing, or subscriptions unless explicitly requested.
- Stop and ask before adding paid dependencies, auth, major database architecture changes, FreeCAD, file export, image upload, public sharing, or payment logic.

SAFETY RULES:
- Generated plans must include safety disclaimers and user-review warnings.
- Do not make structural or load-bearing guarantees.
- Flag wall mounting, child/baby use, chairs, stools, benches, ladders, platforms, heavy shelving, electrical/lighted signs, outdoor load exposure, unclear dimensions, and missing material thickness for extra review.
- Do not generate unsafe tool instructions for minors.
- Do not recommend bypassing guards or PPE.
- Include stud/anchor cautions for wall-mounted work.
<!-- END AUTONOMY DIRECTIVE -->

## Browser QA instructions

Use Playwright MCP to test the app like a realistic first-time user.
Use regular Playwright tests for repeatable regression coverage.

Primary goal:
Find repeated UX/product-planning friction in Boardsmith, especially around:
- board length/count decisions
- bracket/fastener guidance
- buying plan usefulness
- checklist clarity
- build-step clarity
- connection/joinery confusion for planter ideas

Do not make code changes during the exploratory pass.
First produce findings, then make narrow implementation passes only after repeated issues are confirmed.

Use realistic project scenarios. Prefer concrete dimensions, constraints, and user goals.

For every scenario, record:
1. Scenario name
2. User goal
3. Steps taken
4. Point where a real user would hesitate
5. Exact page/feature involved
6. What information was missing or too vague
7. Whether the issue repeated in another scenario
8. Severity: low, medium, high
9. Suggested narrow implementation pass

Do not treat one-off confusion as a product problem. Only escalate issues that repeat across scenarios or block project completion.

Do not use real payments, real purchases, real accounts, or destructive actions.
Use staging, localhost, or non-critical test data only.

At the end, produce:
- UX friction report
- repeated-annoyance summary
- recommended implementation passes
- candidate Playwright regression tests

### Playwright MCP setup

Codex autonomous browser exploration should use Playwright MCP with an isolated browser profile. If no local Codex config is already present, prefer documenting this setup instead of committing developer-specific config:

```toml
[mcp_servers.playwright]
command = "npx"
args = ["-y", "@playwright/mcp@latest", "--isolated"]
tool_timeout_sec = 120
```

Use `npm run test:e2e` for repeatable smoke/regression coverage before relying on exploratory MCP findings.

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Agent skills

### Issue tracker

Issues and PRDs for this repo are tracked in GitHub Issues for `byonk19-svg/Boardsmith`. See `docs/agents/issue-tracker.md`.

### Triage labels

Use the default Matt-style triage label vocabulary. See `docs/agents/triage-labels.md`.

### Domain docs

This is a single-context repo with root `CONTEXT.md` and optional ADRs under `docs/adr/`. See `docs/agents/domain.md`.
