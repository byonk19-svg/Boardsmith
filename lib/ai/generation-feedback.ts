export const generationFailureReasons = ["review_blocked", "validation_failed", "missing_openai_key", "generation_failed"] as const;

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
    summary: "No plan was saved.",
    detail:
      reason === "generation_failed"
        ? "Generation did not complete successfully. The existing project and any previous plans were left unchanged."
        : "Boardsmith blocks drafts that fail validation or safety review before they can be saved.",
    suggestions,
  };
}
