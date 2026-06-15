import type { WallShelfCutDiagramViewModel, WallShelfCutPieceGroup } from "@/lib/plans/wall-shelf-cut-diagram-view-model";

export function WallShelfCutDiagram({ viewModel, compact = false }: { viewModel: WallShelfCutDiagramViewModel; compact?: boolean }) {
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
            <CutPieceCard key={piece.id} piece={piece} compact={compact} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-sawdust bg-shop/40 p-3 text-sm leading-6 text-ink/65">No modeled cut pieces are available yet.</p>
      )}

      {viewModel.warnings.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-950">Cut review warnings</p>
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

function CutPieceCard({ piece, compact }: { piece: WallShelfCutPieceGroup; compact: boolean }) {
  const ariaLabel = `${piece.label} cut layout planning graphic${piece.partLabel ? `, ${piece.partLabel}` : ""}`;

  return (
    <div className={`rounded-md border ${piece.needsReview ? "border-amber-200 bg-amber-50" : "border-sawdust bg-shop/30"} p-3`}>
      <svg className="mb-3 h-20 w-full rounded-md border border-sawdust bg-white" viewBox="0 0 420 96" role="img" aria-label={ariaLabel}>
        <rect x="18" y="16" width="282" height="34" rx="5" fill={piece.needsReview ? "#fff3c4" : "#d9b77f"} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={piece.needsReview ? "5 4" : undefined} />
        <line x1="18" y1="64" x2="300" y2="64" stroke="#47624a" strokeWidth="2" />
        <line x1="18" y1="58" x2="18" y2="70" stroke="#47624a" strokeWidth="2" />
        <line x1="300" y1="58" x2="300" y2="70" stroke="#47624a" strokeWidth="2" />
        <text x="159" y="82" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
          {piece.dimensionsLabel}
        </text>
        <rect x="318" y="18" width="76" height="30" rx="5" fill="#fffaf0" stroke="#d7c7a1" />
        <text x="356" y="38" textAnchor="middle" className="fill-ink text-[12px] font-semibold">
          {piece.quantityLabel}
        </text>
      </svg>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">
            {piece.partLabel ? (
              <>
                <span className="mr-1.5 rounded-sm border border-sawdust bg-white px-1.5 py-0.5 text-xs text-ink/60">{piece.partLabel}</span>{" "}
              </>
            ) : null}
            {piece.label}
          </p>
          <p className="mt-1 text-xs leading-5 text-ink/60">{piece.materialLabel}</p>
        </div>
        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">{piece.quantityLabel}</span>
      </div>
      <p className="mt-2 text-sm leading-6 text-ink/70">{piece.dimensionsLabel}</p>
      {piece.needsReview && !compact ? <p className="mt-2 text-sm leading-6 text-amber-900">{piece.reviewReasons[0] ?? "Review before cutting."}</p> : null}
    </div>
  );
}
