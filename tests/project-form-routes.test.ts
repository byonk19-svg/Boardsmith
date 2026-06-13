import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProjectPage from "@/app/projects/new/page";
import { decodeProjectIntakeDraft, encodeProjectIntakeDraft, type ProjectIntakeDraft } from "@/lib/projects/intake-draft";
import { createProject } from "@/lib/storage/project-store";
import { activeProjectArchiveFields } from "./project-test-helpers";

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
      ...activeProjectArchiveFields,
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
      shelf_layout: "single_shelf",
      shelf_count: "1",
      shelf_spacing_inches: "",
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

    expect(markup).toContain("Start a project plan");
    expect(markup).toContain("Save a clear project intake first.");
    expect(markup).toContain("Start from an example");
    expect(markup).toContain("optional editable starters");
    expect(markup).toContain("Examples fill the form with beginner-friendly details.");
    expect(markup).toContain("start with Project basics below");
    expect(markup).toContain("Freestanding plant display board");
    expect(markup).toContain("Simple cordless lamp riser platform");
    expect(markup).toContain("Small desktop organizer");
    expect(markup).toContain("Basic outdoor planter box shell");
    expect(markup).toContain("Small decorative catchall tray");
    expect(markup).toContain("Good input example");
    expect(markup).toContain("Small indoor wall shelf, 24 x 8 x 6 inches");
    expect(markup).toContain("Include what you know");
    expect(markup).toContain("finished dimensions or your best current estimate");
    expect(markup).toContain("material and thickness");
    expect(markup).toContain("tools you can safely use");
    expect(markup).toContain("Project basics");
    expect(markup).toContain("Measurements");
    expect(markup).toContain("Shelf size and boards");
    expect(markup).toContain("Wall shelf");
    expect(markup).toContain('<option value="simple_shelf" selected="">Wall shelf</option>');
    expect(markup).toContain("Shelf width = left to right");
    expect(markup).toContain("Shelf depth = from wall to front edge");
    expect(markup).toContain("Total project height = full top-to-bottom size");
    expect(markup).toContain("Board thickness = each board, not the whole project");
    expect(markup).toContain("For a wall shelf, start with width, depth from the wall, and board thickness.");
    expect(markup).toContain("For shelves");
    expect(markup).toContain("Single shelf");
    expect(markup).toContain("Multiple separate wall shelves");
    expect(markup).toContain("Connected shelf unit with side supports/frame");
    expect(markup).toContain("choose the layout, add the number of shelves");
    expect(markup).toContain('name="shelf_layout"');
    expect(markup).toContain('name="shelf_count"');
    expect(markup).toContain('name="shelf_spacing_inches"');
    expect(markup).toContain("Number of shelves");
    expect(markup).toContain("Shelf spacing, inches, optional");
    expect(markup).toContain("Shelf width, inches");
    expect(markup).toContain("Shelf depth from wall, inches");
    expect(markup).toContain("Shelf board thickness, inches");
    expect(markup).toContain("Total project height, inches, optional");
    expect(markup).toContain("A shelf usually needs a depth greater than 0.");
    expect(markup).toContain("Tools and safety context");
    expect(markup).toContain("Use, constraints, and finish notes");
    expect(markup).toContain("Before saving");
    expect(markup).toContain("generated plans are saved only after validation");
    expect(markup.match(/Use example/g)?.length).toBe(5);
    expect(markup.indexOf("<summary")).toBeLessThan(markup.indexOf("<form"));
    expect(markup.indexOf('<h2 class="text-lg font-semibold text-ink">Project basics</h2>')).toBeGreaterThan(markup.indexOf("<form"));
    expect(markup).toContain('href="/projects/new?example=plant_display_board"');
    expect(markup).toContain('href="/projects/new?example=lamp_riser"');
    expect(markup).toContain('href="/projects/new?example=desktop_organizer"');
    expect(markup).toContain('href="/projects/new?example=planter_box_shell"');
    expect(markup).toContain('href="/projects/new?example=decorative_tray"');
    expect(markup).not.toContain("Starter details loaded");
  });

  it("does not show the shelf depth warning when a shelf starter already has depth", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ example: "lamp_riser" }),
      }),
    );

    expect(markup).toContain("Wall shelf");
    expect(markup).toContain('value="8"');
    expect(markup).not.toContain("A shelf usually needs a depth greater than 0.");
  });

  it("prefills editable starter details from a selected intake example", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ example: "lamp_riser" }),
      }),
    );

    expect(markup).toContain("Starter details loaded");
    expect(markup).toContain("review before creating");
    expect(markup).toContain('value="Simple cordless lamp riser platform"');
    expect(markup).toContain('value="10"');
    expect(markup).toContain('value="8"');
    expect(markup).toContain('value="0.5"');
    expect(markup).toContain('value="1/2 inch plywood"');
    expect(markup).toContain('<option value="single_shelf" selected="">Single shelf</option>');
    expect(markup).toContain('name="shelf_count" value="1"');
    expect(markup).toContain("One flat shelf board only");
    expect(markup).toContain("Freestanding wooden riser for a small cordless lamp");
    expect(markup).toContain('checked="" value="tape_measure"');
    expect(markup).toContain('checked="" value="pencil"');
    expect(markup).toContain('checked="" value="drill"');
    expect(markup).toContain('checked="" value="sander"');
  });

  it("shows friendly project creation error copy", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ error: "invalid_intake" }),
      }),
    );

    expect(markup).toContain("Project intake needs a little more detail.");
    expect(markup).toContain("Check the required fields, dimensions, material, and at least one safe tool before trying again.");
  });

  it("shows a calm unknown-starter state without blocking manual intake", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ example: "missing_starter" }),
      }),
    );

    expect(markup).toContain("Starter example was not found.");
    expect(markup).toContain("Choose one of the examples below or fill in your own project details.");
    expect(markup).toContain('action="/projects/create"');
    expect(markup).toContain("Start from an example");
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
      shelf_layout: "multiple_separate_shelves",
      shelf_count: "2",
      shelf_spacing_inches: "12",
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
    expect(markup).toContain('<option value="multiple_separate_shelves" selected="">Multiple separate wall shelves</option>');
    expect(markup).toContain('name="shelf_count" value="2"');
    expect(markup).toContain('name="shelf_spacing_inches" value="12"');
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
    expect(decodedDraft.shelf_layout).toBe("single_shelf");
    expect(decodedDraft.shelf_count).toBe("1");
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
      ...activeProjectArchiveFields,
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
        shelf_layout: "single_shelf",
        shelf_count: 1,
      }),
    );
  });

  it("submits structured multi-shelf layout fields", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "structured_shelf_layout_project",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Two shelf bathroom unit",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 24,
      height_inches: 36,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      shelf_layout: "multiple_separate_shelves",
      shelf_count: 2,
      shelf_spacing_inches: 12,
      tools_available: ["tape_measure", "pencil", "drill"],
      style_notes: "Simple finish.",
      intended_use: "Two shelves for towels.",
      safety_review_required: false,
      safety_flags: [],
      notes: "",
      build_completed: false,
      build_completed_at: "",
      build_actual_material: "",
      build_plan_changes: "",
      build_lessons_learned: "",
      ...activeProjectArchiveFields,
    });
    const { POST } = await import("@/app/projects/create/route");

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body: validProjectFormData({
          title: "Two shelf bathroom unit",
          height_inches: "36",
          depth_inches: "8",
          shelf_layout: "multiple_separate_shelves",
          shelf_count: "2",
          shelf_spacing_inches: "12",
          intended_use: "Two shelves for towels.",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        shelf_layout: "multiple_separate_shelves",
        shelf_count: 2,
        shelf_spacing_inches: 12,
      }),
    );
  });

  it("uses shelf board thickness as height when a wall shelf leaves total height blank", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "optional_height_wall_shelf",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Smoke shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 24,
      height_inches: 0.75,
      depth_inches: 8,
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
      ...activeProjectArchiveFields,
    });
    const { POST } = await import("@/app/projects/create/route");

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body: validProjectFormData({
          width_inches: "24",
          height_inches: "",
          depth_inches: "8",
          material_thickness_inches: "0.75",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/optional_height_wall_shelf");
    expect(createProject).toHaveBeenCalledWith(
      expect.objectContaining({
        project_type: "simple_shelf",
        width_inches: 24,
        height_inches: 0.75,
        depth_inches: 8,
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
