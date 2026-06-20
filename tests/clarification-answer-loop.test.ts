import { describe, expect, it } from "vitest";
import { createClarificationAnswerUpdate } from "@/lib/projects/clarification-answer-loop";
import type { Project } from "@/lib/projects/types";

const project: Project = {
  id: "clarification-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Bathroom shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "generation_failed",
  width_inches: 24,
  height_inches: 0.1,
  depth_inches: 8,
  material_thickness_inches: 0.75,
  material_type: "Pine",
  shelf_layout: "multi_shelf_unit",
  shelf_count: undefined,
  shelf_spacing_inches: undefined,
  tools_available: ["tape_measure", "pencil"],
  style_notes: "Keep it simple.\n\nPlanning preferences\n- Finish preference: Paint",
  intended_use: "Bathroom wall shelf.\n\nStructured intake\n- Mounting method: I'm not sure yet",
  safety_review_required: true,
  safety_flags: ["Shelf count/layout missing"],
  notes: "",
  build_completed: false,
  build_completed_at: "",
  build_actual_material: "",
  build_plan_changes: "",
  build_lessons_learned: "",
  archived_at: null,
};

describe("createClarificationAnswerUpdate", () => {
  it("maps answerable clarification fields to a validated project update", () => {
    const formData = new FormData();
    formData.set("shelf_layout", "multi_shelf_unit");
    formData.set("shelf_count", "3");
    formData.set("height_inches", "60");
    formData.set("shelf_spacing_inches", "12");
    formData.set("mounting_method", "visible_l_brackets");
    formData.set("wall_type", "drywall_wood_studs");
    formData.set("stud_access", "yes");
    formData.set("shelf_load", "towels");
    formData.set("moisture_exposure", "bathroom_humid");
    formData.set("finish_preference", "Water-resistant clear coat");

    const result = createClarificationAnswerUpdate(project, formData);

    expect(result.update).toMatchObject({
      shelf_layout: "multi_shelf_unit",
      shelf_count: 3,
      height_inches: 60,
      shelf_spacing_inches: 12,
    });
    expect(result.update.intended_use).toContain("Bathroom wall shelf.");
    expect(result.update.intended_use).toContain("Structured intake");
    expect(result.update.intended_use).toContain("Mounting method: Visible L brackets");
    expect(result.update.intended_use).not.toContain("Mounting method: I'm not sure yet");
    expect(result.update.style_notes).toContain("Keep it simple.");
    expect(result.update.style_notes).toContain("Planning preferences");
    expect(result.update.style_notes).toContain("Finish preference: Water-resistant clear coat");
    expect(result.update.style_notes).not.toContain("Finish preference: Paint");
    expect(result.answeredQuestionIds).toEqual(
      expect.arrayContaining(["shelf_layout", "shelf_count", "shelf_height_impossible", "mounting_support_method", "wall_fastener_context", "expected_load_or_use", "finish_exposure"]),
    );
    expect(result.nextDecision.questions.some((question) => question.id === "shelf_count")).toBe(false);
  });

  it("rejects empty answer submissions before storage writes", () => {
    expect(() => createClarificationAnswerUpdate(project, new FormData())).toThrow("At least one clarification answer field is required.");
  });
});
