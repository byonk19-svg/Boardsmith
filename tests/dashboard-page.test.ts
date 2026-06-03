import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { Project } from "@/lib/projects/types";
import { emptyProjectBuildLog } from "./project-test-helpers";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

const latestProject: Project = {
  id: "latest-dashboard-project",
  created_at: "2026-06-01T12:00:00.000Z",
  updated_at: "2026-06-02T14:30:00.000Z",
  title: "Latest shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 24,
  height_inches: 8,
  depth_inches: 7,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "",
  intended_use: "Light shelf",
  safety_review_required: false,
  safety_flags: [],
  notes: "",
  ...emptyProjectBuildLog,
};

vi.mock("@/lib/storage/project-store", () => ({
  isSupabasePersistenceConfigured: vi.fn(() => true),
  listProjects: vi.fn(() => Promise.resolve([latestProject])),
}));

describe("DashboardPage", () => {
  it("links the latest project from the dashboard entry point", async () => {
    const { default: DashboardPage } = await import("@/app/page");

    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("Latest shelf");
    expect(markup).toContain("Continue latest project");
    expect(markup).toContain('href="/projects/latest-dashboard-project"');
  });
});
