import type { PlanActionChecklistCategory, PlanActionChecklistItem, PlanActionChecklistPriority } from "@/lib/plans/plan-action-checklist";

export function PlanActionChecklist({ items, compact = false }: { items: PlanActionChecklistItem[]; compact?: boolean }) {
  const spacing = compact ? "mt-3 grid gap-2" : "mt-4 grid gap-3 lg:grid-cols-2";
  const padding = compact ? "p-3" : "p-4";

  return (
    <div data-testid="plan-action-checklist">
      <p className="text-sm leading-6 text-ink/65">
        Use this paper-style checklist before shopping, cutting, assembling, finishing, or mounting. It is a planning aid, not an approval.
      </p>
      <ol className={spacing}>
        {items.map((item) => (
          <li
            key={item.id}
            className={`break-inside-avoid rounded-md border border-sawdust bg-white ${padding} print:break-inside-avoid print:p-3`}
          >
            <div className="flex gap-3">
              <span aria-hidden="true" className="mt-1 inline-block h-4 w-4 shrink-0 border border-ink/45 bg-white" />
              <div className="min-w-0">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <p className="text-sm font-semibold leading-6 text-ink">{item.label}</p>
                  <span className={`w-fit rounded-md px-2 py-1 text-xs font-semibold ${priorityClass(item.priority)} print:border print:border-sawdust print:bg-white print:text-ink`}>
                    {priorityLabel(item.priority)}
                  </span>
                </div>
                <p className="mt-1 text-sm leading-6 text-ink/70">{item.detail}</p>
                <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-ink/50">{categoryLabel(item.category)}</p>
              </div>
            </div>
          </li>
        ))}
      </ol>
      <p className="mt-3 text-xs leading-5 text-ink/55">Check-list markers are for paper or shop review only; nothing is saved.</p>
    </div>
  );
}

function priorityLabel(priority: PlanActionChecklistPriority): string {
  if (priority === "required") return "Review first";
  if (priority === "recommended") return "Recommended";
  return "Note";
}

function priorityClass(priority: PlanActionChecklistPriority): string {
  if (priority === "required") return "bg-amber-100 text-amber-950";
  if (priority === "recommended") return "bg-shop text-ink/70";
  return "bg-white text-ink/60";
}

function categoryLabel(category: PlanActionChecklistCategory): string {
  if (category === "dimensions") return "Dimensions";
  if (category === "materials") return "Materials";
  if (category === "cuts") return "Cuts";
  if (category === "safety") return "Safety";
  if (category === "hardware") return "Hardware";
  if (category === "mounting") return "Mounting";
  if (category === "finish") return "Finish";
  return "General";
}
