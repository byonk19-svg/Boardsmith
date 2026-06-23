import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { findShelfLayoutIssues, hasImpossibleShelfHeight } from "@/lib/projects/shelf-layout-validation";
import type { ProjectType, ToolOption } from "@/lib/projects/types";
import { isBathroomOrHumidityText } from "@/lib/projects/wall-shelf-intent";
import type { TemplateHint } from "@/lib/templates/template-hints";
import {
  createBuildModelHardware,
  createBuildModelOperation,
  makeBuildModelPiece,
  positiveOrNull,
  textIncludes,
  type BuildModelDraftParts,
  type BuildModelDraftProject,
} from "@/lib/build-model/build-model-draft-primitives";

type SupportedProjectTypeDraftContext = {
  project: BuildModelDraftProject;
  materialId: string;
  templateHint: TemplateHint;
  wallMounted: boolean;
};

type SupportedProjectTypeDraftAdapter = {
  projectType: ProjectType;
  createParts: (context: SupportedProjectTypeDraftContext) => BuildModelDraftParts;
};

function isBookLedge(project: BuildModelDraftProject): boolean {
  return textIncludes(project, /\b(book\s*ledge|book\s*rail|toddler\s+book|nursery\s+book|children'?s\s+book)\b/);
}

function isBathroomOrHumidityProject(project: BuildModelDraftProject): boolean {
  return isBathroomOrHumidityText(project);
}

function selectedTools(project: BuildModelDraftProject, preferred: ToolOption[], fallback: string): string[] {
  const available = new Set(project.tools_available);
  const selected = preferred.filter((tool) => available.has(tool));
  return selected.length > 0 ? selected : [fallback];
}

function reviewTools(project: BuildModelDraftProject): string[] {
  return selectedTools(project, ["tape_measure", "pencil"], "measurement tools to confirm");
}

function cutTools(project: BuildModelDraftProject): string[] {
  const cuttingTool = selectedTools(project, ["miter_saw", "circular_saw", "jigsaw"], "cutting tool to review").at(0) ?? "cutting tool to review";
  return [...selectedTools(project, ["tape_measure", "pencil"], "measuring and marking tools to confirm"), cuttingTool];
}

function sandTools(project: BuildModelDraftProject): string[] {
  return selectedTools(project, ["sander"], "sandpaper or sander to review");
}

function finishTools(project: BuildModelDraftProject): string[] {
  return selectedTools(project, ["paint_brush"], "finish applicator to review");
}

function mountingTools(project: BuildModelDraftProject): string[] {
  return selectedTools(project, ["tape_measure", "pencil", "drill"], "mounting review tools to confirm");
}

function createDoorHangerParts({ project, materialId, templateHint, wallMounted }: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const pieces = [
    makeBuildModelPiece({
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
    makeBuildModelPiece({
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
  const hangingHardware = createBuildModelHardware({
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
      createBuildModelOperation({
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

function createLayeredCutoutParts({ project, materialId, templateHint }: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const pieces = [
    makeBuildModelPiece({
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
    makeBuildModelPiece({
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
  const glue = createBuildModelHardware({
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
      createBuildModelOperation({
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

function createWoodSignParts({ project, materialId, templateHint, wallMounted }: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const pieces = [
    makeBuildModelPiece({
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
        createBuildModelHardware({
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
      createBuildModelOperation({
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

function createBookLedgeParts(context: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const { project, materialId, templateHint, wallMounted } = context;
  const thickness = positiveOrNull(project.material_thickness_inches);
  const width = positiveOrNull(project.width_inches);
  const height = positiveOrNull(project.height_inches);
  const depth = positiveOrNull(project.depth_inches);
  const screws = createBuildModelHardware({
    id: "wood_screws",
    label: "Wood screws",
    hardwareType: "screw",
    notes: ["Confirm screw length for the actual material thickness before assembly."],
  });
  const finish = createBuildModelHardware({
    id: "non_toxic_finish_review",
    label: "Non-toxic finish review",
    hardwareType: "finish",
    required: false,
    notes: ["Choose and verify a finish appropriate for child-adjacent use; Boardsmith does not certify finish safety."],
  });
  const wallHardware = wallMounted
    ? [
        createBuildModelHardware({
          id: "wall_anchors",
          label: "Wall anchors or stud fasteners",
          hardwareType: "anchor",
          notes: ["Manual wall-structure and fastener review is required before mounting."],
        }),
      ]
    : [];

  return {
    pieces: [
      makeBuildModelPiece({
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
      makeBuildModelPiece({
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
      makeBuildModelPiece({
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
      createBuildModelOperation({
        id: "cut_book_ledge_parts",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut book ledge parts",
        description: "Cut the bottom shelf board, back rail, and front lip after confirming the submitted dimensions.",
        pieceIds: ["bottom_shelf_board", "back_rail", "front_lip"],
        toolNames: project.tools_available,
        safetyNotes: ["Clamp work, wear eye protection, and verify measurements before cutting."],
      }),
      createBuildModelOperation({
        id: "round_and_sand_edges",
        sequenceNumber: 2,
        operationType: "sand",
        title: "Round and sand edges",
        description: "Ease exposed edges and sand smooth before finish review.",
        pieceIds: ["bottom_shelf_board", "back_rail", "front_lip"],
        toolNames: project.tools_available,
        safetyNotes: ["Child-adjacent projects need careful adult edge inspection; Boardsmith does not certify child safety."],
      }),
      createBuildModelOperation({
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
            createBuildModelOperation({
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

function createSimpleShelfParts(context: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const { project, materialId, templateHint, wallMounted } = context;
  if (isBookLedge(project)) {
    return createBookLedgeParts(context);
  }

  const bathroomOrHumidity = isBathroomOrHumidityProject(project);
  const shelfLayout = analyzeShelfLayoutIntent(project);
  const shelfQuantity = shelfLayout.shelfCount && shelfLayout.shelfCount > 1 ? shelfLayout.shelfCount : 1;
  const shelfLabel = shelfQuantity > 1 ? "Shelf boards" : "Shelf board";
  const shelfLayoutMissing = shelfLayout.missingShelfCount;
  const shelfSpacing = project.shelf_spacing_inches;
  const multipleSeparateWallShelves = project.shelf_layout === "multiple_separate_shelves" && shelfQuantity > 1;
  const connectedShelfUnit = project.shelf_layout === "multi_shelf_unit" && shelfQuantity > 1;
  const shelfLayoutIssues = findShelfLayoutIssues(project);
  const hasConnectedSupportIssue = shelfLayoutIssues.some((issue) => issue.code === "connected_shelf_support_incomplete");
  const supportFrameLengthInches = hasImpossibleShelfHeight(project) ? null : project.height_inches;
  const mountingStepNumber = connectedShelfUnit ? 4 : 3;
  const finishStepNumber = wallMounted ? (connectedShelfUnit ? 5 : 4) : connectedShelfUnit ? 4 : 3;
  const hardwareItems = [
    ...(wallMounted
      ? [
          createBuildModelHardware({
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
          createBuildModelHardware({
            id: "wall_anchors",
            label: "Wall anchors or stud fasteners",
            hardwareType: "anchor",
            notes: ["Use hardware appropriate for wall structure after review."],
          }),
        ]
      : []),
    ...(bathroomOrHumidity
      ? [
          createBuildModelHardware({
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
      makeBuildModelPiece({
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
      ...(connectedShelfUnit
        ? [
            makeBuildModelPiece({
              id: "side_support_frame_placeholder",
              label: "Side support/frame placeholders",
              quantity: 2,
              pieceType: "other",
              materialId,
              lengthInches: supportFrameLengthInches,
              widthInches: project.depth_inches,
              thicknessInches: project.material_thickness_inches,
              grainDirection: "length",
              notes: [
                "Connected shelf unit support/frame details are unresolved.",
                ...(supportFrameLengthInches ? [] : ["Total height needs review before support/frame piece dimensions can be trusted."]),
                "Confirm side supports, frame, cleats, or bracket design before cutting or assembly.",
              ],
            }),
          ]
        : []),
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
      createBuildModelOperation({
        id: "cut_shelf_board",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut shelf board",
        description: "Confirm the shelf dimensions, then cut the shelf board from the selected material.",
        pieceIds: ["shelf_board"],
        toolNames: cutTools(project),
        safetyNotes: ["Measure twice before cutting and do not rely on Boardsmith for load ratings."],
      }),
      createBuildModelOperation({
        id: "sand_shelf_board",
        sequenceNumber: 2,
        operationType: "sand",
        title: "Sand shelf board",
        description: "Sand exposed edges and faces before assembly, finish, or mounting review.",
        pieceIds: ["shelf_board"],
        toolNames: sandTools(project),
        safetyNotes: ["Wear appropriate PPE and control dust."],
      }),
      ...(connectedShelfUnit
        ? [
            createBuildModelOperation({
              id: "confirm_support_frame_design",
              sequenceNumber: 3,
              operationType: "inspect",
              title: "Confirm support/frame design before assembly",
              description:
                "Choose verified side supports, frame, cleat, bracket, or other support method before assembling or mounting this connected shelf unit.",
              pieceIds: ["shelf_board", "side_support_frame_placeholder"],
              toolNames: reviewTools(project),
              safetyNotes: ["Do not treat shelf boards alone as a complete connected shelf unit."],
            }),
          ]
        : []),
      ...(wallMounted
        ? [
            createBuildModelOperation({
              id: "inspect_mounting_location",
              sequenceNumber: mountingStepNumber,
              operationType: "inspect",
              title: "Inspect mounting location",
              description: "Review wall structure, stud locations, anchor choice, fasteners, and expected use before drilling or mounting.",
              pieceIds: ["shelf_board"],
              toolNames: mountingTools(project),
              safetyNotes: ["Manual mounting review is required; Boardsmith cannot verify wall safety or load capacity."],
            }),
          ]
        : []),
      ...(bathroomOrHumidity
        ? [
            createBuildModelOperation({
              id: "review_bathroom_finish",
              sequenceNumber: finishStepNumber,
              operationType: "inspect",
              title: "Review bathroom finish",
              description: "Choose finish and hardware appropriate for bathroom humidity before use.",
              pieceIds: ["shelf_board"],
              toolNames: finishTools(project),
              safetyNotes: ["Boardsmith cannot verify waterproofing, corrosion resistance, or long-term moisture performance."],
            }),
          ]
        : []),
    ],
    assumptions: [
      ...(wallMounted ? templateHint.assumptions : []),
      ...(!wallMounted && !connectedShelfUnit ? ["Project is treated as non-wall-mounted only because the intake explicitly excludes wall mounting."] : []),
      ...(wallMounted && !connectedShelfUnit ? ["Mounting/support method is unresolved and must be reviewed before installation."] : []),
      ...(shelfQuantity > 1 ? [`The intake describes ${shelfQuantity.toString()} shelves; spacing and support details still need review.`] : []),
      ...(wallMounted && multipleSeparateWallShelves
        ? [`Bracket placeholder uses 2 per shelf for planning only: ${(shelfQuantity * 2).toString()} brackets for ${shelfQuantity.toString()} shelves.`]
        : []),
      ...(connectedShelfUnit ? ["Connected shelf unit support/frame details are not specified, so support hardware quantity remains to review."] : []),
      ...(hasConnectedSupportIssue ? ["Connected shelf units need side supports, frame, cleat, brackets, or another verified support method before the build packet is complete."] : []),
      ...(shelfQuantity > 1 && shelfSpacing ? [`The intake gives approximate shelf spacing as ${shelfSpacing.toString()} inches.`] : []),
      ...(wallMounted && bathroomOrHumidity ? ["Bathroom humidity may require moisture-resistant finish and corrosion-resistant hardware review."] : []),
    ],
    unresolvedQuestions: [
      ...(shelfLayoutMissing
        ? ["How many shelves or openings are intended? Add the shelf count before generating a final shelf plan."]
        : []),
      ...(wallMounted ? ["What wall type, bracket type, and fasteners will be used?"] : []),
      ...(hasConnectedSupportIssue ? ["What side support, frame, cleat, bracket, or other support design connects the shelves?"] : []),
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

function createPlanterBoxParts({ project, materialId, templateHint }: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const thickness = positiveOrNull(project.material_thickness_inches);
  const width = positiveOrNull(project.width_inches);
  const height = positiveOrNull(project.height_inches);
  const depth = positiveOrNull(project.depth_inches);
  const panelLayoutNotes = [
    "Modeled planter panels are panel envelopes; actual stock boards may need to be assembled from multiple boards, slats, or courses when stock board width is smaller than the modeled panel height or bottom depth.",
    "Review actual board width, board movement, drainage gaps, liner choice, and water/soil exposure before treating any modeled panel as a single board.",
  ];
  const connectionSafetyNotes = [
    "Soil and water add weight; review placement and do not treat this as load-capacity approval.",
    "Use outdoor-suitable fasteners and review water/soil exposure before use.",
    "Drill pilot holes near board ends and review splitting risk before fastening.",
  ];
  const connectionAssemblyNotes = [
    "Dry-fit and clamp the planter square before fastening; check front, back, side, and bottom alignment before driving screws.",
    "Confirm screw length, spacing, and edge distance against actual material thickness and board layout.",
    "Keep drainage, liner, and water/soil exposure review separate from this connection planning aid.",
  ];
  const screws = createBuildModelHardware({
    id: "outdoor_screws",
    label: "Outdoor-rated screws",
    hardwareType: "screw",
    notes: ["Use fasteners suitable for outdoor exposure."],
  });
  const finish = createBuildModelHardware({
    id: "exterior_finish",
    label: "Exterior finish or sealant",
    hardwareType: "finish",
    notes: ["Use a finish compatible with outdoor use and intended plants."],
  });

  return {
    pieces: [
      makeBuildModelPiece({ id: "front_panel", label: "Front panel", pieceType: "board", materialId, lengthInches: width, widthInches: height, thicknessInches: thickness, grainDirection: "length", notes: panelLayoutNotes }),
      makeBuildModelPiece({ id: "back_panel", label: "Back panel", pieceType: "board", materialId, lengthInches: width, widthInches: height, thicknessInches: thickness, grainDirection: "length", notes: panelLayoutNotes }),
      makeBuildModelPiece({ id: "left_side_panel", label: "Left side panel", pieceType: "board", materialId, lengthInches: depth, widthInches: height, thicknessInches: thickness, grainDirection: "length", notes: panelLayoutNotes }),
      makeBuildModelPiece({ id: "right_side_panel", label: "Right side panel", pieceType: "board", materialId, lengthInches: depth, widthInches: height, thicknessInches: thickness, grainDirection: "length", notes: panelLayoutNotes }),
      makeBuildModelPiece({ id: "bottom_panel", label: "Bottom panel", pieceType: "board", materialId, lengthInches: width, widthInches: depth, thicknessInches: thickness, grainDirection: "length", notes: ["Drainage is required for planter use.", ...panelLayoutNotes] }),
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
        safetyNotes: connectionSafetyNotes,
        notes: ["Review front panel fastening to the bottom panel after the side panels are dry-fit.", ...connectionAssemblyNotes],
      },
      {
        id: "back_panel_to_bottom_panel",
        fromPieceId: "back_panel",
        toPieceId: "bottom_panel",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Lower back edge",
        strengthCritical: false,
        safetyNotes: connectionSafetyNotes,
        notes: ["Review back panel fastening to the bottom panel after the side panels are dry-fit.", ...connectionAssemblyNotes],
      },
      {
        id: "left_side_panel_to_front_back_bottom",
        fromPieceId: "left_side_panel",
        toPieceId: "bottom_panel",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Left side edges at front, back, and bottom panels",
        strengthCritical: false,
        safetyNotes: connectionSafetyNotes,
        notes: ["Review how the left side panel fastens to the front, back, and bottom panels before committing to screw locations.", ...connectionAssemblyNotes],
      },
      {
        id: "right_side_panel_to_front_back_bottom",
        fromPieceId: "right_side_panel",
        toPieceId: "bottom_panel",
        connectionType: "screw",
        hardwareIds: [screws.id],
        locationDescription: "Right side edges at front, back, and bottom panels",
        strengthCritical: false,
        safetyNotes: connectionSafetyNotes,
        notes: ["Review how the right side panel fastens to the front, back, and bottom panels before committing to screw locations.", ...connectionAssemblyNotes],
      },
    ],
    operations: [
      createBuildModelOperation({
        id: "cut_planter_panels",
        sequenceNumber: 1,
        operationType: "cut",
        title: "Cut planter panels",
        description: "Confirm stock-board layout, then cut front, back, side, and bottom panels from the selected material.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: cutTools(project),
        safetyNotes: ["Measure every panel before cutting and stop if stock-board width changes the panel plan."],
      }),
      createBuildModelOperation({
        id: "drill_drainage_holes",
        sequenceNumber: 2,
        operationType: "drill",
        title: "Drill drainage holes",
        description: "Plan drainage holes in the bottom panel before final assembly.",
        pieceIds: ["bottom_panel"],
        toolNames: project.tools_available,
        safetyNotes: ["Clamp work before drilling and wear eye protection."],
      }),
      createBuildModelOperation({
        id: "dry_fit_planter_panels",
        sequenceNumber: 3,
        operationType: "inspect",
        title: "Dry fit planter panels",
        description: "Dry-fit the front, back, side, and bottom panels square before choosing final fastener locations.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: reviewTools(project),
        safetyNotes: ["Confirm fit, square, pilot holes, and edge distance before fastening."],
      }),
      createBuildModelOperation({
        id: "fasten_planter_panels",
        sequenceNumber: 4,
        operationType: "inspect",
        title: "Review planter panel fastening",
        description: "Review screw length, spacing, pilot holes, edge distance, and outdoor suitability before fastening the panels.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: reviewTools(project),
        safetyNotes: connectionSafetyNotes,
      }),
      createBuildModelOperation({
        id: "apply_exterior_finish",
        sequenceNumber: 5,
        operationType: "seal",
        title: "Apply exterior finish",
        description: "Apply an outdoor-appropriate finish or liner after reviewing plant safety and product instructions.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: ["paint brush"],
        safetyNotes: ["Use finishes in a ventilated area and follow product labels."],
      }),
      createBuildModelOperation({
        id: "review_drainage_finish_and_connections",
        sequenceNumber: 6,
        operationType: "inspect",
        title: "Review planter before use",
        description: "Review drainage, liner, finish cure, fasteners, panel fit, and placement before adding soil or water.",
        pieceIds: ["front_panel", "back_panel", "left_side_panel", "right_side_panel", "bottom_panel"],
        toolNames: reviewTools(project),
        safetyNotes: ["Soil and water add weight; review placement and do not treat this as load-capacity approval."],
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

const supportedProjectTypeDraftAdapters: Record<ProjectType, SupportedProjectTypeDraftAdapter> = {
  door_hanger: {
    projectType: "door_hanger",
    createParts: createDoorHangerParts,
  },
  layered_cutout: {
    projectType: "layered_cutout",
    createParts: createLayeredCutoutParts,
  },
  wood_sign: {
    projectType: "wood_sign",
    createParts: createWoodSignParts,
  },
  simple_shelf: {
    projectType: "simple_shelf",
    createParts: createSimpleShelfParts,
  },
  planter_box: {
    projectType: "planter_box",
    createParts: createPlanterBoxParts,
  },
};

export function supportedProjectTypeDraftAdapterProjectTypes(): ProjectType[] {
  return Object.values(supportedProjectTypeDraftAdapters).map((adapter) => adapter.projectType);
}

export function createSupportedProjectTypeDraftParts(context: SupportedProjectTypeDraftContext): BuildModelDraftParts {
  const adapter = supportedProjectTypeDraftAdapters[context.project.project_type];
  return adapter.createParts(context);
}
