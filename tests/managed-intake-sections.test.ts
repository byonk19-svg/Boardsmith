import { describe, expect, it } from "vitest";
import {
  appendManagedSection,
  formatManagedOptionLine,
  formatManagedTextLine,
  mergeManagedSection,
  STRUCTURED_INTAKE_HEADING,
} from "@/lib/projects/managed-intake-sections";

describe("managed intake sections", () => {
  it("formats managed option and text lines consistently", () => {
    const yesNoLabels: Record<"yes" | "no", string> = { yes: "Yes", no: "No" };
    expect(formatManagedOptionLine("yes", yesNoLabels, "Stud access")).toBe("Stud access: Yes");
    expect(formatManagedTextLine("  Around 60 in from floor.  ", "Planned mounting height", 160)).toBe("Planned mounting height: Around 60 in from floor.");
    expect(formatManagedTextLine("   ", "Finish preference", 240)).toBeUndefined();
  });

  it("appends a managed section after user-provided intake text", () => {
    const managedText = appendManagedSection("Bathroom shelf for towels.", STRUCTURED_INTAKE_HEADING, [
      "Mounting method: Visible L brackets",
      "What it will hold: Towels",
    ]);

    expect(managedText).toBe(
      ["Bathroom shelf for towels.", "Structured intake\n- Mounting method: Visible L brackets\n- What it will hold: Towels"].join("\n\n"),
    );
  });

  it("replaces only the matching managed section when clarification answers change", () => {
    const existing = [
      "Bathroom shelf for towels.",
      "Structured intake\n- Mounting method: I'm not sure yet",
      "Planning preferences\n- Finish preference: Paint",
    ].join("\n\n");

    const managedText = mergeManagedSection(existing, STRUCTURED_INTAKE_HEADING, [
      "Mounting method: Visible L brackets",
      "Wall type: Drywall with wood studs",
    ]);

    expect(managedText).toContain("Bathroom shelf for towels.");
    expect(managedText).toContain("Planning preferences\n- Finish preference: Paint");
    expect(managedText).toContain("Structured intake\n- Mounting method: Visible L brackets\n- Wall type: Drywall with wood studs");
    expect(managedText).not.toContain("I'm not sure yet");
  });
});
