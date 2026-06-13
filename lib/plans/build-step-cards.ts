import type { BoardsmithBuildModel, BuildModelOperation } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { formatToolLabel } from "@/lib/projects/types";

export type BuildStepPhaseLabel =
  | "Measure / mark"
  | "Cut"
  | "Drill"
  | "Sand"
  | "Assemble"
  | "Fasten"
  | "Finish"
  | "Inspect / review"
  | "Build step";

export type BuildStepCard = {
  id: string;
  stepNumber: number;
  title: string;
  instructions: string;
  phaseLabel: BuildStepPhaseLabel;
  tools: string[];
  estimatedTimeLabel: string | null;
  safetyNote: string | null;
  relatedOperationTitle: string | null;
  relatedPieceLabels: string[];
};

type GeneratedBuildStep = GeneratedPlan["assembly_steps"][number];

const phaseByOperationType: Record<BuildModelOperation["operationType"], BuildStepPhaseLabel> = {
  measure: "Measure / mark",
  mark: "Measure / mark",
  cut: "Cut",
  drill: "Drill",
  sand: "Sand",
  assemble: "Assemble",
  glue: "Fasten",
  clamp: "Fasten",
  fasten: "Fasten",
  paint: "Finish",
  stain: "Finish",
  seal: "Finish",
  mount: "Inspect / review",
  inspect: "Inspect / review",
  other: "Build step",
};

const phaseKeywordRules: { phase: BuildStepPhaseLabel; terms: RegExp }[] = [
  { phase: "Measure / mark", terms: /\b(measure|mark|layout|lay out|square)\b/ },
  { phase: "Cut", terms: /\b(cut|saw|trim|rip|crosscut)\b/ },
  { phase: "Drill", terms: /\b(drill|hole|pilot)\b/ },
  { phase: "Sand", terms: /\b(sand|smooth|edge treatment|break edges)\b/ },
  { phase: "Fasten", terms: /\b(fasten|attach|screw|nail|glue|clamp|bracket|anchor|hardware)\b/ },
  { phase: "Assemble", terms: /\b(assemble|assembly|dry fit|fit together)\b/ },
  { phase: "Finish", terms: /\b(finish|paint|stain|seal|topcoat)\b/ },
  { phase: "Inspect / review", terms: /\b(inspect|review|check|verify|test fit|mounting|mount)\b/ },
];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function words(value: string): Set<string> {
  const ignored = new Set(["and", "the", "with", "before", "after", "into", "from", "your", "this", "that"]);
  return new Set(
    normalize(value)
      .split(/\s+/)
      .filter((word) => word.length >= 4 && !ignored.has(word)),
  );
}

function hasSharedWord(left: string, right: string): boolean {
  const leftWords = words(left);
  return [...words(right)].some((word) => leftWords.has(word));
}

function hasToolOverlap(step: GeneratedBuildStep, operation: BuildModelOperation): boolean {
  const stepTools = new Set(step.tools_used.map(normalize));
  return operation.toolNames.some((tool) => stepTools.has(normalize(tool)));
}

function phaseFromText(step: GeneratedBuildStep): BuildStepPhaseLabel {
  const text = normalize(`${step.title} ${step.instructions}`);
  return phaseKeywordRules.find((rule) => rule.terms.test(text))?.phase ?? "Build step";
}

function operationPhase(operation: BuildModelOperation): BuildStepPhaseLabel {
  return phaseByOperationType[operation.operationType];
}

function matchOperation(step: GeneratedBuildStep, operations: BuildModelOperation[]): BuildModelOperation | null {
  const sameSequence = operations.filter((operation) => operation.sequenceNumber === step.step_number);
  const candidates = sameSequence.length > 0 ? sameSequence : operations;

  const scored = candidates
    .map((operation) => {
      const stepText = `${step.title} ${step.instructions}`;
      const operationText = `${operation.title} ${operation.description}`;
      const phase = operationPhase(operation);
      const sharedWords = hasSharedWord(stepText, operationText);
      const phaseMatches = phase !== "Build step" && phaseFromText(step) === phase;
      let score = 0;

      if (operation.sequenceNumber === step.step_number) score += 2;
      if (sharedWords) score += 2;
      if (hasToolOverlap(step, operation)) score += 1;
      if (phaseMatches) score += 1;

      return { operation, score, sharedWords, phaseMatches };
    })
    .sort((left, right) => right.score - left.score || left.operation.sequenceNumber - right.operation.sequenceNumber);

  if (scored.length === 0) return null;
  const best = scored[0];
  if (best.score < 3 || (!best.sharedWords && !best.phaseMatches)) return null;
  return best.operation;
}

function formatEstimatedTime(minutes: number | null): string | null {
  if (!minutes) return null;
  if (minutes < 60) return `${minutes.toString()} min`;

  const hours = Math.floor(minutes / 60);
  const remainder = minutes % 60;
  return remainder === 0 ? `${hours.toString()} hr` : `${hours.toString()} hr ${remainder.toString()} min`;
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function conciseSafetyNote(step: GeneratedBuildStep, operation: BuildModelOperation | null): string | null {
  if (step.safety_note?.trim()) return step.safety_note.trim();
  const operationNote = operation?.safetyNotes.find((note) => note.trim().length > 0 && note.trim().length <= 140);
  return operationNote ?? null;
}

export function createBuildStepCards(
  buildSteps: GeneratedPlan["assembly_steps"],
  buildModel: BoardsmithBuildModel,
): BuildStepCard[] {
  const pieceById = new Map(buildModel.pieces.map((piece) => [piece.id, piece.label]));

  return buildSteps.map((step) => {
    const operation = matchOperation(step, buildModel.operations);
    const pieceLabels = operation ? uniqueStrings(operation.pieceIds.map((pieceId) => pieceById.get(pieceId) ?? "")) : [];

    return {
      id: `step_${step.step_number.toString()}`,
      stepNumber: step.step_number,
      title: step.title,
      instructions: step.instructions,
      phaseLabel: operation ? operationPhase(operation) : phaseFromText(step),
      tools: uniqueStrings(step.tools_used.length > 0 ? step.tools_used : (operation?.toolNames ?? [])).map(formatToolLabel),
      estimatedTimeLabel: formatEstimatedTime(step.estimated_time_minutes ?? operation?.estimatedMinutes ?? null),
      safetyNote: conciseSafetyNote(step, operation),
      relatedOperationTitle: operation?.title ?? null,
      relatedPieceLabels: pieceLabels,
    };
  });
}
