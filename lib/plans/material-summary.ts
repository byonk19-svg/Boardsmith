import type { BoardsmithBuildModel, BuildModelHardware, BuildModelMaterial } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type MaterialReviewItem = {
  id: string;
  label: string;
  detail: string;
  notes: string[];
};

export type MaterialReviewSummary = {
  primaryMaterials: MaterialReviewItem[];
  hardwareFasteners: MaterialReviewItem[];
  finishSupplies: MaterialReviewItem[];
  reviewNotes: string[];
};

const finishKeywords = ["finish", "paint", "stain", "seal", "varnish", "polyurethane", "wax", "sandpaper"];
const materialReviewKeywords = ["material", "hardware", "fastener", "finish", "paint", "stain", "mount", "anchor", "bracket", "outdoor", "unknown", "unresolved", "review"];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function unique(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => {
    const normalized = value.trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}

function uniqueItems<T extends MaterialReviewItem>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const key = normalize(`${item.label} ${item.detail}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasAnyKeyword(value: string, keywords: string[]): boolean {
  const normalized = normalize(value);
  return keywords.some((keyword) => normalized.includes(keyword));
}

function plannedPieceCount(material: BuildModelMaterial, buildModel: BoardsmithBuildModel): number {
  return buildModel.pieces.filter((piece) => piece.materialId === material.id).reduce((total, piece) => total + piece.quantity, 0);
}

function formatThickness(material: BuildModelMaterial): string {
  return material.nominalThicknessInches ? `${material.nominalThicknessInches.toString()} in thickness` : "thickness to verify";
}

function formatMaterialDetail(material: BuildModelMaterial, buildModel: BoardsmithBuildModel): string {
  const pieceCount = plannedPieceCount(material, buildModel);
  const pieceLabel = pieceCount === 1 ? "piece" : "pieces";
  return `${pieceCount.toString()} planned ${pieceLabel} - ${formatThickness(material)} - ${material.materialType.replaceAll("_", " ")}`;
}

function materialWords(material: BuildModelMaterial): string[] {
  return normalize(`${material.label} ${material.materialType}`)
    .split(" ")
    .filter((word) => word.length >= 4);
}

function planMaterialMatches(material: BuildModelMaterial, planMaterialName: string): boolean {
  const normalizedPlanMaterial = normalize(planMaterialName);
  return materialWords(material).some((word) => normalizedPlanMaterial.includes(word));
}

function planNotesForMaterial(plan: GeneratedPlan | null, material: BuildModelMaterial): string[] {
  if (!plan) return [];
  return plan.materials
    .filter((item) => !hasAnyKeyword(`${item.name} ${item.notes}`, finishKeywords))
    .filter((item) => planMaterialMatches(material, item.name))
    .map((item) => `Plan material: ${item.quantity} ${item.name === material.label ? "" : item.name}. ${item.notes}`.replace(/\s+\./, "."));
}

function primaryMaterials(plan: GeneratedPlan | null, buildModel: BoardsmithBuildModel): MaterialReviewItem[] {
  return buildModel.materials.map((material) => ({
    id: material.id,
    label: material.label,
    detail: formatMaterialDetail(material, buildModel),
    notes: unique([...material.notes, ...planNotesForMaterial(plan, material)]),
  }));
}

function hardwareDetail(item: BuildModelHardware): string {
  const quantity = item.quantity ? `${item.quantity.toString()} needed` : "quantity to review";
  const size = item.sizeDescription ? ` - ${item.sizeDescription}` : "";
  const required = item.required ? "required" : "optional";
  return `${quantity} - ${item.hardwareType.replaceAll("_", " ")} - ${required}${size}`;
}

function hardwareFasteners(buildModel: BoardsmithBuildModel): MaterialReviewItem[] {
  return buildModel.hardware
    .filter((item) => item.hardwareType !== "finish")
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: hardwareDetail(item),
      notes: item.notes,
    }));
}

function finishSupplies(plan: GeneratedPlan | null, buildModel: BoardsmithBuildModel): MaterialReviewItem[] {
  const buildModelFinishSupplies = buildModel.hardware
    .filter((item) => item.hardwareType === "finish")
    .map((item) => ({
      id: item.id,
      label: item.label,
      detail: hardwareDetail(item),
      notes: item.notes,
    }));

  const planFinishSupplies =
    plan?.materials
      .filter((item) => hasAnyKeyword(`${item.name} ${item.notes}`, finishKeywords))
      .map((item, index) => ({
        id: `plan_finish_${index.toString()}`,
        label: item.name,
        detail: item.quantity,
        notes: [item.notes],
      })) ?? [];

  return uniqueItems([...buildModelFinishSupplies, ...planFinishSupplies]);
}

function reviewNotes(plan: GeneratedPlan | null, buildModel: BoardsmithBuildModel): string[] {
  const notes = ["Verify materials before purchasing or cutting."];

  if (buildModel.materials.length === 0) {
    notes.push("No primary material is modeled yet. Review the intake details before relying on this plan.");
  }

  for (const material of buildModel.materials) {
    if (!material.nominalThicknessInches) notes.push(`Confirm thickness for ${material.label}.`);
    if (material.materialType === "unknown" || !material.recommendedForProject) notes.push(`Review whether ${material.label} is suitable for this project.`);
  }

  for (const item of buildModel.hardware) {
    if (!item.quantity) notes.push(`Quantity to review for ${item.label}.`);
  }

  notes.push(
    ...buildModel.assumptions.filter((message) => hasAnyKeyword(message, materialReviewKeywords)),
    ...buildModel.unresolvedQuestions.filter((message) => hasAnyKeyword(message, materialReviewKeywords)),
    ...buildModel.confidence.reasons.filter((message) => hasAnyKeyword(message, materialReviewKeywords)),
    ...(plan?.assumptions.filter((message) => hasAnyKeyword(message, materialReviewKeywords)) ?? []),
  );

  return unique(notes);
}

export function summarizeMaterialReview(plan: GeneratedPlan | null, buildModel: BoardsmithBuildModel): MaterialReviewSummary {
  return {
    primaryMaterials: uniqueItems(primaryMaterials(plan, buildModel)),
    hardwareFasteners: uniqueItems(hardwareFasteners(buildModel)),
    finishSupplies: finishSupplies(plan, buildModel),
    reviewNotes: reviewNotes(plan, buildModel),
  };
}
