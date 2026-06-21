import { BuildStepCards, BuildStepStatusSummary } from "./BuildStepCards";
import type { PlanActionChecklistItem } from "@/lib/plans/plan-action-checklist";
import type { PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import { PlanterBoxBuyingPlan } from "./PlanterBoxBuyingPlan";
import { PlanterBoxCutDiagram } from "./PlanterBoxCutDiagram";
import { PlanterBoxPlanReadiness } from "./PlanterBoxPlanReadiness";
import { PlanActionChecklist } from "./PlanActionChecklist";
import { PlanningDiagramsSection } from "./PlanningDiagramsSection";
import { ProjectHeroVisual } from "./ProjectHeroVisual";
import { WallShelfBuyingPlan } from "./WallShelfBuyingPlan";
import { WallShelfCutDiagram } from "./WallShelfCutDiagram";
import { WallShelfDiagrams } from "./WallShelfDiagrams";
import { WallShelfPlanReadiness } from "./WallShelfPlanReadiness";

export function PlanPacketHeroVisual({
  manifest,
  compact = false,
}: {
  manifest: PrintablePlanManifest;
  compact?: boolean;
}) {
  return <ProjectHeroVisual visual={manifest.planningDiagrams.projectAnatomy} wallShelfViewModel={manifest.wallShelfDiagramViewModel} compact={compact} />;
}

export function PlanPacketProjectVisuals({
  manifest,
  featured = false,
}: {
  manifest: PrintablePlanManifest;
  featured?: boolean;
}) {
  return manifest.wallShelfDiagram ? (
    <WallShelfDiagrams model={manifest.wallShelfDiagram} />
  ) : (
    <PlanningDiagramsSection
      diagrams={manifest.planningDiagrams.diagrams}
      fallbackMessage={manifest.planningDiagrams.fallbackMessage}
      projectAnatomy={featured ? manifest.planningDiagrams.projectAnatomy : undefined}
      threeView={featured ? manifest.planningDiagrams.threeView : undefined}
      visualPieceInventory={featured ? manifest.planningDiagrams.visualPieceInventory : undefined}
      featured={featured}
    />
  );
}

export function PlanPacketReadinessSection({
  manifest,
  checklistItems = manifest.actionChecklist,
  compact = false,
}: {
  manifest: PrintablePlanManifest;
  checklistItems?: PlanActionChecklistItem[];
  compact?: boolean;
}) {
  const readinessSpacing = compact ? "mb-4" : "mb-5";

  return (
    <>
      {manifest.wallShelfPlanReadinessViewModel.status !== "unsupported" ? (
        <div className={readinessSpacing}>
          <WallShelfPlanReadiness viewModel={manifest.wallShelfPlanReadinessViewModel} compact={compact} />
        </div>
      ) : null}
      {manifest.planterBoxPlanReadinessViewModel.status !== "unsupported" ? (
        <div className={readinessSpacing}>
          <PlanterBoxPlanReadiness viewModel={manifest.planterBoxPlanReadinessViewModel} compact={compact} />
        </div>
      ) : null}
      <PlanActionChecklist items={checklistItems} compact={compact} />
    </>
  );
}

export function PlanPacketCutDiagram({
  manifest,
  compact = false,
}: {
  manifest: PrintablePlanManifest;
  compact?: boolean;
}) {
  return manifest.wallShelfCutDiagramViewModel.status !== "unsupported" ? (
    <WallShelfCutDiagram viewModel={manifest.wallShelfCutDiagramViewModel} compact={compact} />
  ) : (
    <PlanterBoxCutDiagram viewModel={manifest.planterBoxCutDiagramViewModel} compact={compact} />
  );
}

export function PlanPacketBuyingPlan({
  manifest,
  compact = false,
}: {
  manifest: PrintablePlanManifest;
  compact?: boolean;
}) {
  return manifest.wallShelfStockBoardViewModel.status !== "unsupported" ? (
    <WallShelfBuyingPlan viewModel={manifest.wallShelfStockBoardViewModel} compact={compact} />
  ) : (
    <PlanterBoxBuyingPlan viewModel={manifest.planterBoxStockBoardViewModel} compact={compact} />
  );
}

export function PlanPacketBuildGuide({
  manifest,
  compact = false,
}: {
  manifest: PrintablePlanManifest;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "space-y-4" : ""}>
      <div className={compact ? "" : "mb-4"}>
        <BuildStepStatusSummary viewModel={manifest.wallShelfBuildStepViewModel} compact={compact} />
      </div>
      <BuildStepCards cards={manifest.buildStepCards} compact={compact} />
    </div>
  );
}
