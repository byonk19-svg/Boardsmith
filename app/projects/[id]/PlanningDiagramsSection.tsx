import type { PlanningDiagram } from "@/lib/plans/plan-diagrams";

export function PlanningDiagramsSection({ diagrams, fallbackMessage }: { diagrams: PlanningDiagram[]; fallbackMessage: string }) {
  if (diagrams.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-caution">Planning diagram — not to scale.</p>
        <p className="rounded-md border border-sawdust bg-shop p-4 text-sm leading-6 text-ink/70">{fallbackMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-caution">Planning diagram — not to scale.</p>
      <div className="grid gap-4 lg:grid-cols-2">
        {diagrams.map((diagram) => (
          <PlanningDiagramCard key={diagram.id} diagram={diagram} />
        ))}
      </div>
    </div>
  );
}

function PlanningDiagramCard({ diagram }: { diagram: PlanningDiagram }) {
  return (
    <div className="rounded-md border border-sawdust p-4 print:break-inside-avoid">
      <h4 className="text-sm font-semibold text-ink">{diagram.title}</h4>
      <PlanningDiagramGraphic diagram={diagram} />
      {diagram.type === "connection_summary" ? (
        <ul className="mt-3 space-y-2">
          {diagram.connections.map((connection) => (
            <li key={connection.id} className="text-xs leading-5 text-ink/70">
              <span className="font-semibold text-ink">
                {connection.fromLabel} to {connection.toLabel}
              </span>
              : {connection.connectionLabel} at {connection.location}
              {connection.needsReview ? " - review before building" : ""}
            </li>
          ))}
        </ul>
      ) : (
        <ul className="mt-3 space-y-2">
          {diagram.pieces.slice(0, 6).map((piece) => (
            <li key={piece.id} className="text-xs leading-5 text-ink/70">
              <span className="font-semibold text-ink">{piece.label}</span>: {piece.quantityLabel} {piece.dimensionsLabel}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlanningDiagramGraphic({ diagram }: { diagram: PlanningDiagram }) {
  const pieces = diagram.pieces.slice(0, 6);
  return (
    <svg className="mt-4 h-44 w-full rounded-md bg-shop" viewBox="0 0 360 170" role="img" aria-label={diagram.label}>
      <rect x="16" y="18" width="328" height="134" rx="6" fill="#fffaf0" stroke="#d7c7a1" />
      {diagram.kind === "simple_shelf" ? <ShelfBoardSvg pieces={pieces} /> : null}
      {diagram.kind === "book_ledge" ? <BookLedgeSvg pieces={pieces} /> : null}
      {diagram.kind === "planter_box" ? <PlanterBoxSvg pieces={pieces} /> : null}
      {diagram.type === "connection_summary" ? <ConnectionMarks count={diagram.connections.length} /> : null}
    </svg>
  );
}

function ShelfBoardSvg({ pieces }: { pieces: PlanningDiagram["pieces"] }) {
  const label = pieces[0]?.label ?? "Shelf board";
  return (
    <>
      <rect x="58" y="72" width="244" height="34" rx="4" fill="#d9b77f" stroke="#7a5b2e" />
      <line x1="58" y1="122" x2="302" y2="122" stroke="#7a5b2e" strokeDasharray="4 4" />
      <text x="180" y="94" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        {label}
      </text>
    </>
  );
}

function BookLedgeSvg({ pieces }: { pieces: PlanningDiagram["pieces"] }) {
  const bottom = pieces.find((piece) => piece.role === "bottom")?.label ?? "Bottom shelf board";
  const back = pieces.find((piece) => piece.role === "back")?.label ?? "Back rail";
  const front = pieces.find((piece) => piece.role === "front")?.label ?? "Front lip";
  return (
    <>
      <rect x="74" y="92" width="214" height="30" rx="4" fill="#d9b77f" stroke="#7a5b2e" />
      <rect x="74" y="50" width="214" height="32" rx="4" fill="#c99a57" stroke="#7a5b2e" />
      <rect x="74" y="126" width="214" height="18" rx="4" fill="#b9803c" stroke="#7a5b2e" />
      <text x="180" y="112" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        {bottom}
      </text>
      <text x="180" y="70" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        {back}
      </text>
      <text x="180" y="140" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
        {front}
      </text>
    </>
  );
}

function PlanterBoxSvg({ pieces }: { pieces: PlanningDiagram["pieces"] }) {
  const front = pieces.find((piece) => piece.role === "front")?.label ?? "Front panel";
  const back = pieces.find((piece) => piece.role === "back")?.label ?? "Back panel";
  const side = pieces.find((piece) => piece.role === "side")?.label ?? "Side panels";
  const bottom = pieces.find((piece) => piece.role === "bottom")?.label ?? "Bottom panel";
  return (
    <>
      <polygon points="82,72 260,72 302,104 126,104" fill="#d9b77f" stroke="#7a5b2e" />
      <polygon points="82,72 126,104 126,138 82,106" fill="#b9803c" stroke="#7a5b2e" />
      <polygon points="126,104 302,104 302,138 126,138" fill="#c99a57" stroke="#7a5b2e" />
      <line x1="126" y1="138" x2="302" y2="138" stroke="#7a5b2e" strokeDasharray="4 4" />
      <text x="192" y="94" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        {back}
      </text>
      <text x="190" y="124" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        {front}
      </text>
      <text x="106" y="111" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        {side}
      </text>
      <text x="222" y="150" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        {bottom}
      </text>
    </>
  );
}

function ConnectionMarks({ count }: { count: number }) {
  const shown = Math.min(count, 4);
  return (
    <>
      {Array.from({ length: shown }).map((_, index) => (
        <circle key={index} cx={102 + index * 48} cy="36" r="7" fill="#f4c430" stroke="#7a5b2e" />
      ))}
      <text x="180" y="54" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        connection review points
      </text>
    </>
  );
}
