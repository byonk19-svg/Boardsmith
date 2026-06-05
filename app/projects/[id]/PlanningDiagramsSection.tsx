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
  const cardClass =
    diagram.type === "connection_summary"
      ? "rounded-md border border-sawdust p-4 print:break-inside-avoid lg:col-span-2"
      : "rounded-md border border-sawdust p-4 print:break-inside-avoid";

  return (
    <div className={cardClass}>
      <h4 className="text-sm font-semibold text-ink">{diagram.title}</h4>
      <PlanningDiagramGraphic diagram={diagram} />
      {diagram.type === "connection_summary" ? (
        <ConnectionSummary diagram={diagram} />
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

function ConnectionSummary({ diagram }: { diagram: PlanningDiagram }) {
  if (diagram.connections.length === 0) {
    return <p className="mt-3 rounded-md bg-shop p-3 text-xs leading-5 text-ink/70">{diagram.emptyMessage}</p>;
  }

  return (
    <div className="mt-3 space-y-3">
      <p className="text-xs font-medium leading-5 text-ink/65">Connection planning aid. Verify hardware and fasteners before building.</p>
      <ol className="grid gap-2 lg:grid-cols-3">
        {diagram.connections.map((connection, index) => (
          <li key={connection.id} className="rounded-md border border-sawdust p-3 text-xs leading-5 text-ink/70">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <p>
                <span className="font-semibold text-ink">{(index + 1).toString()}. {connection.relationshipLabel}</span>
              </p>
              <span className={`w-fit rounded-md px-2 py-1 font-semibold ${connection.needsReview ? "bg-amber-100 text-amber-950" : "bg-shop text-ink/70"}`}>
                {connection.reviewLabel}
              </span>
            </div>
            <p className="mt-1">Location: {connection.location}</p>
            {connection.safetyNote ? <p className="mt-1 font-medium text-caution">{connection.safetyNote}</p> : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function PlanningDiagramGraphic({ diagram }: { diagram: PlanningDiagram }) {
  const pieces = diagram.pieces.slice(0, 6);
  const heightClass = diagram.type === "connection_summary" ? "h-28" : "h-44";

  return (
    <svg className={`mt-4 w-full rounded-md bg-shop ${heightClass}`} viewBox="0 0 360 170" role="img" aria-label={diagram.label}>
      <rect x="16" y="18" width="328" height="134" rx="6" fill="#fffaf0" stroke="#d7c7a1" />
      {diagram.type === "connection_summary" ? (
        <ConnectionMarks count={diagram.connections.length} />
      ) : (
        <>
          {diagram.kind === "simple_shelf" ? <ShelfBoardSvg pieces={pieces} /> : null}
          {diagram.kind === "book_ledge" ? <BookLedgeSvg pieces={pieces} /> : null}
          {diagram.kind === "planter_box" ? <PlanterBoxSvg pieces={pieces} /> : null}
        </>
      )}
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
  if (shown === 0) {
    return (
      <text x="180" y="88" textAnchor="middle" className="fill-ink text-[12px] font-semibold">
        no modeled connections yet
      </text>
    );
  }

  return (
    <>
      {Array.from({ length: shown }).map((_, index) => (
        <g key={index}>
          <circle cx={86 + index * 62} cy="80" r="13" fill="#f4c430" stroke="#7a5b2e" />
          <text x={86 + index * 62} y="84" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            {(index + 1).toString()}
          </text>
          {index < shown - 1 ? <line x1={101 + index * 62} y1="80" x2={133 + index * 62} y2="80" stroke="#7a5b2e" strokeWidth="2" markerEnd="url(#connectionArrow)" /> : null}
        </g>
      ))}
      <defs>
        <marker id="connectionArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill="#7a5b2e" />
        </marker>
      </defs>
      <text x="180" y="116" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
        connection planning aid
      </text>
    </>
  );
}
