import type { WallShelfStockBoardMaterialGroup, WallShelfStockBoardViewModel } from "@/lib/plans/wall-shelf-stock-board-view-model";

export function WallShelfBuyingPlan({ viewModel, compact = false }: { viewModel: WallShelfStockBoardViewModel; compact?: boolean }) {
  if (viewModel.status === "unsupported") return null;

  return (
    <div className={`break-inside-avoid rounded-md border border-sawdust bg-white ${compact ? "p-3" : "p-4"} print:break-inside-avoid`}>
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

      {viewModel.materialGroups.length > 0 ? (
        <div className={`mt-4 grid gap-3 ${compact ? "" : "lg:grid-cols-2 print:grid-cols-2"}`}>
          {viewModel.materialGroups.map((group) => (
            <BuyingMaterialGroup key={group.id} group={group} compact={compact} />
          ))}
        </div>
      ) : (
        <p className="mt-4 rounded-md border border-sawdust bg-shop/40 p-3 text-sm leading-6 text-ink/65">No modeled material groups are available yet.</p>
      )}

      {viewModel.reviewReasons.length > 0 ? (
        <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-3">
          <p className="text-sm font-semibold text-amber-950">Buying-plan review</p>
          <ul className="mt-2 space-y-1">
            {viewModel.reviewReasons.slice(0, compact ? 4 : 6).map((reason) => (
              <li key={reason} className="text-sm leading-6 text-amber-900">
                {reason}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {!compact ? (
        <div className="mt-4 rounded-md border border-sawdust bg-shop/40 p-3">
          <p className="text-sm font-semibold text-ink">Material buying notes</p>
          <ul className="mt-2 space-y-1">
            {viewModel.buyingNotes.slice(0, 5).map((note) => (
              <li key={note} className="text-sm leading-6 text-ink/70">
                {note}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function BuyingMaterialGroup({ group, compact }: { group: WallShelfStockBoardMaterialGroup; compact: boolean }) {
  return (
    <div className={`rounded-md border ${group.reviewReasons.length > 0 ? "border-amber-200 bg-amber-50" : "border-sawdust bg-shop/30"} p-3`}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">{group.displayName}</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">
            {group.materialTypeLabel} - {group.thickness.label}
          </p>
        </div>
        <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">{group.totalPiecesLabel}</span>
      </div>

      <div className="mt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Pieces to get from this material</p>
        <StockBoardPlanningGraphic group={group} />
        <ul className="mt-2 space-y-2">
          {group.pieces.map((piece) => (
            <li key={piece.id} className="text-sm leading-6 text-ink/70">
              <span className="font-semibold text-ink">{piece.printLabel} - {piece.quantityLabel}</span>
              : {piece.dimensionsLabel}
            </li>
          ))}
        </ul>
      </div>

      <p className={`mt-3 rounded-md border border-sawdust bg-white p-2 ${compact ? "text-xs" : "text-sm"} leading-6 text-ink/65`}>
        Stock length still needs selection from available boards.
      </p>
    </div>
  );
}

function StockBoardPlanningGraphic({ group }: { group: WallShelfStockBoardMaterialGroup }) {
  const visiblePieces = group.pieces.slice(0, 4);
  const hasHiddenPieces = group.pieces.length > visiblePieces.length;
  const needsReview = group.reviewReasons.length > 0 || group.thickness.status === "missing" || group.pieces.some((piece) => piece.needsReview);
  const visualLabel = `${group.displayName} stock-board planning visual: ${group.pieces.map((piece) => piece.printLabel).join(", ")}; stock length to select; not optimized`;

  return (
    <svg className="mt-3 h-28 w-full rounded-md border border-sawdust bg-white" viewBox="0 0 420 112" role="img" aria-label={visualLabel}>
      <rect x="18" y="18" width="320" height="42" rx="5" fill="#f7efe0" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="6 5" />
      <text x="178" y="44" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        stock length to select
      </text>
      {visiblePieces.map((piece, index) => {
        const x = 28 + index * 74;
        const fill = piece.needsReview || needsReview ? "#fff3c4" : "#d9b77f";
        return (
          <g key={piece.id}>
            <rect x={x} y="70" width="62" height="24" rx="4" fill={fill} stroke="#7a5b2e" strokeWidth="1.5" strokeDasharray={piece.needsReview ? "4 3" : undefined} />
            <text x={x + 31} y="86" textAnchor="middle" className="fill-ink text-[9px] font-semibold">
              {piece.partLabel ?? piece.badgeLabel ?? "Review"}
            </text>
            <text x={x + 31} y="106" textAnchor="middle" className="fill-ink text-[9px] font-semibold">
              {piece.quantityLabel}
            </text>
          </g>
        );
      })}
      {hasHiddenPieces ? (
        <text x="326" y="86" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
          more parts
        </text>
      ) : null}
      <rect x="344" y="18" width="62" height="34" rx="5" fill={needsReview ? "#fff3c4" : "#fffaf0"} stroke="#d7c7a1" />
      <text x="375" y="32" textAnchor="middle" className="fill-ink text-[9px] font-semibold">
        not
      </text>
      <text x="375" y="44" textAnchor="middle" className="fill-ink text-[9px] font-semibold">
        optimized
      </text>
      {needsReview ? (
        <text x="350" y="64" className="fill-ink text-[10px] font-semibold">
          review
        </text>
      ) : null}
    </svg>
  );
}
