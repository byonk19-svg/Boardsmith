---
name: Boardsmith
description: Private MVP for cautious, reviewable woodworking project plans.
colors:
  ink: "#1f2520"
  bark: "#72533b"
  moss: "#48634f"
  shop: "#f7f4ef"
  sawdust: "#e8dccb"
  caution: "#a34d12"
  white: "#ffffff"
  warning-bg: "#fffbeb"
  warning-border: "#fde68a"
  warning-text: "#78350f"
  success-bg: "#f0fdf4"
  success-border: "#bbf7d0"
  success-text: "#166534"
  destructive-bg: "#fef2f2"
  destructive-border: "#fecaca"
  destructive-text: "#991b1b"
typography:
  display:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  title:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  body:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.25
    letterSpacing: "0.025em"
rounded:
  sm: "0.125rem"
  md: "0.375rem"
  lg: "0.5rem"
spacing:
  xs: "0.5rem"
  sm: "0.75rem"
  md: "1rem"
  lg: "1.25rem"
  xl: "1.5rem"
  page-x: "1.25rem"
components:
  button-primary:
    backgroundColor: "{colors.moss}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    typography: "{typography.body}"
  button-secondary:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 1rem"
    typography: "{typography.body}"
  card:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    padding: "1rem"
  input:
    backgroundColor: "{colors.white}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.5rem 0.75rem"
    typography: "{typography.body}"
  chip:
    backgroundColor: "{colors.shop}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0.25rem 0.625rem"
    typography: "{typography.label}"
---

# Design System: Boardsmith

## 1. Overview

**Creative North Star: "The Clean Digital Workbench"**

Boardsmith should feel like a clean digital workbench: useful tools close at hand, labels where they reduce hesitation, and warnings visible before the user mistakes a plan for approval. The current system is a restrained product UI built from shop-neutral surfaces, moss-green action affordances, dark ink text, sawdust borders, and compact cards.

The design serves repeated planning work. It should be calm, practical, builder-ready, warm, organized, trustworthy, precise, and low-noise. Screens should help a user understand what project they are working on, whether a plan exists, what needs review before building, what the next best action is, and what is safe to print, archive, edit, or regenerate.

The system explicitly rejects SaaS marketing, maker-hype, playful AI-toy styling, hobby-blog decoration, CAD/pro-engineering visual language, marketplace cues, and export or fabrication certainty. The interface should look like a professional project planning tool, not a product trying to sell itself.

**Key Characteristics:**

- Restrained light UI with tinted workshop neutrals.
- Moss green reserved for primary actions, links, and ready states.
- Compact cards and dense scan surfaces for repeated private use.
- Safety, review, and planning-aid language kept close to actions.
- Print-aware surfaces that stay useful on paper.
- Work-queue dashboards, state-forward project pages, and job-packet print views.

## 2. Colors

The palette is quiet workshop-neutral with one practical green accent and a small status vocabulary for safety review, success, warning, and destructive actions.

### Primary

- **Moss Action**: Primary action color for save, generate, apply, active links, and ready-state accents.

### Secondary

- **Bark Wood**: Reserved secondary wood tone. Use sparingly when the interface needs a material cue that is not an action.

### Tertiary

- **Caution Rust**: Safety and planning-warning emphasis. Use for review warnings, not for decorative warmth.

### Neutral

- **Ink Text**: Primary text and strong headings.
- **Shop Surface**: Page background, subtle panels, filter groups, and non-interactive neutral chips.
- **Sawdust Border**: Borders, dividers, dashed empty states, print separators.
- **White Work Surface**: Main cards, forms, project rows, and print sheets.
- **Warning Tint**: Amber warning background and border for intake errors, archived state, unresolved details, and review-sensitive notices.
- **Success Tint**: Muted green for successful archive/restore and saved-state confirmations.
- **Destructive Tint**: Red for real destructive or failed states only. Use sparingly and always with clear recovery copy.

### Named Rules

**The One Green Rule.** Moss is the product's action color. Do not introduce competing blue, purple, or neon CTAs.

**The Warning Is Functional Rule.** Amber and rust exist to mark review work and safety caution. They are not decorative brand colors.

**The Status Is Text Rule.** Color can reinforce draft, plan generated, needs review, ready to print, archived, manual plan, success, warning, and destructive states, but text must carry the meaning.

**The Paper Is Not Marketing Rule.** Shop and white surfaces should feel like workspace materials, not a landing page canvas.

## 3. Typography

**Display Font:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
**Body Font:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif
**Label/Mono Font:** system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif

**Character:** One system sans family keeps the app direct and utilitarian. Hierarchy comes from weight, spacing, and compact scale, not from display type or expressive font pairing.

### Hierarchy

- **Display** (600, 1.875rem, 1.2 line-height): Page titles such as dashboard, project list, intake, and print sheet titles.
- **Headline** (600, 1.25rem, 1.35 line-height): Section headers inside cards and review panels.
- **Title** (600, 1.125rem, 1.4 line-height): Project card titles, queue cards, form groups, and repeated section titles.
- **Body** (400, 0.875rem, 1.5 line-height): Explanatory copy, form help, card metadata, and review descriptions. Long generated plan content should use generous line-height and stay near 65 to 75 characters per line.
- **Label** (600, 0.75rem, 0.025em letter spacing): Status chips, section markers, table headers, and review category labels. Uppercase labels are allowed when they aid scanning.

### Named Rules

**The Plain Label Rule.** Labels must clarify workflow state or review category. Do not add decorative eyebrows to every section.

**The No Display Drama Rule.** Product UI uses fixed rem sizing and system sans. Do not add fluid hero type or marketing display fonts.

**The Measurement Clarity Rule.** Numeric values, measurements, quantities, and cut-list data must be easy to distinguish. Do not hide important builder information in tiny secondary text.

## 4. Elevation

Boardsmith uses a hybrid of tonal layering and one soft ambient shadow. Most structure comes from white cards on shop backgrounds, sawdust borders, and compact spacing. Shadows are light and occasional, used to separate major cards without making the product feel glossy.

### Shadow Vocabulary

- **Soft Work Surface** (`0 18px 50px rgba(31, 37, 32, 0.08)`): Major cards, forms, dashboard panels, and print toolbars. Do not stack it on every repeated item.

### Named Rules

**The Border First Rule.** Use sawdust borders and tonal backgrounds before adding a shadow.

**The No Ghost Card Rule.** Do not combine decorative wide shadows with ornate borders. If a surface needs emphasis, tighten the content or use state copy first.

## 5. Components

Components are compact, familiar, and state-explicit. The system favors standard controls over invented affordances.

### Buttons

- **Shape:** gently rounded rectangles (0.375rem).
- **Primary:** moss background, white text, semibold 0.875rem label, 0.5rem vertical padding, 1rem horizontal padding.
- **Hover / Focus:** darken moss slightly on hover; focus should use a visible moss ring or border shift.
- **Secondary / Ghost / Tertiary:** white or transparent background, sawdust border, ink text, shop hover. Use for navigation, clear filters, restore, print, and alternate actions.
- **Hierarchy:** one primary button per major section. Secondary buttons are useful but not urgent. Ghost/link buttons are for navigation or low-priority action. Destructive buttons are for archive/delete-type actions only.

### Chips

- **Style:** compact rounded-md tags with shop, moss-tint, amber, or white backgrounds depending on state.
- **State:** chips label real status: archived, no plan, latest plan saved, review priority, project status, and filters. They are not badges for marketing claims.
- **Vocabulary:** keep badge language short and consistent: Draft, Plan generated, Needs review, Ready to print, Archived, Manual plan, Starter-created.

### Cards / Containers

- **Corner Style:** rounded-lg for major cards (0.5rem), rounded-md for nested or compact rows (0.375rem).
- **Background:** white for work surfaces, shop for subdued panels, amber for warning panels.
- **Shadow Strategy:** major cards may use Soft Work Surface; repeated list rows usually use borders only.
- **Border:** sawdust border by default; moss border appears only for hover or selected emphasis.
- **Internal Padding:** 1rem for compact cards, 1.25rem to 1.5rem for forms and major sections, 2rem for empty states.

### Inputs / Fields

- **Style:** white background, sawdust border, rounded-md, 0.75rem horizontal padding, 0.5rem vertical padding.
- **Focus:** moss border with a low-opacity moss focus ring. Focus must be visible on keyboard navigation.
- **Error / Disabled:** amber warning panels explain recoverable errors. Disabled or loading actions reduce moss strength and keep readable labels.

### Navigation

- **Style:** top navigation on shop background with sawdust bottom border. Brand text is semibold ink; links are compact rounded text buttons.
- **States:** default links use ink at reduced opacity; hover moves to sawdust background and full ink. Active route styling should use the same vocabulary if added.
- **Mobile Treatment:** navigation wraps instead of hiding. Keep labels readable and avoid icon-only route navigation.

### Accordions / Disclosure

Disclosure is for secondary information only: plan history, export readiness details, assumptions, and less urgent generated-plan metadata. Never hide primary build steps, safety notes, or the main next action behind an accordion.

### Planning Review Surfaces

Planning aids, print sheets, review checklists, diagrams, and cut-list tables must keep warnings, assumptions, dimensions, and manual checks visible. Horizontal scrolling is acceptable for dense tables when accompanied by clear copy. Print output must remove app navigation while preserving planning-aid cautions.

### Dashboard

The dashboard is a work queue, not a landing page. Prioritize active projects, project status, next action, recent activity, and a clear create-new-project entry point. Archive access should exist without making archived work feel primary.

### Project Detail Page

The project detail page is the core app workspace. Structure should answer: what is this project, is there a generated plan, what should be reviewed first, what actions are available, what changed over time, and what can be printed. Use this order as the default hierarchy: project header with title/status/primary action, review-before-building summary, generated plan or no-plan state, material summary, cut list, build steps, safety notes, assumptions/open questions, then secondary details and plan history.

### Generated Plan Display

Generated plans must be easy to scan and verify. Use section cards or clear dividers. Keep safety notes visible, assumptions and open questions distinct, and measurements/quantities highly readable. Do not hide critical content behind excessive accordions.

### Print View

Printable plan sheets should feel like a job packet. Prioritize project name, materials, cut list, build steps, safety notes, assumptions/open questions, and date or plan version when useful. Strip app chrome, navigation, filters, and unnecessary buttons from print output.

### Empty States

Empty states should be useful, not cute. Each empty state must state what is missing, why it matters, the next best action, and a clear button or link. Cover no generated plan yet, no archived projects, no project notes, and no build log entries with plain copy.

### Mobile

Mobile is not a shrunken desktop. Primary actions should be easy to reach, cards should stack cleanly, secondary metadata may collapse, generated content must remain readable, and cut lists must avoid accidental horizontal overflow unless scrolling is intentional and explained.

### Implementation Posture

Boardsmith currently uses Next.js and Tailwind. Reuse existing local component vocabulary before adding new abstractions or packages. Do not assume shadcn/ui components are available unless the dependency is added deliberately.

## 6. Do's and Don'ts

### Do:

- **Do** keep the product register: design serves project creation, plan review, safety checks, and print readability.
- **Do** make the page's primary action obvious and keep secondary actions from competing.
- **Do** use Moss Action for primary actions, current selection, links, and ready states.
- **Do** use Shop Surface and White Work Surface to distinguish page background from task surfaces.
- **Do** keep review copy near actions that could otherwise imply build readiness.
- **Do** make lifecycle states explicit: draft, ready to generate, blocked, ready to review, archived, printable, and read-only.
- **Do** use plain action copy: Review before building, Generate plan, Print plan sheet, Tweak this plan, Archive project, Restore project, No plan yet, Needs review.
- **Do** keep generated plan safety notes, assumptions, open questions, measurements, quantities, and cut-list data visible and scannable.
- **Do** validate mobile layout for UI changes and print layout for printable plan changes.
- **Do** preserve readable contrast for muted text, placeholders, warning panels, and print surfaces.
- **Do** keep focus states visible and interactive controls clearly named.

### Don't:

- **Don't** make Boardsmith look like a SaaS marketing site, maker-hype landing page, playful AI toy, hobby blog, CAD or professional engineering package, Etsy or marketplace workflow, shopping assistant, or public portfolio system.
- **Don't** imply structural approval, load ratings, child-safety certification, fabrication readiness, export/CAD/CNC output, public sharing, payments, subscriptions, inventory, pricing, vendors, or production multi-user readiness.
- **Don't** add gradient text, glassmorphism, bouncy motion, decorative side-stripe borders, or repeated identical icon-card grids.
- **Don't** use vague AI language, overly clever copy, or marketing-heavy phrases where a short helper line works.
- **Don't** use color as the only warning signal. Pair caution colors with explicit text.
- **Don't** hide safety notes, primary build steps, review-before-building content, or the main next action behind disclosure.
- **Don't** over-round cards beyond the existing md/lg vocabulary.
- **Don't** introduce new visual languages unless repeated dogfood friction shows the current one is blocking real use.
