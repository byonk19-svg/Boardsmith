import Link from "next/link";
import { notFound } from "next/navigation";
import { cutListStatusLabel } from "@/lib/plans/cut-list-review";
import { createGatedBuildPacketSnapshot, createGatedBuildPacketSnapshots, latestGatedBuildPacketSnapshot } from "@/lib/plans/gated-build-packet-snapshot";
import { corePacketSectionTitles, createPrintablePlanPacketSummary, labelForPacketCutItem } from "@/lib/plans/printable-plan-packet";
import type { PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { Project } from "@/lib/projects/types";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { BuildStepCards, BuildStepStatusSummary } from "../BuildStepCards";
import { PlanterBoxBuyingPlan } from "../PlanterBoxBuyingPlan";
import { PlanterBoxCutDiagram } from "../PlanterBoxCutDiagram";
import { PlanActionChecklist } from "../PlanActionChecklist";
import { PlanningDiagramsSection } from "../PlanningDiagramsSection";
import { ProjectHeroVisual } from "../ProjectHeroVisual";
import { WallShelfBuyingPlan } from "../WallShelfBuyingPlan";
import { WallShelfCutDiagram } from "../WallShelfCutDiagram";
import { WallShelfDiagrams } from "../WallShelfDiagrams";
import { WallShelfPlanReadiness } from "../WallShelfPlanReadiness";
import { PrintDialogButton } from "./PrintDialogButton";

export const dynamic = "force-dynamic";

export default async function ProjectPrintPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  const plans = await listGeneratedPlans(project.id);
  const latestPlanSnapshot = latestGatedBuildPacketSnapshot(createGatedBuildPacketSnapshots({ project, plans }));
  const snapshot = latestPlanSnapshot ?? createGatedBuildPacketSnapshot({ project, plan: null });
  const manifest = snapshot.manifest;

  if (!manifest.generatedPlan) {
    return <PrintPreviewEmptyState project={project} />;
  }

  return (
    <main className="mx-auto max-w-5xl bg-white p-6 text-ink shadow-soft print:max-w-none print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex flex-col gap-4 rounded-lg border border-sawdust bg-shop/40 p-4 shadow-soft sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-2xl">
          <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-moss hover:underline">
            Back to project
          </Link>
          <p className="mt-3 text-base font-semibold text-ink">Print build sheet</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">Use the button to open your browser print dialog, or use your browser's print command.</p>
          <p className="mt-1 text-sm leading-6 text-ink/65">Boardsmith does not generate PDF, CAD, CNC, or export/download files.</p>
        </div>
        <div className="flex flex-col gap-2 sm:items-end">
          <PrintDialogButton />
          <p className="text-xs leading-5 text-ink/55">Opens the browser print dialog only.</p>
        </div>
      </div>

      <article className="space-y-7 print:space-y-5">
        <header className="border-b border-sawdust pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Print build sheet</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{manifest.project.title}</h1>
          <p className="mt-3 text-sm font-semibold text-caution">Planning aid: verify dimensions, materials, hardware, and safety notes before building.</p>
        </header>

        <PrintSection title={corePacketSectionTitles.buildSnapshot}>
          <PrintBuildSnapshot manifest={manifest} />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.heroVisual}>
          <ProjectHeroVisual visual={manifest.planningDiagrams.projectAnatomy} wallShelfViewModel={manifest.wallShelfDiagramViewModel} compact />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.projectVisuals}>
          {manifest.wallShelfDiagram ? (
            <WallShelfDiagrams model={manifest.wallShelfDiagram} />
          ) : (
            <PlanningDiagramsSection
              diagrams={manifest.planningDiagrams.diagrams}
              fallbackMessage={manifest.planningDiagrams.fallbackMessage}
              projectAnatomy={manifest.planningDiagrams.projectAnatomy}
              threeView={manifest.planningDiagrams.threeView}
              visualPieceInventory={manifest.planningDiagrams.visualPieceInventory}
              featured
            />
          )}
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.checkBeforeBuilding}>
          {manifest.wallShelfPlanReadinessViewModel.status !== "unsupported" ? (
            <div className="mb-4">
              <WallShelfPlanReadiness viewModel={manifest.wallShelfPlanReadinessViewModel} compact />
            </div>
          ) : null}
          <PlanActionChecklist items={mainChecklistItems(manifest)} compact />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.materialsAndParts}>
          <PrintMaterialsAndParts manifest={manifest} />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.cutChecklist} printBreakBefore>
          <PrintCutChecklist manifest={manifest} />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.buyingPlan}>
          {manifest.wallShelfStockBoardViewModel.status !== "unsupported" ? (
            <WallShelfBuyingPlan viewModel={manifest.wallShelfStockBoardViewModel} compact />
          ) : (
            <PlanterBoxBuyingPlan viewModel={manifest.planterBoxStockBoardViewModel} compact />
          )}
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.buildGuide} printBreakBefore>
          <PrintBuildGuide manifest={manifest} />
        </PrintSection>

        <PrintSection title={corePacketSectionTitles.referenceReviewNotes} appendix printBreakBefore>
          <PrintReviewDetails manifest={manifest} />
        </PrintSection>

        <PrintShopNotes />
      </article>
    </main>
  );
}

function PrintPreviewEmptyState({ project }: { project: Project }) {
  return (
    <main className="mx-auto max-w-3xl rounded-lg border border-sawdust bg-white p-8 shadow-soft">
      <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-moss hover:underline">
        Back to project
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">No generated plan to print yet</h1>
      <p className="mt-3 text-sm leading-6 text-ink/65">Generate and validate a plan before using the print build sheet.</p>
    </main>
  );
}

function PrintBuildSnapshot({ manifest }: { manifest: PrintablePlanManifest }) {
  const primaryMaterial = manifest.materials.primaryMaterials.at(0);
  const majorPieces = createPrintablePlanPacketSummary(manifest).majorPieceLabels;
  const topAction = manifest.actionChecklist.find((item) => item.priority === "required") ?? manifest.actionChecklist[0];
  const reviewReminder = topAction.label;

  return (
    <div className="break-inside-avoid rounded-md border border-sawdust bg-shop/30 p-3 print:break-inside-avoid print:bg-white">
      <dl className="grid gap-2 text-sm sm:grid-cols-3 print:grid-cols-3">
        {manifest.project.intake.dimensionFacts.map((fact) => (
          <PrintFact key={fact.label} label={fact.label} value={fact.value} />
        ))}
        <PrintFact label="Main material" value={primaryMaterial?.label ?? manifest.project.intake.material} />
        <PrintFact label="Difficulty" value={manifest.generatedPlan?.estimatedDifficulty ?? "Review before building"} />
        <PrintFact label="Time estimate" value={manifest.generatedPlan?.estimatedTime ?? "Review before building"} />
        <PrintFact label="Major pieces" value={majorPieces.length > 0 ? majorPieces.join(", ") : `${manifest.buildModel.pieceCount.toString()} pieces`} />
        <PrintFact label="First check" value={reviewReminder} />
      </dl>
    </div>
  );
}

function PrintMaterialsAndParts({ manifest }: { manifest: PrintablePlanManifest }) {
  const packet = createPrintablePlanPacketSummary(manifest);
  const pieceItems =
    packet.partRows.length > 0
      ? packet.partRows
      : (manifest.cutList?.items.filter((item) => item.sourceLabel === "Modeled piece").map((item) => ({
          id: item.id,
          printLabel: item.label,
          quantityLabel: item.quantityLabel,
          dimensionsLabel: item.dimensionsLabel,
          materialLabel: item.materialLabel,
        })) ?? []);
  const materialItems = [...manifest.materials.primaryMaterials, ...manifest.materials.hardwareFasteners, ...manifest.materials.finishSupplies];

  return (
    <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
      <div>
        <h3 className="text-sm font-semibold text-ink">Materials to gather</h3>
        {materialItems.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {materialItems.slice(0, 8).map((item) => (
              <MaterialRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-md border border-sawdust p-3 text-sm leading-6 text-ink/65">No material rows are available yet. Review the full plan before purchasing.</p>
        )}
      </div>
      <div>
        <h3 className="text-sm font-semibold text-ink">Pieces to cut</h3>
        {pieceItems.length > 0 ? (
          <div className="mt-2 grid gap-2">
            {pieceItems.slice(0, 8).map((item) => (
              <PieceRow key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <p className="mt-2 rounded-md border border-sawdust p-3 text-sm leading-6 text-ink/65">No piece rows are available yet. Review the cut checklist before building.</p>
        )}
      </div>
    </div>
  );
}

function PrintCutChecklist({ manifest }: { manifest: PrintablePlanManifest }) {
  if (!manifest.cutList) {
    return <p className="text-sm leading-6 text-ink/65">Generate and validate a plan to review cut-list details.</p>;
  }
  const cutRows = printCutRows(manifest.cutList);
  const packet = createPrintablePlanPacketSummary(manifest);

  return (
    <div className="space-y-4">
      {manifest.wallShelfCutDiagramViewModel.status !== "unsupported" ? (
        <WallShelfCutDiagram viewModel={manifest.wallShelfCutDiagramViewModel} compact />
      ) : (
        <PlanterBoxCutDiagram viewModel={manifest.planterBoxCutDiagramViewModel} compact />
      )}
      <dl className="grid gap-3 text-sm sm:grid-cols-5 print:grid-cols-5">
        <PrintFact label="Total cut pieces" value={manifest.cutList.totalPieces.toString()} />
        <PrintFact label="Unique cuts" value={manifest.cutList.cutListRows.toString()} />
        <PrintFact label="Pieces with dimensions" value={manifest.cutList.piecesWithDimensions.toString()} />
        <PrintFact label="Dimension review" value={manifest.cutList.piecesNeedingReview.toString()} />
        <PrintFact label="Plan warnings" value={packet.cutWarningCount.toString()} />
      </dl>
      <p className="text-xs text-ink/55 sm:hidden print:hidden">Scroll sideways to review all cut-list columns.</p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-sawdust text-xs uppercase tracking-wide text-ink/55">
              <th className="py-2 pr-3">Cut?</th>
              <th className="py-2 pr-3">Piece</th>
              <th className="py-2 pr-3">Qty</th>
              <th className="py-2 pr-3">Dimensions</th>
              <th className="py-2 pr-3">Material</th>
              <th className="py-2">Check</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-sawdust">
            {cutRows.map((item) => (
              <tr key={item.id} className="break-inside-avoid print:break-inside-avoid">
                <td className="py-2 pr-3 text-ink/70">
                  <span aria-hidden="true" className="inline-block h-4 w-4 border border-ink/40" />
                </td>
                <td className="py-2 pr-3 font-semibold text-ink">{labelForPacketCutItem(item, packet)}</td>
                <td className="py-2 pr-3 text-ink/70">{item.quantityLabel}</td>
                <td className="py-2 pr-3 text-ink/70">{item.dimensionsLabel}</td>
                <td className="py-2 pr-3 text-ink/70">{item.materialLabel}</td>
                <td className="py-2 text-ink/70">{cutListStatusLabel(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PrintList title="Cutting reminders" items={[...packet.cutWarnings, ...manifest.cutList.reviewNotes].slice(0, 6)} />
    </div>
  );
}

function PrintBuildGuide({ manifest }: { manifest: PrintablePlanManifest }) {
  return (
    <div className="space-y-4">
      <BuildStepStatusSummary viewModel={manifest.wallShelfBuildStepViewModel} compact />
      <BuildStepCards cards={manifest.buildStepCards} compact />
    </div>
  );
}

function PrintReviewDetails({ manifest }: { manifest: PrintablePlanManifest }) {
  const groups = referenceReviewGroups(manifest);
  const generatedSummary = printOpeningSummary(manifest);

  return (
    <div className="space-y-4">
      <PrintList title="Generated plan summary" items={generatedSummary ? [generatedSummary] : []} emptyCopy="No generated summary listed." />
      <div className="grid gap-4 lg:grid-cols-2">
        {groups.map((group) => (
          <PrintList key={group.title} title={group.title} items={group.items} emptyCopy={group.emptyCopy} compact={group.compact} />
        ))}
      </div>
    </div>
  );
}

function PrintSection({
  title,
  children,
  appendix = false,
  printBreakBefore = false,
}: {
  title: string;
  children: React.ReactNode;
  appendix?: boolean;
  printBreakBefore?: boolean;
}) {
  return (
    <section
      className={`break-inside-avoid border-b border-sawdust pb-6 last:border-0 print:break-inside-avoid ${
        printBreakBefore ? "print:break-before-page" : ""
      } ${appendix ? "text-ink/85" : ""}`}
    >
      <h2 className={appendix ? "text-lg font-semibold tracking-tight text-ink/80" : "text-xl font-semibold tracking-tight text-ink"}>{title}</h2>
      {appendix ? <p className="mt-2 text-sm leading-6 text-ink/60">Short reference notes for review after the build flow. Use the sections above as the working plan.</p> : null}
      <div className={appendix ? "mt-3" : "mt-4"}>{children}</div>
    </section>
  );
}

function PrintShopNotes() {
  return (
    <section className="hidden print:block print:break-before-page">
      <h2 className="text-lg font-semibold tracking-tight text-ink">Shop notes</h2>
      <p className="mt-2 text-sm leading-6 text-ink/60">Blank space for handwritten notes on the printed plan. Nothing here is saved in Boardsmith.</p>
      <div className="mt-4 h-40 rounded-md border border-dashed border-ink/35" aria-hidden="true" />
    </section>
  );
}

function PrintFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-sawdust bg-white p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}

function MaterialRow({ item }: { item: PrintablePlanManifest["materials"]["primaryMaterials"][number] }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust p-2.5 print:break-inside-avoid">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-ink">{item.label}</p>
        <p className="text-xs font-semibold text-ink/60">{humanMaterialDetail(item)}</p>
      </div>
      {humanMaterialNote(item) ? <p className="mt-1 text-xs leading-5 text-ink/60">{humanMaterialNote(item)}</p> : null}
    </div>
  );
}

function PieceRow({ item }: { item: { id: string; printLabel: string; quantityLabel: string; dimensionsLabel: string; materialLabel: string } }) {
  return (
    <div className="break-inside-avoid rounded-md border border-sawdust p-2.5 print:break-inside-avoid">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between">
        <p className="text-sm font-semibold text-ink">{item.printLabel}</p>
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{item.quantityLabel}</p>
      </div>
      <p className="mt-1 text-xs leading-5 text-ink/65">
        {item.quantityLabel} - {item.dimensionsLabel}
      </p>
      <p className="mt-1 text-xs leading-5 text-ink/60">{item.materialLabel}</p>
    </div>
  );
}

function compactPrintSummary(summary: string): string {
  const trimmed = summary.trim();
  const firstSentence = /^.*?[.!?](?:\s|$)/.exec(trimmed)?.[0]?.trim();
  const compact = firstSentence && firstSentence.length >= 24 ? firstSentence : trimmed;
  if (compact.length <= 180) return compact;
  return `${compact.slice(0, 177).trimEnd()}...`;
}

function printOpeningSummary(manifest: PrintablePlanManifest): string | null {
  const wallShelf = manifest.wallShelfDiagram;
  if (wallShelf?.status === "ready" && wallShelf.shelfCount && wallShelf.shelfCount > 1 && wallShelf.shelfWidthInches && wallShelf.shelfDepthInches && wallShelf.boardThicknessInches) {
    const count = numberWord(wallShelf.shelfCount);
    const material = printBoardMaterialLabel(wallShelf.materialLabel);
    return `This project creates a simple multi-shelf wall unit for bathroom use: ${count} ${wallShelf.shelfWidthInches.toString()} in wide x ${wallShelf.shelfDepthInches.toString()} in deep shelves made from ${wallShelf.boardThicknessInches.toString()} in thick ${material}.`;
  }

  if (manifest.wallShelfDiagramViewModel.status === "needs_review" && manifest.generatedPlan?.summary) {
    return compactPrintSummary(manifest.generatedPlan.summary);
  }

  return manifest.sections.projectSummary ? compactPrintSummary(manifest.sections.projectSummary) : null;
}

function printBoardMaterialLabel(label: string): string {
  const normalized = label.trim().replace(/^(\d+(?:\/\d+)?|\d+(?:\.\d+)?)\s*in(?:ch)?\s+/i, "");
  if (/pine board$/i.test(normalized)) return normalized.replace(/board$/i, "boards");
  if (/board$/i.test(normalized)) return normalized.replace(/board$/i, "boards");
  if (/boards$/i.test(normalized)) return normalized;
  return normalized || "boards";
}

function numberWord(value: number): string {
  const words = ["zero", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine", "ten"];
  return words[value] ?? value.toString();
}

function mainChecklistItems(manifest: PrintablePlanManifest) {
  const requiredItems = manifest.actionChecklist.filter((item) => item.priority === "required");
  const selected = requiredItems.length > 0 ? requiredItems.slice(0, 3) : manifest.actionChecklist.slice(0, 3);
  return selected;
}

function PrintList({ title, items, emptyCopy = "No items listed.", compact = false }: { title: string; items: string[]; emptyCopy?: string; compact?: boolean }) {
  return (
    <div className={compact ? "mt-3 first:mt-0" : "mt-4 first:mt-0"}>
      <h3 className={compact ? "text-xs font-semibold uppercase tracking-wide text-ink/60" : "text-sm font-semibold text-ink"}>{title}</h3>
      {items.length > 0 ? (
        <ul className={compact ? "mt-1 space-y-1" : "mt-2 space-y-2"}>
          {items.map((item) => (
            <li key={item} className={compact ? "text-xs leading-5 text-ink/65" : "text-sm leading-6 text-ink/75"}>
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className={compact ? "mt-1 text-xs leading-5 text-ink/60" : "mt-2 text-sm leading-6 text-ink/65"}>{emptyCopy}</p>
      )}
    </div>
  );
}

function printCutRows(cutList: NonNullable<PrintablePlanManifest["cutList"]>): NonNullable<PrintablePlanManifest["cutList"]>["items"] {
  const generatedRows = cutList.items.filter((item) => item.sourceLabel === "Generated cut");
  const sourceRows = generatedRows.length > 0 ? generatedRows : cutList.items.filter((item) => item.sourceLabel === "Modeled piece");
  const seen = new Set<string>();

  return sourceRows.filter((item) => {
    const key = [item.label.toLowerCase(), item.quantityLabel, item.dimensionsLabel, item.materialLabel.toLowerCase()].join("|");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function humanMaterialDetail(item: PrintablePlanManifest["materials"]["primaryMaterials"][number]): string {
  const detail = item.detail.toLowerCase();
  if (item.label.toLowerCase().includes("support method") || detail.includes("bracket")) return "Support method needs review";
  if (item.label.toLowerCase().includes("anchor") || item.label.toLowerCase().includes("fastener")) return "Wall fasteners depend on wall type";
  if (detail.includes("finish") || item.label.toLowerCase().includes("finish")) return "Finish: as needed for project use";

  const plannedMatch = /^(\d+) planned pieces? - ([^-]+) -/.exec(item.detail);
  if (plannedMatch) {
    const count = plannedMatch[1];
    return `${count} planned ${count === "1" ? "piece" : "pieces"}`;
  }

  if (detail.includes("quantity to review")) return "Quantity needs review";
  if (detail.includes("as needed")) return "As needed";
  return item.detail.replaceAll(" - ", ", ");
}

function humanMaterialNote(item: PrintablePlanManifest["materials"]["primaryMaterials"][number]): string | null {
  const text = `${item.label} ${item.detail} ${item.notes.join(" ")}`.toLowerCase();
  if (item.label.toLowerCase().includes("support method")) return "Choose brackets, cleats, side supports, or frame details before trusting hardware quantity.";
  if (item.label.toLowerCase().includes("anchor") || item.label.toLowerCase().includes("fastener")) return "Select hardware after checking the wall type and mounting location.";
  if (text.includes("humidity") || text.includes("moisture")) return "Review finish and hardware for bathroom humidity before building.";
  const note = item.notes.at(0) ?? null;
  return note?.replace(/^Plan material:\s*[^.]+\.\s*/i, "") ?? null;
}

function referenceReviewGroups(manifest: PrintablePlanManifest): { title: string; items: string[]; emptyCopy?: string; compact?: boolean }[] {
  return [
    {
      title: "Wall/support review",
      items: uniquePrintNotes([
        ...manifest.sections.safetyFlags.map((flag) => flag.message).filter((message) => /wall|mount|anchor|fastener|load|support/i.test(message)),
        ...manifest.sections.safetyNotes.filter((message) => /wall|mount|anchor|fastener|load|support/i.test(message)),
        "Boardsmith cannot verify wall safety or load capacity.",
      ]).slice(0, 4),
    },
    {
      title: "Open questions",
      items: manifest.sections.unresolvedQuestions.slice(0, 4),
      emptyCopy: "No unresolved questions listed. Review the plan before building.",
    },
    {
      title: "Finish/humidity notes",
      items: uniquePrintNotes([
        ...manifest.sections.finishingSteps,
        ...manifest.materials.reviewNotes.filter((message) => /finish|humidity|moisture|water|corrosion/i.test(message)),
      ]).slice(0, 4),
      emptyCopy: "No specific finish or humidity notes listed.",
    },
    {
      title: "Planning-aid reminder",
      items: [
        "Use this as a planning aid; verify dimensions, materials, hardware, tool setup, and site conditions before building.",
        "No PDF, CAD, CNC, load rating, or engineering sign-off is generated.",
      ],
      compact: true,
    },
  ];
}

function uniquePrintNotes(items: string[]): string[] {
  const seen = new Set<string>();
  return items.filter((item) => {
    const normalized = item.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
    if (!normalized || seen.has(normalized)) return false;
    seen.add(normalized);
    return true;
  });
}
