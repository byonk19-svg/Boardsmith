import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import type { Project, ProjectIntake } from "@/lib/projects/types";

type ShelfValidationProject = Pick<
  ProjectIntake | Project,
  "project_type" | "title" | "shelf_layout" | "shelf_count" | "shelf_spacing_inches" | "style_notes" | "intended_use"
> & {
  width_inches: number | null;
  height_inches: number | null;
  depth_inches: number | null;
  material_thickness_inches: number | null;
};

export type ShelfLayoutIssueCode = "shelf_height_impossible" | "connected_shelf_support_incomplete";

export type ShelfLayoutIssue = {
  code: ShelfLayoutIssueCode;
  blocksGeneration: boolean;
  label: string;
  message: string;
  recommendedAction: string;
};

function positiveNumber(value: number | null | undefined): number | null {
  return typeof value === "number" && Number.isFinite(value) && value > 0 ? value : null;
}

function connectedSupportDetailsText(project: ShelfValidationProject): string {
  return `${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase();
}

function describesSupportDetails(project: ShelfValidationProject): boolean {
  return /\b(side\s+supports?|vertical\s+supports?|frame|uprights?|cleat|brackets?|standards?|rails?)\b/.test(connectedSupportDetailsText(project));
}

export function minimumStackedShelfBoardHeight(project: ShelfValidationProject): number | null {
  const shelfIntent = analyzeShelfLayoutIntent(project);
  const shelfCount = shelfIntent.shelfCount;
  const thickness = positiveNumber(project.material_thickness_inches);

  if (!shelfIntent.isMultiShelfIntent || !shelfCount || shelfCount <= 1 || !thickness) return null;
  return shelfCount * thickness;
}

export function findShelfLayoutIssues(project: ShelfValidationProject): ShelfLayoutIssue[] {
  const shelfIntent = analyzeShelfLayoutIntent(project);
  if (project.project_type !== "simple_shelf" || !shelfIntent.isMultiShelfIntent) return [];

  const issues: ShelfLayoutIssue[] = [];
  const minimumHeight = minimumStackedShelfBoardHeight(project);
  const height = positiveNumber(project.height_inches);

  if (height && minimumHeight && height < minimumHeight) {
    issues.push({
      code: "shelf_height_impossible",
      blocksGeneration: true,
      label: "Impossible or missing shelf layout dimensions",
      message: `Total project height looks too small for ${shelfIntent.shelfCount?.toString() ?? "multiple"} shelves.`,
      recommendedAction: `Enter the full top-to-bottom height of the shelf unit, such as 60 in. ${shelfIntent.shelfCount?.toString() ?? "Multiple"} shelves need at least ${minimumHeight.toString()} in of board thickness before spacing.`,
    });
  }

  if (project.shelf_layout === "multi_shelf_unit" && shelfIntent.shelfCount && shelfIntent.shelfCount > 1 && !describesSupportDetails(project)) {
    issues.push({
      code: "connected_shelf_support_incomplete",
      blocksGeneration: false,
      label: "Shelf support/frame review",
      message: "Connected shelf unit support/frame details are not specified.",
      recommendedAction: "Add side support, frame, cleat, bracket, or other verified support details before treating this as a complete build packet.",
    });
  }

  return issues;
}

export function findBlockingShelfLayoutIssue(project: ShelfValidationProject): ShelfLayoutIssue | null {
  return findShelfLayoutIssues(project).find((issue) => issue.blocksGeneration) ?? null;
}

export function hasImpossibleShelfHeight(project: ShelfValidationProject): boolean {
  return findShelfLayoutIssues(project).some((issue) => issue.code === "shelf_height_impossible");
}

export function hasConnectedShelfSupportPlaceholder(buildModel: BoardsmithBuildModel): boolean {
  return buildModel.pieces.some((piece) => piece.id === "side_support_frame_placeholder");
}
