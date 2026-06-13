import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createBuildModelDraft, type BuildModelDraftProject } from "@/lib/build-model/create-build-model-draft";
import { createBuildStepCards } from "@/lib/plans/build-step-cards";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { describe, expect, it } from "vitest";

const baseStep: GeneratedPlan["assembly_steps"][number] = {
  step_number: 1,
  title: "Review mounting",
  instructions: "Review wall structure, anchors, and fasteners before drilling.",
  tools_used: ["drill"],
  safety_note: "Do not rely on Boardsmith for load ratings.",
  estimated_time_minutes: 15,
};

const baseDraftProject: BuildModelDraftProject = {
  id: "step_card_dogfood",
  title: "Step card dogfood",
  project_type: "simple_shelf",
  skill_level: "beginner",
  width_inches: 32,
  height_inches: 5,
  depth_inches: 6,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill", "miter_saw", "sander"],
  style_notes: "",
  intended_use: "Dogfood planning aid.",
};

describe("createBuildStepCards", () => {
  it("creates beginner-friendly cards with deterministic operation, phase, piece, time, tool, and safety data", () => {
    const cards = createBuildStepCards([baseStep], simpleShelfBuildModelFixture);

    expect(cards[0]).toMatchObject({
      stepNumber: 1,
      title: "Review mounting",
      instructions: "Review wall structure, anchors, and fasteners before drilling.",
      phaseLabel: "Inspect / review",
      tools: ["Drill"],
      estimatedTimeLabel: "15 min",
      safetyNote: "Do not rely on Boardsmith for load ratings.",
      relatedOperationTitle: "Inspect mounting location",
      relatedPieceLabels: ["Shelf board"],
    });
  });

  it("formats raw project tool identifiers as human-readable labels", () => {
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          tools_used: ["tape_measure", "circular_saw", "paint_brush"],
        },
      ],
      simpleShelfBuildModelFixture,
    );

    expect(cards[0]?.tools).toEqual(["Tape measure", "Circular saw", "Paint brush"]);
  });

  it("labels obvious build-model operation phases without relying on AI calls", () => {
    const cutModel: BoardsmithBuildModel = {
      ...simpleShelfBuildModelFixture,
      operations: [
        {
          ...simpleShelfBuildModelFixture.operations[0],
          operationType: "cut",
          title: "Cut shelf board",
          description: "Cut the shelf board to final length.",
          toolNames: ["miter saw"],
        },
      ],
    };
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          title: "Cut shelf board",
          instructions: "Cut the shelf board to the reviewed length.",
          tools_used: ["miter saw"],
          safety_note: null,
          estimated_time_minutes: null,
        },
      ],
      cutModel,
    );

    expect(cards[0]?.phaseLabel).toBe("Cut");
    expect(cards[0]?.estimatedTimeLabel).toBe("15 min");
    expect(cards[0]?.safetyNote).toBe("Do not mount or load shelf until hardware and wall structure are reviewed.");
  });

  it("falls back calmly for ambiguous steps without inventing modeled relationships", () => {
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          title: "Think through the plan",
          instructions: "Read the plan and pause if anything is unclear.",
          tools_used: ["pencil"],
          safety_note: null,
          estimated_time_minutes: null,
        },
      ],
      { ...simpleShelfBuildModelFixture, operations: [] },
    );

    expect(cards[0]?.phaseLabel).toBe("Build step");
    expect(cards[0]?.relatedOperationTitle).toBeNull();
    expect(cards[0]?.relatedPieceLabels).toEqual([]);
    expect(cards[0]?.estimatedTimeLabel).toBeNull();
    expect(cards[0]?.safetyNote).toBeNull();
  });

  it("does not match unrelated operations from sequence number and tool overlap alone", () => {
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          title: "Gather materials",
          instructions: "Gather boards, fasteners, and notes before starting.",
          tools_used: ["tape measure"],
          safety_note: null,
          estimated_time_minutes: null,
        },
      ],
      simpleShelfBuildModelFixture,
    );

    expect(cards[0]?.relatedOperationTitle).toBeNull();
    expect(cards[0]?.relatedPieceLabels).toEqual([]);
  });

  it("labels attach-with-screws steps as fastening when no operation match exists", () => {
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          title: "Attach the front lip",
          instructions: "Attach the front lip with screws after a dry fit.",
          tools_used: ["drill"],
          safety_note: null,
          estimated_time_minutes: null,
        },
      ],
      { ...simpleShelfBuildModelFixture, operations: [] },
    );

    expect(cards[0]?.phaseLabel).toBe("Fasten");
    expect(cards[0]?.relatedOperationTitle).toBeNull();
  });

  it("keeps book ledge related pieces useful when a multi-piece operation is matched", () => {
    const bookLedgeModel = createBuildModelDraft({
      ...baseDraftProject,
      title: "Toddler book ledge",
      style_notes: "Book ledge with bottom shelf board, back rail, and front lip.",
      intended_use: "Child-adjacent book ledge with adult review.",
    });
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          step_number: 3,
          title: "Attach the front lip and back rail",
          instructions: "Dry fit, clamp, then attach the rails with screws after checking screw length.",
          tools_used: ["drill", "clamps"],
          safety_note: "Boardsmith does not certify child safety or load capacity.",
          estimated_time_minutes: 35,
        },
      ],
      bookLedgeModel,
    );

    expect(cards[0]?.phaseLabel).toBe("Assemble");
    expect(cards[0]?.relatedOperationTitle).toBe("Assemble book ledge");
    expect(cards[0]?.relatedPieceLabels).toEqual(["Bottom shelf board", "Back rail", "Front lip"]);
  });

  it("labels planter drainage and finish steps from modeled operations", () => {
    const planterModel = createBuildModelDraft({
      ...baseDraftProject,
      title: "Outdoor herb planter",
      project_type: "planter_box",
      height_inches: 8,
      depth_inches: 8,
      material_type: "cedar board",
      intended_use: "Outdoor herb planter with drainage and finish review.",
    });
    const cards = createBuildStepCards(
      [
        {
          ...baseStep,
          title: "Drill drainage holes",
          instructions: "Mark and drill drainage holes in the bottom panel before assembly.",
          tools_used: ["drill", "pencil"],
          safety_note: "Clamp work before drilling.",
          estimated_time_minutes: 15,
        },
        {
          ...baseStep,
          step_number: 2,
          title: "Apply exterior finish",
          instructions: "Apply an outdoor finish only after reviewing product labels.",
          tools_used: ["paint brush"],
          safety_note: "Use finishes in a ventilated area.",
          estimated_time_minutes: 40,
        },
      ],
      planterModel,
    );

    expect(cards[0]?.phaseLabel).toBe("Drill");
    expect(cards[0]?.relatedPieceLabels).toEqual(["Bottom panel"]);
    expect(cards[1]?.phaseLabel).toBe("Finish");
    expect(cards[1]?.relatedPieceLabels).toEqual(["Front panel", "Back panel", "Left side panel", "Right side panel", "Bottom panel"]);
  });

  it("formats longer estimates for compact card metadata", () => {
    const cards = createBuildStepCards([{ ...baseStep, estimated_time_minutes: 75 }], simpleShelfBuildModelFixture);

    expect(cards[0]?.estimatedTimeLabel).toBe("1 hr 15 min");
  });
});
