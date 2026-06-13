import type { WallShelfDiagramModel } from "@/lib/diagrams/wall-shelf-diagram-model";
import { BoardRect, Callout, DiagramNote, DiagramPanel, DiagramSvg, DimensionLine, ReviewBadge } from "./diagram-primitives";

export function WallShelfDiagrams({ model, compact = false }: { model: WallShelfDiagramModel; compact?: boolean }) {
  if (model.status !== "ready") {
    return (
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
        <p className="font-semibold">Diagram needs more details.</p>
        <p className="mt-1">{model.fallbackMessage}</p>
      </div>
    );
  }

  return (
    <details className="rounded-md border border-sawdust bg-white p-4 print:block" open={!compact}>
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        Planning diagrams
        <span className="ml-2 font-normal text-ink/55">drawn from the saved measurements and cut list</span>
      </summary>
      <p className="mt-3 text-sm font-semibold text-caution">Planning diagram - not to scale.</p>
      <div className="mt-3 grid gap-3 lg:grid-cols-2 print:grid-cols-2">
        <DiagramPanel title="Front elevation / shelf layout">
          <FrontElevation model={model} />
          <DiagramNote>
            Shows shelf count, overall width, total height, and spacing when provided. Support method still needs review.
          </DiagramNote>
        </DiagramPanel>
        <DiagramPanel title="Side view">
          <SideView model={model} />
          <DiagramNote>Shows how far the shelf projects from the wall and the board thickness.</DiagramNote>
        </DiagramPanel>
        <DiagramPanel title="Cut parts">
          <PartSchedule model={model} />
        </DiagramPanel>
        <DiagramPanel title="Mounting review">
          <MountingReview model={model} />
        </DiagramPanel>
      </div>
    </details>
  );
}

function formatInches(value: number | null): string {
  return value ? `${value.toString()} in` : "to verify";
}

function FrontElevation({ model }: { model: WallShelfDiagramModel }) {
  const shelfCount = Math.max(1, model.shelfCount ?? 1);
  const shownShelves = Math.min(shelfCount, 8);
  const boardHeight = shelfCount > 5 ? 10 : 13;
  const topY = 50;
  const spacing = shownShelves > 1 ? Math.min(26, 110 / (shownShelves - 1)) : 0;
  const bottomY = topY + Math.max(boardHeight, (shownShelves - 1) * spacing + boardHeight);

  return (
    <DiagramSvg title="Wall shelf front elevation" description="Front elevation shelf layout, not to scale.">
      <rect x="72" y="40" width="276" height="140" rx="6" fill="#f7efe0" stroke="#d7c7a1" strokeDasharray="5 5" />
      <line x1="86" y1="38" x2="86" y2="182" stroke="#7a5b2e" strokeDasharray="5 5" />
      <line x1="334" y1="38" x2="334" y2="182" stroke="#7a5b2e" strokeDasharray="5 5" />
      <Callout x={92} y={194}>overall layout area</Callout>
      {Array.from({ length: shownShelves }).map((_, index) => (
        <BoardRect key={index.toString()} x={96} y={topY + index * spacing} width={228} height={boardHeight} label={shownShelves <= 4 ? `shelf ${(index + 1).toString()}` : undefined} />
      ))}
      <DimensionLine x1={96} y1={34} x2={324} y2={34} label={`${formatInches(model.shelfWidthInches)} wide`} />
      {model.totalProjectHeightInches ? <DimensionLine x1={370} y1={topY} x2={370} y2={bottomY} label={`${formatInches(model.totalProjectHeightInches)} total height`} /> : null}
      <Callout x={110} y={26}>{shelfCount.toString()} shelf {shelfCount === 1 ? "board" : "boards"}</Callout>
      {model.shelfCount && model.shelfCount > shownShelves ? <Callout x={248} y={194}>showing first {shownShelves.toString()}</Callout> : null}
      <Callout x={214} y={178}>{model.shelfSpacingInches ? `${formatInches(model.shelfSpacingInches)} spacing` : "spacing to verify"}</Callout>
    </DiagramSvg>
  );
}

function SideView({ model }: { model: WallShelfDiagramModel }) {
  return (
    <DiagramSvg title="Wall shelf side view" description="Side view showing wall reference, shelf depth, and board thickness, not to scale.">
      <line x1="92" y1="36" x2="92" y2="176" stroke="#47624a" strokeWidth="5" />
      <Callout x={46} y={32}>wall</Callout>
      <BoardRect x={94} y={92} width={210} height={24} />
      <DimensionLine x1={94} y1={76} x2={304} y2={76} label={`${formatInches(model.shelfDepthInches)} from wall`} />
      <DimensionLine x1={322} y1={92} x2={322} y2={116} label={`${formatInches(model.boardThicknessInches)} thick`} />
      <ReviewBadge x={112} y={130} label={model.supportLabel} />
      <line x1="92" y1="116" x2="304" y2="116" stroke="#7a5b2e" strokeDasharray="4 4" />
      <Callout x={112} y={164}>mounting/load review required</Callout>
    </DiagramSvg>
  );
}

function PartSchedule({ model }: { model: WallShelfDiagramModel }) {
  return (
    <div className="space-y-3">
      {model.partSchedule.map((row) => {
        const label = diagramPartLabel(row.label, row.quantity);
        return (
        <div key={`${row.label}:${row.quantity.toString()}`} className="rounded-md border border-sawdust bg-shop/40 p-3">
          <svg className="mb-3 h-20 w-full rounded-md border border-sawdust bg-white" viewBox="0 0 420 96" role="img" aria-label={`${label} cut part planning graphic`}>
            <rect x="18" y="16" width="300" height="36" rx="5" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
            <line x1="18" y1="64" x2="318" y2="64" stroke="#47624a" strokeWidth="2" />
            <line x1="18" y1="58" x2="18" y2="70" stroke="#47624a" strokeWidth="2" />
            <line x1="318" y1="58" x2="318" y2="70" stroke="#47624a" strokeWidth="2" />
            <text x="168" y="82" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
              {row.dimensionsLabel}
            </text>
            <rect x="334" y="18" width="62" height="30" rx="5" fill="#fffaf0" stroke="#d7c7a1" />
            <text x="365" y="38" textAnchor="middle" className="fill-ink text-[12px] font-semibold">
              Qty {row.quantity.toString()}
            </text>
          </svg>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <p className="text-sm font-semibold text-ink">{label}</p>
            <span className="w-fit rounded-md bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">Qty {row.quantity.toString()}</span>
          </div>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            {row.dimensionsLabel} - {row.materialLabel}
          </p>
        </div>
        );
      })}
      <DiagramNote>Cut count is based on the physical cut-list quantity shown in the generated plan.</DiagramNote>
    </div>
  );
}

function diagramPartLabel(label: string, quantity: number): string {
  if (quantity <= 1) return label;
  if (/^shelf board$/i.test(label.trim())) return "Shelf boards";
  return label;
}

function MountingReview({ model }: { model: WallShelfDiagramModel }) {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-950">{model.supportLabel}</p>
      <ul className="mt-2 space-y-2">
        {model.reviewItems.slice(0, 5).map((item) => (
          <li key={item} className="text-sm leading-6 text-amber-900">
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
