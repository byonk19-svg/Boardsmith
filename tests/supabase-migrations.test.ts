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
});
