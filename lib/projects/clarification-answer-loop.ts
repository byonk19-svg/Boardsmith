import { createClarificationGateDecision, type ClarificationGateDecision } from "@/lib/projects/clarification-gate";
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

function optionLine<T extends string>(value: T | undefined, labels: Record<T, string>, label: string): string | undefined {
  return value ? `${label}: ${labels[value]}` : undefined;
}

function textLine(value: string | undefined, label: string): string | undefined {
  return value ? `${label}: ${value}` : undefined;
}

function mergeManagedSection(existing: string, heading: string, lines: string[]): string {
  const baseSections = existing
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter((section) => section.length > 0 && section !== heading && !section.startsWith(`${heading}\n`));
  const managedSection = lines.length > 0 ? `${heading}\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
  return [...baseSections, managedSection].filter(Boolean).join("\n\n");
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
    optionLine(mountingMethod, mountingMethodLabels, "Mounting method"),
    optionLine(wallType, wallTypeLabels, "Wall type"),
    optionLine(studAccess, studAccessLabels, "Stud access"),
    optionLine(shelfLoad, shelfLoadLabels, "What it will hold"),
    optionLine(moistureExposure, moistureExposureLabels, "Moisture exposure"),
    optionLine(installLocation, installLocationLabels, "Install location"),
    textLine(plannedMountingHeight, "Planned mounting height"),
    optionLine(supportCount, supportCountLabels, "Support/bracket count"),
    ...higherRiskSpots.map((value) => `Higher-risk spot: ${higherRiskSpotLabels[value]}`),
    textLine(wallObstructions, "Nearby wall conditions or obstructions"),
  ].filter((line): line is string => Boolean(line));
  const styleNoteLines = [
    optionLine(cutStrategy, cutStrategyLabels, "Cut plan"),
    textLine(finishPreference, "Finish preference"),
    textLine(edgeTreatment, "Edge treatment"),
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
      intended_use: intendedUseLines.length > 0 ? mergeManagedSection(project.intended_use, "Structured intake", intendedUseLines) : undefined,
      style_notes: styleNoteLines.length > 0 ? mergeManagedSection(project.style_notes, "Planning preferences", styleNoteLines) : undefined,
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
