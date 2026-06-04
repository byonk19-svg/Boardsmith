import Link from "next/link";
import { notFound } from "next/navigation";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { createPrintablePlanManifest, type PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedPlanReviewStatus } from "@/lib/plans/plan-quality";
import type { ExportReadinessStatus } from "@/lib/plans/export-readiness";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";
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

      <article className="space-y-8">
        <header className="border-b border-sawdust pb-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Browser print preview</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">{manifest.project.title}</h1>
          <p className="mt-3 text-sm font-semibold text-caution">Review all dimensions, materials, and safety notes before building.</p>
          {manifest.sections.projectSummary ? <p className="mt-4 max-w-3xl leading-7 text-ink/75">{manifest.sections.projectSummary}</p> : null}

          <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
            <PrintFact label="Project type" value={manifest.project.projectTypeLabel} />
            <PrintFact label="Generated" value={`${new Date(manifest.generatedPlan.createdAt).toLocaleDateString()} - ${manifest.generatedPlan.modelName}`} />
            <PrintFact label="Confidence" value={`${manifest.generatedPlan.confidenceLevel} plan / ${manifest.buildModel.confidenceLevel} model`} />
            <PrintFact label="Build model" value={`${manifest.buildModel.source} - ${manifest.buildModel.pieceCount.toString()} pieces`} />
          </dl>
        </header>

        <PrintBeforeBuild manifest={manifest} />

        <PrintReviewStrip manifest={manifest} />

        <PrintSection title="Planning diagrams">
          <PlanningDiagramsSection diagrams={manifest.planningDiagrams.diagrams} fallbackMessage={manifest.planningDiagrams.fallbackMessage} />
        </PrintSection>

        <PrintSection title="Materials">
          <PrintList title="Primary materials" items={manifest.materials.primaryMaterials.map((item) => `${item.label}: ${item.detail}${item.notes.length > 0 ? ` - ${item.notes.join(" ")}` : ""}`)} />
          <PrintList title="Hardware / fasteners" items={manifest.materials.hardwareFasteners.map((item) => `${item.label}: ${item.detail}${item.notes.length > 0 ? ` - ${item.notes.join(" ")}` : ""}`)} emptyCopy="No hardware or fastener placeholders are modeled yet." />
          <PrintList title="Finish / optional supplies" items={manifest.materials.finishSupplies.map((item) => `${item.label}: ${item.detail}${item.notes.length > 0 ? ` - ${item.notes.join(" ")}` : ""}`)} emptyCopy="No finish or optional supply notes are listed yet." />
          <PrintList title="Material assumptions and review notes" items={manifest.materials.reviewNotes} />
        </PrintSection>

        <PrintSection title="Cut List Review">
          {manifest.cutList ? (
            <div className="space-y-4">
              <dl className="grid gap-3 text-sm sm:grid-cols-3">
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
                      <th className="py-2">Review notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sawdust">
                    {manifest.cutList.items.map((item) => (
                      <tr key={item.id}>
                        <td className="py-3 pr-3 text-ink/70">
                          <span aria-hidden="true" className="inline-block h-4 w-4 border border-ink/40" />
                        </td>
                        <td className="py-3 pr-3 font-semibold text-ink">{item.label}</td>
                        <td className="py-3 pr-3 text-ink/70">{item.quantityLabel}</td>
                        <td className="py-3 pr-3 text-ink/70">{item.dimensionsLabel}</td>
                        <td className="py-3 pr-3 text-ink/70">{item.materialLabel}</td>
                        <td className="py-3 text-ink/70">{item.messages.join(" ")}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <PrintList title="Cutting reminders" items={manifest.cutList.reviewNotes} />
            </div>
          ) : (
            <p className="text-sm leading-6 text-ink/65">Generate and validate a plan to review cut-list details.</p>
          )}
        </PrintSection>

        <PrintSection title="Operations and Build Steps">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <ol className="space-y-4">
              {manifest.sections.buildSteps.map((step) => (
                <li key={step.step_number} className="border-l-2 border-moss pl-4">
                  <p className="font-semibold text-ink">
                    {step.step_number}. {step.title}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-ink/70">{step.instructions}</p>
                  <p className="mt-2 text-xs font-medium text-ink/55">Tools: {step.tools_used.join(", ")}</p>
                  {step.safety_note ? <p className="mt-2 text-sm font-medium text-caution">{step.safety_note}</p> : null}
                </li>
              ))}
            </ol>
            <PrintList
              title="Modeled operations"
              items={manifest.sections.modeledOperations.map((operation) => `${operation.sequenceNumber.toString()}. ${operation.title}: ${operation.description}`)}
            />
          </div>
        </PrintSection>

        <PrintSection title="Safety Notes and Flags">
          <PrintList title="Safety notes" items={manifest.sections.safetyNotes} />
          <PrintList title="Safety flags" items={manifest.sections.safetyFlags.map((flag) => flag.message)} emptyCopy="No deterministic safety flags were added. Builder review is still required." />
        </PrintSection>

        <PrintSection title="Assumptions and Unresolved Questions">
          <div className="grid gap-5 lg:grid-cols-2">
            <PrintList title="Assumptions" items={manifest.sections.assumptions} />
            <PrintList title="Unresolved questions" items={manifest.sections.unresolvedQuestions} emptyCopy="No unresolved questions listed. Review the full plan before building." />
          </div>
        </PrintSection>

        <PrintSection title="Planning-aid disclaimers">
          <PrintList title="Planning-aid disclaimers" items={manifest.disclaimers} />
          <PrintList title="Future export notes" items={manifest.futureExportNotes} />
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

function PrintBeforeBuild({ manifest }: { manifest: PrintablePlanManifest }) {
  const primaryMaterial = manifest.materials.primaryMaterials.at(0);
  const cutListFact = manifest.cutList
    ? `${manifest.cutList.totalPieces.toString()} rows / ${manifest.cutList.piecesNeedingReview.toString()} need review`
    : "Generate a plan to review";
  const tools = manifest.sections.tools.length > 0 ? manifest.sections.tools : manifest.project.intake.tools;
  const reminders = [
    ...manifest.sections.safetyFlags.map((flag) => flag.message),
    ...manifest.sections.safetyNotes,
    ...manifest.disclaimers,
  ].slice(0, 5);

  return (
    <section className="break-inside-avoid rounded-md border border-sawdust p-5 print:break-inside-avoid">
      <h2 className="text-xl font-semibold tracking-tight text-ink">Before you build</h2>
      <p className="mt-2 text-sm leading-6 text-ink/65">
        Quick facts for checking the plan before you measure, cut, fasten, finish, or mount anything.
      </p>
      <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
        <PrintFact label="Overall dimensions" value={manifest.project.intake.dimensions} />
        <PrintFact label="Main material" value={primaryMaterial ? `${primaryMaterial.label}: ${primaryMaterial.detail}` : manifest.project.intake.material} />
        <PrintFact label="Pieces" value={manifest.buildModel.pieceCount.toString()} />
        <PrintFact label="Cut list" value={cutListFact} />
        <PrintFact label="Primary tools" value={tools.length > 0 ? tools.slice(0, 4).join(", ") : "Review tools before building"} />
        <PrintFact label="Review flags" value={manifest.sections.safetyFlags.length.toString()} />
      </dl>
      <PrintList title="Key safety and review reminders" items={reminders} emptyCopy="Review the full plan before building." />
    </section>
  );
}

function PrintReviewStrip({ manifest }: { manifest: PrintablePlanManifest }) {
  return (
    <section className="grid gap-4 lg:grid-cols-2 print:break-inside-avoid">
      <div className="rounded-md border border-sawdust p-4">
        <h2 className="text-base font-semibold text-ink">Plan Review</h2>
        {manifest.planReview ? (
          <>
            <p className="mt-2 text-sm font-semibold text-ink/75">{planReviewLabel(manifest.planReview.status)}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              {manifest.planReview.blockingIssueCount.toString()} blocking issues, {manifest.planReview.warningCount.toString()} warnings.
            </p>
            <PrintList title="Top review notes" items={manifest.planReview.topMessages} emptyCopy="No blocking issues found." />
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink/65">Generate a plan to see Boardsmith's review checks.</p>
        )}
      </div>

      <div className="rounded-md border border-sawdust p-4">
        <h2 className="text-base font-semibold text-ink">Export Readiness</h2>
        {manifest.exportReadiness ? (
          <>
            <p className="mt-2 text-sm font-semibold text-ink/75">{exportReadinessLabel(manifest.exportReadiness.status)}</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">
              Future export readiness only. No file export, download, CAD, CNC, SVG, DXF, or PDF pipeline is available here.
            </p>
            <PrintList title="Readiness notes" items={manifest.exportReadiness.topMessages} emptyCopy="No blocking export-readiness issues found." />
          </>
        ) : (
          <p className="mt-2 text-sm leading-6 text-ink/65">Generate a plan to see future export-readiness checks.</p>
        )}
      </div>
    </section>
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

function exportReadinessLabel(status: ExportReadinessStatus): string {
  if (status === "not_ready") return "Not ready yet";
  if (status === "needs_review") return "Needs review";
  return "Looks ready for future export polish";
}
