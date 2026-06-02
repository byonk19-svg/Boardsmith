import { describe, expect, it } from "vitest";
import { summarizeGeneratedPlanReview } from "@/lib/plans/plan-quality";
import { createPlanHistoryComparison } from "@/lib/plans/plan-comparison";
import { summarizeExportReadiness } from "@/lib/plans/export-readiness";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";

const olderPlan: GeneratedPlan = {
  project_summary: "A simple wall shelf plan for light decorative use with manual wall mounting review before building.",
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
      notes: "Main shelf board.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Mark the shelf board",
      instructions: "Mark the shelf board to the submitted dimensions before cutting.",
      tools_used: ["tape measure", "pencil"],
      safety_note: "Review measurements before cutting.",
      estimated_time_minutes: 10,
    },
  ],
  finishing_steps: ["Sand edges before finishing."],
  safety_notes: ["Plans are review aids.", "Wall mounting requires fastener, anchor, and stud review."],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["Mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

const latestPlan: GeneratedPlan = {
  ...olderPlan,
  project_summary: "A revised wall shelf plan with finish guidance and the same manual wall mounting review before building.",
  materials: [
    { name: "3/4 inch pine board", quantity: "1 straight board", notes: "Inspect for bowing before cutting." },
    { name: "Water-based finish", quantity: "1 small can", notes: "Use only after sanding and label review." },
  ],
  cut_list: [
    {
      ...olderPlan.cut_list[0],
      notes: "Main shelf board with finish sanding allowance reviewed.",
    },
    {
      part_name: "Test offcut",
      quantity: 1,
      length_inches: 6,
      width_inches: 2,
      thickness_inches: 0.75,
      material: "pine board",
      notes: "Use as a finish test piece before applying finish to the shelf.",
    },
  ],
  assembly_steps: [
    olderPlan.assembly_steps[0],
    {
      step_number: 2,
      title: "Test the finish",
      instructions: "Apply finish to a scrap piece before finishing the shelf board.",
      tools_used: ["brush"],
      safety_note: "Follow the finish label and ventilate the workspace.",
      estimated_time_minutes: 15,
    },
  ],
  safety_notes: [
    "Plans are review aids.",
    "Wall mounting requires fastener, anchor, and stud review.",
    "Boardsmith cannot verify load capacity.",
  ],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review.", "Boardsmith cannot verify load capacity."],
  confidence_level: "medium",
};

describe("createPlanHistoryComparison", () => {
  it("summarizes practical changes between a latest plan and an older version", () => {
    const comparison = createPlanHistoryComparison({
      latestPlan,
      comparedPlan: olderPlan,
      latestPlanReview: summarizeGeneratedPlanReview(latestPlan, simpleShelfBuildModelFixture),
      comparedPlanReview: summarizeGeneratedPlanReview(olderPlan, simpleShelfBuildModelFixture),
      latestExportReadiness: summarizeExportReadiness(latestPlan, simpleShelfBuildModelFixture),
      comparedExportReadiness: summarizeExportReadiness(olderPlan, simpleShelfBuildModelFixture),
    });

    expect(comparison.hasChanges).toBe(true);
    expect(comparison.summaryChanges).toContain("Project summary changed.");
    expect(comparison.materialChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "changed", label: "3/4 inch pine board" }),
        expect.objectContaining({ kind: "added", label: "Water-based finish" }),
      ]),
    );
    expect(comparison.cutListChanges).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ kind: "changed", label: "Shelf board" }),
        expect.objectContaining({ kind: "added", label: "Test offcut" }),
      ]),
    );
    expect(comparison.stepChanges).toEqual(expect.arrayContaining([expect.objectContaining({ kind: "added", label: "2. Test the finish" })]));
    expect(comparison.reviewChanges).toEqual(expect.arrayContaining([expect.objectContaining({ label: "Plan Review" })]));
  });

  it("returns calm no-change copy when compared plans are materially the same", () => {
    const comparison = createPlanHistoryComparison({
      latestPlan: olderPlan,
      comparedPlan: olderPlan,
    });

    expect(comparison.hasChanges).toBe(false);
    expect(comparison.summaryChanges).toContain("No practical plan differences found.");
    expect(comparison.materialChanges).toHaveLength(0);
    expect(comparison.cutListChanges).toHaveLength(0);
    expect(comparison.stepChanges).toHaveLength(0);
    expect(comparison.reviewChanges).toHaveLength(0);
  });
});
