import { describe, expect, it } from "vitest";
import { createClarificationGateDecision, type ClarificationGateInput } from "@/lib/projects/clarification-gate";

function project(overrides: Partial<ClarificationGateInput> = {}): ClarificationGateInput {
  return {
    title: "Single bathroom wall shelf",
    project_type: "simple_shelf",
    skill_level: "beginner",
    width_inches: 24,
    height_inches: 0.75,
    depth_inches: 8,
    material_thickness_inches: 0.75,
    material_type: "pine board",
    shelf_layout: "single_shelf",
    shelf_count: 1,
    tools_available: ["tape_measure", "pencil", "drill", "circular_saw", "sander"],
    style_notes: "Use metal brackets screwed into studs and seal for bathroom humidity.",
    intended_use: "Wall mounted shelf for light towels and toiletries.",
    ...overrides,
  };
}

describe("createClarificationGateDecision", () => {
  it("marks supported wall shelves with enough detail as ready for full plan", () => {
    const decision = createClarificationGateDecision(project());

    expect(decision.status).toBe("ready_for_full_plan");
    expect(decision.statusLabel).toBe("Ready for full plan");
    expect(decision.canGenerateFullPlan).toBe(true);
    expect(decision.supportedProjectType).toBe(true);
    expect(decision.questions).toEqual([]);
  });

  it("asks for concrete missing dimensions, material, tools, and shelf layout details", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Multiple shelf bathroom storage",
        width_inches: 0,
        height_inches: 0,
        depth_inches: -1,
        material_thickness_inches: 0,
        material_type: "unknown",
        shelf_layout: undefined,
        shelf_count: undefined,
        tools_available: [],
        style_notes: "",
        intended_use: "Multiple shelves for bathroom towels.",
      }),
    );

    expect(decision.status).toBe("needs_details");
    expect(decision.canGenerateFullPlan).toBe(false);
    expect(decision.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining([
        "finished_width",
        "finished_height",
        "finished_depth",
        "material_thickness",
        "material_type",
        "shelf_count",
        "tools_available",
      ]),
    );
    expect(decision.questions.every((question) => question.question.length > 0 && question.reason.length > 0)).toBe(true);
  });

  it("distinguishes separate shelves from connected units when checking impossible height", () => {
    const separateShelves = createClarificationGateDecision(
      project({
        title: "Five separate bathroom wall shelves",
        height_inches: 0.75,
        shelf_layout: "multiple_separate_shelves",
        shelf_count: 5,
        style_notes: "Use individual metal brackets screwed into studs.",
        intended_use: "Five separate wall shelves for light towels.",
      }),
    );
    const connectedUnit = createClarificationGateDecision(
      project({
        title: "Five shelf bathroom unit",
        height_inches: 0.1,
        shelf_layout: "multi_shelf_unit",
        shelf_count: 5,
        style_notes: "Wall mounted.",
        intended_use: "Connected wall shelf unit for light towels.",
      }),
    );

    expect(separateShelves.questions.map((question) => question.id)).not.toContain("shelf_height_impossible");
    expect(connectedUnit.status).toBe("needs_details");
    expect(connectedUnit.questions.map((question) => question.id)).toContain("shelf_height_impossible");
  });

  it("asks for support or mounting details before connected shelf unit generation", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Connected bathroom shelf unit",
        height_inches: 60,
        shelf_layout: "multi_shelf_unit",
        shelf_count: 5,
        style_notes: "Wall mounted.",
        intended_use: "Connected wall shelf unit for light towels.",
      }),
    );

    expect(decision.status).toBe("needs_details");
    expect(decision.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining(["connected_shelf_support_incomplete", "mounting_support_method"]),
    );
  });

  it("asks for expected load/use and finish exposure details for risky wall shelves", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Outdoor wide porch shelf",
        width_inches: 42,
        depth_inches: 14,
        shelf_layout: "single_shelf",
        shelf_count: 1,
        style_notes: "Wall mounted with metal brackets screwed into studs.",
        intended_use: "Porch shelf.",
      }),
    );

    expect(decision.status).toBe("needs_details");
    expect(decision.reviewFlags.map((flag) => flag.code)).toEqual(expect.arrayContaining(["heavy_shelving", "outdoor_load_exposure"]));
    expect(decision.questions.map((question) => question.id)).toEqual(expect.arrayContaining(["expected_load_or_use", "finish_exposure"]));
    expect(decision.questions.find((question) => question.id === "finish_exposure")?.category).toBe("finish_exposure");
  });

  it("does not ask for finish exposure details when protective finish and fasteners are specified", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Outdoor wide porch shelf",
        width_inches: 42,
        depth_inches: 14,
        shelf_layout: "single_shelf",
        shelf_count: 1,
        style_notes: "Wall mounted with metal brackets screwed into studs, sealed with spar urethane, and installed with exterior screws.",
        intended_use: "Porch shelf for light decor.",
      }),
    );

    expect(decision.questions.map((question) => question.id)).not.toContain("finish_exposure");
  });

  it("asks child-adjacent and electrical clarification questions without making approval claims", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Toddler book ledge with LED strip",
        width_inches: 24,
        height_inches: 4,
        depth_inches: 4,
        style_notes: "Wall mounted book ledge with a battery LED strip.",
        intended_use: "Nursery reading corner for toddler books.",
      }),
    );

    expect(decision.status).toBe("needs_details");
    expect(decision.reviewFlags.map((flag) => flag.code)).toEqual(
      expect.arrayContaining(["child_or_baby_use", "electrical_or_lighted"]),
    );
    expect(decision.questions.map((question) => question.id)).toEqual(
      expect.arrayContaining(["child_adjacent_use", "electrical_scope"]),
    );
  });

  it("blocks high-risk seating, ladder, overhead, and child sleep projects", () => {
    const seating = createClarificationGateDecision(project({ title: "Entry bench", intended_use: "Small bench for sitting." }));
    const ladder = createClarificationGateDecision(project({ title: "Step ladder", intended_use: "Small ladder platform for reaching shelves." }));
    const overhead = createClarificationGateDecision(project({ title: "Overhead garage storage", intended_use: "Suspended overhead storage rack." }));
    const crib = createClarificationGateDecision(project({ title: "Baby crib rail", intended_use: "Sleep surface for baby nursery." }));

    expect(seating.status).toBe("blocked_for_safety");
    expect(ladder.status).toBe("blocked_for_safety");
    expect(overhead.status).toBe("blocked_for_safety");
    expect(crib.status).toBe("blocked_for_safety");
    expect([seating, ladder, overhead, crib].every((decision) => !decision.canGenerateFullPlan)).toBe(true);
  });

  it("blocks high-risk unsupported woodworking-adjacent ideas instead of treating them as concept only", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Loft bed with bookshelf stairs",
        project_type: "bookcase",
        intended_use: "A loft bed with storage stairs for a child's bedroom.",
      }),
    );

    expect(decision.status).toBe("blocked_for_safety");
    expect(decision.supportedProjectType).toBe(false);
    expect(decision.canGenerateFullPlan).toBe(false);
    expect(decision.blockers.map((blocker) => blocker.id)).toContain("child_sleep_or_entrapment_risk");
  });

  it("keeps unsupported woodworking-adjacent ideas at concept only", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Built-in bookcase",
        project_type: "bookcase",
        intended_use: "Large built-in bookcase for living room storage.",
      }),
    );

    expect(decision.status).toBe("concept_only");
    expect(decision.statusLabel).toBe("Concept only");
    expect(decision.supportedProjectType).toBe(false);
    expect(decision.canGenerateFullPlan).toBe(false);
  });

  it("marks unrelated unsupported ideas as unsupported", () => {
    const decision = createClarificationGateDecision(
      project({
        title: "Replace a bicycle chain",
        project_type: "bike_repair",
        intended_use: "Fix a bicycle drivetrain.",
        style_notes: "",
      }),
    );

    expect(decision.status).toBe("unsupported");
    expect(decision.statusLabel).toBe("Unsupported");
    expect(decision.canGenerateFullPlan).toBe(false);
  });
});
