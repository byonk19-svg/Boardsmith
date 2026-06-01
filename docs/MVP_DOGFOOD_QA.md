# Boardsmith MVP Dogfood QA

## Date Of Pass

June 1, 2026

## Environment Used

- Local checkout: `C:\dev\boardsmith`
- Branch: `main`
- Baseline commit before pass: `a7a196a`
- Local dev server: existing Next dev server on `http://127.0.0.1:3002`
- `.env.local`: present
- `OPENAI_API_KEY`: present, value not printed
- Supabase env vars: present, values not printed

This pass did not create new projects, invoke OpenAI, or write Supabase data. The dogfood evaluation used the current app routes, current intake UI, existing generated project data, and code/documentation inspection. Live generation for the five dogfood scenarios should be a separate isolated test run if we want to spend OpenAI calls and create test records.

## Routes Checked

- `/` returned 200.
- `/projects` returned 200.
- `/projects/new` returned 200.
- `/settings` returned 200.
- `/projects/08aab8f9-a0c7-4d2c-86e7-eeede1bcedba` returned 200.
- `/projects/08aab8f9-a0c7-4d2c-86e7-eeede1bcedba/print` returned 200.

The generated project detail page showed Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and a browser print preview link. The print preview route showed Browser print preview, Plan Review, Export Readiness, planning-aid disclaimers, and no-export copy.

## Scenarios Tested

### 1. Small Wall Shelf For A Bathroom

Likely project type: `simple_shelf`

What worked:

- Intake examples explicitly include a small wall shelf for a bathroom.
- The form asks for finished dimensions, material thickness, material type, available tools, style notes, and intended use.
- Safety review should flag wall mounting when the title, style notes, or intended use mentions wall, mounted, anchor, or stud.
- Simple shelf template hints include wall mounting, brackets, anchors, studs, and load-rating caution.
- Existing generated shelf data exercises Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and browser print preview.

Risk or confusion:

- No blocker found.
- The user still needs to supply fastener and wall details manually; Boardsmith does not verify load capacity.

Severity: No issue.

### 2. Simple Toddler Book Ledge

Likely project type: `simple_shelf`

What worked:

- Intake examples explicitly include a simple toddler book ledge.
- The intake guidance asks for baby, kid, wall-mounted, or outdoor use.
- Safety review should flag child or baby use when toddler, kid, child, baby, crib, or nursery appears in title/style/intended use.
- Shelf template guidance should also flag wall mounting and load-rating limits if the ledge is wall-mounted.

Risk or confusion:

- The current UI supports the caution path, but this scenario should be treated as extra-sensitive because it combines child use, wall mounting, and possible book load.
- Before export work, this exact scenario should get a live generation dogfood run to confirm the generated plan never implies child safety certification or load rating.

Severity: Should fix before more exports, as a test coverage/process gap rather than an app blocker.

### 3. Basic Outdoor Planter Box

Likely project type: `planter_box`

What worked:

- Intake examples explicitly include a basic outdoor planter box.
- Planter box template hints call out outdoor finish, drainage, rot-resistant material or liner, soil/water weight, and weather-safe fasteners.
- Safety review should flag outdoor exposure for planter box projects or outdoor/weather terms.
- Material Summary and Cut List Review are the right review surfaces for missing material, drainage, and piece clarity.

Risk or confusion:

- No blocker found.
- The app cannot verify rot resistance, drainage quality, fastener suitability, or loaded weight.

Severity: No issue.

### 4. Cordless Lamp Riser For A Bookshelf

Likely project type: `simple_shelf` or `wood_sign`, depending on shape.

What worked:

- Intake examples explicitly include a cordless lamp riser for a bookshelf.
- The app asks for material thickness, dimensions, tool list, style notes, and intended use, which are enough for a small riser plan.
- Safety review flags electrical or lighted projects for terms such as electric, electrical, lighted, lighting, LED, wire, wiring, battery, neon, and light fixture/socket phrases.

Risk or confusion:

- The word "lamp" alone does not appear to trigger the electrical/lighted safety flag. That may be acceptable for a purely wooden riser, but it is worth watching during live generation because users may expect lamp-related caution.
- The app should not provide electrical instructions for the lamp itself.

Severity: Nice to improve later.

### 5. Wall-Mounted Towel Rack Or Similar Safety-Sensitive Project

Likely project type: no perfect current fit; closest current choices are `simple_shelf` or `wood_sign` depending on design.

What worked:

- Safety review should flag wall mounting if the user writes wall, mounted, mount, hang, anchor, or stud.
- Existing wall-mounted shelf data shows wall mounting and load-capacity disclaimers in review surfaces.
- Browser print preview keeps planning-aid and no-export copy visible.

Risk or confusion:

- A towel rack is hardware-heavy and not exactly one of the current supported project types. Users can probably model a simple rail/backer concept, but the app should not imply it handles hardware strength or repeated pull loads.
- Before exports, the MVP should either keep this scenario framed as a cautionary unsupported-adjacent example or add clearer copy that hardware-heavy wall fixtures need manual review.

Severity: Should fix before more exports.

## What Worked Well

- Project intake copy already uses practical, realistic examples.
- The form asks for the right core planning inputs: dimensions, thickness, material, tools, style, and intended use.
- Template Guidance is clear that templates are planning guidance, not finished plans.
- Safety copy appears consistently on project detail and print preview surfaces.
- Plan Review and Export Readiness separate current quality checks from future export readiness.
- Material Summary and Cut List Review make generated plans easier to inspect before building.
- The browser print preview route is enough for private MVP paper-copy review.
- No PDF/export/download language appears to overpromise current capability in the checked pages.

## Issues Found

### Blocker

- None found in this pass.

### Should Fix Before More Exports

- Run live generation dogfood for all five scenarios in an isolated environment before adding PDF/export work. This pass did not generate new plans because it avoided cloud writes and OpenAI spend.
- Clarify how users should treat hardware-heavy wall fixtures such as towel racks. Current project types can approximate the project, but repeated pull loads and mounting hardware are outside Boardsmith's verified planning ability.
- Dogfood the toddler book ledge with live generation before export work. It combines child use, wall mounting, and load assumptions, so generated output needs especially cautious copy.

### Nice To Improve Later

- Consider adding "lamp" to electrical/lighted safety matching only if live generation shows users interpret lamp risers as electrical projects rather than purely wooden stands.
- Consider a small print-preview polish pass if manual browser printing shows pagination or section-break rough edges.
- Consider a small examples/readme note mapping realistic dogfood scenarios to the closest supported project type.

## Generate Plan Findings

`OPENAI_API_KEY` is present locally, but this pass did not invoke OpenAI. The reason is scope control: this was a docs/QA task with guardrails against cloud/app changes, and generating plans through the app would create new persisted records.

Existing generated project data still confirms that the generated-plan review surfaces render:

- latest generated plan
- Plan Review
- Export Readiness
- Material Summary
- Cut List Review
- Printable Plan Sheet
- plan history
- browser print preview

Recommended follow-up if we want deeper confidence: run a separate live dogfood generation task using an isolated local fallback data file or an explicitly approved Supabase test namespace.

## Recommendation

Keep browser print as the MVP path. Do not add app-generated PDF yet.

Next, choose one of these:

1. Run an isolated live dogfood generation sweep for the five realistic scenarios.
2. Do a small print-preview polish pass only if manual browser printing reveals layout issues.
3. Defer app-generated PDF until after the dogfood generation sweep confirms the generated plans are consistently clear, cautious, and reviewable.

Do not proceed to PDF/export complexity based on this pass alone.
