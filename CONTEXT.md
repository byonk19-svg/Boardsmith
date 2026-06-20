# Boardsmith Context

Boardsmith is a private woodworking planning context. This glossary gives agents the product language to use when planning, writing PRDs, creating issues, or reviewing changes.

## Language

**Boardsmith**:
A private MVP app for turning supported woodworking and craft project ideas into cautious, reviewable planning packets.
_Avoid_: Public marketplace, CAD tool, shopping app, certification tool

**Planning Aid**:
The boundary that every generated plan, diagram, buying note, and print sheet helps a human review a project but does not approve it for building.
_Avoid_: Approval, certification, load rating, fabrication-ready output

**Private MVP**:
The current product stage: useful for owner dogfood and small trusted private demos behind access controls, but not public launch or production multi-user software.
_Avoid_: Public beta, production launch, multi-user product

**Project Intake**:
The saved structured project description, including project type, dimensions, material, tools, intended use, constraints, and finish notes.
_Avoid_: Prompt, chat message, order form

**Project Intake Signals**:
The internal Adapter output that reads managed Project Intake sections and legacy prose into deterministic mounting, wall, load/use, support, and finish/exposure signals without adding persistence columns.
_Avoid_: Database schema, user-facing profile, safety approval

**Project Planning Lifecycle**:
The deterministic state rules that decide which planning actions are available for a project, why a command is blocked, and which review or repair path comes next.
_Avoid_: UI copy source, workflow automation, user permissions system

**Supported Project Type**:
A narrow beginner-friendly template category that Boardsmith can plan with deterministic guidance and safety review.
_Avoid_: Any woodworking project, general project category

**Supported Project Type Drafting**:
The internal deterministic adapter set that turns each Supported Project Type into Boardsmith Build Model pieces, hardware, operations, assumptions, unresolved questions, and output readiness.
_Avoid_: New project type expansion, public plugin system, generic woodworking planner

**Universal Intake**:
The long-term product direction where a user can enter any project idea, and Boardsmith classifies what level of safe output is allowed.
_Avoid_: Promise to generate every project, unsupported full-plan generation

**Gated Build Packet**:
A full visual plan packet that is generated only when the idea is inside a supported safe-enough template with enough confirmed detail.
_Avoid_: Plan for anything, best-effort build instructions, unsafe completion

**Clarification Gate**:
The pre-generation step that identifies missing, ambiguous, or safety-sensitive information and helps the user provide enough detail for a safe plan decision.
_Avoid_: Silent guessing, prompt retries, generic form errors

**Boardsmith Build Model**:
The deterministic project structure derived from intake, template hints, and safety flags before generated plan output is trusted.
_Avoid_: CAD model, engineering model, fabrication model

**Generated Plan**:
A schema-validated AI-produced plan version saved only after deterministic review accepts it.
_Avoid_: Chat answer, unvalidated JSON, final build approval

**Plan Version**:
One saved generated plan for a project. New generation and tweak flows create new versions instead of overwriting older ones.
_Avoid_: Draft overwrite, chat turn

**Tweak This Plan**:
The one-shot revision flow that creates a new plan version from a single requested change.
_Avoid_: Chat, multi-turn assistant, direct edit

**Plan Review**:
The deterministic review summary that surfaces blocked, warning, passed, and manual-review states for a generated plan.
_Avoid_: Safety approval, quality guarantee

**Review Trigger**:
A conservative flag caused by safety-sensitive terms, missing dimensions, wall mounting, child-adjacent use, load-sensitive use, or unclear inputs.
_Avoid_: Confirmed hazard, failed inspection

**Browser Print Plan**:
The current supported output path: a browser-rendered print route that the user prints with the browser or operating system dialog.
_Avoid_: PDF export, download, CAD export, SVG export

**Buying Plan**:
A conservative material-planning section that groups modeled pieces and review notes without selecting exact purchases, vendors, prices, or inventory.
_Avoid_: Shopping list, cart, purchase order, vendor recommendation

**Project Record**:
The private notes and build-log area attached to a project for owner memory after planning or building.
_Avoid_: Certification record, approval record, project management system

**Archive**:
A private workspace organization action that hides inactive projects from default views while preserving project data and plan history.
_Avoid_: Delete, dispose, retention policy

**Dogfood**:
Manual private use on realistic, non-critical projects to find repeated friction before selecting more work.
_Avoid_: Launch QA, public user research
