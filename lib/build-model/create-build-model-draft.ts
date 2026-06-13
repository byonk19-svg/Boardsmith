import {
  parseBoardsmithBuildModel,
  type BoardsmithBuildModel,
  type BuildModelConnection,
  type BuildModelHardware,
  type BuildModelMaterial,
  type BuildModelOperation,
  type BuildModelPiece,
  type BuildModelSafetyFlag,
} from "@/lib/build-model/build-model-schema";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { projectTypes, type Project, type ProjectType, type SkillLevel } from "@/lib/projects/types";
import type { SafetyReviewFlag } from "@/lib/safety/safety-review";
import { getTemplateHint, type TemplateHint } from "@/lib/templates/template-hints";

export type BuildModelDraftProject = Omit<
  Pick<
    Project,
    | "id"
    | "title"
    | "project_type"
    | "skill_level"
    | "width_inches"
    | "height_inches"
    | "depth_inches"
    | "material_thickness_inches"
    | "material_type"
    | "shelf_layout"
    | "shelf_count"
    | "shelf_spacing_inches"
    | "tools_available"
    | "style_notes"
    | "intended_use"
  >,
  "project_type" | "skill_level" | "width_inches" | "height_inches" | "depth_inches" | "material_thickness_inches"
> & {
  project_type: ProjectType;
  skill_level: SkillLevel;
  width_inches: number | null;
  height_inches: number | null;
  depth_inches: number | null;
  material_thickness_inches: number | null;
};

type DraftParts = {
  pieces: BuildModelPiece[];
  hardware: BuildModelHardware[];
  connections: BuildModelConnection[];
  operations: BuildModelOperation[];
  assumptions: string[];
  unresolvedQuestions: string[];
  exportReadiness: BoardsmithBuildModel["exportReadiness"];
};

const genericDisclaimer = "Boardsmith build models are review aids. Verify dimensions, tools, materials, and safety requirements before building.";
const noLoadDisclaimer = "Boardsmith cannot verify load capacity, wall mounting safety, child safety, or structural performance.";

function isSupportedProjectType(projectType: string): projectType is ProjectType {
  return projectTypes.some((supportedType) => supportedType === projectType);
}

export function toStableSnakeCaseId(value: string): string {
  const id = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_{2,}/g, "_");

  return /^[a-z]/.test(id) ? id : `item_${id || "unknown"}`;
}

function positiveOrNull(value: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function textIncludes(project: BuildModelDraftProject, terms: RegExp): boolean {
  return terms.test(`${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase());
}

function isWallGuidance(message: string): boolean {
  return /\b(wall|mount|mounted|mounting|bracket|anchor|stud)\b/.test(message.toLowerCase());
}

function materialTypeFromLabel(label: string): BuildModelMaterial["materialType"] {
  const normalized = label.toLowerCase();
  if (normalized.includes("plywood")) return "plywood";
  if (normalized.includes("mdf")) return "mdf";
  if (normalized.includes("hardwood") || normalized.includes("oak") || normalized.includes("maple") || normalized.includes("walnut")) return "hardwood";
  if (normalized.includes("pine") || normalized.includes("cedar") || normalized.includes("fir")) return "softwood";
  if (normalized.includes("wood") || normalized.includes("board")) return "solid_wood";
  if (normalized.trim().length === 0) return "unknown";
  return "other";
}

function createPrimaryMaterial(project: BuildModelDraftProject): BuildModelMaterial {
  const label = project.material_type.trim() || "Unknown material";

  return {
    id: toStableSnakeCaseId(label),
    label,
    materialType: materialTypeFromLabel(label),
    nominalThicknessInches: positiveOrNull(project.material_thickness_inches),
    recommendedForProject: materialTypeFromLabel(label) !== "unknown",
    notes: ["Derived from project intake material type."],
  };
}

function mapSafetyFlag(flag: SafetyReviewFlag): BuildModelSafetyFlag {
  const categoryByCode: Record<string, BuildModelSafetyFlag["category"]> = {
    wall_mounting: "wall_mounting",
    child_or_baby_use: "child_use",
    seating_or_load_bearing: "seating",
    ladder_or_platform: "ladder_or_platform",
    heavy_shelving: "heavy_shelving",
    electrical_or_lighted: "electrical",
    outdoor_load_exposure: "outdoor_exposure",
    unclear_dimensions: "unclear_dimensions",
    missing_material_thickness: "missing_material_thickness",
    shelf_layout_missing: "unclear_dimensions",
  };

  const highReviewCodes = new Set([
    "wall_mounting",
    "child_or_baby_use",
    "seating_or_load_bearing",
    "ladder_or_platform",
    "heavy_shelving",
    "shelf_layout_missing",
  ]);
  const category = categoryByCode[flag.code] ?? "other";

  return {
    id: toStableSnakeCaseId(flag.code),
    category,
    severity: highReviewCodes.has(flag.code) ? "high_review" : "caution",
    message: flag.label,
    recommendedAction: flag.reason,
  };
}

function missingDimensionQuestions(project: BuildModelDraftProject): string[] {
  const questions: string[] = [];
  if (!positiveOrNull(project.width_inches)) questions.push("What is the finished project width?");
  if (!positiveOrNull(project.height_inches)) questions.push("What is the finished project height?");
  if ((project.project_type === "simple_shelf" || project.project_type === "planter_box") && !positiveOrNull(project.depth_inches)) {
    questions.push("What is the finished project depth?");
  }
  if (!positiveOrNull(project.material_thickness_inches)) questions.push("What material thickness should be used?");
  return questions;
}

function makePiece(params: {
  id: string;
  label: string;
  quantity?: number;
  pieceType: BuildModelPiece["pieceType"];
  materialId: string | null;
  lengthInches: number | null;
  widthInches: number | null;
  thicknessInches: number | null;
  grainDirection?: BuildModelPiece["grainDirection"];
  notes?: string[];
}): BuildModelPiece {
  return {
    id: params.id,
    label: params.label,
    quantity: params.quantity ?? 1,
    pieceType: params.pieceType,
    materialId: params.materialId,
    dimensions: {
      lengthInches: positiveOrNull(params.lengthInches),
      widthInches: positiveOrNull(params.widthInches),
      thicknessInches: positiveOrNull(params.thicknessInches),
    },
    grainDirection: params.grainDirection ?? "unknown",
    notes: params.notes ?? [],
  };
}

function hardware(params: {
  id: string;
  label: string;
  hardwareType: BuildModelHardware["hardwareType"];
  quantity?: number | null;
  sizeDescription?: string | null;
  required?: boolean;
  notes?: string[];
}): BuildModelHardware {
  return {
    id: params.id,
    label: params.label,
    quantity: params.quantity ?? null,
    hardwareType: params.hardwareType,
    sizeDescription: params.sizeDescription ?? null,
    required: params.required ?? true,
    notes: params.notes ?? [],
  };
}

function operation(params: {
  id: string;
  sequenceNumber: number;
  operationType: BuildModelOperation["operationType"];
  title: string;
  description: string;
  pieceIds: string[];
  toolNames?: string[];
  safetyNotes?: string[];
  estimatedMinutes?: number | null;
}): BuildModelOperation {
  return {
    id: params.id,
    sequenceNumber: params.sequenceNumber,
    operationType: params.operationType,
    title: params.title,
    description: params.description,
    pieceIds: params.pieceIds,
    toolNames: params.toolNames ?? [],
    safetyNotes: params.safetyNotes ?? [],
    estimatedMinutes: params.estimatedMinutes ?? null,
  };
}

function isWallMounted(project: BuildModelDraftProject, safetyFlags: SafetyReviewFlag[]): boolean {
  const text = `${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase();
  const explicitlyNotMounted = /\b(no|not|without)\s+(?:wall\s+)?(?:mounting|mounted|mount|anchors?|studs?|brackets?)\b/.test(text);

  if (explicitlyNotMounted) return false;
  return safetyFlags.some((flag) => flag.code === "wall_mounting") || textIncludes(project, /\b(wall|mounted|mount|hang|anchor|stud|bracket)\b/);
}

function isBookLedge(project: BuildModelDraftProject): boolean {
  return textIncludes(project, /\b(book\s*ledge|book\s*rail|toddler\s+book|nursery\s+book|children'?s\s+book)\b/);
}

function isBathroomOrHumidityProject(project: BuildModelDraftProject): boolean {
  return textIncludes(project, /\b(bathroom|humid|humidity|damp|wet|towel|shower)\b/);
}

function createDoorHangerParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint, wallMounted: boolean): DraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const pieces = [
    makePiece({
      id: "backer_panel",
      label: "Backer panel",
      pieceType: "panel",
      materialId,
      lengthInches: project.height_inches,
      widthInches: project.width_inches,
      thicknessInches: thickness,
      grainDirection: "not_applicable",
      notes: ["Primary decorative backer for the door hanger."],
    }),
    makePiece({
      id: "decorative_layer_placeholder",
      label: "Decorative layer placeholder",
      pieceType: "layer",
      materialId,
      lengthInches: null,
      widthInches: null,
      thicknessInches: thickness,
      grainDirection: "not_applicable",
      notes: ["Placeholder for future layer geometry; no download or export is generated yet."],
    }),
  ];
  const hangingHardware = hardware({
    id: "hanging_hardware",
    label: "Hanging hardware or ribbon",
    hardwareType: "hanger",
    notes: ["Check door clearance and attachment before hanging."],
  });

  return {
    pieces,
    hardware: [hangingHardware],
    connections: [
      {
        id: "hanging_hardware_to_backer_panel",
        fromPieceId: "backer_panel",
        toPieceId: "backer_panel",
        connectionType: "hanger",
        hardwareIds: [hangingHardware.id],
        locationDescription: "Top or back of the backer panel",
        strengthCritical: wallMounted,
        safetyNotes: ["Verify hanging method before use. Boardsmith does not certify mounting safety."],
        notes: ["Self-reference represents hardware attached to one piece."],
      },
    ],
    operations: [
      operation({
        id: "cut_backer_panel",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut backer panel",
        description: "Cut the backer panel from the selected material after checking the submitted dimensions.",
        pieceIds: ["backer_panel"],
        toolNames: project.tools_available,
        safetyNotes: ["Wear PPE and follow tool manuals."],
      }),
    ],
    assumptions: templateHint.assumptions,
    unresolvedQuestions: ["What final decorative layer shapes should be modeled?"],
    exportReadiness: {
      svgCandidate: true,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: [...templateHint.svgReadiness, "Exports are not implemented in this task."],
    },
  };
}

function createLayeredCutoutParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint): DraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const pieces = [
    makePiece({
      id: "backer_layer",
      label: "Backer layer",
      pieceType: "layer",
      materialId,
      lengthInches: project.height_inches,
      widthInches: project.width_inches,
      thicknessInches: thickness,
      grainDirection: "not_applicable",
      notes: ["Base layer for layered cutout planning."],
    }),
    makePiece({
      id: "decorative_layer_placeholder",
      label: "Decorative layer placeholder",
      pieceType: "decorative_element",
      materialId,
      lengthInches: null,
      widthInches: null,
      thicknessInches: thickness,
      grainDirection: "not_applicable",
      notes: ["Future layer geometry is unresolved."],
    }),
  ];
  const glue = hardware({
    id: "wood_glue",
    label: "Wood glue",
    hardwareType: "glue",
    notes: ["Use adhesive suitable for selected materials."],
  });

  return {
    pieces,
    hardware: [glue],
    connections: [
      {
        id: "decorative_layer_to_backer_layer",
        fromPieceId: "decorative_layer_placeholder",
        toPieceId: "backer_layer",
        connectionType: "glue",
        hardwareIds: [glue.id],
        locationDescription: "Decorative layer face-glued to backer layer",
        strengthCritical: false,
        safetyNotes: ["Clamp and cure adhesive according to the product instructions."],
        notes: ["Generic adhesive connection only; exact geometry is unresolved."],
      },
    ],
    operations: [
      operation({
        id: "glue_decorative_layer",
        sequenceNumber: 1,
        operationType: "glue",
        title: "Glue decorative layer",
        description: "Attach the decorative layer to the backer after dry fitting.",
        pieceIds: ["decorative_layer_placeholder", "backer_layer"],
        toolNames: ["clamps"],
        safetyNotes: ["Follow adhesive instructions and avoid skin contact."],
      }),
    ],
    assumptions: templateHint.assumptions,
    unresolvedQuestions: ["What decorative layer shapes and sizes should be modeled?"],
    exportReadiness: {
      svgCandidate: true,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: [...templateHint.svgReadiness, "Exports are not implemented in this task."],
    },
  };
}

function createWoodSignParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint, wallMounted: boolean): DraftParts {
  const pieces = [
    makePiece({
      id: "sign_panel",
      label: "Sign panel",
      pieceType: "panel",
      materialId,
      lengthInches: project.width_inches,
      widthInches: project.height_inches,
      thicknessInches: project.material_thickness_inches,
      grainDirection: "length",
      notes: ["Flat decorative sign panel; no structural use implied."],
    }),
  ];
  const hardwareItems = wallMounted
    ? [
        hardware({
          id: "hanging_hardware",
          label: "Hanging hardware placeholder",
          hardwareType: "hanger",
          notes: ["Wall mounting requires stud, anchor, and fastener review."],
        }),
      ]
    : [];

  return {
    pieces,
    hardware: hardwareItems,
    connections: wallMounted
      ? [
          {
            id: "hanging_hardware_to_sign_panel",
            fromPieceId: "sign_panel",
            toPieceId: "sign_panel",
            connectionType: "hanger",
            hardwareIds: ["hanging_hardware"],
            locationDescription: "Back of sign panel",
            strengthCritical: true,
            safetyNotes: ["Boardsmith cannot verify wall mounting safety."],
            notes: ["Manual mounting review required."],
          },
        ]
      : [],
    operations: [
      operation({
        id: "finish_sign_panel",
        sequenceNumber: 1,
        operationType: "paint",
        title: "Finish sign panel",
        description: "Sand and apply the chosen paint or finish after confirming layout.",
        pieceIds: ["sign_panel"],
        toolNames: project.tools_available,
        safetyNotes: ["Use finishes in a ventilated area and follow product labels."],
      }),
    ],
    assumptions: templateHint.assumptions,
    unresolvedQuestions: wallMounted ? ["What hanging hardware and fasteners will be used?"] : [],
    exportReadiness: {
      svgCandidate: true,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: [...templateHint.svgReadiness, "Panel outline is known; lettering geometry is not modeled yet."],
    },
  };
}

function createBookLedgeParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint, wallMounted: boolean): DraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const width = positiveOrNull(project.width_inches);
  const height = positiveOrNull(project.height_inches);
  const depth = positiveOrNull(project.depth_inches);
  const screws = hardware({
    id: "wood_screws",
    label: "Wood screws",
    hardwareType: "screw",
    notes: ["Confirm screw length for the actual material thickness before assembly."],
  });
  const finish = hardware({
    id: "non_toxic_finish_review",
    label: "Non-toxic finish review",
    hardwareType: "finish",
    required: false,
    notes: ["Choose and verify a finish appropriate for child-adjacent use; Boardsmith does not certify finish safety."],
  });
  const wallHardware = wallMounted
    ? [
        hardware({
          id: "wall_anchors",
          label: "Wall anchors or stud fasteners",
          hardwareType: "anchor",
          notes: ["Manual wall-structure and fastener review is required before mounting."],
        }),
      ]
    : [];

  return {
    pieces: [
      makePiece({
        id: "bottom_shelf_board",
        label: "Bottom shelf board",
        pieceType: "board",
        materialId,
        lengthInches: width,
        widthInches: depth,
        thicknessInches: thickness,
        grainDirection: "length",
        notes: ["Book ledge bottom board; no load rating is implied."],
      }),
      makePiece({
        id: "back_rail",
        label: "Back rail",
        pieceType: "rail",
        materialId,
        lengthInches: width,
        widthInches: height,
        thicknessInches: thickness,
        grainDirection: "length",
        notes: ["Back rail for book support and possible mounting review; exact mounting method is unresolved."],
      }),
      makePiece({
        id: "front_lip",
        label: "Front lip",
        pieceType: "rail",
        materialId,
        lengthInches: width,
        widthInches: height,
        thicknessInches: thickness,
        grainDirection: "length",
        notes: ["Front lip helps retain books but does not certify child safety."],
      }),
    ],
    hardware: [screws, finish, ...wallHardware],
    connections: [
      {
        id: "front_lip_to_bottom_shelf_board",
        fromPieceId: "front_lip",
        toPieceId: "bottom_shelf_board",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Front edge of bottom shelf board",
        strengthCritical: true,
        safetyNotes: ["Round and sand edges; adult inspection is required before child-adjacent use."],
        notes: ["Generic book-ledge front connection placeholder."],
      },
      {
        id: "back_rail_to_bottom_shelf_board",
        fromPieceId: "back_rail",
        toPieceId: "bottom_shelf_board",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Back edge of bottom shelf board",
        strengthCritical: true,
        safetyNotes: ["Boardsmith cannot verify child safety, mounting safety, or load capacity."],
        notes: ["Generic book-ledge back connection placeholder."],
      },
      ...(wallMounted
        ? [
            {
              id: "wall_fasteners_to_back_rail",
              fromPieceId: "back_rail",
              toPieceId: "back_rail",
              connectionType: "screw" as const,
              hardwareIds: ["wall_anchors"],
              locationDescription: "Back rail mounting points",
              strengthCritical: true,
              safetyNotes: ["Verify studs, anchors, fasteners, wall structure, and expected load before use."],
              notes: ["Self-reference represents wall fasteners attached to the back rail."],
            },
          ]
        : []),
    ],
    operations: [
      operation({
        id: "cut_book_ledge_parts",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut book ledge parts",
        description: "Cut the bottom shelf board, back rail, and front lip after confirming the submitted dimensions.",
        pieceIds: ["bottom_shelf_board", "back_rail", "front_lip"],
        toolNames: project.tools_available,
        safetyNotes: ["Clamp work, wear eye protection, and verify measurements before cutting."],
      }),
      operation({
        id: "round_and_sand_edges",
        sequenceNumber: 2,
        operationType: "sand",
        title: "Round and sand edges",
        description: "Ease exposed edges and sand smooth before finish review.",
        pieceIds: ["bottom_shelf_board", "back_rail", "front_lip"],
        toolNames: project.tools_available,
        safetyNotes: ["Child-adjacent projects need careful adult edge inspection; Boardsmith does not certify child safety."],
      }),
      operation({
        id: "assemble_book_ledge",
        sequenceNumber: 3,
        operationType: "assemble",
        title: "Assemble book ledge",
        description: "Dry fit the rails and bottom shelf board, then fasten only after checking alignment and screw length.",
        pieceIds: ["bottom_shelf_board", "back_rail", "front_lip"],
        toolNames: project.tools_available,
        safetyNotes: ["Do not rely on Boardsmith for load ratings or child-safety approval."],
      }),
      ...(wallMounted
        ? [
            operation({
              id: "inspect_book_ledge_mounting",
              sequenceNumber: 4,
              operationType: "inspect",
              title: "Inspect mounting approach",
              description: "Review wall structure, studs or anchors, fasteners, and expected use before mounting.",
              pieceIds: ["back_rail"],
              toolNames: project.tools_available,
              safetyNotes: ["Manual wall mounting review is required; no mounting safety is guaranteed."],
            }),
          ]
        : []),
    ],
    assumptions: [
      ...templateHint.assumptions,
      "Book ledge proportions are bounded by the submitted project dimensions.",
      "Child-adjacent use requires adult review, rounded edges, finish review, mounting review, and ongoing inspection.",
    ],
    unresolvedQuestions: [
      ...(wallMounted ? ["What wall type, stud spacing, anchor type, and fasteners will be used?"] : []),
      "What adult-reviewed finish is appropriate for the intended child-adjacent use?",
      "What load, if any, is expected? Boardsmith will not certify load capacity.",
    ],
    exportReadiness: {
      svgCandidate: false,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: ["Book ledge pieces are modeled for planning review only.", "This MVP uses browser print only; no PDF or CAD download is generated."],
    },
  };
}

function createSimpleShelfParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint, wallMounted: boolean): DraftParts {
  if (isBookLedge(project)) {
    return createBookLedgeParts(project, materialId, templateHint, wallMounted);
  }

  const bathroomOrHumidity = isBathroomOrHumidityProject(project);
  const shelfLayout = analyzeShelfLayoutIntent(project);
  const shelfQuantity = shelfLayout.shelfCount && shelfLayout.shelfCount > 1 ? shelfLayout.shelfCount : 1;
  const shelfLabel = shelfQuantity > 1 ? "Shelf boards" : "Shelf board";
  const shelfLayoutMissing = shelfLayout.missingShelfCount;
  const shelfSpacing = project.shelf_spacing_inches;
  const multipleSeparateWallShelves = project.shelf_layout === "multiple_separate_shelves" && shelfQuantity > 1;
  const connectedShelfUnit = project.shelf_layout === "multi_shelf_unit" && shelfQuantity > 1;
  const hardwareItems = [
    ...(wallMounted
      ? [
          hardware({
            id: "wall_brackets",
            label: connectedShelfUnit ? "Support method to review" : "Wall bracket placeholders",
            hardwareType: "bracket",
            quantity: multipleSeparateWallShelves ? shelfQuantity * 2 : connectedShelfUnit ? null : 2,
            notes: [
              multipleSeparateWallShelves
                ? `Cautious placeholder only: assumes 2 brackets per shelf, so ${shelfQuantity.toString()} shelves means ${(shelfQuantity * 2).toString()} brackets before final review.`
                : connectedShelfUnit
                  ? "Connected shelf units need verified side supports, frame, cleat, brackets, or another support method before hardware quantity can be trusted."
                  : "Bracket selection affects safe use but no load rating is provided.",
              "Final hardware quantity depends on bracket type, expected load, wall structure, and support design.",
            ],
          }),
          hardware({
            id: "wall_anchors",
            label: "Wall anchors or stud fasteners",
            hardwareType: "anchor",
            notes: ["Use hardware appropriate for wall structure after review."],
          }),
        ]
      : []),
    ...(bathroomOrHumidity
      ? [
          hardware({
            id: "moisture_resistant_finish_review",
            label: "Moisture-resistant finish review",
            hardwareType: "finish",
            required: false,
            notes: ["Bathroom humidity requires finish and hardware review; no waterproof claim is implied."],
          }),
        ]
      : []),
  ];

  return {
    pieces: [
      makePiece({
        id: "shelf_board",
        label: shelfLabel,
        quantity: shelfQuantity,
        pieceType: "board",
        materialId,
        lengthInches: project.width_inches,
        widthInches: project.depth_inches,
        thicknessInches: project.material_thickness_inches,
        grainDirection: "length",
        notes: [
          "No load rating is implied.",
          ...(shelfQuantity > 1 ? [`Quantity set from shelf layout intake as ${shelfQuantity.toString()} shelves.`] : []),
          ...(shelfLayoutMissing ? ["Shelf count/layout is missing; do not treat this as a complete one-board shelf plan."] : []),
          ...(bathroomOrHumidity ? ["Bathroom humidity and finish choice require manual review."] : []),
        ],
      }),
    ],
    hardware: hardwareItems,
    connections: wallMounted
      ? [
          {
            id: "wall_brackets_to_shelf_board",
            fromPieceId: "shelf_board",
            toPieceId: "shelf_board",
            connectionType: "bracket",
            hardwareIds: ["wall_brackets", "wall_anchors"],
            locationDescription: "Under shelf board at mounting points",
            strengthCritical: true,
            safetyNotes: ["Each shelf needs a verified support method before mounting or loading."],
            notes: [
              connectedShelfUnit
                ? "Connected shelf unit support/frame details are not specified; do not rely on a fixed bracket count."
                : "Manual mounting review required before use.",
            ],
          },
        ]
      : [],
    operations: [
      operation({
        id: "cut_shelf_board",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut shelf board",
        description: "Confirm the shelf dimensions, then cut the shelf board from the selected material.",
        pieceIds: ["shelf_board"],
        toolNames: project.tools_available,
        safetyNotes: ["Measure twice before cutting and do not rely on Boardsmith for load ratings."],
      }),
      operation({
        id: "sand_shelf_board",
        sequenceNumber: 2,
        operationType: "sand",
        title: "Sand shelf board",
        description: "Sand exposed edges and faces before assembly, finish, or mounting review.",
        pieceIds: ["shelf_board"],
        toolNames: project.tools_available,
        safetyNotes: ["Wear appropriate PPE and control dust."],
      }),
      ...(wallMounted
        ? [
            operation({
              id: "inspect_mounting_location",
              sequenceNumber: 3,
              operationType: "inspect",
              title: "Inspect mounting location",
              description: "Review wall structure, stud locations, anchor choice, fasteners, and expected use before drilling or mounting.",
              pieceIds: ["shelf_board"],
              toolNames: project.tools_available,
              safetyNotes: ["Manual mounting review is required; Boardsmith cannot verify wall safety or load capacity."],
            }),
          ]
        : []),
      ...(bathroomOrHumidity
        ? [
            operation({
              id: "review_bathroom_finish",
              sequenceNumber: wallMounted ? 4 : 3,
              operationType: "inspect",
              title: "Review bathroom finish",
              description: "Choose finish and hardware appropriate for bathroom humidity before use.",
              pieceIds: ["shelf_board"],
              toolNames: project.tools_available,
              safetyNotes: ["Boardsmith cannot verify waterproofing, corrosion resistance, or long-term moisture performance."],
            }),
          ]
        : []),
    ],
    assumptions: wallMounted
      ? [
          ...templateHint.assumptions,
          ...(shelfQuantity > 1 ? [`The intake describes ${shelfQuantity.toString()} shelves; spacing and support details still need review.`] : []),
          ...(multipleSeparateWallShelves
            ? [`Bracket placeholder uses 2 per shelf for planning only: ${(shelfQuantity * 2).toString()} brackets for ${shelfQuantity.toString()} shelves.`]
            : []),
          ...(connectedShelfUnit ? ["Connected shelf unit support/frame details are not specified, so support hardware quantity remains to review."] : []),
          ...(shelfQuantity > 1 && shelfSpacing ? [`The intake gives approximate shelf spacing as ${shelfSpacing.toString()} inches.`] : []),
          ...(bathroomOrHumidity ? ["Bathroom humidity may require moisture-resistant finish and corrosion-resistant hardware review."] : []),
        ]
      : [
          "Project is treated as freestanding or non-mounted because the intake does not ask for wall mounting.",
          ...(shelfQuantity > 1 ? [`The intake describes ${shelfQuantity.toString()} shelves; spacing and support details still need review.`] : []),
          ...(shelfQuantity > 1 && shelfSpacing ? [`The intake gives approximate shelf spacing as ${shelfSpacing.toString()} inches.`] : []),
        ],
    unresolvedQuestions: [
      ...(shelfLayoutMissing
        ? ["How many shelves or openings are intended? Add the shelf count before generating a final shelf plan."]
        : []),
      ...(wallMounted ? ["What wall type, bracket type, and fasteners will be used?"] : []),
      ...(bathroomOrHumidity ? ["What finish and hardware are appropriate for bathroom humidity?"] : []),
      "What load, if any, is expected? Boardsmith will not certify load capacity.",
    ],
    exportReadiness: {
      svgCandidate: false,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: wallMounted
        ? [...templateHint.svgReadiness, "Future output review is limited until mounting and support details are reviewed."]
        : ["Future output review should distinguish the shelf board or riser top from any optional supports.", "This MVP uses browser print only; no PDF or CAD download is generated."],
    },
  };
}

function createPlanterBoxParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint): DraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const width = positiveOrNull(project.width_inches);
  const height = positiveOrNull(project.height_inches);
  const depth = positiveOrNull(project.depth_inches);
  const screws = hardware({
    id: "outdoor_screws",
    label: "Outdoor-rated screws",
    hardwareType: "screw",
    notes: ["Use fasteners suitable for outdoor exposure."],
  });
  const finish = hardware({
    id: "exterior_finish",
    label: "Exterior finish or sealant",
    hardwareType: "finish",
    notes: ["Use a finish compatible with outdoor use and intended plants."],
  });

  return {
    pieces: [
      makePiece({ id: "front_panel", label: "Front panel", pieceType: "board", materialId, lengthInches: width, widthInches: height, thicknessInches: thickness, grainDirection: "length" }),
      makePiece({ id: "back_panel", label: "Back panel", pieceType: "board", materialId, lengthInches: width, widthInches: height, thicknessInches: thickness, grainDirection: "length" }),
      makePiece({ id: "left_side_panel", label: "Left side panel", pieceType: "board", materialId, lengthInches: depth, widthInches: height, thicknessInches: thickness, grainDirection: "length" }),
      makePiece({ id: "right_side_panel", label: "Right side panel", pieceType: "board", materialId, lengthInches: depth, widthInches: height, thicknessInches: thickness, grainDirection: "length" }),
      makePiece({ id: "bottom_panel", label: "Bottom panel", pieceType: "board", materialId, lengthInches: width, widthInches: depth, thicknessInches: thickness, grainDirection: "length", notes: ["Drainage is required for planter use."] }),
    ],
    hardware: [screws, finish],
    connections: [
      {
        id: "front_panel_to_bottom_panel",
        fromPieceId: "front_panel",
        toPieceId: "bottom_panel",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Lower front edge",
        strengthCritical: false,
        safetyNotes: ["Soil and water add weight; review placement before use."],
        notes: ["Generic planter-box connection placeholder."],
      },
      {
        id: "back_panel_to_bottom_panel",
        fromPieceId: "back_panel",
        toPieceId: "bottom_panel",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Lower back edge",
        strengthCritical: false,
        safetyNotes: ["Use outdoor-suitable fasteners."],
        notes: ["Generic planter-box connection placeholder."],
      },
    ],
    operations: [
      operation({
        id: "drill_drainage_holes",
        sequenceNumber: 1,
        operationType: "drill",
        title: "Drill drainage holes",
        description: "Plan drainage holes in the bottom panel before final assembly.",
        pieceIds: ["bottom_panel"],
        toolNames: project.tools_available,
        safetyNotes: ["Clamp work before drilling and wear eye protection."],
      }),
      operation({
        id: "apply_exterior_finish",
        sequenceNumber: 2,
        operationType: "seal",
        title: "Apply exterior finish",
        description: "Apply an outdoor-appropriate finish or liner after reviewing plant safety and product instructions.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: ["paint brush"],
        safetyNotes: ["Use finishes in a ventilated area and follow product labels."],
      }),
    ],
    assumptions: templateHint.assumptions,
    unresolvedQuestions: ["What drainage-hole layout and liner approach should be used?"],
    exportReadiness: {
      svgCandidate: false,
      pdfCandidate: true,
      dxfCandidate: false,
      cadCandidate: false,
      notes: [...templateHint.svgReadiness, "Board-level model is suitable for planning but not export."],
    },
  };
}

function createParts(project: BuildModelDraftProject, materialId: string, templateHint: TemplateHint, wallMounted: boolean): DraftParts {
  switch (project.project_type) {
    case "door_hanger":
      return createDoorHangerParts(project, materialId, templateHint, wallMounted);
    case "layered_cutout":
      return createLayeredCutoutParts(project, materialId, templateHint);
    case "wood_sign":
      return createWoodSignParts(project, materialId, templateHint, wallMounted);
    case "simple_shelf":
      return createSimpleShelfParts(project, materialId, templateHint, wallMounted);
    case "planter_box":
      return createPlanterBoxParts(project, materialId, templateHint);
  }
}

function confidenceFor(project: BuildModelDraftProject, safetyFlags: BuildModelSafetyFlag[], unresolvedQuestions: string[]): BoardsmithBuildModel["confidence"] {
  const hasHighReview = safetyFlags.some((flag) => flag.severity === "high_review");
  const hasMissingCoreData = !positiveOrNull(project.width_inches) || !positiveOrNull(project.height_inches) || !positiveOrNull(project.material_thickness_inches);
  const shelfMissingMountingContext = project.project_type === "simple_shelf" && (hasHighReview || !positiveOrNull(project.depth_inches));
  const shelfLayoutMissing = analyzeShelfLayoutIntent(project).missingShelfCount;

  if (hasHighReview || hasMissingCoreData || shelfMissingMountingContext || shelfLayoutMissing || unresolvedQuestions.length >= 3) {
    return {
      level: "low",
      reasons: shelfLayoutMissing
        ? ["Shelf count/layout is missing, so Boardsmith cannot treat this as a complete shelf plan."]
        : ["Important dimensions, mounting details, or safety review items remain unresolved."],
    };
  }

  return {
    level: "medium",
    reasons: ["The draft is deterministic and conservative; builder review is still required."],
  };
}

export function createBuildModelDraft(
  project: BuildModelDraftProject,
  templateHint: TemplateHint = getTemplateHint(project.project_type),
  safetyFlags: SafetyReviewFlag[] = [],
): BoardsmithBuildModel {
  if (!isSupportedProjectType(project.project_type)) {
    throw new Error(`Unsupported project type: ${String(project.project_type)}`);
  }

  const material = createPrimaryMaterial(project);
  const wallMounted = isWallMounted(project, safetyFlags);
  const mappedSafetyFlags = safetyFlags.map((flag) => mapSafetyFlag(flag));
  const parts = createParts(project, material.id, templateHint, wallMounted);
  const unresolvedQuestions = [...new Set([...missingDimensionQuestions(project), ...parts.unresolvedQuestions])];
  const templateAssumptions =
    !wallMounted && project.project_type === "simple_shelf"
      ? [...templateHint.assumptions, ...templateHint.cautions].filter((message) => !isWallGuidance(message))
      : [...templateHint.assumptions, ...templateHint.cautions];
  const assumptions = [...new Set([...templateAssumptions, ...parts.assumptions])];
  const reviewRequired = mappedSafetyFlags.length > 0 || wallMounted || project.project_type === "planter_box";
  const safetyDisclaimers = [
    genericDisclaimer,
    noLoadDisclaimer,
    ...(wallMounted ? ["Wall mounting requires manual review of hardware, anchors, studs, and wall structure."] : []),
  ];
  const confidence = confidenceFor(project, mappedSafetyFlags, unresolvedQuestions);

  return parseBoardsmithBuildModel({
    schemaVersion: "1.0",
    units: "inches",
    project: {
      projectId: project.id,
      projectType: project.project_type,
      title: project.title,
      intendedUse: project.intended_use || null,
      skillLevel: project.skill_level,
    },
    dimensions: {
      widthInches: positiveOrNull(project.width_inches),
      heightInches: positiveOrNull(project.height_inches),
      depthInches: positiveOrNull(project.depth_inches),
      materialThicknessInches: positiveOrNull(project.material_thickness_inches),
    },
    pieces: parts.pieces,
    materials: [material],
    hardware: parts.hardware,
    connections: parts.connections,
    operations: parts.operations,
    safety: {
      reviewRequired,
      flags: mappedSafetyFlags,
      disclaimers: safetyDisclaimers,
    },
    assumptions,
    unresolvedQuestions,
    exportReadiness: parts.exportReadiness,
    confidence,
  });
}
