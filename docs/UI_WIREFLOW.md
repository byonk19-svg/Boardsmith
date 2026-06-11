# Boardsmith UI Wireflow

Date: June 11, 2026

Scope: low-fidelity documentation of the current App Router UI. This document records the real private-MVP flow before visual UI changes. It does not define new runtime behavior.

Guardrails: Boardsmith remains private-only and planning-aid-only. Browser print is the current output path. No app-generated PDF, SVG, DXF, CAD, CNC, public sharing, marketplace, auth expansion, image upload, or payment flow is assumed.

## Current Route Map

```text
Private access gate (optional runtime gate)
  /access
    Continue -> /access/verify -> requested route or /

Workspace entry
  /
    New Project -> /projects/new
    View Projects -> /projects
    Open project -> /projects/[id]
    Browser print plan -> /projects/[id]/print
    Use starter -> /projects/new?example=:slug

Project list
  /projects
    New Project -> /projects/new
    Apply filters -> /projects?...
    Clear filters -> /projects
    Open project / Open to generate / Review archived project -> /projects/[id]
    Browser print plan -> /projects/[id]/print
    Review project record -> /projects/[id]
    Archive project -> POST /projects/[id]/archive -> /projects?archived=1 or detail redirect
    Restore project -> POST /projects/[id]/restore -> /projects?restored=1 or detail redirect

Project intake
  /projects/new
    Use example -> /projects/new?example=:slug
    Save project intake -> POST /projects/create -> /projects/[id]
    Invalid intake -> /projects/new?error=invalid_intake
    Starter chooser -> optional collapsed details section on /projects/new

Project detail
  /projects/[id]
    Back to projects -> /projects
    Generate Plan / Generate another plan version -> POST /projects/[id]/generate -> /projects/[id]?generated=1 or generation_error=...
    Browser print plan -> /projects/[id]/print
    Duplicate project -> POST /projects/[id]/duplicate -> /projects/[new-id]?duplicated=1
    Archive project -> POST /projects/[id]/archive
    Restore project -> POST /projects/[id]/restore
    Section jump links -> #project-intake, #plan-review, #printable-plan-sheet, #plan-history, #project-record
    Create revised plan -> POST /projects/[id]/revise -> /projects/[id]?revised=1&compare_plan=...
    Compare older version -> /projects/[id]?compare_plan=:planId
    Save project notes -> POST /projects/[id]/notes
    Save build log -> POST /projects/[id]/build-log

Print preview
  /projects/[id]/print
    Back to project -> /projects/[id]
    Print build sheet -> browser/OS print dialog
    Browser print command -> browser/OS print dialog
```

## End-to-End Flow

```text
[Private gate if configured]
        |
        v
[Dashboard /]
        |-- New Project ----------------------------.
        |-- Use starter ----------------------------+--> [New project intake]
        |-- View Projects --> [Project list] -- Open ----'
        v
[Project detail: no plan]
        |-- Generate Plan -> validating AI output
        |       |-- saved valid plan -> [Project detail: generated plan]
        |       '-- blocked/error -> [Project detail with feedback]
        |
        '-- Project notes / build log -> same detail page

[Project detail: generated plan]
        |-- Review before building summary -> cut list / open questions / print / compare
        |-- Browser print plan -> [Print preview / build sheet]
        |-- Tweak this plan -> revised generated version -> comparison state
        |-- Compare older plan -> comparison state
        |-- Archive project -> archived read-only detail
        '-- Notes / build log -> same detail page

[Print preview / build sheet]
        '-- Back to project -> generated project detail
```

## Screen Inventory

### Access / Private Gate

Route: `/access`

Screen job: block app routes when `BOARDSMITH_ACCESS_PASSWORD` is configured, while making the temporary private-MVP access model clear.

Primary action: `Continue` submits the password to `/access/verify` and returns to the sanitized requested route or `/`.

Secondary actions: none on the screen. Navigation is not emphasized here.

Empty states: not applicable.

Loading states: no route-level loading component. The form uses native submit behavior.

Error/blocked states: `?error=...` shows "That password did not unlock Boardsmith. Try again." The page also warns that this is not multi-user authentication and that sensitive customer or production data should not be entered.

Mobile considerations: the card is centered with a max width and should remain readable. There is only one form field, so mobile friction is low.

Action arrows:

```text
Continue -> /access/verify -> returnTo or /
Invalid password -> /access?error=...
```

### Dashboard / Project List Entry

Routes: `/` and `/projects`

Screen job: help the private user resume recent work, understand what needs a generated plan, identify plans ready for review/print, start a new intake, or browse/filter the full project list.

Primary action: dashboard `New Project` leads to `/projects/new`; project list `New Project` also leads to `/projects/new`. Project cards use state-aware primary labels such as `Open project`, `Open to generate`, or `Review archived project`.

Secondary actions: `View Projects`, `Browse all projects`, starter links, `Browser print plan`, filters, archive/restore, and review record links.

Empty states: dashboard and list both show "No projects yet" with a first-project CTA. Filtered list states explain no active, archived, or all-project matches and offer clear filters plus `New Project`.

Loading states: no explicit loading page for dashboard or project list. Both are server-rendered dynamic pages.

Error/blocked states: `/projects` maps known error keys to calm copy, shows archive/restore success banners, and keeps archive filters visible. Storage failures are not separately represented in the visible page flow beyond route error behavior.

Mobile considerations: dashboard cards stack cleanly. The project list now puts visible count/plan/archive metrics before filters, keeps search/workspace/apply in the main filter row, and leaves type/status/plan/record controls inside `More filters`. Detail actions inside cards still wrap, but the first scan emphasizes next step and plan state.

Wireframe:

```text
+------------------------------------------------------+
| Boardsmith                         Dashboard Projects |
+------------------------------------------------------+
| Planning aid                                          |
| Private Boardsmith workspace          [New Project]   |
| Resume recent plans...                [View Projects] |
+------------------------------------------------------+
| Total | With generated | Need plans | Latest update   |
+------------------------------------------------------+
| Workspace queue                                      |
| Needs generated plan        Ready to review or print  |
| [Open to generate]          [Open project] [Print]    |
+------------------------------------------------------+
| Recent projects                         Browse all -> |
| +--------------------------------------------------+ |
| | Project title                                    | |
| | type | W x H x D | updated                      | |
| | [Draft] [No generated plan yet]                  | |
| | Next: generate first plan                        | |
| | [Open to generate]                              | |
| +--------------------------------------------------+ |
| | Project title                                    | |
| | [Plan generated] [Latest plan saved]             | |
| | Next: review before building or print            | |
| | [Open project] [Print build sheet]               | |
| +--------------------------------------------------+ |
+------------------------------------------------------+
| Try a starter                         New Project ->  |
| [Starter card ->] [Starter card ->] [Starter card ->] |
+------------------------------------------------------+

New Project -> /projects/new
View Projects / Browse all projects -> /projects
Open project -> /projects/[id]
Print build sheet -> /projects/[id]/print
Use starter -> /projects/new?example=:slug
```

Project list reading order:

```text
Header / New Project
Feedback banners if present
Summary metrics: showing, ready to review, need plans, archived
Find a project: search, workspace, apply
More filters: type, status, plan, record
Filtered result count and active-filter summary
Project cards with next-step label, plan status, record signals, and actions
Empty result state if no cards match
```

### New Project / Intake

Route: `/projects/new`

Screen job: collect a complete, reviewable woodworking project intake before any plan generation happens, while keeping manual entry easy to start.

Primary action: `Save project intake` posts to `/projects/create`, validates form data, saves the project, and redirects to `/projects/[id]`.

Secondary actions: `Use example` links reload the intake with starter values. The starter chooser is now a compact optional details section, so the user can ignore it and start with `Project basics` quickly.

Empty states: not applicable; the form is always present.

Loading states: `app/projects/new/loading.tsx` shows a "Loading project intake" state while the route prepares form details and starter examples.

Error/blocked states: `?error=invalid_intake` displays an amber warning and restores a short-lived draft from a cookie when possible. Unknown starter slugs show a "Starter example was not found" warning, open the starter chooser, and keep the manual form available.

Mobile considerations: the form is long. Fields stack, tool checkboxes become a single-column scan path on narrow screens, and the compact starter chooser keeps the first manual field closer to the first viewport.

Action arrows:

```text
Use example -> /projects/new?example=:slug
Save project intake -> POST /projects/create -> /projects/[id]
Invalid intake -> /projects/new?error=invalid_intake
```

Current reading order:

```text
Intro
Invalid-intake / starter-loaded / unknown-starter notices
Optional starter chooser (collapsed by default)
Project basics
Size and material
Tools and safety context
Use, constraints, and finish notes
Before saving
Save project intake
```

### Project Detail With No Generated Plan

Route: `/projects/[id]` when `listGeneratedPlans(project.id)` returns none.

Screen job: let the user review the saved intake and deterministic review context, then generate the first validated plan.

Primary action: `Generate Plan` posts to `/projects/[id]/generate`.

Secondary actions: back to projects, duplicate project, archive/restore, compact section jump links, notes, build log, and an optional planning-details disclosure. Print and tweak actions are omitted until a generated plan exists.

Empty states: the generated-plan area now appears before the technical planning details and shows "No generated plan yet" with generation guidance. Planning details summarize the derived template/structure state only if the user expands that secondary section.

Loading states: `GeneratePlanForm` changes the button to "Generating plan..." and shows a note that generation can take a minute and may block unsafe or incomplete output instead of saving it.

Error/blocked states: generation can redirect with `generation_error`, shown as a feedback panel with suggestions. Detail update errors use mapped amber feedback. Archived no-plan projects explain that restore is required before generating.

Mobile considerations: project action buttons and jump links wrap. The no-plan summary and generated-plan empty state now appear before the derived planning internals, so mobile users can reach intake review and generation guidance sooner.

Wireframe:

```text
+------------------------------------------------------+
| Back to projects                                     |
| Project title                         +------------+ |
| type | skill | draft                  | Actions    | |
|                                      | [Generate]  | |
|                                      | [Duplicate] | |
|                                      | [Archive]   | |
|                                      +------------+ |
+------------------------------------------------------+
| Next step: Review intake, then generate a first plan  |
| [Review intake] [Project actions]                     |
+------------------------------------------------------+
| No plan summary: intake ready / triggers / next action|
+------------------------------------------------------+
| Project sections: [Intake] [Record]                   |
+---------------------------+--------------------------+
| Project intake            | Review triggers          |
| dimensions/material/tools | flags or no flags        |
+---------------------------+--------------------------+
| No generated plan yet                                |
| Generate a first plan from Project actions...         |
+------------------------------------------------------+
| > Planning details before generation                  |
|   template + derived structure summary                |
+------------------------------------------------------+
| Project record: [notes form] [build log form]         |
+------------------------------------------------------+

Generate Plan -> POST /projects/[id]/generate
Duplicate project -> POST /projects/[id]/duplicate
Archive project -> POST /projects/[id]/archive
Planning details -> expands on page only
Save notes -> POST /projects/[id]/notes
Save build log -> POST /projects/[id]/build-log
```

### Project Detail With Generated Plan

Route: `/projects/[id]` with at least one generated plan.

Screen job: present the latest saved generated plan version with a plain-language review-before-building summary first, then deterministic review panels, comparison/history, revision flow, browser print entry, and project record.

Primary action: use the state-aware `Recommended next step`, then use `Review before building` as a compact checklist for cut list, materials, safety notes, open questions, browser print, and version comparison. `Generate another plan version` remains available from Project actions for active projects.

Secondary actions: `Tweak this plan`, compare older plan versions, duplicate, archive/restore, notes, build log, and section jump links.

Empty states: generated plan subsections have local empty/fallback copy for missing summary, missing generated cut rows, unsupported diagrams, no unresolved questions, or no plan-history comparison.

Loading states: generation and revision forms have client-side pending labels: "Generating another plan version..." and "Creating revised plan..." with keep-page-open guidance.

Error/blocked states: missing OpenAI key, blocked generation, revision failure, missing dimensions, update failures, and archived read-only states all have visible panels or inline messages. Unknown cut dimensions trigger a prominent "Resolve missing cut dimensions" next-step panel and a cut-list warning.

Mobile considerations: this is still the densest screen. The new summary stacks into four linked review cards before the section navigation, giving mobile users a shorter first scan path before the longer detail sections. Cut-list tables still use horizontal scrolling with a mobile hint.

Wireframe:

```text
+------------------------------------------------------+
| Back to projects                                     |
| Project title                         +------------+ |
| type | skill | plan generated         | Actions    | |
|                                      | [Generate]  | |
|                                      | [Print]     | |
|                                      | [Duplicate] | |
|                                      | [Archive]   | |
|                                      +------------+ |
+------------------------------------------------------+
| Next step: Review the generated plan                  |
| [Plan review] [Cut list] [Browser print plan]         |
+------------------------------------------------------+
| Review before building                                |
| Generated plan ready              [Review: status]    |
| [Cut list check] [Materials check] [Safety notes]     |
| [Open questions]                                      |
| [Review cut list] [Open questions] [Browser print]    |
| [Compare versions]                                    |
+------------------------------------------------------+
| Project sections: [Intake] [Structure] [Plan review]  |
| [Tweak this plan] [Comparison] [Print] [History] ...  |
+---------------------------+--------------------------+
| Project intake            | Review triggers          |
+---------------------------+--------------------------+
| Template Guidance                                    |
+------------------------------------------------------+
| Project Structure / build model / material review     |
+------------------------------------------------------+
| Plan Review | Future output notes                     |
+------------------------------------------------------+
| Tweak this plan                                      |
| [revision text area] [Create revised plan]            |
+------------------------------------------------------+
| Plan comparison                                      |
+------------------------------------------------------+
| Browser print plan / Latest generated plan            |
| Overview, checklist, diagrams, materials, cut list,   |
| build steps, safety notes, assumptions, questions     |
+------------------------------------------------------+
| Plan history: Version N [Latest] [Compare]            |
+------------------------------------------------------+
| Project record: [notes form] [build log form]         |
+------------------------------------------------------+

Review cut list -> #cut-list-to-verify
Open questions -> #open-questions
Browser print plan -> /projects/[id]/print
Create revised plan -> POST /projects/[id]/revise
Compare -> /projects/[id]?compare_plan=:planId
Generate another version -> POST /projects/[id]/generate
```

### Generated Plan Surface

Route context: embedded in `/projects/[id]` as `#printable-plan-sheet`.

Screen job: provide a readable browser plan sheet assembled from saved generated output and deterministic review data.

Primary action: read and manually review the plan; from the page-level actions, open browser print plan.

Secondary actions: jump to cut list from missing-dimension warnings; use section navigation; compare/tweak from adjacent sections.

Empty states: plan sheet does not render if there is no generated plan or cut-list manifest. Individual sections show fallback copy for missing summary, generated cut rows, unresolved questions, or unsupported diagrams.

Loading states: none inside the rendered plan sheet.

Error/blocked states: unresolved cut dimensions warn not to cut until resolved. Safety and planning-aid caveats are repeated in the sheet.

Mobile considerations: tables scroll horizontally; dense plan sections are stacked and can be long. The sheet uses print-specific classes but remains visible inside the app detail page on screen.

Action arrows:

```text
Cut-list warning -> #cut-list-to-verify
Browser print plan action -> /projects/[id]/print
```

### Print Preview / Build Sheet

Route: `/projects/[id]/print`

Screen job: show the latest generated plan as a browser-print build sheet, with the supported output path explicit before the sheet content.

Primary action: `Print build sheet` opens the browser print dialog through `window.print()`. It does not create PDFs, downloads, CAD, CNC, SVG, DXF, or export files.

Secondary actions: `Back to project` returns to `/projects/[id]`. The user can also use the browser's native print command.

Empty states: if there is no generated plan, the route shows "No generated plan to print yet" and links back to the project.

Loading states: no explicit route-level loading component.

Error/blocked states: missing project returns `notFound()`. Missing generated plan shows the empty print state. Safety, assumptions, unresolved questions, and planning-aid reminders are included in the sheet.

Mobile considerations: the preview is readable on screen but optimized for print. The print toolbar stacks above the sheet and is hidden from printed output. Wide cut-list tables use horizontal scrolling before print.

Wireframe:

```text
+------------------------------------------------------+
| Back to project                                      |
| Browser-print build sheet                [Print]     |
| Use browser print dialog. No export/download files.   |
+------------------------------------------------------+
| Browser print plan                                   |
| Project title                                        |
| Planning aid caution                                 |
+------------------------------------------------------+
| Build Snapshot                                       |
| dimensions | material | difficulty | time | pieces    |
+------------------------------------------------------+
| Project Visuals                                      |
| diagrams / anatomy / connections                     |
+------------------------------------------------------+
| Check Before Building                                |
| required action checklist                            |
+------------------------------------------------------+
| Materials and Parts                                  |
| materials to gather | pieces to identify             |
+------------------------------------------------------+
| Cut Checklist                                        |
| [ ] piece | qty | dimensions | material | check       |
+------------------------------------------------------+
| Build Guide                                          |
| step cards                                           |
+------------------------------------------------------+
| Review Appendix                                      |
| plan review, safety, triggers, questions, assumptions |
+------------------------------------------------------+

Back to project -> /projects/[id]
Print build sheet -> browser/OS print dialog
Browser print command -> browser/OS print dialog
```

## Top 5 Current UI Friction Points

1. Project detail still has high information density.
   The state-aware next-step strip helps, but a generated detail page still asks the user to parse actions, jump links, intake, review triggers, template guidance, build model, plan review, future output notes, tweak flow, comparison, plan sheet, history, notes, and build log in one long page.

2. New project intake is still long.
   UI-02B compacted the starter chooser so examples no longer dominate the top of the page, but the full manual intake remains a long form on mobile.

3. Print behavior is clearer, but still browser-owned.
   UI-02C adds a top print toolbar and `Print build sheet` action that opens the browser print dialog. The app still does not generate PDF, CAD, CNC, or export/download files.

4. Project list filters are lighter, but still a secondary workflow.
   UI-03 moves summary metrics above the filter form and keeps advanced filters collapsed unless active. Search/workspace remain visible, but the list still has enough controls that mobile dogfood should watch for repeated filter friction.

5. Internal review concepts still leak into the user reading order.
   Terms such as build model, deterministic review, future output notes, plan review, cut-list review, material summary, and comparison are accurate, but the page does not yet fully separate "what should I do next in the shop?" from "what did the app verify?"

## Recommended First 3 UI Implementation Tasks

1. Continue dogfooding the generated project detail reading order.
   UI-02A added a compact "Review before building" summary that deep-links to cut list, open questions, print preview, and comparison. The next pass should only respond to repeated confusion found in real manual use.

2. Dogfood the compact intake starter area.
   UI-02B moved starters into an optional compact chooser above the form. The next pass should only respond to repeated confusion around starter discoverability or first-field entry.

3. Dogfood the browser-print toolbar.
   UI-02C makes the browser print action explicit. The next pass should only respond to repeated confusion in real print use, not add PDF/export behavior.

## Verification Notes

This wireflow was prepared from the current working tree App Router pages and major UI components:

- `app/layout.tsx`
- `app/access/page.tsx`
- `proxy.ts`
- `app/page.tsx`
- `app/projects/page.tsx`
- `app/projects/new/page.tsx`
- `app/projects/new/loading.tsx`
- `app/projects/create/route.ts`
- `app/projects/[id]/page.tsx`
- `app/projects/[id]/GeneratePlanForm.tsx`
- `app/projects/[id]/TweakPlanForm.tsx`
- `app/projects/[id]/print/page.tsx`
- Existing product docs, especially `docs/PRIVATE_MVP_READINESS.md`, `docs/PRD.md`, and `docs/UX_POLISH_AUDIT.md`

Only this documentation file is intended to change.
