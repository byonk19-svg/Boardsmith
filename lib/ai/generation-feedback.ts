export const generationFailureReasons = [
  "archived",
  "shelf_layout_missing",
  "shelf_layout_invalid",
  "clarification_gate",
  "review_blocked",
  "validation_failed",
  "missing_openai_key",
  "generation_failed",
] as const;

export type GenerationFailureReason = (typeof generationFailureReasons)[number];

export type GenerationFailureFeedback = {
  title: string;
  summary: string;
  detail: string;
  suggestions: string[];
};

export function classifyGenerationFailure(error: unknown): GenerationFailureReason {
  const message = error instanceof Error ? error.message : String(error);

  if (message.includes("OPENAI_API_KEY is not configured")) return "missing_openai_key";
  if (message.includes("Generated plan failed deterministic quality checks")) return "review_blocked";
  if (message.includes("Generated plan failed validation")) return "validation_failed";

  return "generation_failed";
}

export function isGenerationFailureReason(value: string | undefined): value is GenerationFailureReason {
  return generationFailureReasons.some((reason) => reason === value);
}

export function getGenerationFailureFeedback(reason: GenerationFailureReason, safetyFlags: string[]): GenerationFailureFeedback {
  if (reason === "missing_openai_key") {
    return {
      title: "OpenAI generation is not configured.",
      summary: "OPENAI_API_KEY is missing, so Boardsmith cannot generate a plan yet.",
      detail: "No plan was generated or saved.",
      suggestions: ["Add OPENAI_API_KEY to the local environment, then try generating again."],
    };
  }

  if (reason === "archived") {
    return {
      title: "Restore this project before generating.",
      summary: "No plan was generated or saved.",
      detail: "Archived projects stay readable and printable, but Boardsmith does not create new plan versions until the project is restored.",
      suggestions: ["Restore the project, then generate a new plan version if the intake still looks right."],
    };
  }

  if (reason === "shelf_layout_missing") {
    return {
      title: "Shelf layout needs one more detail.",
      summary: "No plan was generated.",
      detail: "The intake describes multiple shelves, but Boardsmith needs the shelf count or openings before it can create a trustworthy cut list.",
      suggestions: [
        "Choose the shelf layout and enter the number of shelves.",
        "For a connected shelf unit, include the total height and approximate spacing if known.",
      ],
    };
  }

  if (reason === "shelf_layout_invalid") {
    return {
      title: "Shelf layout dimensions need review.",
      summary: "No plan was generated.",
      detail: "Total project height looks too small for the requested shelf count, so Boardsmith cannot create a trustworthy build packet.",
      suggestions: [
        "Total project height looks too small for 5 shelves. Enter the full top-to-bottom height of the shelf unit, such as 60 in.",
        "For connected shelf units, include side support, frame, cleat, bracket, or other support details before treating the plan as complete.",
      ],
    };
  }

  if (reason === "clarification_gate") {
    return {
      title: "Plan readiness needs attention.",
      summary: "No plan was generated or saved.",
      detail: "Boardsmith needs the Plan readiness items resolved before creating a full build packet.",
      suggestions: [
        "Review the Plan readiness panel and answer the missing project details it lists.",
        "If the project is blocked or unsupported, keep it as notes or simplify it to a supported, reviewable woodworking plan.",
      ],
    };
  }

  const suggestions = [
    "Add more detail about dimensions, materials, mounting method, hardware, and intended use.",
    "Keep expectations cautious: Boardsmith will not save plans that fail validation or safety review.",
  ];

  if (safetyFlags.some((flag) => /wall|mount/i.test(flag))) {
    suggestions.push("For wall-mounted projects, verify studs or anchors, fasteners, wall structure, and expected load before trying again.");
  }

  if (safetyFlags.some((flag) => /child|baby|kid|toddler/i.test(flag))) {
    suggestions.push("For child-adjacent projects, describe edge treatment, finish choice, supervision needs, mounting height, and inspection plans.");
  }

  if (reason === "validation_failed") {
    suggestions.push("Try simplifying the project description so the generated draft can stay inside the required plan structure.");
  }

  return {
    title: "Boardsmith generated a draft, but it did not pass review checks.",
    summary: "No new plan was saved.",
    detail:
      reason === "generation_failed"
        ? "Generation did not complete successfully. The existing project and any previous plans were left unchanged."
        : "Boardsmith blocks drafts that fail validation or safety review before they can be saved.",
    suggestions,
  };
}
