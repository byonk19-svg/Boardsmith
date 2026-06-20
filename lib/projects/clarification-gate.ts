import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { findShelfLayoutIssues } from "@/lib/projects/shelf-layout-validation";
import { createConceptBrief, type ConceptBrief } from "@/lib/projects/concept-brief";
import { projectTypes, type ProjectIntake, type ProjectType } from "@/lib/projects/types";
import { analyzeWallShelfMountingIntent, isBathroomOrHumidityText } from "@/lib/projects/wall-shelf-intent";
import { calculateSafetyReviewFlags, type SafetyReviewFlag } from "@/lib/safety/safety-review";

export type ClarificationGateStatus =
  | "ready_for_full_plan"
  | "needs_details"
  | "concept_only"
  | "unsupported"
  | "blocked_for_safety";

export type ClarificationQuestionCategory =
  | "dimensions"
  | "material"
  | "layout"
  | "support_frame"
  | "mounting"
  | "use_load"
  | "tools"
  | "finish_exposure"
  | "safety";

export type ClarificationQuestion = {
  id: string;
  category: ClarificationQuestionCategory;
  question: string;
  reason: string;
  requiredForFullPlan: boolean;
};

export type ClarificationBlocker = {
  id: string;
  title: string;
  reason: string;
};

export type ClarificationGateInput = Omit<ProjectIntake, "project_type" | "tools_available"> & {
  project_type: string;
  tools_available: string[];
};

export type ClarificationGateDecision = {
  status: ClarificationGateStatus;
  statusLabel: string;
  summary: string;
  canGenerateFullPlan: boolean;
  supportedProjectType: boolean;
  reviewFlags: SafetyReviewFlag[];
  questions: ClarificationQuestion[];
  blockers: ClarificationBlocker[];
  conceptBrief: ConceptBrief | null;
};

const supportedProjectTypeSet = new Set<string>(projectTypes);

function projectText(project: Pick<ClarificationGateInput, "title" | "style_notes" | "intended_use">): string {
  return `${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase();
}

function isPositiveNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value > 0;
}

function isNonNegativeNumber(value: number | null | undefined): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function hasFinishProtectionContext(project: ClarificationGateInput): boolean {
  return /\b(finish|paint|stain|seal|sealed|sealer|polyurethane|spar\s+urethane|exterior\s+screws?|stainless|galvanized|cedar|treated|weatherproof|waterproof)\b/.test(
    projectText(project),
  );
}

function isWoodworkingAdjacent(project: ClarificationGateInput): boolean {
  return /\b(shelf|shelves|bookcase|bookshelf|cabinet|table|desk|bench|chair|stool|planter|box|sign|hanger|cutout|wood|plywood|board|lumber|storage|rack)\b/.test(projectText(project));
}

function safetyBlockers(project: ClarificationGateInput): ClarificationBlocker[] {
  const text = projectText(project);
  const blockers: ClarificationBlocker[] = [];
  const add = (blocker: ClarificationBlocker) => {
    if (!blockers.some((existing) => existing.id === blocker.id)) blockers.push(blocker);
  };

  if (/\b(crib|bunk\s*bed|loft\s*bed|sleeping|sleep surface|bed frame|baby gate)\b/.test(text)) {
    add({
      id: "child_sleep_or_entrapment_risk",
      title: "Child sleep or entrapment risk",
      reason: "Boardsmith should not generate build instructions for sleep surfaces, cribs, bunk beds, loft beds, or child-entrapment-risk projects.",
    });
  }

  if (/\b(chair|stool|bench|seat|seating)\b/.test(text)) {
    add({
      id: "seating_load_bearing_risk",
      title: "Seating or load-bearing risk",
      reason: "Seating projects require structural review outside the private MVP planning-aid boundary.",
    });
  }

  if (/\b(ladder|platform|step\s*stool|stairs?|railing|deck)\b/.test(text)) {
    add({
      id: "fall_or_structural_risk",
      title: "Fall or structural risk",
      reason: "Ladders, platforms, stairs, railings, and decks have fall or structural risks that are not safe for automatic build-packet generation.",
    });
  }

  if (/\b(overhead|ceiling|suspended|swing|hanging\s+bed|garage\s+storage)\b/.test(text)) {
    add({
      id: "overhead_or_suspended_risk",
      title: "Overhead or suspended load risk",
      reason: "Overhead or suspended projects need site-specific structural review before build instructions are appropriate.",
    });
  }

  return blockers;
}

function addUniqueQuestion(questions: ClarificationQuestion[], question: ClarificationQuestion): void {
  if (!questions.some((existing) => existing.id === question.id)) questions.push(question);
}

function dimensionQuestions(project: ClarificationGateInput): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (!isPositiveNumber(project.width_inches)) {
    addUniqueQuestion(questions, {
      id: "finished_width",
      category: "dimensions",
      question: "What is the finished outside width?",
      reason: "A trusted cut list needs the finished width before Boardsmith can size parts.",
      requiredForFullPlan: true,
    });
  }

  if (!isPositiveNumber(project.height_inches)) {
    addUniqueQuestion(questions, {
      id: "finished_height",
      category: "dimensions",
      question: "What is the finished outside height or board thickness for this project?",
      reason: "Height affects part sizing, layout, and whether the project can be treated as a complete build packet.",
      requiredForFullPlan: true,
    });
  }

  if (!isNonNegativeNumber(project.depth_inches)) {
    addUniqueQuestion(questions, {
      id: "finished_depth",
      category: "dimensions",
      question: "What is the finished outside depth?",
      reason: "Depth is required for shelf, box, planter, and other three-dimensional planning.",
      requiredForFullPlan: true,
    });
  }

  return questions;
}

function materialQuestions(project: ClarificationGateInput): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];

  if (!isPositiveNumber(project.material_thickness_inches)) {
    addUniqueQuestion(questions, {
      id: "material_thickness",
      category: "material",
      question: "What material thickness should the plan use?",
      reason: "Material thickness changes cut dimensions, joinery, fastener choice, and assembly diagrams.",
      requiredForFullPlan: true,
    });
  }

  if (!project.material_type.trim() || /\b(unknown|unsure|tbd|not sure)\b/i.test(project.material_type)) {
    addUniqueQuestion(questions, {
      id: "material_type",
      category: "material",
      question: "What material should this be built from?",
      reason: "Boardsmith needs a material family before it can produce useful material notes or a buying plan.",
      requiredForFullPlan: true,
    });
  }

  return questions;
}

function shelfQuestions(project: ClarificationGateInput, reviewFlags: SafetyReviewFlag[]): ClarificationQuestion[] {
  if (project.project_type !== "simple_shelf") return [];

  const questions: ClarificationQuestion[] = [];
  const shelfIntent = analyzeShelfLayoutIntent({
    ...project,
    project_type: "simple_shelf",
  });

  if (shelfIntent.layoutKind === "unspecified") {
    addUniqueQuestion(questions, {
      id: "shelf_layout",
      category: "layout",
      question: "Is this a single shelf, multiple separate wall shelves, or one connected shelf unit?",
      reason: "Shelf layout controls part counts, support needs, and whether total height describes one board or the whole unit.",
      requiredForFullPlan: true,
    });
  }

  if (shelfIntent.missingShelfCount) {
    addUniqueQuestion(questions, {
      id: "shelf_count",
      category: "layout",
      question: "How many shelves or shelf openings should the plan include?",
      reason: "A multi-shelf plan needs shelf count before cut lists and diagrams can be trusted.",
      requiredForFullPlan: true,
    });
  }

  for (const issue of findShelfLayoutIssues({ ...project, project_type: "simple_shelf" })) {
    addUniqueQuestion(questions, {
      id: issue.code,
      category: issue.code === "connected_shelf_support_incomplete" ? "support_frame" : "dimensions",
      question:
        issue.code === "connected_shelf_support_incomplete"
          ? "What support or frame design makes this connected shelf unit work?"
          : "What is the full top-to-bottom height of the connected shelf unit?",
      reason: issue.recommendedAction,
      requiredForFullPlan: issue.blocksGeneration,
    });
  }

  const mountingIntent = analyzeWallShelfMountingIntent(project);
  if (mountingIntent.wallMounted && !mountingIntent.supportMethodSpecified) {
    addUniqueQuestion(questions, {
      id: "mounting_support_method",
      category: "mounting",
      question: "What mounting or support method should the shelf use?",
      reason: "Wall shelves need bracket, cleat, anchor, stud, fastener, wall-type, and expected-load review before mounting.",
      requiredForFullPlan: true,
    });
  }

  if (mountingIntent.wallMounted && !mountingIntent.wallFastenerContextSpecified) {
    addUniqueQuestion(questions, {
      id: "wall_fastener_context",
      category: "mounting",
      question: "What wall type, stud, anchor, or fastener plan should be reviewed?",
      reason: "Wall-shelf plans need wall-type and fastener context before the mounting review can be specific enough to trust.",
      requiredForFullPlan: true,
    });
  }

  if ((mountingIntent.wallMounted || reviewFlags.some((flag) => flag.code === "heavy_shelving")) && !mountingIntent.expectedUseSpecified) {
    addUniqueQuestion(questions, {
      id: "expected_load_or_use",
      category: "use_load",
      question: "What will the shelf hold, and should any load be treated as heavy?",
      reason: "Shelf load affects support, fasteners, mounting, and whether Boardsmith should block or limit the packet.",
      requiredForFullPlan: true,
    });
  }

  if (isBathroomOrHumidityText(project) && !mountingIntent.finishProtectionSpecified) {
    addUniqueQuestion(questions, {
      id: "finish_exposure",
      category: "finish_exposure",
      question: "What finish or hardware should be reviewed for bathroom humidity?",
      reason: "Bathroom and damp-use shelves need finish, corrosion, and moisture-movement review before the plan feels complete.",
      requiredForFullPlan: true,
    });
  }

  return questions;
}

function safetyQuestions(project: ClarificationGateInput, reviewFlags: SafetyReviewFlag[]): ClarificationQuestion[] {
  const questions: ClarificationQuestion[] = [];
  const flagCodes = new Set(reviewFlags.map((flag) => flag.code));

  if (flagCodes.has("child_or_baby_use")) {
    addUniqueQuestion(questions, {
      id: "child_adjacent_use",
      category: "safety",
      question: "How will this be kept away from climbing, entrapment, tipping, and child-safety-critical use?",
      reason: "Child-adjacent projects need stricter review and must not imply child-safety certification.",
      requiredForFullPlan: true,
    });
  }

  if (flagCodes.has("electrical_or_lighted")) {
    addUniqueQuestion(questions, {
      id: "electrical_scope",
      category: "safety",
      question: "Can the plan exclude electrical wiring and treat lighting as a separate reviewed component?",
      reason: "Boardsmith should not generate unsafe electrical instructions or make component-safety claims.",
      requiredForFullPlan: true,
    });
  }

  if (flagCodes.has("outdoor_load_exposure") && !hasFinishProtectionContext(project)) {
    addUniqueQuestion(questions, {
      id: "finish_exposure",
      category: "finish_exposure",
      question: "What finish, fastener, and exposure details should the plan account for?",
      reason: "Outdoor, humid, wet, or porch use changes finish, fasteners, drainage, wood movement, and rot-resistance review.",
      requiredForFullPlan: true,
    });
  }

  if (project.tools_available.length === 0) {
    addUniqueQuestion(questions, {
      id: "tools_available",
      category: "tools",
      question: "What safe tools are available for cutting, drilling, sanding, and assembly?",
      reason: "Tool availability affects whether a beginner-safe build sequence can be suggested.",
      requiredForFullPlan: true,
    });
  }

  return questions;
}

function statusLabel(status: ClarificationGateStatus): string {
  if (status === "ready_for_full_plan") return "Ready for full plan";
  if (status === "needs_details") return "Needs details";
  if (status === "concept_only") return "Concept only";
  if (status === "unsupported") return "Unsupported";
  return "Blocked for safety";
}

function summaryFor(status: ClarificationGateStatus): string {
  if (status === "ready_for_full_plan") return "Enough detail exists for a supported full build packet. Keep normal builder review before cutting or building.";
  if (status === "needs_details") return "More project details are needed before Boardsmith should generate a full build packet.";
  if (status === "concept_only") return "This idea is woodworking-adjacent, but Boardsmith should keep it at concept guidance until a supported safe template exists.";
  if (status === "unsupported") return "This idea is outside the current supported Boardsmith project types.";
  return "This project is too safety-sensitive for build instructions in the private MVP.";
}

export function createClarificationGateDecision(project: ClarificationGateInput): ClarificationGateDecision {
  const supportedProjectType = supportedProjectTypeSet.has(project.project_type);
  const blockers = safetyBlockers(project);

  if (blockers.length > 0) {
    const reviewFlags = supportedProjectType
      ? calculateSafetyReviewFlags({ ...project, project_type: project.project_type as ProjectType })
      : [];

    return {
      status: "blocked_for_safety",
      statusLabel: statusLabel("blocked_for_safety"),
      summary: summaryFor("blocked_for_safety"),
      canGenerateFullPlan: false,
      supportedProjectType,
      reviewFlags,
      questions: [],
      blockers,
      conceptBrief: null,
    };
  }

  if (!supportedProjectType) {
    const status: ClarificationGateStatus = isWoodworkingAdjacent(project) ? "concept_only" : "unsupported";

    return {
      status,
      statusLabel: statusLabel(status),
      summary: summaryFor(status),
      canGenerateFullPlan: false,
      supportedProjectType: false,
      reviewFlags: [],
      questions: [],
      blockers,
      conceptBrief: status === "concept_only" ? createConceptBrief(project) : null,
    };
  }

  const typedProject = { ...project, project_type: project.project_type as ProjectType };
  const reviewFlags = calculateSafetyReviewFlags(typedProject);

  const questions = [
    ...dimensionQuestions(project),
    ...materialQuestions(project),
    ...shelfQuestions(project, reviewFlags),
    ...safetyQuestions(project, reviewFlags),
  ];
  const status: ClarificationGateStatus = questions.some((question) => question.requiredForFullPlan) ? "needs_details" : "ready_for_full_plan";

  return {
    status,
    statusLabel: statusLabel(status),
    summary: summaryFor(status),
    canGenerateFullPlan: status === "ready_for_full_plan",
    supportedProjectType: true,
    reviewFlags,
    questions,
    blockers,
    conceptBrief: null,
  };
}
