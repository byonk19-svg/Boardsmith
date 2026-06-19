import { createClarificationGateDecision, type ClarificationGateDecision } from "@/lib/projects/clarification-gate";
import type { RevisionIntent, RevisionIntentCategory } from "@/lib/plans/revision-intent";
import { projectStructuredRevisionUpdateSchema, type Project, type ProjectStructuredRevisionUpdate, type ShelfLayoutOption } from "@/lib/projects/types";

export type ProjectIntakeRevisionDecision =
  | {
      decision: "apply_safe_patch";
      patch: ProjectStructuredRevisionUpdate;
      touchedFields: (keyof ProjectStructuredRevisionUpdate)[];
      clarificationGateDecision: ClarificationGateDecision;
    }
  | {
      decision: "manual_intake_update_required";
      reason: "unsafe_or_ambiguous_category" | "unsupported_project_type" | "no_parseable_update";
    };

const allowedStructuredUpdateCategories = new Set<RevisionIntentCategory>(["dimensions", "layout", "materials"]);
const numberWords = new Map([
  ["one", 1],
  ["two", 2],
  ["three", 3],
  ["four", 4],
  ["five", 5],
  ["six", 6],
  ["seven", 7],
  ["eight", 8],
  ["nine", 9],
  ["ten", 10],
  ["eleven", 11],
  ["twelve", 12],
]);

const numberPattern = "(\\d+(?:\\.\\d+)?|\\d+\\/\\d+|one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)";
const knownMaterialPattern = "\\b(common board|pine board|oak board|pine|oak|cedar|maple|poplar|plywood|mdf|hardwood|softwood)\\b";

export function createProjectIntakeRevisionDecision(project: Project, revisionIntent: RevisionIntent): ProjectIntakeRevisionDecision {
  if (revisionIntent.categories.some((category) => category !== "prose_only" && !allowedStructuredUpdateCategories.has(category))) {
    return { decision: "manual_intake_update_required", reason: "unsafe_or_ambiguous_category" };
  }

  if (revisionIntent.categories.includes("layout") && project.project_type !== "simple_shelf") {
    return { decision: "manual_intake_update_required", reason: "unsupported_project_type" };
  }

  const text = normalizeForParsing(revisionIntent.normalizedInstruction);
  const patch = pruneUndefined({
    ...parseDimensionUpdates(text),
    ...parseMaterialUpdates(text),
    ...(project.project_type === "simple_shelf" ? parseShelfLayoutUpdates(text) : {}),
  });

  const parseResult = projectStructuredRevisionUpdateSchema.safeParse(patch);
  if (!parseResult.success) {
    return { decision: "manual_intake_update_required", reason: "no_parseable_update" };
  }

  const touchedFields = Object.keys(parseResult.data) as (keyof ProjectStructuredRevisionUpdate)[];
  return {
    decision: "apply_safe_patch",
    patch: parseResult.data,
    touchedFields,
    clarificationGateDecision: createClarificationGateDecision({ ...project, ...parseResult.data }),
  };
}

function normalizeForParsing(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u201c\u201d]/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function parseDimensionUpdates(text: string): ProjectStructuredRevisionUpdate {
  return {
    width_inches: findMeasurement(text, ["width", "wide", "wider", "narrower"]),
    depth_inches: findMeasurement(text, ["depth", "deep", "deeper"]),
    material_thickness_inches: findMeasurement(text, ["thickness", "thick", "thicker"]),
  };
}

function parseMaterialUpdates(text: string): ProjectStructuredRevisionUpdate {
  const match = new RegExp(knownMaterialPattern, "i").exec(text);
  if (!match?.[1]) return {};
  return { material_type: normalizeMaterialType(match[1]) };
}

function parseShelfLayoutUpdates(text: string): ProjectStructuredRevisionUpdate {
  return {
    shelf_layout: parseShelfLayout(text),
    shelf_count: findShelfCount(text),
    shelf_spacing_inches: findShelfSpacing(text),
  };
}

function parseShelfLayout(text: string): ShelfLayoutOption | undefined {
  if (/\bsingle shelf\b/.test(text)) return "single_shelf";
  if (/\b(multiple|separate)\b.*\bshelves\b/.test(text)) return "multiple_separate_shelves";
  if (/\b(connected shelf|shelf unit|side supports?|frame)\b/.test(text)) return "multi_shelf_unit";
  return undefined;
}

function findShelfCount(text: string): number | undefined {
  return (
    findNumberByPattern(text, new RegExp(`\\bshelf count\\b[^.\\n,;]*?${numberPattern}`)) ??
    findNumberByPattern(text, new RegExp(`${numberPattern}\\s+(?:separate\\s+)?shelves\\b`))
  );
}

function findShelfSpacing(text: string): number | undefined {
  return (
    findNumberByPattern(text, new RegExp(`\\bspacing\\b[^.\\n,;]*?${numberPattern}\\s*(?:inches?|inch|in|")?`)) ??
    findNumberByPattern(text, new RegExp(`${numberPattern}\\s*(?:inches?|inch|in|")\\s+(?:shelf\\s+)?spacing\\b`))
  );
}

function findMeasurement(text: string, labels: string[]): number | undefined {
  for (const label of labels) {
    const afterLabel = findNumberByPattern(text, new RegExp(`\\b${label}\\b[^.\\n,;]*?${numberPattern}\\s*(?:inches?|inch|in|")?`));
    if (afterLabel !== undefined) return afterLabel;
    const beforeLabel = findNumberByPattern(text, new RegExp(`${numberPattern}\\s*(?:inches?|inch|in|")\\s+${label}\\b`));
    if (beforeLabel !== undefined) return beforeLabel;
  }

  return undefined;
}

function findNumberByPattern(text: string, pattern: RegExp): number | undefined {
  const match = pattern.exec(text);
  if (!match?.[1]) return undefined;
  return parseNumber(match[1]);
}

function parseNumber(value: string): number | undefined {
  const normalized = value.trim().toLowerCase();
  const wordValue = numberWords.get(normalized);
  if (wordValue !== undefined) return wordValue;
  const fractionMatch = /^(\d+)\/(\d+)$/.exec(normalized);
  if (fractionMatch) {
    const numerator = Number(fractionMatch[1]);
    const denominator = Number(fractionMatch[2]);
    if (denominator > 0) return numerator / denominator;
  }
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function normalizeMaterialType(value: string): string {
  if (value === "mdf") return "MDF";
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

function pruneUndefined(input: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined));
}
