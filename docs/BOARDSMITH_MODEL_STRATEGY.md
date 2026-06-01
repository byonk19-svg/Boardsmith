# Boardsmith Model Strategy

## Purpose

Boardsmith should evolve from an AI-generated woodworking plan app into a structured woodworking design and planning system. It should not become a generic chatbot that writes woodworking paragraphs.

The long-term direction is:

> A user describes a woodworking project, and Boardsmith produces a structured, reviewable, build-oriented model that can support cut lists, materials, hardware, safety review, printable plans, and eventually CAD/SVG/DXF/CNC integrations.

This document guides future Codex work so advanced modeling features are introduced deliberately, safely, and in the right order.

## Current Product State

Boardsmith currently has a strong MVP foundation:

- Next.js App Router
- TypeScript
- Tailwind
- local-private persistence fallback
- Supabase-backed persistence for the private no-auth MVP
- project intake form
- deterministic safety flags
- project template hints
- OpenAI structured-output generation
- Zod generated-plan schema
- deterministic generated-plan quality checks
- Boardsmith Build Model schema and deterministic derivation
- build-model JSON stored with generated plan versions
- Project Structure rendering
- material summary rendering
- cut-list review rendering
- export readiness checks
- printable plan manifest
- manifest-backed Printable Plan Sheet
- browser print preview page
- Plan Review panel for latest generated plans
- compact review badges in plan history
- generated plan rendering
- generated plan history
- documentation and verification workflow

Do not replace the current plan flow abruptly. The next evolution should build on top of it.

## Key Product Decision

Boardsmith should introduce an internal structured model called the **Boardsmith Build Model**, abbreviated **BBM**.

BBM is an internal representation of a woodworking project. It should describe:

- pieces
- materials
- hardware
- connections
- operations
- safety flags
- assumptions
- future export hints

BBM should eventually become the source of truth for cut lists, materials, plan rendering, SVG/PDF export, and future CAD integrations.

BBM must not be exposed to normal users as a coding language or DSL. Users should still interact through simple forms and natural language.

## What BBM Is

BBM is:

- an internal JSON structure
- validated with Zod
- generated or derived from project data
- reviewable by the app
- designed for future deterministic transformations

BBM is not:

- a public DSL
- a CAD engine
- a replacement for FreeCAD
- a CNC system
- an engineering solver
- a structural safety guarantee
- a user-facing programming language

## BBM Baseline Status

BBM foundation work has started and is part of the current private MVP baseline:

- BBM has a Zod schema and fixtures.
- BBM can be derived deterministically from project intake, template hints, and safety flags.
- Project detail renders BBM as user-facing "Project Structure".
- Generated plans store nullable `build_model_json` so the structure can stay versioned with the plan.
- Generated output is checked against BBM basics before save when a build model is available.
- Older generated plans without `build_model_json` remain readable with a derived compatibility model.

Future BBM work should refine the existing model and review surfaces. Do not skip directly to export, CAD, DXF, CNC, image upload, public sharing, marketplace, subscriptions, or payments.

## Implementation Principles

### Schema First

Start with TypeScript types and Zod schemas. Do not start with UI, prompting, CAD, or export.

### Deterministic Before AI

Whenever possible, derive BBM fields from existing project inputs and template hints. AI can help later, but deterministic logic should own project type, units, user-provided dimensions, material thickness, template hints, supported tools, and deterministic safety flags.

### Conservative Scope

BBM v1 supports only the current beginner-friendly project types:

- `door_hanger`
- `layered_cutout`
- `wood_sign`
- `simple_shelf`
- `planter_box`

Do not support chairs, stools, benches, tables, cabinets, cribs, ladders, decks, structural furniture, or load-bearing construction in BBM v1.

### No Structural Guarantees

BBM must never imply load rating, child safety certification, structural engineering approval, wall-mounting safety guarantee, or furniture certification.

BBM can describe planned parts and operations. It cannot certify safety.

### Version Everything

Generated plans already have history. BBM should follow the same philosophy. Future BBM records should be versioned or stored inside generated plan versions so old plans remain reproducible.

## BBM v1 Shape

BBM v1 should include:

- `schemaVersion`
- `units`
- project metadata
- dimensions
- pieces
- materials
- hardware
- connections
- operations
- safety
- assumptions
- unresolved questions
- export readiness
- confidence

Validation includes two layers:

1. Zod shape validation.
2. Deterministic validation for internal references, bounded dimensions, material/cut-list alignment, required safety flags, and overconfident safety claims.

## Development Roadmap

### Completed Foundation

- BBM schema foundation.
- BBM derivation from existing project data.
- Project Structure renderer.
- Backward-compatible build-model storage on generated plan versions.
- BBM-aware AI prompting.
- Deterministic generated-plan quality checks.
- Material summary.
- Cut List Review.
- Plan Review UI.
- Export Readiness.
- Printable plan manifest.
- Browser print preview.

### Recommended Next Tasks

1. Decide whether to stay with browser print, approve a server-side HTML-to-PDF dependency spike, or defer PDF.
2. If approved, implement the narrow PDF spike from `docs/PDF_EXPORT_SPIKE_PLAN.md`.
3. Or polish print preview if manual use reveals issues.
4. Later SVG research note.
5. Much later DXF/CAD/CNC research.

### Guardrails For Later Tasks

Keep "not enough information" states honest. Browser print preview is not export. Follow [docs/EXPORT_ARCHITECTURE.md](EXPORT_ARCHITECTURE.md) and [docs/PDF_EXPORT_SPIKE_PLAN.md](PDF_EXPORT_SPIKE_PLAN.md) before implementing any export. Do not add actual app-generated PDF/SVG/DXF export, CAD, FreeCAD, CNC, auth, image upload, public sharing, marketplace, subscriptions, or payments until explicitly requested.

## UI Copy Rules

Use plain language:

- Project Structure
- Pieces
- Connections
- Materials
- Needs Review
- Missing dimensions
- Not enough information for export yet

Avoid internal terms in user-facing UI:

- DSL
- AST
- intermediate representation
- graph model
- CAD kernel
- constraint solver

## Safety Copy Rules

Boardsmith must always communicate:

- plans are review aids
- dimensions must be checked
- wall mounting requires hardware and stud review
- load-bearing use is not guaranteed
- PPE and tool manuals matter
- child or baby-related builds require extra caution and are not certified

Avoid overconfident wording. Boardsmith cannot verify load capacity.

## Core Rule

First make Boardsmith understand a project. Then make it draw, export, optimize, or manufacture it.
