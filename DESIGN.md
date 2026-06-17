---
name: Heritage Workshop
description: Boardsmith design system for a warm, precise digital craftsmanship workspace.
colors:
  surface: "#fbf9f4"
  surface-dim: "#dbdad5"
  surface-bright: "#fbf9f4"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f3ee"
  surface-container: "#f0eee9"
  surface-container-high: "#eae8e3"
  surface-container-highest: "#e4e2dd"
  on-surface: "#1b1c19"
  on-surface-variant: "#414846"
  inverse-surface: "#30312e"
  inverse-on-surface: "#f2f1ec"
  outline: "#717976"
  outline-variant: "#c1c8c4"
  surface-tint: "#46645c"
  primary: "#16342d"
  on-primary: "#ffffff"
  primary-container: "#2d4b43"
  on-primary-container: "#99bab0"
  inverse-primary: "#adcec3"
  secondary: "#a14000"
  on-secondary: "#ffffff"
  secondary-container: "#fe7f3c"
  on-secondary-container: "#652600"
  tertiary: "#3d2b1d"
  on-tertiary: "#ffffff"
  tertiary-container: "#554131"
  on-tertiary-container: "#c9ad99"
  error: "#ba1a1a"
  on-error: "#ffffff"
  error-container: "#ffdad6"
  on-error-container: "#93000a"
  primary-fixed: "#c8eadf"
  primary-fixed-dim: "#adcec3"
  on-primary-fixed: "#01201a"
  on-primary-fixed-variant: "#2e4c44"
  secondary-fixed: "#ffdbcc"
  secondary-fixed-dim: "#ffb694"
  on-secondary-fixed: "#351000"
  on-secondary-fixed-variant: "#7b2f00"
  tertiary-fixed: "#fbddc7"
  tertiary-fixed-dim: "#dec1ac"
  on-tertiary-fixed: "#28180b"
  on-tertiary-fixed-variant: "#574333"
  background: "#fbf9f4"
  on-background: "#1b1c19"
  surface-variant: "#e4e2dd"
typography:
  display-lg:
    fontFamily: "Source Serif 4"
    fontSize: "48px"
    fontWeight: "700"
    lineHeight: "56px"
    letterSpacing: "-0.02em"
  headline-lg:
    fontFamily: "Source Serif 4"
    fontSize: "32px"
    fontWeight: "600"
    lineHeight: "40px"
  headline-lg-mobile:
    fontFamily: "Source Serif 4"
    fontSize: "28px"
    fontWeight: "600"
    lineHeight: "36px"
  title-md:
    fontFamily: "Inter"
    fontSize: "18px"
    fontWeight: "600"
    lineHeight: "24px"
  body-lg:
    fontFamily: "Inter"
    fontSize: "16px"
    fontWeight: "400"
    lineHeight: "24px"
  body-sm:
    fontFamily: "Inter"
    fontSize: "14px"
    fontWeight: "400"
    lineHeight: "20px"
  label-caps:
    fontFamily: "JetBrains Mono"
    fontSize: "12px"
    fontWeight: "500"
    lineHeight: "16px"
    letterSpacing: "0.05em"
rounded:
  sm: "0.125rem"
  DEFAULT: "0.25rem"
  md: "0.375rem"
  lg: "0.5rem"
  xl: "0.75rem"
  full: "9999px"
spacing:
  unit: "8px"
  container-padding-desktop: "40px"
  container-padding-mobile: "20px"
  gutter: "24px"
  section-gap: "64px"
  component-gap: "16px"
---

# Design System: Heritage Workshop

## Brand And Style

Boardsmith uses the Heritage Workshop system. The philosophy is Digital Craftsmanship: traditional woodworking clarity translated into a modern private planning workspace. The app should feel tactile, sturdy, calm, and precise, like a clean walnut workbench with labeled tools close at hand.

The aesthetic is industrial-chic, not generic SaaS. It should move away from plain white admin screens toward a warm, high-fidelity environment that feels reliable, organized, and premium. The target user is a discerning maker who values precision, quality materials, clear hierarchy, and review-before-building discipline.

The emotional response should be confidence, calm focus, and professional pride. The UI should make project state, dimensions, missing information, safety review, and next action obvious without becoming noisy or decorative.

## Colors

The palette is anchored in natural workshop materials. The primary background is a warm Birch neutral that reduces eye strain during long planning sessions.

- Forest Green (`#2d4b43`): Primary success actions, ready states, and active navigation. It represents the start of useful project work.
- Safety Orange (`#a14000` / `#fe7f3c`): High-priority review markers, caution states, and critical status indicators. Use it like workshop safety markings, not decoration.
- Deep Walnut (`#3d2b1d` / `#554131`): Secondary brand depth and subtle material accents.
- Warm Slate And Charcoal (`#414846`, `#30312e`): Text and utility neutrals. Grays should remain warm-toned so the interface feels organic rather than clinical.
- Birch Surfaces (`#fbf9f4`, `#f5f3ee`, `#f0eee9`, `#eae8e3`): Page canvas, panels, card layers, and quiet grouping surfaces.

## Typography

The type system pairs a sturdy serif with a utilitarian sans-serif.

- Source Serif 4: Headings and high-level page moments. It conveys tradition, authority, and the editorial quality of high-end woodworking publications.
- Inter: Body copy, forms, controls, and secondary text. It keeps complex data entry clear and familiar.
- JetBrains Mono: Technical labels, dimensions, quantities, status chips, and metadata. The monospaced texture should evoke blueprints, measurements, and precision.

Use display typography sparingly. Boardsmith is a working app, not a marketing site. Large serif type is appropriate for dashboard and page-level hierarchy, while project forms, review checklists, and generated plan details should stay compact and scannable.

## Layout And Spacing

The layout follows a fixed-fluid hybrid model. Content should max out near 1280px for readability, while the Birch canvas can remain fluid behind it.

- Grid: Use a 12-column mindset for dashboard and overview pages. Cards typically span 4 columns for three-up summaries or 6 columns for two-up project cards.
- Rhythm: Maintain an 8px baseline. Use 16px component gaps, 24px gutters, and 64px section gaps when a page needs breathing room.
- Mobile: Under 768px, collapse to a single column with 20px side margins. Cards should stack vertically, long titles must truncate or wrap safely, and no dashboard surface should create horizontal overflow.
- Density: Operational pages can be denser than dashboard pages. Generated plans, cut lists, and print views should prioritize scan speed over decorative whitespace.

## Elevation And Depth

Hierarchy comes from tonal layers and ambient shadows.

- Level 0 Canvas: Warm Birch background, usually `#f2efe9` or `#fbf9f4`.
- Level 1 Cards/Paper: White or near-white work surfaces with a subtle border and soft shadow. They should feel like sheets of technical paper on a desk.
- Level 2 Popovers/Modals: Use stronger ambient shadow only for temporary interaction.
- Tactile Depth: Buttons and interactive surfaces may use subtle hover shifts and pressed states, but motion should remain restrained and practical.

Use borders and tonal layering before shadows. Do not make every repeated list item feel like a floating marketing card.

## Shapes

The shape language is soft but structural.

- Inputs and compact controls: 4px to 6px radius.
- Main cards: 8px radius.
- Status chips: 2px to 4px radius, closer to a label-maker or stamped tag than a bubbly badge.
- Avoid oversized rounded corners that make the app feel playful or toy-like.

## Components

### Buttons

- Primary buttons use Forest Green with white text.
- Secondary buttons use a warm neutral or white surface, clear border, and ink text.
- Ghost actions are for low-priority navigation or archive-style actions.
- Pressed states should feel like a physical switch: subtle scale, darker tone, or inner-shadow is enough.
- Keep one dominant primary action per major section.

### Cards

Project cards should include a status strip or clear state marker tied to the project lifecycle. Recent-project cards may include a generated preview, material metadata, dimensions, updated date, and direct actions.

Use bottom metadata bars or mono labels for dimensions and material details. Do not hide project state behind color alone.

### Input Fields

Fields use a paper metaphor: white background, warm neutral stroke, and clear focus ring. On focus, shift the stroke toward Forest Green or Walnut with a visible low-opacity ring.

Form help text should explain what the field changes, what the system can infer, and what still needs manual review.

### Status Indicators

- Draft: Warm neutral outline or subdued chip.
- Plan Generated: Forest Green tint or solid green when a strong ready-to-review signal is needed.
- Needs Review: Safety Orange or amber panel with explicit review copy.
- Blocked/Missing Info: Amber warning surface with next action.
- Error: Red only for actual failed operations or destructive-risk states.

Text must carry the meaning. Color is reinforcement, not the only signal.

### Custom Woodworking Icons

When icons are used, prefer line icons with a 1.5px stroke weight and a workshop vocabulary: hand plane for refining, drafting triangle for planning, saw for building, ruler for dimensions, clamp for assembly, and sheet for print views.

Avoid generic SaaS icons when a woodworking-specific symbol would be clearer.

## Boardsmith Product Guardrails

Boardsmith is a private MVP for cautious, reviewable woodworking and craft planning. The design must support that product truth.

- Generated plans are planning aids, not professional approvals.
- Do not imply load rating, structural safety, child-safety certification, CAD/CNC readiness, fabrication certainty, public sharing, payments, vendors, subscriptions, or marketplace behavior.
- Safety notes, missing information, assumptions, dimensions, quantities, material review, mounting review, and open questions must remain visible near build, print, generate, and revise actions.
- Wall mounting, child/baby use, chairs, stools, benches, ladders, platforms, heavy shelving, electrical/lighted signs, outdoor load exposure, unclear dimensions, and missing material thickness need explicit review treatment.
- Print sheets should feel like job packets: practical, readable, caution-forward, and stripped of app chrome.

## Page Patterns

### Dashboard

The dashboard is a private workbench, not a landing page. It should show active projects, generated-plan readiness, draft projects needing generation, latest update, recent projects, and an obvious new-project entry point. It may use the richest visual treatment in the app, including warm canvas texture, serif headings, and project-preview artwork.

### Project Intake

Intake should help the user discover missing information before generation. Keep fields grouped around the decisions a builder actually needs: object type, dimensions, material, thickness, mounting/support, expected load or use, environment, tools, and safety-sensitive conditions. Use helper copy and live summaries to explain what is still unknown.

### Project Detail

The detail page is the core workspace. It should answer: what is this project, does a generated plan exist, what must be reviewed first, what actions are available, what changed, and what can be printed.

Default hierarchy: title/status/primary action, plan readiness, review-before-building summary, generated plan or no-plan state, diagrams, materials, cut list, build steps, safety notes, assumptions/open questions, build notes, and history.

### Generated Plan Display

Generated plans should be easy to scan and verify. Use section cards, clear dividers, readable measurements, visible warnings, and compact metadata. Do not hide critical safety content behind disclosure.

### Print View

Printable plan sheets should prioritize project name, build snapshot, visual reference, materials, cut list, buying plan, build steps, check-before-building items, safety notes, assumptions, and plan version/date. The print path is browser print only unless a future explicit export feature is approved.

### Empty States

Empty states should be useful, not cute. State what is missing, why it matters, and the next best action. Provide a real link or button.

## Do And Don't

Do:

- Use warm workshop surfaces and material-inspired depth.
- Use Source Serif 4 for page-level moments and Inter for working UI.
- Use JetBrains Mono for dimensions, quantities, metadata, and status labels.
- Keep review copy near actions that could imply build readiness.
- Make lifecycle states explicit: draft, ready to generate, generated, needs review, archived, printable, read-only.
- Validate mobile layout for every dashboard or card change.
- Preserve readable print output.

Don't:

- Make Boardsmith look like a SaaS marketing site, playful AI toy, hobby blog, CAD package, store, or marketplace.
- Add gradient text, glassmorphism, bouncy motion, decorative icon grids, or one-note beige/brown styling.
- Hide primary actions, build steps, safety notes, assumptions, or open questions.
- Use color without text for warning or readiness state.
- Over-round cards or buttons.
- Introduce new packages, external services, image upload, export, auth, public sharing, payments, or marketplace surfaces as part of visual polish.
