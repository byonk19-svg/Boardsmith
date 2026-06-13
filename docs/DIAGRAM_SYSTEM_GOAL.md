# Diagram System Goal

Boardsmith diagrams should make a generated woodworking plan feel understood, concrete, and reviewable.

The target is not AI art, decorative illustration, CAD, CNC, fabrication output, or engineering drawings. The target is clean deterministic SVG plan graphics rendered from structured project intake, the validated build model, the cut list, and review flags.

## North Star

Boardsmith should feel like: "AI understood my project and turned it into a clear, usable build plan."

## Product Qualities

- Beginner-friendly: labels use plain workshop language and explain dimensions in context.
- Deterministic: every graphic comes from trusted structured data, not arbitrary model-authored SVG.
- Useful: diagrams show layout, dimensions, cut parts, and review points that help someone inspect the plan.
- Calm and practical: graphics should look like a clean build packet, not placeholder debug UI.
- Safety-bound: diagrams are planning aids, not load ratings, wall safety validation, CAD, or engineering approval.
- Print-aware: diagrams must remain readable in the browser print build sheet.
- Mobile-aware: diagrams must stack cleanly and keep labels readable on phone-width screens.

## Safety Boundaries

- Do not imply wall safety, load capacity, structural approval, or fabrication readiness.
- Do not draw brackets, frames, side rails, anchors, or hidden supports unless the structured model actually contains them.
- When support details are missing, show review state clearly instead of guessing.
- Keep "planning diagram - not to scale" visible where diagrams are shown.

## Loop Guidance

Each diagram-quality loop should be one controlled iteration:

1. Score the current state against the rubric.
2. Pick the top 1-3 user-facing issues.
3. Make focused deterministic SVG/code changes.
4. Verify tests, mobile/print behavior where practical, and update the loop report.
5. Stop with a recommendation to continue, pause for design review, or stop for MVP.
