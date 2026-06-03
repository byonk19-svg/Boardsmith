import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { emptyProjectBuildLog } from "./project-test-helpers";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

const projects: Project[] = [
  {
    id: "project_with_history",
    created_at: "2026-06-01T12:00:00.000Z",
    updated_at: "2026-06-02T14:30:00.000Z",
    title: "Bathroom shelf",
    project_type: "simple_shelf",
    skill_level: "beginner",
    status: "plan_generated",
    width_inches: 24,
    height_inches: 8,
    depth_inches: 7,
    material_thickness_inches: 0.75,
    material_type: "pine board",
    tools_available: ["tape_measure", "pencil", "drill"],
    style_notes: "Wall mounted",
    intended_use: "Light bathroom shelf",
    safety_review_required: true,
    safety_flags: ["Wall mounting review"],
    notes: "Use stainless screws for bathroom humidity.",
    build_completed: false,
    build_completed_at: "",
    build_actual_material: "Poplar board used for the actual build.",
    build_plan_changes: "",
    build_lessons_learned: "",
  },
  {
    id: "draft_project",
    created_at: "2026-06-01T10:00:00.000Z",
    updated_at: "2026-06-01T10:00:00.000Z",
    title: "Planter box",
    project_type: "planter_box",
    skill_level: "beginner",
    status: "draft",
    width_inches: 30,
    height_inches: 14,
    depth_inches: 12,
    material_thickness_inches: 0.75,
    material_type: "cedar board",
    tools_available: ["tape_measure", "pencil", "drill", "sander"],
    style_notes: "Outdoor use",
    intended_use: "Small porch planter",
    safety_review_required: false,
    safety_flags: [],
    notes: "",
    ...emptyProjectBuildLog,
  },
];

const latestPlan: GeneratedProjectPlanRecord = {
  id: "latest_plan",
  project_id: "project_with_history",
  created_at: "2026-06-02T14:25:00.000Z",
  model_name: "test-model",
  plan_json: {
    project_summary: "A bathroom shelf plan.",
    project_type: "simple_shelf",
    dimensions: {
      width_inches: 24,
      height_inches: 8,
      depth_inches: 7,
      material_thickness_inches: 0.75,
    },
    materials: [{ name: "Pine board", quantity: "1", notes: "Review humidity exposure." }],
    tools: ["Tape measure", "Drill"],
    cut_list: [],
    assembly_steps: [],
    finishing_steps: [],
    safety_notes: ["Verify wall mounting before building."],
    assumptions: ["Light storage only."],
    needs_review_flags: ["Wall mounting review"],
    beginner_tips: [],
    svg_readiness_notes: [],
    estimated_difficulty: "moderate",
    estimated_time: "2 hours",
    confidence_level: "medium",
  },
  build_model_json: null,
  plan_markdown: "Plan markdown",
  validation_status: "valid",
  warnings: ["Wall mounting review"],
  assumptions: ["Light storage only."],
  confidence_level: "medium",
  is_latest: true,
};

vi.mock("@/lib/storage/project-store", () => ({
  listProjects: vi.fn(() => Promise.resolve(projects)),
  listGeneratedPlans: vi.fn((projectId: string) => {
    if (projectId === "project_with_history") {
      return Promise.resolve([
        latestPlan,
        { ...latestPlan, id: "older_plan", created_at: "2026-06-01T14:25:00.000Z", is_latest: false },
      ]);
    }

    return Promise.resolve([]);
  }),
}));

describe("ProjectsPage", () => {
  it("renders project status, plan history, record indicators, and next actions", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("Bathroom shelf");
    expect(markup).toContain("Plan generated");
    expect(markup).toContain("Latest plan saved");
    expect(markup).toContain("2 plan versions");
    expect(markup).toContain("Notes added");
    expect(markup).toContain("Build notes added");
    expect(markup).toContain("View latest plan");
    expect(markup).toContain("Review project record");
    expect(markup).toContain("Updated Jun 2, 2026");

    expect(markup).toContain("Planter box");
    expect(markup).toContain("Draft");
    expect(markup).toContain("No generated plan yet");
    expect(markup).toContain("Generate plan");
  });

  it("renders an actionable empty state when no projects exist", async () => {
    const store = await import("@/lib/storage/project-store");
    vi.mocked(store.listProjects).mockResolvedValueOnce([]);

    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain("No projects yet");
    expect(markup).toContain("Create a project intake to start a private planning record.");
    expect(markup).toContain("Start first project");
  });
});
