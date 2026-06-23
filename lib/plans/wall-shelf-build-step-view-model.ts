import type { BoardsmithBuildModel, BuildModelOperation } from "@/lib/build-model/build-model-schema";
import type { BuildStepCard, BuildStepPhaseLabel } from "@/lib/plans/build-step-cards";
import type { WallShelfCutDiagramViewModel, WallShelfCutPieceGroup } from "@/lib/plans/wall-shelf-cut-diagram-view-model";
import type { WallShelfDiagramViewModel } from "@/lib/plans/wall-shelf-diagram-view-model";
import type { Project } from "@/lib/projects/types";
import { formatToolLabel, type ToolOption } from "@/lib/projects/types";
import { createWallShelfSupportGuidance, type WallShelfSupportGuidance } from "@/lib/projects/wall-shelf-support-guidance";

export type WallShelfBuildStepStatus = "ready" | "needs_review" | "unsupported";

export type WallShelfBuildStepCard = BuildStepCard & {
  purpose: string;
  dimensionReferences: string[];
  warnings: string[];
  reviewBlockers: string[];
  printLabel: string;
};

export type WallShelfBuildStepViewModel = {
  projectType: string;
  status: WallShelfBuildStepStatus;
  stepCards: WallShelfBuildStepCard[];
  reviewBlockers: string[];
  warnings: string[];
  badges: string[];
  renderLabels: {
    title: "Build Guide";
    summary: string;
    fallbackMessage: string | null;
  };
};

type WallShelfBuildStepProjectInput = Pick<
  Project,
  | "project_type"
  | "tools_available"
  | "shelf_layout"
  | "shelf_count"
  | "width_inches"
  | "height_inches"
  | "depth_inches"
  | "material_thickness_inches"
  | "style_notes"
  | "intended_use"
>;

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function operationFor(buildModel: BoardsmithBuildModel, id: string): BuildModelOperation | null {
  return buildModel.operations.find((operation) => operation.id === id) ?? null;
}

function selectedTools(project: WallShelfBuildStepProjectInput, preferred: ToolOption[], fallback: string): string[] {
  const available = new Set(project.tools_available);
  const selected = preferred.filter((tool) => available.has(tool));
  return selected.length > 0 ? selected : [fallback];
}

function toolsFor(_project: WallShelfBuildStepProjectInput, operation: BuildModelOperation | null, fallback: string[] = ["tools to confirm"]): string[] {
  const toolNames = operation?.toolNames.length ? operation.toolNames : fallback;
  return uniqueStrings(toolNames).map(formatToolLabel);
}

function projectDimensionReferences(project: WallShelfBuildStepProjectInput, diagramViewModel: WallShelfDiagramViewModel): string[] {
  return [
    diagramViewModel.dimensions.width.label,
    diagramViewModel.dimensions.depth.label,
    ...(project.shelf_layout === "single_shelf" || project.shelf_count === 1 ? [] : [diagramViewModel.dimensions.height.label]),
    diagramViewModel.dimensions.boardThickness.label,
  ];
}

function operationPartLabels(cutViewModel: WallShelfCutDiagramViewModel, operation: BuildModelOperation | null): string[] {
  if (!operation) return [];
  return uniqueStrings(
    operation.pieceIds.map((pieceId) => {
      const group = cutViewModel.pieceGroups.find((piece) => piece.pieceIds.includes(pieceId));
      return group?.printLabel ?? "";
    }),
  );
}

function estimateFor(operation: BuildModelOperation | null): string | null {
  const minutes = operation?.estimatedMinutes ?? null;
  if (!minutes) return null;
  if (minutes < 60) return `${minutes.toString()} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours.toString()} hr` : `${hours.toString()} hr ${remainder.toString()} min`;
}

function dimensionReferenceFor(piece: WallShelfCutPieceGroup): string {
  return `${piece.printLabel}: ${piece.quantityLabel}, ${piece.dimensionsLabel}`;
}

function shelfGroups(cutViewModel: WallShelfCutDiagramViewModel): WallShelfCutPieceGroup[] {
  return cutViewModel.pieceGroups.filter((piece) => piece.role === "shelf_board");
}

function supportGroups(cutViewModel: WallShelfCutDiagramViewModel): WallShelfCutPieceGroup[] {
  return cutViewModel.pieceGroups.filter((piece) => piece.role === "support_frame");
}

function supportPlaceholderGroups(cutViewModel: WallShelfCutDiagramViewModel): WallShelfCutPieceGroup[] {
  return cutViewModel.pieceGroups.filter((piece) => piece.role === "support_frame_placeholder");
}

function supportFrameModeled(cutViewModel: WallShelfCutDiagramViewModel): boolean {
  return supportGroups(cutViewModel).some((piece) => !piece.needsReview);
}

function supportGuidanceText(guidance: WallShelfSupportGuidance): string {
  return uniqueStrings([guidance.mountingMethodSentence ?? "", guidance.supportCountSentence ?? ""]).join(" ");
}

function reviewSupportInstruction(baseInstruction: string, guidance: WallShelfSupportGuidance): string {
  const guidanceText = supportGuidanceText(guidance);
  return guidanceText ? `${baseInstruction} ${guidanceText} Keep these as review inputs, not safety approval.` : baseInstruction;
}

function isConnectedLayout(project: WallShelfBuildStepProjectInput, diagramViewModel: WallShelfDiagramViewModel): boolean {
  return diagramViewModel.layout === "connected_shelf_unit" || (project.shelf_layout === "multi_shelf_unit" && Boolean(project.shelf_count && project.shelf_count > 1));
}

function reviewBlockersFor(params: {
  diagramViewModel: WallShelfDiagramViewModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  connected: boolean;
  supportModeled: boolean;
}): string[] {
  const heightNeedsReview =
    params.diagramViewModel.dimensions.height.status === "needs_review" ||
    params.diagramViewModel.missingDimensions.some((message) => /height/i.test(message));
  const supportNeedsReview = params.connected && (!params.supportModeled || params.diagramViewModel.supportFrameReview.needsReview);
  const cutDimensionReview = params.cutViewModel.missingDimensions.length > 0 || params.cutViewModel.warnings.some((message) => /height|dimension|missing/i.test(message));

  return uniqueStrings([
    ...(heightNeedsReview ? ["Add valid total height before treating this as a build-ready sequence."] : []),
    ...(cutDimensionReview ? ["Review missing or invalid cut dimensions before cutting."] : []),
    ...(supportNeedsReview ? ["Add support/frame details before assembly or mounting."] : []),
    ...params.diagramViewModel.warnings.filter((message) => /height|support|frame|connected|missing/i.test(message)),
    ...params.cutViewModel.warnings.filter((message) => /height|support|frame|missing|dimension/i.test(message)),
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
}): WallShelfBuildStepCard {
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
  project: WallShelfBuildStepProjectInput;
  buildModel: BoardsmithBuildModel;
  diagramViewModel: WallShelfDiagramViewModel;
  cutViewModel: WallShelfCutDiagramViewModel;
  reviewBlockers: string[];
  connected: boolean;
  supportModeled: boolean;
}): WallShelfBuildStepCard[] {
  const { project, buildModel, diagramViewModel, cutViewModel, reviewBlockers, connected, supportModeled } = params;
  const cutOperation = operationFor(buildModel, "cut_shelf_board");
  const sandOperation = operationFor(buildModel, "sand_shelf_board");
  const supportOperation = operationFor(buildModel, "confirm_support_frame_design");
  const mountingOperation = operationFor(buildModel, "inspect_mounting_location");
  const shelves = shelfGroups(cutViewModel);
  const supports = supportGroups(cutViewModel);
  const supportPlaceholders = supportPlaceholderGroups(cutViewModel);
  const supportGuidance = createWallShelfSupportGuidance(project);
  const shelfReferences = shelves.map(dimensionReferenceFor);
  const supportReferences = [...supports, ...supportPlaceholders].map(dimensionReferenceFor);
  const shelfLabels = shelves.map((piece) => piece.printLabel);
  const allPieceLabels = uniqueStrings([...shelfLabels, ...supports.map((piece) => piece.printLabel), ...supportPlaceholders.map((piece) => piece.printLabel)]);
  const hasBlockingReview = reviewBlockers.length > 0;
  const shelfCutReviewReasons = uniqueStrings(shelves.flatMap((piece) => piece.reviewReasons).filter((reason) => /dimension|missing|height|length|width|thickness/i.test(reason)));
  const shelfCutNeedsReview = shelfCutReviewReasons.length > 0;
  const cards: WallShelfBuildStepCard[] = [
    card({
      id: "review_dimensions_support",
      stepNumber: 1,
      title: hasBlockingReview ? "Review dimensions and support method before building" : "Review dimensions and support method",
      purpose: "Make the plan safe to use before any cutting or assembly starts.",
      instructions: hasBlockingReview
        ? "Resolve the listed review items before treating these steps as a complete build sequence."
        : reviewSupportInstruction("Confirm shelf width, depth, board thickness, and the support method against the actual space and material.", supportGuidance),
      phaseLabel: "Inspect / review",
      tools: toolsFor(project, mountingOperation, selectedTools(project, ["tape_measure", "pencil"], "measurement tools to confirm")),
      relatedOperationTitle: mountingOperation?.title ?? null,
      relatedPieceLabels: allPieceLabels,
      dimensionReferences: projectDimensionReferences(project, diagramViewModel),
      reviewBlockers,
      warnings: uniqueStrings([...diagramViewModel.warnings, ...cutViewModel.warnings]).slice(0, 8),
      safetyNote: "Boardsmith cannot verify load capacity, wall safety, anchors, studs, or site conditions.",
      printLabel: "Review before building",
    }),
    card({
      id: "cut_shelf_boards",
      stepNumber: 2,
      title: shelfCutNeedsReview ? "Review shelf board cuts before cutting" : "Cut shelf board pieces",
      purpose: "Use the modeled shelf-board pieces as the cut reference.",
      instructions:
        shelfCutNeedsReview
          ? "Do not cut until every shelf-board dimension and quantity has been checked against the review notes."
          : "Cut the shelf board pieces only after checking the dimensions against your actual lumber.",
      phaseLabel: "Cut",
      tools: toolsFor(project, cutOperation, selectedTools(project, ["tape_measure", "pencil"], "cutting tools to confirm")),
      estimatedTimeLabel: estimateFor(cutOperation),
      relatedOperationTitle: cutOperation?.title ?? null,
      relatedPieceLabels: operationPartLabels(cutViewModel, cutOperation).length > 0 ? operationPartLabels(cutViewModel, cutOperation) : shelfLabels,
      dimensionReferences: shelfReferences,
      reviewBlockers: shelfCutReviewReasons,
      warnings: cutViewModel.warnings.filter((message) => /cut|dimension|missing|height|finish|humidity/i.test(message)),
      safetyNote: "Measure twice before cutting and stop if any dimension is missing or suspect.",
      printLabel: "Cut shelf boards",
    }),
  ];

  if (connected) {
    cards.push(
      card({
        id: supportModeled ? "prepare_support_frame_pieces" : "review_support_frame_design",
        stepNumber: cards.length + 1,
        title: supportModeled ? "Prepare support/frame pieces" : "Add support/frame details before assembly",
        purpose: supportModeled
          ? "Prepare the modeled pieces that connect or support the shelf unit."
          : "Keep the connected unit from looking complete before the support design exists.",
        instructions: supportModeled
          ? "Prepare the modeled support/frame pieces and verify how they locate the shelves before assembly."
          : "Choose verified side supports, frame, cleat, brackets, or another support method before assembling or mounting this connected shelf unit.",
        phaseLabel: supportModeled ? "Measure / mark" : "Inspect / review",
        tools: toolsFor(project, supportOperation, selectedTools(project, ["tape_measure", "pencil"], "support review tools to confirm")),
        estimatedTimeLabel: estimateFor(supportOperation),
        relatedOperationTitle: supportOperation?.title ?? null,
        relatedPieceLabels: uniqueStrings([...supports.map((piece) => piece.printLabel), ...supportPlaceholders.map((piece) => piece.printLabel)]),
        dimensionReferences: supportReferences,
        reviewBlockers: supportModeled ? [] : ["Confirm support/frame design before assembly.", ...supportPlaceholders.flatMap((piece) => piece.reviewReasons)],
        warnings: diagramViewModel.supportFrameReview.reasons,
        safetyNote: supportModeled ? "Verify support/frame fit before loading or mounting." : "Do not treat shelf boards alone as a complete connected shelf unit.",
        printLabel: supportModeled ? "Prepare support/frame pieces" : "Support/frame review",
      }),
    );
  }

  cards.push(
    card({
      id: "dry_fit_layout",
      stepNumber: cards.length + 1,
      title: connected && !supportModeled ? "Dry fit layout after support review" : "Dry fit shelf layout",
      purpose: "Check spacing, fit, and orientation before fastening or finishing.",
      instructions:
        connected && !supportModeled
          ? "After the support/frame design is resolved, dry fit the shelf boards with the verified support pieces before any permanent assembly."
          : "Dry fit the shelf pieces and confirm the layout matches the reviewed dimensions.",
      phaseLabel: "Assemble",
      tools: toolsFor(project, null, selectedTools(project, ["tape_measure", "pencil", "clamps"], "layout tools to confirm")),
      relatedPieceLabels: allPieceLabels,
      dimensionReferences: [
        ...(diagramViewModel.shelfCount ? [`${diagramViewModel.shelfCount.toString()} ${diagramViewModel.shelfCount === 1 ? "shelf" : "shelves"}`] : []),
        diagramViewModel.renderLabels.shelfCountLabel,
      ],
      reviewBlockers: connected && !supportModeled ? ["Resolve support/frame design before dry fitting the connected unit."] : [],
      printLabel: "Dry fit layout",
    }),
    card({
      id: "sand_prep_pieces",
      stepNumber: cards.length + 2,
      title: "Sand and prep pieces",
      purpose: "Make the pieces safer to handle and ready for finish.",
      instructions: "Sand exposed edges and faces, then clean dust before finish or final assembly review.",
      phaseLabel: "Sand",
      tools: toolsFor(project, sandOperation, selectedTools(project, ["sander"], "sanding tools to confirm")),
      estimatedTimeLabel: estimateFor(sandOperation),
      relatedOperationTitle: sandOperation?.title ?? null,
      relatedPieceLabels: operationPartLabels(cutViewModel, sandOperation).length > 0 ? operationPartLabels(cutViewModel, sandOperation) : allPieceLabels,
      safetyNote: "Wear appropriate PPE and control dust.",
      printLabel: "Sand/prep pieces",
    }),
  );

  if (connected) {
    cards.push(
      card({
        id: supportModeled ? "assemble_connected_unit" : "block_connected_assembly",
        stepNumber: cards.length + 1,
        title: supportModeled ? "Assemble connected shelf unit" : "Do not assemble connected unit yet",
        purpose: supportModeled ? "Join the modeled shelf and support pieces after a dry fit." : "Prevent an incomplete support model from becoming build instructions.",
        instructions: supportModeled
          ? "Assemble only the modeled shelf and support/frame pieces after confirming fit, square, and fastener choices."
          : "Do not assemble a connected shelf unit until side supports, frame, cleat, brackets, or another support method are modeled and reviewed.",
        phaseLabel: supportModeled ? "Assemble" : "Inspect / review",
        tools: toolsFor(project, supportOperation, selectedTools(project, ["tape_measure", "pencil", "clamps"], "assembly review tools to confirm")),
        relatedOperationTitle: supportOperation?.title ?? null,
        relatedPieceLabels: allPieceLabels,
        reviewBlockers: supportModeled ? [] : ["Add support/frame details before this plan is build-ready."],
        safetyNote: "Do not load or mount until support, fasteners, wall structure, and expected use are reviewed.",
        printLabel: supportModeled ? "Assemble connected unit" : "Assembly blocked",
      }),
    );
  }

  cards.push(
    card({
      id: "confirm_mounting_support",
      stepNumber: cards.length + 1,
      title: "Confirm wall mounting/support method before installation",
      purpose: "Keep wall attachment and support choices explicit and manually reviewed.",
      instructions: reviewSupportInstruction(
        "Use the selected mounting/support plan as a review starting point, then locate studs or appropriate anchors and confirm fasteners before drilling or installation.",
        supportGuidance,
      ),
      phaseLabel: "Inspect / review",
      tools: toolsFor(project, mountingOperation, selectedTools(project, ["tape_measure", "pencil", "drill"], "mounting review tools to confirm")),
      estimatedTimeLabel: estimateFor(mountingOperation),
      relatedOperationTitle: mountingOperation?.title ?? null,
      relatedPieceLabels: operationPartLabels(cutViewModel, mountingOperation).length > 0 ? operationPartLabels(cutViewModel, mountingOperation) : allPieceLabels,
      warnings: buildModel.unresolvedQuestions.filter((question) => /wall|bracket|fastener|load|support|frame/i.test(question)),
      safetyNote: "Manual mounting review is required; Boardsmith cannot verify wall safety or load capacity.",
      printLabel: "Confirm mounting/support",
    }),
    card({
      id: "finish_final_review",
      stepNumber: cards.length + 2,
      title: "Finish and final safety check",
      purpose: "Complete surface prep while preserving final review before use.",
      instructions: "Apply finish according to product labels, let it cure, then inspect edges, fasteners, support method, and intended use before loading the shelf.",
      phaseLabel: "Finish",
      tools: toolsFor(project, null, selectedTools(project, ["paint_brush", "sander"], "finish review tools to confirm")),
      relatedPieceLabels: allPieceLabels,
      warnings: buildModel.safety.flags.map((flag) => flag.message),
      safetyNote: "Use your own judgment before loading, mounting, or placing objects on the shelf.",
      printLabel: "Finish/final check",
    }),
  );

  return cards.map((step, index) => ({ ...step, stepNumber: index + 1 }));
}

function summaryFor(status: WallShelfBuildStepStatus, reviewBlockers: string[]): string {
  if (status === "unsupported") return "Build-step view model is available for wall shelf build models only.";
  if (reviewBlockers.length > 0) return "Build guide needs review before this is a trusted build sequence.";
  return "Build guide from Build Model pieces and operations.";
}

export function createWallShelfBuildStepViewModel(params: {
  project: WallShelfBuildStepProjectInput;
  buildModel: BoardsmithBuildModel;
  diagramViewModel: WallShelfDiagramViewModel;
  cutViewModel: WallShelfCutDiagramViewModel;
}): WallShelfBuildStepViewModel {
  const { project, buildModel, diagramViewModel, cutViewModel } = params;
  const unsupported = project.project_type !== "simple_shelf" || buildModel.project.projectType !== "simple_shelf";
  const connected = isConnectedLayout(project, diagramViewModel);
  const supportModeled = supportFrameModeled(cutViewModel);
  const reviewBlockers = unsupported ? [] : reviewBlockersFor({ diagramViewModel, cutViewModel, connected, supportModeled });
  const status: WallShelfBuildStepStatus = unsupported ? "unsupported" : reviewBlockers.length > 0 ? "needs_review" : "ready";
  const warnings = unsupported ? [] : uniqueStrings([...diagramViewModel.warnings, ...cutViewModel.warnings, ...buildModel.unresolvedQuestions]);
  const stepCards = unsupported
    ? []
    : buildCards({
        project,
        buildModel,
        diagramViewModel,
        cutViewModel,
        reviewBlockers,
        connected,
        supportModeled,
      });

  return {
    projectType: project.project_type,
    status,
    stepCards,
    reviewBlockers,
    warnings,
    badges: [
      ...(status === "needs_review" ? ["Needs review"] : []),
      ...(connected ? ["Connected shelf unit"] : []),
      ...(connected && !supportModeled ? ["Support/frame review"] : []),
      ...(stepCards.length > 0 ? ["Build Model steps"] : []),
    ],
    renderLabels: {
      title: "Build Guide",
      summary: summaryFor(status, reviewBlockers),
      fallbackMessage: unsupported ? "Build-step view model is available for wall shelf build models only." : reviewBlockers[0] ?? null,
    },
  };
}
