import type { PlanterBoxCutDiagramViewModel, PlanterBoxCutPieceGroup } from "@/lib/plans/planter-box-cut-diagram-view-model";

export function PlanterBoxCutDiagram({ viewModel, compact = false }: { viewModel: PlanterBoxCutDiagramViewModel; compact?: boolean }) {
  if (viewModel.status === "unsupported") return null;

  return (
    <div className="break-inside-avoid rounded-md border border-sawdust bg-white p-4 print:break-inside-avoid">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h4 className="text-sm font-semibold text-ink">{viewModel.renderLabels.title}</h4>
          <p className="mt-1 text-sm leading-6 text-ink/65">{viewModel.renderLabels.summary}</p>
        </div>
        {viewModel.badges.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 sm:justify-end">
            {viewModel.badges.map((badge) => (
              <span key={badge} className="w-fit rounded-md border border-sawdust bg-shop px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink/65">
                {badge}
              </span>
            ))}
          </div>
        ) : null}
      </div>

      {viewModel.renderLabels.fallbackMessage ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">{viewModel.renderLabels.fallbackMessage}</p>
      ) : null}

      {viewModel.pieceGroups.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2 print:grid-cols-2"}`}>
          {viewModel.pieceGroups.map((piece) => (
            <PlanterCutPieceCard key={piece.id} piece={piece} compact={compact} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-sawdust bg-shop/40 p-3 text-sm leading-6 text-ink/65">No modeled planter panels are available yet.</p>
      )}

      {viewModel.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-950">Planter cut review</p>
          <ul className="mt-2 space-y-1">
            {viewModel.warnings.slice(0, compact ? 4 : 6).map((warning) => (
              <li key={warning} className="text-sm leading-6 text-amber-900">
                {warning}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function PlanterCutPieceCard({ piece, compact }: { piece: PlanterBoxCutPieceGroup; compact: boolean }) {
  const ariaLabel = `${piece.label} planter cut planning graphic, ${piece.partLabel}${piece.needsReview ? ", review first" : ""}`;

  return (
    <div className={`rounded-md border ${piece.needsReview ? "border-amber-200 bg-amber-50" : "border-sawdust bg-shop/30"} p-3`}>
      <svg className={`${compact ? "h-24" : "h-28"} mb-3 w-full rounded-md border border-sawdust bg-white`} viewBox="0 0 420 104" role="img" aria-label={ariaLabel}>
        <rect x="20" y="22" width="292" height="42" rx="5" fill={piece.needsReview ? "#fff3c4" : "#d9b77f"} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={piece.needsReview ? "5 4" : undefined} />
        <line x1="20" y1="76" x2="312" y2="76" stroke="#47624a" strokeWidth="2" />
        <line x1="20" y1="70" x2="20" y2="82" stroke="#47624a" strokeWidth="2" />
        <line x1="312" y1="70" x2="312" y2="82" stroke="#47624a" strokeWidth="2" />
        <text x="166" y="94" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
          {piece.dimensionsLabel}
        </text>
        <rect x="328" y="24" width="68" height="34" rx="5" fill="#fffaf0" stroke="#d7c7a1" />
        <text x="362" y="39" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
          {piece.partLabel}
        </text>
        <text x="362" y="52" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
          {piece.quantityLabel}
        </text>
      </svg>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{piece.printLabel}</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">{piece.materialLabel}</p>
        </div>
        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">{piece.quantityLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/70">{piece.dimensionsLabel}</p>
      {piece.needsReview && !compact ? <p className="mt-2 text-sm leading-6 text-amber-900">{piece.reviewReasons[0] ?? "Review before cutting."}</p> : null}
    </div>
  );
}
