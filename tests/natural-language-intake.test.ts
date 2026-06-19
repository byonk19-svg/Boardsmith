import { describe, expect, it } from "vitest";
import { parseNaturalLanguageIntake } from "@/lib/projects/natural-language-intake";

describe("natural-language intake drafting", () => {
  it("turns a clear wall shelf idea into conservative editable intake fields", () => {
    const result = parseNaturalLanguageIntake(
      "Bathroom wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board, drill and sander available, towels only, mount into studs if possible, painted finish.",
    );

    expect(result.draft).toMatchObject({
      title: "Bathroom wall shelf",
      project_type: "simple_shelf",
      width_inches: "24",
      depth_inches: "8",
      height_inches: "6",
      material_thickness_inches: "0.75",
      material_type: "0.75 inch pine board",
      shelf_layout: "single_shelf",
      shelf_count: "1",
      mounting_method: "not_sure",
      wall_type: "not_sure",
      stud_access: "yes",
      shelf_load: "towels",
      moisture_exposure: "bathroom_humid",
      board_size: "one_by_eight",
      finish_preference: "Painted finish.",
    });
    expect(result.draft.tools_available).toEqual(["drill", "safety_glasses", "sander"]);
    expect(result.draft.higher_risk_spots).toContain("near_water_shower_or_tub");
    expect(result.missingFields).not.toContain("project_type");
    expect(result.missingFields).not.toContain("dimensions");
    expect(result.reviewNotes).toContain("Mounting, wall type, and stud access still need confirmation.");
  });

  it("infers separate shelves, support count, store-cut preference, and heavy-load review", () => {
    const result = parseNaturalLanguageIntake(
      "Two shelves for books on drywall with visible brackets, 30 inches wide, 10 inches deep, 3/4 inch oak, two brackets, store cut boards.",
    );

    expect(result.draft).toMatchObject({
      title: "Wall shelf",
      project_type: "simple_shelf",
      width_inches: "30",
      depth_inches: "10",
      material_thickness_inches: "0.75",
      material_type: "0.75 inch oak board",
      shelf_layout: "multiple_separate_shelves",
      shelf_count: "2",
      mounting_method: "visible_l_brackets",
      wall_type: "drywall_studs_unknown",
      stud_access: "not_sure",
      shelf_load: "books_heavy_items",
      support_count: "two",
      cut_strategy: "store_cut_or_precut",
      board_size: "one_by_ten",
    });
    expect(result.draft.higher_risk_spots).toContain("holding_breakable_or_heavy_items");
  });

  it("flags unsupported safety-sensitive ideas without inventing approval", () => {
    const result = parseNaturalLanguageIntake("Child loft bed platform with ladder and storage stairs for a nursery.");

    expect(result.status).toBe("blocked_for_safety");
    expect(result.draft.title).toBe("Project idea");
    expect(result.draft.project_type).toBe("");
    expect(result.blockedReasons).toEqual(["child_sleep_or_entrapment", "load_bearing_or_climbable"]);
    expect(result.reviewNotes).toContain("This idea includes safety-sensitive terms that may block plan generation.");
    expect(result.missingFields).toContain("project_type");
  });

  it("keeps built-in bookcase cabinet ideas unsupported instead of defaulting them to wall shelves", () => {
    const result = parseNaturalLanguageIntake(
      "Built-in bookcase cabinets around a fireplace, 84 x 12 x 96 inches, 3/4 inch plywood, drill and sander available.",
    );

    expect(result.status).toBe("concept_only");
    expect(result.draft.title).toBe("Bookcase concept");
    expect(result.draft.project_type).toBe("");
    expect(result.draft.shelf_layout).toBe("");
    expect(result.draft.width_inches).toBe("84");
    expect(result.draft.depth_inches).toBe("12");
    expect(result.draft.height_inches).toBe("96");
    expect(result.blockedReasons).toEqual([]);
    expect(result.missingFields).toContain("project_type");
    expect(result.reviewNotes).toContain(
      "This looks woodworking-adjacent, but it is not a supported build-packet template yet. Choose a supported project type or keep it as concept review.",
    );
    expect(result.reviewNotes).toContain("Project type could not be inferred confidently.");
    expect(result.reviewNotes).not.toContain("Mounting, wall type, and stud access still need confirmation.");
  });

  it("marks unrelated non-woodworking ideas unsupported without forcing a concept brief", () => {
    const result = parseNaturalLanguageIntake("Replace a bicycle chain and adjust the rear derailleur.");

    expect(result.status).toBe("unsupported");
    expect(result.draft.project_type).toBe("");
    expect(result.missingFields).toContain("project_type");
    expect(result.reviewNotes).toContain("This does not match the current woodworking planning templates. Choose a supported project type only if the idea can honestly fit one.");
    expect(result.reviewNotes).not.toContain("woodworking-adjacent");
  });
});
