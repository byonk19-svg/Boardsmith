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
export const shelfLayoutOptions = ["single_shelf", "multiple_separate_shelves", "multi_shelf_unit"] as const;

export const toolOptions = [
  "tape_measure",
  "pencil",
  "clamps",
  "drill",
  "stud_finder",
  "level",
  "safety_glasses",
  "jigsaw",
  "circular_saw",
  "miter_saw",
  "sander",
  "paint_brush",
] as const;

export const mountingMethodOptions = [
  "hidden_floating_brackets",
  "visible_l_brackets",
  "cleat_or_french_cleat",
  "not_sure",
  "not_wall_mounted",
] as const;

export const wallTypeOptions = [
  "drywall_wood_studs",
  "drywall_studs_unknown",
  "tile_wall",
  "masonry_brick_concrete",
  "not_sure",
  "not_wall_mounted",
] as const;

export const studAccessOptions = ["yes", "no", "not_sure", "not_wall_mounted"] as const;

export const shelfLoadOptions = ["light_decor", "toiletries", "towels", "books_heavy_items", "not_sure"] as const;

export const moistureExposureOptions = ["normal_indoor", "bathroom_humid", "near_sink_tub_shower", "covered_outdoor"] as const;

export const boardSizeOptions = ["one_by_six", "one_by_eight", "one_by_ten", "three_quarter_plywood", "half_inch_plywood", "other_not_sure"] as const;

export const boardMaterialOptions = ["pine", "common_board", "poplar", "oak", "plywood", "mdf", "not_sure"] as const;

export const measurementConfidenceOptions = ["measured_ready", "close_estimate", "not_sure"] as const;

export const cutStrategyOptions = ["cut_myself", "store_cut_or_precut", "not_sure"] as const;

export const projectTypeLabels: Record<ProjectType, string> = {
  door_hanger: "Door hanger",
  layered_cutout: "Layered cutout",
  wood_sign: "Wood sign",
  simple_shelf: "Wall shelf",
  planter_box: "Planter box",
};

export const shelfLayoutLabels: Record<ShelfLayoutOption, string> = {
  single_shelf: "Single shelf",
  multiple_separate_shelves: "Multiple separate wall shelves",
  multi_shelf_unit: "Connected shelf unit with side supports/frame",
};

export const toolLabels: Record<ToolOption, string> = {
  tape_measure: "Tape measure",
  pencil: "Pencil",
  clamps: "Clamps",
  drill: "Drill",
  stud_finder: "Stud finder",
  level: "Level",
  safety_glasses: "Safety glasses",
  jigsaw: "Jigsaw",
  circular_saw: "Circular saw",
  miter_saw: "Miter saw",
  sander: "Sander",
  paint_brush: "Paint brush",
};

export const mountingMethodLabels: Record<MountingMethodOption, string> = {
  hidden_floating_brackets: "Hidden/floating brackets",
  visible_l_brackets: "Visible L brackets",
  cleat_or_french_cleat: "Cleat/French cleat",
  not_sure: "I'm not sure yet",
  not_wall_mounted: "Not wall-mounted",
};

export const wallTypeLabels: Record<WallTypeOption, string> = {
  drywall_wood_studs: "Drywall with wood studs",
  drywall_studs_unknown: "Drywall, studs unknown",
  tile_wall: "Tile wall",
  masonry_brick_concrete: "Masonry/brick/concrete",
  not_sure: "I'm not sure",
  not_wall_mounted: "Not wall-mounted",
};

export const studAccessLabels: Record<StudAccessOption, string> = {
  yes: "Yes, studs can be used",
  no: "No",
  not_sure: "Not sure",
  not_wall_mounted: "Not wall-mounted",
};

export const shelfLoadLabels: Record<ShelfLoadOption, string> = {
  light_decor: "Light decor only",
  toiletries: "Toiletries/small bathroom items",
  towels: "Towels",
  books_heavy_items: "Books/heavy items",
  not_sure: "Not sure",
};

export const moistureExposureLabels: Record<MoistureExposureOption, string> = {
  normal_indoor: "Normal indoor room",
  bathroom_humid: "Bathroom/humid room",
  near_sink_tub_shower: "Near sink/tub/shower",
  covered_outdoor: "Outdoor/covered outdoor",
};

export const boardSizeLabels: Record<BoardSizeOption, string> = {
  one_by_six: "1x6 board",
  one_by_eight: "1x8 board",
  one_by_ten: "1x10 board",
  three_quarter_plywood: "3/4 in plywood",
  half_inch_plywood: "1/2 in plywood",
  other_not_sure: "Other / not sure",
};

export const boardMaterialLabels: Record<BoardMaterialOption, string> = {
  pine: "Pine",
  common_board: "Common board",
  poplar: "Poplar",
  oak: "Oak",
  plywood: "Plywood",
  mdf: "MDF",
  not_sure: "Not sure",
};

export const measurementConfidenceLabels: Record<MeasurementConfidenceOption, string> = {
  measured_ready: "Yes, measured and ready",
  close_estimate: "Close estimate",
  not_sure: "Not sure yet",
};

export const cutStrategyLabels: Record<CutStrategyOption, string> = {
  cut_myself: "I can cut boards myself",
  store_cut_or_precut: "I need store-cut or pre-cut boards",
  not_sure: "I'm not sure",
};

export const higherRiskSpotOptions = [
  "above_bed_crib_seat_or_sleeping_area",
  "above_toilet_sink_or_walkway",
  "child_accessible",
  "near_water_shower_or_tub",
  "holding_breakable_or_heavy_items",
  "none_of_these",
  "not_sure",
] as const;

export const installLocationOptions = [
  "above_toilet",
  "above_sink_vanity",
  "above_desk_table",
  "open_wall",
  "closet_pantry_laundry",
  "other_not_sure",
] as const;

export const supportCountOptions = ["two", "three", "more_than_three", "not_sure", "not_applicable"] as const;

export const higherRiskSpotLabels: Record<HigherRiskSpotOption, string> = {
  above_bed_crib_seat_or_sleeping_area: "Above a bed, crib, seat, or sleeping area",
  above_toilet_sink_or_walkway: "Above a toilet, sink, or walkway",
  child_accessible: "Child-accessible",
  near_water_shower_or_tub: "Near water, shower, or tub",
  holding_breakable_or_heavy_items: "Holding breakable/heavy items",
  none_of_these: "None of these",
  not_sure: "Not sure",
};

export const installLocationLabels: Record<InstallLocationOption, string> = {
  above_toilet: "Above toilet",
  above_sink_vanity: "Above sink/vanity",
  above_desk_table: "Above desk/table",
  open_wall: "Open wall",
  closet_pantry_laundry: "Closet/pantry/laundry area",
  other_not_sure: "Other / not sure",
};

export const supportCountLabels: Record<SupportCountOption, string> = {
  two: "2",
  three: "3",
  more_than_three: "More than 3",
  not_sure: "Not sure",
  not_applicable: "Not applicable",
};

export function formatToolLabel(tool: string): string {
  if (tool in toolLabels) return toolLabels[tool as ToolOption];

  return tool
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1).toLowerCase()}` : word.toLowerCase()))
    .join(" ");
}

export const projectIntakeSchema = z.object({
  title: z.string().trim().min(2).max(120),
  project_type: z.enum(projectTypes),
  skill_level: z.enum(skillLevels),
  width_inches: z.number().positive().max(240),
  height_inches: z.number().positive().max(240),
  depth_inches: z.number().nonnegative().max(240),
  material_thickness_inches: z.number().positive().max(12),
  material_type: z.string().trim().min(2).max(120),
  shelf_layout: z.enum(shelfLayoutOptions).optional(),
  shelf_count: z.number().int().positive().max(20).optional(),
  shelf_spacing_inches: z.number().positive().max(120).optional(),
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
export type ShelfLayoutOption = (typeof shelfLayoutOptions)[number];
export type ToolOption = (typeof toolOptions)[number];
export type MountingMethodOption = (typeof mountingMethodOptions)[number];
export type WallTypeOption = (typeof wallTypeOptions)[number];
export type StudAccessOption = (typeof studAccessOptions)[number];
export type ShelfLoadOption = (typeof shelfLoadOptions)[number];
export type MoistureExposureOption = (typeof moistureExposureOptions)[number];
export type BoardSizeOption = (typeof boardSizeOptions)[number];
export type BoardMaterialOption = (typeof boardMaterialOptions)[number];
export type MeasurementConfidenceOption = (typeof measurementConfidenceOptions)[number];
export type CutStrategyOption = (typeof cutStrategyOptions)[number];
export type HigherRiskSpotOption = (typeof higherRiskSpotOptions)[number];
export type InstallLocationOption = (typeof installLocationOptions)[number];
export type SupportCountOption = (typeof supportCountOptions)[number];
export type ProjectIntake = z.infer<typeof projectIntakeSchema>;
export type Project = z.infer<typeof projectSchema>;

export const projectNotesSchema = z.string().max(5000);

export const projectShelfLayoutUpdateSchema = z.object({
  shelf_layout: z.enum(shelfLayoutOptions),
  shelf_count: z.number().int().positive().max(20).optional(),
  shelf_spacing_inches: z.number().positive().max(120).optional(),
  height_inches: z.number().positive().max(240).optional(),
});

export type ProjectShelfLayoutUpdate = z.infer<typeof projectShelfLayoutUpdateSchema>;

function hasDefinedValue(input: Record<string, unknown>): boolean {
  return Object.values(input).some((value) => value !== undefined);
}

export const projectStructuredRevisionUpdateSchema = z
  .object({
    width_inches: z.number().positive().max(240).optional(),
    depth_inches: z.number().nonnegative().max(240).optional(),
    material_thickness_inches: z.number().positive().max(12).optional(),
    material_type: z.string().trim().min(2).max(120).optional(),
    shelf_layout: z.enum(shelfLayoutOptions).optional(),
    shelf_count: z.number().int().positive().max(20).optional(),
    shelf_spacing_inches: z.number().positive().max(120).optional(),
  })
  .refine((input) => hasDefinedValue(input), {
    message: "At least one structured revision field is required.",
  });

export type ProjectStructuredRevisionUpdate = z.infer<typeof projectStructuredRevisionUpdateSchema>;

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
  const getOptionalNumber = (name: string): number | undefined => {
    const value = formData.get(name);
    if (typeof value !== "string" || value.trim() === "") return undefined;
    return Number(value);
  };
  const projectTypeValue = formData.get("project_type");
  const shelfLayoutValue = formData.get("shelf_layout");
  const materialThicknessInches = getNumber("material_thickness_inches");
  const heightValue = formData.get("height_inches");
  const heightInches =
    projectTypeValue === "simple_shelf" && typeof heightValue === "string" && heightValue.trim() === ""
      ? materialThicknessInches
      : getNumber("height_inches");
  const appendLines = (baseValue: FormDataEntryValue | null, heading: string, lines: string[]) => {
    const baseText = typeof baseValue === "string" ? baseValue.trim() : "";
    const structuredText = lines.length > 0 ? `${heading}\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
    return [baseText, structuredText].filter(Boolean).join("\n\n");
  };
  const optionLabel = <T extends string>(name: string, options: readonly T[], labels: Record<T, string>, label: string): string | undefined => {
    const value = formData.get(name);
    if (typeof value !== "string" || !options.includes(value as T)) return undefined;
    return `${label}: ${labels[value as T]}`;
  };
  const textLine = (name: string, label: string, maxLength: number): string | undefined => {
    const value = formData.get(name);
    if (typeof value !== "string") return undefined;
    const trimmed = value.trim().slice(0, maxLength);
    return trimmed ? `${label}: ${trimmed}` : undefined;
  };
  const intendedUse = appendLines(
    formData.get("intended_use"),
    "Structured intake",
    [
      optionLabel("mounting_method", mountingMethodOptions, mountingMethodLabels, "Mounting method"),
      optionLabel("wall_type", wallTypeOptions, wallTypeLabels, "Wall type"),
      optionLabel("stud_access", studAccessOptions, studAccessLabels, "Stud access"),
      optionLabel("shelf_load", shelfLoadOptions, shelfLoadLabels, "What it will hold"),
      optionLabel("moisture_exposure", moistureExposureOptions, moistureExposureLabels, "Moisture exposure"),
      optionLabel("measurement_confidence", measurementConfidenceOptions, measurementConfidenceLabels, "Measurement confidence"),
      optionLabel("install_location", installLocationOptions, installLocationLabels, "Install location"),
      textLine("planned_mounting_height", "Planned mounting height", 160),
      optionLabel("support_count", supportCountOptions, supportCountLabels, "Support/bracket count"),
      ...formData
        .getAll("higher_risk_spots")
        .filter((value): value is HigherRiskSpotOption => typeof value === "string" && higherRiskSpotOptions.includes(value as HigherRiskSpotOption))
        .map((value) => `Higher-risk spot: ${higherRiskSpotLabels[value]}`),
      textLine("wall_obstructions", "Nearby wall conditions or obstructions", 300),
    ].filter((line): line is string => Boolean(line)),
  );
  const styleNotes = appendLines(
    formData.get("style_notes"),
    "Planning preferences",
    [
      optionLabel("board_size", boardSizeOptions, boardSizeLabels, "Board size from store"),
      optionLabel("cut_strategy", cutStrategyOptions, cutStrategyLabels, "Cut plan"),
      textLine("finish_preference", "Finish preference", 240),
      textLine("edge_treatment", "Edge treatment", 240),
    ].filter((line): line is string => Boolean(line)),
  );

  return projectIntakeSchema.parse({
    title: formData.get("title"),
    project_type: projectTypeValue,
    skill_level: formData.get("skill_level"),
    width_inches: getNumber("width_inches"),
    height_inches: heightInches,
    depth_inches: getNumber("depth_inches"),
    material_thickness_inches: materialThicknessInches,
    material_type: formData.get("material_type"),
    shelf_layout:
      projectTypeValue === "simple_shelf" && typeof shelfLayoutValue === "string" && shelfLayoutOptions.includes(shelfLayoutValue as ShelfLayoutOption)
        ? shelfLayoutValue
        : undefined,
    shelf_count: projectTypeValue === "simple_shelf" ? getOptionalNumber("shelf_count") : undefined,
    shelf_spacing_inches: projectTypeValue === "simple_shelf" ? getOptionalNumber("shelf_spacing_inches") : undefined,
    tools_available: formData.getAll("tools_available"),
    style_notes: styleNotes,
    intended_use: intendedUse,
  });
}
