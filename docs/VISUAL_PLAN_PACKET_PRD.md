# Visual Plan Packet PRD

Date: June 15, 2026

## Problem Statement

Boardsmith's generated plan experience should feel like a real woodworking shop packet, not a long AI answer with a few helpful tables. The user wants fantastic visuals and ultimately wants to enter any project idea, but the app must only produce build-truth visuals when the project has passed the Clarification Gate and belongs to a supported, safe-enough template.

Current wall-shelf work already has deterministic build model data, readiness checks, buying-plan grouping, cut diagrams, browser print, and hosted dogfood. The missing product standard is a complete Visual Plan Packet definition that makes part labels, visuals, cut planning, materials, buying guidance, build steps, and print all feel like one coherent packet.

## Solution

Define and implement the Visual Plan Packet standard first for supported wall shelves. The packet should use deterministic build-plan visuals only: structured build data drives labels, dimensions, diagrams, cut layouts, and print graphics. AI-generated images or generic inspiration images must not be used as build-truth visuals.

The full destination includes:

1. A recognizable finished-project hero visual.
2. Consistent part labels across every packet surface.
3. Labeled exploded or assembly view.
4. Dimensioned front, side, and top views.
5. Cut layout or stock-board planning diagram.
6. Materials, Buying Plan, and cut checklist aligned to the same labels.
7. Step-by-step mini diagrams tied to build actions.
8. Browser Print Plan using the same visual hierarchy.
9. Safety, review, and planning-aid warnings placed near the relevant visual or action.

This PRD is paired with `docs/CLARIFICATION_GATE_PRD.md`. The Clarification Gate decides whether a project is eligible for a full packet. The Visual Plan Packet assumes the project has enough confirmed detail to render deterministic build visuals without inventing missing information.

## User Stories

1. As a private Boardsmith user, I want the generated plan to start with a recognizable project visual, so that I immediately understand what I am reviewing.
2. As a cautious maker, I want every part label in the visual to match the cut list, so that I can trace each piece from drawing to cutting.
3. As a user reviewing a wall shelf, I want an exploded or assembly view, so that I can understand how shelf boards, supports, cleats, brackets, spacers, or frame pieces relate.
4. As a user reviewing dimensions, I want front, side, and top views with measurements on the drawings, so that dimensions are not buried in prose.
5. As a user buying materials, I want the Buying Plan to reference the same labeled parts as the diagrams and cut checklist, so that I can plan material without guessing.
6. As a user preparing cuts, I want a cut layout or stock-board planning diagram, so that I can see how pieces relate to available material before cutting.
7. As a user following build steps, I want step diagrams tied to specific actions, so that the build sequence is easier to follow than prose alone.
8. As a user printing a plan, I want the Browser Print Plan to preserve the same visual packet order, so that paper review feels like the main artifact, not an afterthought.
9. As a user, I want safety warnings near the visual step they affect, so that mounting, support, fastener, load, finish, and tool risks are not separated from the action.
10. As a user, I want unresolved dimensions or support details to make the packet visibly review-needed, so that the visual design does not imply certainty.
11. As a user, I want wall-mounted shelf packets to keep stud, anchor, bracket, fastener, load-use, and wall-type cautions visible, so that I do not treat the packet as wall-safety approval.
12. As a user, I want connected shelf units to show support/frame details only when confirmed, so that the app does not invent structural pieces.
13. As a user, I want separate wall shelves to render as repeated shelf packets or repeated part groups, so that they are not confused with a connected unit.
14. As a user, I want "not to scale" or "review dimensions" caveats where appropriate, so that early visuals do not overclaim precision.
15. As a user, I want visual labels to remain readable on mobile, so that I can review plans away from a desktop.
16. As a user, I want visual labels to remain readable in browser print, so that the paper packet is useful in the shop.
17. As a user, I want the generated prose summary to support the packet, not lead it, so that the visual build sequence carries the experience.
18. As a user, I want plan history to preserve older visual packets, so that comparing versions does not lose prior plans.
19. As a user, I want `Tweak this plan` revisions to create updated packet visuals when the structured model changes, so that revised plans remain coherent.
20. As a user, I want unsupported or review-needed projects to show why visuals are limited, so that a missing diagram is understandable.
21. As a maintainer, I want packet visuals generated from deterministic view models, so that tests can cover labels, dimensions, and warnings.
22. As a maintainer, I want part labels to be stable IDs or stable display labels, so that diagrams, cut lists, buying plan, and build steps cannot drift.
23. As a maintainer, I want visual packet work to start with wall shelves, so that the golden template is excellent before generalizing.
24. As a maintainer, I want the packet standard to generalize to planter boxes, wood signs, door hangers, and layered cutouts later, so that the design does not become shelf-only code.
25. As a maintainer, I want the packet to remain browser-print-first, so that no PDF/export dependency is introduced by this PRD.
26. As a maintainer, I want the feature to avoid AI-image generation, image upload, CAD, CNC, SVG download, DXF, shopping, pricing, vendor, and public-sharing scope.
27. As a maintainer, I want visual tests to guard against forbidden claims, so that beautiful visuals do not weaken the planning-aid boundary.
28. As a maintainer, I want the Visual Plan Packet to depend on Clarification Gate readiness, so that visuals render only when the project has enough confirmed detail.
29. As a maintainer, I want the first implementation issues split by visual layer, so that part-label consistency, assembly view, dimension views, cut layout, step diagrams, and hero visual can ship in safe slices.
30. As a maintainer, I want wall-shelf dogfood to validate the packet before expanding to other project types, so that real use chooses the next template.

## Implementation Decisions

- Wall shelves are the golden template for the first Visual Plan Packet.
- The packet uses deterministic build-plan visuals only.
- AI-generated images may be considered later only as clearly labeled non-buildable inspiration, not build truth.
- Part-label consistency is the first implementation dependency.
- The full implementation should be split into layered issues: labels, assembly view, dimensioned views, cut layout, step diagrams, and polished hero visual.
- The polished hero visual should come after label and dimension integrity, not before.
- The packet should reuse existing build model, printable manifest, wall-shelf diagram, cut diagram, buying-plan, and build-step view-model seams where possible.
- The packet order should emphasize build-packet flow: Build Snapshot, Hero Visual, Project Visuals, Cut Checklist, Buying Plan, Materials and Parts, Build Guide, Check Before Building, Reference Notes.
- Browser Print Plan should consume the same packet data as the detail page.
- Unresolved dimensions, support/frame review, or safety blockers should degrade visuals into review-needed states instead of hiding the issue or inventing missing parts.
- Generated prose should move lower than deterministic packet sections when the packet has enough structured data.

## Testing Decisions

- Test part-label consistency at deterministic view-model seams before route rendering.
- Test wall-shelf packet rendering on detail and print routes.
- Test single shelf, multiple separate shelves, connected shelf unit with support review, invalid connected height, missing material thickness, and missing cut dimensions.
- Test that diagram labels match cut-list, buying-plan, material, and build-step labels.
- Test that dimensioned views do not render trusted dimensions when values are missing or review-only.
- Test that Browser Print Plan includes the same visual packet order and hides app chrome.
- Test that safety and planning-aid warnings remain visible near relevant packet sections.
- Test mobile-safe markup for dense visual sections where practical through rendered-route assertions.
- Test forbidden language: no engineering approval, structural approval, load rating, child-safety certification, fabrication-ready claim, CAD/CNC readiness, PDF/export/download promise, vendor, price, or shopping claim.
- Run the full verification stack before implementation commits: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and `git diff --check`.

## Out of Scope

- No public marketing website or launch page.
- No app-generated PDF, SVG download, DXF, CAD, CNC, FreeCAD, fabrication-ready output, or export/download pipeline.
- No AI-generated build-truth images.
- No image upload.
- No shopping, pricing, vendor, inventory, cart, marketplace, Etsy automation, payments, or subscriptions.
- No auth expansion, public sharing, production multi-user behavior, or RLS work.
- No new project type expansion in the first packet implementation.
- No structural, wall-safety, load-rating, child-safety, or professional approval claims.
- No natural-language-first intake implementation in this PRD.

## Further Notes

Research on woodworking plans supports this direction. Strong plans combine a finished visual, exploded drawings, labels, materials, cut lists, step diagrams, and technique or safety callouts. The packet should borrow that communication pattern while preserving Boardsmith's private-MVP and planning-aid boundaries.

The next implementation step should not be "make visuals better" as one broad ticket. It should start with the part-label consistency issue, because every later visual layer depends on labels matching across drawings, cuts, materials, buying guidance, build steps, and print.
