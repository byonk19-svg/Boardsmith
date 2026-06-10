import { describe, expect, it } from "vitest";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { doorHangerBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { summarizeExportReadiness } from "@/lib/plans/export-readiness";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

const exportFriendlyPlan: GeneratedPlan = {
  project_summary: "A decorative door hanger plan with a known panel outline and review before building.",
  project_type: "door_hanger",
  dimensions: {
    width_inches: 18,
    height_inches: 18,
    depth_inches: 0,
    material_thickness_inches: 0.25,
  },
  materials: [{ name: "1/4 inch plywood", quantity: "1 panel", notes: "Inspect before cutting." }],
  tools: ["jigsaw", "sander"],
  cut_list: [
    {
      part_name: "Round backer panel",
      quantity: 1,
      length_inches: 18,
      width_inches: 18,
      thickness_inches: 0.25,
      material: "1/4 inch plywood",
      notes: "Decorative outline only.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Cut backer",
      instructions: "Cut the marked backer panel and review the hanger before use.",
      tools_used: ["jigsaw"],
      safety_note: "Wear eye protection and follow the tool manual.",
      estimated_time_minutes: 20,
    },
  ],
  finishing_steps: ["Sand edges and finish according to product labels."],
  safety_notes: ["Boardsmith plans are review aids."],
  assumptions: ["Decorative indoor use only."],
  needs_review_flags: [],
  beginner_tips: ["Clamp work before cutting."],
  svg_readiness_notes: ["Closed outline can become an SVG candidate later."],
  estimated_difficulty: "easy",
  estimated_time: "1 hour",
  confidence_level: "medium",
};

describe("export readiness summary", () => {
  it("reports ready when the saved build model has pieces, dimensions, materials, operations, and future output candidates", () => {
    const readyBuildModel: BoardsmithBuildModel = {
      ...doorHangerBuildModelFixture,
      unresolvedQuestions: [],
      confidence: {
        ...doorHangerBuildModelFixture.confidence,
        reasons: ["Dimensions, material, operations, and outline are known enough for future output review."],
      },
    };

    const summary = summarizeExportReadiness(exportFriendlyPlan, readyBuildModel, { buildModelSource: "saved" });

    expect(summary.status).toBe("ready");
    expect(summary.blockingIssueCount).toBe(0);
    expect(summary.warningCount).toBe(0);
    expect(summary.topMessages).toContain("Looks ready for future output review.");
    expect(summary.exportCandidates).toEqual(["SVG", "PDF"]);
  });

  it("reports needs review when a derived build model is used or confidence is limited", () => {
    const summary = summarizeExportReadiness(exportFriendlyPlan, simpleShelfBuildModelFixture, { buildModelSource: "derived" });

    expect(summary.status).toBe("needs_review");
    expect(summary.blockingIssueCount).toBe(0);
    expect(summary.warnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: "derived_build_model" }),
        expect.objectContaining({ code: "low_build_model_confidence" }),
      ]),
    );
  });

  it("reports not ready when required structure is missing without assumptions", () => {
    const incompleteModel: BoardsmithBuildModel = {
      ...doorHangerBuildModelFixture,
      pieces: [
        {
          ...doorHangerBuildModelFixture.pieces[0],
          label: " ",
          dimensions: {
            lengthInches: null,
            widthInches: null,
            thicknessInches: null,
          },
        },
      ],
      materials: [],
      operations: [],
      assumptions: [],
      unresolvedQuestions: [],
      exportReadiness: {
        svgCandidate: false,
        pdfCandidate: false,
        dxfCandidate: false,
        cadCandidate: false,
        notes: [],
      },
    };

    const summary = summarizeExportReadiness(exportFriendlyPlan, incompleteModel, { buildModelSource: "saved" });

    expect(summary.status).toBe("not_ready");
    expect(summary.blockingIssues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["piece_name_missing", "piece_dimensions_missing", "materials_missing", "operations_missing"]),
    );
  });
});
