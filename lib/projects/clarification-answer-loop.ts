import { createClarificationGateDecision, type ClarificationGateDecision } from "@/lib/projects/clarification-gate";
import {
  formatManagedOptionLine,
  formatManagedTextLine,
  mergeManagedSection,
  PLANNING_PREFERENCES_HEADING,
  STRUCTURED_INTAKE_HEADING,
} from "@/lib/projects/managed-intake-sections";
import {
  cutStrategyLabels,
  cutStrategyOptions,
  higherRiskSpotLabels,
  higherRiskSpotOptions,
  installLocationLabels,
  installLocationOptions,
  moistureExposureLabels,
  moistureExposureOptions,
  mountingMethodLabels,
  mountingMethodOptions,
  projectClarificationAnswerUpdateSchema,
  shelfLayoutOptions,
  shelfLoadLabels,
  shelfLoadOptions,
  studAccessLabels,
  studAccessOptions,
  supportCountLabels,
  supportCountOptions,
  toolOptions,
  wallTypeLabels,
  wallTypeOptions,
  type Project,
  type ProjectClarificationAnswerUpdate,
} from "@/lib/projects/types";

export type ClarificationAnswerLoopResult = {
  update: ProjectClarificationAnswerUpdate;
  answeredQuestionIds: string[];
  manualQuestionIds: string[];
  nextDecision: ClarificationGateDecision;
};

const answerableQuestionIds = new Set([
  "finished_width",
  "finished_height",
  "finished_depth",
  "material_thickness",
  "material_type",
  "shelf_layout",
  "shelf_count",
  "shelf_height_impossible",
  "mounting_support_method",
  "wall_fastener_context",
  "expected_load_or_use",
  "finish_exposure",
  "tools_available",
]);

function optionalNumber(formData: FormData, name: string): number | undefined {
  const value = formData.get(name);
  if (typeof value !== "string" || value.trim() === "") return undefined;
  return Number(value);
}

function optionalText(formData: FormData, name: string, maxLength: number): string | undefined {
  const value = formData.get(name);
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim().slice(0, maxLength);
  return trimmed || undefined;
}

function optionValue<T extends string>(formData: FormData, name: string, options: readonly T[]): T | undefined {
  const value = formData.get(name);
  return typeof value === "string" && options.includes(value as T) ? (value as T) : undefined;
}

function optionValues<T extends string>(formData: FormData, name: string, options: readonly T[]): T[] {
  return formData.getAll(name).filter((value): value is T => typeof value === "string" && options.includes(value as T));
}

function stripUndefinedValues<T extends Record<string, unknown>>(input: T): T {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as T;
}

function pushAnswered(answeredQuestionIds: Set<string>, questionId: string, value: unknown): void {
  if (Array.isArray(value) ? value.length > 0 : value !== undefined) answeredQuestionIds.add(questionId);
}

export function answerableClarificationQuestionIds(decision: ClarificationGateDecision): string[] {
  return decision.questions.map((question) => question.id).filter((id) => answerableQuestionIds.has(id));
}

export function createClarificationAnswerUpdate(project: Project, formData: FormData): ClarificationAnswerLoopResult {
  const answeredQuestionIds = new Set<string>();

  const widthInches = optionalNumber(formData, "width_inches");
  const heightInches = optionalNumber(formData, "height_inches");
  const depthInches = optionalNumber(formData, "depth_inches");
  const materialThicknessInches = optionalNumber(formData, "material_thickness_inches");
  const materialType = optionalText(formData, "material_type", 120);
  const shelfLayout = optionValue(formData, "shelf_layout", shelfLayoutOptions);
  const shelfCount = optionalNumber(formData, "shelf_count");
  const shelfSpacingInches = optionalNumber(formData, "shelf_spacing_inches");
  const toolsAvailable = optionValues(formData, "tools_available", toolOptions);
  const mountingMethod = optionValue(formData, "mounting_method", mountingMethodOptions);
  const wallType = optionValue(formData, "wall_type", wallTypeOptions);
  const studAccess = optionValue(formData, "stud_access", studAccessOptions);
  const shelfLoad = optionValue(formData, "shelf_load", shelfLoadOptions);
  const moistureExposure = optionValue(formData, "moisture_exposure", moistureExposureOptions);
  const installLocation = optionValue(formData, "install_location", installLocationOptions);
  const plannedMountingHeight = optionalText(formData, "planned_mounting_height", 160);
  const supportCount = optionValue(formData, "support_count", supportCountOptions);
  const higherRiskSpots = optionValues(formData, "higher_risk_spots", higherRiskSpotOptions);
  const wallObstructions = optionalText(formData, "wall_obstructions", 300);
  const cutStrategy = optionValue(formData, "cut_strategy", cutStrategyOptions);
  const finishPreference = optionalText(formData, "finish_preference", 240);
  const edgeTreatment = optionalText(formData, "edge_treatment", 240);

  pushAnswered(answeredQuestionIds, "finished_width", widthInches);
  pushAnswered(answeredQuestionIds, "finished_height", heightInches);
  pushAnswered(answeredQuestionIds, "finished_depth", depthInches);
  pushAnswered(answeredQuestionIds, "material_thickness", materialThicknessInches);
  pushAnswered(answeredQuestionIds, "material_type", materialType);
  pushAnswered(answeredQuestionIds, "shelf_layout", shelfLayout);
  pushAnswered(answeredQuestionIds, "shelf_count", shelfCount);
  pushAnswered(answeredQuestionIds, "shelf_height_impossible", heightInches);
  pushAnswered(answeredQuestionIds, "tools_available", toolsAvailable);
  pushAnswered(answeredQuestionIds, "mounting_support_method", mountingMethod ?? supportCount ?? plannedMountingHeight);
  pushAnswered(answeredQuestionIds, "wall_fastener_context", wallType ?? studAccess ?? wallObstructions);
  pushAnswered(answeredQuestionIds, "expected_load_or_use", shelfLoad ?? installLocation ?? (higherRiskSpots.length > 0 ? higherRiskSpots : undefined));
  pushAnswered(answeredQuestionIds, "finish_exposure", moistureExposure ?? finishPreference ?? edgeTreatment);

  const intendedUseLines = [
    formatManagedOptionLine(mountingMethod, mountingMethodLabels, "Mounting method"),
    formatManagedOptionLine(wallType, wallTypeLabels, "Wall type"),
    formatManagedOptionLine(studAccess, studAccessLabels, "Stud access"),
    formatManagedOptionLine(shelfLoad, shelfLoadLabels, "What it will hold"),
    formatManagedOptionLine(moistureExposure, moistureExposureLabels, "Moisture exposure"),
    formatManagedOptionLine(installLocation, installLocationLabels, "Install location"),
    formatManagedTextLine(plannedMountingHeight, "Planned mounting height", 160),
    formatManagedOptionLine(supportCount, supportCountLabels, "Support/bracket count"),
    ...higherRiskSpots.map((value) => `Higher-risk spot: ${higherRiskSpotLabels[value]}`),
    formatManagedTextLine(wallObstructions, "Nearby wall conditions or obstructions", 300),
  ].filter((line): line is string => Boolean(line));
  const styleNoteLines = [
    formatManagedOptionLine(cutStrategy, cutStrategyLabels, "Cut plan"),
    formatManagedTextLine(finishPreference, "Finish preference", 240),
    formatManagedTextLine(edgeTreatment, "Edge treatment", 240),
  ].filter((line): line is string => Boolean(line));

  const update = projectClarificationAnswerUpdateSchema.parse(
    stripUndefinedValues({
      width_inches: widthInches,
      height_inches: heightInches,
      depth_inches: depthInches,
      material_thickness_inches: materialThicknessInches,
      material_type: materialType,
      shelf_layout: shelfLayout,
      shelf_count: shelfCount,
      shelf_spacing_inches: shelfSpacingInches,
      tools_available: toolsAvailable.length > 0 ? toolsAvailable : undefined,
      intended_use: intendedUseLines.length > 0 ? mergeManagedSection(project.intended_use, STRUCTURED_INTAKE_HEADING, intendedUseLines) : undefined,
      style_notes: styleNoteLines.length > 0 ? mergeManagedSection(project.style_notes, PLANNING_PREFERENCES_HEADING, styleNoteLines) : undefined,
    }),
  );

  const nextDecision = createClarificationGateDecision({
    ...project,
    ...update,
  });
  const manualQuestionIds = nextDecision.questions.map((question) => question.id).filter((id) => !answerableQuestionIds.has(id));

  return {
    update,
    answeredQuestionIds: [...answeredQuestionIds],
    manualQuestionIds,
    nextDecision,
  };
}
