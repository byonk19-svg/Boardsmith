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
