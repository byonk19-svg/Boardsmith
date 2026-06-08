import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

const latestProject: Project = {
  id: "latest-dashboard-project",
  created_at: "2026-06-01T12:00:00.000Z",
  updated_at: "2026-06-02T14:30:00.000Z",
  title: "Very long latest shelf project title for dashboard readability cleanup",
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
  ...activeProjectArchiveFields,
};

const draftProject: Project = {
  id: "draft-dashboard-project",
  created_at: "2026-06-01T10:00:00.000Z",
  updated_at: "2026-06-01T10:00:00.000Z",
  title: "Porch planter",
  project_type: "planter_box",
  skill_level: "beginner",
  status: "draft",
  width_inches: 30,
  height_inches: 14,
  depth_inches: 12,
  material_thickness_inches: 0.75,
  material_type: "cedar board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Outdoor planter",
  intended_use: "Small porch planter",
  safety_review_required: false,
  safety_flags: [],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const archivedProject: Project = {
  ...latestProject,
  id: "archived-dashboard-project",
  title: "Archived dogfood shelf",
  updated_at: "2026-06-05T14:30:00.000Z",
  archived_at: "2026-06-06T10:00:00.000Z",
};

const latestPlan: GeneratedProjectPlanRecord = {
  id: "latest-dashboard-plan",
  project_id: latestProject.id,
  created_at: "2026-06-02T14:25:00.000Z",
  model_name: "test-model",
  plan_json: {
    project_summary: "A shelf plan.",
    project_type: "simple_shelf",
    dimensions: {
      width_inches: 24,
      height_inches: 8,
      depth_inches: 7,
      material_thickness_inches: 0.75,
    },
    materials: [{ name: "Pine board", quantity: "1", notes: "Review before cutting." }],
    tools: ["Tape measure", "Drill"],
    cut_list: [],
    assembly_steps: [],
    finishing_steps: [],
    safety_notes: ["Review before building."],
    assumptions: ["Planning aid only."],
    needs_review_flags: [],
    beginner_tips: [],
    svg_readiness_notes: [],
    estimated_difficulty: "easy",
    estimated_time: "1 hour",
    confidence_level: "medium",
  },
  build_model_json: null,
  plan_markdown: "Plan markdown",
  validation_status: "valid",
  warnings: [],
  assumptions: [],
  confidence_level: "medium",
  is_latest: true,
};

vi.mock("@/lib/storage/project-store", () => ({
  isSupabasePersistenceConfigured: vi.fn(() => true),
  listProjects: vi.fn(() => Promise.resolve([latestProject, draftProject, archivedProject])),
  listGeneratedPlans: vi.fn((projectId: string) => {
    if (projectId === latestProject.id) return Promise.resolve([latestPlan]);
    return Promise.resolve([]);
  }),
}));

describe("DashboardPage", () => {
  it("renders private workspace hierarchy, project counts, recent projects, and clear actions", async () => {
    const { default: DashboardPage } = await import("@/app/page");

    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("Private Boardsmith workspace");
    expect(markup).toContain("Planning aid");
    expect(markup).toContain("Total projects");
    expect(markup).toContain("With generated plans");
    expect(markup).toContain("Need generated plans");
    expect(markup).toContain("2");
    expect(markup).toContain("1");
    expect(markup).toContain("Latest update");
    expect(markup).toContain("Jun 2, 2026");
    expect(markup).toContain("Recent projects");
    expect(markup).toContain("Very long latest shelf project title for dashboard readability cleanup");
    expect(markup).toContain("Porch planter");
    expect(markup).not.toContain("Archived dogfood shelf");
    expect(markup).toContain("Archived projects are hidden from this dashboard.");
    expect(markup).toContain("Open project");
    expect(markup).toContain("View latest plan");
    expect(markup).toContain("Generate plan");
    expect(markup).toContain('href="/projects/latest-dashboard-project"');
    expect(markup).toContain('href="/projects/draft-dashboard-project"');
    expect(markup).toContain("Freestanding plant display board");
    expect(markup).toContain("/projects/new?example=plant_display_board");
    expect(markup).toContain("Use starter");
  });

  it("renders a friendly empty state with starter examples", async () => {
    const store = await import("@/lib/storage/project-store");
    vi.mocked(store.listProjects).mockResolvedValueOnce([]);

    const { default: DashboardPage } = await import("@/app/page");

    const markup = renderToStaticMarkup(await DashboardPage());

    expect(markup).toContain("No projects yet");
    expect(markup).toContain("Start first project");
    expect(markup).toContain("Try a starter");
    expect(markup).toContain("Simple cordless lamp riser platform");
    expect(markup).toContain("/projects/new?example=lamp_riser");
  });

  it("does not introduce public sharing or export terminology", async () => {
    const { default: DashboardPage } = await import("@/app/page");

    const markup = renderToStaticMarkup(await DashboardPage()).toLowerCase();

    expect(markup).not.toMatch(/public sharing|export|cad|cnc/);
  });
});
