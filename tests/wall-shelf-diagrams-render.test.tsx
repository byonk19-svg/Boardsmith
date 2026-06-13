import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { WallShelfDiagrams } from "@/app/projects/[id]/WallShelfDiagrams";
import type { WallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import { describe, expect, it } from "vitest";

const fiveShelfModel: WallShelfDiagramModel = {
  projectType: "simple_shelf",
  status: "ready",
  fallbackMessage: null,
  shelfLayout: "multi_shelf_unit",
  shelfCount: 5,
  shelfWidthInches: 12,
  shelfDepthInches: 6,
  boardThicknessInches: 0.75,
  totalProjectHeightInches: 60,
  shelfSpacingInches: 12,
  materialLabel: "3/4 in pine board",
  supportStatus: "support_to_review",
  supportLabel: "support method to verify",
  reviewItems: [
    "Each shelf needs a verified support method.",
    "Confirm bracket, cleat, side-support, or frame type.",
    "Confirm studs or anchors appropriate for wall type.",
    "Confirm hardware and expected load suitability before mounting.",
    "Confirm shelf spacing and placement before drilling.",
  ],
  partSchedule: [
    {
      label: "Shelf board",
      quantity: 5,
      dimensionsLabel: "12 in x 6 in x 0.75 in",
      materialLabel: "3/4 in pine board",
    },
  ],
};

describe("WallShelfDiagrams", () => {
  it("renders a 5-shelf front elevation, side view, part schedule, and mounting review", () => {
    const markup = renderToStaticMarkup(<WallShelfDiagrams model={fiveShelfModel} />);

    expect(markup).toContain("drawn from the saved measurements and cut list");
    expect(markup).toContain("Front elevation / shelf layout");
    expect(markup).toContain("overall layout area");
    expect(markup).toContain("5 shelf boards");
    expect(markup).toContain("12 in wide");
    expect(markup).toContain("60 in total height");
    expect(markup).toContain("12 in spacing");
    expect(markup).toContain("6 in from wall");
    expect(markup).toContain("0.75 in thick");
    expect(markup).toContain("Qty 5");
    expect(markup).toContain("Shelf board cut part planning graphic");
    expect(markup).toContain("12 in x 6 in x 0.75 in");
    expect(markup).toContain("Cut count is based on the physical cut-list quantity shown in the generated plan.");
    expect(markup).toContain("support method to verify");
    expect(markup).toContain("Each shelf needs a verified support method.");
    expect(markup).not.toContain("side-support piece");
    expect(markup).not.toContain("connection planning aid");
  });

  it("renders a safe fallback instead of guessed geometry", () => {
    const markup = renderToStaticMarkup(
      <WallShelfDiagrams
        model={{
          ...fiveShelfModel,
          status: "needs_shelf_count",
          fallbackMessage: "Add shelf count to render a shelf layout diagram.",
          shelfCount: null,
        }}
      />,
    );

    expect(markup).toContain("Diagram needs more details.");
    expect(markup).toContain("Add shelf count to render a shelf layout diagram.");
    expect(markup).not.toContain("Front elevation / shelf layout");
  });
});
