import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("Supabase migrations", () => {
  it("keeps private MVP access server-only", async () => {
    const sql = await readFile("supabase/migrations/20260530225127_harden_private_mvp_grants.sql", "utf8");

    expect(sql).toContain("alter table public.projects enable row level security");
    expect(sql).toContain("alter table public.generated_project_plans enable row level security");
    expect(sql).toContain("revoke all on table public.projects from public, anon, authenticated");
    expect(sql).toContain("revoke all on table public.generated_project_plans from public, anon, authenticated");
    expect(sql).toContain("grant select, insert, update, delete on table public.projects to service_role");
    expect(sql).toContain("grant select, insert, update, delete on table public.generated_project_plans to service_role");
  });

  it("adds an atomic generated-plan save RPC without opening public access", async () => {
    const sql = await readFile("supabase/migrations/20260601143737_save_generated_plan_atomic.sql", "utf8");

    expect(sql).toContain("create or replace function public.save_generated_plan_atomic");
    expect(sql).toContain("returns setof public.generated_project_plans");
    expect(sql).toContain("update public.generated_project_plans");
    expect(sql).toContain("insert into public.generated_project_plans");
    expect(sql).toContain("update public.projects");
    expect(sql).toContain("return next inserted_plan");
    expect(sql).toContain("revoke all on function public.save_generated_plan_atomic");
    expect(sql).toContain("grant execute on function public.save_generated_plan_atomic");
  });

  it("adds a project notes column without changing private MVP grants", async () => {
    const sql = await readFile("supabase/migrations/20260602004404_add_project_notes.sql", "utf8");

    expect(sql).toContain("alter table public.projects");
    expect(sql).toContain("add column if not exists notes text not null default ''");
    expect(sql).not.toContain("grant select");
    expect(sql).not.toContain("anon");
    expect(sql).not.toContain("authenticated");
  });

  it("adds project build log columns without changing private MVP grants", async () => {
    const sql = await readFile("supabase/migrations/20260602161405_add_project_build_log.sql", "utf8");

    expect(sql).toContain("alter table public.projects");
    expect(sql).toContain("add column if not exists build_completed boolean not null default false");
    expect(sql).toContain("add column if not exists build_completed_at date");
    expect(sql).toContain("add column if not exists build_actual_material text not null default ''");
    expect(sql).toContain("add column if not exists build_plan_changes text not null default ''");
    expect(sql).toContain("add column if not exists build_lessons_learned text not null default ''");
    expect(sql).not.toContain("grant select");
    expect(sql).not.toContain("anon");
    expect(sql).not.toContain("authenticated");
  });
});
