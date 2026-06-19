import { describe, expect, it } from "vitest";
import { createConceptBrief } from "@/lib/projects/concept-brief";

describe("concept brief", () => {
  it("creates bounded concept-only storage options without build packet content", () => {
    const brief = createConceptBrief({
      title: "Built-in bookcase",
      project_type: "bookcase",
      width_inches: 48,
      height_inches: 72,
      depth_inches: 12,
      material_thickness_inches: 0.75,
      material_type: "pine board",
      tools_available: ["tape_measure", "drill"],
      style_notes: "Living room storage wall.",
      intended_use: "Large built-in bookcase for living room storage.",
    });

    expect(brief.category).toBe("Storage concept");
    expect(brief.confirmedDimensions).toEqual([
      { label: "Width", value: "48 in" },
      { label: "Height", value: "72 in" },
      { label: "Depth", value: "12 in" },
      { label: "Material thickness", value: "0.75 in" },
    ]);
    expect(brief.options.map((option) => option.title)).toEqual([
      "Convert to a supported wall shelf",
      "Keep as freestanding storage notes",
    ]);
    expect(JSON.stringify(brief.options)).not.toMatch(/load rated|certified|vendor|price|cart|CAD-ready|CNC-ready|cut to|fasten with/i);
    expect(brief.whyNotFullPlan).toContain("without cut lists, build steps, packet diagrams");
  });

  it("does not invent dimensions when saved intake has none", () => {
    const brief = createConceptBrief({
      title: "Maybe a storage thing",
      project_type: "bookcase",
      width_inches: null,
      height_inches: null,
      depth_inches: null,
      material_thickness_inches: null,
      material_type: "",
      tools_available: [],
      style_notes: "",
      intended_use: "Maybe some shelves for a wall.",
    });

    expect(brief.confirmedDimensions).toEqual([]);
    expect(JSON.stringify(brief.confirmedDimensions)).not.toMatch(/\d+\s*in/);
  });
});
