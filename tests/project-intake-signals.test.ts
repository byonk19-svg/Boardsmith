import { describe, expect, it } from "vitest";
import { extractProjectIntakeSignals } from "@/lib/projects/project-intake-signals";

describe("extractProjectIntakeSignals", () => {
  it("extracts structured mounting, load, support, and finish signals from managed intake text", () => {
    const signals = extractProjectIntakeSignals({
      intended_use: [
        "Bathroom shelf for towels.",
        "Structured intake",
        "- Mounting method: Visible L brackets",
        "- Wall type: Drywall with wood studs",
        "- Stud access: Yes, studs can be used",
        "- What it will hold: Towels",
        "- Moisture exposure: Bathroom/humid room",
        "- Install location: Above toilet",
        "- Planned mounting height: Around 60 in from floor.",
        "- Support/bracket count: 2",
        "- Higher-risk spot: Above a toilet, sink, or walkway",
        "- Nearby wall conditions or obstructions: Towel bar below shelf.",
      ].join("\n"),
      style_notes: [
        "Keep it simple.",
        "Planning preferences",
        "- Board size from store: 1x8 board",
        "- Cut plan: I need store-cut or pre-cut boards",
        "- Finish preference: Moisture-resistant paint.",
        "- Edge treatment: Rounded front corners.",
      ].join("\n"),
    });

    expect(signals).toMatchObject({
      mountingMethod: "Visible L brackets",
      wallType: "Drywall with wood studs",
      studAccess: "Yes, studs can be used",
      shelfLoad: "Towels",
      moistureExposure: "Bathroom/humid room",
      installLocation: "Above toilet",
      plannedMountingHeight: "Around 60 in from floor.",
      supportCount: "2",
      wallObstructions: "Towel bar below shelf.",
      boardSize: "1x8 board",
      cutPlan: "I need store-cut or pre-cut boards",
      finishPreference: "Moisture-resistant paint.",
      edgeTreatment: "Rounded front corners.",
    });
    expect(signals.higherRiskSpots).toEqual(["Above a toilet, sink, or walkway"]);
  });
});
