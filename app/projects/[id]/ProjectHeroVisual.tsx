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
  const svgHeightClass = compact ? "h-72 print:h-56" : "h-[26rem] print:h-64";
  const shouldRenderShelfProject = visual.kind === "simple_shelf";
  const shouldRenderPlanterBox = visual.kind === "planter_box";
  const canRenderStructuredHero =
    !visual.fallbackMessage || (shouldRenderShelfProject && Boolean(wallShelfViewModel?.visibleBoards.length)) || (shouldRenderPlanterBox && visual.pieceLabels.length > 0);
  const heroAriaLabel = shouldRenderShelfProject
    ? "Deterministic finished wall-shelf hero visual"
    : shouldRenderPlanterBox
      ? "Deterministic planter-box planning hero visual"
      : "Build-model hero visual";
  const previewLabel = shouldRenderShelfProject ? "Finished wall-shelf preview" : shouldRenderPlanterBox ? "Planter-box planning preview" : null;

  return (
    <div className="break-inside-avoid rounded-lg border border-sawdust bg-[#fbf8f1] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] print:break-inside-avoid print:bg-white print:shadow-none">
      <div className="flex flex-col gap-2 px-1 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Main project visual from structured plan data.</p>
          <p className="mt-1 text-xs leading-5 text-ink/60">Build-model hero visual - planning aid only.</p>
          {previewLabel ? <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-ink/45">{previewLabel}</p> : null}
        </div>
        <span className="w-fit rounded-md border border-sawdust bg-white px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink/55">
          {visual.materialLabel}
        </span>
      </div>

      {!canRenderStructuredHero ? (
        <p className="mt-3 rounded-md border border-sawdust bg-white p-3 text-sm leading-6 text-ink/70">{visual.fallbackMessage}</p>
      ) : (
        <>
          <svg className={`mt-3 w-full rounded-md border border-sawdust bg-white shadow-[0_18px_45px_rgba(71,98,74,0.08)] ${svgHeightClass} print:shadow-none`} viewBox="0 0 680 340" role="img" aria-label={heroAriaLabel}>
            <rect x="28" y="24" width="624" height="292" rx="10" fill="#fffaf0" stroke="#d7c7a1" />
            {shouldRenderShelfProject ? (
              <ShelfProjectVisual visual={visual} viewModel={wallShelfViewModel} />
            ) : shouldRenderPlanterBox ? (
              <PlanterBoxProjectVisual visual={visual} />
            ) : (
              <GenericProjectVisual visual={visual} />
            )}
          </svg>
          {visual.fallbackMessage ? (
            <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs font-semibold leading-5 text-amber-950">
              {visual.fallbackMessage}
            </p>
          ) : null}
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

function PlanterBoxProjectVisual({ visual }: { visual: ProjectAnatomyVisual }) {
  const frontPanelLabel = visual.pieceLabels.find((label) => /front/i.test(label)) ?? indexedLabel(visual.pieceLabels, 0, "Front panel");
  const backPanelLabel = visual.pieceLabels.find((label) => /back/i.test(label)) ?? indexedLabel(visual.pieceLabels, 1, "Back panel");
  const bottomPanelLabel = visual.pieceLabels.find((label) => /bottom/i.test(label)) ?? indexedLabel(visual.pieceLabels, 2, "Bottom panel");

  return (
    <>
      <rect x="50" y="54" width="574" height="230" rx="8" fill="#f7efe0" stroke="#d7c7a1" />
      <ellipse cx="370" cy="288" rx="190" ry="18" fill="#000000" opacity="0.08" />
      <polygon points="190,96 464,96 540,144 266,144" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points="190,96 266,144 266,234 190,184" fill="#b9803c" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points="266,144 540,144 540,234 266,234" fill="#c99a57" stroke="#7a5b2e" strokeWidth="2" />
      <polygon points="218,118 464,118 514,150 268,150" fill="#8b6f3f" opacity="0.22" />
      <line x1="268" y1="150" x2="268" y2="226" stroke="#7a5b2e" strokeWidth="2" opacity="0.55" />
      <line x1="514" y1="150" x2="514" y2="226" stroke="#7a5b2e" strokeWidth="2" opacity="0.55" />
      <line x1="326" y1="144" x2="326" y2="234" stroke="#7a5b2e" strokeWidth="1.5" opacity="0.35" />
      <line x1="428" y1="144" x2="428" y2="234" stroke="#7a5b2e" strokeWidth="1.5" opacity="0.35" />
      <circle cx="336" cy="244" r="3.5" fill="#47624a" opacity="0.8" />
      <circle cx="382" cy="248" r="3.5" fill="#47624a" opacity="0.8" />
      <circle cx="428" cy="244" r="3.5" fill="#47624a" opacity="0.8" />
      <DimensionLabels visual={visual} widthY={76} heightX={154} heightTop={96} heightBottom={234} depthStartX={492} depthStartY={96} depthEndX={560} depthEndY={140} />
      <text x="382" y="42" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        open-top planter box planning preview
      </text>
      <text x="384" y="260" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        drainage, liner, finish, and outdoor exposure need review
      </text>
      <text x="384" y="190" textAnchor="middle" className="fill-ink text-[17px] font-semibold">
        {frontPanelLabel} + {backPanelLabel}
      </text>
      <text x="384" y="216" textAnchor="middle" className="fill-ink text-[12px] font-semibold">
        {bottomPanelLabel}
      </text>
      <text x="382" y="306" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        {visual.materialThicknessLabel}
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
  const depthLabel = viewModel?.dimensions.depth.label ?? visual.depthLabel;
  const thicknessLabel = viewModel?.dimensions.boardThickness.label ?? visual.materialThicknessLabel;
  const heightLabel = rawShelfCount === 1 ? compactThicknessLabel(thicknessLabel) : (viewModel?.dimensions.height.label ?? visual.heightLabel);
  const shelfPartLabel = visual.pieceLabels.find((label) => /shelf/i.test(label)) ?? indexedLabel(visual.pieceLabels, 0, "Shelf board");
  const supportPartLabel =
    viewModel?.visibleBoards.find((piece) => piece.role === "support_frame")?.printLabel ??
    viewModel?.visibleBoards.find((piece) => piece.role === "support_frame_placeholder")?.printLabel ??
    null;
  const shelfLabelInsideBoard = visibleShelfCount <= 2 ? shelfPartLabel : null;
  const summaryY = visual.supportLabel ? 296 : 306;

  return (
    <>
      <rect x="52" y="52" width="570" height="218" rx="8" fill="#f7efe0" stroke="#d7c7a1" />
      <line x1="52" y1="96" x2="622" y2="96" stroke="#eadbc2" strokeWidth="2" />
      <line x1="52" y1="142" x2="622" y2="142" stroke="#eadbc2" strokeWidth="2" />
      <line x1="52" y1="188" x2="622" y2="188" stroke="#eadbc2" strokeWidth="2" />
      <line x1="52" y1="234" x2="622" y2="234" stroke="#eadbc2" strokeWidth="2" />
      <rect x="106" y="62" width="100" height="230" fill="#efe7d8" stroke="#d7c7a1" strokeWidth="2" />
      <line x1="204" y1="62" x2="204" y2="292" stroke="#47624a" strokeWidth="4" />
      <ellipse cx="382" cy="286" rx="196" ry="18" fill="#000000" opacity="0.08" />
      <text x="160" y="42" textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        wall plane
      </text>
      <text x="592" y="42" textAnchor="end" className="fill-ink text-[12px] font-semibold">
        finished wall-shelf preview
      </text>

      {shelves.map((_, index) => {
        const y = topShelfY + index * shelfGap;
        return <ShelfBoard key={index} y={y} showBracket={visual.hasWallContext} label={index === 0 ? shelfLabelInsideBoard : null} />;
      })}
      {showSupportFrame ? (
        <ShelfSupportFrame
          pieces={supportPieces}
          needsReview={supportFrameNeedsReview}
          topY={topShelfY - 10}
          bottomY={bottomShelfY + 44}
          label={supportPartLabel}
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

      <text x="368" y={summaryY} textAnchor="middle" className="fill-ink text-[13px] font-semibold">
        {shelfPartLabel}
      </text>
      <text x="368" y={summaryY + 16} textAnchor="middle" className="fill-ink text-[12px] font-semibold">
        {shelfLabel} - {thicknessLabel}
      </text>
      {visual.supportLabel ? (
        <text x="210" y="330" className="fill-ink text-[12px] font-semibold">
          {visual.supportLabel}
        </text>
      ) : null}
    </>
  );
}

function compactThicknessLabel(label: string): string {
  return label.replace(/^Material thickness/i, "Thickness");
}

function indexedLabel(labels: string[], index: number, fallback: string): string {
  return labels.length > index ? labels[index] : fallback;
}

function ShelfSupportFrame({
  pieces,
  needsReview,
  topY,
  bottomY,
  label,
}: {
  pieces: WallShelfDiagramVisiblePiece[];
  needsReview: boolean;
  topY: number;
  bottomY: number;
  label: string | null;
}) {
  const fill = needsReview ? "#fff3c4" : "#c99a57";
  const strokeDasharray = needsReview ? "6 4" : undefined;
  const supportLabel = label ?? (pieces.some((piece) => piece.role === "support_frame") ? "modeled support/frame" : "support/frame review");

  return (
    <>
      <rect x="226" y={topY} width="12" height={bottomY - topY} rx="4" fill={fill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={strokeDasharray} />
      <rect x="506" y={topY} width="12" height={bottomY - topY} rx="4" fill={fill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={strokeDasharray} />
      <text x="372" y={bottomY + 16} textAnchor="middle" className="fill-ink text-[12px] font-semibold">
        {supportLabel}
      </text>
    </>
  );
}

function ShelfBoard({ y, showBracket, label }: { y: number; showBracket: boolean; label: string | null }) {
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
      {label ? (
        <text x="392" y={frontY + 18} textAnchor="middle" className="fill-ink text-[13px] font-semibold">
          {label}
        </text>
      ) : null}
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
