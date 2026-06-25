import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";
import NewProjectPage from "@/app/projects/new/page";
import {
  decodeProjectIntakeDraft,
  encodeProjectIntakeDraft,
  maxProjectIntakeDraftCookieValueLength,
  projectIntakeDraftCookieName,
  type ProjectIntakeDraft,
} from "@/lib/projects/intake-draft";
import type { Project } from "@/lib/projects/types";
import { createProject, getProject, listGeneratedPlans } from "@/lib/storage/project-store";
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
  getProject: vi.fn(),
  listGeneratedPlans: vi.fn(() => Promise.resolve([])),
}));

describe("project form routes", () => {
  beforeEach(() => {
    vi.mocked(createProject).mockReset();
    vi.mocked(getProject).mockReset();
    vi.mocked(getProject).mockResolvedValue(projectDetailProject());
    vi.mocked(listGeneratedPlans).mockReset();
    vi.mocked(listGeneratedPlans).mockResolvedValue([]);
    headerMocks.cookies.mockResolvedValue({
      get: vi.fn(() => undefined),
    });
  });

  type ProjectDetailProjectOverrides = Omit<Partial<Project>, "project_type"> & { project_type?: string };

  function projectDetailProject(overrides: ProjectDetailProjectOverrides = {}): Project {
    const baseProject = {
      id: "project_form_route",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Form route shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 36,
      height_inches: 0.75,
      depth_inches: 10,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      shelf_layout: "single_shelf",
      shelf_count: 1,
      shelf_spacing_inches: undefined,
      tools_available: ["tape_measure", "pencil", "drill"],
      style_notes: "Wall mounted with metal brackets screwed into studs.",
      intended_use: "Decorative shelf for light display items.",
      safety_review_required: true,
      safety_flags: ["Wall mounting review", "Heavy shelving review"],
      notes: "",
      build_completed: false,
      build_completed_at: "",
      build_actual_material: "",
      build_plan_changes: "",
      build_lessons_learned: "",
      ...activeProjectArchiveFields,
    } satisfies Project;

    return { ...baseProject, ...overrides } as unknown as Project;
  }

  async function renderProjectDetail() {
    const { default: ProjectDetailPage } = await import("@/app/projects/[id]/page");

    return renderToStaticMarkup(
      await ProjectDetailPage({
        params: Promise.resolve({ id: "project_form_route" }),
        searchParams: Promise.resolve({}),
      }),
    );
  }

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

  function naturalLanguageDraft(overrides: Partial<ProjectIntakeDraft> = {}): ProjectIntakeDraft {
    return {
      title: "Project idea",
      project_type: "",
      skill_level: "beginner",
      width_inches: "84",
      height_inches: "96",
      depth_inches: "12",
      material_thickness_inches: "0.75",
      material_type: "0.75 inch plywood",
      shelf_layout: "",
      shelf_count: "",
      shelf_spacing_inches: "",
      board_size: "",
      measurement_confidence: "close_estimate",
      mounting_method: "",
      wall_type: "",
      stud_access: "",
      shelf_load: "",
      moisture_exposure: "",
      higher_risk_spots: [],
      install_location: "",
      planned_mounting_height: "",
      support_count: "",
      wall_obstructions: "",
      cut_strategy: "",
      finish_preference: "",
      edge_treatment: "",
      tools_available: ["drill", "safety_glasses", "sander"],
      style_notes: "Drafted from a plain-language idea. Review every field before saving.",
      intended_use: "Built-in bookcase cabinets around a fireplace.",
      draft_source: "natural_language",
      draft_status: "concept_only",
      draft_missing_fields: ["project_type"],
      draft_blocked_reasons: [],
      draft_review_notes: ["Project type could not be inferred confidently."],
      ...overrides,
    };
  }

  function cookieStoreForDraft(draft: ProjectIntakeDraft) {
    return {
      get: vi.fn((name: string) => (name === projectIntakeDraftCookieName ? { value: encodeProjectIntakeDraft(draft) } : undefined)),
    };
  }

  it("uses an explicit POST route for new project creation", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain('action="/projects/create"');
    expect(markup).toContain('method="post"');
  });

  it("uses an explicit POST route for drafting setup fields from a plain-language idea", async () => {
    const markup = renderToStaticMarkup(await NewProjectPage({}));

    expect(markup).toContain("Draft from an idea");
    expect(markup).toContain('action="/projects/draft"');
    expect(markup).toContain('name="idea_text"');
    expect(markup).toContain("Draft setup fields");
    expect(markup).toContain("does not generate a");
    expect(markup.indexOf('action="/projects/draft"')).toBeLessThan(markup.indexOf('action="/projects/create"'));
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

    expect(markup).toContain("Tell Boardsmith what you want to build");
    expect(markup).toContain("Add the basic details first.");
    expect(markup).toContain('placeholder="Example: Small bathroom wall shelf"');
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
    expect(markup).toContain("Project");
    expect(markup).toContain("Size and board");
    expect(markup).toContain("Shelf size and boards");
    expect(markup).toContain("Mounting and safety");
    expect(markup).toContain("Wall, load, and exposure");
    expect(markup).toContain("Tools and finish");
    expect(markup).toContain("Wall shelf");
    expect(markup).toContain('<option value="simple_shelf" selected="">Wall shelf</option>');
    expect(markup).toContain("Need help measuring?");
    expect(markup).toContain("Shelf width = left to right");
    expect(markup).toContain("Shelf depth = from wall to front edge");
    expect(markup).toContain("Total project height = full top-to-bottom size");
    expect(markup).toContain("Board thickness = each board, not the whole project");
    expect(markup).toContain("Measure the space where the shelf will go.");
    expect(markup).toContain("Shelf size");
    expect(markup).toContain("Single shelf");
    expect(markup).toContain("Multiple separate wall shelves");
    expect(markup).toContain("Connected shelf unit with side supports/frame");
    expect(markup).toContain('name="shelf_layout"');
    expect(markup).toContain('name="shelf_count"');
    expect(markup).toContain('name="shelf_spacing_inches"');
    expect(markup).toContain('name="board_size"');
    expect(markup).toContain('name="measurement_confidence"');
    expect(markup).toContain("Number of shelves");
    expect(markup).toContain("Shelf spacing, inches, optional");
    expect(markup).toContain("Shelf width, inches");
    expect(markup).toContain("Shelf depth from wall, inches");
    expect(markup).toContain("Actual board thickness, inches");
    expect(markup).toContain("Board size from store");
    expect(markup).toContain("Board material");
    expect(markup).toContain("Total project height, inches, optional");
    expect(markup).not.toContain("A shelf usually needs a depth greater than 0.");
    expect(markup).toContain("How do you want to mount it?");
    expect(markup).toContain("What will it mount into?");
    expect(markup).toContain("Can you attach to studs?");
    expect(markup).toContain("What will the shelf hold?");
    expect(markup).toContain("Moisture exposure");
    expect(markup).toContain("Where on the wall will it go?");
    expect(markup).toContain("How many supports or brackets?");
    expect(markup).toContain("Is this shelf in a higher-risk spot?");
    expect(markup).toContain("Anything behind or near the shelf location?");
    expect(markup).toContain("Stud finder");
    expect(markup).toContain("Safety glasses");
    expect(markup).toContain("How will the board be cut?");
    expect(markup).toContain("Quick select: Basic layout tools");
    expect(markup).toContain("Review before saving");
    expect(markup).toContain("Boardsmith saves this setup first.");
    expect(markup).toContain("Complete required info to save");
    expect(markup).toContain("Complete the missing required info above before saving this setup.");
    expect(markup).toContain("Save and review project");
    expect(markup.match(/Use example/g)?.length).toBe(5);
    expect(markup.indexOf("<summary")).toBeLessThan(markup.indexOf('action="/projects/create"'));
    expect(markup.indexOf('id="project-basics"')).toBeGreaterThan(markup.indexOf("<form"));
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

  it("shows friendly project idea draft error copy", async () => {
    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ error: "invalid_idea" }),
      }),
    );

    expect(markup).toContain("Project idea needs a few more words.");
    expect(markup).toContain("Add the rough object, size, material, and where it will be used");
    expect(markup).toContain('action="/projects/draft"');
    expect(markup).toContain('action="/projects/create"');
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
      board_size: "one_by_eight",
      measurement_confidence: "measured_ready",
      mounting_method: "visible_l_brackets",
      wall_type: "drywall_wood_studs",
      stud_access: "yes",
      shelf_load: "towels",
      moisture_exposure: "bathroom_humid",
      higher_risk_spots: ["above_toilet_sink_or_walkway"],
      install_location: "above_toilet",
      planned_mounting_height: "Around 60 in from floor.",
      support_count: "two",
      wall_obstructions: "Towel bar below shelf.",
      cut_strategy: "store_cut_or_precut",
      finish_preference: "Moisture-resistant paint.",
      edge_treatment: "Rounded front corners.",
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
    expect(markup).toContain('<option value="one_by_eight" selected="">1x8 board</option>');
    expect(markup).toContain('<option value="measured_ready" selected="">Yes, measured and ready</option>');
    expect(markup).toContain('<option value="visible_l_brackets" selected="">Visible L brackets</option>');
    expect(markup).toContain('<option value="drywall_wood_studs" selected="">Drywall with wood studs</option>');
    expect(markup).toContain('<option value="yes" selected="">Yes, studs can be used</option>');
    expect(markup).toContain('<option value="towels" selected="">Towels</option>');
    expect(markup).toContain('<option value="bathroom_humid" selected="">Bathroom/humid room</option>');
    expect(markup).toContain('<option value="above_toilet" selected="">Above toilet</option>');
    expect(markup).toContain('name="planned_mounting_height" value="Around 60 in from floor."');
    expect(markup).toContain('<option value="two" selected="">2</option>');
    expect(markup).toContain('checked="" value="above_toilet_sink_or_walkway"');
    expect(markup).toContain("Towel bar below shelf.");
    expect(markup).toContain('<option value="store_cut_or_precut" selected="">I need store-cut or pre-cut boards</option>');
    expect(markup).toContain('value="Moisture-resistant paint."');
    expect(markup).toContain('value="Rounded front corners."');
    expect(markup).toContain("Painted white.");
    expect(markup).toContain("Indoor wall shelf.");
    expect(markup).toContain('checked="" value="tape_measure"');
    expect(markup).toContain('checked="" value="pencil"');
  });

  it("repopulates safe intake fields after drafting from a plain-language idea", async () => {
    const draft: ProjectIntakeDraft = {
      title: "Bathroom wall shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "24",
      height_inches: "6",
      depth_inches: "8",
      material_thickness_inches: "0.75",
      material_type: "0.75 inch pine board",
      shelf_layout: "single_shelf",
      shelf_count: "1",
      shelf_spacing_inches: "",
      board_size: "one_by_eight",
      measurement_confidence: "close_estimate",
      mounting_method: "not_sure",
      wall_type: "not_sure",
      stud_access: "yes",
      shelf_load: "towels",
      moisture_exposure: "bathroom_humid",
      higher_risk_spots: ["near_water_shower_or_tub"],
      install_location: "",
      planned_mounting_height: "",
      support_count: "",
      wall_obstructions: "",
      cut_strategy: "",
      finish_preference: "Painted finish.",
      edge_treatment: "",
      tools_available: ["drill", "safety_glasses", "sander"],
      style_notes: "Drafted from a plain-language idea. Review every field before saving.",
      intended_use: "Bathroom wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board.",
      draft_source: "natural_language",
      draft_missing_fields: ["mounting_details"],
      draft_blocked_reasons: [],
      draft_review_notes: ["Mounting, wall type, and stud access still need confirmation."],
    };
    headerMocks.cookies.mockResolvedValueOnce({
      get: vi.fn(() => ({ value: encodeProjectIntakeDraft(draft) })),
    });

    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ draft: "idea" }),
      }),
    );

    expect(markup).toContain("Idea drafted into setup fields - review before saving.");
    expect(markup).toContain('value="Bathroom wall shelf"');
    expect(markup).toContain('value="24"');
    expect(markup).toContain('value="6"');
    expect(markup).toContain('value="8"');
    expect(markup).toContain('value="0.75"');
    expect(markup).toContain('value="0.75 inch pine board"');
    expect(markup).toContain('<option value="one_by_eight" selected="">1x8 board</option>');
    expect(markup).toContain('<option value="yes" selected="">Yes, studs can be used</option>');
    expect(markup).toContain('<option value="towels" selected="">Towels</option>');
    expect(markup).toContain('checked="" value="near_water_shower_or_tub"');
    expect(markup).toContain('checked="" value="drill"');
    expect(markup).toContain('checked="" value="safety_glasses"');
    expect(markup).toContain('checked="" value="sander"');
    expect(markup).toContain("Draft review before saving");
    expect(markup).toContain("Missing detail: Mounting details");
    expect(markup).toContain("Mounting, wall type, and stud access still need confirmation.");
  });

  it("does not silently select wall shelf when an idea draft preserved an unsupported project type", async () => {
    const draft: ProjectIntakeDraft = {
      title: "Bookcase concept",
      project_type: "",
      skill_level: "beginner",
      width_inches: "84",
      height_inches: "96",
      depth_inches: "12",
      material_thickness_inches: "0.75",
      material_type: "0.75 inch plywood",
      shelf_layout: "",
      shelf_count: "",
      shelf_spacing_inches: "",
      board_size: "",
      measurement_confidence: "close_estimate",
      mounting_method: "",
      wall_type: "",
      stud_access: "",
      shelf_load: "",
      moisture_exposure: "",
      higher_risk_spots: [],
      install_location: "",
      planned_mounting_height: "",
      support_count: "",
      wall_obstructions: "",
      cut_strategy: "",
      finish_preference: "",
      edge_treatment: "",
      tools_available: ["drill", "safety_glasses", "sander"],
      style_notes: "Drafted from a plain-language idea. Review every field before saving.\nProject type could not be inferred confidently.",
      intended_use: "Built-in bookcase cabinets around a fireplace, 84 x 12 x 96 inches, 3/4 inch plywood, drill and sander available.",
      draft_source: "natural_language",
      draft_status: "concept_only",
      draft_missing_fields: ["project_type"],
      draft_blocked_reasons: [],
      draft_review_notes: [
        "This looks woodworking-adjacent, but it is not a supported build-packet template yet. Choose a supported project type or keep it as concept review.",
        "Project type could not be inferred confidently.",
      ],
    };
    headerMocks.cookies.mockResolvedValueOnce({
      get: vi.fn(() => ({ value: encodeProjectIntakeDraft(draft) })),
    });

    const markup = renderToStaticMarkup(
      await NewProjectPage({
        searchParams: Promise.resolve({ draft: "idea" }),
      }),
    );

    expect(markup).toContain("Draft review before saving");
    expect(markup).toContain("Concept-only idea - not a supported build packet yet.");
    expect(markup).toContain("Concept-only draft: choose a supported project type before saving a build setup.");
    expect(markup).toContain("Missing detail: Project type");
    expect(markup).toContain("This looks woodworking-adjacent, but it is not a supported build-packet template yet.");
    expect(markup).toContain("Project type could not be inferred confidently.");
    expect(markup).toContain('<option value="" selected="">Choose a supported project type</option>');
    expect(markup).toContain('<option value="" selected="">Choose layout after template</option>');
    expect(markup).toContain('name="draft_resolution"');
    expect(markup).toContain("I am intentionally choosing a supported template.");
    expect(markup).toContain("Known size details");
    expect(markup).toContain("What will it hold?");
    expect(markup).not.toContain("Shelf size");
    expect(markup).not.toContain("For wall shelves, note nearby outlets");
    expect(markup).not.toContain('<option value="simple_shelf" selected="">Wall shelf</option>');
    expect(markup).not.toContain('<option value="single_shelf" selected="">Single shelf</option>');
    expect(markup).not.toContain('placeholder="1" value="1"');
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

  it("does not save a concept-only draft unless the user explicitly resolves it to a supported template", async () => {
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Bookcase concept",
      draft_source: "natural_language",
      draft_status: "concept_only",
      project_type: "simple_shelf",
      intended_use: "Built-in bookcase cabinets around a fireplace.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";
    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?draft=idea&error=unresolved_idea");
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("concept_only");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("uses the draft cookie to block a concept-only draft when hidden fields are tampered away", async () => {
    const trustedDraft = naturalLanguageDraft({
      title: "Bookcase concept",
      draft_status: "concept_only",
      draft_review_notes: [
        "This looks woodworking-adjacent, but it is not a supported build-packet template yet. Choose a supported project type or keep it as concept review.",
      ],
    });
    headerMocks.cookies.mockResolvedValueOnce(cookieStoreForDraft(trustedDraft));
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Bookcase concept",
      project_type: "simple_shelf",
      intended_use: "Built-in bookcase cabinets around a fireplace.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";
    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?draft=idea&error=unresolved_idea");
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("concept_only");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("does not save a blocked safety draft even if a supported template is posted", async () => {
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Nursery loft bed",
      draft_source: "natural_language",
      draft_status: "blocked_for_safety",
      draft_resolution: "supported_template_selected",
      project_type: "simple_shelf",
      intended_use: "Child loft bed platform with ladder and storage stairs for a nursery.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?draft=idea&error=blocked_idea");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("uses the draft cookie to block a safety draft when hidden fields claim it is supported", async () => {
    const trustedDraft = naturalLanguageDraft({
      title: "Nursery loft bed",
      draft_status: "blocked_for_safety",
      draft_blocked_reasons: ["child_sleep_or_entrapment", "load_bearing_or_climbable"],
      draft_review_notes: ["This idea includes safety-sensitive terms that may block plan generation."],
      intended_use: "Child loft bed platform with ladder and storage stairs for a nursery.",
    });
    headerMocks.cookies.mockResolvedValueOnce(cookieStoreForDraft(trustedDraft));
    const { POST } = await import("@/app/projects/create/route");
    const body = validProjectFormData({
      title: "Nursery loft bed",
      draft_source: "natural_language",
      draft_status: "supported_draft",
      draft_resolution: "supported_template_selected",
      project_type: "simple_shelf",
      intended_use: "Child loft bed platform with ladder and storage stairs for a nursery.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";
    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?draft=idea&error=blocked_idea");
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("blocked_for_safety");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("saves a concept-only draft only after explicit supported-template resolution", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "resolved_concept_project",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Resolved shelf concept",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 36,
      height_inches: 0.75,
      depth_inches: 10,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil", "drill"],
      style_notes: "Converted to supported shelf setup.",
      intended_use: "A small supported shelf, not the whole bookcase.",
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
    const body = validProjectFormData({
      title: "Resolved shelf concept",
      draft_source: "natural_language",
      draft_status: "concept_only",
      draft_resolution: "supported_template_selected",
      project_type: "simple_shelf",
      intended_use: "A small supported shelf, not the whole bookcase.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/create", {
        method: "POST",
        body,
      }),
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/resolved_concept_project");
    expect(createProject).toHaveBeenCalledTimes(1);
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

  it("stores a short-lived editable intake draft from a plain-language idea", async () => {
    const { POST } = await import("@/app/projects/draft/route");
    const body = new URLSearchParams({
      idea_text:
        "Bathroom wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board, drill and sander available, towels only, mount into studs if possible, painted finish.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/draft", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";
    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?draft=idea");
    expect(draftCookie).toContain("Path=/projects");
    expect(decodedDraft.title).toBe("Bathroom wall shelf");
    expect(decodedDraft.project_type).toBe("simple_shelf");
    expect(decodedDraft.width_inches).toBe("24");
    expect(decodedDraft.depth_inches).toBe("8");
    expect(decodedDraft.material_type).toBe("0.75 inch pine board");
    expect(decodedDraft.tools_available).toEqual(["drill", "safety_glasses", "sander"]);
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("supported_draft");
    expect(decodedDraft.draft_missing_fields).toEqual([]);
    expect(decodedDraft.draft_review_notes).toContain("Mounting, wall type, and stud access still need confirmation.");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("stores concept-only draft metadata for future-template plain-language ideas", async () => {
    const { POST } = await import("@/app/projects/draft/route");
    const body = new URLSearchParams({
      idea_text:
        "Built-in bookcase cabinets around a fireplace, 84 x 12 x 96 inches, 3/4 inch plywood, drill and sander available.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/draft", {
        method: "POST",
        body,
      }),
    );

    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/new?draft=idea");
    expect(decodedDraft.title).toBe("Bookcase concept");
    expect(decodedDraft.project_type).toBe("");
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("concept_only");
    expect(decodedDraft.draft_missing_fields).toContain("project_type");
    expect(decodedDraft.draft_review_notes).toContain(
      "This looks woodworking-adjacent, but it is not a supported build-packet template yet. Choose a supported project type or keep it as concept review.",
    );
    expect(createProject).not.toHaveBeenCalled();
  });

  it("stores safety-sensitive draft metadata for long blocked plain-language ideas", async () => {
    const { POST } = await import("@/app/projects/draft/route");
    const body = new URLSearchParams({
      idea_text: "Child loft bed platform with ladder and storage stairs for a nursery, 72 x 36 x 60 inches, pine boards, drill available.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/draft", {
        method: "POST",
        body,
      }),
    );

    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/new?draft=idea");
    expect(decodedDraft.draft_source).toBe("natural_language");
    expect(decodedDraft.draft_status).toBe("blocked_for_safety");
    expect(decodedDraft.draft_blocked_reasons).toEqual(["child_sleep_or_entrapment", "load_bearing_or_climbable"]);
    expect(decodedDraft.draft_review_notes).toContain("This idea includes safety-sensitive terms that may block plan generation.");
    expect(decodedDraft.intended_use).not.toContain("Zod");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("preserves concept-only built-in ideas in the draft cookie instead of coercing them into wall shelves", async () => {
    const { POST } = await import("@/app/projects/draft/route");
    const body = new URLSearchParams({
      idea_text: "Built-in bookcase cabinets around a fireplace, 84 x 12 x 96 inches, 3/4 inch plywood, drill and sander available.",
    });

    const response = await POST(
      new Request("http://boardsmith.test/projects/draft", {
        method: "POST",
        body,
      }),
    );

    const draftCookie = response.headers.get("set-cookie") ?? "";
    const encodedDraft = /boardsmith_project_intake_draft=([^;]+)/.exec(draftCookie)?.[1];
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toContain("/projects/new?draft=idea");
    expect(decodedDraft.project_type).toBe("");
    expect(decodedDraft.shelf_layout).toBe("");
    expect(decodedDraft.draft_status).toBe("concept_only");
    expect(decodedDraft.tools_available).toEqual(["drill", "safety_glasses", "sander"]);
    expect(decodedDraft.draft_missing_fields).toContain("project_type");
    expect(decodedDraft.draft_review_notes).toContain("Project type could not be inferred confidently.");
    expect(decodedDraft.draft_review_notes).not.toContain("Mounting, wall type, and stud access still need confirmation.");
    expect(createProject).not.toHaveBeenCalled();
  });

  it("redirects short idea drafts without echoing the submitted text", async () => {
    const { POST } = await import("@/app/projects/draft/route");
    const body = new URLSearchParams({ idea_text: "shelf" });

    const response = await POST(
      new Request("http://boardsmith.test/projects/draft", {
        method: "POST",
        body,
      }),
    );

    const location = response.headers.get("location") ?? "";

    expect(response.status).toBe(303);
    expect(location).toContain("/projects/new?error=invalid_idea");
    expect(location).not.toContain("shelf");
    expect(response.headers.get("set-cookie")).toBeNull();
    expect(createProject).not.toHaveBeenCalled();
  });

  it("bounds large invalid-intake drafts so the recovery cookie survives browser limits", () => {
    const draft: ProjectIntakeDraft = {
      title: "Hosted smoke shelf with a long but valid title".padEnd(120, "x"),
      project_type: "simple_shelf",
      skill_level: "beginner",
      width_inches: "240",
      height_inches: "240",
      depth_inches: "240",
      material_thickness_inches: "12",
      material_type: "pine board".padEnd(120, "x"),
      shelf_layout: "multi_shelf_unit",
      shelf_count: "20",
      shelf_spacing_inches: "120",
      board_size: "other_not_sure",
      measurement_confidence: "not_sure",
      mounting_method: "not_sure",
      wall_type: "not_sure",
      stud_access: "not_sure",
      shelf_load: "not_sure",
      moisture_exposure: "covered_outdoor",
      higher_risk_spots: [
        "above_bed_crib_seat_or_sleeping_area",
        "above_toilet_sink_or_walkway",
        "child_accessible",
        "near_water_shower_or_tub",
        "holding_breakable_or_heavy_items",
        "not_sure",
      ],
      install_location: "other_not_sure",
      planned_mounting_height: "Around 60 inches from the floor.".padEnd(160, "x"),
      support_count: "not_sure",
      wall_obstructions: "Towel bars, switches, and other wall constraints.".padEnd(300, "x"),
      cut_strategy: "not_sure",
      finish_preference: "Moisture-resistant finish review.".padEnd(240, "x"),
      edge_treatment: "Rounded front corners.".padEnd(240, "x"),
      tools_available: [
        "tape_measure",
        "pencil",
        "clamps",
        "drill",
        "stud_finder",
        "level",
        "safety_glasses",
        "jigsaw",
        "circular_saw",
        "miter_saw",
        "sander",
        "paint_brush",
      ],
      style_notes: "Detailed style notes. ".repeat(50),
      intended_use: "Detailed intended use. ".repeat(50),
    };

    const encodedDraft = encodeProjectIntakeDraft(draft);
    const decodedDraft = decodeProjectIntakeDraft(encodedDraft);

    expect(encodedDraft.length).toBeLessThanOrEqual(maxProjectIntakeDraftCookieValueLength);
    expect(decodedDraft.title).toBe(draft.title);
    expect(decodedDraft.project_type).toBe("simple_shelf");
    expect(decodedDraft.shelf_layout).toBe("multi_shelf_unit");
    expect(decodedDraft.tools_available).toContain("safety_glasses");
    expect(decodedDraft.style_notes.length).toBeLessThanOrEqual(draft.style_notes.length);
    expect(decodedDraft.intended_use.length).toBeLessThanOrEqual(draft.intended_use.length);
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

  it("persists guided mounting, load, exposure, and cutting answers into the saved intake text", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "guided_intake_project",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Bathroom wall shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 24,
      height_inches: 0.75,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil", "drill", "stud_finder", "safety_glasses"],
      style_notes: "Painted white.",
      intended_use: "Bathroom shelf for towels.",
      safety_review_required: true,
      safety_flags: ["Wall mounting review"],
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
          title: "Bathroom wall shelf",
          height_inches: "",
          depth_inches: "8",
          material_type: "pine board",
          intended_use: "Bathroom shelf for towels.",
          style_notes: "Painted white.",
          mounting_method: "visible_l_brackets",
          wall_type: "drywall_wood_studs",
          stud_access: "yes",
          shelf_load: "towels",
          moisture_exposure: "bathroom_humid",
          install_location: "above_toilet",
          planned_mounting_height: "Around 60 in from floor.",
          support_count: "two",
          higher_risk_spots: "above_toilet_sink_or_walkway",
          wall_obstructions: "Towel bar below shelf.",
          measurement_confidence: "measured_ready",
          board_size: "one_by_eight",
          cut_strategy: "store_cut_or_precut",
          finish_preference: "Moisture-resistant paint.",
          edge_treatment: "Rounded front corners.",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(createProject).toHaveBeenCalledTimes(1);
    const createdIntake = vi.mocked(createProject).mock.calls[0][0];
    expect(createdIntake.intended_use).toContain("Structured intake");
    expect(createdIntake.style_notes).toContain("Planning preferences");
    expect(createdIntake.intended_use).toContain("Mounting method: Visible L brackets");
    expect(createdIntake.style_notes).toContain("Cut plan: I need store-cut or pre-cut boards");
    expect(createdIntake.intended_use).toContain("Moisture exposure: Bathroom/humid room");
    expect(createdIntake.intended_use).toContain("Install location: Above toilet");
    expect(createdIntake.intended_use).toContain("Support/bracket count: 2");
    expect(createdIntake.intended_use).toContain("Higher-risk spot: Above a toilet, sink, or walkway");
    expect(createdIntake.intended_use).toContain("Nearby wall conditions or obstructions: Towel bar below shelf.");
    expect(createdIntake.style_notes).toContain("Edge treatment: Rounded front corners.");
  });

  it("allows final notes to stay blank when structured setup answers are present", async () => {
    vi.mocked(createProject).mockResolvedValueOnce({
      id: "blank_notes_guided_project",
      created_at: new Date(0).toISOString(),
      updated_at: new Date(0).toISOString(),
      title: "Bathroom wall shelf",
      project_type: "simple_shelf",
      skill_level: "beginner",
      status: "draft",
      width_inches: 24,
      height_inches: 0.75,
      depth_inches: 8,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "pencil", "level", "safety_glasses"],
      style_notes: "Planning preferences",
      intended_use: "Structured intake",
      safety_review_required: true,
      safety_flags: ["Wall mounting review"],
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
          title: "Bathroom wall shelf",
          height_inches: "",
          depth_inches: "8",
          material_type: "pine board",
          intended_use: "",
          style_notes: "",
          mounting_method: "visible_l_brackets",
          wall_type: "drywall_wood_studs",
          stud_access: "yes",
          shelf_load: "towels",
          moisture_exposure: "bathroom_humid",
          measurement_confidence: "measured_ready",
          board_size: "one_by_eight",
          cut_strategy: "store_cut_or_precut",
        }),
      }),
    );

    expect(response.status).toBe(303);
    expect(createProject).toHaveBeenCalledTimes(1);
    const createdIntake = vi.mocked(createProject).mock.calls[0][0];
    expect(createdIntake.intended_use).toContain("Structured intake");
    expect(createdIntake.intended_use).toContain("Mounting method: Visible L brackets");
    expect(createdIntake.intended_use).toContain("What it will hold: Towels");
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
    const markup = await renderProjectDetail();

    expect(markup).toContain('action="/projects/project_form_route/generate"');
    expect(markup).toContain('method="post"');
  });

  it("renders generate plan pending-state copy for the client submit control", async () => {
    const markup = await renderProjectDetail();

    expect(markup).toContain('data-pending-label="Generating plan..."');
    expect(markup).toContain("Generate Plan");
  });

  it("renders ready clarification gate copy on the project detail route", async () => {
    const markup = await renderProjectDetail();

    expect(markup).toContain("Plan readiness");
    expect(markup).toContain("Ready for full plan");
    expect(markup).toContain("Full plan path available");
    expect(markup).toContain("The saved intake has enough detail for a first plan.");
    expect(markup).toContain('action="/projects/project_form_route/generate"');
  });

  it("renders needs-details clarification questions on the project detail route", async () => {
    vi.mocked(getProject).mockResolvedValueOnce(
      projectDetailProject({
        title: "Multiple shelf bathroom storage",
        material_type: "unknown",
        shelf_layout: undefined,
        shelf_count: undefined,
        tools_available: [],
        style_notes: "",
        intended_use: "Multiple shelves for bathroom towels.",
      }),
    );

    const markup = await renderProjectDetail();

    expect(markup).toContain("Needs details");
    expect(markup).toContain("Review before full plan");
    expect(markup).toContain("What material should this be built from?");
    expect(markup).toContain("How many shelves or shelf openings should the plan include?");
    expect(markup).toContain("What safe tools are available for cutting, drilling, sanding, and assembly?");
    expect(markup).not.toContain("Zod");
  });

  it("renders unsupported clarification gate boundaries without internal errors", async () => {
    vi.mocked(getProject).mockResolvedValueOnce(
      projectDetailProject({
        title: "Replace a bicycle chain",
        project_type: "bike_repair",
        intended_use: "Fix a bicycle drivetrain.",
        style_notes: "",
      }),
    );

    const markup = await renderProjectDetail();

    expect(markup).toContain("Unsupported");
    expect(markup).toContain("This idea is outside the current supported Boardsmith project types.");
    expect(markup).toContain("a full build packet needs a supported safe template");
    expect(markup).not.toContain("Unsupported project type:");
    expect(markup).not.toContain("schema");
  });

  it("renders blocked clarification gate boundaries on the project detail route", async () => {
    vi.mocked(getProject).mockResolvedValueOnce(
      projectDetailProject({
        title: "Nursery loft bed",
        intended_use: "Loft bed sleep surface for a child.",
        style_notes: "Includes storage stairs.",
      }),
    );

    const markup = await renderProjectDetail();

    expect(markup).toContain("Blocked for safety");
    expect(markup).toContain("This project is too safety-sensitive for build instructions in the private MVP.");
    expect(markup).toContain("Child sleep or entrapment risk");
    expect(markup).toContain("Boardsmith should not generate build instructions");
  });
});
