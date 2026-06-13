import {
  projectTypes,
  shelfLayoutOptions,
  skillLevels,
  toolOptions,
  type ProjectType,
  type ShelfLayoutOption,
  type SkillLevel,
  type ToolOption,
} from "@/lib/projects/types";

export const projectIntakeDraftCookieName = "boardsmith_project_intake_draft";

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
    tools_available: Array.from(new Set(tools)),
    style_notes: textValue(formData, "style_notes", 1000),
    intended_use: textValue(formData, "intended_use", 1000),
  };
}

export function encodeProjectIntakeDraft(draft: ProjectIntakeDraft): string {
  return encodeURIComponent(JSON.stringify(draft));
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
      } else if (typeof rawValue === "string") {
        formData.set(key, rawValue);
      }
    }

    return createProjectIntakeDraft(formData);
  } catch {
    return emptyDraft;
  }
}
