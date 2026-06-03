import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProjectPage from "@/app/projects/new/page";
import { decodeProjectIntakeDraft, encodeProjectIntakeDraft, type ProjectIntakeDraft } from "@/lib/projects/intake-draft";
import { createProject } from "@/lib/storage/project-store";

const headerMocks = vi.hoisted(() => ({
  cookies: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) =>
    React.createElement("a", { href, className }, children),
}));

vi.mock("next/navigation", () => ({
  notFound: vi.fn(() => {
    throw new Error("not found");
  }),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: headerMocks.cookies,
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
  beforeEach(() => {
    vi.mocked(createProject).mockReset();
    headerMocks.cookies.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
  });

  function validProjectFormData(overrides: Record<string, string> = {}) {
    const body = new URLSearchParams({
      title: "Smoke shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "12",
      height_inches: "8",
      depth_inches: "4",
      material_thickness_inches: "0.75",
      material_type: "pine board",
      style_notes: "Simple finish.",
      intended_use: "Small indoor shelf.",
      ...overrides,
    });
    body.append("tools_available", "tape_measure");
    body.append("tools_available", "pencil");
    body.append("tools_available", "drill");
    return body;
  }

  it("uses an explicit POST route for new project creation", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain('action="/projects/create"');
    expect(markup).toContain('method="post"');
  });

  it("accepts ordinary woodworking dimensions in browser number controls", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain('name="width_inches"');
    expect(markup).toContain('name="height_inches"');
    expect(markup).toContain('name="depth_inches"');
    expect(markup).toContain('name="material_thickness_inches"');
    expect(markup).not.toContain('step="0.125"');
    expect(markup).not.toContain('step="0.03125"');
    expect(markup.match(/step="any"/g)?.length).toBeGreaterThanOrEqual(4);
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

  it("repopulates safe intake fields after an invalid intake redirect", async () => {
    const draft: ProjectIntakeDraft = {
      title: "Hosted smoke shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "12",
      height_inches: "8",
      depth_inches: "4",
      material_thickness_inches: "0.75",
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil"],
      style_notes: "Painted white.",
      intended_use: "Indoor wall shelf.",
    };
    headerMocks.cookies.mockResolvedValueOnce({
      get: vi.fn(() => ({ value: encodeProjectIntakeDraft(draft) })),
    });

    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ error: "invalid_intake" }),
      }),
    );

    expect(markup).toContain('value="Hosted smoke shelf"');
    expect(markup).toContain('value="12"');
    expect(markup).toContain('value="8"');
    expect(markup).toContain('value="4"');
    expect(markup).toContain('value="0.75"');
    expect(markup).toContain('value="pine board"');
    expect(markup).toContain("Painted white.");
    expect(markup).toContain("Indoor wall shelf.");
    expect(markup).toContain('checked="" value="tape_measure"');
    expect(markup).toContain('checked="" value="pencil"');
  });

  it("keeps invalid project creation errors user-facing", async () => {
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Bad smoke project",
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

  it("stores a short-lived intake draft when invalid intake redirects", async () => {
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Hosted smoke shelf",
      tools_available: "invalid_tool",
      intended_use: "A small shelf with entered values that should not be wiped.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(draftCookie).toContain("boardsmith_project_intake_draft=");
    expect(decodedDraft.title).toBe("Hosted smoke shelf");
    expect(decodedDraft.width_inches).toBe("12");
    expect(decodedDraft.material_thickness_inches).toBe("0.75");
    expect(decodedDraft.tools_available).toEqual(["tape_measure", "pencil", "drill"]);
    expect(draftCookie).not.toContain("Zod");
    expect(decodedDraft.tools_available).not.toContain("invalid_tool");
  });

  it("creates projects with whole-number dimensions and decimal material thickness", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "ordinary_dimensions_project",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Smoke shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 12,
      height_inches: 8,
      depth_inches: 4,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil", "drill"],
      style_notes: "Simple finish.",
      intended_use: "Small indoor shelf.",
      safety_review_required: false,
      safety_flags: [],
      notes: "",
      build_completed: false,
      build_completed_at: "",
      build_actual_material: "",
      build_plan_changes: "",
      build_lessons_learned: "",
    });
    const { POST } = await import("@/app/projects/create/route");

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body: validProjectFormData(),
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/ordinary_dimensions_project");
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        width_inches: 12,
        height_inches: 8,
        depth_inches: 4,
        material_thickness_inches: 0.75,
      }),
    );
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
