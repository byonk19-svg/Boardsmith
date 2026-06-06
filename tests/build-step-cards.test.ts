import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
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

describe("createBuildStepCards", () => {
  it("creates beginner-friendly cards with deterministic operation, phase, piece, time, tool, and safety data", () => {
    const cards = createBuildStepCards([baseStep], simpleShelfBuildModelFixture);

    expect(cards[0]).toMatchObject({
      stepNumber: 1,
      title: "Review mounting",
      instructions: "Review wall structure, anchors, and fasteners before drilling.",
      phaseLabel: "Inspect / review",
      tools: ["drill"],
      estimatedTimeLabel: "15 min",
      safetyNote: "Do not rely on Boardsmith for load ratings.",
      relatedOperationTitle: "Inspect mounting location",
      relatedPieceLabels: ["Shelf board"],
    });
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

  it("formats longer estimates for compact card metadata", () => {
    const cards = createBuildStepCards([{ ...baseStep, estimated_time_minutes: 75 }], simpleShelfBuildModelFixture);

    expect(cards[0]?.estimatedTimeLabel).toBe("1 hr 15 min");
  });
});
