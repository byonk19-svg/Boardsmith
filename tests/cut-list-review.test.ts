import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { summarizeCutListReview } from "@/lib/plans/cut-list-review";
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
  materials: [{ name: "3/4 inch pine board", quantity: "1 board", notes: "Inspect before cutting." }],
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
  finishing_steps: ["Sand and finish according to product labels."],
  safety_notes: ["Plans are review aids."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

describe("summarizeCutListReview", () => {
  it("summarizes ready cuts with counts and measurement reminders", () => {
    const summary = summarizeCutListReview(shelfPlan, simpleShelfBuildModelFixture);

    expect(summary.totalPieces).toBe(2);
    expect(summary.piecesWithDimensions).toBe(2);
    expect(summary.piecesNeedingReview).toBe(0);
    expect(summary.items.map((item) => item.status)).toEqual(["ready_to_review", "ready_to_review"]);
    expect(summary.reviewNotes).toEqual(
      expect.arrayContaining([
        "Measure twice before cutting.",
        "Verify all dimensions against your actual space, lumber, and hardware.",
        "This is a planning aid, not a production cut file.",
      ]),
    );
  });

  it("flags missing dimensions, quantity issues, and possible duplicate-looking entries", () => {
    const incompleteModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      pieces: [
        {
          ...simpleShelfBuildModelFixture.pieces[0],
          id: "blank_piece",
          label: " ",
          quantity: 0,
          dimensions: { lengthInches: null, widthInches: 10, thicknessInches: null },
        },
      ],
    };
    const duplicatePlan: GeneratedPlan = {
      ...shelfPlan,
      cut_list: [
        shelfPlan.cut_list[0],
        { ...shelfPlan.cut_list[0], quantity: 24, notes: "Same size and material; confirm whether this is a separate piece." },
      ],
    };

    const summary = summarizeCutListReview(duplicatePlan, incompleteModel);

    expect(summary.piecesNeedingReview).toBeGreaterThan(0);
    expect(summary.items.map((item) => item.status)).toEqual(expect.arrayContaining(["needs_measurement", "check_quantity", "possible_duplicate"]));
    expect(summary.warnings).toEqual(
      expect.arrayContaining([
        "A modeled piece needs a usable name before cutting.",
        "A modeled piece is missing length and thickness.",
        "A modeled piece has a quantity that needs review.",
        "Multiple cut-list entries look similar. Confirm whether they are separate pieces before cutting.",
      ]),
    );
  });

  it("warns when the generated cut list is empty but the plan has material and build-step context", () => {
    const summary = summarizeCutListReview({ ...shelfPlan, cut_list: [] }, simpleShelfBuildModelFixture);

    expect(summary.warnings).toContain("The generated cut list is empty even though the plan has materials or build steps.");
    expect(summary.piecesNeedingReview).toBeGreaterThan(0);
  });
});
