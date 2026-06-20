export type ConceptBriefDimension = {
  label: string;
  value: string;
};

export type ConceptBriefOption = {
  id: string;
  title: string;
  summary: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  toolsAndMaterials: string;
  pros: string[];
  cons: string[];
  questions: string[];
};

export type ConceptBrief = {
  title: string;
  category: string;
  whyNotFullPlan: string;
  confirmedDimensions: ConceptBriefDimension[];
  safeNextStep: string;
  questions: string[];
  options: ConceptBriefOption[];
};

type ConceptBriefInput = {
  title: string;
  project_type: string;
  width_inches: number | null | undefined;
  height_inches: number | null | undefined;
  depth_inches: number | null | undefined;
  material_thickness_inches: number | null | undefined;
  material_type: string;
  tools_available: string[];
  style_notes: string;
  intended_use: string;
};

export function createConceptBrief(project: ConceptBriefInput): ConceptBrief {
  const text = projectText(project);
  const category = conceptCategory(text, project.project_type);
  const confirmedDimensions = confirmedDimensionFacts(project);
  const baseQuestions = [
    "Which supported Boardsmith template is closest to the idea?",
    "Which dimensions are confirmed measurements versus rough inspiration?",
    "What safety-sensitive uses should be excluded before a full plan is generated?",
  ];

  return {
    title: `${project.title || "Project idea"} concept brief`,
    category,
    whyNotFullPlan:
      "Boardsmith does not have a supported safe template for this exact idea yet, so this stays as concept-only guidance without cut lists, build steps, packet diagrams, shopping, certification, or load claims.",
    confirmedDimensions,
    safeNextStep: "Choose a supported template or revise the saved intake until Boardsmith can validate the project before generating a full build packet.",
    questions: Array.from(new Set([...categoryQuestions(category), ...baseQuestions])),
    options: conceptOptions(category, confirmedDimensions, project),
  };
}

function projectText(project: Pick<ConceptBriefInput, "title" | "style_notes" | "intended_use" | "material_type">): string {
  return `${project.title} ${project.style_notes} ${project.intended_use} ${project.material_type}`.toLowerCase();
}

function conceptCategory(text: string, projectType: string): string {
  if (/\b(bookcase|bookshelf|shelves|shelf|storage|cabinet|closet|pantry)\b/.test(text) || /\bbookcase\b/.test(projectType)) {
    return "Storage concept";
  }
  if (/\b(planter|box)\b/.test(text)) return "Container concept";
  if (/\b(sign|hanger|cutout|wall art|decor)\b/.test(text)) return "Decor concept";
  if (/\b(table|desk|surface)\b/.test(text)) return "Work-surface concept";
  return "Woodworking concept";
}

function confirmedDimensionFacts(project: ConceptBriefInput): ConceptBriefDimension[] {
  const facts: ConceptBriefDimension[] = [];
  addDimension(facts, "Width", project.width_inches);
  addDimension(facts, "Height", project.height_inches);
  addDimension(facts, "Depth", project.depth_inches);
  addDimension(facts, "Material thickness", project.material_thickness_inches);
  return facts;
}

function addDimension(facts: ConceptBriefDimension[], label: string, value: number | null | undefined): void {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    facts.push({ label, value: `${Number(value.toFixed(3)).toString()} in` });
  }
}

function categoryQuestions(category: string): string[] {
  if (category === "Storage concept") {
    return [
      "Should this become a simple wall shelf, planter box, or another currently supported template?",
      "Is it freestanding, wall-mounted, built-in, or expected to hold heavy items?",
    ];
  }
  if (category === "Container concept") {
    return ["Is this closer to a supported planter box, tray, or decorative box?", "Will it be outdoors, wet, soil-filled, or food-adjacent?"];
  }
  if (category === "Decor concept") {
    return ["Is the goal closer to a wood sign, door hanger, or layered cutout?", "Does it need hanging hardware, lights, or child-accessible placement?"];
  }
  if (category === "Work-surface concept") {
    return ["Is this decorative only, or will it support people, appliances, or heavy loads?", "Can the idea be reduced to a lower-risk supported shelf or panel plan?"];
  }
  return ["What supported beginner-friendly template is closest?", "What would make this unsafe or outside a planning-aid boundary?"];
}

function conceptOptions(category: string, confirmedDimensions: ConceptBriefDimension[], project: ConceptBriefInput): ConceptBriefOption[] {
  const material = materialOverview(project);
  const dimensionText =
    confirmedDimensions.length > 0
      ? `Confirmed dimensions: ${confirmedDimensions.map((item) => `${item.label.toLowerCase()} ${item.value}`).join(", ")}.`
      : "No confirmed dimensions yet.";

  if (category === "Storage concept") {
    return [
      {
        id: "supported_wall_shelf",
        title: "Convert to a supported wall shelf",
        summary: "Use the idea as one shelf or a small set of shelves that can go through the current wall-shelf intake and review flow.",
        difficulty: "beginner",
        toolsAndMaterials: `${material} Typical review tools include tape measure, level, drill, stud finder, and eye protection when wall mounting is involved.`,
        pros: ["Uses the strongest current Boardsmith packet path.", "Keeps dimensions, supports, and mounting review explicit."],
        cons: ["May not represent a full built-in or cabinet-like project.", "Wall mounting and load still require manual review."],
        questions: ["How many shelves are actually needed?", "What wall type, support method, and expected load should be reviewed?"],
      },
      {
        id: "freestanding_storage_notes",
        title: "Keep as freestanding storage notes",
        summary: "Keep the project as notes and questions until a safe freestanding storage template exists.",
        difficulty: "intermediate",
        toolsAndMaterials: `${material} Treat tools and materials as planning context only until a template exists.`,
        pros: ["Avoids pretending a full bookcase or cabinet packet is supported.", "Leaves room to refine the structure before generation."],
        cons: ["No cut list, build guide, or packet visuals are generated.", "Needs a future template before it can become a full Boardsmith packet."],
        questions: ["Is this built-in, freestanding, or attached to a wall?", "What anti-tip, load, and placement review is needed?"],
      },
    ];
  }

  if (category === "Container concept") {
    return [
      {
        id: "supported_planter_box",
        title: "Convert to a supported planter box",
        summary: "Use the current planter-box template if the project is a simple rectangular container.",
        difficulty: "beginner",
        toolsAndMaterials: `${material} ${dimensionText}`,
        pros: ["Uses an existing supported template.", "Keeps drainage, outdoor exposure, material, and finish review visible."],
        cons: ["Does not model complex joinery, curves, liners, or self-watering systems.", "Still requires manual placement and exposure review."],
        questions: ["Is drainage required?", "Will it hold soil outdoors or stay as a dry decorative box?"],
      },
    ];
  }

  if (category === "Decor concept") {
    return [
      {
        id: "supported_decor_template",
        title: "Convert to a supported decor template",
        summary: "Use wood sign, door hanger, or layered cutout intake if the idea is decorative and flat.",
        difficulty: "beginner",
        toolsAndMaterials: `${material} ${dimensionText}`,
        pros: ["Fits the current decorative template set.", "Keeps hanging and finish review separate from build truth."],
        cons: ["Does not create image-derived artwork or CNC-ready geometry.", "Lighting or heavy mounting still needs separate review."],
        questions: ["Which decorative template is closest?", "Does this need hanging hardware, lights, or weather exposure?"],
      },
    ];
  }

  return [
    {
      id: "narrow_to_supported_template",
      title: "Narrow to a supported template",
      summary: "Translate the idea into one supported beginner template before generating a full plan.",
      difficulty: "beginner",
      toolsAndMaterials: `${material} ${dimensionText}`,
      pros: ["Preserves Boardsmith's validation and packet quality rules.", "Keeps unsupported assumptions visible."],
      cons: ["The broader idea remains concept-only until template support exists."],
      questions: ["Which current project type is closest?", "What exact dimensions and material are confirmed?"],
    },
  ];
}

function materialOverview(project: ConceptBriefInput): string {
  const material = project.material_type.trim();
  const tools = project.tools_available.length > 0 ? project.tools_available.map((tool) => tool.replaceAll("_", " ")).join(", ") : "tools not confirmed";
  return material ? `Material context: ${material}. Tools noted: ${tools}.` : `Material not confirmed. Tools noted: ${tools}.`;
}
