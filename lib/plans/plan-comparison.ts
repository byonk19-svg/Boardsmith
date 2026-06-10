import type { ExportReadinessSummary } from "@/lib/plans/export-readiness";
import type { GeneratedPlanReviewSummary } from "@/lib/plans/plan-quality";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type PlanComparisonChangeKind = "added" | "removed" | "changed" | "review_difference";

export type PlanComparisonChange = {
  kind: PlanComparisonChangeKind;
  label: string;
  detail: string;
};

export type PlanHistoryComparison = {
  hasChanges: boolean;
  summaryChanges: string[];
  materialChanges: PlanComparisonChange[];
  cutListChanges: PlanComparisonChange[];
  stepChanges: PlanComparisonChange[];
  reviewChanges: PlanComparisonChange[];
};

export function createPlanHistoryComparison(params: {
  latestPlan: GeneratedPlan;
  comparedPlan: GeneratedPlan;
  latestPlanReview?: GeneratedPlanReviewSummary | null;
  comparedPlanReview?: GeneratedPlanReviewSummary | null;
  latestExportReadiness?: ExportReadinessSummary | null;
  comparedExportReadiness?: ExportReadinessSummary | null;
}): PlanHistoryComparison {
  const summaryChanges = params.latestPlan.project_summary.trim() === params.comparedPlan.project_summary.trim() ? [] : ["Project summary changed."];
  const materialChanges = compareByKey({
    latestItems: params.latestPlan.materials,
    comparedItems: params.comparedPlan.materials,
    keyFor: (item) => item.name,
    detailFor: (item) => `${item.quantity}: ${item.notes}`,
  });
  const cutListChanges = compareByKey({
    latestItems: params.latestPlan.cut_list,
    comparedItems: params.comparedPlan.cut_list,
    keyFor: (item) => item.part_name,
    detailFor: (item) =>
      `${item.quantity.toString()}x ${item.length_inches.toString()} in x ${item.width_inches.toString()} in x ${item.thickness_inches.toString()} in ${item.material}. ${item.notes}`,
  });
  const stepChanges = compareByKey({
    latestItems: params.latestPlan.assembly_steps,
    comparedItems: params.comparedPlan.assembly_steps,
    keyFor: (item) => item.step_number.toString(),
    labelFor: (item) => `${item.step_number.toString()}. ${item.title}`,
    detailFor: (item) => `${item.instructions} ${item.safety_note ?? ""}`.trim(),
  });
  const reviewChanges = [
    reviewSummaryChange("Plan Review", params.latestPlanReview, params.comparedPlanReview),
    reviewSummaryChange("Future output notes", params.latestExportReadiness, params.comparedExportReadiness),
  ].filter((change): change is PlanComparisonChange => change !== null);
  const allChanges = [...summaryChanges, ...materialChanges, ...cutListChanges, ...stepChanges, ...reviewChanges];

  return {
    hasChanges: allChanges.length > 0,
    summaryChanges: allChanges.length > 0 ? summaryChanges : ["No practical plan differences found."],
    materialChanges,
    cutListChanges,
    stepChanges,
    reviewChanges,
  };
}

function compareByKey<T>(params: {
  latestItems: T[];
  comparedItems: T[];
  keyFor: (item: T) => string;
  detailFor: (item: T) => string;
  labelFor?: (item: T) => string;
}): PlanComparisonChange[] {
  const latestMap = keyedItems(params.latestItems, params.keyFor);
  const comparedMap = keyedItems(params.comparedItems, params.keyFor);
  const changes: PlanComparisonChange[] = [];

  for (const [key, latestItem] of latestMap.entries()) {
    const comparedItem = comparedMap.get(key);
    const label = params.labelFor ? params.labelFor(latestItem) : params.keyFor(latestItem);
    if (!comparedItem) {
      changes.push({
        kind: "added",
        label,
        detail: "Added in the latest plan.",
      });
      continue;
    }

    const latestDetail = normalizeWhitespace(params.detailFor(latestItem));
    const comparedDetail = normalizeWhitespace(params.detailFor(comparedItem));
    if (latestDetail !== comparedDetail) {
      changes.push({
        kind: "changed",
        label,
        detail: "Details changed between versions.",
      });
    }
  }

  for (const [key, comparedItem] of comparedMap.entries()) {
    if (latestMap.has(key)) continue;
    changes.push({
      kind: "removed",
      label: params.labelFor ? params.labelFor(comparedItem) : params.keyFor(comparedItem),
      detail: "Removed from the latest plan.",
    });
  }

  return changes;
}

function keyedItems<T>(items: T[], keyFor: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [normalizeKey(keyFor(item)), item]));
}

function normalizeKey(value: string): string {
  return normalizeWhitespace(value).toLowerCase();
}

function normalizeWhitespace(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function reviewSummaryChange(
  label: string,
  latestSummary:
    | Pick<GeneratedPlanReviewSummary | ExportReadinessSummary, "status" | "blockingIssueCount" | "warningCount" | "topMessages">
    | null
    | undefined,
  comparedSummary:
    | Pick<GeneratedPlanReviewSummary | ExportReadinessSummary, "status" | "blockingIssueCount" | "warningCount" | "topMessages">
    | null
    | undefined,
): PlanComparisonChange | null {
  if (!latestSummary || !comparedSummary) return null;

  const latestReviewKey = reviewSummaryKey(latestSummary);
  const comparedReviewKey = reviewSummaryKey(comparedSummary);
  if (latestReviewKey === comparedReviewKey) return null;

  return {
    kind: "review_difference",
    label,
    detail: `${label} changed from ${reviewSummaryLabel(comparedSummary)} to ${reviewSummaryLabel(latestSummary)}.`,
  };
}

function reviewSummaryKey(summary: Pick<GeneratedPlanReviewSummary | ExportReadinessSummary, "status" | "blockingIssueCount" | "warningCount" | "topMessages">): string {
  return [
    summary.status,
    summary.blockingIssueCount.toString(),
    summary.warningCount.toString(),
    ...summary.topMessages.map((message) => normalizeWhitespace(message)),
  ].join("|");
}

function reviewSummaryLabel(summary: Pick<GeneratedPlanReviewSummary | ExportReadinessSummary, "status" | "blockingIssueCount" | "warningCount">): string {
  const status = summary.status.replaceAll("_", " ");
  return `${status}, ${summary.blockingIssueCount.toString()} blocking, ${summary.warningCount.toString()} warnings`;
}
