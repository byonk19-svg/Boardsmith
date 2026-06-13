import { z } from "zod";

export const projectTypes = [
  "door_hanger",
  "layered_cutout",
  "wood_sign",
  "simple_shelf",
  "planter_box",
] as const;

export const skillLevels = ["beginner", "intermediate", "advanced"] as const;

export const projectStatuses = ["draft", "plan_generated", "generation_failed"] as const;

export const toolOptions = [
  "tape_measure",
  "pencil",
  "clamps",
  "drill",
  "jigsaw",
  "circular_saw",
  "miter_saw",
  "sander",
  "paint_brush",
] as const;

export const projectTypeLabels: Record<ProjectType, string> = {
  door_hanger: "Door hanger",
  layered_cutout: "Layered cutout",
  wood_sign: "Wood sign",
  simple_shelf: "Wall shelf",
  planter_box: "Planter box",
};

export const toolLabels: Record<ToolOption, string> = {
  tape_measure: "Tape measure",
  pencil: "Pencil",
  clamps: "Clamps",
  drill: "Drill",
  jigsaw: "Jigsaw",
  circular_saw: "Circular saw",
  miter_saw: "Miter saw",
  sander: "Sander",
  paint_brush: "Paint brush",
};

export const projectIntakeSchema = z.object({
  title: z.string().trim().min(2).max(120),
  project_type: z.enum(projectTypes),
  skill_level: z.enum(skillLevels),
  width_inches: z.number().positive().max(240),
  height_inches: z.number().positive().max(240),
  depth_inches: z.number().nonnegative().max(240),
  material_thickness_inches: z.number().positive().max(12),
  material_type: z.string().trim().min(2).max(120),
  tools_available: z.array(z.enum(toolOptions)).min(1),
  style_notes: z.string().trim().max(1000).optional().default(""),
  intended_use: z.string().trim().min(2).max(1000),
});

export const projectSchema = projectIntakeSchema.extend({
  id: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
  status: z.enum(projectStatuses),
  safety_review_required: z.boolean(),
  safety_flags: z.array(z.string()),
  notes: z.string().max(5000).default(""),
  build_completed: z.boolean().default(false),
  build_completed_at: z.string().max(10).default(""),
  build_actual_material: z.string().max(2000).default(""),
  build_plan_changes: z.string().max(5000).default(""),
  build_lessons_learned: z.string().max(5000).default(""),
  archived_at: z.string().nullable().default(null),
});

export type ProjectType = (typeof projectTypes)[number];
export type SkillLevel = (typeof skillLevels)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ToolOption = (typeof toolOptions)[number];
export type ProjectIntake = z.infer<typeof projectIntakeSchema>;
export type Project = z.infer<typeof projectSchema>;

export const projectNotesSchema = z.string().max(5000);

export const projectBuildLogSchema = z.object({
  build_completed: z.boolean().default(false),
  build_completed_at: z.string().trim().max(10).default(""),
  build_actual_material: z.string().trim().max(2000).default(""),
  build_plan_changes: z.string().trim().max(5000).default(""),
  build_lessons_learned: z.string().trim().max(5000).default(""),
});

export type ProjectBuildLogInput = z.infer<typeof projectBuildLogSchema>;

export function parseProjectFormData(formData: FormData): ProjectIntake {
  const getNumber = (name: string) => Number(formData.get(name));
  const projectTypeValue = formData.get("project_type");
  const materialThicknessInches = getNumber("material_thickness_inches");
  const heightValue = formData.get("height_inches");
  const heightInches =
    projectTypeValue === "simple_shelf" && typeof heightValue === "string" && heightValue.trim() === ""
      ? materialThicknessInches
      : getNumber("height_inches");

  return projectIntakeSchema.parse({
    title: formData.get("title"),
    project_type: projectTypeValue,
    skill_level: formData.get("skill_level"),
    width_inches: getNumber("width_inches"),
    height_inches: heightInches,
    depth_inches: getNumber("depth_inches"),
    material_thickness_inches: materialThicknessInches,
    material_type: formData.get("material_type"),
    tools_available: formData.getAll("tools_available"),
    style_notes: formData.get("style_notes") ?? "",
    intended_use: formData.get("intended_use"),
  });
}
