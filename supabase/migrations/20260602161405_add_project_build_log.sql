alter table public.projects
  add column if not exists build_completed boolean not null default false,
  add column if not exists build_completed_at date,
  add column if not exists build_actual_material text not null default '',
  add column if not exists build_plan_changes text not null default '',
  add column if not exists build_lessons_learned text not null default '';
