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
  createProject: vi.fn(),
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
  it("uses an explicit POST route for new project creation", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain('action="/projects/create"');
    expect(markup).toContain('method="post"');
  });

  it("shows practical project examples and detail prompts on the intake form", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain("More detail produces better plans.");
    expect(markup).toContain("small wall shelf for a bathroom");
    expect(markup).toContain("simple toddler book ledge");
    expect(markup).toContain("basic outdoor planter box");
    expect(markup).toContain("cordless lamp riser for a bookshelf");
    expect(markup).toContain("mounting or weight-bearing expectations");
    expect(markup).toContain("finish, stain, or paint preferences");
    expect(markup).toContain("baby, kid, wall-mounted, or outdoor use");
  });

  it("shows friendly project creation error copy", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ error: "invalid_intake" }),
      }),
    );

    expect(markup).toContain("Project intake could not be saved.");
    expect(markup).toContain("Check the required fields, dimensions, tools, and material details before trying again.");
  });

  it("keeps invalid project creation errors user-facing", async () => {
    const { POST } = await import("@/app/projects/create/route");
    const body = new URLSearchParams({
      title: "Bad smoke project",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "24",
      height_inches: "6",
      depth_inches: "8",
      material_thickness_inches: "0.75",
      material_type: "pine board",
      tools_available: "invalid_tool",
      intended_use: "Test malformed form submission.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";
    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?error=invalid_intake");
    expect(location).not.toContain("invalid_tool");
    expect(location).not.toContain("Invalid%20option");
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
