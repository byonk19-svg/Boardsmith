# Boardsmith Live Generation Dogfood QA

## Date Of Pass

June 1, 2026

## Environment Used

- Local checkout: `C:\dev\boardsmith`
- Branch: `main`
- Baseline commit before pass: `a94a764`
- Local dev server: existing Next dev server on `http://127.0.0.1:3002`
- `.env.local`: present
- `OPENAI_API_KEY`: present, value not printed
- Supabase env vars: present, values not printed
- Persistence mode: Supabase-backed
- Live OpenAI generation: available and invoked

No secrets, generated local JSON data, screenshots, or artifacts were committed. The only runtime data created by this pass was a clearly prefixed set of Supabase dogfood projects and any generated plan records listed below.

## Route Smoke

- `/` returned 200.
- `/projects` returned 200.
- `/projects/new` returned 200.
- `/settings` returned 200.
- Each dogfood project detail route returned 200.
- Each dogfood project print preview route returned 200.

For projects without a saved plan, the detail and print routes loaded gracefully, but the full Printable Plan Sheet, Cut List Review, Plan Review, and Export Readiness content only appeared when a validated plan was present.

## Scenario Results

| Scenario | Project id | Project type | Generate result | Plan ids | Notes |
| --- | --- | --- | --- | --- | --- |
| Small wall shelf for a bathroom | `09904e62-f376-4f90-a851-c6b6565be89e` | `simple_shelf` | Blocked before save | None | Deterministic quality checks rejected the generated output for unverifiable safety, structural, child-safety, or load-capacity claims. A regeneration attempt hit the same blocker. |
| Simple toddler book ledge | `94c999ce-cec6-4e90-a902-449a4a0df394` | `simple_shelf` | Blocked before save | None | Deterministic quality checks rejected the generated output for unverifiable safety, structural, child-safety, or load-capacity claims. This is the right failure mode for unsafe confidence, but too frequent for a realistic MVP scenario. |
| Basic outdoor planter box | `ea850a2d-ac17-46ef-959b-eef922884124` | `planter_box` | Blocked before save | None | Deterministic quality checks rejected the generated output for unverifiable safety, structural, child-safety, or load-capacity claims. The project remained draft and no invalid plan was persisted. |
| Cordless lamp riser for a bookshelf | `4f22a378-fff5-44ea-ac05-4c319f22c7ef` | `simple_shelf` | Saved once, regeneration blocked before save | `143b0aa2-090c-4f3d-ac50-17a5d653930b` | First generation validated and saved with stored `build_model_json`. Regeneration was blocked before save, so the existing latest plan remained intact. |
| Wall-mounted towel rack | `abd5abf7-8668-4851-a6ff-bbd93c448397` | `wood_sign` | Blocked before save | None | Deterministic quality checks rejected the generated output for unverifiable safety, structural, child-safety, or load-capacity claims. |

## Validation And Persistence Findings

- Live OpenAI calls completed and returned structured responses.
- Generated output was validated before save.
- Four of five scenarios failed deterministic quality checks and were not saved.
- The successful lamp-riser plan saved to Supabase with `validation_status` set to `valid`.
- The successful plan stored `build_model_json`.
- The successful plan became the latest plan for its project.
- A later failed regeneration did not overwrite the saved plan.
- A true two-version plan history was not produced in this pass because the regeneration attempt was correctly blocked before save.

## Successful Plan Snapshot

Saved plan:

- Project: `Dogfood 20260601 - Cordless Lamp Riser`
- Project id: `4f22a378-fff5-44ea-ac05-4c319f22c7ef`
- Plan id: `143b0aa2-090c-4f3d-ac50-17a5d653930b`
- Model: `gpt-4.1-mini`
- Confidence: `low`
- Build model stored: yes
- Build model pieces: 1
- Build model materials: 1
- Build model operations: 1
- Plan materials: 3
- Plan cut-list items: 1
- Assembly steps: 5
- Safety notes: 6
- Assumptions: 4
- Build-model unresolved questions: 2

The saved plan rendered the project detail page, Plan Review, Export Readiness, Material Summary, Cut List Review, Printable Plan Sheet, and `/projects/[id]/print` browser print preview. Planning-aid language was visible on the generated project detail and print preview routes.

## What Worked Well

- The app protected persistence: invalid or overconfident generated plans were blocked before save.
- The error path was graceful: blocked generations redirected back to the project detail page with a visible quality-check error and the Generate Plan action still available.
- Supabase-backed project creation, detail loading, and saved plan loading worked.
- The saved plan retained its stored build model and rendered all current review layers.
- Material Summary, Cut List Review, Plan Review, Export Readiness, Printable Plan Sheet, and browser print preview were readable for the saved plan.
- Safety disclaimers were prominent on generated plan surfaces.

## Issues Found

### Blocker

- None for data integrity. The app did not persist unvalidated or quality-blocked AI output.

### Should Fix Before More Exports

- Four of five realistic MVP scenarios failed deterministic quality checks because the generated output made claims Boardsmith cannot verify. This is safe, but it means live generation is not yet reliable enough to justify PDF/export work.
- The successful cordless lamp riser plan mixed in wall brackets and wall mounting language even though the intake described a freestanding riser. This appears to come from using `simple_shelf` as the closest current type and its wall-mounting template assumptions.
- The lamp riser also picked up electrical/lighted review because it mentioned a lamp, even though the intake explicitly said no wiring or electrical work. The caution is safe, but the output should better distinguish a wooden stand from electrical instructions.
- Plan history preservation was only partially exercised: a saved plan survived a blocked regeneration, but two successful saved generations were not produced in this pass.

### Nice To Improve Later

- No-plan print preview routes load, but they naturally do not show the full review sections. A small no-plan message could make this route clearer if users open it before generation.
- Hardware-heavy wall fixtures such as towel racks still fit awkwardly into current project types. The MVP can keep supporting them cautiously, but copy should continue to frame them as manual-review-heavy.
- The detail-page error copy is accurate, but it is technical enough that a small plain-language wrapper could help non-technical users understand that Boardsmith blocked an unsafe or overconfident plan on purpose.

## AI Output Quality Notes

- The successful plan was useful as a reviewable woodworking planning aid: it included a summary, materials, tools, a cut list, assembly steps, finishing steps, safety notes, assumptions, and unresolved questions.
- The successful plan was appropriately low confidence.
- The cut list was simple and reviewable, but the plan added wall mounting hardware that did not fit the freestanding use case.
- The failed plans suggest the model often uses safety/load language that trips the deterministic blocker. That blocker should stay strict; the next work should align the prompt/model instructions to avoid unverifiable claims.

## Build Model Quality Notes

- Stored build model JSON worked for the saved plan.
- The build model produced one shelf-board piece, one material, one inspect operation, safety flags, disclaimers, export-readiness notes, and unresolved questions.
- The model was structurally usable for future printable/export manifest work.
- The main weakness is template fit: `simple_shelf` assumes wall mounting, which is not always true for shelf-like risers or stands.

## Print Preview And Manual Use Notes

- Browser print preview loaded for all dogfood project ids.
- The generated lamp-riser print preview included Plan Review, Export Readiness, Cut List Review, assumptions, safety notes, and planning-aid disclaimers.
- Browser print remains the right MVP path.
- App-generated PDF/export should stay deferred until live generation is more reliable across these scenarios.

## Recommendation

Do not start app-generated PDF/export work yet.

The next product task should be a narrow prompt/model alignment pass for live generation quality:

1. Keep deterministic quality checks strict.
2. Adjust generation instructions so the model avoids unverifiable safety, structural, child-safety, and load-capacity claims.
3. Teach generation to treat template hints as guidance, not mandatory wall-mounting behavior when intake says the item is freestanding.
4. Preserve schema validation and "never persist unvalidated output."
5. Re-run this same live dogfood sweep after the alignment pass.

Only after these scenarios reliably produce cautious, validated, useful plans should Boardsmith revisit app-generated PDF/export work.

## Task 32A Retry Notes

After the prompt/model alignment pass, a live retry used `Dogfood Retry 20260601 - ...` Supabase-backed records.

| Scenario | Retry project id | Retry result | Retry plan id | Notes |
| --- | --- | --- | --- | --- |
| Small wall shelf for a bathroom | `c322f2e2-7c24-447b-ae58-8a77c38f0254` | Blocked before save | None | Still blocked for unverifiable safety, structural, child-safety, or load-capacity claim wording. |
| Simple toddler book ledge | `2d16c87e-a9b2-4e78-befa-2e377481fa2b` | Blocked before save | None | Still blocked for missing deterministic review flags and unsafe overclaim wording. |
| Basic outdoor planter box | `aec388f0-7fe7-41a6-be63-c948cd7c040e` | Saved | `c6bfe719-81dc-4466-a74f-e8b53787c93f` | Valid plan saved with stored `build_model_json`, outdoor review flags, five modeled pieces, and five cut-list items. |
| Cordless lamp riser for a bookshelf | `ac95804f-aff8-4911-8a74-24a978fa0256` | Saved | `9b9cc88c-9ea3-4072-b33a-b61bbafcf9cd` | Valid plan saved. The retry correctly avoided wall-mounting flags, wall hardware, brackets, anchors, studs, and wall-mounting steps for the freestanding riser. |
| Wall-mounted towel rack | `65aea843-edf8-442b-9a84-e8e8bce96d9b` | Saved | `9d0b9a7a-3a19-413d-ad74-4e03688f35b9` | Valid plan saved with wall-mounting review and manual hardware review. |

The retry improved the saved-plan rate from one of five to three of five without weakening Zod validation or deterministic quality checks. The remaining gap is concentrated in safety-sensitive shelf scenarios, especially wall shelf and toddler book ledge wording. PDF/export work should remain deferred until those two scenarios also pass with cautious, useful, reviewable plans.

## Task 36A Wall-Mounted And Child-Adjacent Retry Notes

After the atomic Supabase generated-plan save migration was applied to cloud, a narrow wall-mounted and child-adjacent alignment pass focused on the two remaining blocked scenarios. The changes preserved strict Zod validation and deterministic quality checks, and improved prompt/build-model grounding instead of weakening any safety gate.

| Scenario | Retry project id | Retry result | Retry plan id | Notes |
| --- | --- | --- | --- | --- |
| Bathroom wall shelf | `618c6de9-f298-4251-a670-97e3de767b06` | Saved | `204330cb-a687-4704-bd38-f01cac96f694` | Valid plan saved with stored `build_model_json`, wall-mounting review, bathroom humidity/finish review, and manual stud/anchor/fastener/load-use cautions. Detail and print preview routes rendered. |
| Toddler book ledge | `db07ceb6-2afd-4333-bf6a-188eba63a1a7` | Blocked before save | None | First Task 36A retry still made overclaim wording that deterministic quality checks rejected. The project remained draft and no invalid plan was persisted. |
| Toddler book ledge | `6349a21c-6409-4510-858b-739329a26ab9` | Saved | `266cddc2-7b23-419f-a65b-c564ee254bc7` | Valid plan saved after adding stricter child-adjacent wording guidance. The generated plan kept manual child-use, mounting, finish, edge, supervision, and inspection review language without claiming child safety. Detail and print preview routes rendered. |

The pass improved the remaining two blocked scenario families to saved, reviewable plans while preserving safety behavior. A blocked toddler retry during the pass confirmed that invalid or overconfident child-adjacent output is still rejected before persistence.
