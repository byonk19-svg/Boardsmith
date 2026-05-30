# Boardsmith

Boardsmith is a private MVP web app for generating detailed, reviewable woodworking and craft project plans. Users enter project details, the app applies deterministic safety and template context, then OpenAI returns structured JSON that is validated before it can be saved.

## Current MVP Capabilities

- Next.js App Router application shell.
- Project intake for supported beginner-friendly project types.
- Private local persistence by default, with a Supabase schema ready for deployment.
- Deterministic safety-review flags before AI generation.
- Project-type template hints used in AI prompt context.
- Zod-validated generated plan schema.
- OpenAI structured-output generation that rejects invalid JSON.
- Project detail pages with generated plan history and latest-plan display.

## Supported Project Types

- Door hanger
- Layered cutout
- Wood sign
- Simple shelf
- Planter box

Complex furniture, CAD, exports, public sharing, image upload, payments, and marketplace workflows are intentionally deferred.

## Setup

```bash
npm install
cp .env.example .env.local
npm run dev
```

Add `OPENAI_API_KEY` to `.env.local` before using plan generation. If Supabase variables are not configured, the private MVP stores data in `.data/boardsmith.json`. Use `BOARDSMITH_DATA_FILE` only when you need to point the local fallback at a different JSON file, such as isolated test data.

## Verification

Run these before committing:

```bash
npm test
npm run lint
npm run typecheck
npm run build
git diff --check
```

## Safety Limitations

Generated plans are planning aids only. Users must review all dimensions, tool choices, wall-mounting details, load assumptions, and safety steps before cutting or building. The app does not provide structural engineering, child-furniture certification, load ratings, or professional safety approval.

## Deferred Roadmap

- Authentication and per-user row-level security.
- SVG/PDF/DXF export.
- CNC/router-specific output.
- 3D CAD or FreeCAD integration.
- Image upload or generated imagery.
- Marketplace, Etsy, payments, subscriptions, and public sharing.
