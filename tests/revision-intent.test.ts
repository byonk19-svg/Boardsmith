import { classifyRevisionIntent, revisionIntentCategoryLabels } from "@/lib/plans/revision-intent";
import { maxRevisionInstructionLength, normalizeRevisionInstruction } from "@/lib/plans/revision-input";
import { describe, expect, it } from "vitest";

describe("classifyRevisionIntent", () => {
  it("allows clearly prose-only revisions", () => {
    expect(classifyRevisionIntent("Make the steps easier for a beginner.")).toMatchObject({
      categories: ["prose_only"],
      decision: "allow_direct_revision",
      messageKey: null,
    });
    expect(classifyRevisionIntent("Clarify the sanding order and add beginner tips.").decision).toBe("allow_direct_revision");
  });

  it("requires structured updates for dimension changes", () => {
    expect(classifyRevisionIntent("Make the shelf 30 inches wide.")).toMatchObject({
      categories: ["dimensions"],
      decision: "requires_structured_update",
      messageKey: "structured_change_required",
    });
    expect(classifyRevisionIntent("Use a thicker board and make it deeper.").categories).toEqual(expect.arrayContaining(["dimensions", "materials"]));
  });

  it("requires structured updates for layout, material, support, and cut-list changes", () => {
    expect(classifyRevisionIntent("Change this to five separate shelves.").categories).toContain("layout");
    expect(classifyRevisionIntent("Switch the material to oak.").categories).toContain("materials");
    expect(classifyRevisionIntent("Use a French cleat instead of brackets.").categories).toContain("support_mounting");
    expect(classifyRevisionIntent("Reduce the number of cuts and merge the pieces.").categories).toContain("cut_list_parts");

    for (const instruction of [
      "Change this to five separate shelves.",
      "Switch the material to oak.",
      "Use a French cleat instead of brackets.",
      "Reduce the number of cuts and merge the pieces.",
    ]) {
      expect(classifyRevisionIntent(instruction).decision).toBe("requires_structured_update");
    }
  });

  it("blocks safety-sensitive changes before generation", () => {
    expect(classifyRevisionIntent("Make it safe for heavy books.")).toMatchObject({
      decision: "block_revision",
      messageKey: "safety_sensitive_change",
    });
    expect(classifyRevisionIntent("Change this for toddler use in a bathroom.").categories).toEqual(
      expect.arrayContaining(["safety_sensitive"]),
    );
  });

  it("blocks mixed safety-sensitive and structured requests before revision generation", () => {
    expect(classifyRevisionIntent("Make it 12 inches deeper for heavy books.")).toMatchObject({
      categories: ["dimensions", "safety_sensitive"],
      decision: "block_revision",
      messageKey: "safety_sensitive_change",
    });
  });

  it("blocks vague structural revisions as ambiguous", () => {
    expect(classifyRevisionIntent("Make it sturdier.")).toMatchObject({
      categories: ["ambiguous"],
      decision: "block_revision",
      messageKey: "ambiguous_revision",
    });
  });

  it("treats mixed ambiguous and structured requests as structured updates", () => {
    expect(classifyRevisionIntent("Make it sturdier and switch the material to oak.")).toMatchObject({
      categories: ["materials", "ambiguous"],
      decision: "requires_structured_update",
      messageKey: "structured_change_required",
    });
  });

  it("formats category labels without raw instruction text", () => {
    expect(revisionIntentCategoryLabels(["dimensions", "materials", "support_mounting"])).toEqual([
      "dimensions",
      "materials or finish",
      "support or mounting",
    ]);
    expect(revisionIntentCategoryLabels(["materials", "ambiguous"])).toEqual(["materials or finish", "ambiguous structural change"]);
  });

  it("preserves revision input normalization boundaries", () => {
    expect(normalizeRevisionInstruction("  Make the steps clearer.  ")).toBe("Make the steps clearer.");
    expect(maxRevisionInstructionLength).toBe(500);
  });
});
