import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { getGenerationFailureFeedback, isGenerationFailureReason, type GenerationFailureReason } from "@/lib/ai/generation-feedback";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { cutListStatusLabel, type CutListReviewSummary } from "@/lib/plans/cut-list-review";
import { type ExportReadinessStatus, type ExportReadinessSummary } from "@/lib/plans/export-readiness";
import { type MaterialReviewItem, type MaterialReviewSummary } from "@/lib/plans/material-summary";
import { createPlanHistoryComparison, type PlanComparisonChange, type PlanHistoryComparison } from "@/lib/plans/plan-comparison";
import { type GeneratedPlanReviewStatus, type GeneratedPlanReviewSummary } from "@/lib/plans/plan-quality";
import { createPrintablePlanManifest, type PrintablePlanManifest } from "@/lib/plans/printable-plan-manifest";
import type { GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import { getProjectDetailErrorMessage } from "@/lib/projects/project-detail-errors";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { formatToolLabel, projectTypeLabels, shelfLayoutLabels, shelfLayoutOptions, type Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { BuildStepCards } from "./BuildStepCards";
import { GeneratePlanForm } from "./GeneratePlanForm";
import { PlanActionChecklist } from "./PlanActionChecklist";
import { PlanningDiagramsSection } from "./PlanningDiagramsSection";
import { TweakPlanForm } from "./TweakPlanForm";
import { WallShelfDiagrams } from "./WallShelfDiagrams";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    error?: string;
    generated?: string;
    generation_error?: string;
    duplicated?: string;
    notes?: string;
    build_log?: string;
    shelf_layout?: string;
    compare_plan?: string;
    archived?: string;
    restored?: string;
    revised?: string;
    revision_error?: string;
  }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProject(id);
  if (!project) notFound();
  const detailErrorMessage = getProjectDetailErrorMessage(query.error);

  const plans = await listGeneratedPlans(project.id);
  const planReviews = plans.map((plan) => buildPlanReview(project, plan));
  const latestPlanReview = planReviews.length > 0 ? (planReviews.find((entry) => entry.plan.is_latest) ?? planReviews[0]) : null;
  const templateHint = getTemplateHint(project.project_type);
  const buildModel = latestPlanReview?.buildModel ?? createBuildModelDraft(project, templateHint, calculateSafetyReviewFlags(project));
  const buildModelSource = latestPlanReview?.buildModelSource ?? "derived";
  const displayedManifest =
    latestPlanReview?.manifest ??
    createPrintablePlanManifest({
      project,
      planRecord: null,
      buildModel,
      buildModelSource,
    });
  const olderPlanReviews = latestPlanReview ? planReviews.filter((entry) => entry.plan.id !== latestPlanReview.plan.id) : [];
  const comparedPlanReview =
    olderPlanReviews.length > 0 ? (olderPlanReviews.find((entry) => entry.plan.id === query.compare_plan) ?? olderPlanReviews[0]) : null;
  const planComparison =
    latestPlanReview && comparedPlanReview
      ? createPlanHistoryComparison({
          latestPlan: latestPlanReview.plan.plan_json,
          comparedPlan: comparedPlanReview.plan.plan_json,
          latestPlanReview: latestPlanReview.manifest.planReview,
          comparedPlanReview: comparedPlanReview.manifest.planReview,
          latestExportReadiness: latestPlanReview.manifest.exportReadiness,
          comparedExportReadiness: comparedPlanReview.manifest.exportReadiness,
        })
      : null;
  const printPreviewHref = `/projects/${project.id}/print` as Route;
  const sectionLinks = createProjectSectionLinks({
    isArchived: isProjectArchived(project),
    hasLatestPlan: Boolean(latestPlanReview),
    hasPlanReview: Boolean(latestPlanReview?.manifest.planReview),
    hasPrintablePlan: Boolean(latestPlanReview?.manifest.generatedPlan && latestPlanReview.manifest.cutList),
    hasPlanHistory: planReviews.length > 0,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/projects" className="no-print text-sm font-medium text-moss hover:underline">
            Back to projects
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{project.title}</h1>
          <p className="mt-2 text-sm text-ink/65">
            {projectTypeLabels[project.project_type]} · {project.skill_level} · {project.status.replaceAll("_", " ")}
            {isProjectArchived(project) ? " · archived" : ""}
          </p>
        </div>
        <ProjectActions project={project} hasLatestPlan={Boolean(latestPlanReview)} printPreviewHref={printPreviewHref} />
      </div>

      {isProjectArchived(project) ? <ArchivedProjectBanner project={project} /> : null}
      {isGenerationFailureReason(query.generation_error) ? (
        <GenerationFailurePanel reason={query.generation_error} safetyFlags={project.safety_flags} project={project} />
      ) : null}
      {detailErrorMessage ? <ProjectDetailErrorPanel message={detailErrorMessage} /> : null}
      {query.generated ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Generated and saved a new plan version for review.</p> : null}
      {query.duplicated ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Duplicated project intake. Generated plans and history were not copied.
        </p>
      ) : null}
      {query.notes === "updated" ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project notes saved.</p> : null}
      {query.build_log === "updated" ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Build log saved.</p>
      ) : null}
      {query.shelf_layout === "updated" ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Shelf layout saved. Generate another plan version when the intake looks right.
        </p>
      ) : null}
      {query.archived ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project archived. Generated plans and records were preserved.</p> : null}
      {query.restored ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project restored to the active project list.</p> : null}
      {query.revised ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Revised and saved a new plan version for review. The comparison below shows the new latest plan against the previous version.
        </p>
      ) : null}
      {isRevisionFailureReason(query.revision_error) ? <RevisionFailurePanel reason={query.revision_error} /> : null}

      <RecommendedNextStep project={project} latestPlanReview={latestPlanReview} planVersionCount={planReviews.length} />

      {latestPlanReview ? (
        <ReviewBeforeBuildingSummary
          manifest={latestPlanReview.manifest}
          planVersionCount={planReviews.length}
          printPreviewHref={printPreviewHref}
          isArchived={isProjectArchived(project)}
        />
      ) : (
        <NoPlanReviewSummary project={project} isArchived={isProjectArchived(project)} />
      )}

      <ProjectSectionsNav links={sectionLinks} />

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <ProjectIntakeCard project={project} />
        <div className="rounded-lg border border-sawdust bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Review triggers</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            These are conservative review triggers, not confirmed hazards. They may appear when safety-sensitive terms are mentioned, even when the
            project says that use is excluded.
          </p>
          {project.safety_review_required ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.safety_flags.map((flag) => (
                <span key={flag} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/65">No deterministic review triggers were added. User review is still required before building.</p>
          )}
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Plans are aids, not professional approvals. Review dimensions, materials, tool safety, fasteners, and mounting details before cutting.
          </p>
        </div>
      </section>

      {latestPlanReview ? (
        <>
          <TemplateGuidancePanel projectTypeLabel={projectTypeLabels[project.project_type]} assumptions={templateHint.assumptions} cautions={templateHint.cautions} />
          <BuildModelView buildModel={buildModel} source={buildModelSource} materialReview={displayedManifest.materials} cutListReview={displayedManifest.cutList} />
          {latestPlanReview.manifest.planReview ? <PlanReviewPanel summary={latestPlanReview.manifest.planReview} /> : null}
          {latestPlanReview.manifest.exportReadiness ? <ExportReadinessPanel summary={latestPlanReview.manifest.exportReadiness} /> : null}
          {!isProjectArchived(project) ? <TweakPlanSection project={project} hasLatestPlan={Boolean(latestPlanReview)} /> : null}
          <PlanComparisonPanel
            comparison={planComparison}
            comparedVersionLabel={comparedPlanReview ? planVersionLabel(planReviews, comparedPlanReview.plan) : null}
            isRevisionComparison={Boolean(query.revised && comparedPlanReview)}
          />
          <PlanView manifest={latestPlanReview.manifest} />
        </>
      ) : (
        <>
          <EmptyPlanState isArchived={isProjectArchived(project)} />
          <NoPlanPlanningDetails
            buildModel={buildModel}
            projectTypeLabel={projectTypeLabels[project.project_type]}
            assumptions={templateHint.assumptions}
            cautions={templateHint.cautions}
          />
        </>
      )}

      {planReviews.length > 0 ? (
        <section id="plan-history" className="no-print scroll-mt-6 rounded-lg border border-sawdust bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Plan history</h2>
          <div className="mt-4 divide-y divide-sawdust">
            {planReviews.map((entry, index) => (
              <div key={entry.plan.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Version {planReviews.length - index}</p>
                  <p className="text-xs text-ink/60">
                    {new Date(entry.plan.created_at).toLocaleString()} - {entry.plan.model_name} - {entry.plan.confidence_level} confidence
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!entry.plan.is_latest && latestPlanReview ? (
                    <Link
                      href={`/projects/${project.id}?compare_plan=${entry.plan.id}` as Route}
                      className="w-fit rounded-md bg-shop px-2.5 py-1 text-xs font-semibold text-ink/70 hover:underline"
                    >
                      Compare
                    </Link>
                  ) : null}
                  {entry.manifest.planReview ? (
                    <span className={`w-fit rounded-md px-2.5 py-1 text-xs font-semibold ${reviewBadgeClass(entry.manifest.planReview.status)}`}>
                      Review: {reviewStatusLabel(entry.manifest.planReview.status)}
                    </span>
                  ) : null}
                  {isRevisedPlan(entry.plan) ? <span className="w-fit rounded-md bg-shop px-2.5 py-1 text-xs font-semibold text-ink/70">Revised</span> : null}
                  {entry.plan.is_latest ? <span className="w-fit rounded-md bg-moss px-2.5 py-1 text-xs font-semibold text-white">Latest</span> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <ProjectRecordSection project={project} isArchived={isProjectArchived(project)} />
    </div>
  );
}

type ProjectSectionLink = {
  label: string;
  href: `#${string}`;
};

function createProjectSectionLinks({
  isArchived,
  hasLatestPlan,
  hasPlanReview,
  hasPrintablePlan,
  hasPlanHistory,
}: {
  isArchived: boolean;
  hasLatestPlan: boolean;
  hasPlanReview: boolean;
  hasPrintablePlan: boolean;
  hasPlanHistory: boolean;
}): ProjectSectionLink[] {
  return [
    { label: "Project intake", href: "#project-intake" },
    ...(hasLatestPlan ? [{ label: "Project structure", href: "#project-structure" } satisfies ProjectSectionLink] : []),
    ...(hasPlanReview ? [{ label: "Plan review", href: "#plan-review" } satisfies ProjectSectionLink] : []),
    ...(hasLatestPlan && !isArchived ? [{ label: "Tweak this plan", href: "#tweak-this-plan" } satisfies ProjectSectionLink] : []),
    ...(hasLatestPlan ? [{ label: "Plan comparison", href: "#plan-comparison" } satisfies ProjectSectionLink] : []),
    ...(hasPrintablePlan ? [{ label: "Print build sheet", href: "#printable-plan-sheet" } satisfies ProjectSectionLink] : []),
    ...(hasPlanHistory ? [{ label: "Plan history", href: "#plan-history" } satisfies ProjectSectionLink] : []),
    { label: "Project record", href: "#project-record" },
  ];
}

function ProjectActions({ project, hasLatestPlan, printPreviewHref }: { project: Project; hasLatestPlan: boolean; printPreviewHref: Route }) {
  if (isProjectArchived(project)) {
    return (
      <aside id="project-actions" className="no-print rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-soft sm:min-w-[18rem]">
        <p className="text-sm font-semibold text-amber-950">Read-only archived project</p>
        <p className="mt-1 text-xs leading-5 text-amber-900">
          This project is archived. Restore it before revising or generating another plan.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
          <form action={`/projects/${project.id}/restore`} method="post" className="inline-flex flex-col">
            <input type="hidden" name="return_to" value="project_detail" />
            <button type="submit" className="w-fit rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
              Restore project
            </button>
            <span className="mt-1 text-xs text-amber-900/75">Restoring re-enables generation and revisions.</span>
          </form>
          {hasLatestPlan ? (
            <Link href={printPreviewHref} className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
              Print build sheet
            </Link>
          ) : null}
        </div>
        {hasLatestPlan ? (
          <p className="mt-3 text-xs leading-5 text-amber-900/75">Existing plans, review notes, history, and browser print remain available for review.</p>
        ) : null}
      </aside>
    );
  }

  return (
    <aside id="project-actions" className="no-print rounded-lg border border-sawdust bg-white p-4 shadow-soft sm:min-w-[18rem]">
      <p className="text-sm font-semibold text-ink">Project actions</p>
      <p className="mt-1 text-xs leading-5 text-ink/55">Plan versions stay in history. Review before cutting or building.</p>
      <div className="mt-4 flex flex-wrap gap-2 sm:justify-end">
        <GeneratePlanForm
          action={`/projects/${project.id}/generate`}
          idleLabel={hasLatestPlan ? "Generate another plan version" : undefined}
          pendingLabel={hasLatestPlan ? "Generating another plan version..." : undefined}
        />
        {hasLatestPlan ? (
          <Link href={printPreviewHref} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            Print build sheet
          </Link>
        ) : null}
      </div>
      {hasLatestPlan ? (
        <p className="mt-3 text-xs leading-5 text-ink/55">This MVP uses browser print only; no PDF or CAD download is generated.</p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2 sm:justify-end">
        <form action={`/projects/${project.id}/duplicate`} method="post" className="inline-flex flex-col">
          <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            Duplicate project
          </button>
          <span className="mt-1 text-xs text-ink/55">Copies intake only.</span>
        </form>
        <ArchiveProjectAction project={project} />
      </div>
    </aside>
  );
}

function ProjectSectionsNav({ links }: { links: ProjectSectionLink[] }) {
  if (links.length === 0) return null;

  const primaryLinks = links.filter((link) => isPrimarySectionLink(link));
  const secondaryLinks = links.filter((link) => !isPrimarySectionLink(link));

  return (
    <nav aria-label="Project sections" className="no-print rounded-lg border border-sawdust bg-white p-4 shadow-soft">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-ink">Project sections</p>
          <p className="mt-1 text-xs leading-5 text-ink/55">Jump to the parts of this private planning record.</p>
        </div>
        <div className="hidden flex-wrap gap-2 sm:flex">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="rounded-md border border-sawdust px-3 py-1.5 text-sm font-semibold text-ink hover:bg-shop">
              {link.label}
            </a>
          ))}
        </div>
        <div className="space-y-2 sm:hidden">
          <div className="flex flex-wrap gap-2">
            {primaryLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-md border border-sawdust px-3 py-1.5 text-sm font-semibold text-ink hover:bg-shop">
                {link.label}
              </a>
            ))}
          </div>
          {secondaryLinks.length > 0 ? (
            <details className="rounded-md border border-sawdust bg-shop/40 p-2">
              <summary className="cursor-pointer text-sm font-semibold text-ink">More sections</summary>
              <div className="mt-2 flex flex-wrap gap-2">
                {secondaryLinks.map((link) => (
                  <a key={link.href} href={link.href} className="rounded-md border border-sawdust bg-white px-3 py-1.5 text-sm font-semibold text-ink hover:bg-shop">
                    {link.label}
                  </a>
                ))}
              </div>
            </details>
          ) : null}
        </div>
      </div>
    </nav>
  );
}

function isPrimarySectionLink(link: ProjectSectionLink): boolean {
  return link.href === "#project-intake" || link.href === "#plan-review" || link.href === "#printable-plan-sheet" || link.href === "#plan-history" || link.href === "#project-record";
}

function buildPlanReview(project: Project, plan: GeneratedProjectPlanRecord) {
  const buildModel = plan.build_model_json ?? createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
  const buildModelSource: "saved" | "derived" = plan.build_model_json ? "saved" : "derived";

  return {
    plan,
    buildModel,
    buildModelSource,
    manifest: createPrintablePlanManifest({
      project,
      planRecord: plan,
      buildModel,
      buildModelSource,
    }),
  };
}

type PlanReviewEntry = ReturnType<typeof buildPlanReview>;

type ReviewSummaryTone = "ok" | "warning" | "blocked" | "info";

type ReviewSummaryItem = {
  label: string;
  value: string;
  detail: string;
  href: `#${string}`;
  tone: ReviewSummaryTone;
};

function ReviewBeforeBuildingSummary({
  manifest,
  planVersionCount,
  printPreviewHref,
  isArchived,
}: {
  manifest: PrintablePlanManifest;
  planVersionCount: number;
  printPreviewHref: Route;
  isArchived: boolean;
}) {
  const items = createReviewSummaryItems(manifest);
  const generatedLabel = planVersionCount > 1 ? `Latest generated plan review, version ${planVersionCount.toString()}` : "Generated plan review checklist";
  const planStatus = manifest.planReview ? reviewStatusLabel(manifest.planReview.status) : "Review needed";

  return (
    <section className="no-print rounded-lg border border-sawdust bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">Review before building</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">{generatedLabel}</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Use this as a shop-readiness checklist after the recommended next step. Check materials, cut-list rows, safety notes, and open
            questions before using the print build sheet.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <span className={`w-fit rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${reviewBadgeClass(manifest.planReview?.status ?? "warnings")}`}>
            Review: {planStatus}
          </span>
          {isArchived ? <span className="w-fit rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">Read only</span> : null}
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {items.map((item) => (
          <a key={item.label} href={item.href} className={`rounded-md border p-3 transition hover:shadow-soft ${reviewSummaryItemClass(item.tone)}`}>
            <span className="text-xs font-semibold uppercase tracking-wide">{item.label}</span>
            <span className="mt-2 block text-base font-semibold">{item.value}</span>
            <span className="mt-1 block text-sm leading-6 opacity-80">{item.detail}</span>
          </a>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <a href="#cut-list-to-verify" className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
          Review cut list
        </a>
        {manifest.sections.unresolvedQuestions.length > 0 ? (
          <a href="#open-questions" className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            Open questions
          </a>
        ) : null}
        <Link href={printPreviewHref} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
          Print build sheet
        </Link>
        {planVersionCount > 1 ? (
          <a href="#plan-comparison" className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            Compare versions
          </a>
        ) : null}
      </div>

      {isArchived ? (
        <p className="mt-3 text-xs leading-5 text-ink/55">This archived project remains review-only. Restore it before generating or revising.</p>
      ) : null}
    </section>
  );
}

function NoPlanReviewSummary({ project, isArchived }: { project: Project; isArchived: boolean }) {
  const triggerCount = project.safety_flags.length;

  return (
    <section className="no-print rounded-lg border border-sawdust bg-white p-5 shadow-soft">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-moss">No generated plan yet</p>
          <h2 className="mt-1 text-xl font-semibold tracking-tight text-ink">Saved intake is ready for review</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            This project does not have a generated plan yet. Review the saved intake and safety triggers first; notes, build log, and planning
            internals can stay secondary until a first plan exists.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          <a href="#project-intake" className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Review intake
          </a>
          <a href="#project-actions" className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            {isArchived ? "Restore actions" : "Generate Plan"}
          </a>
        </div>
      </div>

      <div className="mt-5 grid gap-3 md:grid-cols-3">
        <NoPlanSummaryFact
          label="Intake"
          value={`${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`}
          detail={`${project.material_type}, ${project.material_thickness_inches.toString()} in thick`}
        />
        <NoPlanSummaryFact
          label="Review triggers"
          value={triggerCount > 0 ? `${triggerCount.toString()} ${pluralize("trigger", triggerCount)}` : "No triggers saved"}
          detail={triggerCount > 0 ? "Check each trigger before generating." : "Builder review is still required."}
        />
        <NoPlanSummaryFact
          label="Next action"
          value={isArchived ? "Restore before generation" : "Generate Plan remains primary"}
          detail={isArchived ? "Archived projects are read-only until restored." : "Generation creates the first plan version for review."}
        />
      </div>
    </section>
  );
}

function NoPlanSummaryFact({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-md bg-shop p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-2 text-sm font-semibold text-ink">{value}</p>
      <p className="mt-1 text-sm leading-6 text-ink/65">{detail}</p>
    </div>
  );
}

function NoPlanPlanningDetails({
  buildModel,
  projectTypeLabel,
  assumptions,
  cautions,
}: {
  buildModel: BoardsmithBuildModel;
  projectTypeLabel: string;
  assumptions: string[];
  cautions: string[];
}) {
  const reviewItemCount = buildModel.safety.flags.length + buildModel.unresolvedQuestions.length;

  return (
    <details className="no-print rounded-lg border border-sawdust bg-white p-4 shadow-soft">
      <summary className="cursor-pointer text-sm font-semibold text-ink">
        Planning details before generation
        <span className="ml-2 font-normal text-ink/55">Template and derived structure are secondary until a plan exists.</span>
      </summary>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <NoPlanSummaryFact
          label="Template"
          value={projectTypeLabel}
          detail={`${assumptions.length.toString()} ${pluralize("assumption", assumptions.length)}, ${cautions.length.toString()} ${pluralize("caution", cautions.length)}`}
        />
        <NoPlanSummaryFact
          label="Derived structure"
          value={`${buildModel.pieces.length.toString()} ${pluralize("piece", buildModel.pieces.length)}`}
          detail={`${buildModel.connections.length.toString()} ${pluralize("connection", buildModel.connections.length)}, ${buildModel.operations.length.toString()} ${pluralize("operation", buildModel.operations.length)}`}
        />
        <NoPlanSummaryFact
          label="Review context"
          value={reviewItemCount > 0 ? `${reviewItemCount.toString()} ${pluralize("item", reviewItemCount)}` : "No derived issues"}
          detail={reviewItemCount > 0 ? "Review these before relying on generated output." : "Still review the generated plan before building."}
        />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Template assumptions</h3>
          <List items={assumptions} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Template cautions</h3>
          <List items={cautions} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Derived review flags</h3>
          {buildModel.safety.flags.length > 0 ? (
            <List items={buildModel.safety.flags.map((flag) => flag.message)} />
          ) : (
            <p className="mt-2 text-sm leading-6 text-ink/65">No deterministic build-model review triggers were added. Builder review is still required.</p>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Open questions</h3>
          {buildModel.unresolvedQuestions.length > 0 ? (
            <List items={buildModel.unresolvedQuestions} />
          ) : (
            <p className="mt-2 text-sm leading-6 text-ink/65">No derived open questions yet. Generated plans still need review before building.</p>
          )}
        </div>
      </div>
    </details>
  );
}

function createReviewSummaryItems(manifest: PrintablePlanManifest): ReviewSummaryItem[] {
  const cutList = manifest.cutList;
  const materialGroupCount = manifest.materials.primaryMaterials.length + manifest.materials.hardwareFasteners.length + manifest.materials.finishSupplies.length;
  const materialReviewCount = Math.max(0, manifest.materials.reviewNotes.length - 1);
  const safetyFlagCount = manifest.sections.safetyFlags.length;
  const openQuestionCount = manifest.sections.unresolvedQuestions.length;

  return [
    {
      label: "Cut list check",
      value: cutList ? `${cutList.piecesNeedingReview.toString()} ${pluralize("row", cutList.piecesNeedingReview)} need review` : "No cut list yet",
      detail: cutList ? `${cutList.totalPieces.toString()} physical cut ${pluralize("piece", cutList.totalPieces)} across ${cutList.cutListRows.toString()} cut-list ${pluralize("row", cutList.cutListRows)}.` : "Generate a plan before cutting.",
      href: "#cut-list-to-verify",
      tone: cutList && cutList.piecesNeedingReview > 0 ? "warning" : cutList ? "ok" : "blocked",
    },
    {
      label: "Materials check",
      value: `${materialGroupCount.toString()} groups to verify`,
      detail: materialReviewCount > 0 ? `${materialReviewCount.toString()} material ${pluralize("note", materialReviewCount)} need a look before purchasing.` : "Verify stock, hardware, and finish before cutting.",
      href: "#project-structure",
      tone: materialReviewCount > 0 ? "warning" : "ok",
    },
    {
      label: "Safety notes",
      value: safetyFlagCount > 0 ? `${safetyFlagCount.toString()} review ${pluralize("trigger", safetyFlagCount)}` : "Builder review required",
      detail: manifest.planReview
        ? `${manifest.planReview.warningCount.toString()} ${pluralize("warning", manifest.planReview.warningCount)} and ${manifest.planReview.blockingIssueCount.toString()} blocking ${pluralize("issue", manifest.planReview.blockingIssueCount)} recorded.`
        : "Read the plan notes before building.",
      href: "#plan-review",
      tone: manifest.planReview?.status === "blocked" ? "blocked" : safetyFlagCount > 0 || manifest.planReview?.status === "warnings" ? "warning" : "ok",
    },
    {
      label: "Open questions",
      value: openQuestionCount > 0 ? `${openQuestionCount.toString()} unresolved` : "None listed",
      detail: openQuestionCount > 0 ? "Resolve these before relying on the build sheet." : "Still review assumptions before building.",
      href: openQuestionCount > 0 ? "#open-questions" : "#printable-plan-sheet",
      tone: openQuestionCount > 0 ? "warning" : "ok",
    },
  ];
}

function pluralize(label: string, count: number): string {
  return count === 1 ? label : `${label}s`;
}

function reviewSummaryItemClass(tone: ReviewSummaryTone): string {
  if (tone === "blocked") return "border-red-200 bg-red-50 text-red-950";
  if (tone === "warning") return "border-amber-200 bg-amber-50 text-amber-950";
  if (tone === "ok") return "border-green-200 bg-green-50 text-green-950";
  return "border-sawdust bg-shop text-ink";
}

function RecommendedNextStep({
  project,
  latestPlanReview,
  planVersionCount,
}: {
  project: Project;
  latestPlanReview: PlanReviewEntry | null;
  planVersionCount: number;
}) {
  const isArchived = isProjectArchived(project);
  const unresolvedDimensions = latestPlanReview?.manifest.cutList ? unresolvedCutDimensionItems(latestPlanReview.manifest.cutList) : [];

  if (unresolvedDimensions.length > 0) {
    return (
      <NextStepPanel
        title="Resolve missing cut dimensions"
        body="Resolve missing cut dimensions before cutting or printing this plan. Confirm every missing, unknown, placeholder, or unresolved measurement first."
        links={[{ href: "#cut-list-to-verify", label: "Review cut list" }]}
        tone="warning"
      />
    );
  }

  if (isArchived) {
    return (
      <NextStepPanel
        title="Review only until restored"
        body="This archived project is read-only. Restore remains the only edit-enabling action; existing plans, notes, history, and browser print stay available for review."
        links={[
          ...(latestPlanReview ? [{ href: "#printable-plan-sheet" as const, label: "View latest plan" }] : []),
          ...(planVersionCount > 0 ? [{ href: "#plan-history" as const, label: "Plan history" }] : []),
          { href: "#project-record", label: "Project record" },
        ]}
        tone="archived"
      />
    );
  }

  if (!latestPlanReview) {
    return (
      <NextStepPanel
        title="Review intake, then generate a first plan"
        body="Check the project intake and review triggers, then use Project actions to generate a first plan version for review."
        links={[
          { href: "#project-intake", label: "Review intake" },
          { href: "#project-actions", label: "Project actions" },
        ]}
      />
    );
  }

  return (
    <NextStepPanel
      title={planVersionCount > 1 ? "Review the latest plan version" : "Review the generated plan"}
      body={
        planVersionCount > 1
          ? "The latest version is shown. Older versions remain read-only in plan history for comparison."
          : "Review safety notes, cut list, assumptions, and open questions before using the print build sheet."
      }
      links={[
        { href: "#plan-review", label: "Plan review" },
        { href: "#cut-list-to-verify", label: "Cut list" },
        { href: "#printable-plan-sheet", label: "Print build sheet" },
        ...(planVersionCount > 1 ? [{ href: "#plan-history" as const, label: "Plan history" }] : []),
      ]}
    />
  );
}

function NextStepPanel({
  title,
  body,
  links,
  tone = "default",
}: {
  title: string;
  body: string;
  links: { href: `#${string}`; label: string }[];
  tone?: "default" | "warning" | "archived";
}) {
  const panelClass =
    tone === "warning"
      ? "border-red-200 bg-red-50"
      : tone === "archived"
        ? "border-amber-200 bg-amber-50"
        : "border-sawdust bg-white";
  const titleClass = tone === "warning" ? "text-red-950" : tone === "archived" ? "text-amber-950" : "text-ink";
  const bodyClass = tone === "warning" ? "text-red-900" : tone === "archived" ? "text-amber-900" : "text-ink/70";
  const linkClass =
    tone === "warning"
      ? "border-red-200 bg-white text-red-950 hover:bg-red-100"
      : tone === "archived"
        ? "border-amber-300 bg-white text-amber-950 hover:bg-amber-100"
        : "border-sawdust text-ink hover:bg-shop";

  return (
    <section className={`no-print rounded-lg border p-4 shadow-soft ${panelClass}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl">
          <p className={`text-xs font-semibold uppercase tracking-wide ${bodyClass}`}>Recommended next step</p>
          <h2 className={`mt-1 text-base font-semibold ${titleClass}`}>{title}</h2>
          <p className={`mt-1 text-sm leading-6 ${bodyClass}`}>{body}</p>
        </div>
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {links.map((link) => (
            <a key={link.href} href={link.href} className={`rounded-md border px-3 py-2 text-sm font-semibold ${linkClass}`}>
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

function planVersionLabel(planReviews: ReturnType<typeof buildPlanReview>[], plan: GeneratedProjectPlanRecord): string {
  const index = planReviews.findIndex((entry) => entry.plan.id === plan.id);
  return index >= 0 ? `Version ${(planReviews.length - index).toString()}` : "older version";
}

function isRevisedPlan(plan: GeneratedProjectPlanRecord): boolean {
  return plan.assumptions.some((assumption) => assumption.startsWith("Revision request: "));
}

function ArchivedProjectBanner({ project }: { project: Project }) {
  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-base font-semibold text-amber-950">Archived project</h2>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            This project is hidden from the default project list and is read-only until restored. Existing details, generated plans, history, review notes, and browser print remain available.
          </p>
          <p className="mt-1 text-sm leading-6 text-amber-900">
            Restore it before revising, generating another plan, or making edit-like changes.
          </p>
        </div>
        <form action={`/projects/${project.id}/restore`} method="post" className="no-print">
          <input type="hidden" name="return_to" value="project_detail" />
          <button type="submit" className="rounded-md border border-amber-300 bg-white px-3 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100">
            Restore project
          </button>
        </form>
      </div>
    </section>
  );
}

function ArchiveProjectAction({ project }: { project: Project }) {
  if (isProjectArchived(project)) {
    return (
      <form action={`/projects/${project.id}/restore`} method="post" className="inline-flex flex-col">
        <input type="hidden" name="return_to" value="project_detail" />
        <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
          Restore project
        </button>
        <span className="mt-1 text-xs text-ink/55">Returns this project to the active list.</span>
      </form>
    );
  }

  return (
    <form action={`/projects/${project.id}/archive`} method="post" className="inline-flex flex-col">
      <input type="hidden" name="return_to" value="project_detail" />
      <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
        Archive project
      </button>
      <span className="mt-1 text-xs text-ink/55">Hides without deleting plans.</span>
    </form>
  );
}

function isProjectArchived(project: Project): boolean {
  return typeof project.archived_at === "string" && project.archived_at.length > 0;
}

const revisionFailureReasons = ["empty", "too_long", "no_plan", "archived"] as const;
type RevisionFailureReason = (typeof revisionFailureReasons)[number];

function isRevisionFailureReason(value: string | undefined): value is RevisionFailureReason {
  return revisionFailureReasons.some((reason) => reason === value);
}

function RevisionFailurePanel({ reason }: { reason: RevisionFailureReason }) {
  const copy: Record<RevisionFailureReason, string> = {
    empty: "Describe one change before creating a revised plan.",
    too_long: "Keep the revision note to 500 characters or fewer.",
    no_plan: "Generate a first plan before creating a revised version.",
    archived: "Restore this project before creating a revised plan.",
  };

  return (
    <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-950">
      {copy[reason]} No plan version was changed.
    </p>
  );
}

function TweakPlanSection({ project, hasLatestPlan }: { project: Project; hasLatestPlan: boolean }) {
  if (!hasLatestPlan) return null;

  return (
    <section id="tweak-this-plan" className="no-print scroll-mt-6 rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">Tweak this plan</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Describe one change to the latest plan. Boardsmith saves a new plan version for review; this is a one-shot revision, not a chat thread.
          </p>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            For new dimensions, materials, project type, or mounting changes, update or duplicate the project intake first.
          </p>
        </div>
        <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          New plan version
        </span>
      </div>
      <div className="mt-4">
        {isProjectArchived(project) ? (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-semibold text-amber-950">Restore before revising</p>
            <p className="mt-2 text-sm leading-6 text-amber-900">
              Archived projects stay viewable, but Boardsmith does not create new revised plans until the project is restored.
            </p>
          </div>
        ) : (
          <TweakPlanForm action={`/projects/${project.id}/revise`} />
        )}
      </div>
    </section>
  );
}

function TemplateGuidancePanel({ projectTypeLabel, assumptions, cautions }: { projectTypeLabel: string; assumptions: string[]; cautions: string[] }) {
  return (
    <section className="rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">Template Guidance</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Planning guidance, not a finished plan. Boardsmith uses the {projectTypeLabel.toLowerCase()} template to organize assumptions, cautions, and future review checks.
          </p>
        </div>
        <div className="text-sm leading-6 text-ink/65">
          <p>Project intake is what you entered.</p>
          <p>AI-generated plan output appears after generation.</p>
          <p>Saved review panels check the generated plan.</p>
        </div>
      </div>

      <div className="mt-4 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Template assumptions</h3>
          <List items={assumptions} />
        </div>
        <div>
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">Template cautions</h3>
          <List items={cautions} />
        </div>
      </div>
    </section>
  );
}

function ProjectIntakeCard({ project }: { project: Project }) {
  const dimensionRows = projectIntakeDimensionRows(project);

  return (
    <section id="project-intake" className="scroll-mt-6 rounded-lg border border-sawdust bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Project intake</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row label="Project type" value={projectTypeLabels[project.project_type]} />
        {dimensionRows.map((row) => (
          <Row key={row.label} label={row.label} value={row.value} />
        ))}
        <Row label="Material" value={`${project.material_type}, ${project.material_thickness_inches.toString()} in thick`} />
        <Row label="Tools" value={project.tools_available.map(formatToolLabel).join(", ")} />
        <Row label="Intended use" value={project.intended_use} />
        {project.style_notes ? <Row label="Style notes" value={project.style_notes} /> : null}
      </dl>
    </section>
  );
}

function projectIntakeDimensionRows(project: Project): { label: string; value: string }[] {
  if (project.project_type !== "simple_shelf") {
    return [
      { label: "Overall width", value: `${project.width_inches.toString()} in` },
      { label: "Overall height", value: `${project.height_inches.toString()} in` },
      { label: "Overall depth", value: `${project.depth_inches.toString()} in` },
      { label: "Material thickness", value: `${project.material_thickness_inches.toString()} in` },
    ];
  }

  const shelfIntent = analyzeShelfLayoutIntent(project);
  const totalHeightValue =
    shelfIntent.isMultiShelfIntent || project.height_inches !== project.material_thickness_inches
      ? `${project.height_inches.toString()} in`
      : "Not specified for single shelf";

  return [
    { label: "Shelf width", value: `${project.width_inches.toString()} in` },
    { label: "Total project height", value: totalHeightValue },
    { label: "Shelf depth from wall", value: `${project.depth_inches.toString()} in` },
    { label: "Board thickness", value: `${project.material_thickness_inches.toString()} in` },
    { label: "Shelf layout", value: project.shelf_layout ? shelfLayoutLabels[project.shelf_layout] : shelfIntent.summary },
    ...(project.shelf_count ? [{ label: "Number of shelves", value: project.shelf_count.toString() }] : []),
    ...(project.shelf_spacing_inches ? [{ label: "Shelf spacing", value: `${project.shelf_spacing_inches.toString()} in` }] : []),
  ];
}

function ProjectNotesCard({ project, isArchived }: { project: Project; isArchived: boolean }) {
  return (
    <section className="no-print rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Project notes</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Notes stay with this project and are not used for AI generation or printable plans.
          </p>
        </div>
      </div>
      {project.notes.trim().length === 0 ? (
        <p className="mt-4 rounded-md bg-shop p-3 text-sm leading-6 text-ink/65">No project notes saved yet.</p>
      ) : (
        <p className="mt-4 rounded-md bg-shop p-3 text-sm leading-6 text-ink/75">{project.notes}</p>
      )}
      {isArchived ? (
        <p className="mt-3 text-xs leading-5 text-ink/55">Restore this project before editing notes.</p>
      ) : (
        <form action={`/projects/${project.id}/notes`} method="post" className="mt-4 space-y-3">
          <textarea
            name="notes"
            rows={5}
            maxLength={5000}
            className="input"
            placeholder="Material substitutions, measurement reminders, hardware thoughts, finish choices, or lessons learned..."
            defaultValue={project.notes}
          />
          <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Save notes
          </button>
        </form>
      )}
    </section>
  );
}

function ProjectRecordSection({ project, isArchived }: { project: Project; isArchived: boolean }) {
  return (
    <section id="project-record" className="no-print scroll-mt-6 space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Project record</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Private notes and real-build details stay with this project. They do not certify the design or change generated plans.
        </p>
        {isArchived ? (
          <p className="mt-2 text-sm leading-6 text-ink/65">This archived project record is read-only until restored.</p>
        ) : null}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectNotesCard project={project} isArchived={isArchived} />
        <BuildLogCard project={project} isArchived={isArchived} />
      </div>
    </section>
  );
}

function BuildLogCard({ project, isArchived }: { project: Project; isArchived: boolean }) {
  const hasBuildLogDetails =
    project.build_completed ||
    project.build_completed_at.length > 0 ||
    project.build_actual_material.trim().length > 0 ||
    project.build_plan_changes.trim().length > 0 ||
    project.build_lessons_learned.trim().length > 0;

  return (
    <section className="no-print rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Build log</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">Record what actually happened during the real build.</p>
        </div>
        <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          Build notes
        </span>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md bg-shop p-4">
          <p className="text-sm font-semibold text-ink">{project.build_completed ? "Project was completed" : "Project not marked complete"}</p>
          {hasBuildLogDetails ? (
            <>
              {project.build_completed_at ? <p className="mt-2 text-sm leading-6 text-ink/65">Completed: {project.build_completed_at}</p> : null}
              {project.build_actual_material ? <p className="mt-2 text-sm leading-6 text-ink/65">{project.build_actual_material}</p> : null}
              {project.build_plan_changes ? <p className="mt-2 text-sm leading-6 text-ink/65">{project.build_plan_changes}</p> : null}
              {project.build_lessons_learned ? <p className="mt-2 text-sm leading-6 text-ink/65">{project.build_lessons_learned}</p> : null}
            </>
          ) : (
            <div className="mt-2 space-y-2 text-sm leading-6 text-ink/65">
              <p>Build log has not been filled out yet.</p>
              <p>Add build notes after you cut, assemble, test-fit, or decide not to build.</p>
            </div>
          )}
          <p className="mt-3 text-xs leading-5 text-ink/55">
            This log is not an inspection, certification, load rating, or professional approval.
          </p>
        </div>

        {isArchived ? (
          <div className="rounded-md border border-sawdust p-4">
            <p className="text-sm font-semibold text-ink">Read-only while archived</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">Restore this project before editing the build log.</p>
          </div>
        ) : (
          <form action={`/projects/${project.id}/build-log`} method="post" className="space-y-3">
            <label className="flex items-center gap-2 text-sm font-medium text-ink">
              <input type="checkbox" name="build_completed" defaultChecked={project.build_completed} className="h-4 w-4" />
              Project was completed
            </label>
            <label className="block text-sm font-medium text-ink">
              Completion date
              <input type="date" name="build_completed_at" defaultValue={project.build_completed_at} className="input mt-1" />
            </label>
            <label className="block text-sm font-medium text-ink">
              Material actually used
              <textarea
                name="build_actual_material"
                rows={3}
                maxLength={2000}
                className="input mt-1"
                placeholder="Actual board, plywood, hardware, finish, or substitution notes..."
                defaultValue={project.build_actual_material}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              What changed from the generated plan
              <textarea
                name="build_plan_changes"
                rows={4}
                maxLength={5000}
                className="input mt-1"
                placeholder="Dimension adjustments, hardware changes, skipped steps, added steps, or fit issues..."
                defaultValue={project.build_plan_changes}
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              Lessons learned / next time notes
              <textarea
                name="build_lessons_learned"
                rows={4}
                maxLength={5000}
                className="input mt-1"
                placeholder="What you would measure, cut, sand, finish, or assemble differently next time..."
                defaultValue={project.build_lessons_learned}
              />
            </label>
            <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
              Save build log
            </button>
          </form>
        )}
      </div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-ink/80">{label}</dt>
      <dd className="mt-1 leading-6 text-ink/65">{value}</dd>
    </div>
  );
}

function EmptyPlanState({ isArchived }: { isArchived: boolean }) {
  return (
    <section className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">No generated plan yet</h2>
      {isArchived ? (
        <p className="mt-2 text-sm leading-6 text-ink/65">
          This archived project has no generated plan. Restore it before generating a first plan.
        </p>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Generate a first plan from Project actions. Boardsmith saves plans for review; if review blocks generation, you will see what needs attention.
        </p>
      )}
    </section>
  );
}

function ProjectDetailErrorPanel({ message }: { message: string }) {
  return (
    <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
      <p className="font-semibold">Project update was not saved.</p>
      <p className="mt-1">{message}</p>
    </section>
  );
}

function GenerationFailurePanel({ reason, safetyFlags, project }: { reason: GenerationFailureReason; safetyFlags: string[]; project: Project }) {
  const feedback = getGenerationFailureFeedback(reason, safetyFlags);
  const badgeLabel = reason === "missing_openai_key" ? "Not configured" : "Review blocked";

  return (
    <section className="rounded-lg border border-amber-200 bg-amber-50 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">{feedback.title}</h2>
          <p className="mt-2 text-sm font-semibold text-amber-950">{feedback.summary}</p>
          <p className="mt-2 text-sm leading-6 text-ink/70">{feedback.detail}</p>
        </div>
        <span className="w-fit rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-950">
          {badgeLabel}
        </span>
      </div>
      <div className="mt-4">
        <h3 className="text-sm font-semibold text-ink">Try this before generating again</h3>
        <List items={feedback.suggestions} />
      </div>
      {reason === "shelf_layout_missing" && project.project_type === "simple_shelf" && !isProjectArchived(project) ? (
        <ShelfLayoutRepairForm project={project} />
      ) : null}
    </section>
  );
}

function ShelfLayoutRepairForm({ project }: { project: Project }) {
  const defaultLayout = project.shelf_layout ?? "multi_shelf_unit";

  return (
    <form action={`/projects/${project.id}/shelf-layout`} method="post" className="mt-5 rounded-md border border-amber-200 bg-white p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-sm font-semibold text-ink">Fix shelf layout</h3>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            Save these intake details, then generate another plan version. Existing plan history stays available for review.
          </p>
        </div>
        <span className="w-fit rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-amber-950">
          Required to generate
        </span>
      </div>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Shelf layout</span>
          <select name="shelf_layout" className="input" defaultValue={defaultLayout}>
            {shelfLayoutOptions.map((layout) => (
              <option key={layout} value={layout}>
                {shelfLayoutLabels[layout]}
              </option>
            ))}
          </select>
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Number of shelves</span>
          <input
            name="shelf_count"
            required
            type="number"
            min="1"
            max="20"
            step="1"
            className="input"
            placeholder="Example: 2"
            defaultValue={project.shelf_count?.toString() ?? ""}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Total project height, inches</span>
          <input
            name="height_inches"
            type="number"
            min="0.1"
            max="240"
            step="any"
            className="input"
            placeholder="Example: 60"
            defaultValue={project.height_inches.toString()}
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm font-semibold text-ink">Shelf spacing, inches, optional</span>
          <input
            name="shelf_spacing_inches"
            type="number"
            min="0.1"
            max="120"
            step="any"
            className="input"
            placeholder="Example: 12"
            defaultValue={project.shelf_spacing_inches?.toString() ?? ""}
          />
        </label>
      </div>
      <button type="submit" className="mt-4 rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
        Save shelf layout
      </button>
    </form>
  );
}

function PlanReviewPanel({ summary }: { summary: GeneratedPlanReviewSummary }) {
  return (
    <section id="plan-review" className={`scroll-mt-6 rounded-lg border p-5 ${reviewPanelClass(summary.status)}`}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Plan Review</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            Boardsmith checked this plan for missing dimensions, unsafe confidence, and build-model alignment.
          </p>
        </div>
        <span className={`w-fit rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${reviewBadgeClass(summary.status)}`}>
          {reviewStatusLabel(summary.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReviewMetric label="Blocking issues" value={summary.blockingIssueCount.toString()} />
        <ReviewMetric label="Warnings" value={summary.warningCount.toString()} />
        <ReviewMetric label="Notes" value={summary.infoCount.toString()} />
      </div>

      {summary.blockingIssueCount > 0 ? (
        <ReviewMessageGroup title="Blocking issues" messages={summary.blockingIssues.map((issue) => issue.message)} tone="blocked" />
      ) : (
        <p className="mt-4 rounded-md bg-white/70 p-3 text-sm font-medium text-ink">No blocking issues found.</p>
      )}

      {summary.warningCount > 0 ? <ReviewMessageGroup title="Needs manual review" messages={summary.warnings} tone="warning" /> : null}

      <p className="mt-4 text-sm leading-6 text-ink/70">
        Review before building. Boardsmith cannot verify load capacity or wall safety. This is a planning aid, not a professional engineering review.
      </p>
    </section>
  );
}

function ExportReadinessPanel({ summary }: { summary: ExportReadinessSummary }) {
  return (
    <section className={`rounded-lg border p-5 ${exportPanelClass(summary.status)}`}>
      <details>
        <summary className="cursor-pointer list-none">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-ink">Advanced output notes</h2>
              <p className="mt-2 text-sm leading-6 text-ink/70">
                Secondary notes for possible future output work. This MVP uses browser print only; no PDF or CAD download is generated.
              </p>
            </div>
            <span className={`w-fit rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${exportBadgeClass(summary.status)}`}>
              {exportStatusLabel(summary.status)}
            </span>
          </div>
        </summary>

        <div className="mt-4 border-t border-sawdust pt-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <ReviewMetric label="Blocking issues" value={summary.blockingIssueCount.toString()} />
            <ReviewMetric label="Warnings" value={summary.warningCount.toString()} />
            <ReviewMetric label="Possible later outputs" value={summary.exportCandidates.length > 0 ? summary.exportCandidates.join(", ") : "None"} />
          </div>

          {summary.blockingIssueCount > 0 ? (
            <ReviewMessageGroup title="Not ready yet" messages={summary.blockingIssues.map((issue) => issue.message)} tone="blocked" />
          ) : (
            <p className="mt-4 rounded-md bg-white/70 p-3 text-sm font-medium text-ink">No blocking output-readiness issues found.</p>
          )}

          {summary.warningCount > 0 ? <ReviewMessageGroup title="Needs review" messages={summary.warnings.map((issue) => issue.message)} tone="warning" /> : null}

          {summary.exportReadinessNotes.length > 0 ? <ReviewMessageGroup title="Advanced output notes" messages={summary.exportReadinessNotes} tone="info" /> : null}

          <p className="mt-4 text-sm leading-6 text-ink/70">
            Future output work still requires human review and safe woodworking judgment. This panel does not create export files or production-ready CAD, CNC, DXF, SVG, or PDF output.
          </p>
        </div>
      </details>
    </section>
  );
}

function PlanComparisonPanel({
  comparison,
  comparedVersionLabel,
  isRevisionComparison,
}: {
  comparison: PlanHistoryComparison | null;
  comparedVersionLabel: string | null;
  isRevisionComparison: boolean;
}) {
  return (
    <section id="plan-comparison" className="no-print scroll-mt-6 rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Plan comparison</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {comparison && comparedVersionLabel && isRevisionComparison
              ? `Comparing the revised latest plan with the previous version (${comparedVersionLabel}).`
              : comparison && comparedVersionLabel
                ? `Comparing latest plan with ${comparedVersionLabel}.`
                : "Comparison will be available after another generated plan version exists."}
          </p>
        </div>
        <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          Read-only
        </span>
      </div>

      {comparison ? (
        <>
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Boardsmith summarizes practical changes only. Review both versions before building; neither plan is professionally validated or fabrication-approved.
          </p>
          <div className="mt-4 grid gap-5 lg:grid-cols-2">
            <ComparisonGroup title="Summary changes" messages={comparison.summaryChanges} />
            <ComparisonChangeGroup title="Material changes" changes={comparison.materialChanges} />
            <ComparisonChangeGroup title="Cut list changes" changes={comparison.cutListChanges} />
            <ComparisonChangeGroup title="Step changes" changes={comparison.stepChanges} />
            <ComparisonChangeGroup title="Review differences" changes={comparison.reviewChanges} />
          </div>
        </>
      ) : null}
    </section>
  );
}

function ComparisonGroup({ title, messages }: { title: string; messages: string[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">{title}</h3>
      <List items={messages} />
    </div>
  );
}

function ComparisonChangeGroup({ title, changes }: { title: string; changes: PlanComparisonChange[] }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">{title}</h3>
      {changes.length > 0 ? (
        <ul className="mt-2 space-y-2">
          {changes.slice(0, 5).map((change) => (
            <li key={`${change.kind}:${change.label}:${change.detail}`} className="text-sm leading-6 text-ink/75">
              <span className="font-semibold text-ink">{comparisonKindLabel(change.kind)} {change.label}</span>
              <span className="text-ink/65"> - {change.detail}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink/65">No practical changes found in this section.</p>
      )}
    </div>
  );
}

function comparisonKindLabel(kind: PlanComparisonChange["kind"]): string {
  if (kind === "added") return "Added";
  if (kind === "removed") return "Removed";
  if (kind === "review_difference") return "Review difference";
  return "Changed";
}

function ReviewMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-white/75 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-ink">{value}</p>
    </div>
  );
}

function ReviewMessageGroup({ title, messages, tone }: { title: string; messages: string[]; tone: "blocked" | "warning" | "info" }) {
  const shownMessages = messages.slice(0, 4);
  const titleClass = tone === "blocked" ? "text-red-900" : tone === "warning" ? "text-amber-950" : "text-ink";

  return (
    <div className="mt-4">
      <h3 className={`text-sm font-semibold ${titleClass}`}>{title}</h3>
      <ul className="mt-2 space-y-2">
        {shownMessages.map((message) => (
          <li key={message} className="text-sm leading-6 text-ink/75">
            {message}
          </li>
        ))}
      </ul>
    </div>
  );
}

function exportStatusLabel(status: ExportReadinessStatus): string {
  if (status === "not_ready") return "Not ready yet";
  if (status === "needs_review") return "Needs review";
  return "Looks ready for output checks";
}

function exportPanelClass(status: ExportReadinessStatus): string {
  if (status === "not_ready") return "border-red-200 bg-red-50";
  if (status === "needs_review") return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
}

function exportBadgeClass(status: ExportReadinessStatus): string {
  if (status === "not_ready") return "bg-red-100 text-red-900";
  if (status === "needs_review") return "bg-amber-100 text-amber-950";
  return "bg-emerald-100 text-emerald-900";
}

function reviewStatusLabel(status: GeneratedPlanReviewStatus): string {
  if (status === "blocked") return "Blocked";
  if (status === "warnings") return "Warnings";
  return "Passed";
}

function reviewPanelClass(status: GeneratedPlanReviewStatus): string {
  if (status === "blocked") return "border-red-200 bg-red-50";
  if (status === "warnings") return "border-amber-200 bg-amber-50";
  return "border-emerald-200 bg-emerald-50";
}

function reviewBadgeClass(status: GeneratedPlanReviewStatus): string {
  if (status === "blocked") return "bg-red-100 text-red-900";
  if (status === "warnings") return "bg-amber-100 text-amber-950";
  return "bg-emerald-100 text-emerald-900";
}

function BuildModelView({
  buildModel,
  source,
  materialReview,
  cutListReview,
}: {
  buildModel: BoardsmithBuildModel;
  source: "saved" | "derived";
  materialReview: MaterialReviewSummary;
  cutListReview: CutListReviewSummary | null;
}) {
  return (
    <section id="project-structure" className="scroll-mt-6 rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Project Structure</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {source === "saved" ? "A deterministic planning model saved with the latest generated plan." : "A deterministic planning model derived from the project intake."} It is not CAD and does not verify safety, mounting, or load capacity.
          </p>
        </div>
        <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          {buildModel.confidence.level} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StructureGroup title="Pieces">
          <div className="space-y-3">
            {buildModel.pieces.map((piece) => (
              <div key={piece.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">{piece.label}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {piece.quantity.toString()}x {piece.pieceType.replaceAll("_", " ")} - {formatBuildModelDimensions(piece.dimensions)}
                </p>
                {piece.notes.length > 0 ? <p className="mt-1 text-sm leading-6 text-ink/65">{piece.notes[0]}</p> : null}
              </div>
            ))}
          </div>
        </StructureGroup>

        <StructureGroup title="Material Summary">
          <MaterialReviewSummaryView summary={materialReview} compact />
        </StructureGroup>

        {cutListReview ? (
          <StructureGroup title="Cut List Review">
            <CutListReviewSummaryView summary={cutListReview} compact showTitle={false} />
          </StructureGroup>
        ) : null}

        <StructureGroup title={buildModel.project.projectType === "simple_shelf" && buildModel.connections.length > 0 ? "Mounting to verify" : "Connections"}>
          {buildModel.project.projectType === "simple_shelf" && buildModel.connections.length > 0 ? (
            <WallShelfMountingChecklist />
          ) : buildModel.connections.length > 0 ? (
            <ul className="space-y-3">
              {buildModel.connections.map((connection) => (
                <li key={connection.id} className="text-sm leading-6 text-ink/70">
                  <strong className="text-ink">{connection.connectionType.replaceAll("_", " ")}</strong>: {connection.locationDescription}
                  {connection.strengthCritical ? <span className="font-medium text-caution"> - needs review</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/65">No obvious physical connections were added yet.</p>
          )}
        </StructureGroup>

        <StructureGroup title="Operations">
          {buildModel.operations.length > 0 ? (
            <ol className="space-y-3">
              {buildModel.operations.map((operation) => (
                <li key={operation.id} className="text-sm leading-6 text-ink/70">
                  <strong className="text-ink">
                    {operation.sequenceNumber.toString()}. {operation.title}
                  </strong>
                  : {operation.description}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink/65">No operations were added yet.</p>
          )}
        </StructureGroup>

        <StructureGroup title="Needs Review">
          <div className="space-y-3">
            {buildModel.safety.flags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {buildModel.safety.flags.map((flag) => (
                  <span key={flag.id} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    {flag.message}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/65">No deterministic build-model review triggers were added. Builder review is still required.</p>
            )}
            {buildModel.unresolvedQuestions.length > 0 ? <List items={buildModel.unresolvedQuestions} /> : null}
          </div>
        </StructureGroup>
      </div>

      <details className="mt-5 rounded-md bg-shop p-4">
        <summary className="cursor-pointer text-sm font-semibold text-ink">Advanced output notes</summary>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          This MVP uses browser print only; no PDF or CAD download is generated. Later output check: SVG{" "}
          {readinessLabel(buildModel.exportReadiness.svgCandidate)}, PDF {readinessLabel(buildModel.exportReadiness.pdfCandidate)}, DXF{" "}
          {readinessLabel(buildModel.exportReadiness.dxfCandidate)}, CAD {readinessLabel(buildModel.exportReadiness.cadCandidate)}.
        </p>
        {buildModel.exportReadiness.notes.length > 0 ? <p className="mt-2 text-sm leading-6 text-ink/65">{buildModel.exportReadiness.notes.join(" ")}</p> : null}
      </details>
    </section>
  );
}

function WallShelfMountingChecklist() {
  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4">
      <p className="text-sm font-semibold text-amber-950">Each shelf needs a verified support method.</p>
      <ul className="mt-2 space-y-2 text-sm leading-6 text-amber-900">
        <li>Confirm bracket, cleat, side-support, or frame type.</li>
        <li>Confirm wall studs or anchors appropriate for the wall type.</li>
        <li>Confirm hardware and load suitability before mounting.</li>
      </ul>
    </div>
  );
}

function StructureGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatBuildModelDimensions(dimensions: BoardsmithBuildModel["pieces"][number]["dimensions"]): string {
  const length = dimensions.lengthInches ? `${dimensions.lengthInches.toString()} in` : "length unknown";
  const width = dimensions.widthInches ? `${dimensions.widthInches.toString()} in` : "width unknown";
  const thickness = dimensions.thicknessInches ? `${dimensions.thicknessInches.toString()} in` : "thickness unknown";
  return `${length} x ${width} x ${thickness}`;
}

function readinessLabel(isCandidate: boolean): string {
  return isCandidate ? "candidate later" : "not enough information";
}

function MaterialReviewSummaryView({ summary, compact = false }: { summary: MaterialReviewSummary; compact?: boolean }) {
  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      <MaterialReviewGroup
        title="Primary materials"
        items={summary.primaryMaterials}
        emptyCopy="No primary material is modeled yet. Review project intake before relying on this plan."
      />
      <MaterialReviewGroup
        title="Hardware / fasteners"
        items={summary.hardwareFasteners}
        emptyCopy="No hardware or fastener placeholders are modeled yet."
      />
      <MaterialReviewGroup
        title="Finish / optional supplies"
        items={summary.finishSupplies}
        emptyCopy="No finish or optional supply notes are listed yet."
      />
      <div>
        <h4 className="text-sm font-semibold text-ink">Material assumptions and review notes</h4>
        <List items={summary.reviewNotes} />
      </div>
    </div>
  );
}

function MaterialReviewGroup({ title, items, emptyCopy }: { title: string; items: MaterialReviewItem[]; emptyCopy: string }) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-ink">{title}</h4>
      {items.length > 0 ? (
        <div className="mt-2 space-y-3">
          {items.map((item) => (
            <div key={item.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
              <p className="text-sm font-semibold text-ink">{item.label}</p>
              <p className="mt-1 text-xs text-ink/55">{item.detail}</p>
              {item.notes.length > 0 ? <p className="mt-1 text-sm leading-6 text-ink/65">{item.notes.join(" ")}</p> : null}
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-2 text-sm leading-6 text-ink/65">{emptyCopy}</p>
      )}
    </div>
  );
}

function CutListReviewSummaryView({
  summary,
  compact = false,
  showTitle = true,
}: {
  summary: CutListReviewSummary;
  compact?: boolean;
  showTitle?: boolean;
}) {
  return (
    <div className={compact ? "space-y-4" : "space-y-5"}>
      {showTitle ? <h4 className="text-sm font-semibold text-ink">Cut List Review</h4> : null}
      <div className="grid gap-3 sm:grid-cols-4">
        <ReviewMetric label="Total cut pieces" value={summary.totalPieces.toString()} />
        <ReviewMetric label="Cut-list rows" value={summary.cutListRows.toString()} />
        <ReviewMetric label="Pieces with dimensions" value={summary.piecesWithDimensions.toString()} />
        <ReviewMetric label="Needs review" value={summary.piecesNeedingReview.toString()} />
      </div>

      {summary.warnings.length > 0 ? <ReviewMessageGroup title="Cut-list warnings" messages={summary.warnings} tone="warning" /> : null}

      <div>
        <h5 className="text-sm font-semibold text-ink">Piece checks</h5>
        <div className="mt-2 space-y-3">
          {summary.items.map((item) => (
            <div key={item.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {item.sourceLabel} - {item.quantityLabel}x - {item.dimensionsLabel} - {item.materialLabel}
                  </p>
                </div>
                <span className="w-fit rounded-md bg-shop px-2.5 py-1 text-xs font-semibold text-ink/70">{cutListStatusLabel(item.status)}</span>
              </div>
              {item.messages.length > 0 ? <p className="mt-2 text-sm leading-6 text-ink/65">{item.messages.join(" ")}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div>
        <h5 className="text-sm font-semibold text-ink">Cutting reminders</h5>
        <List items={summary.reviewNotes} />
      </div>
    </div>
  );
}

function PlanView({
  manifest,
}: {
  manifest: PrintablePlanManifest;
}) {
  const generatedPlan = manifest.generatedPlan;
  if (!generatedPlan || !manifest.cutList) return null;
  const modeledPieces = manifest.cutList.items.filter((item) => item.sourceLabel === "Modeled piece");
  const generatedCuts = manifest.cutList.items.filter((item) => item.sourceLabel === "Generated cut");
  const unresolvedDimensionItems = unresolvedCutDimensionItems(manifest.cutList);

  return (
    <article id="printable-plan-sheet" className="scroll-mt-6 rounded-lg border border-sawdust bg-white p-6 shadow-soft print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-sawdust pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Print build sheet</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Latest generated plan</h2>
            <p className="mt-3 leading-7 text-ink/75">A readable planning sheet assembled from the saved generated plan and deterministic review data.</p>
            <p className="mt-3 text-sm font-medium text-caution">Review before building. Use your own judgment before cutting or assembling.</p>
            <p className="mt-2 text-sm leading-6 text-ink/65">This MVP uses browser print only; no PDF or CAD download is generated.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">Planning aid</span>
            <span className="w-fit rounded-md bg-moss/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-moss">{generatedPlan.estimatedDifficulty}</span>
          </div>
        </div>

        <h3 className="mt-5 text-sm font-semibold uppercase tracking-wide text-ink/55">Plan at a glance</h3>
        <dl className="mt-5 grid gap-3 text-sm sm:grid-cols-4">
          <PlanFact label="Time" value={generatedPlan.estimatedTime} />
          <PlanFact label="Difficulty" value={generatedPlan.estimatedDifficulty} />
          <PlanFact label="Confidence" value={`${generatedPlan.confidenceLevel} plan / ${manifest.buildModel.confidenceLevel} model`} />
          <PlanFact label="Generated" value={`${new Date(generatedPlan.createdAt).toLocaleDateString()} - ${generatedPlan.modelName}`} />
        </dl>
      </header>

      {unresolvedDimensionItems.length > 0 ? <UnresolvedCutDimensionsWarning items={unresolvedDimensionItems} /> : null}

      <div className="divide-y divide-sawdust">
        <PlanSheetSection title="Overview / Summary">
          {manifest.sections.projectSummary ? (
            <p className="text-sm leading-7 text-ink/75">{manifest.sections.projectSummary}</p>
          ) : (
            <p className="text-sm leading-7 text-ink/65">No project summary was saved with this generated plan.</p>
          )}
          <div className="mt-4 rounded-md border border-amber-200 bg-amber-50 p-4 print:border-sawdust print:bg-white">
            <p className="text-sm font-semibold text-ink">Planning aid only</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Boardsmith cannot verify engineering, load capacity, wall safety, child safety, material condition, or tool setup.
            </p>
          </div>
        </PlanSheetSection>

        <PlanSheetSection title="Check these before building">
          <PlanActionChecklist items={manifest.actionChecklist} />
        </PlanSheetSection>

        <PlanSheetSection title="Planning diagrams">
          {manifest.wallShelfDiagram ? (
            <WallShelfDiagrams model={manifest.wallShelfDiagram} compact />
          ) : (
            <PlanningDiagramsSection diagrams={manifest.planningDiagrams.diagrams} fallbackMessage={manifest.planningDiagrams.fallbackMessage} />
          )}
        </PlanSheetSection>

        <PlanSheetSection title="Materials to verify">
          <MaterialReviewSummaryView summary={manifest.materials} />
          <h4 className="mt-5 text-sm font-semibold text-ink">Modeled pieces</h4>
          <List items={modeledPieces.map((item) => `${item.quantityLabel}x ${item.label}: ${item.dimensionsLabel}`)} />
        </PlanSheetSection>

        <PlanSheetSection id="cut-list-to-verify" title="Cut list to verify">
          <div className="mb-5">
            <CutListReviewSummaryView summary={manifest.cutList} />
          </div>
          {generatedCuts.length > 0 ? (
            <>
              <p className="mb-2 text-xs text-ink/55 sm:hidden">Scroll sideways to review all cut-list columns.</p>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-sawdust text-xs uppercase tracking-wide text-ink/55">
                      <th className="py-2 pr-3">Part</th>
                      <th className="py-2 pr-3">Qty</th>
                      <th className="py-2 pr-3">Dimensions</th>
                      <th className="py-2 pr-3">Material</th>
                      <th className="py-2">Review notes</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sawdust">
                    {generatedCuts.map((item) => (
                      <tr key={item.id}>
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
            </>
          ) : (
            <p className="text-sm leading-6 text-ink/65">No generated cut rows were saved. Review the modeled pieces above before cutting.</p>
          )}
        </PlanSheetSection>

        <PlanSheetSection title="Build steps">
          <BuildStepCards cards={manifest.buildStepCards} />
        </PlanSheetSection>

        <PlanSheetSection title="Modeled operations">
          <List items={manifest.sections.modeledOperations.map((operation) => `${operation.sequenceNumber.toString()}. ${operation.title}: ${operation.description}`)} />
          <h4 className="mt-5 text-sm font-semibold text-ink">Tools</h4>
          <List items={manifest.sections.tools} />
        </PlanSheetSection>

        <PlanSheetSection title="Safety notes">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 print:border-sawdust print:bg-white">
            <p className="text-sm font-semibold text-ink">Review before building</p>
            <p className="mt-2 text-sm leading-6 text-ink/70">
              Planning aid only. Boardsmith cannot verify load capacity, wall safety, material condition, or tool setup.
            </p>
          </div>
          <List items={manifest.sections.safetyNotes} />
          {manifest.sections.safetyFlags.length > 0 ? (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-ink">Review triggers</h4>
              <p className="mt-2 text-sm leading-6 text-ink/65">
                These are conservative review triggers, not confirmed hazards. Safety-sensitive wording can trigger review even when the project
                excludes that use.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {manifest.sections.safetyFlags.map((flag) => (
                  <span key={flag.id} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 print:border print:border-sawdust print:bg-white print:text-ink">
                    {flag.message}
                  </span>
                ))}
              </div>
            </div>
          ) : null}
        </PlanSheetSection>

        <PlanSheetSection title="Assumptions">
          <List items={manifest.sections.assumptions} />
        </PlanSheetSection>

        <PlanSheetSection id="open-questions" title="Open questions">
          {manifest.sections.unresolvedQuestions.length > 0 ? (
            <List items={manifest.sections.unresolvedQuestions} />
          ) : (
            <p className="text-sm leading-6 text-ink/65">No unresolved questions listed. Review the full plan before building.</p>
          )}
        </PlanSheetSection>

        <PlanSheetSection title="Finishing notes">
          <List items={manifest.sections.finishingSteps} />
        </PlanSheetSection>

        <PlanSheetSection title="Beginner tips">
          <List items={manifest.sections.beginnerTips} />
        </PlanSheetSection>

      </div>
    </article>
  );
}

type UnresolvedCutDimensionItem = Pick<CutListReviewSummary["items"][number], "id" | "label" | "dimensionsLabel" | "messages">;

function unresolvedCutDimensionItems(summary: CutListReviewSummary): UnresolvedCutDimensionItem[] {
  return summary.items.filter((item) => {
    const reviewText = `${item.dimensionsLabel} ${item.messages.join(" ")}`.toLowerCase();
    return item.status === "needs_measurement" || /\b(missing|unknown|unresolved|placeholder)\b/.test(reviewText);
  });
}

function UnresolvedCutDimensionsWarning({ items }: { items: UnresolvedCutDimensionItem[] }) {
  const shownItems = items.slice(0, 4);

  return (
    <section className="border-b border-sawdust py-5">
      <div className="rounded-md border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-semibold text-red-950">Resolve missing dimensions before cutting</p>
        <p className="mt-2 text-sm leading-6 text-red-900">
          Do not cut this piece until dimensions are resolved. Review the cut list and confirm every missing, unknown, placeholder, or unresolved
          measurement before using the plan in the shop.
        </p>
        <ul className="mt-3 space-y-2">
          {shownItems.map((item) => (
            <li key={item.id} className="text-sm leading-6 text-red-900">
              <span className="font-semibold">{item.label}</span>: {item.dimensionsLabel}
            </li>
          ))}
        </ul>
        <a href="#cut-list-to-verify" className="mt-3 inline-flex text-sm font-semibold text-red-950 underline">
          Jump to cut list review
        </a>
      </div>
    </section>
  );
}

function PlanFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-shop p-3 print:border print:border-sawdust print:bg-white">
      <dt className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</dt>
      <dd className="mt-1 text-sm font-medium text-ink">{value}</dd>
    </div>
  );
}

function PlanSheetSection({ title, children, id }: { title: string; children: React.ReactNode; id?: string }) {
  return (
    <section id={id} className="py-5 print:break-inside-avoid">
      <h3 className="text-base font-semibold text-ink">{title}</h3>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="mt-2 space-y-2">
      {items.map((item) => (
        <li key={item} className="text-sm leading-6 text-ink/75">
          {item}
        </li>
      ))}
    </ul>
  );
}
