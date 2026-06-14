import type { BuildStepCard } from "@/lib/plans/build-step-cards";
import type { WallShelfBuildStepViewModel } from "@/lib/plans/wall-shelf-build-step-view-model";

export function BuildStepStatusSummary({ viewModel, compact = false }: { viewModel: WallShelfBuildStepViewModel; compact?: boolean }) {
  if (viewModel.status === "unsupported") return null;

  return (
    <div className={`rounded-md border border-sawdust bg-shop/40 ${compact ? "p-3" : "p-4"} print:bg-white`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-ink">{viewModel.renderLabels.summary}</p>
        {viewModel.badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {viewModel.badges.map((badge) => (
              <span key={badge} className="rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70 print:border print:border-sawdust">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>
      {viewModel.renderLabels.fallbackMessage ? <p className="mt-2 text-sm leading-6 text-ink/65">{viewModel.renderLabels.fallbackMessage}</p> : null}
    </div>
  );
}

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
            <>
              {card.purpose ? <p className={`${bodySpacing} text-sm font-medium leading-6 text-ink/75`}>{card.purpose}</p> : null}
              <p className={`${card.purpose ? "mt-2" : bodySpacing} text-sm leading-6 text-ink/75`}>{card.instructions}</p>
            </>
          )}

          <dl className={`${bodySpacing} grid gap-2 text-xs ${compact ? "sm:grid-cols-2 print:grid-cols-2" : "sm:grid-cols-2"}`}>
            {card.tools.length > 0 ? <StepMeta label="Tools" value={card.tools.join(", ")} /> : null}
            {!compact && card.estimatedTimeLabel ? <StepMeta label="Time" value={card.estimatedTimeLabel} /> : null}
            {card.relatedPieceLabels.length > 0 ? <StepMeta label="Pieces" value={card.relatedPieceLabels.join(", ")} /> : null}
            {card.dimensionReferences?.length ? <StepMeta label="References" value={card.dimensionReferences.join("; ")} /> : null}
            {!compact && card.relatedOperationTitle ? <StepMeta label="Modeled step" value={card.relatedOperationTitle} /> : null}
          </dl>

          {card.reviewBlockers?.length ? (
            <div className={`${bodySpacing} rounded-md border border-amber-200 bg-amber-50 ${safetyPadding} print:border-sawdust print:bg-white`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-caution">Needs review</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6 text-caution">
                {card.reviewBlockers.slice(0, compact ? 2 : 4).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {!compact && card.warnings?.length ? (
            <div className={`${bodySpacing} rounded-md border border-sawdust bg-shop/40 p-3`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Review notes</p>
              <ul className="mt-1 list-disc space-y-1 pl-4 text-sm leading-6 text-ink/70">
                {card.warnings.slice(0, 4).map((warning) => (
                  <li key={warning}>{warning}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {shouldShowSafetyNote(card.safetyNote, compact) ? (
            <p className={`${bodySpacing} rounded-md border border-amber-200 bg-amber-50 ${safetyPadding} text-sm font-medium leading-6 text-caution print:border-sawdust print:bg-white`}>
              {card.safetyNote}
            </p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

function shouldShowSafetyNote(note: string | null, compact: boolean): note is string {
  if (!note) return false;
  if (!compact) return true;
  const normalized = note.toLowerCase();
  return !normalized.includes("load rating") && !normalized.includes("load ratings") && !normalized.includes("boardsmith");
}

function StepMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
      <dd className="mt-1 text-sm leading-5 text-ink/70">{value}</dd>
    </div>
  );
}
