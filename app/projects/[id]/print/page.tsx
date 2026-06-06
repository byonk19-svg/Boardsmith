import Link from "next/link";
import { notFound } from "next/navigation";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { cutListStatusLabel } from "@/lib/plans/cut-list-review";
import { createPrintablePlanManifest, type PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedPlanReviewStatus } from "@/lib/plans/plan-quality";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { BuildStepCards } from "../BuildStepCards";
import { PlanActionChecklist } from "../PlanActionChecklist";
import { PlanningDiagramsSection } from "../PlanningDiagramsSection";

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
  const latestPlan = plans.length > 0 ? (plans.find((plan) => plan.is_latest) ?? plans[0]) : null;
  const buildModel = latestPlan?.build_model_json ?? createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
  const manifest = createPrintablePlanManifest({
    project,
    planRecord: latestPlan,
    buildModel,
    buildModelSource: latestPlan?.build_model_json ? "saved" : "derived",
  });

  if (!manifest.generatedPlan) {
    return <PrintPreviewEmptyState project={project} />;
  }

  return (
    <main className="mx-auto max-w-5xl bg-white p-6 text-ink shadow-soft print:max-w-none print:p-0 print:shadow-none">
      <div className="no-print mb-6 flex flex-col gap-3 border-b border-sawdust pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href={`/projects/${project.id}`} className="text-sm font-semibold text-moss hover:underline">
            Back to project
          </Link>
          <p className="mt-2 text-sm text-ink/65">Use your browser's print dialog if you want a paper copy.</p>
        </div>
      </div>

      <article className="space-y-7 print:space-y-5">
        <header className="border-b border-sawdust pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Browser print preview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{manifest.project.title}</h1>
          <p className="mt-3 text-sm font-semibold text-caution">Review all dimensions, materials, and safety notes before building.</p>
          {manifest.sections.projectSummary ? <p className="mt-4 max-w-3xl leading-7 text-ink/75">{manifest.sections.projectSummary}</p> : null}

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
            <PrintFact label="Project type" value={manifest.project.projectTypeLabel} />
            <PrintFact label="Plan date" value={new Date(manifest.generatedPlan.createdAt).toLocaleDateString()} />
            <PrintFact label="Difficulty" value={manifest.generatedPlan.estimatedDifficulty} />
            <PrintFact label="Time estimate" value={manifest.generatedPlan.estimatedTime} />
          </dl>
        </header>

        <PrintSection title="Build Snapshot">
          <PrintBuildSnapshot manifest={manifest} />
        </PrintSection>

        <PrintSection title="Project Visuals">
          <PlanningDiagramsSection diagrams={manifest.planningDiagrams.diagrams} fallbackMessage={manifest.planningDiagrams.fallbackMessage} featured />
        </PrintSection>

        <PrintSection title="Check Before Building">
          <PlanActionChecklist items={manifest.actionChecklist} compact />
        </PrintSection>

        <PrintSection title="Materials and Parts">
          <PrintMaterialsAndParts manifest={manifest} />
        </PrintSection>

        <PrintSection title="Cut Checklist">
          <PrintCutChecklist manifest={manifest} />
        </PrintSection>

        <PrintSection title="Build Guide">
          <PrintBuildGuide manifest={manifest} />
        </PrintSection>

        <PrintSection title="Review Details">
          <PrintReviewDetails manifest={manifest} />
        </PrintSection>
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
      <p className="mt-3 text-sm leading-6 text-ink/65">Generate and validate a plan before using browser print preview.</p>
    </main>
  );
}

function PrintBuildSnapshot({ manifest }: { manifest: PrintablePlanManifest }) {
  const primaryMaterial = manifest.materials.primaryMaterials.at(0);
  const cutListFact = manifest.cutList
    ? `${manifest.cutList.items.length.toString()} rows / ${manifest.cutList.piecesNeedingReview.toString()} need review`
    : "Generate a plan to review";
  const tools = manifest.sections.tools.length > 0 ? manifest.sections.tools : manifest.project.intake.tools;
  const majorPieces = majorPieceLabels(manifest);
  const topAction = manifest.actionChecklist.find((item) => item.priority === "required") ?? manifest.actionChecklist[0];
  const reviewReminder = topAction.label;

  return (
    <div className="break-inside-avoid rounded-md border border-sawdust bg-shop/40 p-4 print:break-inside-avoid print:bg-white">
      <p className="text-sm leading-6 text-ink/65">Quick shop-plan facts to check before measuring, cutting, fastening, finishing, or mounting.</p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3 print:grid-cols-3">
        <PrintFact label="Overall dimensions" value={manifest.project.intake.dimensions} />
        <PrintFact label="Main material" value={primaryMaterial?.label ?? manifest.project.intake.material} />
        <PrintFact label="Major pieces" value={majorPieces.length > 0 ? majorPieces.join(", ") : `${manifest.buildModel.pieceCount.toString()} pieces`} />
        <PrintFact label="Cut list" value={cutListFact} />
        <PrintFact label="Primary tools" value={tools.length > 0 ? tools.slice(0, 4).join(", ") : "Review tools before building"} />
        <PrintFact label="First check" value={reviewReminder} />
      </dl>
    </div>
  );
}

function PrintMaterialsAndParts({ manifest }: { manifest: PrintablePlanManifest }) {
  const pieceItems = manifest.cutList?.items.filter((item) => item.sourceLabel === "Modeled piece") ?? [];

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <div>
        <PrintList title="Primary materials" items={formatMaterialItems(manifest.materials.primaryMaterials)} />
        <PrintList title="Hardware / fasteners" items={formatMaterialItems(manifest.materials.hardwareFasteners)} emptyCopy="No hardware or fastener placeholders are modeled yet." />
        <PrintList title="Finish / optional supplies" items={formatMaterialItems(manifest.materials.finishSupplies)} emptyCopy="No finish or optional supply notes are listed yet." />
      </div>
      <div>
        <PrintList title="Parts to identify" items={pieceItems.map((item) => `${item.label}: ${item.quantityLabel} - ${item.dimensionsLabel} - ${item.materialLabel}`)} />
        <PrintList title="Material checks" items={manifest.materials.reviewNotes.slice(0, 6)} />
      </div>
    </div>
  );
}

function PrintCutChecklist({ manifest }: { manifest: PrintablePlanManifest }) {
  if (!manifest.cutList) {
    return <p className="text-sm leading-6 text-ink/65">Generate and validate a plan to review cut-list details.</p>;
  }

  return (
    <div className="space-y-4">
      <dl className="grid gap-3 text-sm sm:grid-cols-3 print:grid-cols-3">
        <PrintFact label="Total pieces" value={manifest.cutList.totalPieces.toString()} />
        <PrintFact label="With dimensions" value={manifest.cutList.piecesWithDimensions.toString()} />
        <PrintFact label="Needs review" value={manifest.cutList.piecesNeedingReview.toString()} />
      </dl>
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
            {manifest.cutList.items.map((item) => (
              <tr key={item.id} className="break-inside-avoid print:break-inside-avoid">
                <td className="py-2 pr-3 text-ink/70">
                  <span aria-hidden="true" className="inline-block h-4 w-4 border border-ink/40" />
                </td>
                <td className="py-2 pr-3 font-semibold text-ink">{item.label}</td>
                <td className="py-2 pr-3 text-ink/70">{item.quantityLabel}</td>
                <td className="py-2 pr-3 text-ink/70">{item.dimensionsLabel}</td>
                <td className="py-2 pr-3 text-ink/70">{item.materialLabel}</td>
                <td className="py-2 text-ink/70">{cutListStatusLabel(item.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PrintList title="Cutting reminders" items={[...manifest.cutList.warnings, ...manifest.cutList.reviewNotes].slice(0, 6)} />
    </div>
  );
}

function PrintBuildGuide({ manifest }: { manifest: PrintablePlanManifest }) {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <BuildStepCards cards={manifest.buildStepCards} compact />
      <div>
        <PrintList
          title="Modeled operations"
          items={manifest.sections.modeledOperations.map((operation) => `${operation.sequenceNumber.toString()}. ${operation.title}: ${operation.description}`)}
          emptyCopy="No modeled operations are available yet. Review the build steps before building."
        />
        <PrintList title="Finishing notes" items={manifest.sections.finishingSteps} emptyCopy="No finishing notes are listed yet." />
      </div>
    </div>
  );
}

function PrintReviewDetails({ manifest }: { manifest: PrintablePlanManifest }) {
  const planReviewItems = manifest.planReview
    ? [
        `${planReviewLabel(manifest.planReview.status)}: ${manifest.planReview.blockingIssueCount.toString()} blocking issues, ${manifest.planReview.warningCount.toString()} warnings.`,
        ...manifest.planReview.topMessages,
      ]
    : ["Generate a plan to see Boardsmith's review checks."];
  const reminderItems = [
    ...manifest.disclaimers.filter((item) => !item.toLowerCase().includes("no export")),
    "No app-generated export or download is available from this print view.",
  ];

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <PrintList title="Plan review summary" items={planReviewItems.slice(0, 6)} />
      <PrintList title="Safety notes" items={manifest.sections.safetyNotes} />
      <PrintList title="Safety flags" items={manifest.sections.safetyFlags.map((flag) => flag.message)} emptyCopy="No deterministic safety flags were added. Builder review is still required." />
      <PrintList title="Open questions" items={manifest.sections.unresolvedQuestions} emptyCopy="No unresolved questions listed. Review the full plan before building." />
      <PrintList title="Assumptions" items={manifest.sections.assumptions} />
      <PrintList title="Planning-aid reminders" items={reminderItems} />
    </div>
  );
}

function PrintSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="break-inside-avoid border-b border-sawdust pb-6 last:border-0 print:break-inside-avoid">
      <h2 className="text-xl font-semibold tracking-tight text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PrintFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-sawdust p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
      <dd className="mt-1 font-medium text-ink">{value}</dd>
    </div>
  );
}

function formatMaterialItems(items: PrintablePlanManifest["materials"]["primaryMaterials"]): string[] {
  return items.map((item) => `${item.label}: ${item.detail}${item.notes.length > 0 ? ` - ${item.notes.join(" ")}` : ""}`);
}

function majorPieceLabels(manifest: PrintablePlanManifest): string[] {
  const modeledPieces = manifest.cutList?.items.filter((item) => item.sourceLabel === "Modeled piece") ?? [];
  return [...new Set(modeledPieces.map((item) => item.label))].slice(0, 3);
}

function PrintList({ title, items, emptyCopy = "No items listed." }: { title: string; items: string[]; emptyCopy?: string }) {
  return (
    <div className="mt-4 first:mt-0">
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {items.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {items.map((item) => (
            <li key={item} className="text-sm leading-6 text-ink/75">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink/65">{emptyCopy}</p>
      )}
    </div>
  );
}

function planReviewLabel(status: GeneratedPlanReviewStatus): string {
  if (status === "blocked") return "Blocked";
  if (status === "warnings") return "Warnings";
  return "Passed";
}
