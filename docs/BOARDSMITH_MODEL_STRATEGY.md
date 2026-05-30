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
- Supabase schema foundation
- project intake form
- deterministic safety flags
- project template hints
- OpenAI structured-output generation
- Zod generated-plan schema
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

## When To Start BBM

BBM work can begin only after the MVP baseline is stable:

1. App is renamed to Boardsmith everywhere.
2. Existing MVP routes work: `/`, `/projects`, `/projects/new`, `/projects/[id]`, `/settings`.
3. Project creation works.
4. Project detail pages work.
5. Local persistence works across restart.
6. Missing OpenAI API key behavior is graceful.
7. Existing plan-generation flow validates output before saving.
8. Existing tests pass.
9. README and docs are current.
10. Working tree is clean.

If those are not true, fix baseline bugs before starting BBM.

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

Validation should include two layers:

1. Zod shape validation.
2. Semantic validation for internal references and safety-oriented consistency.

## Development Roadmap

### Task 14A - BBM Schema Foundation

Add the BBM Zod schema, TypeScript types, fixture examples, and validation tests. Include semantic validation for connection piece ids, operation piece ids, and hardware ids.

Do not change AI generation, database schema, UI, exports, CAD, auth, payments, public sharing, or marketplace features.

### Task 14B - BBM Derivation From Existing Project Data

Create deterministic helpers that produce a minimal BBM draft from existing project intake data, template hints, and safety flags.

### Task 14C - Project Structure Renderer

Show the BBM draft in the project detail page as a structured "Project Structure" section without replacing generated plans.

### Task 14D - BBM Storage Decision

Decide how BBM should be stored without breaking existing plan history. Prefer backward-compatible storage.

### Later Tasks

Add BBM-aware AI prompting, deterministic plan quality checks, material summaries, improved cut lists, and export readiness. Do not skip directly to SVG, CAD, DXF, CNC, image upload, public sharing, marketplace, subscriptions, or payments.

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
