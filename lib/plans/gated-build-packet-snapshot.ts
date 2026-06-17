import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { createPrintablePlanManifest, type PrintablePlanBuildModelSource, type PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";

export type GatedBuildPacketSnapshot = {
  plan: GeneratedProjectPlanRecord | null;
  buildModel: BoardsmithBuildModel;
  buildModelSource: PrintablePlanBuildModelSource;
  manifest: PrintablePlanManifest;
};

export type PlanVersionGatedBuildPacketSnapshot = GatedBuildPacketSnapshot & {
  plan: GeneratedProjectPlanRecord;
};

export function createGatedBuildPacketSnapshot(params: {
  project: Project;
  plan: GeneratedProjectPlanRecord | null;
}): GatedBuildPacketSnapshot {
  const buildModel = params.plan?.build_model_json ?? createBuildModelDraft(params.project, getTemplateHint(params.project.project_type), calculateSafetyReviewFlags(params.project));
  const buildModelSource: PrintablePlanBuildModelSource = params.plan?.build_model_json ? "saved" : "derived";

  return {
    plan: params.plan,
    buildModel,
    buildModelSource,
    manifest: createPrintablePlanManifest({
      project: params.project,
      planRecord: params.plan,
      buildModel,
      buildModelSource,
    }),
  };
}

export function createPlanVersionGatedBuildPacketSnapshot(params: {
  project: Project;
  plan: GeneratedProjectPlanRecord;
}): PlanVersionGatedBuildPacketSnapshot {
  return {
    ...createGatedBuildPacketSnapshot(params),
    plan: params.plan,
  };
}

export function createGatedBuildPacketSnapshots(params: {
  project: Project;
  plans: GeneratedProjectPlanRecord[];
}): PlanVersionGatedBuildPacketSnapshot[] {
  return params.plans.map((plan) => createPlanVersionGatedBuildPacketSnapshot({ project: params.project, plan }));
}

export function latestGatedBuildPacketSnapshot<TSnapshot extends GatedBuildPacketSnapshot>(snapshots: TSnapshot[]): TSnapshot | null {
  if (snapshots.length === 0) return null;
  return snapshots.find((snapshot) => snapshot.plan?.is_latest) ?? snapshots[0];
}
