alter table public.projects
  add column if not exists shelf_layout text,
  add column if not exists shelf_count integer,
  add column if not exists shelf_spacing_inches numeric;

alter table public.projects
  drop constraint if exists projects_shelf_layout_check,
  add constraint projects_shelf_layout_check
    check (
      shelf_layout is null
      or shelf_layout in ('single_shelf', 'multiple_separate_shelves', 'multi_shelf_unit')
    );

alter table public.projects
  drop constraint if exists projects_shelf_count_check,
  add constraint projects_shelf_count_check
    check (shelf_count is null or (shelf_count >= 1 and shelf_count <= 20));

alter table public.projects
  drop constraint if exists projects_shelf_spacing_inches_check,
  add constraint projects_shelf_spacing_inches_check
    check (shelf_spacing_inches is null or (shelf_spacing_inches > 0 and shelf_spacing_inches <= 120));
