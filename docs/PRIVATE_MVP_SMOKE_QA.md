# Private MVP Smoke QA

Date: June 2, 2026

## Purpose

This pass verifies the current private MVP baseline across the features most likely to break together: private access gating, Supabase-backed project persistence, notes, duplicate project behavior, generated-plan saving, blocked-generation feedback, review surfaces, and browser print preview.

This is a QA/status document only. It does not add product features.

## Environment

- Local production server: `next start`
- Supabase mode: cloud-backed Supabase project
- OpenAI mode: `OPENAI_API_KEY` present
- Access gate mode:
  - no `BOARDSMITH_ACCESS_PASSWORD` for normal local smoke
  - temporary test-only `BOARDSMITH_ACCESS_PASSWORD` for gated-route smoke
- Local JSON fallback: not exercised in this combined pass

Environment variables were checked for presence only. Secret values were not printed.

## Route Smoke

| Route | Result |
| --- | --- |
| `/` | Passed |
| `/projects` | Passed |
| `/projects/new` | Passed |
| `/settings` | Passed |
| Existing generated project detail routes | Passed |
| Existing generated project print preview routes | Passed |

## Access Gate Smoke

With `BOARDSMITH_ACCESS_PASSWORD` unset, local development remained directly usable.

With a temporary test password set:

- Protected project routes redirected to `/access` without a valid cookie.
- Wrong password was rejected and did not set an access cookie.
- Correct password set an HTTP-only access cookie.
- The cookie did not contain the raw password.
- Project list, project creation, project detail, and print preview routes loaded after access.
- Generate, notes, and duplicate POST routes were protected without the access cookie.

Result: passed.

## Project Notes Smoke

Cloud-backed project note behavior was verified with a clearly labeled smoke project.

- A note was saved on the project detail page.
- Reloading the project detail page showed the saved note.
- Duplicating the project created a new project without copying the note.

Result: passed.

## Duplicate Project Smoke

Duplicating a cloud-backed project created a new draft project using the original intake details.

- New title indicated it was a copy.
- New status was draft/new-project appropriate.
- Generated plans and plan history were not copied.
- Notes were not copied.
- Generate Plan remained available on the duplicate.

Result: passed.

## Generate Plan Smoke

Two generation paths were exercised.

### Blocked Generation Feedback

A duplicate project generation attempt was blocked by deterministic review checks.

- The request redirected back to the project detail page with `generation_error=review_blocked`.
- The page showed calm blocked-generation feedback.
- The page stated that no plan was saved.
- Raw internal messages such as Zod/schema parse details or deterministic quality exception text were not shown.
- No invalid generated plan was persisted.

Result: passed. This is expected safety behavior.

### Successful Generation

A new cloud-backed `wood_sign` smoke project generated and saved a valid plan.

- Generation redirected with `generated=1`.
- Latest generated plan rendered.
- Stored build model was displayed.
- Plan Review rendered.
- Export Readiness rendered.
- Material Summary rendered.
- Cut List Review rendered.
- Printable Plan Sheet rendered.
- Browser print preview route rendered.

Result: passed.

## Print Preview Smoke

The browser print preview route rendered the generated plan using the current printable-plan manifest surfaces.

Confirmed visible sections included:

- project summary
- material summary
- cut-list review
- build steps / operations
- safety notes
- assumptions and unresolved questions where present
- Plan Review
- Export Readiness
- planning-aid disclaimers

The page includes negative-scope copy that says no file export, download, CAD, CNC, SVG, DXF, or PDF pipeline is available. No app-generated PDF, download button, SVG/DXF, CAD, or CNC behavior was found.

Result: passed.

## Issues Found

No blocking issues were found in this combined private MVP smoke pass.

Observed expected behavior:

- Generation can still be blocked when deterministic safety/review checks reject the AI output.
- Blocked output is not saved, which preserves the quality and safety gates.

## Caveats

- This pass used cloud-backed Supabase persistence and did not re-test local JSON fallback.
- This pass did not run a full five-scenario live generation dogfood sweep.
- The private MVP access gate is a temporary password gate, not full authentication or multi-user authorization.
- Browser print preview exists, but app-generated PDF/SVG/DXF/CAD/CNC export does not.
- Boardsmith remains a planning aid. Users must verify dimensions, materials, mounting, load assumptions, and safety before cutting or building.

## Recommended Next Task

If Boardsmith will be deployed or shared, the next task should be a hosting/deployment readiness pass:

1. Verify production environment variables are configured.
2. Confirm `BOARDSMITH_ACCESS_PASSWORD` is set in the hosting environment.
3. Confirm Supabase service-role access remains server-only.
4. Confirm public routes, protected routes, POST routes, and print preview behave correctly on the hosted URL.
5. Confirm no secrets or runtime data are exposed.

Do not start PDF/export work until the private deployment surface is verified.
