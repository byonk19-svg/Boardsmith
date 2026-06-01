# Boardsmith PRD

## Goal

Create a private MVP web app that uses AI to generate detailed, reviewable woodworking and craft project plans. The MVP starts with simple wood projects, stores validated plan versions, and produces structured plan content that can later support SVG/PDF-ready workflows.

## Primary Flow

1. User opens the dashboard.
2. User creates a new woodworking project.
3. User chooses a supported project type.
4. User enters dimensions, material thickness, tools available, skill level, style notes, and intended use.
5. App saves the project.
6. User triggers AI plan generation.
7. App derives a deterministic Boardsmith Build Model from the project intake, template hints, and safety flags.
8. App sends deterministic project context, template hints, and build-model context to OpenAI using structured output.
9. App validates the result against the Zod plan schema.
10. App rejects generated plans that fail deterministic quality checks.
11. App saves only valid generated plans with their build-model JSON.
12. User views project metadata, safety flags, template hints, project structure, Material Summary, Cut List Review, Plan Review status, Export Readiness, overview, warnings, materials, tools, cut list, assembly steps, finishing guide, assumptions, needs-review flags, beginner tips, future export readiness notes, Printable Plan Sheet, browser print preview link, and plan history.
13. User may open `/projects/[id]/print` for a browser print preview of the latest generated plan and use the browser print dialog for a paper copy.

## Project Types

- `door_hanger`
- `layered_cutout`
- `wood_sign`
- `simple_shelf`
- `planter_box`

## Non-Goals

- No CAD or FreeCAD.
- No DXF, SVG, or PDF export.
- No app-generated PDF downloads.
- No payments, subscriptions, public marketplace, Etsy posting, public sharing, image upload, CNC/router-specific output, dangerous structural claims, child-furniture safety claims, or advanced joinery solver.

## Safety Requirements

- Plans must include safety disclaimers.
- Plans must warn that user review is required.
- The Plan Review panel must make blocking issues, warnings, and manual-review needs visible in plain language.
- No structural or load-bearing guarantees.
- Wall-mounted items must include stud/anchor cautions.
- Child/baby use, chairs, stools, benches, ladders, platforms, heavy shelving, electrical/lighted signs, outdoor load exposure, unclear dimensions, and missing material thickness must be flagged.
- Tool guidance must not tell minors to use dangerous tools or recommend bypassing guards or PPE.
