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
    id: "draft_project",
    created_at: "2026-06-03T10:00:00.000Z",
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
    id: "completed_sign",
    created_at: "2026-05-30T09:00:00.000Z",
    updated_at: "2026-06-05T09:00:00.000Z",
    title: "Door hanger",
    project_type: "door_hanger",
    skill_level: "beginner",
    status: "plan_generated",
    width_inches: 12,
    height_inches: 16,
    depth_inches: 1,
    material_thickness_inches: 0.75,
    material_type: "poplar board",
    tools_available: ["tape_measure", "pencil", "sander"],
    style_notes: "Rustic painted edges",
    intended_use: "Seasonal front door hanger",
    safety_review_required: false,
    safety_flags: [],
    notes: "",
    build_completed: true,
    build_completed_at: "2026-06-05",
    build_actual_material: "Poplar board with painted finish.",
    build_plan_changes: "",
    build_lessons_learned: "",
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
  it("renders projects in most-recently-updated order", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup.indexOf("/projects/completed_sign")).toBeLessThan(markup.indexOf("/projects/project_with_history"));
    expect(markup.indexOf("/projects/project_with_history")).toBeLessThan(markup.indexOf("/projects/draft_project"));
    expect(markup).toContain("Most recently updated first");
  });

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
    expect(markup).toContain('href="/projects/project_with_history"');

    expect(markup).toContain("Planter box");
    expect(markup).toContain("Draft");
    expect(markup).toContain("No generated plan yet");
    expect(markup).toContain("Generate plan");
    expect(markup).toContain("Door hanger");
    expect(markup).toContain("Built");
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

  it("filters projects by search text, project type, plan state, and project record state", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({
          q: "bathroom",
          type: "simple_shelf",
          plan: "has_plan",
          record: "has_record",
        }),
      }),
    );

    expect(markup).toContain("Bathroom shelf");
    expect(markup).not.toContain("/projects/draft_project");
    expect(markup).toContain("Showing 1 of 3 projects");
    expect(markup).toContain('value="bathroom"');
    expect(markup).toContain('value="simple_shelf" selected=""');
    expect(markup).toContain('value="has_plan" selected=""');
    expect(markup).toContain('value="has_record" selected=""');
  });

  it("searches project title, intended use, and style notes case-insensitively", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const intendedUseMarkup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({ q: "PORCH" }),
      }),
    );
    expect(intendedUseMarkup).toContain("Planter box");
    expect(intendedUseMarkup).not.toContain("/projects/project_with_history");
    expect(intendedUseMarkup).not.toContain("/projects/completed_sign");

    const styleNotesMarkup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({ q: "rustic" }),
      }),
    );
    expect(styleNotesMarkup).toContain("Door hanger");
    expect(styleNotesMarkup).not.toContain("/projects/project_with_history");
    expect(styleNotesMarkup).not.toContain("/projects/draft_project");
  });

  it("filters projects by built status and no-plan state", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({
          status: "built",
          plan: "no_plan",
        }),
      }),
    );

    expect(markup).toContain("Door hanger");
    expect(markup).toContain("Built");
    expect(markup).not.toContain("/projects/project_with_history");
    expect(markup).not.toContain("/projects/draft_project");
    expect(markup).toContain('value="built" selected=""');
    expect(markup).toContain('value="no_plan" selected=""');
  });

  it("renders a calm no-results state for project filters", async () => {
    const { default: ProjectsPage } = await import("@/app/projects/page");

    const markup = renderToStaticMarkup(
      await ProjectsPage({
        searchParams: Promise.resolve({
          q: "walnut",
          type: "door_hanger",
          status: "built",
        }),
      }),
    );

    expect(markup).toContain("No projects match these filters.");
    expect(markup).toContain("Clear filters");
    expect(markup).toContain("New Project");
    expect(markup).not.toContain("/projects/project_with_history");
    expect(markup).not.toContain("/projects/draft_project");
    expect(markup).not.toContain("/projects/completed_sign");
  });
});
