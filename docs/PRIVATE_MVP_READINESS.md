# Boardsmith Private MVP Readiness

Date: June 3, 2026

## Current Status

Boardsmith is a private MVP woodworking planning app. It is ready for continued private testing and narrow private hosted use behind the chosen access layers, but it is not ready for public sharing or production multi-user use.

The current hosted posture is private-MVP ready: Vercel is linked, required hosted environment variable names are present, and user-supplied authorized hosted browser smoke passed after the project-intake validation fix. Do not share the hosted URL publicly. Share only with intended private users who can pass the active Vercel and/or Boardsmith access layers.

## Private MVP Checkpoint

Checkpoint: `private-mvp-0.1`.

This checkpoint marks the first privately hosted and smoke-tested Boardsmith MVP state. Local MVP dogfood passed, authorized hosted Vercel browser smoke passed, and the current private workflow includes project creation, notes, build log, validated plan generation, review surfaces, duplicate project, project-list indicators, and browser print preview.

This is a rollback/reference point for private MVP testing only. It is not a public launch, not a production multi-user release, and not a claim of engineering review, certification, load rating, fabrication readiness, or export/CAD capability.

## What Works Now

- Project creation from `/projects/new`.
- Hosted project intake accepts normal woodworking values like `12`, `8`, `4`, and material thickness `0.75`.
- Supabase-backed project, generated-plan, notes, duplicate-project, and build-log persistence.
- Local JSON fallback when Supabase env vars are absent.
- OpenAI generated-plan flow when `OPENAI_API_KEY` is present.
- Graceful missing-key and blocked-generation feedback when generation cannot safely save.
- Zod validation before generated plans are persisted.
- Atomic Supabase generated-plan save through `save_generated_plan_atomic(...)`.
- Stored `build_model_json` on generated plan versions.
- Plan history that preserves earlier versions.
- Read-only plan comparison between the latest plan and an older saved version.
- Deterministic Plan Review status.
- Deterministic Export Readiness status for future export work.
- Material Summary grouped for review.
- Cut List Review for missing dimensions, vague pieces, quantity issues, and duplicate-looking pieces.
- Manifest-backed Printable Plan Sheet on the project detail page.
- Browser print preview at `/projects/[id]/print`.
- Duplicate project action that copies intake details without generated plans, notes, history, or build log.
- Project notes.
- Build log fields for completion status, completion date, actual material, plan changes, and lessons learned.
- Optional private access gate through `BOARDSMITH_ACCESS_PASSWORD`.
- Vercel project link and hosted env var name readiness.
- User-supplied authorized hosted smoke for access gate, project creation, notes, build log, generation, review surfaces, duplicate project, project list indicators, and browser print preview.

## What Is Not Verified Yet

- Whether Vercel-level deployment protection, the Boardsmith `/access` gate, or both should be the long-term private hosted access model.
- Hosted behavior after any future deployment, env-var change, migration, or access-gate change until the hosted smoke checklist is rerun.

## Non-Goals And Guardrails

Boardsmith does not currently provide:

- app-generated PDF export
- SVG export
- DXF export
- CAD, FreeCAD, CNC, or router-ready output
- production fabrication files
- engineering review, certification, or load ratings
- wall-mounting guarantees
- child or baby safety certification
- public sharing
- full auth or per-user accounts
- payments or subscriptions
- marketplace, Etsy, shopping, pricing, vendor, purchasing, or inventory features
- image upload

Keep generated plans framed as planning aids only. Users must verify dimensions, materials, fasteners, wall conditions, PPE, tool instructions, finish labels, and fit before cutting or building.

## Local Smoke Checklist

Run this before more product work:

1. Confirm `main` is clean and current.
2. Run `npm install` if dependencies are not current.
3. Configure `.env.local` for the intended mode.
4. Start the app with `npm run dev`.
5. Load `/`.
6. Load `/projects`.
7. Load `/projects/new`.
8. Load `/settings`.
9. Create a clearly labeled smoke project.
10. Confirm the project detail page shows intake, template guidance, Project Structure, safety flags, Material Summary, Cut List Review, and the no-plan state.
11. Save project notes and confirm they persist after reload.
12. Save build-log details and confirm they persist after reload.
13. Duplicate the project and confirm the duplicate has no notes, build log, generated plans, or plan history.
14. Generate a plan if `OPENAI_API_KEY` is present.
15. Confirm validation gates either save a valid plan or show calm blocked feedback without persisting invalid output.
16. Confirm latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and plan history render.
17. Generate a second plan only if safe, then confirm plan comparison appears.
18. Open `/projects/[id]/print` and confirm browser print preview renders planning-aid safety copy.

## Hosted Smoke Checklist

Run this only from the intended hosted access path. Do not commit hosted URLs or screenshots.

1. Open the latest Production deployment from the Vercel dashboard while signed in.
2. Confirm Vercel-level protection behavior is intentional.
3. Confirm the site loads after Vercel authorization.
4. Visit `/projects` before Boardsmith access and confirm it redirects to `/access` if the app-level gate is enabled.
5. Submit a wrong Boardsmith password and confirm it is rejected.
6. Submit the correct `BOARDSMITH_ACCESS_PASSWORD` and confirm access is granted.
7. Confirm the raw password is not visible in the UI, browser URL, or logs.
8. Load `/`, `/projects`, `/projects/new`, and `/settings`.
9. Create a clearly labeled hosted smoke project.
10. Save and reload project notes.
11. Save and reload build-log details.
12. Duplicate the project and confirm notes, build log, generated plans, and history are not copied.
13. Generate one clearly labeled smoke plan if safe.
14. Confirm latest plan, Plan Review, Export Readiness, Material Summary, Cut List Review, plan history, and Printable Plan Sheet render.
15. Open browser print preview and confirm it renders.
16. If generation is blocked, confirm no invalid output is saved and user-facing feedback does not expose raw Zod, schema, stack trace, or internal error details.

## Required Verification Commands

Run before committing app or docs changes:

```bash
npm test
npm run lint
npm run typecheck
npm run build
npm audit --audit-level=moderate
git diff --check
```

## Recommended Next Step

Keep Boardsmith private and continue with small trust-building polish only. Rerun the hosted smoke checklist after any hosted config or deployment change. Do not start app-generated PDF, SVG, DXF, CAD, CNC, shopping, pricing, vendor, inventory, public sharing, or auth-provider work without an explicit task.
