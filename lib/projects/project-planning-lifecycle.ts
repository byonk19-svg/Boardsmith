import { createClarificationGateDecision } from "@/lib/projects/clarification-gate";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { findBlockingShelfLayoutIssue } from "@/lib/projects/shelf-layout-validation";
import type { Project } from "@/lib/projects/types";

export type GenerationCommandBlockReason = "archived" | "clarification_gate" | "shelf_layout_missing" | "shelf_layout_invalid";
export type RevisionCommandBlockReason = "archived" | "no_plan";
export type ProjectWriteBlockReason = "archived";
export type ArchiveCommandBlockReason = "archived";
export type RestoreCommandBlockReason = "not_archived";

export type ProjectPlanningLifecycle = {
  isArchived: boolean;
  hasLatestPlan: boolean;
  latestAttemptFailedWithSavedPlan: boolean;
  canGeneratePlan: boolean;
  canRevisePlan: boolean;
  canEditProjectRecord: boolean;
  canRepairShelfLayout: boolean;
  canDuplicateProject: boolean;
  canArchiveProject: boolean;
  canRestoreProject: boolean;
  canShowBrowserPrintPlan: boolean;
};

export type LifecycleCommandDecision<TReason extends string> =
  | { allowed: true }
  | {
      allowed: false;
      reason: TReason;
    };

export function isProjectArchived(project: Pick<Project, "archived_at">): boolean {
  return typeof project.archived_at === "string" && project.archived_at.length > 0;
}

export function createProjectPlanningLifecycle(project: Pick<Project, "archived_at" | "status">, params: { hasLatestPlan: boolean }): ProjectPlanningLifecycle {
  const archived = isProjectArchived(project);

  return {
    isArchived: archived,
    hasLatestPlan: params.hasLatestPlan,
    latestAttemptFailedWithSavedPlan: project.status === "generation_failed" && params.hasLatestPlan,
    canGeneratePlan: !archived,
    canRevisePlan: !archived && params.hasLatestPlan,
    canEditProjectRecord: !archived,
    canRepairShelfLayout: !archived,
    canDuplicateProject: !archived,
    canArchiveProject: !archived,
    canRestoreProject: archived,
    canShowBrowserPrintPlan: params.hasLatestPlan,
  };
}

export function evaluateGenerationCommand(project: Project): LifecycleCommandDecision<GenerationCommandBlockReason> {
  if (isProjectArchived(project)) {
    return { allowed: false, reason: "archived" };
  }

  const clarificationGate = createClarificationGateDecision(project);
  if (
    clarificationGate.status === "blocked_for_safety" ||
    clarificationGate.status === "concept_only" ||
    clarificationGate.status === "unsupported"
  ) {
    return { allowed: false, reason: "clarification_gate" };
  }

  if (analyzeShelfLayoutIntent(project).missingShelfCount) {
    return { allowed: false, reason: "shelf_layout_missing" };
  }

  if (findBlockingShelfLayoutIssue(project)) {
    return { allowed: false, reason: "shelf_layout_invalid" };
  }

  if (!clarificationGate.canGenerateFullPlan) {
    return { allowed: false, reason: "clarification_gate" };
  }

  return { allowed: true };
}

export function evaluateRevisionCommand(
  project: Pick<Project, "archived_at">,
  params: { hasLatestPlan: boolean },
): LifecycleCommandDecision<RevisionCommandBlockReason> {
  if (isProjectArchived(project)) {
    return { allowed: false, reason: "archived" };
  }
  if (!params.hasLatestPlan) {
    return { allowed: false, reason: "no_plan" };
  }

  return { allowed: true };
}

export function evaluateProjectWriteCommand(project: Pick<Project, "archived_at">): LifecycleCommandDecision<ProjectWriteBlockReason> {
  if (isProjectArchived(project)) {
    return { allowed: false, reason: "archived" };
  }

  return { allowed: true };
}

export function evaluateArchiveCommand(project: Pick<Project, "archived_at">): LifecycleCommandDecision<ArchiveCommandBlockReason> {
  if (isProjectArchived(project)) {
    return { allowed: false, reason: "archived" };
  }

  return { allowed: true };
}

export function evaluateRestoreCommand(project: Pick<Project, "archived_at">): LifecycleCommandDecision<RestoreCommandBlockReason> {
  if (!isProjectArchived(project)) {
    return { allowed: false, reason: "not_archived" };
  }

  return { allowed: true };
}
