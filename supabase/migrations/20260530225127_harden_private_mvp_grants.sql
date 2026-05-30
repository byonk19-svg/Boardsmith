-- Private MVP Supabase access is server-only through the repository layer.
-- Auth is deferred, so do not grant anonymous or authenticated table access yet.
alter table public.projects enable row level security;
alter table public.generated_project_plans enable row level security;

revoke all on table public.projects from public, anon, authenticated;
revoke all on table public.generated_project_plans from public, anon, authenticated;

grant usage on schema public to service_role;
grant select, insert, update, delete on table public.projects to service_role;
grant select, insert, update, delete on table public.generated_project_plans to service_role;

revoke all on function public.set_updated_at() from public, anon, authenticated;
grant execute on function public.set_updated_at() to service_role;
