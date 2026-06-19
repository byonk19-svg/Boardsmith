import Link from "next/link";
import type { ReactNode } from "react";
import { projectIntakeExamples } from "@/lib/projects/intake-examples";
import { isProjectArchived } from "@/lib/projects/project-planning-lifecycle";
import { projectTypeLabels, type Project } from "@/lib/projects/types";
import { listGeneratedPlans, listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

type ProjectSummary = {
  project: Project;
  planCount: number;
};

export default async function DashboardPage() {
  const projects = (await listProjects()).filter((project) => !isProjectArchived(project));
  const projectSummaries = sortProjectSummaries(
    await Promise.all(
      projects.map(async (project) => ({
        project,
        planCount: (await listGeneratedPlans(project.id)).length,
      })),
    ),
  );

  const latestProjectSummary = projectSummaries.length > 0 ? projectSummaries[0] : undefined;
  const projectsWithPlans = projectSummaries.filter((summary) => summary.planCount > 0).length;
  const projectsNeedingPlans = projectSummaries.length - projectsWithPlans;
  const nextProjectNeedingPlan = projectSummaries.find((summary) => summary.planCount === 0);
  const nextProjectWithPlan = projectSummaries.find((summary) => summary.planCount > 0);
  const recentProjects = projectSummaries.slice(0, 4);
  const starterExamples = projectIntakeExamples.slice(0, 3);

  return (
    <div className="dashboard-canvas -mx-5 -my-8 px-5 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="hidden self-start rounded-lg border border-sawdust/80 bg-[#f0ede6]/90 p-4 shadow-soft lg:sticky lg:top-6 lg:block">
          <div className="border-b border-sawdust pb-5">
            <p className="font-serif text-3xl font-semibold tracking-tight text-moss">Boardsmith</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Digital craftsmanship</p>
          </div>
          <nav className="mt-5 space-y-1 text-sm font-semibold" aria-label="Dashboard shortcuts">
            <Link href="/" className="block rounded-md bg-moss px-3 py-2 text-white">
              Dashboard
            </Link>
            <Link href="/projects" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
              My projects
            </Link>
            <Link href="/projects/new" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
              New project
            </Link>
            <Link href="/settings" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
              Settings
            </Link>
          </nav>
          <Link href="/projects/new" className="mt-6 block rounded-md bg-moss px-4 py-3 text-center text-sm font-semibold text-white transition hover:bg-moss/90 active:scale-[0.99]">
            New Project
          </Link>
          <p className="mt-4 text-xs leading-5 text-ink/55">Private MVP workspace. Generated plans stay review aids until a builder verifies dimensions, materials, and site conditions.</p>
        </aside>

        <div className="min-w-0 space-y-6">
          <section className="min-w-0 overflow-hidden rounded-lg border border-sawdust bg-[#fbf8f1] shadow-soft">
            <div className="grid min-w-0 gap-0 lg:grid-cols-[minmax(0,1fr)_24rem]">
              <div className="min-w-0 p-6 sm:p-8">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-caution">Private workspace</p>
                <h1 className="mt-3 max-w-full font-serif text-4xl font-semibold leading-[1.03] tracking-tight text-ink sm:max-w-3xl sm:text-5xl">Welcome back, Maker</h1>
                <p className="mt-4 max-w-full text-sm leading-6 text-ink/70 sm:max-w-2xl">
                  Private Boardsmith workspace for recent plans, draft intakes, and cautious shop sheets. Verify dimensions, materials, fasteners, and tool safety before cutting or building.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90 active:scale-[0.99]">
                    New Project
                  </Link>
                  <Link href="/projects" className="rounded-md border border-sawdust bg-white/70 px-4 py-2 text-sm font-semibold text-ink transition hover:bg-white">
                    View Projects
                  </Link>
                </div>
                <form action="/projects/draft" method="post" className="mt-6 max-w-2xl rounded-md border border-sawdust bg-white/70 p-4">
                  <label className="block space-y-2">
                    <span className="text-sm font-semibold text-ink">Start with an idea</span>
                    <textarea
                      name="idea_text"
                      rows={3}
                      minLength={8}
                      maxLength={2000}
                      className="input"
                      placeholder="Example: Bathroom wall shelf, 24 x 8 x 6 inches, pine board, drill available."
                    />
                  </label>
                  <button type="submit" className="mt-3 rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90">
                    Draft setup fields
                  </button>
                </form>
              </div>
              <div className="min-w-0 border-t border-sawdust bg-[#f0ede6]/80 p-5 lg:border-l lg:border-t-0">
                <div className="grid h-full min-w-0 gap-3 sm:grid-cols-2">
                  <Metric label="Total projects" value={projectSummaries.length.toString()} tone="primary" />
                  <Metric label="Generated plans" value={projectsWithPlans.toString()} tone="accent" />
                  <Metric label="Active drafts" value={projectsNeedingPlans.toString()} tone="neutral" />
                  <Metric label="Latest update" value={latestProjectSummary ? formatProjectDate(latestProjectSummary.project.updated_at) : "None yet"} tone="neutral" compact />
                </div>
              </div>
            </div>
          </section>

          {projectSummaries.length === 0 ? (
            <section className="grid gap-5 rounded-lg border border-dashed border-sawdust bg-white/85 p-6 shadow-soft lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <div>
                <p className="font-serif text-2xl font-semibold text-ink">No projects yet.</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">Create a project intake, then generate a plan from the project detail page. Boardsmith will keep missing information visible before any build sheet becomes useful.</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                    Start first project
                  </Link>
                  <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
                    View Projects
                  </Link>
                </div>
              </div>
              <ProjectWorkshopPreview label="starter workbench preview" />
            </section>
          ) : (
            <>
              <section className="grid min-w-0 gap-3 md:grid-cols-2">
                <DashboardQueueCard
                  eyebrow="Needs a generated plan"
                  summary={nextProjectNeedingPlan}
                  emptyCopy="No active drafts are waiting for generation."
                  actionLabel="Open to generate"
                />
                <DashboardQueueCard
                  eyebrow="Ready to review or print"
                  summary={nextProjectWithPlan}
                  emptyCopy="No active generated plans are ready yet."
                  actionLabel="Open project"
                />
              </section>

              <section>
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">Recent projects</h2>
                    <p className="mt-1 text-sm text-ink/65">Most recently updated first. Archived projects are hidden from this dashboard.</p>
                  </div>
                  <Link href="/projects" className="text-sm font-semibold text-moss hover:text-moss/80">
                    Browse all projects
                  </Link>
                </div>

                <div className="mt-4 grid gap-4 xl:grid-cols-2">
                  {recentProjects.map((summary) => (
                    <ProjectShortcut key={summary.project.id} summary={summary} />
                  ))}
                </div>
              </section>
            </>
          )}

          <section className="rounded-lg border border-sawdust bg-white/85 p-5 shadow-soft">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-serif text-3xl font-semibold tracking-tight text-ink">Try a starter</h2>
                <p className="mt-1 text-sm text-ink/65">Load editable example details for a small, reviewable first pass.</p>
              </div>
              <Link href="/projects/new" className="text-sm font-semibold text-moss hover:text-moss/80">
                New Project
              </Link>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-3">
              {starterExamples.map((example) => (
                <Link key={example.slug} href={`/projects/new?example=${example.slug}`} className="group rounded-md border border-sawdust bg-[#fbf8f1] p-4 text-sm transition hover:-translate-y-0.5 hover:border-moss/40 hover:bg-white">
                  <span className="block h-1.5 w-12 rounded-full bg-moss/70 transition group-hover:w-16" />
                  <span className="mt-4 block font-semibold text-ink">{example.label}</span>
                  <span className="mt-2 block leading-6 text-ink/65">{example.description}</span>
                  <span className="mt-4 inline-flex font-semibold text-moss">Use starter -&gt;</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function DashboardQueueCard({
  eyebrow,
  summary,
  emptyCopy,
  actionLabel,
}: {
  eyebrow: string;
  summary: ProjectSummary | undefined;
  emptyCopy: string;
  actionLabel: string;
}) {
  return (
    <section className="min-w-0 rounded-lg border border-sawdust bg-white/90 p-4 shadow-soft">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-caution">{eyebrow}</p>
      {summary ? (
        <div className="mt-3 min-w-0">
          <h2 className="truncate text-lg font-semibold text-ink" title={summary.project.title}>
            {summary.project.title}
          </h2>
          <p className="mt-1 text-sm leading-6 text-ink/65">
            {projectTypeLabels[summary.project.project_type]} | {dimensionLabel(summary.project)} | Updated {formatProjectDate(summary.project.updated_at)}
          </p>
          <p className="mt-2 text-sm font-medium text-ink">{summary.planCount > 0 ? "Generated plan saved. Review before building or printing." : "Draft intake saved. Generate a first plan from the project detail page."}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href={`/projects/${summary.project.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
              {actionLabel}
            </Link>
            {summary.planCount > 0 ? (
              <Link href={`/projects/${summary.project.id}/print`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                Print build sheet
              </Link>
            ) : null}
          </div>
        </div>
      ) : (
        <p className="mt-3 text-sm leading-6 text-ink/65">{emptyCopy}</p>
      )}
    </section>
  );
}

function ProjectShortcut({ summary }: { summary: ProjectSummary }) {
  const { project, planCount } = summary;
  const hasPlan = planCount > 0;

  return (
    <article className="group overflow-hidden rounded-lg border border-sawdust bg-white shadow-soft transition hover:-translate-y-0.5 hover:border-moss/35">
      <div className={`h-2 ${hasPlan ? "bg-moss" : "bg-caution"}`} />
      <div className="grid gap-0 sm:grid-cols-[10.5rem_minmax(0,1fr)]">
        <ProjectWorkshopPreview label={`${project.title} project preview`} />
        <div className="flex min-w-0 flex-col p-4">
          <div className="min-w-0">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <h3 className="truncate text-lg font-semibold text-ink" title={project.title}>
                {project.title}
              </h3>
              <span className={`w-fit rounded px-2 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em] ${hasPlan ? "bg-moss/10 text-moss" : "bg-amber-100 text-amber-900"}`}>
                {hasPlan ? "Ready to review" : "Needs plan"}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink/65">
              {projectTypeLabels[project.project_type]} | {dimensionLabel(project)} | Updated {formatProjectDate(project.updated_at)}
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink/60">
              <span className="rounded-md bg-shop px-2 py-1">{statusLabel(project)}</span>
              <span className="rounded-md bg-shop px-2 py-1">{hasPlan ? "Latest plan saved" : "No generated plan yet"}</span>
            </div>
            <p className="mt-3 text-sm font-medium text-ink">{hasPlan ? "Next: review before building or print a shop sheet." : "Next: generate a first plan from the detail page."}</p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2 border-t border-sawdust pt-3">
            <Link href={`/projects/${project.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white transition hover:bg-moss/90">
              {hasPlan ? "Open project" : "Open to generate"}
            </Link>
            {hasPlan ? (
              <Link href={`/projects/${project.id}/print`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                Print build sheet
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, children, tone = "neutral", compact = false }: { label: string; value: string; children?: ReactNode; tone?: "primary" | "accent" | "neutral"; compact?: boolean }) {
  const valueClass = tone === "primary" ? "text-moss" : tone === "accent" ? "text-caution" : "text-ink";

  return (
    <div className="rounded-md border border-sawdust bg-white/85 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/50">{label}</p>
      <p className={`mt-2 truncate font-serif font-semibold tabular-nums ${compact ? "text-xl" : "text-3xl"} ${valueClass}`}>{value}</p>
      {children}
    </div>
  );
}

function ProjectWorkshopPreview({ label }: { label: string }) {
  return (
    <div className="flex min-h-40 items-center justify-center bg-[#f3efe7] p-4" aria-label={label}>
      <div className="relative h-28 w-full max-w-56 rounded-md border border-sawdust bg-[#fffaf0] shadow-inner">
        <div className="absolute left-5 top-4 h-20 w-5 rounded border-2 border-moss/75 bg-moss/5" />
        <div className="absolute left-16 right-7 top-10 h-5 rounded-sm border-2 border-[#805f32] bg-[#d8b679] shadow-sm" />
        <div className="absolute left-16 right-7 top-[3.7rem] border-t-2 border-dashed border-[#9a733f]" />
        <div className="absolute bottom-4 left-16 right-7 h-3 rounded-full bg-ink/10" />
        <div className="absolute right-4 top-4 text-[0.62rem] font-semibold uppercase tracking-[0.12em] text-ink/55">review</div>
      </div>
    </div>
  );
}

function sortProjectSummaries(projectSummaries: ProjectSummary[]): ProjectSummary[] {
  return [...projectSummaries].sort((a, b) => compareProjectsByRecentUpdate(a.project, b.project));
}

function compareProjectsByRecentUpdate(a: Project, b: Project): number {
  const updatedComparison = b.updated_at.localeCompare(a.updated_at);
  if (updatedComparison !== 0) return updatedComparison;

  const createdComparison = b.created_at.localeCompare(a.created_at);
  if (createdComparison !== 0) return createdComparison;

  return a.title.localeCompare(b.title);
}

function statusLabel(project: Project): string {
  if (project.build_completed) return "Built";
  if (project.status === "plan_generated") return "Plan generated";
  if (project.status === "generation_failed") return "Needs review";
  return "Draft";
}

function dimensionLabel(project: Project): string {
  return `${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`;
}

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
