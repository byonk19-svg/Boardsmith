# Boardsmith PDF Export Spike Plan

## Recommendation

Do not implement app-generated PDF yet. The current MVP should continue using browser print preview at `/projects/[id]/print`.

If app-generated PDF is approved as the next implementation slice, the lowest-risk first spike is a server-side HTML-to-PDF proof using the existing printable manifest and the existing print-preview layout concepts. That spike should be small, read-only, and reversible. It should not add SVG, DXF, CAD, CNC, shopping, pricing, vendor, inventory, auth, public sharing, payments, subscriptions, or new project types.

## Current Repo Findings

- `createPrintablePlanManifest` already gathers the data future exports need.
- `/projects/[id]/print` already renders a browser-readable print preview from the manifest.
- The repo currently has no PDF generation package.
- The repo currently has no Playwright, Puppeteer, React PDF, or file-generation dependency.
- The current route/test structure already supports server-rendered project pages and route rendering tests.

## Approach Decision

### Keep Browser Print As Current MVP

Browser print remains the safest current approach.

Use it when:

- the user only needs a paper copy or browser save-as-PDF
- no app-owned PDF artifact is required
- dependency risk should stay at zero
- exact pagination is not a product requirement

This is the current state and requires no code changes.

### Recommended First App-Generated PDF Spike

If app-generated PDF is approved, use a server-side HTML-to-PDF spike that consumes `createPrintablePlanManifest`.

This is preferred over client-side PDF generation because:

- it keeps output generation server-controlled and easier to test
- it can reuse the existing manifest and print-preview rendering shape
- it avoids bloating the client bundle
- it keeps generated output detached from browser-only DOM state

This is not approved by this plan. It should be a separate implementation task with explicit package approval.

### Not Recommended First

Client-side PDF generation is not recommended first. It would likely add bundle weight, browser-specific layout problems, and a temptation to generate from rendered DOM instead of the manifest.

Markdown or text export is not recommended as the first PDF step. It is useful as a fallback if PDF dependency risk is rejected, but it does not answer whether Boardsmith can create a readable PDF-style woodworking plan.

SVG, DXF, CAD, and CNC are not first-step candidates. The current MVP does not guarantee geometry, machining constraints, tolerances, nesting, kerf, fastener placement, load capacity, or machine-safe paths.

## Package Decision

No package should be added in this planning pass.

If the server-side PDF spike is approved, evaluate adding Playwright or a similarly explicit Chromium-backed renderer. This requires approval because it is a large dependency with runtime and deployment implications.

Do not add a PDF package just to test feasibility without an implementation task. The next task should first decide whether the dependency risk is acceptable.

## Runtime And Deployment Risks

Server-side HTML-to-PDF risks:

- Chromium or renderer binary size.
- Windows/local installation differences.
- Hosted deployment compatibility.
- Cold-start and memory use.
- Temporary-file cleanup if files are ever written.
- Long-running requests for large plans.
- Font and print CSS differences between local and hosted renderers.
- Accidental download or storage behavior beyond the approved scope.

Security risks:

- PDF generation must use trusted internal manifest data, not arbitrary URLs.
- The renderer must not browse user-provided external URLs.
- The route must not expose service-role secrets.
- The route must not persist unvalidated AI output.
- The route must not create public sharing semantics.

## Manifest Consumption

The future PDF implementation should:

1. Load the project by id through the existing repository layer.
2. Load generated plans through the existing repository layer.
3. Select the latest generated plan.
4. Use saved `build_model_json` when available.
5. Use the derived compatibility build model for older plans only when needed.
6. Call `createPrintablePlanManifest`.
7. Render from manifest sections, not from project detail page DOM.
8. Include Plan Review, Export Readiness, Material Summary, Cut List Review, safety notes, assumptions, unresolved questions, and disclaimers.

Do not change the generated plan schema unless a real missing-data case is discovered during the spike.

## Future Route Or Action

Preferred future route shape:

- `GET /projects/[id]/pdf`

Reasons:

- read-only semantics
- easy manual smoke target
- clear separation from `/projects/[id]/print`
- no form mutation
- no server action dependency

The route should return a PDF response only when app-generated PDF is intentionally implemented. Until then, do not add this route.

## File Naming

Recommended future filename:

```text
boardsmith-{project-slug}-{plan-id-short}-{YYYYMMDD}.pdf
```

Rules:

- lowercase slug
- ASCII letters, numbers, and hyphens only
- include short plan id so regenerated plan versions do not collide
- include date for human sorting
- do not include private keys, user emails, or environment names

Example:

```text
boardsmith-bathroom-wall-shelf-plan_saved-20260601.pdf
```

## First PDF Content

Include:

- project title and project type
- generated plan metadata
- project summary
- materials summary
- cut-list review
- operations and build steps
- safety notes and safety flags
- assumptions and unresolved questions
- Plan Review status and top messages
- Export Readiness status and top messages
- planning-aid disclaimers
- future export notes only if worded as readiness notes

Exclude:

- SVG diagrams
- DXF/CAD/CNC output
- machine instructions
- nesting or optimization
- shopping list generation
- pricing
- vendor links
- inventory
- public sharing links
- payment or subscription prompts
- image upload or generated imagery

## Safety Disclaimers Required

Every app-generated PDF must visibly include:

- Boardsmith plans are planning aids, not professional engineering reviews.
- Review all dimensions, materials, hardware, tool setup, and site conditions before cutting or building.
- Boardsmith cannot verify load capacity, wall safety, material condition, or user skill.
- Wall-mounted work requires fastener, anchor, and stud review.
- This PDF is not a production fabrication file.
- This PDF is not CNC-ready output.

These disclaimers should be present even when Plan Review passes.

## Tests To Add When Implementation Starts

Before or during the implementation task:

- manifest unit test covering the exact PDF input shape
- route test for the future PDF route success path
- route test for missing project
- route test for project with no generated plan
- route test for older generated plan without saved `build_model_json`
- assertion that PDF output includes planning-aid disclaimers
- assertion that PDF output includes Plan Review and Export Readiness
- assertion that unvalidated or missing generated plans are not exported
- smoke test proving `/projects/[id]/print` still works and remains no-download

If a real binary PDF is generated:

- test response `Content-Type`
- test `Content-Disposition` filename
- test non-empty PDF bytes
- test that generated bytes do not require storing files on disk

## Out Of Scope

- No implementation in this task.
- No package installation in this task.
- No migrations.
- No Supabase cloud changes.
- No OpenAI prompt, model, or schema changes.
- No new route in this task.
- No button or link in this task.
- No download behavior in this task.
- No app-generated PDF in this task.
- No SVG, DXF, CAD, FreeCAD, CNC, image upload, auth, payments, public sharing, marketplace, subscriptions, or new project types.
- No shopping list, pricing, vendor links, inventory, or purchasing behavior.

## Next Decision

Current decision after `private-mvp-0.2`: stay with browser print for the MVP and do not add app-generated PDF.

Before any future implementation, explicitly decide one of these:

1. Stay with browser print for the MVP and polish `/projects/[id]/print` only if manual use reveals issues.
2. Approve a narrow server-side HTML-to-PDF spike and approve the specific renderer dependency.
3. Reject PDF dependency risk for now and consider a manifest-to-Markdown/text fallback note instead.
