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

### Supabase persistence

Supabase is optional for local development. The app uses Supabase only when the runtime has:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

Keep `SUPABASE_SERVICE_ROLE_KEY` server-only. Do not expose it through `NEXT_PUBLIC_` variables, client components, browser logs, or committed files. For the current private no-auth MVP, use the service-role key only from server-rendered routes/pages through the repository layer.

Apply the SQL in `supabase/migrations/` before running a Supabase-backed smoke. The migrations create `projects`, `generated_project_plans`, the latest-plan partial unique index, the `updated_at` trigger, nullable `build_model_json` plan-version storage, and private MVP grants for server-only `service_role` access.

To verify Supabase persistence, create `.env.local` from `.env.example`, set the Supabase values above, start the dev server, then create a project through `/projects/new`. The project should redirect to `/projects/[id]`, appear in `/projects`, and continue to load with `.data/boardsmith.json` unchanged. If the Supabase env vars are absent, the same flow uses the private local JSON fallback.

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
