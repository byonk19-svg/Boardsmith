---
target: /projects/new
total_score: 31
p0_count: 0
p1_count: 2
timestamp: 2026-06-12T15-12-28Z
slug: app-projects-new-page-tsx
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Loading and server error states exist, but the long form has no progress/current-section affordance. |
| 2 | Match System / Real World | 4 | Uses plain woodworking planning language, real dimensions, material thickness, tools, and safety context. |
| 3 | User Control and Freedom | 3 | Starter choices are reversible and fields are editable, but there is no top/bottom escape or save-position helper in the long form. |
| 4 | Consistency and Standards | 3 | Component vocabulary is consistent; minor issue: route nav does not show the current page. |
| 5 | Error Prevention | 4 | Strong constraints on numeric fields, required fields, tool choices, and safety-sensitive copy. |
| 6 | Recognition Rather Than Recall | 3 | Inline help is strong, but users must remember the overall form path once deep in the page. |
| 7 | Flexibility and Efficiency | 2 | Good starters exist, but no efficient repeat-user path, section jump, sticky submit, or keyboard accelerator. |
| 8 | Aesthetic and Minimalist Design | 3 | Calm and on-brand; the page is long and copy lines run wide in several places. |
| 9 | Error Recovery | 3 | Invalid intake recovery and draft preservation are represented, but error feedback is mostly page-level rather than field-local. |
| 10 | Help and Documentation | 3 | Help text is abundant and contextual, though the starter scaffold is collapsed by default. |
| **Total** | | **31/40** | **Good** |

## Anti-Patterns Verdict

**LLM assessment**: The page does not read as generic AI output. It is restrained, practical, and consistent with Boardsmith's private planning-aid posture. The strongest product signals are the cautious safety copy, real woodworking dimensions, explicit material thickness, tool availability constraints, and the final before-saving review panel. It does have a few saturated product-form issues: a long vertical path with the only submit at the bottom, repeated card/form rhythm, and no progress affordance.

**Deterministic scan**: CLI detector found 0 issues in `app/projects/new/page.tsx`. Browser overlay found 8 rendered anti-pattern signals: 7 line-length findings around roughly 96 to 121 characters per line, plus a cream-palette warning and a single-font warning. The line-length findings are legitimate for several help/review blocks at desktop width. The single-font warning is a false positive for this product register: system sans is the documented design system. The cream-palette warning is mostly a false positive because `#f7f4ef` is already the project identity, but it remains a useful caution against letting the page become beige and decorative.

**Visual overlays**: Overlay injection succeeded in the browser tab. Console reported the 8 detector findings above. No persistent overlay server remains running.

## Overall Impression

This is a good private-MVP intake screen. It is trustworthy, clear, and safety-forward. The biggest opportunity is not a visual redesign; it is reducing long-form friction by making progress, section structure, and the final save action easier to maintain while the user is deep in the form.

## What's Working

1. Safety posture is integrated, not bolted on. The intro, starter-loaded state, use/constraints section, and before-saving panel all reinforce planning-aid boundaries.
2. Form grouping matches the real task. Basics, size/material, tools/safety, and use/constraints are natural woodworking planning chunks.
3. Error prevention is strong. Numeric bounds, required fields, material thickness, safe tools, and explicit unsafe-use prompts prevent many bad plans before generation.

## Priority Issues

**[P1] The long intake has no progress or persistent action affordance**

**Why it matters**: The rendered page is about 2068px tall at desktop viewport height. Users fill multiple high-effort fields before seeing the final submit. A first-timer or distracted user can lose confidence about how much remains and where the save action is.

**Fix**: Add a compact section progress rail or sticky bottom action summary that shows the four form groups and keeps `Save project intake` reachable after the user starts editing. Keep it quiet and product-like, not a wizard unless the form is actually split into steps.

**Suggested command**: `$impeccable layout /projects/new`

**[P1] Tool selection exceeds the working-memory limit**

**Why it matters**: The tools checklist shows many choices at once. This is cognitively heavier than the rest of the form, especially because tool choice affects generated guidance and safety.

**Fix**: Group tools into practical categories such as layout, cutting, drilling/fastening, sanding/finishing. Keep the same checkboxes, but add structure so the user scans by activity rather than reading a flat list.

**Suggested command**: `$impeccable layout /projects/new`

**[P2] Several help/review lines are too wide**

**Why it matters**: The detector caught rendered line lengths around 96 to 121 characters. Long help text slows careful reading, which matters on a form where details change safety review quality.

**Fix**: Add `max-w-2xl` or equivalent text measures to form group descriptions, starter explanation, and before-saving review copy. Do not narrow inputs themselves; narrow only explanatory prose.

**Suggested command**: `$impeccable typeset /projects/new`

**[P2] Starter examples are useful but too easy to skip**

**Why it matters**: The starter section is a strong first-timer scaffold, but it is collapsed by default unless an example or unknown example is in the URL. A first-time user landing fresh may miss the fastest route to a good intake.

**Fix**: Consider showing 2-3 starter links as compact chips or an always-visible "Start from a safe example" row above the form, while keeping the detailed examples collapsible.

**Suggested command**: `$impeccable onboard /projects/new`

**[P3] Route and polish details are slightly under-specified**

**Why it matters**: The current nav does not visually mark `New Project` as active, and the dev console reports a missing `favicon.ico`. Neither blocks the task, but both reduce product finish.

**Fix**: Add active-route styling when the app has a route-aware nav component, and add a basic favicon later.

**Suggested command**: `$impeccable polish /projects/new`

## Persona Red Flags

**Jordan (First-Timer)**: Jordan gets good guidance once inside the form, but the first screen shows a collapsed starter area and then a long form. The primary first-time shortcut is present but not prominent enough. Jordan may start typing from scratch instead of using a safer example.

**Sam (Accessibility-Dependent User)**: Native labels and form controls are generally good. Risk areas are long unbounded help text, color-coded warning/success panels that should keep explicit text, and a long tab path with no section navigation or persistent submit affordance.

**Casey (Distracted Mobile User)**: Casey has to scroll through a long form, make many tool choices, and reach the bottom to save. If interrupted mid-flow, the page structure is understandable but does not provide a persistent "where am I / what is left / save when ready" aid.

**Private dogfood maker**: This user wants to get a real project into the system without overthinking. The screen is trustworthy, but tool choice and the long form can make the intake feel heavier than the small-project goal.

## Minor Observations

- The copy is strong but occasionally repeats "planning aid" and safety caveats close together. Keep the warnings, but compress repeated reminders when they appear in the same viewport.
- `Start from an exampleoptional editable starters` appears in the accessibility snapshot as one combined summary label. The visual text is understandable, but screen-reader phrasing would be cleaner if the secondary phrase were separated or moved out of the summary label.
- The active navigation state is absent. Users can infer location from the page title, but top nav should eventually confirm it.
- Browser console reports `favicon.ico` 404 during dev.

## Questions to Consider

- What if the user could see the four intake sections and save action after scrolling past the heading?
- Should starters be the first-class path for private dogfood rather than an optional drawer?
- Can the tools section ask "what can you safely use?" without presenting a flat wall of options?
- Which safety reminders need to be repeated, and which can be consolidated because they are already visible nearby?
