import {
  toolOptions,
  type BoardSizeOption,
  type CutStrategyOption,
  type HigherRiskSpotOption,
  type InstallLocationOption,
  type MeasurementConfidenceOption,
  type MoistureExposureOption,
  type MountingMethodOption,
  type ProjectType,
  type ShelfLayoutOption,
  type ShelfLoadOption,
  type SkillLevel,
  type StudAccessOption,
  type SupportCountOption,
  type ToolOption,
  type WallTypeOption,
} from "@/lib/projects/types";

export type NaturalLanguageIntakeDraft = {
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

export type NaturalLanguageIntakeBlockedReason =
  | "child_sleep_or_entrapment"
  | "load_bearing_or_climbable"
  | "overhead_or_suspended_storage"
  | "electrical_or_plumbing_work";

export type NaturalLanguageIntakeMissingField =
  | "project_type"
  | "dimensions"
  | "material"
  | "material_thickness"
  | "tools"
  | "mounting_details";

export type NaturalLanguageIntakeResult = {
  status: "supported_draft" | "concept_only" | "unsupported" | "blocked_for_safety";
  draft: NaturalLanguageIntakeDraft;
  missingFields: NaturalLanguageIntakeMissingField[];
  blockedReasons: NaturalLanguageIntakeBlockedReason[];
  reviewNotes: string[];
};

type DimensionMatch = {
  width?: number;
  depth?: number;
  height?: number;
  thickness?: number;
};

const numberWords: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

const emptyDraft: NaturalLanguageIntakeDraft = {
  title: "",
  project_type: "",
  skill_level: "beginner",
  width_inches: "",
  height_inches: "",
  depth_inches: "",
  material_thickness_inches: "",
  material_type: "",
  shelf_layout: "",
  shelf_count: "",
  shelf_spacing_inches: "",
  board_size: "",
  measurement_confidence: "close_estimate",
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

export function parseNaturalLanguageIntake(rawIdea: string): NaturalLanguageIntakeResult {
  const idea = rawIdea.trim().replace(/\s+/g, " ").slice(0, 2000);
  const normalized = idea.toLowerCase();
  const dimensions = parseDimensions(normalized);
  const blockedReasons = inferBlockedReasons(normalized);
  const conceptOnly = blockedReasons.length === 0 && isFutureOrUnsupportedWoodworkingTemplate(normalized);
  const projectType = conceptOnly ? "" : inferProjectType(normalized);
  const status: NaturalLanguageIntakeResult["status"] =
    blockedReasons.length > 0 ? "blocked_for_safety" : conceptOnly ? "concept_only" : projectType === "" ? "unsupported" : "supported_draft";
  const higherRiskSpots = inferHigherRiskSpots(normalized);
  const tools = inferTools(normalized);
  const material = inferMaterial(normalized, dimensions.thickness);
  const shelfCount = inferShelfCount(normalized);
  const shelfLayout = inferShelfLayout(normalized, shelfCount);
  const mountingMethod = inferMountingMethod(normalized, projectType);
  const wallType = inferWallType(normalized, projectType);
  const studAccess = inferStudAccess(normalized, projectType);
  const shelfLoad = inferShelfLoad(normalized);
  const moistureExposure = inferMoistureExposure(normalized);
  const installLocation = inferInstallLocation(normalized);
  const supportCount = inferSupportCount(normalized);
  const cutStrategy = inferCutStrategy(normalized);
  const boardSize = inferBoardSize(normalized, dimensions.depth);
  const title = inferTitle(normalized, projectType);
  const reviewNotes = createReviewNotes(status, projectType, blockedReasons, higherRiskSpots, mountingMethod, wallType, studAccess);

  const draft: NaturalLanguageIntakeDraft = {
    ...emptyDraft,
    title,
    project_type: projectType,
    width_inches: formatDimension(dimensions.width),
    height_inches: formatDimension(dimensions.height),
    depth_inches: formatDimension(dimensions.depth),
    material_thickness_inches: formatDimension(dimensions.thickness),
    material_type: material,
    shelf_layout: shelfLayout,
    shelf_count: shelfCount ? shelfCount.toString() : projectType === "simple_shelf" ? "1" : "",
    shelf_spacing_inches: formatDimension(parseShelfSpacing(normalized)),
    board_size: boardSize,
    mounting_method: mountingMethod,
    wall_type: wallType,
    stud_access: studAccess,
    shelf_load: shelfLoad,
    moisture_exposure: moistureExposure,
    higher_risk_spots: higherRiskSpots,
    install_location: installLocation,
    planned_mounting_height: parseMountingHeight(idea),
    support_count: supportCount,
    wall_obstructions: inferWallObstructions(idea, normalized),
    cut_strategy: cutStrategy,
    finish_preference: inferFinish(normalized),
    edge_treatment: inferEdgeTreatment(normalized),
    tools_available: tools,
    style_notes: reviewNotes.join("\n"),
    intended_use: idea,
  };

  return {
    status,
    draft,
    missingFields: inferMissingFields(draft),
    blockedReasons,
    reviewNotes,
  };
}

export function naturalLanguageDraftToFormData(draft: NaturalLanguageIntakeDraft): FormData {
  const formData = new FormData();

  for (const [key, value] of Object.entries(draft)) {
    if (key === "tools_available" && Array.isArray(value)) {
      value.forEach((tool) => formData.append("tools_available", tool));
    } else if (key === "higher_risk_spots" && Array.isArray(value)) {
      value.forEach((spot) => formData.append("higher_risk_spots", spot));
    } else if (typeof value === "string") {
      formData.set(key, value);
    }
  }

  return formData;
}

function parseDimensions(text: string): DimensionMatch {
  const dimensions: DimensionMatch = {};
  const numberPattern = "(\\d+(?:\\.\\d+)?|\\d+\\/\\d+)";
  const labeledPatterns: [keyof DimensionMatch, RegExp][] = [
    ["width", new RegExp(`${numberPattern}\\s*(?:in|inch|inches|\\")?\\s*(?:wide|width|w\\b)`, "i")],
    ["depth", new RegExp(`${numberPattern}\\s*(?:in|inch|inches|\\")?\\s*(?:deep|depth|d\\b)`, "i")],
    ["height", new RegExp(`${numberPattern}\\s*(?:in|inch|inches|\\")?\\s*(?:tall|high|height|h\\b)`, "i")],
    ["thickness", new RegExp(`${numberPattern}\\s*(?:in|inch|inches|\\")?\\s*(?:thick|thickness)`, "i")],
  ];

  for (const [key, pattern] of labeledPatterns) {
    const value = parseNumericMatch(pattern.exec(text)?.[1]);
    if (value !== undefined) dimensions[key] = value;
  }

  const triple = new RegExp(`${numberPattern}\\s*(?:x|by)\\s*${numberPattern}\\s*(?:x|by)\\s*${numberPattern}`, "i").exec(text);
  if (triple) {
    dimensions.width ??= parseNumericMatch(triple[1]);
    dimensions.depth ??= parseNumericMatch(triple[2]);
    dimensions.height ??= parseNumericMatch(triple[3]);
  }

  const materialThickness = new RegExp(`${numberPattern}\\s*(?:in|inch|inches|\\")?\\s*(?:pine|oak|cedar|poplar|common board|plywood|mdf|board)`, "i").exec(
    text,
  );
  dimensions.thickness ??= parseNumericMatch(materialThickness?.[1]);

  return dimensions;
}

function parseNumericMatch(value: string | undefined): number | undefined {
  if (!value) return undefined;
  if (value.includes("/")) {
    const [rawNumerator, rawDenominator] = value.split("/");
    const numerator = Number(rawNumerator);
    const denominator = Number(rawDenominator);
    return Number.isFinite(numerator) && Number.isFinite(denominator) && denominator > 0 ? numerator / denominator : undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function inferProjectType(text: string): ProjectType | "" {
  if (/\b(planter|planter box)\b/.test(text)) return "planter_box";
  if (/\b(door hanger|door sign)\b/.test(text)) return "door_hanger";
  if (/\b(layered cutout|layered cut-out|layered wall art)\b/.test(text)) return "layered_cutout";
  if (/\b(sign|wood sign)\b/.test(text)) return "wood_sign";
  if (/\b(shelf|shelves|book ledge|book rail)\b/.test(text)) return "simple_shelf";
  return "";
}

function isFutureOrUnsupportedWoodworkingTemplate(text: string): boolean {
  return /\b(bookcase|bookshelf|built[-\s]?in|cabinet|cabinetry|closet storage|laundry storage|garage shelves|garage shelving|shop furniture|workbench|drawer|drawers)\b/.test(
    text,
  );
}

function inferTitle(text: string, projectType: ProjectType | ""): string {
  if (/\b(bookcase|bookshelf)\b/.test(text)) return "Bookcase concept";
  if (/\bcabinet|cabinetry\b/.test(text)) return "Cabinet concept";
  if (/\bbuilt[-\s]?in\b/.test(text)) return "Built-in storage concept";
  if (/\bbathroom\b/.test(text) && projectType === "simple_shelf") return "Bathroom wall shelf";
  if (/\bkitchen\b/.test(text) && projectType === "simple_shelf") return "Kitchen wall shelf";
  if (/\bgarage\b/.test(text) && projectType === "simple_shelf") return "Garage wall shelf";
  if (/\bplanter\b/.test(text)) return "Planter box";
  if (/\bdoor hanger\b/.test(text)) return "Door hanger";
  if (/\bsign\b/.test(text)) return "Wood sign";
  if (projectType === "simple_shelf") return "Wall shelf";
  return "Project idea";
}

function inferMaterial(text: string, thickness: number | undefined): string {
  const material =
    /\bcommon board\b/.exec(text)?.[0] ??
    /\b(pine|oak|cedar|poplar|plywood|mdf)\b/.exec(text)?.[0] ??
    (/\bboard\b/.test(text) ? "board" : "");
  if (!material) return "";
  const thicknessText = formatDimension(thickness);
  return thicknessText ? `${thicknessText} inch ${material} board`.replace("board board", "board") : `${material} board`.replace("plywood board", "plywood");
}

function inferShelfCount(text: string): number | undefined {
  const numeric = /\b(\d+)\s+shelves\b/.exec(text)?.[1];
  if (numeric) return Number(numeric);
  const word = /\b(one|two|three|four|five|six|seven|eight|nine|ten)\s+shelves\b/.exec(text)?.[1];
  return word ? numberWords[word] : undefined;
}

function inferShelfLayout(text: string, shelfCount: number | undefined): ShelfLayoutOption | "" {
  if (!/\b(shelf|shelves)\b/.test(text)) return "";
  if (/\b(connected|unit|frame|side panel|side panels|bookcase)\b/.test(text)) return "multi_shelf_unit";
  if ((shelfCount ?? 1) > 1) return "multiple_separate_shelves";
  return "single_shelf";
}

function inferMountingMethod(text: string, projectType: ProjectType | ""): MountingMethodOption | "" {
  if (/\b(freestanding|tabletop|desktop)\b/.test(text)) return "not_wall_mounted";
  if (projectType !== "simple_shelf") return "";
  if (/\b(french cleat|cleat)\b/.test(text)) return "cleat_or_french_cleat";
  if (/\b(l bracket|l-bracket|visible bracket|brackets?)\b/.test(text)) return "visible_l_brackets";
  if (/\b(floating|hidden bracket)\b/.test(text)) return "hidden_floating_brackets";
  return "not_sure";
}

function inferWallType(text: string, projectType: ProjectType | ""): WallTypeOption | "" {
  if (/\b(freestanding|tabletop|desktop)\b/.test(text)) return "not_wall_mounted";
  if (projectType !== "simple_shelf") return "";
  if (/\bdrywall\b/.test(text) && /\bstud/.test(text)) return "drywall_wood_studs";
  if (/\bdrywall\b/.test(text)) return "drywall_studs_unknown";
  if (/\btile\b/.test(text)) return "tile_wall";
  if (/\b(brick|concrete|masonry)\b/.test(text)) return "masonry_brick_concrete";
  return "not_sure";
}

function inferStudAccess(text: string, projectType: ProjectType | ""): StudAccessOption | "" {
  if (/\b(freestanding|tabletop|desktop)\b/.test(text)) return "not_wall_mounted";
  if (projectType !== "simple_shelf") return "";
  if (/\b(no studs|cannot attach to studs|can't attach to studs)\b/.test(text)) return "no";
  if (/\bstuds?\b/.test(text)) return "yes";
  return "not_sure";
}

function inferShelfLoad(text: string): ShelfLoadOption | "" {
  if (/\b(book|books|heavy|cookbook|cookbooks)\b/.test(text)) return "books_heavy_items";
  if (/\btowel|towels\b/.test(text)) return "towels";
  if (/\btoiletr|toothbrush|soap|small bathroom\b/.test(text)) return "toiletries";
  if (/\bdecor|picture|small plant|light\b/.test(text)) return "light_decor";
  return "";
}

function inferMoistureExposure(text: string): MoistureExposureOption | "" {
  if (/\b(shower|tub|sink|vanity)\b/.test(text)) return "near_sink_tub_shower";
  if (/\b(bathroom|humid|laundry)\b/.test(text)) return "bathroom_humid";
  if (/\b(outdoor|outside|porch|patio)\b/.test(text)) return "covered_outdoor";
  if (/\b(indoor|bedroom|office|living room|kitchen|garage)\b/.test(text)) return "normal_indoor";
  return "";
}

function inferInstallLocation(text: string): InstallLocationOption | "" {
  if (/\babove (?:the )?toilet\b/.test(text)) return "above_toilet";
  if (/\b(sink|vanity)\b/.test(text)) return "above_sink_vanity";
  if (/\b(desk|table)\b/.test(text)) return "above_desk_table";
  if (/\b(closet|pantry|laundry)\b/.test(text)) return "closet_pantry_laundry";
  if (/\bopen wall\b/.test(text)) return "open_wall";
  return "";
}

function inferSupportCount(text: string): SupportCountOption | "" {
  if (/\b(two|2)\s+(?:supports?|brackets?)\b/.test(text)) return "two";
  if (/\b(three|3)\s+(?:supports?|brackets?)\b/.test(text)) return "three";
  if (/\b([4-9]|\d{2,})\s+(?:supports?|brackets?)\b/.test(text)) return "more_than_three";
  if (/\b(freestanding|tabletop|desktop)\b/.test(text)) return "not_applicable";
  return "";
}

function inferCutStrategy(text: string): CutStrategyOption | "" {
  if (/\b(store cut|store-cut|precut|pre-cut|cut at the store)\b/.test(text)) return "store_cut_or_precut";
  if (/\b(i can cut|cut myself|own saw|have a saw|miter saw|circular saw|jigsaw)\b/.test(text)) return "cut_myself";
  return "";
}

function inferBoardSize(text: string, depth: number | undefined): BoardSizeOption | "" {
  if (/\b1x6\b/.test(text)) return "one_by_six";
  if (/\b1x8\b/.test(text)) return "one_by_eight";
  if (/\b1x10\b/.test(text)) return "one_by_ten";
  if (/\b3\/4\s*(?:in|inch|inches)?\s+plywood\b/.test(text)) return "three_quarter_plywood";
  if (/\b1\/2\s*(?:in|inch|inches)?\s+plywood\b/.test(text)) return "half_inch_plywood";
  if (depth !== undefined) {
    if (depth <= 6) return "one_by_six";
    if (depth <= 8) return "one_by_eight";
    if (depth <= 10) return "one_by_ten";
  }
  return "";
}

function inferTools(text: string): ToolOption[] {
  const tools: ToolOption[] = [];
  const add = (tool: ToolOption) => {
    if (!tools.includes(tool)) tools.push(tool);
  };

  if (/\btape measure\b/.test(text)) add("tape_measure");
  if (/\bpencil\b/.test(text)) add("pencil");
  if (/\bclamps?\b/.test(text)) add("clamps");
  if (/\bdrill\b/.test(text)) add("drill");
  if (/\bstud finder\b/.test(text)) add("stud_finder");
  if (/\blevel\b/.test(text)) add("level");
  if (/\bsafety glasses|ppe\b/.test(text)) add("safety_glasses");
  if (/\bjigsaw\b/.test(text)) add("jigsaw");
  if (/\bcircular saw\b/.test(text)) add("circular_saw");
  if (/\bmiter saw\b/.test(text)) add("miter_saw");
  if (/\bsander\b/.test(text)) add("sander");
  if (/\bpaint brush|brush\b/.test(text)) add("paint_brush");
  if (tools.length > 0 && !tools.includes("safety_glasses")) add("safety_glasses");

  return toolOptions.filter((tool) => tools.includes(tool));
}

function inferHigherRiskSpots(text: string): HigherRiskSpotOption[] {
  const spots: HigherRiskSpotOption[] = [];
  const add = (spot: HigherRiskSpotOption) => {
    if (!spots.includes(spot)) spots.push(spot);
  };

  if (/\b(bed|crib|seat|couch|sofa|sleeping area)\b/.test(text)) add("above_bed_crib_seat_or_sleeping_area");
  if (/\b(toilet|sink|walkway|hallway)\b/.test(text)) add("above_toilet_sink_or_walkway");
  if (/\b(child|kid|toddler|baby|nursery)\b/.test(text)) add("child_accessible");
  if (/\b(bathroom|shower|tub|bath|water)\b/.test(text)) add("near_water_shower_or_tub");
  if (/\b(heavy|books|glass|breakable)\b/.test(text)) add("holding_breakable_or_heavy_items");
  if (spots.length === 0 && /\bnone of these|no higher risk\b/.test(text)) add("none_of_these");

  return spots;
}

function inferBlockedReasons(text: string): NaturalLanguageIntakeBlockedReason[] {
  const reasons: NaturalLanguageIntakeBlockedReason[] = [];
  if (/\b(crib|bunk bed|loft bed|toddler bed|sleep surface|baby gate)\b/.test(text)) reasons.push("child_sleep_or_entrapment");
  if (/\b(chair|stool|bench|ladder|step stool|stairs|deck|platform)\b/.test(text)) reasons.push("load_bearing_or_climbable");
  if (/\b(overhead|ceiling mounted|suspended|garage storage rack)\b/.test(text)) reasons.push("overhead_or_suspended_storage");
  if (/\b(electrical|wire|wiring|outlet|plumbing|pipe|gas line)\b/.test(text)) reasons.push("electrical_or_plumbing_work");
  return Array.from(new Set(reasons));
}

function parseShelfSpacing(text: string): number | undefined {
  return parseNumericMatch(/\b(\d+(?:\.\d+)?|\d+\/\d+)\s*(?:in|inch|inches|")?\s*(?:apart|spacing|between shelves)\b/.exec(text)?.[1]);
}

function parseMountingHeight(idea: string): string {
  const match = /\b(?:around|about|at|mount(?:ed)?|height)\s+(\d+(?:\.\d+)?)\s*(?:in|inch|inches|")\s*(?:from floor|high)?/i.exec(idea);
  return match ? match[0].slice(0, 160) : "";
}

function inferWallObstructions(idea: string, text: string): string {
  const obstructionWords = ["tile", "mirror", "outlet", "plumbing", "towel bar", "vent", "cabinet", "door swing", "switch"];
  const matches = obstructionWords.filter((word) => text.includes(word));
  if (matches.length === 0) return "";
  return `Mentioned nearby condition(s): ${matches.join(", ")}. Original idea: ${idea}`.slice(0, 300);
}

function inferFinish(text: string): string {
  if (/\bpaint(?:ed)?\b/.test(text)) return "Painted finish.";
  if (/\bstain(?:ed)?\b/.test(text)) return "Stained finish.";
  if (/\bclear coat|polyurethane|seal(?:ed|ant)?\b/.test(text)) return "Clear protective finish.";
  return "";
}

function inferEdgeTreatment(text: string): string {
  if (/\bround(?:ed)? corners?\b/.test(text)) return "Rounded corners.";
  if (/\beased edges?\b/.test(text)) return "Eased edges.";
  if (/\bsanded edges?\b/.test(text)) return "Sanded edges.";
  return "";
}

function createReviewNotes(
  status: NaturalLanguageIntakeResult["status"],
  projectType: ProjectType | "",
  blockedReasons: NaturalLanguageIntakeBlockedReason[],
  higherRiskSpots: HigherRiskSpotOption[],
  mountingMethod: MountingMethodOption | "",
  wallType: WallTypeOption | "",
  studAccess: StudAccessOption | "",
): string[] {
  const notes: string[] = ["Drafted from a plain-language idea. Review every field before saving."];
  if (blockedReasons.length > 0) notes.push("This idea includes safety-sensitive terms that may block plan generation.");
  if (status === "concept_only") {
    notes.push("This looks woodworking-adjacent, but it is not a supported build-packet template yet. Choose a supported project type or keep it as concept review.");
  }
  if (status === "unsupported") {
    notes.push("This does not match the current woodworking planning templates. Choose a supported project type only if the idea can honestly fit one.");
  }
  if (projectType === "") notes.push("Project type could not be inferred confidently.");
  if (higherRiskSpots.length > 0) notes.push("Higher-risk mounting context was detected and needs manual review.");
  if (mountingMethod === "not_sure" || wallType === "not_sure" || studAccess === "not_sure") {
    notes.push("Mounting, wall type, and stud access still need confirmation.");
  }
  return notes;
}

function inferMissingFields(draft: NaturalLanguageIntakeDraft): NaturalLanguageIntakeMissingField[] {
  const missing: NaturalLanguageIntakeMissingField[] = [];
  if (!draft.project_type) missing.push("project_type");
  if (!draft.width_inches || !draft.depth_inches) missing.push("dimensions");
  if (!draft.material_type) missing.push("material");
  if (!draft.material_thickness_inches) missing.push("material_thickness");
  if (draft.tools_available.length === 0) missing.push("tools");
  if (draft.project_type === "simple_shelf" && (!draft.mounting_method || !draft.wall_type || !draft.stud_access)) {
    missing.push("mounting_details");
  }
  return missing;
}

function formatDimension(value: number | undefined): string {
  return value === undefined ? "" : Number(value.toFixed(3)).toString();
}
