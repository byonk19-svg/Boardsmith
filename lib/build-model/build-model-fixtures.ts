import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";

const safetyDisclaimer = "Boardsmith plans are review aids. Verify dimensions, tools, materials, and safety requirements before building.";

export const doorHangerBuildModelFixture: BoardsmithBuildModel = {
  schemaVersion: "1.0",
  units: "inches",
  project: {
    projectId: "fixture_door_hanger",
    projectType: "door_hanger",
    title: "Round welcome door hanger",
    intendedUse: "Indoor seasonal door decoration",
    skillLevel: "beginner",
  },
  dimensions: {
    widthInches: 18,
    heightInches: 18,
    depthInches: null,
    materialThicknessInches: 0.25,
  },
  pieces: [
    {
      id: "round_backer",
      label: "Round backer panel",
      quantity: 1,
      pieceType: "panel",
      materialId: "quarter_inch_plywood",
      dimensions: {
        lengthInches: 18,
        widthInches: 18,
        thicknessInches: 0.25,
      },
      grainDirection: "not_applicable",
      notes: ["Decorative flat backer only; verify final shape before cutting."],
    },
  ],
  materials: [
    {
      id: "quarter_inch_plywood",
      label: "1/4 inch plywood",
      materialType: "plywood",
      nominalThicknessInches: 0.25,
      recommendedForProject: true,
      notes: ["Inspect for flatness and voids."],
    },
  ],
  hardware: [
    {
      id: "hanging_ribbon",
      label: "Hanging ribbon or cord",
      quantity: 1,
      hardwareType: "hanger",
      sizeDescription: null,
      required: true,
      notes: ["Confirm door clearance before hanging."],
    },
  ],
  connections: [
    {
      id: "ribbon_to_backer",
      fromPieceId: "round_backer",
      toPieceId: "round_backer",
      connectionType: "hanger",
      hardwareIds: ["hanging_ribbon"],
      locationDescription: "Top center of backer",
      strengthCritical: false,
      safetyNotes: ["Verify hanger attachment manually before use."],
      notes: ["Self-reference is used for hardware attached to a single piece."],
    },
  ],
  operations: [
    {
      id: "cut_round_backer",
      sequenceNumber: 1,
      operationType: "cut",
      title: "Cut backer",
      description: "Cut the round backer from sheet material after marking the outline.",
      pieceIds: ["round_backer"],
      toolNames: ["jigsaw"],
      safetyNotes: ["Wear eye protection and follow the tool manual."],
      estimatedMinutes: 20,
    },
  ],
  safety: {
    reviewRequired: false,
    flags: [],
    disclaimers: [safetyDisclaimer],
  },
  assumptions: ["Decorative indoor use only."],
  unresolvedQuestions: ["Exact hanging hardware style is not selected."],
  exportReadiness: {
    svgCandidate: true,
    pdfCandidate: true,
    dxfCandidate: false,
    cadCandidate: false,
    notes: ["Closed outline can become an SVG candidate later."],
  },
  confidence: {
    level: "medium",
    reasons: ["Dimensions and material thickness are known; hardware details remain open."],
  },
};

export const woodSignBuildModelFixture: BoardsmithBuildModel = {
  schemaVersion: "1.0",
  units: "inches",
  project: {
    projectId: "fixture_wood_sign",
    projectType: "wood_sign",
    title: "Painted porch sign",
    intendedUse: "Decorative sign mounted on an indoor wall",
    skillLevel: "beginner",
  },
  dimensions: {
    widthInches: 24,
    heightInches: 12,
    depthInches: null,
    materialThicknessInches: 0.5,
  },
  pieces: [
    {
      id: "sign_panel",
      label: "Sign panel",
      quantity: 1,
      pieceType: "panel",
      materialId: "half_inch_plywood",
      dimensions: {
        lengthInches: 24,
        widthInches: 12,
        thicknessInches: 0.5,
      },
      grainDirection: "length",
      notes: ["Decorative panel; no structural use implied."],
    },
  ],
  materials: [
    {
      id: "half_inch_plywood",
      label: "1/2 inch plywood",
      materialType: "plywood",
      nominalThicknessInches: 0.5,
      recommendedForProject: true,
      notes: ["Sand before paint."],
    },
  ],
  hardware: [
    {
      id: "sawtooth_hanger",
      label: "Sawtooth hanger",
      quantity: 1,
      hardwareType: "hanger",
      sizeDescription: null,
      required: true,
      notes: ["Wall mounting requires review of wall structure and fasteners."],
    },
  ],
  connections: [
    {
      id: "hanger_to_sign_panel",
      fromPieceId: "sign_panel",
      toPieceId: "sign_panel",
      connectionType: "hanger",
      hardwareIds: ["sawtooth_hanger"],
      locationDescription: "Back side near top center",
      strengthCritical: true,
      safetyNotes: ["Boardsmith cannot verify wall mounting safety."],
      notes: ["Do not infer a load rating."],
    },
  ],
  operations: [
    {
      id: "paint_sign_panel",
      sequenceNumber: 1,
      operationType: "paint",
      title: "Paint sign",
      description: "Paint the panel after sanding and confirming layout.",
      pieceIds: ["sign_panel"],
      toolNames: ["paint brush", "sander"],
      safetyNotes: ["Use finishes in a ventilated area."],
      estimatedMinutes: 45,
    },
  ],
  safety: {
    reviewRequired: true,
    flags: [
      {
        id: "wall_mounting_review",
        category: "wall_mounting",
        severity: "caution",
        message: "Wall-mounted signs need hardware and wall-structure review.",
        recommendedAction: "Choose appropriate fasteners and inspect mounting location before hanging.",
      },
    ],
    disclaimers: [safetyDisclaimer],
  },
  assumptions: ["Decorative sign only."],
  unresolvedQuestions: ["Final mounting fastener is not selected."],
  exportReadiness: {
    svgCandidate: true,
    pdfCandidate: true,
    dxfCandidate: false,
    cadCandidate: false,
    notes: ["Panel outline is known; lettering geometry is not modeled yet."],
  },
  confidence: {
    level: "medium",
    reasons: ["Panel dimensions are known; mounting details need review."],
  },
};

export const simpleShelfBuildModelFixture: BoardsmithBuildModel = {
  schemaVersion: "1.0",
  units: "inches",
  project: {
    projectId: "fixture_simple_shelf",
    projectType: "simple_shelf",
    title: "Simple wall shelf",
    intendedUse: "Decorative wall shelf for light objects",
    skillLevel: "beginner",
  },
  dimensions: {
    widthInches: 36,
    heightInches: 6,
    depthInches: 10,
    materialThicknessInches: 0.75,
  },
  pieces: [
    {
      id: "shelf_board",
      label: "Shelf board",
      quantity: 1,
      pieceType: "board",
      materialId: "three_quarter_pine",
      dimensions: {
        lengthInches: 36,
        widthInches: 10,
        thicknessInches: 0.75,
      },
      grainDirection: "length",
      notes: ["No load rating is implied."],
    },
  ],
  materials: [
    {
      id: "three_quarter_pine",
      label: "3/4 inch pine board",
      materialType: "softwood",
      nominalThicknessInches: 0.75,
      recommendedForProject: true,
      notes: ["Inspect for bowing before cutting."],
    },
  ],
  hardware: [
    {
      id: "wall_brackets",
      label: "Wall brackets",
      quantity: 2,
      hardwareType: "bracket",
      sizeDescription: null,
      required: true,
      notes: ["Bracket selection affects safe use but no load rating is provided."],
    },
    {
      id: "wall_anchors",
      label: "Wall anchors or stud fasteners",
      quantity: null,
      hardwareType: "anchor",
      sizeDescription: null,
      required: true,
      notes: ["Use hardware appropriate for wall structure after review."],
    },
  ],
  connections: [
    {
      id: "brackets_to_shelf_board",
      fromPieceId: "shelf_board",
      toPieceId: "shelf_board",
      connectionType: "bracket",
      hardwareIds: ["wall_brackets", "wall_anchors"],
      locationDescription: "Under shelf board at wall mounting points",
      strengthCritical: true,
      safetyNotes: ["Boardsmith cannot verify load capacity or wall mounting safety."],
      notes: ["Manual mounting review required."],
    },
  ],
  operations: [
    {
      id: "inspect_mounting_location",
      sequenceNumber: 1,
      operationType: "inspect",
      title: "Inspect mounting location",
      description: "Identify wall structure and review fastener suitability before drilling.",
      pieceIds: ["shelf_board"],
      toolNames: ["tape measure"],
      safetyNotes: ["Do not mount or load shelf until hardware and wall structure are reviewed."],
      estimatedMinutes: 15,
    },
  ],
  safety: {
    reviewRequired: true,
    flags: [
      {
        id: "wall_mounting_review",
        category: "wall_mounting",
        severity: "high_review",
        message: "Wall mounting requires fastener, anchor, and stud review.",
        recommendedAction: "Review wall structure and hardware before mounting.",
      },
      {
        id: "structural_unknown",
        category: "structural_unknown",
        severity: "high_review",
        message: "Boardsmith cannot verify load capacity.",
        recommendedAction: "Do not rely on this model for load ratings.",
      },
    ],
    disclaimers: [safetyDisclaimer],
  },
  assumptions: ["Light decorative use unless reviewed by the builder."],
  unresolvedQuestions: ["Exact bracket and fastener specifications are unknown."],
  exportReadiness: {
    svgCandidate: false,
    pdfCandidate: true,
    dxfCandidate: false,
    cadCandidate: false,
    notes: ["Board dimensions are known; mounting geometry is not modeled."],
  },
  confidence: {
    level: "low",
    reasons: ["Wall mounting and hardware details require review."],
  },
};

export const planterBoxBuildModelFixture: BoardsmithBuildModel = {
  schemaVersion: "1.0",
  units: "inches",
  project: {
    projectId: "fixture_planter_box",
    projectType: "planter_box",
    title: "Small planter box",
    intendedUse: "Outdoor herb planter",
    skillLevel: "beginner",
  },
  dimensions: {
    widthInches: 24,
    heightInches: 8,
    depthInches: 8,
    materialThicknessInches: 0.75,
  },
  pieces: [
    {
      id: "front_panel",
      label: "Front panel",
      quantity: 1,
      pieceType: "board",
      materialId: "cedar_board",
      dimensions: {
        lengthInches: 24,
        widthInches: 8,
        thicknessInches: 0.75,
      },
      grainDirection: "length",
      notes: ["Outdoor exposure requires finish and drainage review."],
    },
    {
      id: "bottom_panel",
      label: "Bottom panel",
      quantity: 1,
      pieceType: "board",
      materialId: "cedar_board",
      dimensions: {
        lengthInches: 24,
        widthInches: 8,
        thicknessInches: 0.75,
      },
      grainDirection: "length",
      notes: ["Drainage holes are expected but exact layout is not modeled."],
    },
  ],
  materials: [
    {
      id: "cedar_board",
      label: "Cedar board",
      materialType: "softwood",
      nominalThicknessInches: 0.75,
      recommendedForProject: true,
      notes: ["Rot-resistant material is preferred for outdoor use."],
    },
  ],
  hardware: [
    {
      id: "outdoor_screws",
      label: "Outdoor-rated screws",
      quantity: null,
      hardwareType: "screw",
      sizeDescription: null,
      required: true,
      notes: ["Use fasteners suitable for outdoor exposure."],
    },
  ],
  connections: [
    {
      id: "front_to_bottom",
      fromPieceId: "front_panel",
      toPieceId: "bottom_panel",
      connectionType: "screw",
      hardwareIds: ["outdoor_screws"],
      locationDescription: "Lower front edge",
      strengthCritical: false,
      safetyNotes: ["Soil and water add weight; review placement before use."],
      notes: ["Connection geometry is approximate in v1."],
    },
  ],
  operations: [
    {
      id: "drill_drainage_holes",
      sequenceNumber: 1,
      operationType: "drill",
      title: "Drill drainage holes",
      description: "Plan drainage holes in the bottom panel before assembly.",
      pieceIds: ["bottom_panel"],
      toolNames: ["drill"],
      safetyNotes: ["Clamp work before drilling and wear eye protection."],
      estimatedMinutes: 10,
    },
  ],
  safety: {
    reviewRequired: true,
    flags: [
      {
        id: "outdoor_exposure_review",
        category: "outdoor_exposure",
        severity: "caution",
        message: "Outdoor exposure changes material, fastener, drainage, and finish needs.",
        recommendedAction: "Review material, drainage, finish, and placement before use.",
      },
    ],
    disclaimers: [safetyDisclaimer],
  },
  assumptions: ["Small planter for herbs or light plants."],
  unresolvedQuestions: ["Exact drainage layout and liner choice are unresolved."],
  exportReadiness: {
    svgCandidate: false,
    pdfCandidate: true,
    dxfCandidate: false,
    cadCandidate: false,
    notes: ["Several board pieces are modeled; full joinery is not modeled."],
  },
  confidence: {
    level: "medium",
    reasons: ["Major dimensions are known; drainage details remain unresolved."],
  },
};

export const buildModelFixtures = [
  doorHangerBuildModelFixture,
  woodSignBuildModelFixture,
  simpleShelfBuildModelFixture,
  planterBoxBuildModelFixture,
] as const;
