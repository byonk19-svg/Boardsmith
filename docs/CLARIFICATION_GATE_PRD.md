# Clarification Gate PRD

Date: June 15, 2026

## Problem Statement

Boardsmith should eventually let a user start from any woodworking or craft project idea, but it must not generate full build instructions for ideas that are unsupported, ambiguous, missing critical details, or too safety-sensitive.

Today, the app already has structured intake, deterministic safety flags, build-model review, generation feedback, and wall-shelf readiness surfaces. The missing product layer is a clear pre-generation decision that tells the user whether Boardsmith has enough information to generate a safe-enough full plan packet, and if not, exactly what information is missing.

Without this gate, "generate plans for anything" can collapse into unsafe guessing, vague blocked-generation errors, or overconfident plans that look complete before they are build-ready.

## Solution

Add a Clarification Gate experience that evaluates a saved project intake before full plan generation and presents one of five clear readiness outcomes:

1. **Ready for full plan**: the idea is supported, safe enough for this MVP, and has enough detail for generation.
2. **Needs details**: the idea may be supportable, but the user must answer specific missing-detail questions first.
3. **Concept only**: the idea is adjacent to supported work, but not ready for cut lists, build steps, or a full build packet.
4. **Unsupported**: Boardsmith can explain constraints, but should not produce cut lists or step-by-step build instructions.
5. **Blocked for safety**: the idea is too high-risk for build instructions.

The first implementation slice should run after the current structured intake form, because that keeps the feature grounded in existing project data. The product model should remain compatible with future natural-language-first intake, where the same gate can classify a broad idea before or during structured field collection.

The gate should feel like practical planning help, not a punishment. When details are missing, it should ask concrete woodworking questions: final outside dimensions, material and thickness, mounting method, expected use or load, child-adjacent/climbing/seating/sleeping/overhead/structural risk, available tools, finish, and exposure conditions.

## User Stories

1. As a private Boardsmith user, I want to know whether my project is ready for full plan generation, so that I do not waste time generating a plan that will be blocked later.
2. As a cautious maker, I want missing details listed in plain language, so that I know what to measure or decide before continuing.
3. As a user planning a wall shelf, I want Boardsmith to ask about mounting, support, fasteners, and expected load, so that the generated plan does not guess unsafe wall details.
4. As a user planning multiple shelves, I want Boardsmith to distinguish separate shelves from a connected shelf unit, so that total height and support details are interpreted correctly.
5. As a user with incomplete dimensions, I want the gate to ask for specific width, height, depth, or material-thickness values, so that I can correct the intake before generation.
6. As a user who only has rough measurements, I want the gate to tell me which estimates are acceptable and which details must be confirmed, so that I can keep planning without false confidence.
7. As a user describing child-adjacent work, I want Boardsmith to flag that use before generation, so that I understand the stricter safety boundary.
8. As a user describing seating, climbing, sleeping, overhead, or structural use, I want Boardsmith to block build instructions when appropriate, so that the app does not produce dangerous guidance.
9. As a user describing an unsupported idea, I want Boardsmith to explain what it can and cannot do, so that I do not mistake a refusal for a broken app.
10. As a user describing an adjacent low-risk idea, I want concept-level guidance instead of a full packet, so that I can refine the idea without getting unsafe cut lists.
11. As a user entering a supported project type, I want the gate to use existing intake fields before asking more questions, so that I do not repeat information.
12. As a user, I want each missing-detail prompt to explain why it matters, so that I can prioritize the most safety-critical answers.
13. As a user, I want the gate to preserve my current project details, so that answering questions feels like refining a saved project rather than starting over.
14. As a user, I want the gate to keep the Generate action unavailable or clearly gated when blockers remain, so that I cannot accidentally request an unsafe full packet.
15. As a user, I want the gate to distinguish "needs details" from "blocked for safety," so that I know whether more information can unblock the plan.
16. As a user, I want the gate to avoid raw schema, validation, or AI terminology, so that the experience feels like woodworking planning help.
17. As a user, I want Boardsmith to state when browser print, CAD, export, shopping, or approval are not part of this readiness decision, so that I understand the product boundary.
18. As a user reviewing a failed generation attempt, I want the gate to make the next safe action clearer than a generic failure message.
19. As a user with an older saved plan, I want the gate not to hide or invalidate previous readable versions unless they have a clear review problem.
20. As a user with an archived project, I want the gate to respect the archived read-only state, so that restore remains the edit-enabling action.
21. As a future natural-language user, I want to type any project idea and learn what level of output is allowed, so that universal intake still respects safety boundaries.
22. As a future natural-language user, I want Boardsmith to convert broad ideas into structured clarification questions, so that I can move toward a supported build packet.
23. As a future Visual Plan Packet user, I want the gate to confirm enough structured data exists before visual diagrams are trusted, so that the visuals do not look more certain than the plan.
24. As a private tester, I want readiness states to be visible in dogfood, so that repeated friction can guide later product work.
25. As a maintainer, I want the gate to reuse deterministic review rules, so that the same project does not receive conflicting outcomes in intake, generation, detail, and print.
26. As a maintainer, I want the gate to be covered by behavior tests, so that safety-sensitive state transitions do not regress.
27. As a maintainer, I want the gate to keep unsupported and blocked states out of generated-plan persistence, so that invalid build packets are not saved.
28. As a maintainer, I want the gate to be separate from the Visual Plan Packet implementation, so that readiness can be hardened before investing in more visuals.
29. As a maintainer, I want the gate to produce structured readiness data, so that future dashboard/list signals can reuse it without duplicating logic.
30. As a maintainer, I want the first slice to avoid new packages, migrations, auth, export, image upload, public sharing, shopping, pricing, vendor, or payment scope, so that the feature stays inside the private MVP boundary.

## Implementation Decisions

- The first slice runs after structured intake and before full plan generation.
- The feature must remain compatible with future natural-language-first intake, but natural-language input is not required for the first slice.
- The readiness outcome should be represented as structured domain data, not as ad hoc copy embedded in a page.
- The five readiness outcomes are the product contract: ready for full plan, needs details, concept only, unsupported, and blocked for safety.
- "Needs details" must produce specific questions with reasons, grouped by project facts such as dimensions, material, mounting, expected use, safety-sensitive use, tools, finish, and exposure.
- The gate should reuse the existing deterministic review vocabulary and current supported project types.
- Wall shelves are the proving ground for the first high-fidelity readiness behavior because they already have shelf layout, support, buying-plan, and print-flow dogfood.
- Unsupported or blocked outcomes must not call the full AI generation flow and must not persist generated plan records.
- Concept-only output may describe what needs to be clarified, but it must not include cut lists, build steps, exact fabrication dimensions, or mounting instructions.
- Archived projects remain read-only. Restore remains the action that enables edits or generation.
- Existing saved plan versions remain readable unless a specific review state says the plan should not be treated as a trusted packet.
- The gate should feed the later Visual Plan Packet PRD by making clear when deterministic visuals are allowed to render as build-plan visuals.

## Testing Decisions

- Test the readiness classifier at the highest deterministic seam available, using project-shaped inputs rather than page text where possible.
- Cover all five readiness outcomes.
- Cover supported wall shelves with enough detail becoming ready for full plan.
- Cover supported wall shelves with missing total height, material thickness, shelf count, shelf layout, or support method becoming needs-details.
- Cover separate wall shelves without incorrectly treating individual board thickness as connected-unit total height.
- Cover connected shelf units with unresolved support/frame details.
- Cover child-adjacent, seating, ladder/platform, overhead, structural, electrical/lighted, outdoor, and heavy-shelving language.
- Cover unsupported or adjacent project ideas without allowing generated plan persistence.
- Cover archived projects preserving read-only state.
- Cover user-facing route rendering for the readiness panel, including no raw Zod/schema/stack/internal error wording.
- Cover that blocked or unsupported states do not expose an active full-generation action.
- Cover that ready states preserve current generation behavior.
- Reuse existing rendered-route and view-model test patterns.
- Run the standard repo verification stack before any implementation commit: tests, lint, typecheck, build, and whitespace check.

## Out of Scope

- No public marketing site or launch page.
- No new public sharing, auth expansion, production multi-user behavior, or RLS work.
- No app-generated PDF, SVG, DXF, CAD, CNC, FreeCAD, fabrication-ready output, or export/download pipeline.
- No image upload or AI-generated build-truth imagery.
- No shopping, pricing, vendors, inventory, cart, marketplace, Etsy automation, payments, or subscriptions.
- No new project type expansion in the first slice.
- No natural-language-first UI implementation in the first slice.
- No full Visual Plan Packet implementation in this PRD.
- No structural, wall-safety, load-rating, child-safety, or professional approval claims.

## Further Notes

This PRD is paired with the follow-up Visual Plan Packet PRD. The gate decides whether Boardsmith has enough safe, supported, structured detail to produce a full packet. The visual packet then makes the approved project feel like a real shop plan through deterministic visuals, part labels, dimensioned views, cut layout, buying plan, build steps, and browser print.

Research on woodworking plans reinforced the need for this split: strong plans combine drawings, cut lists, materials, and step guidance, but those visuals only help when the underlying dimensions and safety assumptions are trustworthy.
