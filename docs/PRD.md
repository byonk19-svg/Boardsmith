# Woodcut Wizard PRD

## Goal

Create a private MVP web app that uses AI to generate detailed woodworking and craft project plans. The MVP starts with simple wood projects and produces structured plan content that can later support SVG/PDF-ready workflows.

## Primary Flow

1. User opens the dashboard.
2. User creates a new woodworking project.
3. User chooses a supported project type.
4. User enters dimensions, material thickness, tools available, skill level, style notes, and intended use.
5. App saves the project.
6. User triggers AI plan generation.
7. App sends deterministic project context and template hints to OpenAI using structured output.
8. App validates the result against the Zod plan schema.
9. App saves only valid generated plans.
10. User views overview, warnings, materials, tools, cut list, assembly steps, finishing guide, assumptions, needs-review flags, beginner tips, and SVG/PDF readiness notes.

## Project Types

- `door_hanger`
- `layered_cutout`
- `wood_sign`
- `simple_shelf`
- `planter_box`

## Non-Goals

- No CAD or FreeCAD.
- No DXF, SVG, or PDF export.
- No payments, subscriptions, public marketplace, Etsy posting, public sharing, image upload, CNC/router-specific output, dangerous structural claims, child-furniture safety claims, or advanced joinery solver.

## Safety Requirements

- Plans must include safety disclaimers.
- Plans must warn that user review is required.
- No structural or load-bearing guarantees.
- Wall-mounted items must include stud/anchor cautions.
- Child/baby use, chairs, stools, benches, ladders, platforms, heavy shelving, electrical/lighted signs, outdoor load exposure, unclear dimensions, and missing material thickness must be flagged.
- Tool guidance must not tell minors to use dangerous tools or recommend bypassing guards or PPE.
