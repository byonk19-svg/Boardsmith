import type { BuildStepCard } from "@/lib/plans/build-step-cards";

export function BuildStepCards({ cards, compact = false }: { cards: BuildStepCard[]; compact?: boolean }) {
  if (cards.length === 0) {
    return <p className="text-sm leading-6 text-ink/65">No build step cards available yet. Review the full plan before building.</p>;
  }

  const cardPadding = compact ? "p-3" : "p-4";
  const bodySpacing = compact ? "mt-2" : "mt-3";
  const safetyPadding = compact ? "p-2" : "p-3";

  return (
    <ol className={compact ? "space-y-3" : "space-y-4"}>
      {cards.map((card) => (
        <li
          key={card.id}
          className={`break-inside-avoid rounded-md border border-sawdust bg-white ${cardPadding} print:break-inside-avoid print:p-3`}
        >
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Step {card.stepNumber.toString()}</p>
              <h4 className="mt-1 text-base font-semibold text-ink">{card.title}</h4>
            </div>
            <span className="w-fit rounded-md bg-shop px-2.5 py-1 text-xs font-semibold text-ink/70 print:border print:border-sawdust print:bg-white">
              {card.phaseLabel}
            </span>
          </div>

          {compact ? (
            <div className={`${bodySpacing} rounded-md bg-shop/50 p-2 print:bg-white`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Do this</p>
              <p className="mt-1 text-sm leading-6 text-ink/75">{card.instructions}</p>
            </div>
          ) : (
            <p className={`${bodySpacing} text-sm leading-6 text-ink/75`}>{card.instructions}</p>
          )}

          <dl className={`${bodySpacing} grid gap-2 text-xs ${compact ? "sm:grid-cols-2 print:grid-cols-2" : "sm:grid-cols-2"}`}>
            {card.tools.length > 0 ? <StepMeta label="Tools" value={card.tools.join(", ")} /> : null}
            {!compact && card.estimatedTimeLabel ? <StepMeta label="Time" value={card.estimatedTimeLabel} /> : null}
            {card.relatedPieceLabels.length > 0 ? <StepMeta label="Pieces" value={card.relatedPieceLabels.join(", ")} /> : null}
            {!compact && card.relatedOperationTitle ? <StepMeta label="Modeled step" value={card.relatedOperationTitle} /> : null}
          </dl>

          {card.safetyNote ? (
            <p className={`${bodySpacing} rounded-md border border-amber-200 bg-amber-50 ${safetyPadding} text-sm font-medium leading-6 text-caution print:border-sawdust print:bg-white`}>
              {card.safetyNote}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function StepMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
      <dd className="mt-1 text-sm leading-5 text-ink/70">{value}</dd>
    </div>
  );
}
