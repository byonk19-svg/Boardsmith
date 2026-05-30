create extension if not exists "pgcrypto";

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  project_type text not null check (project_type in ('door_hanger', 'layered_cutout', 'wood_sign', 'simple_shelf', 'planter_box')),
  skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
  status text not null default 'draft' check (status in ('draft', 'plan_generated', 'generation_failed')),
  width_inches numeric not null check (width_inches > 0),
  height_inches numeric not null check (height_inches > 0),
  depth_inches numeric not null check (depth_inches >= 0),
  material_thickness_inches numeric not null check (material_thickness_inches > 0),
  material_type text not null,
  tools_available jsonb not null default '[]'::jsonb,
  style_notes text not null default '',
  intended_use text not null,
  safety_review_required boolean not null default false,
  safety_flags jsonb not null default '[]'::jsonb
);

create table if not exists public.generated_project_plans (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  created_at timestamptz not null default now(),
  model_name text not null,
  plan_json jsonb not null,
  plan_markdown text not null,
  validation_status text not null check (validation_status in ('valid')),
  warnings jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  confidence_level text not null check (confidence_level in ('low', 'medium', 'high')),
  is_latest boolean not null default true
);

create unique index if not exists generated_project_plans_one_latest_per_project
  on public.generated_project_plans(project_id)
  where is_latest;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists projects_set_updated_at on public.projects;
create trigger projects_set_updated_at
before update on public.projects
for each row
execute function public.set_updated_at();

-- Auth is intentionally deferred for the private MVP.
-- Enable RLS and owner-based policies before multi-user or hosted production use.
