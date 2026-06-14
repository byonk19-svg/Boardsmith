import type { ProjectAnatomyVisual } from "@/lib/plans/plan-diagrams";
import type { WallShelfDiagramViewModel, WallShelfDiagramVisiblePiece } from "@/lib/plans/wall-shelf-diagram-view-model";

export function ProjectHeroVisual({
  visual,
  compact = false,
  wallShelfViewModel = null,
}: {
  visual: ProjectAnatomyVisual;
  compact?: boolean;
  wallShelfViewModel?: WallShelfDiagramViewModel | null;
}) {
  const svgHeightClass = compact ? "h-56 print:h-48" : "h-72 print:h-56";
  const shouldRenderShelfProject = visual.kind === "simple_shelf";

  return (
    <div className="break-inside-avoid rounded-md border border-sawdust bg-shop/30 p-3 print:break-inside-avoid print:bg-white">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Main project visual from structured plan data.</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">Build-model hero visual - planning aid only.</p>
        </div>
        <span className="w-fit rounded-md border border-sawdust bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink/55">
          {visual.materialLabel}
        </span>
      </div>

      {visual.fallbackMessage ? (
        <p className="mt-3 rounded-md border border-sawdust bg-white p-3 text-sm leading-6 text-ink/70">{visual.fallbackMessage}</p>
      ) : (
        <>
          <svg className={`mt-3 w-full rounded-md border border-sawdust bg-white ${svgHeightClass}`} viewBox="0 0 680 340" role="img" aria-label="Build-model hero visual">
            <rect x="28" y="24" width="624" height="292" rx="10" fill="#fffaf0" stroke="#d7c7a1" />
            {shouldRenderShelfProject ? <ShelfProjectVisual visual={visual} viewModel={wallShelfViewModel} /> : <GenericProjectVisual visual={visual} />}
          </svg>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {visual.pieceLabels.map((label) => (
              <span key={label} className="rounded-md border border-sawdust bg-white px-2.5 py-1 text-xs font-semibold text-ink/70">
                {label}
              </span>
            ))}
            {wallShelfViewModel?.badges.map((badge) => (
              <span key={badge} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-950">
                {badge}
              </span>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function GenericProjectVisual({ visual }: { visual: ProjectAnatomyVisual }) {
  return (
    <>
      <polygon points="186,112 462,112 520,154 244,154" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points="186,112 244,154 244,226 186,182" fill="#b9803c" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points="244,154 520,154 520,226 244,226" fill="#c99a57" stroke="#7a5b2e" strokeWidth="2" />
      <DimensionLabels visual={visual} widthY={86} heightX={148} heightTop={112} heightBottom={226} depthStartX={480} depthStartY={112} depthEndX={540} depthEndY={154} />
      <text x="382" y="252" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        {visual.materialThicknessLabel}
      </text>
      <text x="382" y="188" textAnchor="middle" className="fill-ink text-[17px] font-semibold">
        {visual.pieceLabels.slice(0, 2).join(" + ") || "Major pieces"}
      </text>
    </>
  );
}

function ShelfProjectVisual({ visual, viewModel }: { visual: ProjectAnatomyVisual; viewModel: WallShelfDiagramViewModel | null }) {
  const rawShelfCount = viewModel?.shelfCount ?? visual.shelfCount ?? 1;
  const visibleShelfCount = Math.max(1, Math.min(rawShelfCount, 6));
  const shelves = Array.from({ length: visibleShelfCount }, (_, index) => index);
  const topShelfY = 86;
  const bottomShelfY = visibleShelfCount === 1 ? 186 : 226;
  const shelfGap = visibleShelfCount > 1 ? (bottomShelfY - topShelfY) / (visibleShelfCount - 1) : 0;
  const shelfLabel = rawShelfCount === 1 ? "1 shelf" : `${rawShelfCount.toString()} shelves`;
  const heightLabelY = (topShelfY + bottomShelfY + 34) / 2;
  const heightTransform = `rotate(-90 58 ${heightLabelY.toString()})`;
  const connectedLayout = viewModel?.layout === "connected_shelf_unit";
  const supportPieces = viewModel?.visibleBoards.filter((piece) => piece.role === "support_frame" || piece.role === "support_frame_placeholder") ?? [];
  const supportFrameNeedsReview = viewModel?.supportFrameReview.needsReview ?? false;
  const showSupportFrame = connectedLayout && (supportPieces.length > 0 || supportFrameNeedsReview);
  const widthLabel = viewModel?.dimensions.width.label ?? visual.widthLabel;
  const heightLabel = viewModel?.dimensions.height.label ?? visual.heightLabel;
  const depthLabel = viewModel?.dimensions.depth.label ?? visual.depthLabel;
  const thicknessLabel = viewModel?.dimensions.boardThickness.label ?? visual.materialThicknessLabel;

  return (
    <>
      <rect x="118" y="50" width="86" height="242" fill="#efe7d8" stroke="#d7c7a1" strokeWidth="2" />
      <line x1="204" y1="50" x2="204" y2="292" stroke="#47624a" strokeWidth="4" />
      <text x="161" y="42" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        wall
      </text>

      {shelves.map((_, index) => {
        const y = topShelfY + index * shelfGap;
        return <ShelfBoard key={index} y={y} showBracket={visual.hasWallContext} />;
      })}
      {showSupportFrame ? (
        <ShelfSupportFrame
          pieces={supportPieces}
          needsReview={supportFrameNeedsReview}
          topY={topShelfY - 10}
          bottomY={bottomShelfY + 44}
        />
      ) : null}

      <line x1="240" y1="64" x2="486" y2="64" stroke="#47624a" strokeWidth="2" />
      <line x1="240" y1="58" x2="240" y2="70" stroke="#47624a" strokeWidth="2" />
      <line x1="486" y1="58" x2="486" y2="70" stroke="#47624a" strokeWidth="2" />
      <text x="363" y="52" textAnchor="middle" className="fill-ink text-[15px] font-semibold">
        {widthLabel}
      </text>

      <line x1="90" y1={topShelfY} x2="90" y2={bottomShelfY + 34} stroke="#47624a" strokeWidth="2" />
      <line x1="84" y1={topShelfY} x2="96" y2={topShelfY} stroke="#47624a" strokeWidth="2" />
      <line x1="84" y1={bottomShelfY + 34} x2="96" y2={bottomShelfY + 34} stroke="#47624a" strokeWidth="2" />
      <text x="58" y={heightLabelY} textAnchor="middle" className="fill-ink text-[15px] font-semibold" transform={heightTransform}>
        {heightLabel}
      </text>

      <line x1="492" y1={topShelfY} x2="540" y2={topShelfY + 24} stroke="#47624a" strokeWidth="2" />
      <text x="552" y={topShelfY + 19} className="fill-ink text-[14px] font-semibold">
        {depthLabel}
      </text>

      <text x="368" y="300" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        {shelfLabel} - {thicknessLabel}
      </text>
      {visual.supportLabel ? (
        <text x="210" y="316" className="fill-ink text-[12px] font-semibold">
          {visual.supportLabel}
        </text>
      ) : null}
    </>
  );
}

function ShelfSupportFrame({
  pieces,
  needsReview,
  topY,
  bottomY,
}: {
  pieces: WallShelfDiagramVisiblePiece[];
  needsReview: boolean;
  topY: number;
  bottomY: number;
}) {
  const fill = needsReview ? "#fff3c4" : "#c99a57";
  const strokeDasharray = needsReview ? "6 4" : undefined;
  const label = pieces.some((piece) => piece.role === "support_frame") ? "modeled support/frame" : "support/frame review";

  return (
    <>
      <rect x="226" y={topY} width="12" height={bottomY - topY} rx="4" fill={fill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={strokeDasharray} />
      <rect x="506" y={topY} width="12" height={bottomY - topY} rx="4" fill={fill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={strokeDasharray} />
      <text x="372" y={bottomY + 16} textAnchor="middle" className="fill-ink text-[12px] font-semibold">
        {label}
      </text>
    </>
  );
}

function ShelfBoard({ y, showBracket }: { y: number; showBracket: boolean }) {
  const frontY = y + 24;
  const thickness = 10;
  const yText = y.toString();
  const frontYText = frontY.toString();
  const topThicknessYText = (y + thickness).toString();
  const frontThicknessYText = (frontY + thickness).toString();
  const topBracketYText = (y + 11).toString();
  const lowerBracketYText = (y + 39).toString();
  const frontBracketTopYText = (frontY + 4).toString();
  const frontBracketLowerYText = (frontY + 32).toString();

  return (
    <g>
      <polygon points={`214,${yText} 474,${yText} 522,${frontYText} 262,${frontYText}`} fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points={`214,${yText} 262,${frontYText} 262,${frontThicknessYText} 214,${topThicknessYText}`} fill="#b9803c" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points={`262,${frontYText} 522,${frontYText} 522,${frontThicknessYText} 262,${frontThicknessYText}`} fill="#c99a57" stroke="#7a5b2e" strokeWidth="2" />
      {showBracket ? (
        <>
          <polygon points={`214,${topBracketYText} 190,${lowerBracketYText} 214,${lowerBracketYText}`} fill="#efe7d8" stroke="#47624a" strokeWidth="2" />
          <polygon points={`262,${frontBracketTopYText} 238,${frontBracketLowerYText} 262,${frontBracketLowerYText}`} fill="#efe7d8" stroke="#47624a" strokeWidth="2" />
        </>
      ) : null}
    </g>
  );
}

function DimensionLabels({
  visual,
  widthY,
  heightX,
  heightTop,
  heightBottom,
  depthStartX,
  depthStartY,
  depthEndX,
  depthEndY,
}: {
  visual: ProjectAnatomyVisual;
  widthY: number;
  heightX: number;
  heightTop: number;
  heightBottom: number;
  depthStartX: number;
  depthStartY: number;
  depthEndX: number;
  depthEndY: number;
}) {
  const heightLabelX = heightX - 36;
  const heightLabelY = (heightTop + heightBottom) / 2;
  const heightTransform = `rotate(-90 ${heightLabelX.toString()} ${heightLabelY.toString()})`;

  return (
    <>
      <line x1="186" y1={widthY} x2="462" y2={widthY} stroke="#47624a" strokeWidth="2" />
      <line x1="186" y1={widthY - 6} x2="186" y2={widthY + 6} stroke="#47624a" strokeWidth="2" />
      <line x1="462" y1={widthY - 6} x2="462" y2={widthY + 6} stroke="#47624a" strokeWidth="2" />
      <text x="324" y={widthY - 12} textAnchor="middle" className="fill-ink text-[15px] font-semibold">
        {visual.widthLabel}
      </text>
      <line x1={heightX} y1={heightTop} x2={heightX} y2={heightBottom} stroke="#47624a" strokeWidth="2" />
      <line x1={heightX - 6} y1={heightTop} x2={heightX + 6} y2={heightTop} stroke="#47624a" strokeWidth="2" />
      <line x1={heightX - 6} y1={heightBottom} x2={heightX + 6} y2={heightBottom} stroke="#47624a" strokeWidth="2" />
      <text x={heightLabelX} y={heightLabelY} textAnchor="middle" className="fill-ink text-[15px] font-semibold" transform={heightTransform}>
        {visual.heightLabel}
      </text>
      <line x1={depthStartX} y1={depthStartY} x2={depthEndX} y2={depthEndY} stroke="#47624a" strokeWidth="2" />
      <text x={depthEndX + 12} y={depthEndY - 22} className="fill-ink text-[14px] font-semibold">
        {visual.depthLabel}
      </text>
    </>
  );
}
