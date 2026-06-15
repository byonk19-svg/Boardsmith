import type {
  WallShelfPlanReadinessAction,
  WallShelfPlanReadinessSeverity,
  WallShelfPlanReadinessViewModel,
} from "@/lib/plans/wall-shelf-plan-readiness-view-model";

export function WallShelfPlanReadiness({
  viewModel,
  compact = false,
  showTitle = true,
}: {
  viewModel: WallShelfPlanReadinessViewModel;
  compact?: boolean;
  showTitle?: boolean;
}) {
  if (viewModel.status === "unsupported") return null;

  return (
    <div className={`break-inside-avoid rounded-md border ${containerClass(viewModel.status)} ${compact ? "p-3" : "p-4"} print:break-inside-avoid`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {showTitle ? <h4 className="text-sm font-semibold text-ink">{viewModel.renderLabels.title}</h4> : null}
          <p className="mt-1 text-sm leading-6 text-ink/70">{viewModel.summary}</p>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:justify-end">
          {viewModel.badges.slice(0, compact ? 3 : 5).map((badge) => (
            <span key={badge} className={`w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ${badgeClass(viewModel.status)}`}>
              {badge}
            </span>
          ))}
        </div>
      </div>

      {viewModel.actions.length > 0 ? (
        <ol className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2 print:grid-cols-2"}`}>
          {viewModel.actions.slice(0, compact ? 4 : 6).map((action) => (
            <ReadinessActionCard key={action.id} action={action} compact={compact} />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-md border border-sawdust bg-white p-3 text-sm leading-6 text-ink/65">
          No blocker actions are listed. Verify the plan before cutting, mounting, loading, or using the shelf.
        </p>
      )}
    </div>
  );
}

function ReadinessActionCard({ action, compact }: { action: WallShelfPlanReadinessAction; compact: boolean }) {
  return (
    <li className={`rounded-md border ${actionClass(action.severity)} ${compact ? "p-2.5" : "p-3"} print:break-inside-avoid`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-ink">{action.title}</p>
        <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold uppercase tracking-wide ${severityBadgeClass(action.severity)}`}>
          {severityLabel(action.severity)}
        </span>
      </div>
      <p className={compact ? "mt-1 text-xs leading-5 text-ink/65" : "mt-2 text-sm leading-6 text-ink/70"}>{action.explanation}</p>
      <p className={compact ? "mt-2 text-xs font-semibold leading-5 text-ink" : "mt-3 text-sm font-semibold leading-6 text-ink"}>{action.suggestedAction}</p>
      <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/45">
        {action.printLabel} - {sectionLabel(action.relatedSection)}
      </p>
    </li>
  );
}

function containerClass(status: WallShelfPlanReadinessViewModel["status"]): string {
  if (status === "blocked") return "border-red-200 bg-red-50";
  if (status === "needs_review") return "border-amber-200 bg-amber-50";
  return "border-sawdust bg-shop/40 print:bg-white";
}

function badgeClass(status: WallShelfPlanReadinessViewModel["status"]): string {
  if (status === "blocked") return "bg-white text-red-950";
  if (status === "needs_review") return "bg-white text-amber-950";
  return "border border-sawdust bg-white text-ink/65";
}

function actionClass(severity: WallShelfPlanReadinessSeverity): string {
  if (severity === "blocker") return "border-red-200 bg-white";
  if (severity === "review") return "border-amber-200 bg-white";
  return "border-sawdust bg-white";
}

function severityBadgeClass(severity: WallShelfPlanReadinessSeverity): string {
  if (severity === "blocker") return "bg-red-100 text-red-950";
  if (severity === "review") return "bg-amber-100 text-amber-950";
  return "bg-shop text-ink/65";
}

function severityLabel(severity: WallShelfPlanReadinessSeverity): string {
  if (severity === "blocker") return "Blocker";
  if (severity === "review") return "Review";
  return "Note";
}

function sectionLabel(section: WallShelfPlanReadinessAction["relatedSection"]): string {
  if (section === "support/frame") return "Support/frame";
  if (section === "buying plan") return "Buying plan";
  return section.charAt(0).toUpperCase() + section.slice(1);
}
