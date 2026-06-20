import type {
  PlanterBoxPlanReadinessAction,
  PlanterBoxPlanReadinessSeverity,
  PlanterBoxPlanReadinessViewModel,
} from "@/lib/plans/planter-box-plan-readiness-view-model";

export function PlanterBoxPlanReadiness({
  viewModel,
  compact = false,
  showTitle = true,
}: {
  viewModel: PlanterBoxPlanReadinessViewModel;
  compact?: boolean;
  showTitle?: boolean;
}) {
  if (viewModel.status === "unsupported") return null;

  const visibleActions = compact ? compactReadinessActions(viewModel.actions) : viewModel.actions.slice(0, 6);

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

      {visibleActions.length > 0 ? (
        <ol className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2 print:grid-cols-2"}`}>
          {visibleActions.map((action) => (
            <ReadinessActionCard key={action.id} action={action} compact={compact} />
          ))}
        </ol>
      ) : (
        <p className="mt-4 rounded-md border border-sawdust bg-white p-3 text-sm leading-6 text-ink/65">
          No blocker actions are listed. Verify drainage, finish, material, fasteners, dimensions, and site conditions before using the planter.
        </p>
      )}
    </div>
  );
}

function compactReadinessActions(actions: PlanterBoxPlanReadinessAction[]): PlanterBoxPlanReadinessAction[] {
  if (actions.length <= 4) return actions;

  const selected: PlanterBoxPlanReadinessAction[] = [];
  const add = (action: PlanterBoxPlanReadinessAction | undefined) => {
    if (action && !selected.some((selectedAction) => selectedAction.id === action.id)) selected.push(action);
  };

  add(actions.find((action) => action.relatedSection === "drainage"));
  add(actions.find((action) => action.relatedSection === "finish"));
  add(actions.find((action) => action.relatedSection === "connections"));
  add(actions.find((action) => action.relatedSection === "cuts"));

  for (const action of actions) {
    if (selected.length >= 4) break;
    add(action);
  }

  return selected;
}

function ReadinessActionCard({ action, compact }: { action: PlanterBoxPlanReadinessAction; compact: boolean }) {
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

function containerClass(status: PlanterBoxPlanReadinessViewModel["status"]): string {
  if (status === "needs_review") return "border-amber-200 bg-amber-50";
  return "border-sawdust bg-shop/40 print:bg-white";
}

function badgeClass(status: PlanterBoxPlanReadinessViewModel["status"]): string {
  if (status === "needs_review") return "bg-white text-amber-950";
  return "border border-sawdust bg-white text-ink/65";
}

function actionClass(severity: PlanterBoxPlanReadinessSeverity): string {
  if (severity === "review") return "border-amber-200 bg-white";
  return "border-sawdust bg-white";
}

function severityBadgeClass(severity: PlanterBoxPlanReadinessSeverity): string {
  if (severity === "review") return "bg-amber-100 text-amber-950";
  return "bg-shop text-ink/65";
}

function severityLabel(severity: PlanterBoxPlanReadinessSeverity): string {
  if (severity === "review") return "Review";
  return "Note";
}

function sectionLabel(section: PlanterBoxPlanReadinessAction["relatedSection"]): string {
  if (section === "buying plan") return "Buying plan";
  return section.charAt(0).toUpperCase() + section.slice(1);
}
