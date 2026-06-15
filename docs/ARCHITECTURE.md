# Boardsmith Architecture

## Purpose

This document describes:

- The current Boardsmith architecture at a high level.
- The target architecture direction.
- Hard boundaries for future development.
- Quality gates for changes.

Detailed Codex task workflows belong in `AGENTS.md`, `docs/CODEX_TASKS.md`, or focused task docs. This document should guide architecture decisions without becoming a prompt log.

## Current Stack

Boardsmith is currently a private MVP built with:

- Next.js App Router.
- React.
- TypeScript.
- Tailwind CSS with local component patterns.
- Zod validation.
- OpenAI structured output for generated plans.
- Supabase persistence when configured.
- Local JSON persistence fallback for development and private MVP use.
- Vitest tests for route behavior, utility behavior, validation, storage, diagrams, print manifest, and rendered markup.

The repo does not currently depend on shadcn/ui. Treat the current UI as Tailwind and local React components unless a future task deliberately adds a component package.

## Current Application Shape

Current routes and modules support:

- Private dashboard at `/`.
- Project list at `/projects`.
- Project intake at `/projects/new`.
- Project detail at `/projects/[id]`.
- Browser print preview at `/projects/[id]/print`.
- Settings and private access pages.
- POST route handlers for create, generate, revise, duplicate, archive, restore, notes, build log, and shelf-layout updates.

Current product capabilities include:

- Structured project intake for supported beginner-friendly project types.
- Deterministic safety-review flags.
- Template hints by project type.
- Boardsmith Build Model draft generation.
- OpenAI structured-output plan generation.
- Zod validation before saving generated plans.
- Deterministic plan quality checks when a build model is available.
- Versioned generated plan history with latest-plan marking.
- One-shot natural-language plan revision that saves a new generated-plan version.
- Plan comparison between latest and prior versions.
- Project notes and build-log fields.
- Archive/restore as private workspace organization.
- Material Summary, Cut List Review, Plan Review, Export Readiness, action checklist, diagram helpers, build-step cards, and printable plan manifest.
- Browser print preview from the same structured plan manifest used by the detail page.

## Current Storage

Boardsmith uses a repository layer in `lib/storage/project-store.ts`.

Current persistence modes:

- Supabase when `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are configured.
- Local private JSON storage in `.data/boardsmith.json` when Supabase is not configured.

The current Supabase path is a private no-auth MVP path using server-only service-role access from route/page code. Migrations define project and generated-plan storage, latest-plan behavior, build-model JSON storage, notes/build-log/archive metadata, and defensive private MVP grants.

Full authentication, per-user ownership, production RLS policies, public sharing, and collaboration are future-only.

## Source Of Truth

Architecture rule:

- User intake is the original project record.
- The validated structured Boardsmith Build Model JSON is the generated plan source of truth.
- AI prose is explanatory only.
- Prose must not be the source of truth for dimensions, cut lists, materials, diagrams, material math, or safety-critical outputs.

If prose conflicts with structured intake, build-model data, deterministic review, or schema-validated plan data, the structured data wins and the conflict should be flagged for review.

## Target Plan Data Flow

Target flow:

```text
User idea / intake
-> structured intake fields
-> validation / clarification
-> AI-assisted structured build model generation
-> schema validation
-> deterministic derived outputs
-> diagrams / cut list / materials / browser print / future print/PDF plan packet / project page
```

Current implementation already follows much of this shape:

```text
Project intake
-> Zod project validation
-> deterministic safety flags and template hints
-> deterministic build model draft
-> OpenAI structured plan output
-> Zod generated-plan validation
-> deterministic plan quality checks
-> saved generated plan with build_model_json
-> deterministic review, diagrams, material/cut-list summaries, and browser print manifest
```

The target direction is to strengthen the structured intake and build model before expanding project categories, visuals, or output formats.

## Deterministic Plan Packet Pipeline

The target plan-packet pipeline is:

```text
Build Model
-> Part Schedule / Part Identity
-> Diagram View Models
-> Cut Layout View Models
-> Buying Plan View Models
-> Build Step View Models
-> Deterministic Renderers
-> Plan Packet
```

Rules:

- Build Model remains the source of truth.
- AI prose remains explanatory only.
- Part identity is assigned deterministically from structured Build Model pieces and existing deterministic cut data.
- Diagrams, cut layouts, buying plan, materials and parts, build steps, detail pages, and print sheets should reuse the same part identifiers.
- Renderers must not invent parts, dimensions, joinery, fasteners, supports, load claims, or safety-critical instructions.
- Review-only placeholders may explain missing support/frame details, but they should not receive stable part labels that make them look build-ready.
- Project-specific diagram templates should follow the typed view-model pattern proven by wall shelves.

## Current Vs Target Subsystems

### Intake

Current:

- Structured form intake with project type, skill level, dimensions, material thickness, tools, style notes, intended use, and wall-shelf layout fields.
- Zod validation blocks invalid project records.
- Starter examples prefill editable form values.

Target:

- Hybrid natural-language plus structured intake.
- Natural language can draft fields, but structured fields remain the saved record.
- Missing safety-critical fields should trigger targeted clarification before full generation.
- Ambiguous ideas should produce questions or concept options, not premature full plans.

### Generation

Current:

- OpenAI structured output returns plan JSON matching a strict generated-plan schema.
- Missing API key and generation failures produce user-facing blocked feedback.
- Generated plans are saved only after schema validation and deterministic quality checks.

Target:

- AI assists with intake parsing, clarification, structured plan generation, review, revisions, captions, explanations, and beginner tips.
- Deterministic code owns validation, math, diagrams, schema checks, print rendering, and safety gates.
- Avoid unnecessary full plan regeneration when a narrower structured change can be made.

### Build Model

Current:

- Boardsmith Build Model schema exists.
- Draft build models are derived from saved project intake, template hints, and safety flags.
- Generated plan versions can store nullable `build_model_json`.
- Older plans without build-model JSON remain readable through compatibility derivation.

Target:

- Build Model becomes the stable source of truth for pieces, materials, hardware, connections, operations, safety, assumptions, unresolved questions, and output readiness.
- Supported templates should have known build-model expectations and deterministic validation.
- Changes to dimensions, layout, materials, support, safety, cut list, or structure should flow back into structured data before regenerated outputs appear.

### Diagrams

Current:

- Deterministic diagram helpers exist.
- Wall-shelf diagrams use a typed view model and React/SVG rendering.
- Missing shelf count or dimensions produce explicit fallback messages instead of fake drawings.
- Generic planning diagrams and connection/build-step aids use structured plan/build-model data.

Target:

```text
Build Model
-> Part Schedule / Part Identity
-> Diagram View Model
-> Deterministic Renderer
```

Rules:

- AI may help interpret the project.
- Diagrams must come from validated structured data.
- Missing data must produce safe fallbacks.
- Do not invent geometry.
- Do not imply side supports, frames, brackets, anchors, or load ratings unless the model actually includes them.
- Diagrams are planning aids, not CAD or engineering validation.
- Part labels shown in diagrams must come from the deterministic part schedule, not local renderer state or generated prose.

Near-term rendering can use deterministic SVG, CSS, and fake-isometric/2.5D visuals. Long-term rendering may add model-driven 3D or isometric views only after the build model is mature enough.

### Reference Images And Concept Previews

Current:

- Boardsmith does not currently support image upload, reference-image intake, or AI-generated concept images.
- Current build visuals and planning diagrams are rendered from structured data, not freeform image generation.

Target:

- Reference image input may guide style, proportions, structure ideas, and clarifying questions. Image-derived measurements are never trusted as exact unless the user confirms them in structured fields. Reference images should feed structured intake and review, not bypass validation.
- AI-generated concept previews are future-only, aesthetic/inspiration only, and must be clearly labeled non-buildable. They are not build diagrams, cut diagrams, assembly drawings, or print/PDF plan packet graphics.
- Build diagrams are deterministic, structured-data-driven outputs. They come from the Build Model through a Diagram View Model and deterministic renderer, never from freeform AI images.

Reference image input, AI-generated concept preview, and build diagrams are separate subsystems. Do not let inspiration imagery become the source of truth for dimensions, cut lists, hardware, supports, or safety review.

### Print And Export

Current:

- Browser print preview exists at `/projects/[id]/print`.
- `createPrintablePlanManifest` gathers project, generated plan, build model, review summaries, diagrams, cut-list/material review, disclaimers, and future export notes.
- No app-generated PDF, SVG download, DXF, CAD, CNC, file export, or download pipeline exists.
- Current output language should say browser print, not app-generated PDF.

Target:

- Digital project page and print/PDF plan packet should be two views of the same structured plan.
- Future PDF or image/SVG output should consume the printable plan manifest or a successor structured output manifest.
- CAD, DXF, CNC, and fabrication-ready exports remain future-only and require much stronger geometry semantics.

### Revisions And History

Current:

- Generated plans are versioned.
- Saving a generated plan marks it latest and preserves prior plan history.
- `Tweak this plan` accepts one natural-language instruction and saves a complete revised plan as a new version.
- Archived projects block revision until restored.

Target:

- Natural-language tweaks are allowed.
- Real changes to dimensions, layout, materials, support/safety, cut list, or project structure must update structured fields or build-model data before regeneration.
- Meaningful plan changes should continue to create versioned plan iterations with history and comparison.
- Revision UI should make current, prior, and changed plan state clear.

### Safety And Review

Current:

- Deterministic safety flags are calculated before generation.
- AI prompts include safety rules and forbidden overconfident phrases.
- Generated plans must include safety notes.
- Plan Review, Export Readiness, Material Summary, Cut List Review, and action checklist provide deterministic review surfaces.

Target:

- Deterministic review rules should catch known hard boundaries before AI output can look complete.
- AI may assist review, but deterministic rules own known safety triggers and blocking conditions.
- High-risk project types should be blocked or limited to concept/review guidance unless a safe template exists.

### Testing

Current:

- Vitest covers schemas, generation feedback, routes, storage, Supabase migration assumptions, build model, plan quality, diagrams, render helpers, print manifest, print preview, dashboard, project list/detail behavior, archive/restore, notes, build log, and access gate behavior.
- ESLint, TypeScript, Next build, and `git diff --check` are the standard broader verification commands before committing.

Target:

- Keep focused tests close to the changed subsystem.
- Generated-plan changes need schema/model tests.
- Cut-list and material math need deterministic tests.
- Diagram changes need view-model and render tests.
- Print/PDF changes need screenshot or manual visual review where practical.
- Safety and validation changes need regression tests.
- Avoid broad refactors during focused feature work.
- Do not add schema changes unless intentionally scoped.

## Validation Behavior

Use mixed validation:

- Block or force clarification when missing data affects dimensions, cut list, support/safety, or project structure.
- Allow warnings for missing style, finish, optional hardware, or beginner-tip details.

Unsupported project types should not be dressed up as supported build packets. They may receive concept briefs, clarification questions, or limited review guidance until a proper template/model exists.

## Template-First Rule

Boardsmith should be template-first for real build plans.

Supported templates have:

- Structured intake fields.
- Known validation rules.
- Known build model expectations.
- Known diagram/rendering patterns.
- Safe output rules.

Do not add full build packets for a new category until the template can support the intake, validation, build model, diagrams, review, and print flow honestly.

## AI Usage And Cost Policy

AI can assist with:

- Intake parsing.
- Clarification questions.
- Structured plan generation.
- Review.
- Revisions.
- Captions.
- Explanations.
- Beginner tips.

Deterministic code should own:

- Validation.
- Diagrams.
- Cut-list math.
- Material quantity calculations.
- Print rendering.
- Formatting.
- Label cleanup.
- Schema checks.

Cost policy:

- Use the smallest capable model by default.
- Do not send full project history unless the task requires it.
- Escalate to stronger models only for harder reasoning or safety-sensitive review.
- Avoid unnecessary full plan regeneration.
- Do not use AI image generation for core build visuals, build diagrams, cut diagrams, or print/PDF plan packet graphics.

## Digital Page Vs Print/PDF Plan Packet

The digital project page includes:

- Build content.
- Edit controls.
- Tweak/regenerate controls.
- Plan history.
- Comparison.
- Notes and build-log fields.
- Advanced details and review surfaces.

The print/PDF plan packet should be:

- Clean.
- Visual.
- Build-focused.
- Free of debug/system language.
- Organized around the core plan structure.
- Explicit that it is a planning aid.

Both views should derive from the same structured plan source. Current implementation is browser print only. Do not let a future print/PDF plan packet become a separate, divergent content system.

## Storage And Deployment Direction

Current direction:

- Cloud-first for real product work.
- Local fallback remains useful for development, tests, smoke/demo data, and private-MVP safety.
- Server-only secrets stay server-only.
- The current private access gate is not full auth.

Future direction:

- User-owned projects.
- Authenticated access.
- Clean row ownership and access boundaries.
- Read-only share links first, only after private data boundaries are sound.
- Collaboration, galleries, payments, subscriptions, marketplace, shopping, and vendor flows much later, if ever.

## Safety Review Subsystem

Boardsmith should maintain deterministic review flags for:

- Wall mounting.
- Load/support uncertainty.
- Child safety.
- Humidity or outdoor exposure.
- Tool hazards.
- Missing dimensions.
- Missing material or support details.
- High-risk project types.

Known hard boundaries should be deterministic. AI review can add context, but it should not be the only line of defense.

## Do Not Do This

- Do not let prose drive dimensions, cut lists, diagrams, or material math.
- Do not use freeform AI images for build diagrams, cut diagrams, assembly drawings, or print/PDF plan packet graphics.
- Do not treat reference images or AI-generated concept previews as measurement truth.
- Do not invent missing safety-critical details.
- Do not promise CAD, DXF, CNC, FreeCAD, or fabrication-ready output.
- Do not hide unresolved support, load, wall, child-safety, or material review.
- Do not make unsupported project types look fully supported.
- Do not turn Boardsmith into a generic drawing app.
- Do not add app-generated PDF, SVG download, export routes, auth, public sharing, payments, subscriptions, marketplace, shopping, pricing, vendors, image upload, or new external services without explicit approval.
- Do not expose service-role keys, raw passwords, project secrets, or hosted smoke data in client code, logs, docs, screenshots, or committed artifacts.
