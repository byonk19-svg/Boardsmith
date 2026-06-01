import { describe, expect, it } from "vitest";
import { getGenerationFailureFeedback } from "@/lib/ai/generation-feedback";

describe("getGenerationFailureFeedback", () => {
  it("maps deterministic quality failures to non-technical blocked-generation feedback", () => {
    const feedback = getGenerationFailureFeedback("review_blocked", ["Wall mounting review", "Child or baby use"]);

    expect(feedback.title).toBe("Boardsmith generated a draft, but it did not pass review checks.");
    expect(feedback.summary).toBe("No plan was saved.");
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
});
