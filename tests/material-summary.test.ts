import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { summarizeMaterialReview } from "@/lib/plans/material-summary";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { describe, expect, it } from "vitest";

const shelfPlan: GeneratedPlan = {
  project_summary: "A cautious wall shelf plan.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 36,
    height_inches: 6,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [
    { name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." },
    { name: "Water-based paint", quantity: "1 small can", notes: "Optional finish after sanding." },
  ],
  tools: ["tape measure", "drill"],
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
      instructions: "Review wall structure before drilling.",
      tools_used: ["drill"],
      safety_note: "Do not rely on Boardsmith for load ratings.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and paint according to product labels."],
  safety_notes: ["Plans are review aids."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

describe("summarizeMaterialReview", () => {
  it("groups primary materials, hardware, finish supplies, and review notes from existing plan data", () => {
    const summary = summarizeMaterialReview(shelfPlan, simpleShelfBuildModelFixture);
    const primaryMaterial = summary.primaryMaterials.find((item) => item.label === "3/4 inch pine board");

    expect(primaryMaterial?.detail).toContain("1 planned piece");
    expect(primaryMaterial?.notes).toEqual(expect.arrayContaining(["Inspect for bowing before cutting.", "Plan material: 1 board. Inspect before cutting."]));
    expect(summary.hardwareFasteners.map((item) => item.label)).toEqual(["Wall brackets", "Wall anchors or stud fasteners"]);
    expect(summary.finishSupplies.map((item) => item.label)).toEqual(["Water-based paint"]);
    expect(summary.reviewNotes).toEqual(
      expect.arrayContaining([
        "Verify materials before purchasing or cutting.",
        "Quantity to review for Wall anchors or stud fasteners.",
        "Wall mounting and hardware details require review.",
      ]),
    );
  });

  it("shows calm review notes when material data is missing or vague", () => {
    const incompleteModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      materials: [],
      hardware: [],
      pieces: simpleShelfBuildModelFixture.pieces.map((piece) => ({ ...piece, materialId: null })),
      unresolvedQuestions: ["Material choice is unresolved."],
      confidence: {
        level: "low",
        reasons: ["Material details are incomplete."],
      },
    };

    const summary = summarizeMaterialReview({ ...shelfPlan, materials: [] }, incompleteModel);

    expect(summary.primaryMaterials).toEqual([]);
    expect(summary.hardwareFasteners).toEqual([]);
    expect(summary.finishSupplies).toEqual([]);
    expect(summary.reviewNotes).toEqual(
      expect.arrayContaining([
        "No primary material is modeled yet. Review the intake details before relying on this plan.",
        "Material choice is unresolved.",
        "Material details are incomplete.",
      ]),
    );
  });
});
