import { describe, expect, it } from "vitest";
import { getGenerationFailureFeedback } from "@/lib/ai/generation-feedback";

describe("getGenerationFailureFeedback", () => {
  it("maps deterministic quality failures to non-technical blocked-generation feedback", () => {
    const feedback = getGenerationFailureFeedback("review_blocked", ["Wall mounting review", "Child or baby use"]);

    expect(feedback.title).toBe("Boardsmith generated a draft, but it did not pass review checks.");
    expect(feedback.summary).toBe("No new plan was saved.");
    expect(feedback.detail).toContain("validation or safety review");
    expect(feedback.suggestions).toEqual(
      expect.arrayContaining([
        "Add more detail about dimensions, materials, mounting method, hardware, and intended use.",
        "For wall-mounted projects, verify studs or anchors, fasteners, wall structure, and expected load before trying again.",
        "For child-adjacent projects, describe edge treatment, finish choice, supervision needs, mounting height, and inspection plans.",
      ]),
    );
  });

  it("preserves helpful missing OpenAI key guidance without exposing internals", () => {
    const feedback = getGenerationFailureFeedback("missing_openai_key", []);

    expect(feedback.title).toBe("OpenAI generation is not configured.");
    expect(feedback.summary).toContain("OPENAI_API_KEY");
    expect(feedback.suggestions).toContain("Add OPENAI_API_KEY to the local environment, then try generating again.");
  });

  it("explains that archived projects must be restored before generation", () => {
    const feedback = getGenerationFailureFeedback("archived", []);

    expect(feedback.title).toBe("Restore this project before generating.");
    expect(feedback.summary).toBe("No plan was generated or saved.");
    expect(feedback.detail).toContain("does not create new plan versions until the project is restored");
    expect(feedback.suggestions).toContain("Restore the project, then generate a new plan version if the intake still looks right.");
  });

  it("gives direct repair guidance for impossible multi-shelf height", () => {
    const feedback = getGenerationFailureFeedback("shelf_layout_invalid", []);

    expect(feedback.title).toBe("Shelf layout dimensions need review.");
    expect(feedback.summary).toBe("No plan was generated.");
    expect(feedback.suggestions).toContain(
      "Total project height looks too small for 5 shelves. Enter the full top-to-bottom height of the shelf unit, such as 60 in.",
    );
  });
});
