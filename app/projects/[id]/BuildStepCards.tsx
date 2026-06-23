import type { BuildStepCard } from "@/lib/plans/build-step-cards";
import type { WallShelfBuildStepViewModel } from "@/lib/plans/wall-shelf-build-step-view-model";

type BuildStepStatusSummaryViewModel = Pick<WallShelfBuildStepViewModel, "status" | "badges" | "renderLabels">;

export function BuildStepStatusSummary({ viewModel, compact = false }: { viewModel: BuildStepStatusSummaryViewModel; compact?: boolean }) {
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

          <BuildStepMiniDiagram card={card} compact={compact} />

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

function BuildStepMiniDiagram({ card, compact }: { card: BuildStepCard; compact: boolean }) {
  if (!shouldRenderMiniDiagram(card)) return null;
  if (isPlanterStepCard(card)) return <PlanterStepMiniDiagram card={card} compact={compact} />;

  const phase = stepDiagramPhase(card);
  const reviewNeeded = Boolean(card.reviewBlockers?.length) || /review|blocked|do not|confirm wall mounting/i.test(`${card.title} ${card.instructions}`);
  const pieceLabels = card.relatedPieceLabels.length > 0 ? card.relatedPieceLabels : ["Modeled pieces"];
  const visiblePieces = pieceLabels.slice(0, compact ? 2 : 3);
  const singleShelf = isSingleShelfCard(card);
  const ariaLabel = `Step ${card.stepNumber.toString()} mini diagram: ${card.title}; ${pieceLabels.join(", ")}${reviewNeeded ? "; review first" : ""}`;
  const boardFill = reviewNeeded ? "#fff3c4" : "#d9b77f";
  const boardStroke = reviewNeeded ? "5 4" : undefined;

  return (
    <svg className={`${compact ? "mt-2 h-24" : "mt-3 h-28"} w-full rounded-md border border-sawdust bg-shop print:bg-white`} viewBox="0 0 420 112" role="img" aria-label={ariaLabel}>
      <rect x="12" y="12" width="396" height="88" rx="8" fill="#fffaf0" stroke="#d7c7a1" />
      {phase === "cut" ? (
        <>
          <rect x="32" y="28" width="286" height="30" rx="5" fill="#f7efe0" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="6 5" />
          {!singleShelf ? (
            <>
              <line x1="96" y1="28" x2="96" y2="58" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
              <line x1="178" y1="28" x2="178" y2="58" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
            </>
          ) : null}
          <text x="174" y="78" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            check dimensions before cutting
          </text>
        </>
      ) : null}
      {phase === "layout" ? (
        <>
          <rect x="48" y="32" width="24" height="52" rx="4" fill="#eef3e8" stroke="#47624a" strokeWidth="2" />
          <rect x="104" y="34" width="210" height="16" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} />
          {!singleShelf ? <rect x="104" y="64" width="210" height="16" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} /> : null}
          {singleShelf ? <line x1="94" y1="42" x2="104" y2="42" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" /> : null}
          <text x="48" y="96" className="fill-ink text-[10px] font-semibold">
            wall
          </text>
        </>
      ) : null}
      {phase === "support" ? (
        singleShelf ? (
          <>
            <rect x="70" y="24" width="24" height="66" rx="4" fill="#eef3e8" stroke="#47624a" strokeWidth="2" />
            <rect x="122" y="44" width="180" height="18" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} />
            <line x1="94" y1="53" x2="122" y2="53" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
            <text x="122" y="80" className="fill-ink text-[10px] font-semibold">
              support method?
            </text>
          </>
        ) : (
          <>
            <rect x="96" y="28" width="20" height="58" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} />
            <rect x="280" y="28" width="20" height="58" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} />
            <line x1="120" y1="42" x2="276" y2="42" stroke="#7a5b2e" strokeWidth="2" strokeDasharray={reviewNeeded ? "5 4" : undefined} />
            <line x1="120" y1="72" x2="276" y2="72" stroke="#7a5b2e" strokeWidth="2" strokeDasharray={reviewNeeded ? "5 4" : undefined} />
          </>
        )
      ) : null}
      {phase === "mount" ? (
        <>
          <rect x="70" y="24" width="24" height="66" rx="4" fill="#eef3e8" stroke="#47624a" strokeWidth="2" />
          <rect x="122" y="44" width="180" height="18" rx="4" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={boardStroke} />
          <line x1="94" y1="53" x2="122" y2="53" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
          <text x="66" y="102" className="fill-ink text-[10px] font-semibold">
            wall/support review
          </text>
        </>
      ) : null}
      {phase === "finish" ? (
        <>
          <rect x="86" y="36" width="230" height="32" rx="5" fill={boardFill} stroke="#7a5b2e" strokeWidth="2" />
          <path d="M118 48h152M118 58h116" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" />
          <text x="200" y="88" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            finish and final check
          </text>
        </>
      ) : null}
      {phase === "review" ? (
        <>
          <rect x="64" y="34" width="216" height="32" rx="5" fill="#fff3c4" stroke="#d7a526" strokeWidth="2" strokeDasharray="5 4" />
          <text x="172" y="54" textAnchor="middle" className="fill-ink text-[11px] font-semibold">
            review before building
          </text>
        </>
      ) : null}

      <text x="330" y="32" className="fill-ink text-[10px] font-semibold">
        step mini diagram
      </text>
      {visiblePieces.map((label, index) => (
        <text key={`${card.id}:${label}`} x="330" y={50 + index * 14} className="fill-ink text-[10px] font-semibold">
          {shortPartLabel(label)}
        </text>
      ))}
      {reviewNeeded ? (
        <text x="330" y="94" className="fill-ink text-[10px] font-semibold">
          review first
        </text>
      ) : null}
    </svg>
  );
}

function PlanterStepMiniDiagram({ card, compact }: { card: BuildStepCard; compact: boolean }) {
  const phase = stepDiagramPhase(card);
  const reviewNeeded = Boolean(card.reviewBlockers?.length) || /review|confirm|do not/i.test(`${card.title} ${card.instructions}`);
  const visiblePieces = card.relatedPieceLabels.slice(0, compact ? 2 : 3);
  const ariaLabel = `Step ${card.stepNumber.toString()} planter mini diagram: ${card.title}; ${card.relatedPieceLabels.join(", ")}${reviewNeeded ? "; review first" : ""}`;
  const panelFill = reviewNeeded ? "#fff3c4" : "#d9b77f";
  const panelStroke = reviewNeeded ? "5 4" : undefined;

  return (
    <svg className={`${compact ? "mt-2 h-24" : "mt-3 h-28"} w-full rounded-md border border-sawdust bg-shop print:bg-white`} viewBox="0 0 420 112" role="img" aria-label={ariaLabel}>
      <rect x="12" y="12" width="396" height="88" rx="8" fill="#fffaf0" stroke="#d7c7a1" />
      {phase === "cut" ? (
        <>
          <rect x="34" y="28" width="230" height="26" rx="4" fill={panelFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          <line x1="88" y1="28" x2="88" y2="54" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="148" y1="28" x2="148" y2="54" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
          <line x1="210" y1="28" x2="210" y2="54" stroke="#7a5b2e" strokeWidth="2" strokeDasharray="4 4" />
          <text x="149" y="78" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            check panel cuts
          </text>
        </>
      ) : null}
      {phase === "drill" ? (
        <>
          <rect x="68" y="32" width="178" height="46" rx="5" fill={panelFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          {[104, 148, 192].map((x) => (
            <circle key={x} cx={x} cy="55" r="5" fill="#fffaf0" stroke="#47624a" strokeWidth="2" />
          ))}
          <text x="157" y="94" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            bottom panel drainage
          </text>
        </>
      ) : null}
      {phase === "finish" ? (
        <>
          <path d="M78 38h184v38H78z" fill={panelFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          <path d="M102 50h134M102 62h102" stroke="#fffaf0" strokeWidth="3" strokeLinecap="round" />
          <text x="170" y="94" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            finish / liner review
          </text>
        </>
      ) : null}
      {phase !== "cut" && phase !== "drill" && phase !== "finish" ? (
        <>
          <path d="M72 36h168l30 22H102z" fill={panelFill} stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          <path d="M102 58h168v28H102z" fill="#e9cf9a" stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          <path d="M72 36v28l30 22V58zM240 36v28l30 22V58z" fill="#d9b77f" stroke="#7a5b2e" strokeWidth="2" strokeDasharray={panelStroke} />
          <text x="171" y="102" textAnchor="middle" className="fill-ink text-[10px] font-semibold">
            panel connection review
          </text>
        </>
      ) : null}

      <text x="318" y="32" className="fill-ink text-[10px] font-semibold">
        planter step
      </text>
      {visiblePieces.map((label, index) => (
        <text key={`${card.id}:${label}`} x="318" y={50 + index * 14} className="fill-ink text-[10px] font-semibold">
          {shortPartLabel(label)}
        </text>
      ))}
      {reviewNeeded ? (
        <text x="318" y="94" className="fill-ink text-[10px] font-semibold">
          review first
        </text>
      ) : null}
    </svg>
  );
}

function shouldRenderMiniDiagram(card: BuildStepCard): boolean {
  return !/^step_\d+$/u.test(card.id) && (card.relatedPieceLabels.length > 0 || Boolean(card.dimensionReferences?.length) || Boolean(card.reviewBlockers?.length));
}

function isPlanterStepCard(card: BuildStepCard): boolean {
  return card.id.startsWith("planter_") || /\b(Front panel|Back panel|Left side panel|Right side panel|Bottom panel)\b/.test(card.relatedPieceLabels.join(" "));
}

function stepDiagramPhase(card: BuildStepCard): "cut" | "drill" | "layout" | "support" | "mount" | "finish" | "review" {
  const text = `${card.id} ${card.title} ${card.phaseLabel}`.toLowerCase();
  if (text.includes("cut")) return "cut";
  if (/drill|drainage/.test(text)) return "drill";
  if (/support|frame|assemble connected|assembly blocked/.test(text)) return "support";
  if (/mount|installation/.test(text)) return "mount";
  if (/finish|sand|prep/.test(text)) return "finish";
  if (/dry fit|layout/.test(text)) return "layout";
  return "review";
}

function isSingleShelfCard(card: BuildStepCard): boolean {
  const labels = card.relatedPieceLabels.join(" ");
  return /\bShelf board\b/.test(labels) && !/\bShelf boards\b/.test(labels);
}

function shortPartLabel(label: string): string {
  const partMatch = /Part [A-Z]/.exec(label);
  if (partMatch) return partMatch[0];
  return label.length > 18 ? `${label.slice(0, 15)}...` : label;
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
