import { z } from "zod";
import { projectTypes, skillLevels } from "@/lib/projects/types";

export const buildModelSchemaVersions = ["1.0"] as const;
export const buildModelUnits = ["inches"] as const;

export const pieceTypes = [
  "panel",
  "board",
  "rail",
  "trim",
  "layer",
  "spacer",
  "decorative_element",
  "hardware_placeholder",
  "other",
] as const;

export const materialTypes = ["plywood", "mdf", "solid_wood", "hardwood", "softwood", "unknown", "other"] as const;

export const hardwareTypes = [
  "screw",
  "nail",
  "hanger",
  "anchor",
  "glue",
  "bracket",
  "hinge",
  "finish",
  "fastener",
  "other",
] as const;

export const connectionTypes = [
  "glue",
  "screw",
  "nail",
  "brad_nail",
  "pocket_screw",
  "dowel",
  "slot",
  "hanger",
  "bracket",
  "unknown",
  "other",
] as const;

export const operationTypes = [
  "measure",
  "mark",
  "cut",
  "drill",
  "sand",
  "assemble",
  "glue",
  "clamp",
  "fasten",
  "paint",
  "stain",
  "seal",
  "mount",
  "inspect",
  "other",
] as const;

export const safetyFlagCategories = [
  "wall_mounting",
  "child_use",
  "seating",
  "ladder_or_platform",
  "heavy_shelving",
  "electrical",
  "outdoor_exposure",
  "unclear_dimensions",
  "missing_material_thickness",
  "tool_safety",
  "structural_unknown",
  "other",
] as const;

export const safetyFlagSeverities = ["info", "caution", "high_review"] as const;
export const buildModelConfidenceLevels = ["low", "medium", "high"] as const;
export const grainDirections = ["length", "width", "not_applicable", "unknown"] as const;

const snakeCaseIdSchema = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/, {
  message: "Use stable snake_case ids.",
});

const nullablePositiveMeasurement = z.number().positive().max(240).nullable();

export const buildModelPieceSchema = z.object({
  id: snakeCaseIdSchema,
  label: z.string().min(1),
  quantity: z.number().int().positive(),
  pieceType: z.enum(pieceTypes),
  materialId: snakeCaseIdSchema.nullable(),
  dimensions: z.object({
    lengthInches: nullablePositiveMeasurement,
    widthInches: nullablePositiveMeasurement,
    thicknessInches: nullablePositiveMeasurement,
  }),
  grainDirection: z.enum(grainDirections),
  notes: z.array(z.string()),
});

export const buildModelMaterialSchema = z.object({
  id: snakeCaseIdSchema,
  label: z.string().min(1),
  materialType: z.enum(materialTypes),
  nominalThicknessInches: nullablePositiveMeasurement,
  recommendedForProject: z.boolean(),
  notes: z.array(z.string()),
});

export const buildModelHardwareSchema = z.object({
  id: snakeCaseIdSchema,
  label: z.string().min(1),
  quantity: z.number().positive().nullable(),
  hardwareType: z.enum(hardwareTypes),
  sizeDescription: z.string().nullable(),
  required: z.boolean(),
  notes: z.array(z.string()),
});

export const buildModelConnectionSchema = z.object({
  id: snakeCaseIdSchema,
  fromPieceId: snakeCaseIdSchema,
  toPieceId: snakeCaseIdSchema,
  connectionType: z.enum(connectionTypes),
  hardwareIds: z.array(snakeCaseIdSchema),
  locationDescription: z.string().min(1),
  strengthCritical: z.boolean(),
  safetyNotes: z.array(z.string()),
  notes: z.array(z.string()),
});

export const buildModelOperationSchema = z.object({
  id: snakeCaseIdSchema,
  sequenceNumber: z.number().int().positive(),
  operationType: z.enum(operationTypes),
  title: z.string().min(1),
  description: z.string().min(1),
  pieceIds: z.array(snakeCaseIdSchema),
  toolNames: z.array(z.string()),
  safetyNotes: z.array(z.string()),
  estimatedMinutes: z.number().int().positive().nullable(),
});

export const buildModelSafetyFlagSchema = z.object({
  id: snakeCaseIdSchema,
  category: z.enum(safetyFlagCategories),
  severity: z.enum(safetyFlagSeverities),
  message: z.string().min(1),
  recommendedAction: z.string().min(1),
});

export const boardsmithBuildModelSchema = z.object({
  schemaVersion: z.literal("1.0"),
  units: z.literal("inches"),
  project: z.object({
    projectId: z.string().min(1),
    projectType: z.enum(projectTypes),
    title: z.string().min(1),
    intendedUse: z.string().nullable(),
    skillLevel: z.enum(skillLevels),
  }),
  dimensions: z.object({
    widthInches: nullablePositiveMeasurement,
    heightInches: nullablePositiveMeasurement,
    depthInches: nullablePositiveMeasurement,
    materialThicknessInches: nullablePositiveMeasurement,
  }),
  pieces: z.array(buildModelPieceSchema),
  materials: z.array(buildModelMaterialSchema),
  hardware: z.array(buildModelHardwareSchema),
  connections: z.array(buildModelConnectionSchema),
  operations: z.array(buildModelOperationSchema),
  safety: z.object({
    reviewRequired: z.boolean(),
    flags: z.array(buildModelSafetyFlagSchema),
    disclaimers: z.array(z.string()),
  }),
  assumptions: z.array(z.string()),
  unresolvedQuestions: z.array(z.string()),
  exportReadiness: z.object({
    svgCandidate: z.boolean(),
    pdfCandidate: z.boolean(),
    dxfCandidate: z.boolean(),
    cadCandidate: z.boolean(),
    notes: z.array(z.string()),
  }),
  confidence: z.object({
    level: z.enum(buildModelConfidenceLevels),
    reasons: z.array(z.string()),
  }),
});

export type BuildModelPiece = z.infer<typeof buildModelPieceSchema>;
export type BuildModelMaterial = z.infer<typeof buildModelMaterialSchema>;
export type BuildModelHardware = z.infer<typeof buildModelHardwareSchema>;
export type BuildModelConnection = z.infer<typeof buildModelConnectionSchema>;
export type BuildModelOperation = z.infer<typeof buildModelOperationSchema>;
export type BuildModelSafetyFlag = z.infer<typeof buildModelSafetyFlagSchema>;
export type BoardsmithBuildModel = z.infer<typeof boardsmithBuildModelSchema>;

export type BuildModelSemanticIssue = {
  path: string;
  message: string;
};

export function validateBuildModelSemantics(model: BoardsmithBuildModel): BuildModelSemanticIssue[] {
  const issues: BuildModelSemanticIssue[] = [];
  const pieceIds = new Set(model.pieces.map((piece) => piece.id));
  const hardwareIds = new Set(model.hardware.map((hardware) => hardware.id));

  for (const [index, connection] of model.connections.entries()) {
    if (!pieceIds.has(connection.fromPieceId)) {
      issues.push({
        path: `connections.${index.toString()}.fromPieceId`,
        message: `Connection references missing fromPieceId "${connection.fromPieceId}".`,
      });
    }

    if (!pieceIds.has(connection.toPieceId)) {
      issues.push({
        path: `connections.${index.toString()}.toPieceId`,
        message: `Connection references missing toPieceId "${connection.toPieceId}".`,
      });
    }

    for (const [hardwareIndex, hardwareId] of connection.hardwareIds.entries()) {
      if (!hardwareIds.has(hardwareId)) {
        issues.push({
          path: `connections.${index.toString()}.hardwareIds.${hardwareIndex.toString()}`,
          message: `Connection references missing hardware id "${hardwareId}".`,
        });
      }
    }
  }

  for (const [index, operation] of model.operations.entries()) {
    for (const [pieceIndex, pieceId] of operation.pieceIds.entries()) {
      if (!pieceIds.has(pieceId)) {
        issues.push({
          path: `operations.${index.toString()}.pieceIds.${pieceIndex.toString()}`,
          message: `Operation references missing piece id "${pieceId}".`,
        });
      }
    }
  }

  return issues;
}

export function parseBoardsmithBuildModel(input: unknown): BoardsmithBuildModel {
  const model = boardsmithBuildModelSchema.parse(input);
  const semanticIssues = validateBuildModelSemantics(model);

  if (semanticIssues.length > 0) {
    throw new Error(semanticIssues.map((issue) => `${issue.path}: ${issue.message}`).join("; "));
  }

  return model;
}
