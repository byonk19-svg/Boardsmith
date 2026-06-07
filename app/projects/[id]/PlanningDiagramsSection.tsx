import type { PlanningDiagram, ProjectAnatomyVisual, ThreeViewPlanningDiagram, VisualPieceInventory } from "@/lib/plans/plan-diagrams";

export function PlanningDiagramsSection({
  diagrams,
  fallbackMessage,
  featured = false,
  projectAnatomy,
  threeView,
  visualPieceInventory,
}: {
  diagrams: PlanningDiagram[];
  fallbackMessage: string;
  featured?: boolean;
  projectAnatomy?: ProjectAnatomyVisual;
  threeView?: ThreeViewPlanningDiagram;
  visualPieceInventory?: VisualPieceInventory;
}) {
  const visibleDiagrams = featured ? diagrams.filter((diagram) => diagram.type === "connection_summary") : diagrams;

  if (diagrams.length === 0) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-semibold text-caution">Planning diagram — not to scale.</p>
        {featured && projectAnatomy ? <ProjectAnatomyCard visual={projectAnatomy} /> : null}
        {featured && threeView ? <ThreeViewCard diagram={threeView} /> : null}
        {featured && visualPieceInventory ? <VisualPieceInventoryCards inventory={visualPieceInventory} /> : null}
        <p className="rounded-md border border-sawdust bg-shop p-4 text-sm leading-6 text-ink/70">{fallbackMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2.5 print:space-y-2">
      <p className="text-sm font-semibold text-caution">Planning diagram — not to scale.</p>
      {featured && projectAnatomy ? <ProjectAnatomyCard visual={projectAnatomy} /> : null}
      {featured && threeView ? <ThreeViewCard diagram={threeView} /> : null}
      {featured && visualPieceInventory ? <VisualPieceInventoryCards inventory={visualPieceInventory} /> : null}
      {visibleDiagrams.length > 0 ? (
        <div className={featured ? "grid gap-2.5" : "grid gap-4 lg:grid-cols-2"}>
          {visibleDiagrams.map((diagram, index) => (
            <PlanningDiagramCard key={diagram.id} diagram={diagram} featured={featured && index === 0} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ProjectAnatomyCard({ visual }: { visual: ProjectAnatomyVisual }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust p-3 print:break-inside-avoid">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <h4 className="text-base font-semibold text-ink">{visual.title}</h4>
        <span className="text-xs font-semibold uppercase tracking-wide text-ink/50">{visual.materialLabel}</span>
      </div>
      {visual.fallbackMessage ? (
        <p className="mt-3 rounded-md bg-shop p-3 text-sm leading-6 text-ink/70">{visual.fallbackMessage}</p>
      ) : (
        <>
          <svg className="mt-3 h-64 w-full rounded-md bg-shop print:h-52" viewBox="0 0 560 300" role="img" aria-label="Project anatomy planning visual">
            <rect x="34" y="26" width="492" height="236" rx="8" fill="#fffaf0" stroke="#d7c7a1" />
            <polygon points="150,100 388,100 430,130 190,130" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
            <polygon points="150,100 190,130 190,190 150,158" fill="#b9803c" stroke="#7a5b2e" strokeWidth="2" />
            <polygon points="190,130 430,130 430,190 190,190" fill="#c99a57" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="150" y1="78" x2="388" y2="78" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="150" y1="72" x2="150" y2="84" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="388" y1="72" x2="388" y2="84" stroke="#7a5b2e" strokeWidth="2" />
            <text x="269" y="68" textAnchor="middle" className="fill-ink text-[14px] font-semibold">
              {visual.widthLabel}
            </text>
            <line x1="120" y1="100" x2="120" y2="190" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="114" y1="100" x2="126" y2="100" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="114" y1="190" x2="126" y2="190" stroke="#7a5b2e" strokeWidth="2" />
            <text x="88" y="150" textAnchor="middle" className="fill-ink text-[14px] font-semibold" transform="rotate(-90 88 150)">
              {visual.heightLabel}
            </text>
            <line x1="404" y1="100" x2="448" y2="132" stroke="#7a5b2e" strokeWidth="2" />
            <text x="460" y="112" className="fill-ink text-[13px] font-semibold">
              {visual.depthLabel}
            </text>
            <text x="280" y="218" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
              {visual.materialThicknessLabel}
            </text>
            <text x="280" y="154" textAnchor="middle" className="fill-ink text-[16px] font-semibold">
              {visual.pieceLabels.slice(0, 2).join(" + ") || "Major pieces"}
            </text>
          </svg>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visual.pieceLabels.map((label) => (
              <span key={label} className="rounded-md border border-sawdust bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">
                {label}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function ThreeViewCard({ diagram }: { diagram: ThreeViewPlanningDiagram }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust p-3 print:break-inside-avoid">
      <h4 className="text-base font-semibold text-ink">{diagram.title}</h4>
      {diagram.fallbackMessage ? (
        <p className="mt-3 rounded-md bg-shop p-3 text-sm leading-6 text-ink/70">{diagram.fallbackMessage}</p>
      ) : (
        <div className="mt-3 grid gap-2 md:grid-cols-3 print:grid-cols-3">
          {diagram.views.map((view) => (
            <div key={view.id} className="rounded-md border border-sawdust bg-white p-2.5">
              <h5 className="text-sm font-semibold text-ink">{view.title}</h5>
              <svg className="mt-2 h-28 w-full rounded-md bg-shop print:h-24" viewBox="0 0 220 130" role="img" aria-label={`${view.title} planning view`}>
                <rect x="34" y="34" width="150" height="58" rx="4" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
                <line x1="34" y1="22" x2="184" y2="22" stroke="#7a5b2e" strokeWidth="2" />
                <text x="109" y="17" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
                  {view.primaryDimensionLabel}
                </text>
                <line x1="22" y1="34" x2="22" y2="92" stroke="#7a5b2e" strokeWidth="2" />
                <text x="14" y="67" textAnchor="middle" className="fill-ink text-[10px] font-semibold" transform="rotate(-90 14 67)">
                  {view.secondaryDimensionLabel}
                </text>
              </svg>
              <p className="mt-2 text-xs leading-5 text-ink/65">{view.pieceLabels.slice(0, 3).join(", ")}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function VisualPieceInventoryCards({ inventory }: { inventory: VisualPieceInventory }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust p-3 print:break-inside-avoid">
      <h4 className="text-base font-semibold text-ink">{inventory.disclaimer}</h4>
      {inventory.items.length > 0 ? (
        <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3 print:grid-cols-3">
          {inventory.items.slice(0, 6).map((item) => (
            <div key={item.id} className="rounded-md border border-sawdust bg-white p-2.5">
              <div className="h-8 rounded-sm border border-[#7a5b2e] bg-[#d9b77f]" aria-hidden="true" />
              <p className="mt-1.5 text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs leading-5 text-ink/65">
                {item.quantityLabel} {item.dimensionsLabel}
              </p>
              <p className="mt-1 text-xs leading-5 text-ink/65">{item.materialLabel}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-shop p-3 text-sm leading-6 text-ink/70">
          Visual piece inventory is not available yet. Review the cut list and build guide before building.
        </p>
      )}
    </div>
  );
}

function PlanningDiagramCard({ diagram, featured }: { diagram: PlanningDiagram; featured: boolean }) {
  const cardClass =
    diagram.type === "connection_summary"
      ? "rounded-md border border-sawdust p-3 print:break-inside-avoid lg:col-span-2"
      : featured
        ? "rounded-md border border-sawdust p-3 print:break-inside-avoid lg:row-span-2"
        : "rounded-md border border-sawdust p-4 print:break-inside-avoid";

  return (
    <div className={cardClass}>
      <h4 className="text-sm font-semibold text-ink">{diagram.title}</h4>
      <PlanningDiagramGraphic diagram={diagram} featured={featured} />
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
    <div className="mt-2 space-y-2">
      <p className="text-xs font-medium leading-5 text-ink/65">Connection planning aid. Verify hardware and fasteners before building.</p>
      <ol className="grid gap-2 lg:grid-cols-3">
        {diagram.connections.map((connection, index) => (
          <li key={connection.id} className="rounded-md border border-sawdust p-2.5 text-xs leading-5 text-ink/70">
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

function PlanningDiagramGraphic({ diagram, featured }: { diagram: PlanningDiagram; featured: boolean }) {
  const pieces = diagram.pieces.slice(0, 6);
  const heightClass = diagram.type === "connection_summary" ? "h-28" : featured ? "h-56 print:h-52" : "h-44";

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
