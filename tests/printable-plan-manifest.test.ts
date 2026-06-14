import { doorHangerBuildModelFixture, simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { describe, expect, it } from "vitest";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const project: Project = {
  id: "manifest_project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Manifest shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 36,
  height_inches: 6,
  depth_inches: 10,
  material_thickness_inches: 0.75,
  material_type: "3/4 inch pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted",
  intended_use: "Decorative wall shelf for light objects",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const shelfPlan: GeneratedPlan = {
  project_summary: "A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 36,
    height_inches: 6,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." }],
  tools: ["tape measure", "pencil", "drill"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 36,
      width_inches: 10,
      thickness_inches: 0.75,
      material: "pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review mounting",
      instructions: "Review wall structure, anchors, and fasteners before drilling.",
      tools_used: ["drill"],
      safety_note: "Do not rely on Boardsmith for load ratings.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and finish according to product labels."],
  safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

const planRecord: GeneratedProjectPlanRecord = {
  id: "manifest_plan",
  project_id: project.id,
  created_at: new Date(1).toISOString(),
  model_name: "test-model",
  plan_json: shelfPlan,
  build_model_json: simpleShelfBuildModelFixture,
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: shelfPlan.safety_notes,
  assumptions: shelfPlan.assumptions,
  confidence_level: shelfPlan.confidence_level,
  is_latest: true,
};

function manifestFor(params: {
  planRecord?: GeneratedProjectPlanRecord | null;
  buildModel?: BoardsmithBuildModel;
  buildModelSource?: "saved" | "derived";
}) {
  return createPrintablePlanManifest({
    project,
    planRecord: "planRecord" in params ? (params.planRecord ?? null) : planRecord,
    buildModel: params.buildModel ?? simpleShelfBuildModelFixture,
    buildModelSource: params.buildModelSource ?? "saved",
  });
}

describe("createPrintablePlanManifest", () => {
  it("collects project, plan, build model, review, materials, cut list, and disclaimers into a stable structure", () => {
    const manifest = manifestFor({});

    expect(manifest.manifestVersion).toBe("1.0");
    expect(manifest.project.title).toBe("Manifest shelf");
    expect(manifest.project.intake.material).toBe("3/4 inch pine board, 0.75 in thick");
    expect(manifest.generatedPlan?.id).toBe("manifest_plan");
    expect(manifest.buildModel.source).toBe("saved");
    expect(manifest.materials.primaryMaterials[0]?.label).toBe("3/4 inch pine board");
    expect(manifest.cutList?.totalPieces).toBe(1);
    expect(manifest.planReview?.manualReviewRequired).toBe(true);
    expect(manifest.exportReadiness?.status).toBe("needs_review");
    expect(manifest.sections.buildSteps[0]?.title).toBe("Review mounting");
    expect(manifest.buildStepCards[0]).toMatchObject({
      title: "Review mounting",
      phaseLabel: "Inspect / review",
      tools: ["Drill"],
      estimatedTimeLabel: "15 min",
      safetyNote: "Do not rely on Boardsmith for load ratings.",
      relatedOperationTitle: "Inspect mounting location",
      relatedPieceLabels: ["Shelf board"],
    });
    expect(manifest.actionChecklist).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "Review wall mounting details.",
          category: "mounting",
          priority: "required",
        }),
        expect.objectContaining({
          label: "Verify hardware and fasteners before assembly.",
          category: "hardware",
          priority: "recommended",
        }),
      ]),
    );
    expect(manifest.disclaimers).toEqual(
      expect.arrayContaining([
        "Boardsmith plans are planning aids, not professional engineering reviews.",
        "Verify dimensions, materials, hardware, tool setup, and site conditions before cutting or building.",
        "This MVP uses browser print only; no PDF or CAD download is generated.",
      ]),
    );
  });

  it("returns a no-plan manifest without pretending review summaries exist", () => {
    const manifest = manifestFor({ planRecord: null, buildModelSource: "derived" });

    expect(manifest.generatedPlan).toBeNull();
    expect(manifest.planReview).toBeNull();
    expect(manifest.exportReadiness).toBeNull();
    expect(manifest.cutList).toBeNull();
    expect(manifest.buildModel.source).toBe("derived");
    expect(manifest.futureExportNotes).toContain("Generate and validate a plan before using the browser-print build sheet.");
  });

  it("marks older plans without stored build model JSON as derived", () => {
    const manifest = manifestFor({
      planRecord: { ...planRecord, build_model_json: null },
      buildModelSource: "derived",
    });

    expect(manifest.buildModel.source).toBe("derived");
    expect(manifest.planReview?.warnings).toContain("Review uses a derived project structure because this plan version did not store a build model.");
    expect(manifest.exportReadiness?.warnings.map((warning) => warning.code)).toContain("derived_build_model");
  });

  it("surfaces missing material and incomplete cut-list signals through reused summaries", () => {
    const incompleteModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      materials: [],
      pieces: simpleShelfBuildModelFixture.pieces.map((piece) => ({
        ...piece,
        materialId: null,
        dimensions: { lengthInches: null, widthInches: piece.dimensions.widthInches, thicknessInches: null },
      })),
      unresolvedQuestions: ["Material choice is unresolved."],
    };
    const manifest = manifestFor({
      buildModel: incompleteModel,
      planRecord: { ...planRecord, plan_json: { ...shelfPlan, cut_list: [] } },
    });

    expect(manifest.materials.reviewNotes).toEqual(expect.arrayContaining(["No primary material is modeled yet. Review the intake details before relying on this plan."]));
    expect(manifest.cutList?.warnings).toContain("The generated cut list is empty even though the plan has materials or build steps.");
    expect(manifest.exportReadiness?.status).toBe("not_ready");
  });

  it("normalizes stale connected shelf unit support hardware as quantity-to-review", () => {
    const staleMultiShelfModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
      hardware: simpleShelfBuildModelFixture.hardware.map((item) => (item.id === "wall_brackets" ? { ...item, quantity: 2 } : item)),
    };
    const manifest = createPrintablePlanManifest({
      project: {
        ...project,
        shelf_layout: "multi_shelf_unit",
        shelf_count: 5,
        shelf_spacing_inches: 12,
      },
      planRecord: {
        ...planRecord,
        plan_json: {
          ...planRecord.plan_json,
          assumptions: ["The shelf is freestanding; no wall mounting or brackets are included or assumed."],
          safety_notes: ["Boardsmith cannot verify wall structure, anchors, fasteners, or load capacity as the design is freestanding."],
        },
      },
      buildModel: staleMultiShelfModel,
      buildModelSource: "saved",
    });

    expect(manifest.materials.hardwareFasteners).toContainEqual(
      expect.objectContaining({
        label: "Support method to review",
        detail: "quantity to review - bracket - required",
      }),
    );
    expect(manifest.cutList?.items).toContainEqual(
      expect.objectContaining({
        label: "Side support/frame placeholders",
        status: "needs_measurement",
      }),
    );
    expect(manifest.sections.safetyFlags).toContainEqual(
      expect.objectContaining({
        id: "connected_shelf_support_incomplete",
        message: "Shelf support/frame review",
      }),
    );
    expect(manifest.generatedPlan?.summary).toContain("needs support/frame review");
    expect(manifest.generatedPlan?.summary).not.toMatch(/freestanding/i);
    expect(manifest.buildStepCards[0]?.title).not.toMatch(/freestanding/i);
    expect(manifest.materials.reviewNotes.join(" ")).not.toMatch(/freestanding|non-mounted/i);
    expect(manifest.sections.safetyNotes.join(" ")).not.toMatch(/freestanding|non-mounted/i);
    expect(manifest.sections.assumptions.join(" ")).not.toMatch(/freestanding|non-mounted/i);
    expect(manifest.planningDiagrams.diagrams[0]?.title).toBe("Shelf layout overview");
  });

  it("uses safe intake labels for stale impossible multi-shelf dimensions", () => {
    const manifest = createPrintablePlanManifest({
      project: {
        ...project,
        title: "Bathroom shelf with 5 shelves",
        width_inches: 23,
        height_inches: 0.1,
        depth_inches: 8,
        material_thickness_inches: 0.75,
        shelf_layout: "multi_shelf_unit",
        shelf_count: 5,
        intended_use: "Indoor bathroom shelf unit.",
        style_notes: "",
      },
      planRecord,
      buildModel: {
        ...simpleShelfBuildModelFixture,
        dimensions: {
          ...simpleShelfBuildModelFixture.dimensions,
          widthInches: 23,
          heightInches: 0.1,
          depthInches: 8,
        },
        pieces: [{ ...simpleShelfBuildModelFixture.pieces[0], label: "Shelf boards", quantity: 5 }],
      },
      buildModelSource: "saved",
    });

    expect(manifest.project.intake.dimensions).toBe("23 x total height needs review x 8 in");
    expect(manifest.project.intake.dimensionFacts).toContainEqual({
      label: "Total project height",
      value: "Total height needs review",
    });
    expect(manifest.planningDiagrams.projectAnatomy.heightLabel).toBe("Total height needs review");
    expect(manifest.cutList?.items).toContainEqual(
      expect.objectContaining({
        label: "Side support/frame placeholders",
        dimensionsLabel: "missing x 8 in x 0.75 in",
      }),
    );
    expect(manifest.sections.safetyFlags).toContainEqual(
      expect.objectContaining({
        id: "shelf_height_impossible",
        message: "Impossible or missing shelf layout dimensions",
      }),
    );
  });

  it("preserves export-readiness status when a plan is ready for future output review", () => {
    const readyModel: BoardsmithBuildModel = {
      ...doorHangerBuildModelFixture,
      unresolvedQuestions: [],
      exportReadiness: {
        ...doorHangerBuildModelFixture.exportReadiness,
        dxfCandidate: true,
      },
      confidence: {
        level: "high",
        reasons: ["Dimensions and material choices are known for review."],
      },
    };
    const readyPlan: GeneratedPlan = {
      ...shelfPlan,
      project_type: "door_hanger",
      dimensions: {
        width_inches: 18,
        height_inches: 18,
        depth_inches: 0,
        material_thickness_inches: 0.25,
      },
      materials: [{ name: "1/4 inch plywood", quantity: "1 panel", notes: "Inspect before cutting." }],
      cut_list: [
        {
          part_name: "Round backer panel",
          quantity: 1,
          length_inches: 18,
          width_inches: 18,
          thickness_inches: 0.25,
          material: "1/4 inch plywood",
          notes: "Decorative flat backer only.",
        },
      ],
      safety_notes: ["Plans are review aids.", "Verify hanger attachment manually before use."],
      needs_review_flags: [],
      svg_readiness_notes: ["Closed outline can become an SVG candidate later."],
      confidence_level: "high",
    };

    const manifest = createPrintablePlanManifest({
      project: { ...project, project_type: "door_hanger" },
      planRecord: { ...planRecord, plan_json: readyPlan, build_model_json: readyModel, confidence_level: "high" },
      buildModel: readyModel,
      buildModelSource: "saved",
    });

    expect(manifest.exportReadiness?.status).toBe("ready");
    expect(manifest.futureExportNotes).toContain("Future output candidates for later review: SVG, PDF, DXF.");
  });
});
