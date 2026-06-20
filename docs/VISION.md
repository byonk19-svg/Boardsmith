# Boardsmith Vision

## Purpose

Boardsmith helps a handy DIY homeowner turn a project idea into a clear, visual, step-by-step woodworking build plan.

The north star is:

> AI understood my project and turned it into a clear, usable build plan.

Boardsmith is private-MVP first. It is being built for the owner's own DIY and home projects, but the product and architecture should stay clean enough to support a future public product later.

The app should feel like a practical woodworking planning workbench, not a generic AI demo, CAD package, marketplace, shopping app, or public project gallery.

## Primary User

The primary user today is the owner:

- DIY homeowner.
- Handy and comfortable with tools.
- Owns many common woodworking and home-project tools.
- Has some woodworking knowledge.
- Is still relatively new to woodworking.
- Wants confidence, clarity, visuals, detailed instructions, and explicit review points before cutting or building.

Future versions may support broader DIY users, but private MVP needs come first. Do not add broader-product complexity until real private use shows the need.

## Desired Feeling

After generating a plan, the user should feel:

- I can clearly see what I am building.
- I know what to buy.
- I know what to cut.
- I know what steps to follow.
- I know what needs review before I start.
- This feels like a real woodworking plan packet.

That feeling should come from structured content, useful visuals, visible review warnings, and clear next actions. It should not come from overconfident copy or decorative AI output.

## Plan Quality Bar

Boardsmith should produce plans closer to a careful woodworking plan packet than a chat response.

The first "wow" of a Boardsmith plan should be the main project visual: the user should immediately recognize the project they meant to build before reading the details. That visual must still be backed by structured build data. It does not replace dimensions, cut lists, diagrams, safety review, review notes, or step-by-step instructions.

A finished plan should include:

- A strong main project visual.
- Dimensioned project views.
- Cut diagrams or cut-list support.
- Materials and parts.
- Step-by-step build instructions.
- Safety and review notes.
- A clean paper-friendly packet feel.

The product voice should be warm, practical, beginner-friendly, and precise. It can be polished, but it should stay low-noise and builder-focused.

## Finished Plan Packet Requirements

The visual plan packet is central to Boardsmith. Text instructions alone are not enough for a finished plan.

Every supported project template should build toward a packet that includes:

- Consistent part labels across the cut list, diagrams, buying plan, materials and parts, build steps, detail page, and print sheet.
- Dimensioned drawings with labels on the diagrams, not only dimensions in surrounding text.
- Cut layout or lumber layout views that show modeled pieces on stock-board planning graphics when the build model supports that.
- Per-step diagrams tied to deterministic build steps when the modeled operations are specific enough.
- Simple exploded or assembly views that show how modeled parts relate.
- Joinery and fastener callouts for beginner-critical connections when those details affect build safety or clarity.
- Project-type-specific diagram templates beyond wall shelves, using the same structured-data approach once each template is mature enough.

Incomplete or unsafe plans should guide the user to clarify, review, or stop. They should not pretend to be complete by filling missing dimensions, supports, joinery, fasteners, or safety-sensitive assumptions with decorative copy.

## Core Plan Structure

Every finished Boardsmith plan should be organized around:

- Build Snapshot.
- Hero Visual.
- Project Visuals / Diagrams.
- Check Before Building.
- Materials and Parts.
- Cut Checklist.
- Buying Plan.
- Build Guide.
- Reference Review Notes.

The digital project page and the print/PDF plan packet should use the same underlying plan content. The current packet order is Build Snapshot, Hero Visual, Project Visuals / Diagrams, Check Before Building, Materials and Parts, Cut Checklist, Buying Plan, Build Guide, then Reference Review Notes. The digital page may add controls for editing, tweaking, regeneration, history, comparison, notes, and advanced review details. The print/PDF plan packet should be the clean user-facing build artifact.

Current implementation uses browser print through a print route and printable plan manifest. It does not generate a PDF file today. Future print/PDF plan packet or image output should reuse the same structured content, not scrape the page or regenerate unvalidated prose.

## Visual Strategy

Visuals are central to Boardsmith. They are not decoration.

The main project visual is the emotional entry point into the plan. It should make the result feel real and legible, while the rest of the packet proves how to review and build it.

Long-term, each finished plan should support:

- A polished 3D or isometric hero visual.
- Dimensioned project views.
- Exploded or assembly views where useful.
- 2D diagrams for measurements and cuts.
- Step visuals where the build model supports them.

The long-term visual goal is a coherent sequence: hero visual, dimensioned views, exploded or assembly views, and step visuals as the build model becomes mature enough to drive them.

Near-term:

- Deterministic SVG, CSS, and 2.5D/fake-isometric visuals are acceptable.
- 2D diagrams should carry measurement and cut accuracy.
- Exact dimensions belong in structured data, cut lists, and dimensioned diagrams.
- Proportional hero visuals are acceptable early, but long-term hero visuals should be driven by the build model.

AI image generation may eventually be used for aesthetic concept previews only. Those previews must be clearly labeled as non-buildable inspiration. Actual build plan visuals, dimensions, cut diagrams, assembly drawings, print graphics, and future PDF graphics must come from structured build data.

## Reference Images

Long-term, users may upload inspiration or reference images. Reference images can guide style, proportions, structure ideas, and clarifying questions.

Reference images should improve planning, not bypass structured intake or validation. They may influence style, proportions, structure ideas, and the clarifying questions Boardsmith asks, but they should not become build truth by themselves.

Image-derived measurements are never trusted as exact unless the user confirms them in structured fields. If an image suggests a dimension, support method, material, joinery choice, or safety-sensitive detail, Boardsmith should ask or flag instead of silently treating the image as build truth.

## Product Flow Direction

The long-term user experience should be hybrid:

1. The user starts with natural language.
2. Boardsmith turns the idea into structured fields.
3. Boardsmith asks targeted follow-up questions for missing details.
4. Boardsmith generates a detailed plan only after the project is structured enough.

The current structured form remains a good MVP foundation. Natural language should improve intake and revision flow without weakening validation or making unsupported projects look complete.

Current implementation now supports the first part of this flow: the user can start with natural language from the dashboard or New Project page, and Boardsmith drafts editable intake fields from that idea while keeping structured fields as the saved source of truth. The draft step surfaces missing details, safety-sensitive parser notes, and whether the idea is a supported draft, concept-only, unsupported, or blocked for safety. Concept-only or unsupported drafts require explicit supported-template resolution before they can become saved project setup; safety-blocked drafts cannot be saved as build setups. On project detail, answerable readiness questions can now save clarification answers back to Project Intake without creating a plan version, including dimensions, material, shelf layout, tools, mounting context, expected use/load, and finish context. In the revision flow, safe explicit width, depth, material, material-thickness, shelf-layout, shelf-count, and shelf-spacing changes patch structured intake before another plan is generated; safety-sensitive, cut-list, ambiguous, unparseable, unsupported, and approval-like support/mounting changes still require manual review.

For ambiguous projects, Boardsmith should not force one interpretation too early. It should offer targeted questions or 2-3 mini concept cards before producing a full build packet.

Current unsupported woodworking-adjacent natural-language drafts can render bounded concept-only guidance and mini options before save, and the project detail page has a defensive concept-only rendering path for legacy or invalid stored records. The normal saved Project Intake Interface still requires a supported project type before it can become a build setup. Long-term concept cards should include:

- A small hero sketch or visual.
- Key dimensions.
- Difficulty.
- Tools and materials overview.
- Pros and cons.

Do not generate full cut lists and build steps for every option before the user chooses.

## Buildability And Style

Default mode should be balanced:

- Good-looking plans.
- Realistic construction for a handy DIYer.

Long-term modes may include:

- Easiest build.
- Balanced.
- Best-looking.

The MVP should provide light teaching where useful:

- Board thickness.
- Depth from wall.
- Studs and anchors.
- Kerf.
- Finish notes.
- Material caveats.

Long-term, detail level may become configurable as beginner, standard, or advanced.

## Workshop And Style Profile

Near-term or future product direction should support a workshop and style profile:

- Tools owned.
- Skill level.
- Preferred materials.
- Design style.
- Teaching/detail preference.

Long-term adaptive behavior is acceptable only if it is controlled and transparent. Boardsmith should not silently change safety posture, project assumptions, or critical dimensions based on inferred profile data.

## Project Categories

Current private MVP support is intentionally narrow. The live app currently supports starter-friendly project types such as door hangers, layered cutouts, wood signs, wall/simple shelves, and planter boxes.

Priority future categories are:

- Wall shelves.
- Bookcases and multi-shelf units.
- Garage shelves.
- Shop furniture.
- Cabinets.
- Closet storage.
- Laundry storage.
- Kids furniture, with strict safety boundaries.

Wall shelves should be the golden template and proving ground. Make the full intake to build model to diagrams to print packet flow excellent for wall shelves first, then apply those patterns to other categories.

## Safety Boundaries

Boardsmith is a planning aid. It is not:

- CAD.
- SketchUp.
- CNC-ready.
- Engineering approval.
- Load certification.
- Professional safety inspection.
- A shopping or vendor app in the core MVP.
- A marketplace or social plan-sharing app in the near term.

Boardsmith should not guess critical geometry. If dimensions, part counts, supports, or safety-sensitive details are missing, it should ask, flag, or block instead of inventing.

Higher-risk project handling should be mixed:

- Allow lower-risk home and kids-adjacent items such as toy shelves or book ledges when the output stays cautious.
- Block or heavily limit plans involving sleep surfaces, climbing, suspension, structural loads, child entrapment risk, loft beds, bunk beds, cribs, decks, stairs, overhead garage storage, or other high-consequence failure scenarios.
- Unsupported or high-risk projects may receive concept guidance or review questions, but not full build packets unless safe template support exists.

Boardsmith must not make structural, load-bearing, wall-safety, or child-safety guarantees.

## Materials And Shopping

Boardsmith should be shopping-aware but not vendor-specific for now.

It should provide:

- Board types.
- Dimensions.
- Quantities.
- Hardware categories.
- Finish notes.
- Buying cautions.

It should not become a vendor, cart, pricing, affiliate, inventory, or purchasing workflow in the core MVP.

## Output Direction

Current output is browser print.

Future output goals:

- Polished print/PDF plan packet.
- SVG or image diagram downloads.

CAD, DXF, CNC, and fabrication-oriented exports are future-only. Do not promise them until the structured build model is mature enough to support real geometry, tolerances, joinery, machining constraints, and safety boundaries.

## Public Product Direction

Boardsmith should remain private-MVP first and future-product capable.

Architecture may leave room for:

- User accounts.
- Private projects.
- Clean data boundaries.
- Read-only share links first.
- Collaboration or galleries much later.

Do not add public sharing, full auth, collaboration, marketplace, payments, subscriptions, general image upload workflows, or vendor workflows unless explicitly requested. Future reference-image input should stay bounded to planning support, not build-diagram generation or unvalidated measurement extraction.
