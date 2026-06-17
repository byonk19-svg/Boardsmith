import {
  projectTypes,
  boardSizeOptions,
  cutStrategyOptions,
  higherRiskSpotOptions,
  installLocationOptions,
  measurementConfidenceOptions,
  moistureExposureOptions,
  mountingMethodOptions,
  shelfLayoutOptions,
  skillLevels,
  shelfLoadOptions,
  studAccessOptions,
  supportCountOptions,
  toolOptions,
  wallTypeOptions,
  type BoardSizeOption,
  type CutStrategyOption,
  type HigherRiskSpotOption,
  type InstallLocationOption,
  type MeasurementConfidenceOption,
  type MoistureExposureOption,
  type MountingMethodOption,
  type ProjectType,
  type ShelfLayoutOption,
  type SkillLevel,
  type ShelfLoadOption,
  type StudAccessOption,
  type SupportCountOption,
  type ToolOption,
  type WallTypeOption,
} from "@/lib/projects/types";

export const projectIntakeDraftCookieName = "boardsmith_project_intake_draft";
export const maxProjectIntakeDraftCookieValueLength = 3600;

export type ProjectIntakeDraft = {
  title: string;
  project_type: ProjectType | "";
  skill_level: SkillLevel | "";
  width_inches: string;
  height_inches: string;
  depth_inches: string;
  material_thickness_inches: string;
  material_type: string;
  shelf_layout: ShelfLayoutOption | "";
  shelf_count: string;
  shelf_spacing_inches: string;
  board_size: BoardSizeOption | "";
  measurement_confidence: MeasurementConfidenceOption | "";
  mounting_method: MountingMethodOption | "";
  wall_type: WallTypeOption | "";
  stud_access: StudAccessOption | "";
  shelf_load: ShelfLoadOption | "";
  moisture_exposure: MoistureExposureOption | "";
  higher_risk_spots: HigherRiskSpotOption[];
  install_location: InstallLocationOption | "";
  planned_mounting_height: string;
  support_count: SupportCountOption | "";
  wall_obstructions: string;
  cut_strategy: CutStrategyOption | "";
  finish_preference: string;
  edge_treatment: string;
  tools_available: ToolOption[];
  style_notes: string;
  intended_use: string;
};

const emptyDraft: ProjectIntakeDraft = {
  title: "",
  project_type: "",
  skill_level: "",
  width_inches: "",
  height_inches: "",
  depth_inches: "",
  material_thickness_inches: "",
  material_type: "",
  shelf_layout: "",
  shelf_count: "",
  shelf_spacing_inches: "",
  board_size: "",
  measurement_confidence: "",
  mounting_method: "",
  wall_type: "",
  stud_access: "",
  shelf_load: "",
  moisture_exposure: "",
  higher_risk_spots: [],
  install_location: "",
  planned_mounting_height: "",
  support_count: "",
  wall_obstructions: "",
  cut_strategy: "",
  finish_preference: "",
  edge_treatment: "",
  tools_available: [],
  style_notes: "",
  intended_use: "",
};

function textValue(formData: FormData, name: keyof Omit<ProjectIntakeDraft, "tools_available">, maxLength: number): string {
  const value = formData.get(name);
  return typeof value === "string" ? value.slice(0, maxLength) : "";
}

function optionValue<T extends string>(value: FormDataEntryValue | null, options: readonly T[]): T | "" {
  return typeof value === "string" && options.includes(value as T) ? (value as T) : "";
}

export function createProjectIntakeDraft(formData: FormData): ProjectIntakeDraft {
  const tools = formData
    .getAll("tools_available")
    .filter((value): value is ToolOption => typeof value === "string" && toolOptions.includes(value as ToolOption));
  const higherRiskSpots = formData
    .getAll("higher_risk_spots")
    .filter((value): value is HigherRiskSpotOption => typeof value === "string" && higherRiskSpotOptions.includes(value as HigherRiskSpotOption));

  return {
    title: textValue(formData, "title", 120),
    project_type: optionValue(formData.get("project_type"), projectTypes),
    skill_level: optionValue(formData.get("skill_level"), skillLevels),
    width_inches: textValue(formData, "width_inches", 20),
    height_inches: textValue(formData, "height_inches", 20),
    depth_inches: textValue(formData, "depth_inches", 20),
    material_thickness_inches: textValue(formData, "material_thickness_inches", 20),
    material_type: textValue(formData, "material_type", 120),
    shelf_layout: optionValue(formData.get("shelf_layout"), shelfLayoutOptions),
    shelf_count: textValue(formData, "shelf_count", 20),
    shelf_spacing_inches: textValue(formData, "shelf_spacing_inches", 20),
    board_size: optionValue(formData.get("board_size"), boardSizeOptions),
    measurement_confidence: optionValue(formData.get("measurement_confidence"), measurementConfidenceOptions),
    mounting_method: optionValue(formData.get("mounting_method"), mountingMethodOptions),
    wall_type: optionValue(formData.get("wall_type"), wallTypeOptions),
    stud_access: optionValue(formData.get("stud_access"), studAccessOptions),
    shelf_load: optionValue(formData.get("shelf_load"), shelfLoadOptions),
    moisture_exposure: optionValue(formData.get("moisture_exposure"), moistureExposureOptions),
    higher_risk_spots: Array.from(new Set(higherRiskSpots)),
    install_location: optionValue(formData.get("install_location"), installLocationOptions),
    planned_mounting_height: textValue(formData, "planned_mounting_height", 160),
    support_count: optionValue(formData.get("support_count"), supportCountOptions),
    wall_obstructions: textValue(formData, "wall_obstructions", 300),
    cut_strategy: optionValue(formData.get("cut_strategy"), cutStrategyOptions),
    finish_preference: textValue(formData, "finish_preference", 240),
    edge_treatment: textValue(formData, "edge_treatment", 240),
    tools_available: Array.from(new Set(tools)),
    style_notes: textValue(formData, "style_notes", 1000),
    intended_use: textValue(formData, "intended_use", 1000),
  };
}

export function encodeProjectIntakeDraft(draft: ProjectIntakeDraft): string {
  const boundedDraft = { ...draft };
  const shrinkableFields: (keyof Pick<
    ProjectIntakeDraft,
    | "style_notes"
    | "intended_use"
    | "wall_obstructions"
    | "finish_preference"
    | "edge_treatment"
    | "planned_mounting_height"
    | "material_type"
    | "title"
  >)[] = [
    "style_notes",
    "intended_use",
    "wall_obstructions",
    "finish_preference",
    "edge_treatment",
    "planned_mounting_height",
    "material_type",
    "title",
  ];

  for (let attempt = 0; attempt < 100; attempt += 1) {
    const encoded = encodeURIComponent(JSON.stringify(boundedDraft));
    if (encoded.length <= maxProjectIntakeDraftCookieValueLength) {
      return encoded;
    }

    const longestField = shrinkableFields
      .map((field) => ({ field, length: boundedDraft[field].length }))
      .filter((entry) => entry.length > 0)
      .sort((a, b) => b.length - a.length)
      .at(0);

    if (!longestField) {
      return encodeURIComponent(JSON.stringify(createProjectIntakeDraft(new FormData())));
    }

    boundedDraft[longestField.field] = boundedDraft[longestField.field].slice(0, Math.max(0, longestField.length - 128)).trimEnd();
  }

  return encodeURIComponent(JSON.stringify(createProjectIntakeDraft(new FormData())));
}

export function decodeProjectIntakeDraft(value: string | undefined): ProjectIntakeDraft {
  if (!value) {
    return emptyDraft;
  }

  try {
    let decoded = value;
    let parsed: Partial<ProjectIntakeDraft> | undefined;

    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        parsed = JSON.parse(decoded) as Partial<ProjectIntakeDraft>;
        break;
      } catch {
        decoded = decodeURIComponent(decoded);
      }
    }

    if (!parsed) {
      return emptyDraft;
    }

    const formData = new FormData();

    for (const [key, rawValue] of Object.entries(parsed)) {
      if (key === "tools_available" && Array.isArray(rawValue)) {
        rawValue.forEach((tool) => {
          if (typeof tool === "string") {
            formData.append("tools_available", tool);
          }
        });
      } else if (key === "higher_risk_spots" && Array.isArray(rawValue)) {
        rawValue.forEach((spot) => {
          if (typeof spot === "string") {
            formData.append("higher_risk_spots", spot);
          }
        });
      } else if (typeof rawValue === "string") {
        formData.set(key, rawValue);
      }
    }

    return createProjectIntakeDraft(formData);
  } catch {
    return emptyDraft;
  }
}
