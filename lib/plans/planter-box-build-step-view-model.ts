import type { BoardsmithBuildModel, BuildModelOperation } from "@/lib/build-model/build-model-schema";
import type { BuildStepCard, BuildStepPhaseLabel } from "@/lib/plans/build-step-cards";
import type { PlanterBoxCutDiagramViewModel, PlanterBoxCutPieceGroup } from "@/lib/plans/planter-box-cut-diagram-view-model";
import type { PlanterBoxStockBoardViewModel } from "@/lib/plans/planter-box-stock-board-view-model";
import { formatToolLabel, type Project, type ToolOption } from "@/lib/projects/types";

export type PlanterBoxBuildStepStatus = "needs_review" | "unsupported";

export type PlanterBoxBuildStepCard = BuildStepCard & {
  purpose: string;
  dimensionReferences: string[];
  warnings: string[];
  reviewBlockers: string[];
  printLabel: string;
};

export type PlanterBoxBuildStepViewModel = {
  projectType: string;
  status: PlanterBoxBuildStepStatus;
  stepCards: PlanterBoxBuildStepCard[];
  reviewBlockers: string[];
  warnings: string[];
  badges: string[];
  renderLabels: {
    title: "Build Guide";
    summary: string;
    fallbackMessage: string | null;
  };
};

type PlanterBoxBuildStepProjectInput = Pick<Project, "project_type" | "tools_available">;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function operationFor(buildModel: BoardsmithBuildModel, id: string): BuildModelOperation | null {
  return buildModel.operations.find((operation) => operation.id === id) ?? null;
}

function selectedTools(project: PlanterBoxBuildStepProjectInput, preferred: ToolOption[], fallback: string): string[] {
  const available = new Set(project.tools_available);
  const selected = preferred.filter((tool) => available.has(tool));
  return selected.length > 0 ? selected.map(formatToolLabel) : [fallback];
}

function toolsFor(operation: BuildModelOperation | null, fallback: string[]): string[] {
  return uniqueStrings(operation?.toolNames.length ? operation.toolNames : fallback).map(formatToolLabel);
}

function estimateFor(operation: BuildModelOperation | null): string | null {
  const minutes = operation?.estimatedMinutes ?? null;
  if (!minutes) return null;
  if (minutes < 60) return `${minutes.toString()} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours.toString()} hr` : `${hours.toString()} hr ${remainder.toString()} min`;
}

function dimensionReferenceFor(piece: PlanterBoxCutPieceGroup): string {
  return `${piece.printLabel}: ${piece.quantityLabel}, ${piece.dimensionsLabel}`;
}

function operationPartLabels(cutViewModel: PlanterBoxCutDiagramViewModel, operation: BuildModelOperation | null): string[] {
  if (!operation) return [];

  return uniqueStrings(
    operation.pieceIds.map((pieceId) => {
      const group = cutViewModel.pieceGroups.find((piece) => piece.pieceIds.includes(pieceId));
      return group?.printLabel ?? "";
    }),
  );
}

function connectionReviewMessages(buildModel: BoardsmithBuildModel): string[] {
  return uniqueStrings([
    ...buildModel.connections.flatMap((connection) => connection.notes),
    ...buildModel.connections.flatMap((connection) => connection.safetyNotes),
  ]);
}

function reviewBlockersFor(params: {
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
  stockBoardViewModel: PlanterBoxStockBoardViewModel;
}): string[] {
  return uniqueStrings([
    ...(params.cutViewModel.missingDimensions.length > 0 ? ["Confirm every planter panel dimension before cutting."] : []),
    ...params.cutViewModel.warnings.filter((message) => /dimension|drainage|liner|outdoor|soil|water|finish|connection/i.test(message)),
    ...params.stockBoardViewModel.reviewReasons.filter((message) => /stock|board|length|outdoor|drainage|liner|finish|fastener|soil|water|connection/i.test(message)),
    ...params.buildModel.unresolvedQuestions.filter((question) => /drainage|liner|connection|fastener|finish|outdoor|soil|water/i.test(question)),
    "Confirm drainage-hole layout and liner approach before final assembly.",
    "Confirm screw length, spacing, edge distance, and outdoor suitability before fastening panels.",
  ]);
}

function card(params: {
  id: string;
  stepNumber: number;
  title: string;
  purpose: string;
  instructions: string;
  phaseLabel: BuildStepPhaseLabel;
  tools: string[];
  estimatedTimeLabel?: string | null;
  safetyNote?: string | null;
  relatedOperationTitle?: string | null;
  relatedPieceLabels?: string[];
  dimensionReferences?: string[];
  warnings?: string[];
  reviewBlockers?: string[];
  printLabel?: string;
}): PlanterBoxBuildStepCard {
  return {
    id: params.id,
    stepNumber: params.stepNumber,
    title: params.title,
    purpose: params.purpose,
    instructions: params.instructions,
    phaseLabel: params.phaseLabel,
    tools: params.tools,
    estimatedTimeLabel: params.estimatedTimeLabel ?? null,
    safetyNote: params.safetyNote ?? null,
    relatedOperationTitle: params.relatedOperationTitle ?? null,
    relatedPieceLabels: params.relatedPieceLabels ?? [],
    dimensionReferences: params.dimensionReferences ?? [],
    warnings: params.warnings ?? [],
    reviewBlockers: params.reviewBlockers ?? [],
    printLabel: params.printLabel ?? params.title,
  };
}

function buildCards(params: {
  project: PlanterBoxBuildStepProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
  reviewBlockers: string[];
  warnings: string[];
}): PlanterBoxBuildStepCard[] {
  const { project, buildModel, cutViewModel, reviewBlockers, warnings } = params;
  const cutOperation = operationFor(buildModel, "cut_planter_panels");
  const drainageOperation = operationFor(buildModel, "drill_drainage_holes");
  const dryFitOperation = operationFor(buildModel, "dry_fit_planter_panels");
  const fastenOperation = operationFor(buildModel, "fasten_planter_panels");
  const finishOperation = operationFor(buildModel, "apply_exterior_finish");
  const finalReviewOperation = operationFor(buildModel, "review_drainage_finish_and_connections");
  const panelLabels = cutViewModel.pieceGroups.map((piece) => piece.printLabel);
  const panelReferences = cutViewModel.pieceGroups.map(dimensionReferenceFor);
  const bottomPanelLabels = operationPartLabels(cutViewModel, drainageOperation);
  const allConnectionWarnings = connectionReviewMessages(buildModel);

  return [
    card({
      id: "planter_review_layout",
      stepNumber: 1,
      title: "Review planter layout before cutting",
      purpose: "Make the planter packet usable as a planning aid before any irreversible work starts.",
      instructions:
        "Review overall width, height, depth, material thickness, panel labels, drainage approach, liner choice, and outdoor exposure before buying or cutting material.",
      phaseLabel: "Inspect / review",
      tools: selectedTools(project, ["tape_measure", "pencil"], "layout tools to confirm"),
      relatedPieceLabels: panelLabels,
      dimensionReferences: panelReferences,
      reviewBlockers,
      warnings,
      safetyNote: "Boardsmith cannot verify material condition, outdoor durability, soil/water weight, or site conditions.",
      printLabel: "Review planter layout",
    }),
    card({
      id: "planter_cut_panels",
      stepNumber: 2,
      title: "Cut planter panels",
      purpose: "Use the modeled planter panels as the cut reference after review.",
      instructions:
        "Cut the front, back, side, and bottom panels only after comparing each modeled panel with the actual stock board width, thickness, and final layout.",
      phaseLabel: "Cut",
      tools: toolsFor(cutOperation, selectedTools(project, ["tape_measure", "pencil", "circular_saw", "miter_saw", "jigsaw"], "cutting tools to confirm")),
      estimatedTimeLabel: estimateFor(cutOperation),
      relatedOperationTitle: cutOperation?.title ?? null,
      relatedPieceLabels: panelLabels,
      dimensionReferences: panelReferences,
      reviewBlockers: cutViewModel.missingDimensions.length > 0 ? ["Resolve missing panel dimensions before cutting."] : [],
      warnings: cutViewModel.warnings,
      safetyNote: "Measure twice before cutting and stop if stock-board layout changes the panel plan.",
      printLabel: "Cut planter panels",
    }),
    card({
      id: "planter_drill_drainage",
      stepNumber: 3,
      title: "Drill drainage holes in bottom panel",
      purpose: "Keep drainage decisions tied to the bottom panel before final assembly.",
      instructions:
        "Choose a drainage-hole layout, confirm liner approach, then drill the bottom panel while it can still be safely clamped and supported.",
      phaseLabel: "Drill",
      tools: toolsFor(drainageOperation, selectedTools(project, ["drill", "clamps"], "drilling tools to confirm")),
      estimatedTimeLabel: estimateFor(drainageOperation),
      relatedOperationTitle: drainageOperation?.title ?? null,
      relatedPieceLabels: bottomPanelLabels.length > 0 ? bottomPanelLabels : panelLabels.filter((label) => /bottom/i.test(label)),
      dimensionReferences: panelReferences.filter((reference) => /bottom/i.test(reference)),
      reviewBlockers: ["Confirm drainage-hole layout and liner approach before final assembly."],
      warnings: warnings.filter((warning) => /drainage|liner|bottom/i.test(warning)),
      safetyNote: drainageOperation?.safetyNotes[0] ?? "Clamp the bottom panel before drilling and wear eye protection.",
      printLabel: "Drill drainage",
    }),
    card({
      id: "planter_dry_fit_connections",
      stepNumber: 4,
      title: "Dry fit planter box and confirm panel connections",
      purpose: "Keep connection and fastener choices explicit before assembly.",
      instructions:
        "Dry-fit the front, back, side, and bottom panels square; confirm screw length, spacing, pilot holes, edge distance, and outdoor fastener suitability before fastening.",
      phaseLabel: "Inspect / review",
      tools: toolsFor(dryFitOperation, selectedTools(project, ["tape_measure", "pencil", "drill", "clamps"], "connection review tools to confirm")),
      estimatedTimeLabel: estimateFor(dryFitOperation),
      relatedOperationTitle: dryFitOperation?.title ?? fastenOperation?.title ?? null,
      relatedPieceLabels: panelLabels,
      dimensionReferences: panelReferences,
      reviewBlockers: ["Confirm screw length, spacing, edge distance, and outdoor suitability before fastening panels."],
      warnings: uniqueStrings([...allConnectionWarnings, ...(fastenOperation?.safetyNotes ?? [])]),
      safetyNote: fastenOperation?.safetyNotes[2] ?? "Drill pilot holes near board ends and review splitting risk before fastening.",
      printLabel: "Review panel connections",
    }),
    card({
      id: "planter_apply_finish_liner",
      stepNumber: 5,
      title: "Apply exterior finish or liner",
      purpose: "Handle outdoor exposure before the planter is used.",
      instructions:
        "Apply an outdoor-appropriate finish or liner only after confirming product compatibility with soil, plants, cure time, fasteners, and the final drainage plan.",
      phaseLabel: "Finish",
      tools: toolsFor(finishOperation, selectedTools(project, ["paint_brush", "sander"], "finish tools to confirm")),
      estimatedTimeLabel: estimateFor(finishOperation),
      relatedOperationTitle: finishOperation?.title ?? null,
      relatedPieceLabels: operationPartLabels(cutViewModel, finishOperation).length > 0 ? operationPartLabels(cutViewModel, finishOperation) : panelLabels,
      warnings: warnings.filter((warning) => /finish|outdoor|water|soil|plant|liner/i.test(warning)),
      safetyNote: finishOperation?.safetyNotes[0] ?? "Follow product labels and allow finish to cure before use.",
      printLabel: "Finish/liner review",
    }),
    card({
      id: "planter_final_review",
      stepNumber: 6,
      title: "Final planter review before use",
      purpose: "Preserve the planning-aid boundary before soil, water, and outdoor exposure are involved.",
      instructions:
        "Inspect panel fit, fasteners, drainage, liner, finish cure, edge condition, and placement before adding plants, soil, or water.",
      phaseLabel: "Inspect / review",
      tools: toolsFor(finalReviewOperation, selectedTools(project, ["tape_measure", "pencil"], "review tools to confirm")),
      estimatedTimeLabel: estimateFor(finalReviewOperation),
      relatedOperationTitle: finalReviewOperation?.title ?? null,
      relatedPieceLabels: panelLabels,
      warnings: uniqueStrings([...buildModel.safety.flags.map((flag) => flag.message), ...buildModel.safety.disclaimers, ...(finalReviewOperation?.safetyNotes ?? [])]),
      safetyNote: finalReviewOperation?.safetyNotes[0] ?? "Use your own judgment before filling or placing the planter.",
      printLabel: "Final review",
    }),
  ];
}

function summaryFor(status: PlanterBoxBuildStepStatus, reviewBlockers: string[]): string {
  if (status === "unsupported") return "Build-step view model is available for planter-box build models only.";
  if (reviewBlockers.length > 0) return "Planter Build Guide needs review before this is a trusted build sequence.";
  return "Planter Build Guide from Build Model panels and operations.";
}

export function createPlanterBoxBuildStepViewModel(params: {
  project: PlanterBoxBuildStepProjectInput;
  buildModel: BoardsmithBuildModel;
  cutViewModel: PlanterBoxCutDiagramViewModel;
  stockBoardViewModel: PlanterBoxStockBoardViewModel;
}): PlanterBoxBuildStepViewModel {
  const { project, buildModel, cutViewModel, stockBoardViewModel } = params;
  const unsupported = project.project_type !== "planter_box" || buildModel.project.projectType !== "planter_box";

  if (unsupported) {
    return {
      projectType: project.project_type,
      status: "unsupported",
      stepCards: [],
      reviewBlockers: [],
      warnings: [],
      badges: ["Unsupported"],
      renderLabels: {
        title: "Build Guide",
        summary: summaryFor("unsupported", []),
        fallbackMessage: "Build-step view model is available for planter-box build models only.",
      },
    };
  }

  const warnings = uniqueStrings([
    ...cutViewModel.warnings,
    ...stockBoardViewModel.reviewReasons,
    ...stockBoardViewModel.buyingNotes,
    ...buildModel.unresolvedQuestions,
    ...connectionReviewMessages(buildModel),
  ]);
  const reviewBlockers = reviewBlockersFor({ buildModel, cutViewModel, stockBoardViewModel });
  const stepCards = buildCards({ project, buildModel, cutViewModel, reviewBlockers, warnings });

  return {
    projectType: project.project_type,
    status: "needs_review",
    stepCards,
    reviewBlockers,
    warnings,
    badges: ["Needs review", "Panel connections", ...(stepCards.length > 0 ? ["Build Model steps"] : [])],
    renderLabels: {
      title: "Build Guide",
      summary: summaryFor("needs_review", reviewBlockers),
      fallbackMessage: reviewBlockers[0] ?? null,
    },
  };
}
