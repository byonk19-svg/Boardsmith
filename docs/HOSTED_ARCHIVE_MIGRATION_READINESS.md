# Hosted Archive Migration Readiness

Date: June 8, 2026

## Purpose

This checklist covers the hosted Supabase readiness step for Boardsmith's private-MVP archive/restore feature.

Archive/restore is a private project-organization aid. It hides inactive dogfood, smoke-test, or older projects from the default workspace without deleting project records or generated plans. It is not a permanent delete system, public project-management workflow, or data-retention policy.

## Current Repo State

- Current checkpoint tag: `private-mvp-0.7`.
- Archive migration file: `supabase/migrations/20260607183000_add_project_archive_metadata.sql`.
- Migration SQL:

```sql
alter table public.projects
  add column if not exists archived_at timestamptz;
```

- This checkout currently has no `supabase/config.toml`.
- Because there is no local Supabase config target in this checkout, do not run a local Supabase reset from here.
- No Supabase cloud push was performed for the archive migration.
- Migration tests cover the SQL file, but the hosted Supabase project still needs an explicit hosted migration check before relying on archive/restore in Preview or Production.

## Hosted Migration Preflight

Use the approved private Supabase deployment path for the hosted Boardsmith project. Do not print, paste, commit, or screenshot secrets.

1. Confirm which hosted Supabase project is wired to the intended Boardsmith deployment without exposing env var values.
2. Confirm the hosted database already has the `public.projects` table.
3. Check whether `public.projects.archived_at` exists:

```sql
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'projects'
  and column_name = 'archived_at';
```

4. If no row is returned, apply `supabase/migrations/20260607183000_add_project_archive_metadata.sql` through the approved hosted Supabase migration path.
5. Re-run the column check and confirm `archived_at` exists, is nullable, and uses a timestamp with time zone type.
6. Do not remove or rewrite existing project rows.
7. Do not add delete, bulk archive, auth, sharing, export, CAD, CNC, shopping, pricing, vendor, or inventory behavior as part of this readiness step.

## Hosted Archive Smoke Checklist

Run this only from the intended private hosted access path after the archive migration is applied or confirmed present.

1. Open the hosted app through the active private access layers.
2. Load `/projects` and confirm the default Active view loads without database errors.
3. Choose a clearly labeled non-critical test project. Do not use an important real project for the first archive smoke.
4. Archive the test project.
5. Confirm the archived project disappears from the default Active project list.
6. Confirm the dashboard no longer shows the archived project in counts or recent shortcuts by default.
7. Open `/projects?archive=archived` and confirm the archived project appears.
8. Open `/projects?archive=all` and confirm both active and archived projects are available.
9. Open the archived project detail page and confirm the archived banner is visible and reassuring.
10. Confirm latest generated plan links remain available on the archived project detail page when the project has plans.
11. Open `/projects/[id]/print` for the archived project if it has a generated plan and confirm browser print preview still renders.
12. Restore the archived test project.
13. Confirm the restored project returns to the default Active list.
14. Confirm the restored project can appear on the dashboard again when it is among the active recent projects.
15. Confirm the UI copy does not imply permanent delete, data loss, public sharing, fabrication readiness, CAD, CNC, PDF generation, or export/download behavior.

## Missing-Migration Failure Signs

If the hosted database does not have `archived_at`, likely symptoms include:

- `/projects` or `/` fails when the storage layer reads archive metadata.
- Archive or restore POST routes fail when they update `archived_at`.
- Hosted logs mention a missing `archived_at` column.

Do not keep retrying archive/restore actions against real projects if these symptoms appear.

## Mitigation

If hosted archive routes fail because `archived_at` is missing:

1. Stop archive/restore smoke immediately.
2. Keep the hosted URL private and avoid sharing archive/restore instructions.
3. Apply `supabase/migrations/20260607183000_add_project_archive_metadata.sql` through the approved hosted Supabase migration path.
4. Re-run the hosted migration preflight query.
5. Re-run the hosted archive smoke checklist using a non-critical test project.
6. If the migration cannot be applied promptly, avoid using archive/restore on hosted data and consider temporarily redeploying the last known checkpoint before archive behavior only if hosted routes are blocked for private users.

## Guardrails

- Boardsmith remains a private MVP planning aid.
- Archive/restore preserves project records and generated plans.
- Permanent delete remains out of scope.
- No Supabase cloud push should be run from this checkout unless a valid project-specific local config and safe documented deployment path are added later.
- No app-generated PDF, SVG, DXF, CAD, CNC, image upload, public sharing, marketplace, shopping, pricing, vendor, inventory, auth expansion, production multi-user, package, schema, or project-type work belongs in this checklist.
