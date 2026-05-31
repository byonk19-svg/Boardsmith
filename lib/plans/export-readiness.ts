import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type ExportReadinessStatus = "ready" | "needs_review" | "not_ready";

export type ExportReadinessIssue = {
  code: string;
  message: string;
};

export type ExportReadinessSummary = {
  status: ExportReadinessStatus;
  blockingIssueCount: number;
  warningCount: number;
  topMessages: string[];
  blockingIssues: ExportReadinessIssue[];
  warnings: ExportReadinessIssue[];
  exportCandidates: string[];
  confidenceLabel: string;
  exportReadinessNotes: string[];
  manualReviewRequired: boolean;
};

function hasReviewContext(model: BoardsmithBuildModel): boolean {
  return [...model.assumptions, ...model.unresolvedQuestions].some((message) => {
    const normalized = message.toLowerCase();
    return normalized.includes("dimension") || normalized.includes("material") || normalized.includes("unknown") || normalized.includes("unresolved");
  });
}

function uniqueIssues(issues: ExportReadinessIssue[]): ExportReadinessIssue[] {
  const seen = new Set<string>();
  return issues.filter((issue) => {
    const key = `${issue.code}:${issue.message}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function exportCandidates(model: BoardsmithBuildModel): string[] {
  return [
    model.exportReadiness.svgCandidate ? "SVG" : "",
    model.exportReadiness.pdfCandidate ? "PDF" : "",
    model.exportReadiness.dxfCandidate ? "DXF" : "",
    model.exportReadiness.cadCandidate ? "CAD" : "",
  ].filter((candidate) => candidate.length > 0);
}

export function summarizeExportReadiness(
  plan: GeneratedPlan,
  buildModel: BoardsmithBuildModel,
  options: { buildModelSource?: "saved" | "derived" } = {},
): ExportReadinessSummary {
  const blockingIssues: ExportReadinessIssue[] = [];
  const warnings: ExportReadinessIssue[] = [];
  const hasContextForUnknowns = hasReviewContext(buildModel);

  if (options.buildModelSource !== "saved") {
    warnings.push({
      code: "derived_build_model",
      message: "Future export work should use a generated plan with stored build-model JSON.",
    });
  }

  if (buildModel.pieces.length === 0) {
    blockingIssues.push({
      code: "pieces_missing",
      message: "No project pieces are modeled yet.",
    });
  }

  for (const [index, piece] of buildModel.pieces.entries()) {
    const pieceNumber = (index + 1).toString();
    if (piece.label.trim().length === 0) {
      blockingIssues.push({
        code: "piece_name_missing",
        message: `Piece ${pieceNumber} needs a usable name before future export work.`,
      });
    }

    const missingDimensions = [
      piece.dimensions.lengthInches === null ? "length" : "",
      piece.dimensions.widthInches === null ? "width" : "",
      piece.dimensions.thicknessInches === null ? "thickness" : "",
    ].filter((dimension) => dimension.length > 0);

    if (missingDimensions.length > 0) {
      const message = `Piece "${piece.label.trim() || pieceNumber}" is missing ${missingDimensions.join(", ")} for future export checks.`;
      if (hasContextForUnknowns) {
        warnings.push({ code: "piece_dimensions_need_review", message });
      } else {
        blockingIssues.push({ code: "piece_dimensions_missing", message });
      }
    }
  }

  if (buildModel.materials.length === 0) {
    const message = "No material choices are available for future export notes.";
    if (hasContextForUnknowns) {
      warnings.push({ code: "materials_need_review", message });
    } else {
      blockingIssues.push({ code: "materials_missing", message });
    }
  }

  if (buildModel.operations.length === 0) {
    blockingIssues.push({
      code: "operations_missing",
      message: "No build operations are modeled yet.",
    });
  }

  if (plan.cut_list.length === 0) {
    blockingIssues.push({
      code: "cut_list_missing",
      message: "The generated plan has no cut list to review for future export work.",
    });
  }

  if (plan.assembly_steps.length === 0) {
    blockingIssues.push({
      code: "assembly_steps_missing",
      message: "The generated plan has no build steps to review for future export work.",
    });
  }

  if (buildModel.safety.reviewRequired && buildModel.safety.flags.length === 0) {
    blockingIssues.push({
      code: "safety_flags_missing",
      message: "Safety review is required, but no deterministic safety flags are modeled.",
    });
  }

  if (buildModel.safety.disclaimers.length === 0 || plan.safety_notes.length === 0) {
    warnings.push({
      code: "safety_notes_need_review",
      message: "Safety notes should be reviewed before any future export work.",
    });
  }

  if (buildModel.confidence.level === "low") {
    warnings.push({
      code: "low_build_model_confidence",
      message: "Build-model confidence is low, so future export work needs review.",
    });
  }

  const candidates = exportCandidates(buildModel);
  if (candidates.length === 0) {
    warnings.push({
      code: "no_export_candidate",
      message: "No future export format is marked as a candidate yet.",
    });
  }

  for (const question of buildModel.unresolvedQuestions) {
    warnings.push({
      code: "unresolved_question",
      message: `Unresolved before export polish: ${question}`,
    });
  }

  const uniqueBlockingIssues = uniqueIssues(blockingIssues);
  const uniqueWarnings = uniqueIssues(warnings);
  const status: ExportReadinessStatus = uniqueBlockingIssues.length > 0 ? "not_ready" : uniqueWarnings.length > 0 ? "needs_review" : "ready";
  const topMessages = [
    ...uniqueBlockingIssues.map((issue) => issue.message),
    ...uniqueWarnings.map((issue) => issue.message),
    ...(uniqueBlockingIssues.length === 0 && uniqueWarnings.length === 0 ? ["Looks ready for future export polish."] : []),
  ].slice(0, 4);

  return {
    status,
    blockingIssueCount: uniqueBlockingIssues.length,
    warningCount: uniqueWarnings.length,
    topMessages,
    blockingIssues: uniqueBlockingIssues,
    warnings: uniqueWarnings,
    exportCandidates: candidates,
    confidenceLabel: buildModel.confidence.level,
    exportReadinessNotes: buildModel.exportReadiness.notes,
    manualReviewRequired: true,
  };
}
