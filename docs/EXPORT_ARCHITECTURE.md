# Boardsmith Export Architecture Decision

## Status

Boardsmith currently has browser print preview at `/projects/[id]/print`. The project detail Printable Plan Sheet and the print preview page consume `createPrintablePlanManifest`, which gathers project data, generated plan data, `build_model_json`, Plan Review, Export Readiness, Material Summary, Cut List Review, safety notes, assumptions, unresolved questions, disclaimers, and future export notes.

Boardsmith does not currently generate app-owned PDF, SVG, DXF, CAD, CNC, download, fabrication, shopping, pricing, vendor, or inventory output.

## Decision

Future export work should consume the printable plan manifest. It should not scrape rendered page UI, parse HTML, or duplicate page-rendering derivation logic.

The manifest is the boundary between planning data and future output formats. UI pages can render the manifest, and future export implementations can transform the same manifest into specific outputs after a separate implementation decision.

## Export Levels

1. Browser print preview, already present.
2. App-generated PDF from the manifest, future narrow spike.
3. Simple 2D SVG plan or diagram research, later.
4. DXF, CAD, and CNC research, much later.

## Recommended First Export Implementation

The first intentional export implementation should be a narrow app-generated PDF spike only after approval. It should be read-only, use existing manifest data, include safety and planning-aid disclaimers, and avoid changing the generated plan schema unless a real data gap is proven.

Use [docs/PDF_EXPORT_SPIKE_PLAN.md](PDF_EXPORT_SPIKE_PLAN.md) before implementation. That plan keeps browser print as the current MVP path and requires separate approval before adding a server-side PDF renderer dependency.

The first PDF spike should answer:

- Can Boardsmith produce a readable paper-style plan from the manifest?
- Can it preserve Plan Review, Export Readiness, material notes, cut-list warnings, and safety copy?
- Can it do this without claiming fabrication readiness?
- What package or rendering approach is justified, if any?

It should not include SVG, DXF, CAD, CNC, optimization, nesting, pricing, shopping, vendor links, inventory, public sharing, or auth.

## PDF Approach Options

### Browser Print Only

Pros:

- Already available through `/projects/[id]/print`.
- No new packages.
- No server-side rendering service.
- Keeps the output clearly user-controlled.
- Lowest implementation and security risk.

Cons:

- Browser and printer settings affect output.
- No app-owned file artifact.
- Harder to regression-test exact pagination.
- Users must manually choose print or save-as-PDF from the browser.

Risks:

- Users may expect a download workflow even though none exists.
- Browser differences can make print layout inconsistent.

### Server-Side HTML-To-PDF

Pros:

- Can produce a consistent app-owned PDF file.
- Can reuse print-preview HTML concepts if routed through a renderer.
- Easier to provide stable naming and server-side tests once implemented.

Cons:

- Likely requires a new package or binary dependency.
- More operational risk in local and hosted environments.
- Can introduce performance and sandboxing concerns.
- PDF rendering can diverge from browser preview.

Risks:

- Dependency weight and platform compatibility.
- File generation paths and temporary-file cleanup.
- Accidental perception that output is production-ready.

### Client-Side PDF Generation

Pros:

- Keeps generation in the browser.
- Avoids server file storage.
- Can provide an explicit user-triggered download later if approved.

Cons:

- Likely requires a new package.
- Layout fidelity can be weaker than browser print or server rendering.
- Large plans may be slow or memory-heavy.
- Harder to test deterministically.

Risks:

- Client bundle growth.
- Browser-specific rendering quirks.
- Temptation to bypass the manifest and render from DOM state.

### Markdown Or Text Export Fallback

Pros:

- Simple deterministic transformation from the manifest.
- Easy to test.
- Low dependency risk.
- Useful as an accessibility or debugging fallback.

Cons:

- Not a polished PDF.
- Does not solve print layout.
- May feel less useful to non-technical users.

Risks:

- Could create another output format to maintain.
- Users may confuse plain text with a complete build document.

## Why SVG, DXF, CAD, And CNC Should Not Be First

SVG, DXF, CAD, and CNC outputs require stronger geometry semantics than the current MVP guarantees. Boardsmith has useful project structure, pieces, materials, and review layers, but it does not yet prove closed geometry, joinery, machining constraints, kerf handling, nesting, tolerances, fastener placement, structural capacity, or machine-safe paths.

Starting with SVG, DXF, CAD, or CNC would risk overclaiming precision and fabrication readiness. The safer sequence is to prove a human-reviewable PDF-style document first, then research simple 2D diagrams, and only much later research manufacturing-oriented formats.

## Safety Boundaries

Future exports must state:

- Plans are planning aids only.
- Human review is required before cutting or building.
- Dimensions, materials, hardware, wall structure, tool setup, and safety notes must be verified.
- Boardsmith does not provide structural engineering, load ratings, child safety certification, wall safety guarantees, or professional approval.
- Boardsmith does not produce production-ready fabrication files.
- Boardsmith does not produce CNC-ready output.

Export copy must not imply that app-generated output is sufficient for machining, fabrication, load-bearing use, child furniture, or wall mounting.

## Data Boundaries

Future export work should use:

- saved project data
- saved generated plan data
- saved `build_model_json` when available
- derived compatibility build models for older plans when needed
- `createPrintablePlanManifest`
- existing Plan Review, Export Readiness, Material Summary, and Cut List Review helpers

Future export work should avoid:

- generated plan schema changes unless a real data gap is proven
- migrations unless storage of an intentional file artifact is approved
- package dependencies until the chosen PDF approach is approved
- hidden external services
- scraping rendered UI or reading from DOM-only state

## Testing Expectations

Before any app-generated export is added:

- keep manifest unit tests covering complete and incomplete plans
- keep route/rendering tests for project detail and browser print preview
- smoke `/projects/[id]/print` as a no-download browser preview

When actual export is intentionally added:

- add file-generation tests for the selected format
- verify safety disclaimers are included
- verify Plan Review and Export Readiness are included
- verify no unvalidated AI output is exported
- verify older plans without `build_model_json` still produce honest fallback output or a clear not-ready state
- verify no route or button implies SVG, DXF, CAD, CNC, or production readiness unless that exact capability exists and is intentionally approved

## Non-Goals

- No SVG generation now.
- No DXF generation now.
- No CAD, FreeCAD, or CNC now.
- No app-generated PDF now.
- No downloads now.
- No shopping, pricing, vendor, purchasing, or inventory output.
- No public sharing.
- No auth, payments, or subscriptions.
- No new project types.

## Recommended Next Task Order

1. Decide whether to stay with browser print, approve a server-side HTML-to-PDF dependency spike, or defer PDF.
2. If approved, implement the narrow PDF spike from `docs/PDF_EXPORT_SPIKE_PLAN.md`.
3. Or polish print preview if manual use reveals issues.
4. Later SVG research note.
5. Much later DXF/CAD/CNC research.
