# Boardsmith UX Polish Audit

Date: June 10, 2026

Perspective: first-time private MVP user reviewing Boardsmith as a cautious woodworking planning aid.

Scope inspected: private access entry, dashboard, project list, project creation/intake, project detail, generated plan view, plan review, browser print preview, no-plan states, invalid-intake state, archived-project state, settings, loading/pending copy, and error/blocked copy visible in the current implementation.

Guardrails: practical private-MVP polish only. This audit does not recommend public launch work, paid integrations, app-generated PDF/export work, CAD/CNC, auth expansion, marketplace/shopping, or major rewrites.

## 1. Quick Copy/Polish Wins

### 1.1 Rename "Generate another plan version" on archived projects

- **Problem:** Archived project detail still shows the primary action text "Generate another plan version" in the actions panel, even though archived projects are intended to block revision/generation work until restored.
- **Why it matters:** A first-time user can click the primary action, hit a blocked state, and conclude the archive lifecycle is inconsistent.
- **Suggested fix:** On archived detail pages, replace generation/revision CTAs with a disabled-looking explanation or a single "Restore project to revise or generate" action. Keep print preview available.
- **Estimated size:** S
- **Risk level:** Low

### 1.2 Clarify "Export readiness" as future-planning language

- **Problem:** The detail page uses "Export readiness," "SVG," "PDF," "DXF," and "CAD" labels even though exports are explicitly out of scope for the private MVP.
- **Why it matters:** Users may over-trust the plan as closer to fabrication/export readiness than it is, or wonder why export-looking statuses appear with no export action.
- **Suggested fix:** Rename visible headings to "Future output notes" or "Future export review notes" and make the first sentence say there is no downloadable export in this MVP.
- **Estimated size:** S
- **Risk level:** Low

### 1.3 Make "No generated plan yet" more actionable

- **Problem:** The no-plan state says invalid generated JSON will not be saved, which is accurate but developer-facing.
- **Why it matters:** A first-time user mainly needs to know what to do next and what will happen if generation fails.
- **Suggested fix:** Use copy like: "Generate a first plan from Project actions. Boardsmith will save only validated plans; if review blocks generation, you will see what needs attention."
- **Estimated size:** S
- **Risk level:** Low

### 1.4 Tighten generic project-list error display

- **Problem:** `/projects` renders any `error` query string directly as user-facing text.
- **Why it matters:** Raw error strings can feel unfinished and may expose internal wording if future routes pass through technical messages.
- **Suggested fix:** Map known error keys to calm copy and use a generic fallback: "Something went wrong. Try again or return to the active project list."
- **Estimated size:** S
- **Risk level:** Medium

### 1.5 Normalize naming for print-related UI

- **Problem:** The app uses "Browser print preview," "Printable Plan Sheet," "Future export notes," and "Use your browser's print dialog" across related surfaces.
- **Why it matters:** The supported output path is correct but the labels feel like separate features.
- **Suggested fix:** Pick one user-facing phrase, such as "Browser print plan," and use it consistently on detail, print preview, and no-plan print states.
- **Estimated size:** S
- **Risk level:** Low

## 2. Navigation/Workflow Friction

### 2.1 Detail page starts with many equal-weight sections

- **Problem:** A generated project detail page presents actions, jump links, intake, safety review, template guidance, structure, plan review, output readiness, tweak flow, comparison, printable plan, history, notes, and build log.
- **Why it matters:** The data is useful, but a first-time user has to infer the intended sequence: review intake, review safety, read latest plan, print, optionally tweak, then record build notes.
- **Suggested fix:** Add a compact "Next step" strip near the top based on state: no plan, generated plan, revised plan, archived project, or blocked generation. Keep the existing sections; just orient the user.
- **Estimated size:** M
- **Risk level:** Low

### 2.2 Project actions duplicate similar destinations

- **Problem:** Dashboard and list cards often show both "Open project" and "View latest plan" linking to the same project detail route.
- **Why it matters:** This looks unfinished because the labels imply different destinations.
- **Suggested fix:** Either make "View latest plan" deep-link to `#printable-plan-sheet` or collapse to one primary action plus a secondary "Print plan" when a plan exists.
- **Estimated size:** S
- **Risk level:** Low

### 2.3 Archive workflow has visible restore affordances but weak state transition framing

- **Problem:** Archived detail pages correctly explain preservation, but the action panel still mixes active-project actions with restore.
- **Why it matters:** The user has to discover which actions are allowed by trying them or reading multiple sections.
- **Suggested fix:** Put archived pages into a clear review mode: banner first, restore as the only edit-enabling action, plan/print/history read-only below.
- **Estimated size:** M
- **Risk level:** Medium

### 2.4 Intake examples compete with the actual form

- **Problem:** `/projects/new` includes a long example block above the form, then the user has to scroll before entering the project.
- **Why it matters:** Examples are helpful, but first-time users may not realize they can either choose a starter or skip directly to fields.
- **Suggested fix:** Convert examples into compact starter cards or a "Use a starter" row with a clear "or fill in your own details below" bridge.
- **Estimated size:** M
- **Risk level:** Low

### 2.5 Filters are powerful but dense for a private MVP list

- **Problem:** Project list filters expose search, type, status, plan state, record state, and archive at once.
- **Why it matters:** In a crowded dogfood workspace this is useful, but a first-time user may see it as admin tooling before seeing projects.
- **Suggested fix:** Keep search and archive visible; tuck less common filters behind "More filters" or visually group them as optional.
- **Estimated size:** M
- **Risk level:** Low

## 3. Generated-Plan Readability Issues

### 3.1 Template mismatch is hard to diagnose

- **Problem:** A sampled generated project titled "Basic outdoor planter box shell" rendered as a "Door hanger" project type and door-hanger template guidance.
- **Why it matters:** Even if this came from test data, first-time users may lose trust when title, project type, and generated guidance appear mismatched.
- **Suggested fix:** Add a prominent "Project type" review row before generation and a detail-page warning when title/intended-use terms appear to conflict with the selected type.
- **Estimated size:** M
- **Risk level:** Medium

### 3.2 Plan detail mixes generated plan, deterministic model, and future-output checks

- **Problem:** The plan view uses terms like deterministic planning model, generated plan, manifest, model confidence, export readiness, modeled operations, and generated cuts.
- **Why it matters:** These are precise internal concepts, but first-time users need a shop-plan reading order.
- **Suggested fix:** Keep technical review sections available, but lead with a plain "Read this first" summary: what to verify, what to cut, what to assemble, what is unresolved.
- **Estimated size:** M
- **Risk level:** Low

### 3.3 Unknown dimensions appear late and may not feel blocking enough

- **Problem:** Generated/derived plan sections can show placeholder pieces with "length unknown" or "missing x missing" while still providing build-flow content.
- **Why it matters:** Missing dimensions are one of the highest-risk woodworking trust issues.
- **Suggested fix:** When any cut-list item has unknown dimensions, add a top-of-plan warning with a direct link to the cut-list review and wording like "Do not cut this piece until dimensions are resolved."
- **Estimated size:** S
- **Risk level:** Medium

### 3.4 Plan history comparison lacks a first-time mental model

- **Problem:** Plan history and comparison are present, but users must infer that "Tweak this plan" creates a new latest version and preserves older versions.
- **Why it matters:** Revision confidence depends on understanding that prior plans are not overwritten.
- **Suggested fix:** Add one short line above plan history: "Each generation or tweak saves a new version; older versions remain read-only for comparison."
- **Estimated size:** S
- **Risk level:** Low

### 3.5 Print preview is strong but still visually tied to app navigation

- **Problem:** Browser print preview includes normal app header/nav in screen view, then hides it for print.
- **Why it matters:** A first-time user may not immediately know whether this is the final printable surface or just another detail page.
- **Suggested fix:** Make the no-print toolbar more print-specific: "Browser print plan" heading, "Back to project," and a clear "Press Ctrl+P / browser print" instruction.
- **Estimated size:** S
- **Risk level:** Low

## 4. Trust/Safety Gaps

### 4.1 Safety flags can be surprising when triggered by cautious wording

- **Problem:** A sampled archived plant-riser project triggered child/baby, seating/load-bearing, and outdoor flags even though the intended-use text explicitly said no child use, no seating, no load-rating, and no structural use.
- **Why it matters:** Conservative flags are acceptable, but false-positive-looking flags can make users distrust the review system.
- **Suggested fix:** Label these as "Review triggers" rather than implied detected hazards, and add copy that flags may be triggered by safety-sensitive terms even when the user is excluding that use.
- **Estimated size:** S
- **Risk level:** Medium

### 4.2 Settings page exposes deferred scope but not user-facing safety posture

- **Problem:** Settings says OpenAI and Supabase are configured, then lists deferred features.
- **Why it matters:** A first-time private user may look there for confidence about privacy, storage, or plan safety and find mostly implementation state.
- **Suggested fix:** Add a short "Private MVP posture" section: private access gate, planning-aid-only, saved project data, no public sharing, no exports.
- **Estimated size:** S
- **Risk level:** Low

### 4.3 Access page explains temporary auth but not what happens after access

- **Problem:** The password gate says it is a temporary private MVP gate, not multi-user authentication.
- **Why it matters:** That is honest, but a first-time user may still wonder whether their projects are private, shared, or tied to an account.
- **Suggested fix:** Add one sentence: "This private test workspace is shared according to the current MVP storage setup; do not enter sensitive customer or production data."
- **Estimated size:** S
- **Risk level:** Medium

### 4.4 Generation pending state does not set expectations about validation outcomes

- **Problem:** The pending state says generation can take a minute and to keep the page open.
- **Why it matters:** If generation later blocks, the user may experience it as a failure rather than a safety gate.
- **Suggested fix:** Add a short pending note: "Boardsmith may block unsafe or incomplete output instead of saving it."
- **Estimated size:** S
- **Risk level:** Low

### 4.5 Browser print is the only output, but "no export" appears mostly as caveat text

- **Problem:** The print route says no app-generated export/download is available in review reminders, while detail page still contains future export terminology.
- **Why it matters:** Users may try to find a missing download button.
- **Suggested fix:** Put a small persistent note near print actions: "This MVP uses browser print only; no PDF or CAD download is generated."
- **Estimated size:** S
- **Risk level:** Low

## 5. Mobile/Responsive Issues

### 5.1 Header navigation can consume the first mobile viewport

- **Problem:** The global header stacks brand plus four nav links, then page content starts below.
- **Why it matters:** On mobile, the user sees navigation before task context, especially on form and detail pages.
- **Suggested fix:** Tighten mobile header spacing and consider a single row with wrapped links or a compact nav treatment.
- **Estimated size:** S
- **Risk level:** Low

### 5.2 Project list filters create a long pre-list mobile path

- **Problem:** On mobile, all filters stack before project cards.
- **Why it matters:** First-time users may not reach their projects quickly, especially with six controls plus action buttons.
- **Suggested fix:** Keep search visible and collapse advanced filters by default on narrow screens.
- **Estimated size:** M
- **Risk level:** Low

### 5.3 Wide tables rely on horizontal scrolling

- **Problem:** Cut-list tables use `min-w-[640px]` and horizontal overflow.
- **Why it matters:** This is functional, but mobile users may miss columns or not realize the table scrolls.
- **Suggested fix:** Add a small "Scroll sideways to review all columns" hint on screen-only mobile, or switch cut rows to stacked cards below a breakpoint.
- **Estimated size:** M
- **Risk level:** Low

### 5.4 Detail jump links can become a large block

- **Problem:** Project section jump links wrap into many pills on detail pages with generated plans.
- **Why it matters:** The navigation helps power users, but on mobile it may look like a wall of equal-priority actions.
- **Suggested fix:** Keep only key links visible by default on mobile: Intake, Review, Plan, History, Record. Move the rest below "More sections."
- **Estimated size:** M
- **Risk level:** Low

### 5.5 Long generated titles can dominate cards

- **Problem:** Dogfood/smoke project names with timestamps are visible throughout dashboard and list cards.
- **Why it matters:** The app looks like a test database rather than a trusted planning workspace.
- **Suggested fix:** Add a project title truncation strategy for cards while keeping full title on detail pages, and use archive/hide for smoke projects.
- **Estimated size:** S
- **Risk level:** Low

## 6. Bigger Post-MVP Ideas

### 6.1 First-run guided sample project

- **Problem:** The app has starters, but no guided first-run path that explains the full lifecycle.
- **Why it matters:** First-time private users need to understand intake -> safety review -> generate -> review -> tweak -> print -> build log.
- **Suggested fix:** Add a non-modal first-run checklist or sample-project walkthrough using existing routes and copy only.
- **Estimated size:** L
- **Risk level:** Medium

### 6.2 State-specific project detail layout

- **Problem:** No-plan, generated-plan, revised-plan, archived, and built states share almost the same detail-page layout.
- **Why it matters:** Lifecycle state is the main thing a first-time user needs to understand.
- **Suggested fix:** Create state-specific top summaries while preserving the same underlying sections.
- **Estimated size:** L
- **Risk level:** Medium

### 6.3 Safer project-type correction flow

- **Problem:** If a user chooses the wrong project type during intake, the mismatch persists into template guidance and generation.
- **Why it matters:** Wrong project type can undermine trust and produce irrelevant guidance.
- **Suggested fix:** Add an explicit pre-generation review step or "Duplicate with corrected project type" path. Avoid editing historical generated plans.
- **Estimated size:** L
- **Risk level:** Medium

### 6.4 Review dashboard for unresolved safety and dimension issues

- **Problem:** Safety and missing-dimension issues are visible inside project details, but not summarized across the workspace.
- **Why it matters:** Private testers with many projects need to know which plans are risky or incomplete before opening each one.
- **Suggested fix:** Add dashboard/list signals for unresolved questions, unknown dimensions, and blocked/warning review status.
- **Estimated size:** L
- **Risk level:** Medium

### 6.5 Print-only polish pass after real shop use

- **Problem:** The print plan is useful, but the best print improvements will come from real bench/shop use rather than speculative UI work.
- **Why it matters:** The private MVP output path is browser print, so small paper-layout issues have high practical impact.
- **Suggested fix:** After 3-5 real printed plans, tune section ordering, page breaks, checklist density, and handwritten-note space.
- **Estimated size:** M
- **Risk level:** Low

## Highest-Priority Sequence

1. Fix archived-project action framing so read-only/review mode is obvious.
2. Replace export/CAD-adjacent labels with future-output caveats that do not imply current capability.
3. Improve no-plan, pending, and missing-dimension copy so generation and safety gates feel intentional.
4. Reduce mobile/list/detail density only where it blocks first-time orientation.
5. Defer larger lifecycle layout and guided-first-run ideas until repeated manual dogfood shows the same confusion.
