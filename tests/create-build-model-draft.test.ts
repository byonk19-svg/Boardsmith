import { describe, expect, it } from "vitest";
import { createBuildModelDraft, toStableSnakeCaseId, type BuildModelDraftProject } from "@/lib/build-model/create-build-model-draft";
import {
  parseBoardsmithBuildModel,
  validateBuildModelSemantics,
  type BoardsmithBuildModel,
} from "@/lib/build-model/build-model-schema";
import type { ProjectType } from "@/lib/projects/types";
import type { SafetyReviewFlag } from "@/lib/safety/safety-review";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";

function project(overrides: Partial<BuildModelDraftProject> = {}): BuildModelDraftProject {
  return {
    id: `project_${overrides.project_type ?? "door_hanger"}`,
    title: "Baseline project",
    project_type: "door_hanger",
    skill_level: "beginner",
    width_inches: 18,
    height_inches: 18,
    depth_inches: 0,
    material_thickness_inches: 0.25,
    material_type: "1/4 inch plywood",
    tools_available: ["tape_measure", "pencil", "jigsaw", "sander"],
    style_notes: "Painted decorative project",
    intended_use: "Indoor decorative use",
    ...overrides,
  };
}

function deterministicSafetyFlags(input: BuildModelDraftProject): SafetyReviewFlag[] {
  return calculateSafetyReviewFlags({
    title: input.title,
    project_type: input.project_type,
    width_inches: input.width_inches ?? 0,
    height_inches: input.height_inches ?? 0,
    depth_inches: input.depth_inches ?? 0,
    material_thickness_inches: input.material_thickness_inches ?? 0,
    style_notes: input.style_notes,
    intended_use: input.intended_use,
  });
}

function draftFor(input: BuildModelDraftProject): BoardsmithBuildModel {
  return createBuildModelDraft(input, getTemplateHint(input.project_type), deterministicSafetyFlags(input));
}

function expectValidDraft(draft: BoardsmithBuildModel): void {
  expect(() => parseBoardsmithBuildModel(draft)).not.toThrow();
  expect(validateBuildModelSemantics(draft)).toEqual([]);
}

describe("createBuildModelDraft", () => {
  it.each<ProjectType>(["door_hanger", "layered_cutout", "wood_sign", "simple_shelf", "planter_box"])(
    "creates a valid semantic BBM draft for %s",
    (projectType) => {
      const input = project({
        project_type: projectType,
        depth_inches: projectType === "simple_shelf" || projectType === "planter_box" ? 10 : 0,
        material_type: projectType === "planter_box" ? "cedar board" : "1/4 inch plywood",
        intended_use: projectType === "simple_shelf" ? "Wall mounted shelf for light decor" : "Indoor decorative use",
      });
      const draft = draftFor(input);

      expectValidDraft(draft);
      expect(draft.project.projectType).toBe(projectType);
      expect(draft.pieces.length).toBeGreaterThan(0);
      expect(draft.materials[0]?.id).toMatch(/^[a-z][a-z0-9_]*$/);
    },
  );

  it("scaffolds door hanger structure with backer and hanging hardware", () => {
    const draft = draftFor(project({ project_type: "door_hanger", intended_use: "Door hanging decoration" }));

    expect(draft.pieces.map((piece) => piece.id)).toEqual(expect.arrayContaining(["backer_panel", "decorative_layer_placeholder"]));
    expect(draft.hardware.map((item) => item.id)).toContain("hanging_hardware");
    expect(draft.exportReadiness.svgCandidate).toBe(true);
  });

  it("scaffolds layered cutout structure with glue connection and SVG candidacy", () => {
    const draft = draftFor(project({ project_type: "layered_cutout" }));

    expect(draft.pieces.map((piece) => piece.id)).toEqual(expect.arrayContaining(["backer_layer", "decorative_layer_placeholder"]));
    expect(draft.connections[0]).toEqual(
      expect.objectContaining({
        connectionType: "glue",
        fromPieceId: "decorative_layer_placeholder",
        toPieceId: "backer_layer",
      }),
    );
    expect(draft.exportReadiness.svgCandidate).toBe(true);
    expect(draft.exportReadiness.notes.join(" ")).toContain("Exports are not implemented");
  });

  it("adds wall-mounting review for hanging wood signs", () => {
    const draft = draftFor(project({ project_type: "wood_sign", intended_use: "Wall mounted office sign" }));

    expect(draft.pieces.map((piece) => piece.id)).toContain("sign_panel");
    expect(draft.hardware.map((item) => item.id)).toContain("hanging_hardware");
    expect(draft.safety.flags.map((flag) => flag.category)).toContain("wall_mounting");
    expect(draft.safety.reviewRequired).toBe(true);
  });

  it("keeps wall-mounted heavy shelves conservative and without high confidence", () => {
    const draft = draftFor(
      project({
        project_type: "simple_shelf",
        width_inches: 48,
        depth_inches: 12,
        material_thickness_inches: 0.75,
        material_type: "pine board",
        intended_use: "Wall mounted shelf for heavy books",
      }),
    );

    expect(draft.pieces.map((piece) => piece.id)).toContain("shelf_board");
    expect(draft.hardware.map((item) => item.id)).toEqual(expect.arrayContaining(["wall_brackets", "wall_anchors"]));
    expect(draft.safety.flags.map((flag) => flag.category)).toEqual(expect.arrayContaining(["wall_mounting", "heavy_shelving"]));
    expect(draft.confidence.level).not.toBe("high");
    expect(draft.safety.disclaimers.join(" ")).toContain("cannot verify load capacity");
  });

  it("does not add wall hardware or wall operations for explicit freestanding risers", () => {
    const draft = draftFor(
      project({
        title: "Cordless lamp riser",
        project_type: "simple_shelf",
        width_inches: 14,
        height_inches: 3,
        depth_inches: 10,
        material_thickness_inches: 0.75,
        material_type: "pine board",
        intended_use: "Freestanding cordless lamp riser for a bookshelf with no wall mounting.",
      }),
    );

    expect(draft.hardware.map((item) => item.id)).not.toContain("wall_brackets");
    expect(draft.connections).toHaveLength(0);
    expect(draft.operations.map((operation) => operation.id)).toContain("confirm_shelf_dimensions");
    expect(draft.safety.flags.map((flag) => flag.category)).not.toContain("wall_mounting");
  });

  it("scaffolds planter box panels with drainage and outdoor exposure review", () => {
    const draft = draftFor(
      project({
        project_type: "planter_box",
        width_inches: 24,
        height_inches: 8,
        depth_inches: 8,
        material_thickness_inches: 0.75,
        material_type: "cedar board",
        intended_use: "Outdoor herb planter",
      }),
    );

    expect(draft.pieces.map((piece) => piece.id)).toEqual(
      expect.arrayContaining(["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"]),
    );
    expect(draft.operations.map((operation) => operation.id)).toContain("drill_drainage_holes");
    expect(draft.safety.flags.map((flag) => flag.category)).toContain("outdoor_exposure");
    expect(draft.exportReadiness.pdfCandidate).toBe(true);
    expect(draft.exportReadiness.svgCandidate).toBe(false);
  });

  it("keeps missing dimensions nullable and creates unresolved questions", () => {
    const draft = draftFor(
      project({
        project_type: "planter_box",
        width_inches: null,
        depth_inches: null,
        material_thickness_inches: null,
        material_type: "unknown material",
      }),
    );

    expect(draft.dimensions.widthInches).toBeNull();
    expect(draft.dimensions.depthInches).toBeNull();
    expect(draft.dimensions.materialThicknessInches).toBeNull();
    expect(draft.unresolvedQuestions).toEqual(
      expect.arrayContaining([
        "What is the finished project width?",
        "What is the finished project depth?",
        "What material thickness should be used?",
      ]),
    );
    expect(draft.safety.flags.map((flag) => flag.category)).toContain("missing_material_thickness");
    expect(draft.confidence.level).toBe("low");
  });

  it("uses stable snake_case ids", () => {
    expect(toStableSnakeCaseId(" 3/4 inch Pine Board! ")).toBe("item_3_4_inch_pine_board");

    const draft = draftFor(project({ project_type: "simple_shelf", material_type: "3/4 inch Pine Board!" }));
    const ids = [
      ...draft.pieces.map((piece) => piece.id),
      ...draft.materials.map((material) => material.id),
      ...draft.hardware.map((item) => item.id),
      ...draft.connections.map((connection) => connection.id),
      ...draft.operations.map((operation) => operation.id),
      ...draft.safety.flags.map((flag) => flag.id),
    ];

    expect(ids.every((id) => /^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/.test(id))).toBe(true);
  });

  it("rejects unsupported project types", () => {
    const invalidProject = {
      ...project(),
      project_type: "table",
    } as unknown as BuildModelDraftProject;

    expect(() => createBuildModelDraft(invalidProject, undefined as never, [])).toThrow("Unsupported project type");
  });
});
