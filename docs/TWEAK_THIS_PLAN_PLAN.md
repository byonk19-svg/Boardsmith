# Tweak This Plan Planning Pass

Date: June 8, 2026

## Purpose

This document scopes the smallest safe private-MVP version of `Tweak this plan` before implementation. It is a planning document only; no app code, schema, migration, package, or prompt change is made by this task.

Boardsmith remains a private woodworking planning aid. A revised plan must not imply professional engineering review, structural approval, wall-safety verification, child-safety certification, load rating, construction approval, fabrication-ready output, CAD readiness, CNC readiness, or export readiness.

## Smallest Useful MVP

The smallest useful first version is a one-shot revision form on the latest generated plan:

1. User opens a project with a latest generated plan.
2. User enters one short plain-English revision instruction.
3. The app sends the project intake, latest generated plan JSON, latest saved build model, and revision instruction to OpenAI as structured context.
4. OpenAI returns a full replacement generated plan JSON using the existing generated-plan schema.
5. The app validates the result with the existing Zod generated-plan schema.
6. The app runs existing deterministic plan-quality checks against the build model.
7. If valid, the app saves the result as a new generated plan version and marks it latest.
8. The original plan remains in plan history.
9. The project detail page redirects to the latest plan with comparison against the prior latest version.

This is not multi-turn chat. It does not edit the old plan in place. It does not create a partial patch format. It does not mutate project intake, archive state, notes, build log, or generated plan history.

## MVP Boundary

The first implementation should be conservative about revision requests that conflict with the saved project intake or latest build model.

Supported for the first version:

- Make the instructions clearer or easier for a beginner.
- Reword or reorganize build steps.
- Add safer manual-review language.
- Add or clarify finishing guidance.
- Reduce complexity only when the resulting cut list still maps cleanly to the existing build-model pieces.
- Emphasize existing safety, material, hardware, or fit checks.

Not fully supported in the first version:

- Changing project dimensions beyond the saved project intake.
- Changing material in a way that conflicts with the build-model material.
- Removing wall mounting when the saved project intake or build model still includes wall mounting.
- Changing project type.
- Adding new structural claims, load expectations, child-safety claims, or mounting guarantees.

If a user asks for a core project change such as `Make it 6 inches deeper`, `Use pine instead of plywood`, or `Remove wall mounting`, the first version should keep the generated plan bounded by the saved project intake and build model. The revised plan can include a calm assumption or needs-review item explaining that the project intake should be updated or duplicated for that core change before building.

## Existing Primitives To Reuse

- `app/projects/[id]/page.tsx`: project detail layout, latest plan rendering, plan history, comparison panel, blocked-generation feedback pattern, and no-print action area.
- `app/projects/[id]/generate/route.ts`: POST route pattern for browser-visible generation mutations.
- `lib/ai/generate-project-plan.ts`: OpenAI Responses structured-output call, JSON schema usage, Zod validation, safety instructions, deterministic build-model context, and quality assertion.
- `lib/storage/project-store.ts`: `listGeneratedPlans`, `saveGeneratedPlan`, local JSON fallback, Supabase RPC-backed atomic latest-plan update.
- `lib/plans/plan-schema.ts`: existing generated plan schema and markdown renderer.
- `lib/plans/plan-quality.ts`: deterministic generated-plan quality checks.
- `lib/plans/plan-comparison.ts`: compare latest plan against an older plan version after saving.
- `lib/build-model/create-build-model-draft.ts`: fallback build model when older latest plans lack saved build-model JSON.
- Existing project detail tests for plan history, comparison, blocked generation feedback, archived project visibility, and forbidden export/CAD/CNC wording.

## Versioning Decision

Revisions should create a new generated plan version. They should never mutate the old plan row.

Reasons:

- Plan history already preserves prior versions.
- Plan comparison already explains practical differences between latest and older versions.
- Atomic save already marks older plans as not latest.
- Keeping old versions makes it safer to compare and recover from a weak revision.
- Mutating old plans would erase review context and make dogfood harder to audit.

For the first implementation, no schema migration is required. The revised plan can be identified through:

- A success banner such as `Revised and saved a new validated plan version.`
- Redirecting with `compare_plan=<priorLatestPlanId>` so the existing comparison panel opens against the prior version.
- A deterministic assumption appended after validation and then re-validated before save, such as `Revision request: <user instruction>`.
- A small `Revised` badge in plan history derived from that deterministic assumption prefix.

If revision provenance becomes important later, add explicit schema fields such as `revised_from_plan_id` and `revision_instruction`. That should be a later task with a migration and storage tests, not the first MVP.

## Revision Input UI

Place the form near the latest generated plan actions on project detail.

Recommended UI:

- Heading: `Tweak this plan`
- Helper copy: `Describe one change. Boardsmith will save a new reviewed plan version and keep this version in history.`
- Textarea label: `Revision note`
- Placeholder examples:
  - `Make the steps easier for a beginner.`
  - `Add more finish and sanding guidance.`
  - `Reduce cuts if it still matches the same project dimensions.`
- Submit button: `Generate revised plan`
- Safety copy near the form:
  - `This does not approve the design or verify safety. Review the new version before cutting or building.`
  - `For new dimensions, material, project type, or mounting changes, update the project intake or duplicate the project first.`

Do not show the form when there is no generated plan. For archived projects, the first version should not show the form and should tell the user to restore the project before generating a revision. This avoids mutating inactive dogfood or smoke-test records by accident while preserving archive as organization-only behavior.

Input constraints:

- Required plain text.
- Trimmed.
- Suggested max length: 500 characters.
- No rich text, files, images, links, or multi-message chat.
- Do not persist the instruction anywhere except as part of the saved revised plan version if using the deterministic assumption-prefix approach.

## Prompt And Context

Add a dedicated generation helper rather than overloading the existing function signature too broadly, for example:

```text
generateRevisedStructuredProjectPlan(project, buildModel, latestPlanRecord, revisionInstruction)
```

The helper should reuse the existing base prompt context from `buildProjectPlanPromptContext(project, buildModel)` and add a `revision_context` object:

- `revision_instruction`: user-entered instruction.
- `previous_plan_id`: latest plan id.
- `previous_plan_created_at`: latest plan timestamp.
- `previous_plan_json`: latest full generated plan JSON.
- `revision_rules`:
  - Return a complete replacement plan, not a patch.
  - Keep the same project type unless the saved project intake changes in a future flow.
  - Keep dimensions bounded by the saved project intake and build model.
  - Keep cut-list pieces and materials mapped to the build model.
  - If the user asks for a change that conflicts with the saved intake or build model, preserve safe bounded values and add the conflict as an assumption or needs-review item.
  - Do not claim professional approval, child safety, wall safety, load rating, fabrication readiness, CAD readiness, CNC readiness, or construction approval.

The OpenAI instructions should remain cautious and structured-output-only. They should not add multi-turn chat behavior, background planning, export language, or project-management promises.

## Validation Before Saving

The revised plan must pass the same gates as a fresh plan:

1. OpenAI output exists.
2. JSON parses.
3. JSON validates against `generatedPlanSchema`.
4. Deterministic quality checks pass with `assertGeneratedPlanQuality`.
5. Any deterministic `Revision request: ...` assumption is appended.
6. The modified plan is parsed again with `generatedPlanSchema`.
7. `saveGeneratedPlan` saves it as a new version.

Invalid or blocked revised output must not be persisted.

Do not loosen schema requirements or deterministic quality checks for revisions. If a user request conflicts with the build model, the failed or constrained revision should be surfaced calmly rather than saved as a weak plan.

## Failure States

Handle these explicitly:

- No project found: redirect to project list with existing project-not-found pattern.
- No latest generated plan: show a calm empty state; user must generate a first plan before tweaking.
- Archived project: do not generate a revision; tell the user to restore the project first.
- Empty revision note: do not submit; show form-level copy.
- Revision note too long: do not submit; show form-level copy.
- Missing `OPENAI_API_KEY`: reuse setup-focused generation feedback.
- OpenAI returns no output: no revised plan is saved.
- OpenAI returns invalid JSON or schema-invalid JSON: no revised plan is saved.
- Deterministic quality checks fail: no revised plan is saved; explain that Boardsmith blocks drafts that fail review.
- Revision conflicts with saved intake or build model: prefer constrained safe output with assumptions; if quality checks fail, save nothing.
- Supabase/local save failure: no success banner; show calm failure feedback.
- Double submit/concurrent submit: current atomic save can preserve latest-plan consistency, but the client form should show a pending state to reduce accidental duplicate revisions.

## Test Coverage Needed

Helper tests:

- Revision prompt context includes project intake, latest plan JSON, latest build model, revision instruction, and safety rules.
- Revision prompt context tells the model to return a complete replacement plan.
- Revision prompt context tells the model to keep dimensions and materials bounded by the build model.
- Revision prompt context forbids approval, load-rating, CAD/CNC/export, and fabrication-ready claims.
- Deterministic revision assumption is appended and re-validated before save if that approach is used.

Route/storage tests:

- Revision route requires an existing project and latest plan.
- Revision route rejects archived projects.
- Empty and overlong revision notes do not call OpenAI.
- Valid revised output calls `saveGeneratedPlan` and creates a new latest version.
- The previous plan remains in history.
- Redirect includes a success state and `compare_plan` for the prior latest plan.
- Invalid schema output is not saved.
- Deterministic quality failure is not saved.
- Missing OpenAI key uses calm generation feedback.

Rendering tests:

- `Tweak this plan` form renders only when a latest plan exists and project is active.
- Form does not render for no-plan state.
- Archived project detail tells the user to restore before tweaking.
- Success banner says a new validated plan version was saved.
- Plan history can show a `Revised` marker if the deterministic assumption-prefix approach is implemented.
- Plan comparison opens against the prior version after a successful revision.
- Copy does not imply delete, data loss, public sharing, professional approval, load rating, CAD, CNC, PDF, SVG, DXF, export, or fabrication readiness.

## Recommended Follow-Up Task

Task 73B should implement the no-schema first slice:

- Add a `Tweak this plan` form for active projects with a latest generated plan.
- Add a POST route for one-shot revision generation.
- Add a revision generation helper that reuses existing prompt context and validation.
- Save the revised plan as a new generated plan version through `saveGeneratedPlan`.
- Preserve prior versions and redirect to comparison with the prior latest plan.
- Keep archived projects read-only for tweaking until restored.
- Add focused helper, route, rendering, and no-forbidden-language tests.

Do not add schema fields, migrations, packages, chat UI, background agents, export/download behavior, CAD/CNC work, image upload, public sharing, shopping, pricing, vendor, inventory, auth expansion, production multi-user behavior, permanent delete, bulk archive, or new project types in Task 73B.

## Task 73B/73C Implementation Notes

Task 73B implemented the no-schema first slice as a one-shot `/projects/[id]/revise` POST route and a `Tweak this plan` form on active project detail pages with a latest generated plan.

Task 73C dogfood kept the feature narrow and made only readability fixes:

- Successful revisions say the comparison below shows the new latest plan against the previous version.
- The comparison panel labels revised redirects as `Comparing the revised latest plan with the previous version (...)`.
- Plan history shows a small `Revised` marker when the saved record assumptions include the deterministic `Revision request: ...` prefix.
- No schema fields, migrations, packages, chat UI, background agents, export/download behavior, CAD/CNC work, image upload, public sharing, shopping, pricing, vendor, inventory, auth expansion, production multi-user behavior, permanent delete, bulk archive, or new project types were added.
