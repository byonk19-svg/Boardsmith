import type { Project, ProjectIntake } from "@/lib/projects/types";

export type ShelfLayoutKind = "single_shelf" | "multiple_separate_shelves" | "multi_shelf_unit" | "unspecified";

export type ShelfLayoutIntent = {
  isShelfLike: boolean;
  layoutKind: ShelfLayoutKind;
  isMultiShelfIntent: boolean;
  shelfCount: number | null;
  missingShelfCount: boolean;
  summary: string;
};

type ShelfLayoutProject = Pick<
  ProjectIntake | Project,
  "project_type" | "title" | "intended_use" | "style_notes" | "shelf_layout" | "shelf_count" | "shelf_spacing_inches"
>;

const wordNumbers: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function projectText(project: ShelfLayoutProject): string {
  return normalize([project.title, project.intended_use, project.style_notes].filter(Boolean).join(" "));
}

function countFromText(text: string): number | null {
  const labeledCountMatch = /\bshelf count\s+([2-9]|10)\b/.exec(text);
  if (labeledCountMatch) return Number(labeledCountMatch[1]);

  const numericMatch = /\b([2-9]|10)\s+(?:shelf|shelves|shelf boards|shelf openings|openings)\b/.exec(text);
  if (numericMatch) return Number(numericMatch[1]);

  for (const [word, count] of Object.entries(wordNumbers)) {
    if (count > 1 && new RegExp(`\\b${word}\\s+(?:shelf|shelves|shelf boards|shelf openings|openings)\\b`).test(text)) {
      return count;
    }
  }

  return null;
}

function hasSingleShelfIntent(text: string): boolean {
  return /\b(?:single|one|1)\s+(?:flat\s+|wall\s+|board\s+)?shelf\b/.test(text) || /\bone shelf board\b/.test(text);
}

function layoutKindFromText(text: string, shelfCount: number | null): ShelfLayoutKind {
  if (/\b(?:bookcase|bookshelf|shelf unit|shelving unit|wall unit|connected shelves|multi shelf unit)\b/.test(text)) {
    return "multi_shelf_unit";
  }

  if (/\b(?:multiple separate shelves|separate shelves|several shelves|multiple wall shelves)\b/.test(text)) {
    return "multiple_separate_shelves";
  }

  if (shelfCount && shelfCount > 1) return "multiple_separate_shelves";
  if (/\b(?:multi shelf|multi shelves|multi shelving|multiple shelves|multiple shelf|more than one shelf|shelves)\b/.test(text)) {
    return "multiple_separate_shelves";
  }

  if (hasSingleShelfIntent(text)) return "single_shelf";
  return "unspecified";
}

export function analyzeShelfLayoutIntent(project: ShelfLayoutProject): ShelfLayoutIntent {
  const isShelfLike = project.project_type === "simple_shelf";
  if (!isShelfLike) {
    return {
      isShelfLike,
      layoutKind: "unspecified",
      isMultiShelfIntent: false,
      shelfCount: null,
      missingShelfCount: false,
      summary: "Not a shelf-like project.",
    };
  }

  if (project.shelf_layout) {
    const shelfCount = project.shelf_count ?? (project.shelf_layout === "single_shelf" ? 1 : null);
    const isMultiShelfIntent = project.shelf_layout === "multiple_separate_shelves" || project.shelf_layout === "multi_shelf_unit";
    const missingShelfCount = isMultiShelfIntent && !shelfCount;

    return {
      isShelfLike,
      layoutKind: project.shelf_layout,
      isMultiShelfIntent,
      shelfCount,
      missingShelfCount,
      summary: missingShelfCount
        ? "Shelf count/layout missing for a multi-shelf project."
        : shelfCount
          ? `${shelfCount.toString()} ${shelfCount === 1 ? "shelf" : "shelves"} specified in intake.`
          : "Shelf layout specified in intake.",
    };
  }

  const text = projectText(project);
  const shelfCount = countFromText(text);
  const layoutKind = layoutKindFromText(text, shelfCount);
  const isMultiShelfIntent = layoutKind === "multiple_separate_shelves" || layoutKind === "multi_shelf_unit";
  const missingShelfCount = isMultiShelfIntent && !shelfCount;

  return {
    isShelfLike,
    layoutKind,
    isMultiShelfIntent,
    shelfCount,
    missingShelfCount,
    summary: missingShelfCount
      ? "Shelf count/layout missing for a multi-shelf project."
      : shelfCount
        ? `${shelfCount.toString()} ${shelfCount === 1 ? "shelf" : "shelves"} described in intake.`
        : layoutKind === "single_shelf"
          ? "Single shelf described in intake."
          : "Shelf layout not specified.",
  };
}
