# Boardsmith Diagram System

## Status

Boardsmith renders deterministic planning diagrams for supported project shapes. The current first template is the Wall shelf diagram set used by the project detail page and print build sheet.

These diagrams are planning aids only. They are not CAD drawings, engineering drawings, fabrication files, CNC files, load ratings, or construction approvals.

## Principle

Generated AI output may provide structured plan data after schema validation, but it must not provide arbitrary SVG markup. The app renders diagrams from trusted project fields, the validated build model, cut-list review data, and safety/review flags.

This keeps output predictable, testable, and aligned with Boardsmith's safety posture.

## Current Wall Shelf Views

The Wall shelf diagram model is built in `lib/diagrams/wall-shelf-diagram-model.ts` and rendered by `app/projects/[id]/WallShelfDiagrams.tsx`.

It includes:

- Front elevation / shelf layout, showing shelf count, shelf width, total height when known, and spacing when known.
- Side view, showing wall reference, shelf depth from wall, board thickness, and mounting review status.
- Cut parts, showing the physical shelf-board quantity and dimensions.
- Mounting review, showing conservative hardware, wall, load, and spacing review items.

If shelf count or core dimensions are missing, the diagram does not fake a complete drawing. It renders an explicit fallback message asking for the missing detail.

## Adding Future Templates

For each new deterministic diagram template:

1. Add a typed diagram view model under `lib/diagrams/`.
2. Derive the model only from validated project data, build-model data, cut-list review data, and deterministic rules.
3. Return `null` for unsupported project shapes so the generic planning-diagram fallback can remain in use.
4. Render SVG through local React components, not persisted SVG strings.
5. Include tests for ready state, missing-data fallback state, and the important user-facing labels.
6. Keep copy clear that diagrams are not to scale unless a future approved feature explicitly supports scale.

Do not add export/download behavior, CAD claims, CNC claims, fabrication readiness, or structural/load guarantees as part of diagram work.
