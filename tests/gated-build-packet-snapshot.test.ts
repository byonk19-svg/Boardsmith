import { describe, expect, it } from "vitest";
import { simpleShelfBuildModelFixture } from "@/lib/build-model/build-model-fixtures";
import { createGatedBuildPacketSnapshot, createGatedBuildPacketSnapshots, latestGatedBuildPacketSnapshot } from "@/lib/plans/gated-build-packet-snapshot";
import type { GeneratedPlan, GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { activeProjectArchiveFields, emptyProjectBuildLog } from "./project-test-helpers";

const project: Project = {
  id: "snapshot-project",
  created_at: new Date(0).toISOString(),
  updated_at: new Date(0).toISOString(),
  title: "Snapshot shelf",
  project_type: "simple_shelf",
  skill_level: "beginner",
  status: "plan_generated",
  width_inches: 36,
  height_inches: 6,
  depth_inches: 10,
  material_thickness_inches: 0.75,
  material_type: "pine board",
  tools_available: ["tape_measure", "pencil", "drill"],
  style_notes: "Wall mounted with brackets screwed into studs.",
  intended_use: "Light shelf with support details.",
  safety_review_required: true,
  safety_flags: ["Wall mounting review"],
  notes: "",
  ...emptyProjectBuildLog,
  ...activeProjectArchiveFields,
};

const plan: GeneratedPlan = {
  project_summary: "A cautious shelf plan.",
  project_type: "simple_shelf",
  dimensions: {
    width_inches: 36,
    height_inches: 6,
    depth_inches: 10,
    material_thickness_inches: 0.75,
  },
  materials: [{ name: "pine board", quantity: "1 board", notes: "Inspect before cutting." }],
  tools: ["tape measure", "pencil", "drill"],
  cut_list: [
    {
      part_name: "Shelf board",
      quantity: 1,
      length_inches: 36,
      width_inches: 10,
      thickness_inches: 0.75,
      material: "pine board",
      notes: "No load rating is implied.",
    },
  ],
  assembly_steps: [
    {
      step_number: 1,
      title: "Review mounting",
      instructions: "Review wall structure before mounting.",
      tools_used: ["drill"],
      safety_note: "Boardsmith cannot verify wall safety.",
      estimated_time_minutes: 15,
    },
  ],
  finishing_steps: ["Sand and finish according to product labels."],
  safety_notes: ["Plans are review aids."],
  assumptions: ["Light decorative use."],
  needs_review_flags: ["Wall mounting review"],
  beginner_tips: ["Measure twice before cutting."],
  svg_readiness_notes: ["No export is generated."],
  estimated_difficulty: "moderate",
  estimated_time: "1-2 hours",
  confidence_level: "low",
};

const savedBuildModel = {
  ...simpleShelfBuildModelFixture,
  project: {
    ...simpleShelfBuildModelFixture.project,
    projectId: project.id,
  },
  materials: [
    {
      ...simpleShelfBuildModelFixture.materials[0],
      id: "saved_material",
      label: "Saved snapshot board",
    },
  ],
  pieces: simpleShelfBuildModelFixture.pieces.map((piece) => ({ ...piece, materialId: "saved_material" })),
};

const latestPlan: GeneratedProjectPlanRecord = {
  id: "latest-snapshot-plan",
  project_id: project.id,
  created_at: new Date(2).toISOString(),
  model_name: "test-model",
  plan_json: plan,
  build_model_json: savedBuildModel,
  plan_markdown: "# test",
  validation_status: "valid",
  warnings: plan.safety_notes,
  assumptions: plan.assumptions,
  confidence_level: plan.confidence_level,
  is_latest: true,
};

describe("Gated Build Packet snapshot", () => {
  it("uses a saved Boardsmith Build Model when the Plan Version has one", () => {
    const snapshot = createGatedBuildPacketSnapshot({ project, plan: latestPlan });

    expect(snapshot.plan?.id).toBe("latest-snapshot-plan");
    expect(snapshot.buildModelSource).toBe("saved");
    expect(snapshot.buildModel.materials[0]?.label).toBe("Saved snapshot board");
    expect(snapshot.manifest.generatedPlan?.id).toBe("latest-snapshot-plan");
    expect(snapshot.manifest.buildModel.source).toBe("saved");
  });

  it("derives an honest compatibility Boardsmith Build Model for older Plan Versions", () => {
    const snapshot = createGatedBuildPacketSnapshot({ project, plan: { ...latestPlan, build_model_json: null } });

    expect(snapshot.buildModelSource).toBe("derived");
    expect(snapshot.buildModel.project.projectId).toBe(project.id);
    expect(snapshot.manifest.planReview?.warnings).toContain("Review uses a derived project structure because this plan version did not store a build model.");
  });

  it("creates a no-plan snapshot for pre-generation planning surfaces", () => {
    const snapshot = createGatedBuildPacketSnapshot({ project: { ...project, status: "draft" }, plan: null });

    expect(snapshot.plan).toBeNull();
    expect(snapshot.buildModelSource).toBe("derived");
    expect(snapshot.manifest.generatedPlan).toBeNull();
    expect(snapshot.manifest.futureExportNotes).toContain("Generate and validate a plan before using the browser-print build sheet.");
  });

  it("selects the latest Plan Version without requiring callers to know the fallback rule", () => {
    const olderPlan = { ...latestPlan, id: "older-snapshot-plan", created_at: new Date(1).toISOString(), is_latest: false };
    const snapshots = createGatedBuildPacketSnapshots({ project, plans: [olderPlan, latestPlan] });

    expect(latestGatedBuildPacketSnapshot(snapshots)?.plan.id).toBe("latest-snapshot-plan");
    expect(latestGatedBuildPacketSnapshot(snapshots.map((snapshot) => ({ ...snapshot, plan: { ...snapshot.plan, is_latest: false } })))?.plan.id).toBe(
      "older-snapshot-plan",
    );
  });
});
