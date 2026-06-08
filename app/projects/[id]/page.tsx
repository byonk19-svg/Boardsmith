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
import { projectTypeLabels, toolLabels, type Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";
import { BuildStepCards } from "./BuildStepCards";
import { GeneratePlanForm } from "./GeneratePlanForm";
import { PlanActionChecklist } from "./PlanActionChecklist";
import { PlanningDiagramsSection } from "./PlanningDiagramsSection";
import { TweakPlanForm } from "./TweakPlanForm";

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/projects" className="text-sm font-medium text-moss hover:underline">
            Back to projects
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{project.title}</h1>
          <p className="mt-2 text-sm text-ink/65">
            {projectTypeLabels[project.project_type]} · {project.skill_level} · {project.status.replaceAll("_", " ")}
            {isProjectArchived(project) ? " · archived" : ""}
          </p>
        </div>
        <div className="no-print flex flex-col gap-2 sm:items-end">
          <GeneratePlanForm action={`/projects/${project.id}/generate`} />
          <form action={`/projects/${project.id}/duplicate`} method="post" className="text-right">
            <button type="submit" className="text-sm font-semibold text-moss hover:underline">
              Duplicate project
            </button>
            <p className="mt-1 text-xs text-ink/55">Copies intake only. Generated plans and history are not copied.</p>
          </form>
          {latestPlanReview ? (
            <div className="text-right">
              <Link href={printPreviewHref} className="text-sm font-semibold text-moss hover:underline">
                Browser print preview
              </Link>
              <p className="mt-1 text-xs text-ink/55">Use your browser's print dialog if you want a paper copy.</p>
            </div>
          ) : null}
          <ArchiveProjectAction project={project} />
        </div>
      </div>

      {isProjectArchived(project) ? <ArchivedProjectBanner project={project} /> : null}
      {isGenerationFailureReason(query.generation_error) ? (
        <GenerationFailurePanel reason={query.generation_error} safetyFlags={project.safety_flags} />
      ) : query.error ? (
        <GenerationFailurePanel reason="generation_failed" safetyFlags={project.safety_flags} />
      ) : null}
      {query.generated ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Generated and saved a new validated plan version.</p> : null}
      {query.duplicated ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Duplicated project intake. Generated plans and history were not copied.
        </p>
      ) : null}
      {query.notes === "updated" ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project notes saved.</p> : null}
      {query.build_log === "updated" ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Build log saved.</p>
      ) : null}
      {query.archived ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project archived. Generated plans and records were preserved.</p> : null}
      {query.restored ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project restored to the active project list.</p> : null}
      {query.revised ? (
        <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
          Revised and saved a new validated plan version. The comparison below shows the new latest plan against the previous version.
        </p>
      ) : null}
      {isRevisionFailureReason(query.revision_error) ? <RevisionFailurePanel reason={query.revision_error} /> : null}

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <ProjectIntakeCard project={project} />
        <div className="rounded-lg border border-sawdust bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Safety review</h2>
          {project.safety_review_required ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.safety_flags.map((flag) => (
                <span key={flag} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/65">No deterministic safety flags were triggered. User review is still required before building.</p>
          )}
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Plans are aids, not professional approvals. Review dimensions, materials, tool safety, fasteners, and mounting details before cutting.
          </p>
        </div>
      </section>

      <TemplateGuidancePanel projectTypeLabel={projectTypeLabels[project.project_type]} assumptions={templateHint.assumptions} cautions={templateHint.cautions} />

      <BuildModelView buildModel={buildModel} source={buildModelSource} materialReview={displayedManifest.materials} cutListReview={displayedManifest.cutList} />

      {latestPlanReview ? (
        <>
          {latestPlanReview.manifest.planReview ? <PlanReviewPanel summary={latestPlanReview.manifest.planReview} /> : null}
          {latestPlanReview.manifest.exportReadiness ? <ExportReadinessPanel summary={latestPlanReview.manifest.exportReadiness} /> : null}
          <TweakPlanSection project={project} hasLatestPlan={Boolean(latestPlanReview)} />
          <PlanComparisonPanel
            comparison={planComparison}
            comparedVersionLabel={comparedPlanReview ? planVersionLabel(planReviews, comparedPlanReview.plan) : null}
            isRevisionComparison={Boolean(query.revised && comparedPlanReview)}
          />
          <PlanView manifest={latestPlanReview.manifest} />
        </>
      ) : (
        <EmptyPlanState />
      )}

      {planReviews.length > 0 ? (
        <section className="no-print rounded-lg border border-sawdust bg-white p-5">
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

      <ProjectRecordSection project={project} />
    </div>
  );
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
            This project is hidden from the default project list, but its details and generated plans are preserved.
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
      <form action={`/projects/${project.id}/restore`} method="post" className="text-right">
        <input type="hidden" name="return_to" value="project_detail" />
        <button type="submit" className="text-sm font-semibold text-moss hover:underline">
          Restore project
        </button>
        <p className="mt-1 text-xs text-ink/55">Returns this project to the active project list.</p>
      </form>
    );
  }

  return (
    <form action={`/projects/${project.id}/archive`} method="post" className="text-right">
      <input type="hidden" name="return_to" value="project_detail" />
      <button type="submit" className="text-sm font-semibold text-moss hover:underline">
        Archive project
      </button>
      <p className="mt-1 text-xs text-ink/55">Hides this project without deleting generated plans.</p>
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
    <section className="no-print rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h2 className="text-lg font-semibold text-ink">Tweak this plan</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            Describe one change. Boardsmith will create a revised plan and keep the current version in history.
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
  return (
    <section className="rounded-lg border border-sawdust bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Project intake</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row
          label="Dimensions"
          value={`${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`}
        />
        <Row label="Material" value={`${project.material_type}, ${project.material_thickness_inches.toString()} in thick`} />
        <Row label="Tools" value={project.tools_available.map((tool) => toolLabels[tool]).join(", ")} />
        <Row label="Intended use" value={project.intended_use} />
        {project.style_notes ? <Row label="Style notes" value={project.style_notes} /> : null}
      </dl>
    </section>
  );
}

function ProjectNotesCard({ project }: { project: Project }) {
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
      {project.notes.trim().length === 0 ? <p className="mt-4 rounded-md bg-shop p-3 text-sm leading-6 text-ink/65">No project notes saved yet.</p> : null}
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
    </section>
  );
}

function ProjectRecordSection({ project }: { project: Project }) {
  return (
    <section className="no-print space-y-4">
      <div>
        <h2 className="text-lg font-semibold text-ink">Project record</h2>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          Private notes and real-build details stay with this project. They do not certify the design or change generated plans.
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <ProjectNotesCard project={project} />
        <BuildLogCard project={project} />
      </div>
    </section>
  );
}

function BuildLogCard({ project }: { project: Project }) {
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

function EmptyPlanState() {
  return (
    <section className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">No generated plan yet</h2>
      <p className="mt-2 text-sm text-ink/65">Generate a plan to see Boardsmith's review checks. Invalid generated JSON will not be saved.</p>
    </section>
  );
}

function GenerationFailurePanel({ reason, safetyFlags }: { reason: GenerationFailureReason; safetyFlags: string[] }) {
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
    </section>
  );
}

function PlanReviewPanel({ summary }: { summary: GeneratedPlanReviewSummary }) {
  return (
    <section className={`rounded-lg border p-5 ${reviewPanelClass(summary.status)}`}>
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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Export Readiness</h2>
          <p className="mt-2 text-sm leading-6 text-ink/70">
            This checks whether the saved plan structure is ready for future printable, SVG, or PDF polish. No export files are generated here.
          </p>
        </div>
        <span className={`w-fit rounded-md px-3 py-1 text-xs font-semibold uppercase tracking-wide ${exportBadgeClass(summary.status)}`}>
          {exportStatusLabel(summary.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <ReviewMetric label="Blocking issues" value={summary.blockingIssueCount.toString()} />
        <ReviewMetric label="Warnings" value={summary.warningCount.toString()} />
        <ReviewMetric label="Future candidates" value={summary.exportCandidates.length > 0 ? summary.exportCandidates.join(", ") : "None"} />
      </div>

      {summary.blockingIssueCount > 0 ? (
        <ReviewMessageGroup title="Not ready yet" messages={summary.blockingIssues.map((issue) => issue.message)} tone="blocked" />
      ) : (
        <p className="mt-4 rounded-md bg-white/70 p-3 text-sm font-medium text-ink">No blocking export-readiness issues found.</p>
      )}

      {summary.warningCount > 0 ? <ReviewMessageGroup title="Needs review" messages={summary.warnings.map((issue) => issue.message)} tone="warning" /> : null}

      {summary.exportReadinessNotes.length > 0 ? <ReviewMessageGroup title="Build-model readiness notes" messages={summary.exportReadinessNotes} tone="info" /> : null}

      <p className="mt-4 text-sm leading-6 text-ink/70">
        Future exports still require human review and safe woodworking judgment. This does not create production-ready CAD, CNC, DXF, SVG, or PDF output.
      </p>
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
    <section className="no-print rounded-lg border border-sawdust bg-white p-5">
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
  return "Looks ready for future export polish";
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
    <section className="rounded-lg border border-sawdust bg-white p-5">
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

        <StructureGroup title="Connections">
          {buildModel.connections.length > 0 ? (
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
              <p className="text-sm text-ink/65">No deterministic BBM safety flags were added. Builder review is still required.</p>
            )}
            {buildModel.unresolvedQuestions.length > 0 ? <List items={buildModel.unresolvedQuestions} /> : null}
          </div>
        </StructureGroup>
      </div>

      <div className="mt-5 rounded-md bg-shop p-4">
        <p className="text-sm font-semibold text-ink">Export readiness</p>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          SVG: {readinessLabel(buildModel.exportReadiness.svgCandidate)} - PDF: {readinessLabel(buildModel.exportReadiness.pdfCandidate)} - DXF:{" "}
          {readinessLabel(buildModel.exportReadiness.dxfCandidate)} - CAD: {readinessLabel(buildModel.exportReadiness.cadCandidate)}
        </p>
        {buildModel.exportReadiness.notes.length > 0 ? <p className="mt-2 text-sm leading-6 text-ink/65">{buildModel.exportReadiness.notes.join(" ")}</p> : null}
      </div>
    </section>
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
      <div className="grid gap-3 sm:grid-cols-3">
        <ReviewMetric label="Total pieces" value={summary.totalPieces.toString()} />
        <ReviewMetric label="With dimensions" value={summary.piecesWithDimensions.toString()} />
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

  return (
    <article className="rounded-lg border border-sawdust bg-white p-6 shadow-soft print:border-0 print:p-0 print:shadow-none">
      <header className="border-b border-sawdust pb-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">Printable Plan Sheet</p>
            <h2 className="mt-2 text-2xl font-semibold tracking-tight text-ink">Latest generated plan</h2>
            <p className="mt-3 leading-7 text-ink/75">A readable planning sheet assembled from the saved generated plan and deterministic review data.</p>
            <p className="mt-3 text-sm font-medium text-caution">Review before building. Use your own judgment before cutting or assembling.</p>
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
          <PlanningDiagramsSection diagrams={manifest.planningDiagrams.diagrams} fallbackMessage={manifest.planningDiagrams.fallbackMessage} />
        </PlanSheetSection>

        <PlanSheetSection title="Materials to verify">
          <MaterialReviewSummaryView summary={manifest.materials} />
          <h4 className="mt-5 text-sm font-semibold text-ink">Modeled pieces</h4>
          <List items={modeledPieces.map((item) => `${item.quantityLabel}x ${item.label}: ${item.dimensionsLabel}`)} />
        </PlanSheetSection>

        <PlanSheetSection title="Cut list to verify">
          <div className="mb-5">
            <CutListReviewSummaryView summary={manifest.cutList} />
          </div>
          {generatedCuts.length > 0 ? (
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
          <List items={[...manifest.sections.safetyNotes, ...manifest.disclaimers]} />
          {manifest.sections.safetyFlags.length > 0 ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {manifest.sections.safetyFlags.map((flag) => (
                <span key={flag.id} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900 print:border print:border-sawdust print:bg-white print:text-ink">
                  {flag.message}
                </span>
              ))}
            </div>
          ) : null}
        </PlanSheetSection>

        <PlanSheetSection title="Assumptions">
          <List items={manifest.sections.assumptions} />
        </PlanSheetSection>

        <PlanSheetSection title="Open questions">
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

        <PlanSheetSection title="Future export notes">
          <List items={manifest.futureExportNotes} />
        </PlanSheetSection>
      </div>
    </article>
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

function PlanSheetSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="py-5 print:break-inside-avoid">
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
