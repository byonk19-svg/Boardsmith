import type { ProjectIntake } from "@/lib/projects/types";

export type SafetyReviewFlag = {
  code: string;
  label: string;
  reason: string;
};

const textMatches = (project: Pick<ProjectIntake, "title" | "style_notes" | "intended_use">, terms: RegExp) =>
  terms.test(`${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase());

export function calculateSafetyReviewFlags(
  project: Pick<
    ProjectIntake,
    | "title"
    | "project_type"
    | "width_inches"
    | "height_inches"
    | "depth_inches"
    | "material_thickness_inches"
    | "style_notes"
    | "intended_use"
  >,
): SafetyReviewFlag[] {
  const flags: SafetyReviewFlag[] = [];
  const add = (flag: SafetyReviewFlag) => {
    if (!flags.some((existing) => existing.code === flag.code)) {
      flags.push(flag);
    }
  };

  if (project.project_type === "simple_shelf" || textMatches(project, /\b(wall|mounted|mount|hang|anchor|stud)\b/)) {
    add({
      code: "wall_mounting",
      label: "Wall mounting review",
      reason: "Wall-mounted projects need stud, anchor, fastener, and load-use review.",
    });
  }

  if (textMatches(project, /\b(baby|child|children|kid|kids|crib|nursery|toddler)\b/)) {
    add({
      code: "child_or_baby_use",
      label: "Child or baby use",
      reason: "Projects for children require extra safety review and should not claim child-furniture safety.",
    });
  }

  if (textMatches(project, /\b(chair|stool|bench|seat|seating)\b/)) {
    add({
      code: "seating_or_load_bearing",
      label: "Seating/load-bearing review",
      reason: "Seating and load-bearing furniture require structural review outside this MVP.",
    });
  }

  if (textMatches(project, /\b(ladder|platform|step\s*stool|loft)\b/)) {
    add({
      code: "ladder_or_platform",
      label: "Ladder/platform review",
      reason: "Ladders and platforms involve fall risk and are not suitable for automatic approval.",
    });
  }

  if (
    project.project_type === "simple_shelf" &&
    (project.width_inches >= 36 || project.depth_inches >= 12 || textMatches(project, /\b(heavy|books|load|weight)\b/))
  ) {
    add({
      code: "heavy_shelving",
      label: "Heavy shelving review",
      reason: "Shelf loads depend on fasteners, wall framing, brackets, and material strength.",
    });
  }

  if (textMatches(project, /\b(electric|electrical|lighted|lighting|led|wire|wiring|battery|neon)\b|\blight\s*(strip|fixture|sign|box|bulb|socket)\b/)) {
    add({
      code: "electrical_or_lighted",
      label: "Electrical/lighted review",
      reason: "Electrical or lighted signs need electrical safety review and component-specific instructions.",
    });
  }

  if (project.project_type === "planter_box" || textMatches(project, /\b(outdoor|outside|rain|weather|deck|porch)\b/)) {
    add({
      code: "outdoor_load_exposure",
      label: "Outdoor exposure review",
      reason: "Outdoor use changes finish, fastener, drainage, movement, and rot-resistance requirements.",
    });
  }

  if (project.width_inches <= 0 || project.height_inches <= 0 || project.depth_inches < 0) {
    add({
      code: "unclear_dimensions",
      label: "Unclear dimensions",
      reason: "Dimensions must be clear before a reliable cut list can be generated.",
    });
  }

  if (project.material_thickness_inches <= 0) {
    add({
      code: "missing_material_thickness",
      label: "Missing material thickness",
      reason: "Material thickness is required for cut lists and assembly planning.",
    });
  }

  return flags;
}
