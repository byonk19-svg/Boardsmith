import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";

export type GeneratedPlanQualityIssue = {
  code: string;
  message: string;
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
  const text = planText(plan);
  const forbiddenClaims = [
    /\bguarantee(?:d|s)?\b.*\b(load|safe|safety|capacity|structural)\b/,
    /\b(load|safe|safety|capacity|structural)\b.*\bguarantee(?:d|s)?\b/,
    /\bcertif(?:y|ies|ied)\b.*\b(load|safe|safety|capacity|structural|child)\b/,
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

export function assertGeneratedPlanQuality(plan: GeneratedPlan, buildModel: BoardsmithBuildModel): void {
  const issues = evaluateGeneratedPlanQuality(plan, buildModel);
  if (issues.length > 0) {
    throw new Error(`Generated plan failed deterministic quality checks: ${issues.map((issue) => issue.message).join("; ")}`);
  }
}
