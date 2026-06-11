import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type CutListReviewStatus = "ready_to_review" | "needs_measurement" | "check_quantity" | "possible_duplicate";

export type CutListReviewItem = {
  id: string;
  label: string;
  sourceLabel: string;
  quantityLabel: string;
  dimensionsLabel: string;
  materialLabel: string;
  status: CutListReviewStatus;
  messages: string[];
};

export type CutListReviewSummary = {
  totalPieces: number;
  piecesWithDimensions: number;
  piecesNeedingReview: number;
  items: CutListReviewItem[];
  warnings: string[];
  reviewNotes: string[];
};

type CutCandidate = {
  id: string;
  label: string;
  sourceLabel: string;
  quantity: number;
  dimensions: {
    length: number | null;
    width: number | null;
    thickness: number | null;
  };
  materialLabel: string;
  notes: string[];
  duplicateKey: string;
};

const suspiciousQuantityThreshold = 20;

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function formatDimension(value: number | null): string {
  return value && value > 0 ? `${value.toString()} in` : "missing";
}

function hasUnresolvedDimensionLanguage(value: string): boolean {
  return /\b(missing|unknown|unresolved|placeholder)\b/i.test(value);
}

function formatDimensions(candidate: CutCandidate): string {
  return `${formatDimension(candidate.dimensions.length)} x ${formatDimension(candidate.dimensions.width)} x ${formatDimension(candidate.dimensions.thickness)}`;
}

function missingDimensions(candidate: CutCandidate): string[] {
  return [
    candidate.dimensions.length && candidate.dimensions.length > 0 ? "" : "length",
    candidate.dimensions.width && candidate.dimensions.width > 0 ? "" : "width",
    candidate.dimensions.thickness && candidate.dimensions.thickness > 0 ? "" : "thickness",
  ].filter((dimension) => dimension.length > 0);
}

function hasUsableQuantity(quantity: number): boolean {
  return Number.isFinite(quantity) && Number.isInteger(quantity) && quantity > 0;
}

function hasSuspiciousQuantity(quantity: number): boolean {
  return hasUsableQuantity(quantity) && quantity > suspiciousQuantityThreshold;
}

function buildDuplicateKey(candidate: Omit<CutCandidate, "duplicateKey">): string {
  return [
    normalize(candidate.label),
    normalize(candidate.materialLabel),
    candidate.dimensions.length?.toString() ?? "missing",
    candidate.dimensions.width?.toString() ?? "missing",
    candidate.dimensions.thickness?.toString() ?? "missing",
  ].join("|");
}

function buildModelCandidates(buildModel: BoardsmithBuildModel): CutCandidate[] {
  return buildModel.pieces.map((piece) => {
    const material = buildModel.materials.find((item) => item.id === piece.materialId);
    const candidate = {
      id: `model_${piece.id}`,
      label: piece.label,
      sourceLabel: "Modeled piece",
      quantity: piece.quantity,
      dimensions: {
        length: piece.dimensions.lengthInches,
        width: piece.dimensions.widthInches,
        thickness: piece.dimensions.thicknessInches,
      },
      materialLabel: material?.label ?? piece.materialId ?? "material to review",
      notes: piece.notes,
    };

    return {
      ...candidate,
      duplicateKey: buildDuplicateKey(candidate),
    };
  });
}

function planCandidates(plan: GeneratedPlan): CutCandidate[] {
  return plan.cut_list.map((item, index) => {
    const candidate = {
      id: `plan_${index.toString()}_${normalize(item.part_name).replaceAll(" ", "_") || "cut"}`,
      label: item.part_name,
      sourceLabel: "Generated cut",
      quantity: item.quantity,
      dimensions: {
        length: item.length_inches,
        width: item.width_inches,
        thickness: item.thickness_inches,
      },
      materialLabel: item.material,
      notes: [item.notes],
    };

    return {
      ...candidate,
      duplicateKey: buildDuplicateKey(candidate),
    };
  });
}

function duplicateKeys(candidates: CutCandidate[]): Set<string> {
  const counts = new Map<string, number>();
  for (const candidate of candidates) {
    counts.set(candidate.duplicateKey, (counts.get(candidate.duplicateKey) ?? 0) + 1);
  }

  return new Set([...counts.entries()].filter(([, count]) => count > 1).map(([key]) => key));
}

function statusFor(candidate: CutCandidate, isPossibleDuplicate: boolean): CutListReviewStatus {
  if (
    candidate.label.trim().length === 0 ||
    missingDimensions(candidate).length > 0 ||
    hasUnresolvedDimensionLanguage(candidate.label) ||
    candidate.notes.some((note) => hasUnresolvedDimensionLanguage(note))
  ) {
    return "needs_measurement";
  }
  if (!hasUsableQuantity(candidate.quantity) || hasSuspiciousQuantity(candidate.quantity)) return "check_quantity";
  if (isPossibleDuplicate) return "possible_duplicate";
  return "ready_to_review";
}

function messagesFor(candidate: CutCandidate, status: CutListReviewStatus, isPossibleDuplicate: boolean): string[] {
  const messages: string[] = [];
  const missing = missingDimensions(candidate);

  if (candidate.label.trim().length === 0) messages.push("A modeled piece needs a usable name before cutting.");
  if (missing.length > 0) messages.push(`A ${candidate.sourceLabel.toLowerCase()} is missing ${missing.join(" and ")}.`);
  if (hasUnresolvedDimensionLanguage(candidate.label) || candidate.notes.some((note) => hasUnresolvedDimensionLanguage(note))) {
    messages.push(`A ${candidate.sourceLabel.toLowerCase()} uses placeholder or unresolved dimension language.`);
  }
  if (!hasUsableQuantity(candidate.quantity) || hasSuspiciousQuantity(candidate.quantity)) {
    messages.push(`A ${candidate.sourceLabel.toLowerCase()} has a quantity that needs review.`);
  }
  if (isPossibleDuplicate) messages.push("Multiple cut-list entries look similar. Confirm whether they are separate pieces before cutting.");
  if (status === "ready_to_review" && candidate.notes.length > 0) messages.push(candidate.notes[0]);

  return messages;
}

function reviewWarnings(items: CutListReviewItem[], plan: GeneratedPlan): string[] {
  const warnings = items.flatMap((item) => item.messages.filter((message) => item.status !== "ready_to_review" || message.includes("similar")));

  if (plan.cut_list.length === 0 && (plan.materials.length > 0 || plan.assembly_steps.length > 0)) {
    warnings.push("The generated cut list is empty even though the plan has materials or build steps.");
  }

  return [...new Set(warnings)];
}

export function cutListStatusLabel(status: CutListReviewStatus): string {
  if (status === "needs_measurement") return "Needs measurement";
  if (status === "check_quantity") return "Check quantity";
  if (status === "possible_duplicate") return "Possible duplicate";
  return "Ready to review";
}

export function summarizeCutListReview(plan: GeneratedPlan, buildModel: BoardsmithBuildModel): CutListReviewSummary {
  const modelCandidates = buildModelCandidates(buildModel);
  const generatedCandidates = planCandidates(plan);
  const allCandidates = [...modelCandidates, ...generatedCandidates];
  const duplicatePlanKeys = duplicateKeys(generatedCandidates);

  const items = allCandidates.map((candidate) => {
    const isPossibleDuplicate = candidate.sourceLabel === "Generated cut" && duplicatePlanKeys.has(candidate.duplicateKey);
    const status = statusFor(candidate, isPossibleDuplicate);

    return {
      id: candidate.id,
      label: candidate.label.trim() || "Unnamed piece",
      sourceLabel: candidate.sourceLabel,
      quantityLabel: hasUsableQuantity(candidate.quantity) ? candidate.quantity.toString() : "quantity to review",
      dimensionsLabel: formatDimensions(candidate),
      materialLabel: candidate.materialLabel,
      status,
      messages: messagesFor(candidate, status, isPossibleDuplicate),
    };
  });

  const warnings = reviewWarnings(items, plan);
  const reviewOnlyIssues = plan.cut_list.length === 0 && (plan.materials.length > 0 || plan.assembly_steps.length > 0) ? 1 : 0;

  return {
    totalPieces: allCandidates.reduce((total, candidate) => total + (hasUsableQuantity(candidate.quantity) ? candidate.quantity : 0), 0),
    piecesWithDimensions: allCandidates.filter((candidate) => missingDimensions(candidate).length === 0).length,
    piecesNeedingReview: items.filter((item) => item.status !== "ready_to_review").length + reviewOnlyIssues,
    items,
    warnings,
    reviewNotes: [
      "Measure twice before cutting.",
      "Verify all dimensions against your actual space, lumber, and hardware.",
      "This is a planning aid, not a production cut file.",
      "Account for saw kerf and final fitting during your own review.",
    ],
  };
}
