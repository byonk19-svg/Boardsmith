import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type GeneratedPlanQualityIssue = {
  code: string;
  message: string;
};

export type GeneratedPlanReviewStatus = "passed" | "warnings" | "blocked";

export type GeneratedPlanReviewSummary = {
  status: GeneratedPlanReviewStatus;
  blockingIssueCount: number;
  warningCount: number;
  infoCount: number;
  topMessages: string[];
  manualReviewRequired: boolean;
  blockingIssues: GeneratedPlanQualityIssue[];
  warnings: string[];
  infoMessages: string[];
};

const dimensionToleranceInches = 0.001;

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function planText(plan: GeneratedPlan): string {
  return normalizeText(
    [
      plan.project_summary,
      plan.materials.flatMap((material) => [material.name, material.quantity, material.notes]).join(" "),
      plan.tools.join(" "),
      plan.cut_list.flatMap((item) => [item.part_name, item.material, item.notes]).join(" "),
      plan.assembly_steps.flatMap((step) => [step.title, step.instructions, step.tools_used.join(" "), step.safety_note ?? ""]).join(" "),
      plan.finishing_steps.join(" "),
      plan.safety_notes.join(" "),
      plan.assumptions.join(" "),
      plan.needs_review_flags.join(" "),
      plan.beginner_tips.join(" "),
      plan.svg_readiness_notes.join(" "),
      plan.estimated_difficulty,
      plan.estimated_time,
      plan.confidence_level,
    ].join(" "),
  );
}

function includesNormalized(haystack: string, needle: string): boolean {
  return haystack.includes(normalizeText(needle));
}

function dimensionIssue(params: {
  label: string;
  planValue: number;
  buildModelValue: number | null;
  allowZeroWhenUnknown?: boolean;
}): GeneratedPlanQualityIssue | null {
  if (params.buildModelValue === null) {
    if (params.allowZeroWhenUnknown && params.planValue === 0) return null;

    return {
      code: "invented_dimension",
      message: `Plan includes ${params.label} ${params.planValue.toString()} in, but the build model has no confirmed ${params.label}.`,
    };
  }

  if (params.planValue > params.buildModelValue + dimensionToleranceInches) {
    return {
      code: "dimension_exceeds_build_model",
      message: `Plan ${params.label} ${params.planValue.toString()} in exceeds build model ${params.label} ${params.buildModelValue.toString()} in.`,
    };
  }

  return null;
}

function cutListMaterialIssues(plan: GeneratedPlan): GeneratedPlanQualityIssue[] {
  const materialNames = plan.materials.map((material) => normalizeText(material.name));

  return plan.cut_list.flatMap((item, index) => {
    const cutMaterial = normalizeText(item.material);
    const hasMaterialMatch = materialNames.some((materialName) => materialName.includes(cutMaterial) || cutMaterial.includes(materialName));

    return hasMaterialMatch
      ? []
      : [
          {
            code: "cut_list_material_missing",
            message: `Cut list item ${(index + 1).toString()} uses "${item.material}", which is not listed in materials.`,
          },
        ];
  });
}

function findMatchingBuildModelMaterial(item: GeneratedPlan["cut_list"][number], buildModel: BoardsmithBuildModel) {
  const cutMaterial = normalizeText(item.material);
  return buildModel.materials.find((material) => {
    const candidates = [material.id, material.label, material.materialType].map((value) => normalizeText(value));
    return candidates.some((candidate) => candidate.includes(cutMaterial) || cutMaterial.includes(candidate));
  });
}

function findMatchingBuildModelPiece(item: GeneratedPlan["cut_list"][number], buildModel: BoardsmithBuildModel) {
  const cutPartName = normalizeText(item.part_name);
  return buildModel.pieces.find((piece) => {
    const candidates = [piece.id, piece.label, piece.pieceType].map((value) => normalizeText(value));
    return candidates.some((candidate) => candidate.includes(cutPartName) || cutPartName.includes(candidate));
  });
}

function cutListBuildModelIssues(plan: GeneratedPlan, buildModel: BoardsmithBuildModel): GeneratedPlanQualityIssue[] {
  return plan.cut_list.flatMap((item, index) => {
    const issues: GeneratedPlanQualityIssue[] = [];
    const itemNumber = (index + 1).toString();
    const matchingMaterial = findMatchingBuildModelMaterial(item, buildModel);
    const matchingPiece = findMatchingBuildModelPiece(item, buildModel);

    if (!matchingMaterial) {
      issues.push({
        code: "cut_list_material_not_in_build_model",
        message: `Cut list item ${itemNumber} uses "${item.material}", which does not match a build model material.`,
      });
    }

    if (!matchingPiece) {
      issues.push({
        code: "cut_list_piece_not_in_build_model",
        message: `Cut list item ${itemNumber} part "${item.part_name}" does not match a build model piece.`,
      });
      return issues;
    }

    if (matchingMaterial && matchingPiece.materialId && matchingPiece.materialId !== matchingMaterial.id) {
      const expectedMaterial = buildModel.materials.find((material) => material.id === matchingPiece.materialId);
      issues.push({
        code: "cut_list_material_mismatches_piece",
        message: `Cut list item ${itemNumber} uses "${matchingMaterial.label}" for "${matchingPiece.label}", but the build model assigns ${expectedMaterial?.label ?? matchingPiece.materialId}.`,
      });
    }

    const dimensionChecks = [
      { label: "length", planValue: item.length_inches, buildModelValue: matchingPiece.dimensions.lengthInches },
      { label: "width", planValue: item.width_inches, buildModelValue: matchingPiece.dimensions.widthInches },
      { label: "thickness", planValue: item.thickness_inches, buildModelValue: matchingPiece.dimensions.thicknessInches },
    ];

    for (const check of dimensionChecks) {
      if (check.buildModelValue !== null && check.planValue > check.buildModelValue + dimensionToleranceInches) {
        issues.push({
          code: "cut_list_piece_dimension_exceeds_build_model",
          message: `Cut list item ${itemNumber} ${check.label} ${check.planValue.toString()} in exceeds build model piece "${matchingPiece.label}" ${check.label} ${check.buildModelValue.toString()} in.`,
        });
      }
    }

    return issues;
  });
}

function overclaimIssues(plan: GeneratedPlan): GeneratedPlanQualityIssue[] {
  const text = [
    /\b(?:does not|do not|cannot|can not|never|no)\s+guarantee(?:d|s)?\b/g,
    /\b(?:does not|do not|cannot|can not|never|no)\s+(?:provide|offer|make|include|imply|claim)\s+(?:\w+\s+){0,5}guarantee(?:d|s)?\b/g,
    /\b(?:is not|are not|not)\s+guaranteed\b/g,
    /\b(?:cannot|can not)\s+be\s+guaranteed\b/g,
    /\bno\s+(?:\w+\s+){0,8}(?:is|are|was|were)\s+guaranteed\b/g,
    /\b(?:is not|are not|not)\s+(?:a\s+)?(?:\w+\s+){0,5}guarantee(?:d|s)?\b/g,
    /\b(?:does not|do not|cannot|can not|never|no)\s+certif(?:y|ies|ied)\b/g,
    /\b(?:is not|are not|not|never|no|cannot be|can not be)\s+(?:a\s+)?child safe\b/g,
    /\b(?:does not|do not|cannot|can not|never|no)\s+(?:provide\s+|include\s+|imply\s+|claim\s+)?structural approval\b/g,
  ].reduce((current, pattern) => current.replace(pattern, " "), planText(plan));
  const forbiddenClaims = [
    /\bguarantee(?:d|s)?\b(?:\s+\w+){0,8}\s+\b(load|safe|safety|capacity|structural)\b/,
    /\b(load|safe|safety|capacity|structural)\b(?:\s+\w+){0,8}\s+\bguarantee(?:d|s)?\b/,
    /\bcertif(?:y|ies|ied)\b(?:\s+\w+){0,8}\s+\b(load|safe|safety|capacity|structural|child)\b/,
    /\bchild safe\b/,
    /\bstructural approval\b/,
  ];

  return forbiddenClaims.some((pattern) => pattern.test(text))
    ? [
        {
          code: "unsafe_safety_overclaim",
          message: "Plan makes a safety, structural, child-safety, or load-capacity claim Boardsmith cannot verify.",
        },
      ]
    : [];
}

export function evaluateGeneratedPlanQuality(plan: GeneratedPlan, buildModel: BoardsmithBuildModel): GeneratedPlanQualityIssue[] {
  const issues: GeneratedPlanQualityIssue[] = [];
  const text = planText(plan);

  if (plan.project_type !== buildModel.project.projectType) {
    issues.push({
      code: "project_type_mismatch",
      message: `Plan project type "${plan.project_type}" does not match build model project type "${buildModel.project.projectType}".`,
    });
  }

  const dimensionIssues = [
    dimensionIssue({
      label: "width",
      planValue: plan.dimensions.width_inches,
      buildModelValue: buildModel.dimensions.widthInches,
    }),
    dimensionIssue({
      label: "height",
      planValue: plan.dimensions.height_inches,
      buildModelValue: buildModel.dimensions.heightInches,
    }),
    dimensionIssue({
      label: "depth",
      planValue: plan.dimensions.depth_inches,
      buildModelValue: buildModel.dimensions.depthInches,
      allowZeroWhenUnknown: true,
    }),
    dimensionIssue({
      label: "material thickness",
      planValue: plan.dimensions.material_thickness_inches,
      buildModelValue: buildModel.dimensions.materialThicknessInches,
    }),
  ].filter((issue): issue is GeneratedPlanQualityIssue => issue !== null);
  issues.push(...dimensionIssues);

  if (buildModel.safety.reviewRequired && plan.needs_review_flags.length === 0) {
    issues.push({
      code: "missing_review_flags",
      message: "Build model requires review, but the generated plan has no needs-review flags.",
    });
  }

  for (const flag of buildModel.safety.flags) {
    if (!includesNormalized(text, flag.message)) {
      issues.push({
        code: "missing_deterministic_review_flag",
        message: `Generated plan is missing deterministic review flag: ${flag.message}`,
      });
    }
  }

  const requiresWallMountingReview = buildModel.safety.flags.some((flag) => flag.category === "wall_mounting");
  if (requiresWallMountingReview && !/\b(stud|anchor|fastener|wall structure)\b/.test(text)) {
    issues.push({
      code: "missing_wall_mounting_caution",
      message: "Wall-mounted projects must mention stud, anchor, fastener, or wall-structure review.",
    });
  }

  issues.push(...cutListMaterialIssues(plan));
  issues.push(...cutListBuildModelIssues(plan, buildModel));
  issues.push(...overclaimIssues(plan));

  return issues;
}

function uniqueMessages(messages: string[]): string[] {
  return [...new Set(messages.map((message) => message.trim()).filter((message) => message.length > 0))];
}

export function summarizeGeneratedPlanReview(
  plan: GeneratedPlan,
  buildModel: BoardsmithBuildModel,
  options: { buildModelSource?: "saved" | "derived" } = {},
): GeneratedPlanReviewSummary {
  const blockingIssues = evaluateGeneratedPlanQuality(plan, buildModel);
  const warnings = uniqueMessages([
    options.buildModelSource === "derived" ? "Review uses a derived project structure because this plan version did not store a build model." : "",
    ...plan.needs_review_flags,
    ...buildModel.safety.flags.map((flag) => flag.message),
    ...buildModel.unresolvedQuestions.map((question) => `Manual review: ${question}`),
    buildModel.safety.reviewRequired ? "Manual review required before building." : "",
  ]);
  const infoMessages = uniqueMessages(plan.safety_notes);
  const status: GeneratedPlanReviewStatus = blockingIssues.length > 0 ? "blocked" : warnings.length > 0 ? "warnings" : "passed";
  const topMessages = uniqueMessages([
    ...blockingIssues.map((issue) => issue.message),
    ...warnings,
    ...(blockingIssues.length === 0 ? ["No blocking issues found."] : []),
  ]).slice(0, 4);

  return {
    status,
    blockingIssueCount: blockingIssues.length,
    warningCount: warnings.length,
    infoCount: infoMessages.length,
    topMessages,
    manualReviewRequired: true,
    blockingIssues,
    warnings,
    infoMessages,
  };
}

export function assertGeneratedPlanQuality(plan: GeneratedPlan, buildModel: BoardsmithBuildModel): void {
  const issues = evaluateGeneratedPlanQuality(plan, buildModel);
  if (issues.length > 0) {
    throw new Error(`Generated plan failed deterministic quality checks: ${issues.map((issue) => issue.message).join("; ")}`);
  }
}
