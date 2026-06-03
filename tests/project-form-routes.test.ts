import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import NewProjectPage from "@/app/projects/new/page";

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("@/lib/storage/project-store", () => ({
  getProject: vi.fn(() =>
    Promise.resolve({
      id: "project_form_route",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Form route shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 36,
      height_inches: 6,
      depth_inches: 10,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil", "drill"],
      style_notes: "Wall mounted",
      intended_use: "Decorative shelf",
      safety_review_required: true,
      safety_flags: ["Wall mounting review", "Heavy shelving review"],
      notes: "",
      build_completed: false,
      build_completed_at: "",
      build_actual_material: "",
      build_plan_changes: "",
      build_lessons_learned: "",
    }),
  ),
  listGeneratedPlans: vi.fn(() => Promise.resolve([])),
}));

describe("project form routes", () => {
  it("uses an explicit POST route for new project creation", () => {
    const markup = renderToStaticMarkup(React.createElement(NewProjectPage));

    expect(markup).toContain('action="/projects/create"');
    expect(markup).toContain('method="post"');
  });

  it("shows practical project examples and detail prompts on the intake form", () => {
    const markup = renderToStaticMarkup(React.createElement(NewProjectPage));

    expect(markup).toContain("More detail produces better plans.");
    expect(markup).toContain("small wall shelf for a bathroom");
    expect(markup).toContain("simple toddler book ledge");
    expect(markup).toContain("basic outdoor planter box");
    expect(markup).toContain("cordless lamp riser for a bookshelf");
    expect(markup).toContain("mounting or weight-bearing expectations");
    expect(markup).toContain("finish, stain, or paint preferences");
    expect(markup).toContain("baby, kid, wall-mounted, or outdoor use");
  });

  it("uses an explicit POST route for plan generation", async () => {
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: "project_form_route" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('action="/projects/project_form_route/generate"');
    expect(markup).toContain('method="post"');
  });

  it("renders generate plan pending-state copy for the client submit control", async () => {
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    const markup = renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: "project_form_route" }),
        searchParams: Promise.resolve({}),
      }),
    );

    expect(markup).toContain('data-pending-label="Generating plan..."');
    expect(markup).toContain("Generate Plan");
  });
});
