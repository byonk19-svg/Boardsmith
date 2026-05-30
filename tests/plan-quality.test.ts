import { describe, expect, it } from "vitest";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { assertGeneratedPlanQuality, evaluateGeneratedPlanQuality } from "@/lib/plans/plan-quality";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

const compatibleShelfPlan: GeneratedPlan = {
  project_summary: "A cautious wall shelf plan sized from the submitted dimensions with manual mounting review before use.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 36,
    height_inches: 6,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [
    {
      name: "3/4 inch pine board",
      quantity: "1 board",
      notes: "Inspect for bowing before cutting.",
    },
  ],
  tools: ["tape measure", "pencil", "drill", "sander"],
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
      title: "Review mounting location",
      instructions: "Find wall structure and review bracket, anchor, and fastener suitability before drilling.",
      tools_used: ["tape measure", "drill"],
      safety_note: "Do not mount or load the shelf until wall structure and hardware are reviewed.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand edges and apply finish according to the product label."],
  safety_notes: [
    "Plans are review aids and require builder review before cutting.",
    "Wall mounting requires fastener, anchor, and stud review.",
    "Boardsmith cannot verify load capacity.",
  ],
  assumptions: ["Light decorative use unless reviewed by the builder."],
  needs_review_flags: ["Wall mounting requires fastener, anchor, and stud review.", "Boardsmith cannot verify load capacity."],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["This shelf is not SVG-ready because mounting geometry is unresolved."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

describe("generated plan quality checks", () => {
  it("accepts a plan aligned with the build model", () => {
    expect(() => assertGeneratedPlanQuality(compatibleShelfPlan, simpleShelfBuildModelFixture)).not.toThrow();
  });

  it("flags dimensions that exceed the deterministic build model", () => {
    const oversizedPlan = {
      ...compatibleShelfPlan,
      dimensions: {
        ...compatibleShelfPlan.dimensions,
        width_inches: 48,
      },
    };

    expect(evaluateGeneratedPlanQuality(oversizedPlan, simpleShelfBuildModelFixture)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "dimension_exceeds_build_model" })]),
    );
  });

  it("requires deterministic review flags to survive generation", () => {
    const missingFlagsPlan = {
      ...compatibleShelfPlan,
      needs_review_flags: [],
      safety_notes: ["Plans are review aids and require builder review before cutting.", "Wear PPE and follow tool manuals."],
    };

    const issueCodes = evaluateGeneratedPlanQuality(missingFlagsPlan, simpleShelfBuildModelFixture).map((issue) => issue.code);

    expect(issueCodes).toEqual(expect.arrayContaining(["missing_review_flags", "missing_deterministic_review_flag"]));
  });

  it("rejects load or safety guarantees", () => {
    const overclaimPlan = {
      ...compatibleShelfPlan,
      project_summary: "A wall shelf plan guaranteed for safe load capacity when assembled as written.",
    };

    expect(evaluateGeneratedPlanQuality(overclaimPlan, simpleShelfBuildModelFixture)).toEqual(
      expect.arrayContaining([expect.objectContaining({ code: "unsafe_safety_overclaim" })]),
    );
  });
});
