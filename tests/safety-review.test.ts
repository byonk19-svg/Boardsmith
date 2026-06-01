import { describe, expect, it } from "vitest";
import type { ProjectIntake } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";

const baseProject: ProjectIntake = {
  title: "Porch sign",
  project_type: "wood_sign",
  skill_level: "beginner",
  width_inches: 18,
  height_inches: 10,
  depth_inches: 0.75,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "sander"],
  style_notes: "",
  intended_use: "Indoor decoration",
};

describe("calculateSafetyReviewFlags", () => {
  it("flags wall-mounted projects", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      intended_use: "Wall mounted sign above a bench",
    });

    expect(flags.map((flag) => flag.code)).toContain("wall_mounting");
  });

  it("flags child and baby use", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      intended_use: "Nursery decoration for a baby room",
    });

    expect(flags.map((flag) => flag.code)).toContain("child_or_baby_use");
  });

  it("flags wall-mounted toddler book ledges for child, mounting, and shelf load review", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      title: "Simple toddler book ledge",
      project_type: "simple_shelf",
      width_inches: 24,
      height_inches: 4,
      depth_inches: 4,
      intended_use: "Wall-mounted toddler book ledge for nursery books in a reading corner.",
    });

    expect(flags.map((flag) => flag.code)).toEqual(expect.arrayContaining(["wall_mounting", "child_or_baby_use", "heavy_shelving"]));
  });

  it("flags wall-mounted shelves as wall-mounting review and heavy shelves by size", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      project_type: "simple_shelf",
      width_inches: 48,
      depth_inches: 14,
      intended_use: "Wall mounted bookshelf for heavy books",
    });

    expect(flags.map((flag) => flag.code)).toEqual(expect.arrayContaining(["wall_mounting", "heavy_shelving"]));
  });

  it("does not add wall-mounting review to explicit freestanding shelf-like risers", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      title: "Cordless lamp riser",
      project_type: "simple_shelf",
      width_inches: 14,
      height_inches: 3,
      depth_inches: 10,
      intended_use: "Freestanding cordless lamp riser for a bookshelf with no wall mounting.",
    });

    expect(flags.map((flag) => flag.code)).not.toContain("wall_mounting");
  });

  it("does not treat light weight use as electrical lighting", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      intended_use: "Decorative wall shelf for light objects only",
    });

    expect(flags.map((flag) => flag.code)).not.toContain("electrical_or_lighted");
  });

  it("flags missing material thickness and unclear dimensions", () => {
    const flags = calculateSafetyReviewFlags({
      ...baseProject,
      width_inches: 0,
      material_thickness_inches: 0,
    });

    expect(flags.map((flag) => flag.code)).toEqual(expect.arrayContaining(["unclear_dimensions", "missing_material_thickness"]));
  });
});
