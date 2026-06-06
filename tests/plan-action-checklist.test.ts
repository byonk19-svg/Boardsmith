import { simpleShelfBuildModelFixture, woodSignBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createPlanActionChecklist } from "@/lib/plans/plan-action-checklist";
import { summarizeCutListReview } from "@/lib/plans/cut-list-review";
import { summarizeMaterialReview } from "@/lib/plans/material-summary";
import { summarizeGeneratedPlanReview } from "@/lib/plans/plan-quality";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { describe, expect, it } from "vitest";

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
      notes: "No safety approval is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review mounting",
      instructions: "Review wall structure, anchors, and fasteners before drilling.",
      tools_used: ["drill"],
      safety_note: "Review the plan before building.",
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

function checklistFor(plan: GeneratedPlan, buildModel: BoardsmithBuildModel = simpleShelfBuildModelFixture) {
  return createPlanActionChecklist({
    buildModel,
    materialReview: summarizeMaterialReview(plan, buildModel),
    cutListReview: summarizeCutListReview(plan, buildModel),
    planReview: summarizeGeneratedPlanReview(plan, buildModel, { buildModelSource: "saved" }),
  });
}

describe("createPlanActionChecklist", () => {
  it("builds prioritized review actions from safety, mounting, hardware, material, cut-list, and unresolved-question data", () => {
    const planWithCutIssue: GeneratedPlan = {
      ...shelfPlan,
      cut_list: [
        {
          ...shelfPlan.cut_list[0],
          length_inches: 0,
          notes: "Confirm final length before cutting.",
        },
      ],
    };

    const checklist = checklistFor(planWithCutIssue);

    expect(checklist.map((item) => item.id)).toEqual([
      "review_wall_mounting",
      "review_safety_flags",
      "resolve_open_questions",
      "check_cut_list_review_rows",
      "verify_hardware_fasteners",
      "review_material_assumptions",
    ]);
    expect(checklist[0]).toMatchObject({
      label: "Review wall mounting details.",
      category: "mounting",
      priority: "required",
    });
    expect(checklist).toContainEqual(
      expect.objectContaining({
        label: "Check cut-list rows marked as needing review.",
        detail: "1 cut-list row needs review before cutting.",
        category: "cuts",
        priority: "required",
      }),
    );
    expect(checklist).toContainEqual(
      expect.objectContaining({
        label: "Verify hardware and fasteners before assembly.",
        category: "hardware",
        priority: "recommended",
      }),
    );
  });

  it("adds material-thickness and child-adjacent actions only when those existing flags are present", () => {
    const flaggedModel: BoardsmithBuildModel = {
      ...woodSignBuildModelFixture,
      dimensions: {
        ...woodSignBuildModelFixture.dimensions,
        materialThicknessInches: null,
      },
      materials: woodSignBuildModelFixture.materials.map((material) => ({
        ...material,
        nominalThicknessInches: null,
      })),
      safety: {
        ...woodSignBuildModelFixture.safety,
        flags: [
          ...woodSignBuildModelFixture.safety.flags,
          {
            id: "child_adjacent_review",
            category: "child_use",
            severity: "high_review",
            message: "Child-adjacent use needs extra review.",
            recommendedAction: "Review edges, finish, hanging height, and supervision before use.",
          },
        ],
      },
    };

    const checklist = checklistFor({ ...shelfPlan, project_type: "wood_sign" }, flaggedModel);

    expect(checklist).toContainEqual(
      expect.objectContaining({
        id: "verify_material_thickness",
        label: "Verify material thickness against actual stock.",
        category: "materials",
        priority: "required",
      }),
    );
    expect(checklist).toContainEqual(
      expect.objectContaining({
        id: "review_safety_flags",
        label: "Review child-adjacent or load-related safety flags.",
        category: "safety",
        priority: "required",
      }),
    );
  });

  it("returns a calm default checklist when no specific review signals are present", () => {
    const lowIssueModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      hardware: [],
      connections: [],
      safety: {
        reviewRequired: false,
        flags: [],
        disclaimers: [],
      },
      unresolvedQuestions: [],
      assumptions: [],
      confidence: {
        level: "high",
        reasons: ["Dimensions and material are known for review."],
      },
    };
    const lowIssuePlan: GeneratedPlan = {
      ...shelfPlan,
      safety_notes: [],
      needs_review_flags: [],
      assumptions: [],
      svg_readiness_notes: [],
      cut_list: [
        {
          ...shelfPlan.cut_list[0],
          notes: "",
        },
      ],
      confidence_level: "high",
    };

    const checklist = checklistFor(lowIssuePlan, lowIssueModel);

    expect(checklist.map((item) => item.label)).toEqual([
      "Verify dimensions against the real space and material.",
      "Review tool safety and material condition.",
      "Dry fit before final assembly.",
      "Review before cutting or mounting.",
    ]);
    expect(new Set(checklist.map((item) => item.priority))).toEqual(new Set(["recommended"]));
  });
});
