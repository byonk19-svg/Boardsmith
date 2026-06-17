import Link from "next/link";
import { getProjectListErrorMessage } from "@/lib/projects/project-list-errors";
import { isProjectArchived } from "@/lib/projects/project-planning-lifecycle";
import { projectTypeLabels, projectTypes, type Project, type ProjectStatus, type ProjectType } from "@/lib/projects/types";
import { listGeneratedPlans, listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

type ProjectsSearchParams = {
  error?: string | string[];
  q?: string | string[];
  type?: string | string[];
  status?: string | string[];
  plan?: string | string[];
  record?: string | string[];
  archive?: string | string[];
  archived?: string | string[];
  restored?: string | string[];
};

type ProjectSummary = {
  project: Project;
  planCount: number;
};

type ProjectFilters = {
  query: string;
  type: ProjectType | "all";
  status: ProjectStatus | "built" | "all";
  plan: "all" | "has_plan" | "no_plan";
  record: "all" | "has_record" | "no_record";
  archive: "active" | "archived" | "all";
};

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<ProjectsSearchParams> }) {
  const [projects, params] = await Promise.all([listProjects(), searchParams]);
  const filters = parseProjectFilters(params);
  const errorMessage = getProjectListErrorMessage(params.error);
  const projectSummaries = await Promise.all(
    projects.map(async (project) => ({
      project,
      planCount: (await listGeneratedPlans(project.id)).length,
    })),
  );
  const sortedProjectSummaries = sortProjectSummaries(projectSummaries);
  const archiveFilteredSummaries = sortedProjectSummaries.filter((summary) => matchesArchiveFilter(summary.project, filters.archive));
  const filteredProjectSummaries = archiveFilteredSummaries.filter((summary) => matchesProjectFilters(summary, filters));
  const filtersActive = areFiltersActive(filters);
  const advancedFiltersActive = areAdvancedFiltersActive(filters);
  const emptyState = projectListEmptyState(filters);
  const visibleWithPlans = archiveFilteredSummaries.filter((summary) => summary.planCount > 0).length;
  const visibleNeedingPlans = archiveFilteredSummaries.length - visibleWithPlans;
  const archivedProjectCount = sortedProjectSummaries.filter((summary) => isProjectArchived(summary.project)).length;

  return (
    <div className="dashboard-canvas -mx-5 -my-8 px-5 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto grid min-w-0 max-w-7xl gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <ProjectsSideNav />

        <div className="min-w-0 space-y-6 pb-16">
          <header className="flex flex-col gap-5 rounded-lg border border-sawdust bg-[#fbf8f1] p-6 shadow-soft sm:p-8 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-caution">Private project library</p>
              <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight tracking-tight text-ink">My Projects</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-ink/65">Manage saved project intakes, generated plan history, and private build records.</p>
            </div>
            <Link href="/projects/new" className="inline-flex w-fit items-center justify-center rounded-md bg-moss px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-moss/90 active:scale-[0.98]">
              New Project
            </Link>
          </header>

          {errorMessage ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{errorMessage}</p> : null}
          {params.archived ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project archived. It is hidden from the active project list, and its plans are preserved.</p> : null}
          {params.restored ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project restored to the active project list.</p> : null}

          {projects.length === 0 ? (
            <div className="grid gap-5 rounded-lg border border-dashed border-sawdust bg-white/90 p-6 shadow-soft lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-center">
              <div>
                <p className="font-serif text-2xl font-semibold text-ink">No projects yet.</p>
                <p className="mt-2 max-w-xl text-sm leading-6 text-ink/65">Create a project intake to start a private planning record. Generated plans and shop notes will appear here after you save work.</p>
                <Link href="/projects/new" className="mt-4 inline-flex rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                  Start first project
                </Link>
              </div>
              <ProjectCardPreview state="draft" label="empty project preview" />
            </div>
          ) : (
            <>
              <section className="grid min-w-0 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <ProjectListMetric label="Showing" value={filteredProjectSummaries.length.toString()} note={`${archiveFilteredSummaries.length.toString()} ${archiveSummaryLabel(filters.archive)}`} tone="primary" />
                <ProjectListMetric label="Ready to review" value={visibleWithPlans.toString()} note="generated plans saved" tone="accent" />
                <ProjectListMetric label="Need plans" value={visibleNeedingPlans.toString()} note="drafts or failed generations" />
                <ProjectListMetric label="Archived" value={archivedProjectCount.toString()} note="read-only unless restored" />
              </section>

              <section className="rounded-lg border border-sawdust bg-white/95 p-5 shadow-soft">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-ink">Find a project</h2>
                    <p className="mt-1 text-sm text-ink/65">Search first, then open advanced filters only when the list needs narrowing.</p>
                  </div>
                  {filtersActive ? (
                    <Link href="/projects" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                      Clear filters
                    </Link>
                  ) : null}
                </div>
                <form action="/projects" className="mt-5 space-y-4">
                  <div className="grid min-w-0 gap-3 lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
                    <label className="grid min-w-0 gap-1.5 text-sm font-medium text-ink">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">Search Projects</span>
                      <input name="q" type="search" defaultValue={filters.query} placeholder="Title, wood type, or size..." className="input" />
                    </label>
                    <label className="grid gap-1.5 text-sm font-medium text-ink">
                      <span className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">Workspace</span>
                      <select name="archive" defaultValue={filters.archive} className="input">
                        <option value="active">Active projects</option>
                        <option value="archived">Archived projects</option>
                        <option value="all">All projects</option>
                      </select>
                    </label>
                    <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white transition hover:bg-moss/90 active:scale-[0.98]">
                      Apply
                    </button>
                  </div>
                  <details className="min-w-0 overflow-hidden rounded-md border border-sawdust bg-shop/50 p-3" open={advancedFiltersActive}>
                    <summary className="cursor-pointer text-sm font-semibold text-ink">
                      More filters
                      <span className="ml-2 text-xs font-normal text-ink/55">type, status, plan, record</span>
                    </summary>
                    <div className="mt-3 grid min-w-0 gap-3 md:grid-cols-2 lg:grid-cols-4">
                      <label className="grid gap-1.5 text-sm font-medium text-ink">
                        Project type
                        <select name="type" defaultValue={filters.type} className="input">
                          <option value="all">All types</option>
                          {projectTypes.map((type) => (
                            <option key={type} value={type}>
                              {projectTypeLabels[type]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-ink">
                        Status
                        <select name="status" defaultValue={filters.status} className="input">
                          <option value="all">All statuses</option>
                          <option value="draft">Draft</option>
                          <option value="plan_generated">Plan generated</option>
                          <option value="generation_failed">Needs review</option>
                          <option value="built">Built</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-ink">
                        Plan state
                        <select name="plan" defaultValue={filters.plan} className="input">
                          <option value="all">Any plan state</option>
                          <option value="has_plan">Has latest plan</option>
                          <option value="no_plan">No plan yet</option>
                        </select>
                      </label>
                      <label className="grid gap-1.5 text-sm font-medium text-ink">
                        Record
                        <select name="record" defaultValue={filters.record} className="input">
                          <option value="all">Any record state</option>
                          <option value="has_record">Has notes or build log</option>
                          <option value="no_record">No record yet</option>
                        </select>
                      </label>
                    </div>
                  </details>
                </form>
                <p className="mt-3 text-sm text-ink/65">
                  Showing {filteredProjectSummaries.length.toString()} of {archiveFilteredSummaries.length.toString()} {archiveSummaryLabel(filters.archive)}. Most recently updated first.
                </p>
                {filtersActive ? <p className="mt-1 text-xs text-ink/55">{filterSummaryLabel(filters)}</p> : null}
              </section>

              {filteredProjectSummaries.length === 0 ? (
                <div className="rounded-lg border border-dashed border-sawdust bg-white/90 p-8 text-center shadow-soft">
                  <p className="font-serif text-2xl font-semibold text-ink">{emptyState.title}</p>
                  <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-ink/65">{emptyState.body}</p>
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
                      {emptyState.clearLabel}
                    </Link>
                    <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                      New Project
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {filteredProjectSummaries.map(({ project, planCount }) => (
                    <ProjectListCard key={project.id} project={project} planCount={planCount} />
                  ))}
                </div>
              )}
            </>
          )}

          <footer className="border-t border-sawdust pt-6 text-sm text-ink/55">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-semibold uppercase tracking-[0.14em] text-moss">Boardsmith</span>
              <span>Private planning workspace. Review before cutting or building.</span>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}

function ProjectsSideNav() {
  return (
    <aside className="hidden self-start rounded-lg border border-sawdust/80 bg-[#f0ede6]/90 p-4 shadow-soft lg:sticky lg:top-6 lg:block">
      <div className="border-b border-sawdust pb-5">
        <p className="font-serif text-3xl font-semibold tracking-tight text-moss">Boardsmith</p>
        <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-ink/50">Digital craftsmanship</p>
      </div>
      <nav className="mt-5 space-y-1 text-sm font-semibold" aria-label="Projects shortcuts">
        <Link href="/" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
          Dashboard
        </Link>
        <Link href="/projects" className="block rounded-md bg-moss px-3 py-2 text-white">
          My Projects
        </Link>
        <Link href="/projects/new" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
          New project
        </Link>
        <Link href="/settings" className="block rounded-md px-3 py-2 text-ink/70 transition hover:bg-white hover:text-ink">
          Settings
        </Link>
      </nav>
      <p className="mt-6 rounded-md bg-white/65 p-3 text-xs leading-5 text-ink/55">Archive hides work from the active list without deleting generated plans.</p>
    </aside>
  );
}

function ProjectListCard({ project, planCount }: { project: Project; planCount: number }) {
  const archived = isProjectArchived(project);
  const hasPlan = planCount > 0;
  const built = project.build_completed;

  return (
    <article className="group min-w-0 overflow-hidden rounded-lg border border-sawdust bg-white shadow-soft transition hover:border-moss/50">
      <div className={`h-1 w-full ${projectStatusStripClass(project, planCount)}`} />
      <div className="grid min-w-0 gap-0 md:grid-cols-[12rem_minmax(0,1fr)]">
        <ProjectCardPreview state={projectPreviewState(project, planCount)} label={`${project.title} project preview`} />
        <div className="flex min-w-0 flex-col p-5">
          <div className="flex min-w-0 flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-caution">{projectListNextStepLabel(project, planCount)}</p>
              <h2 className="mt-1 truncate font-serif text-2xl font-semibold leading-tight text-moss" title={project.title}>
                {project.title}
              </h2>
              <p className="mt-1 text-sm text-ink/65">
                {projectTypeLabels[project.project_type]} | {dimensionLabel(project)} | Updated {formatProjectDate(project.updated_at)}
              </p>
            </div>
            <div className="flex flex-wrap gap-2 xl:justify-end">
              {archived ? <span className="w-fit rounded bg-amber-100 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">Archived</span> : null}
              <span className="w-fit rounded bg-shop px-2 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">{statusLabel(project, planCount)}</span>
            </div>
          </div>

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">
            <Link href={`/projects/${project.id}`} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${archived || built ? "bg-shop text-ink hover:bg-sawdust" : "bg-moss text-white hover:bg-moss/90"}`}>
              {projectListPrimaryActionLabel(project, planCount)}
            </Link>
            {hasPlan ? (
              <Link href={`/projects/${project.id}/print`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                Print build sheet
              </Link>
            ) : null}
            {hasProjectRecord(project) ? (
              <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                Review project record
              </Link>
            ) : null}
            <div className="flex flex-col sm:ml-auto">
              {archived ? (
                <form action={`/projects/${project.id}/restore`} method="post" className="inline-flex flex-col">
                  <input type="hidden" name="return_to" value="archived_list" />
                  <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                    Restore project
                  </button>
                </form>
              ) : (
                <form action={`/projects/${project.id}/archive`} method="post" className="inline-flex flex-col">
                  <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink transition hover:bg-shop">
                    Archive project
                  </button>
                  <span className="mt-1 text-xs text-ink/55">Hides this project without deleting plans.</span>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-w-0 flex-wrap gap-2 border-t border-sawdust bg-[#f0eee9] px-5 py-2 sm:flex-nowrap sm:gap-6 sm:overflow-x-auto sm:whitespace-nowrap">
        <ProjectSignal label="History" value={planCount === 1 ? "1 plan version" : `${planCount.toString()} plan versions`} />
        <ProjectSignal label="Notes" value={project.notes.trim().length > 0 ? "Notes added" : "No notes yet"} />
        <ProjectSignal label="Record" value={buildLogLabel(project)} />
        <ProjectSignal label="Plan" value={hasPlan ? "Latest plan saved" : "No generated plan yet"} tone={hasPlan ? "ready" : "needs"} />
      </div>
    </article>
  );
}

function ProjectCardPreview({ state, label }: { state: "ready" | "draft" | "built" | "archived" | "failed"; label: string }) {
  const badgeLabel = state === "ready" ? "Ready to Review" : state === "built" ? "Built" : state === "archived" ? "Archived" : state === "failed" ? "Needs Review" : "Needs Generated Plan";
  const badgeClass = state === "ready" ? "bg-caution text-white" : state === "built" ? "bg-moss text-white" : state === "failed" ? "bg-amber-100 text-amber-900" : "bg-ink/65 text-white";
  const muted = state === "archived" || state === "built";

  return (
    <div className="min-h-40 border-b border-sawdust bg-[#f3efe7] p-4 md:border-b-0 md:border-r" aria-label={label}>
      <div className={`relative flex h-32 items-center justify-center overflow-hidden rounded-md border border-sawdust bg-[#fffaf0] ${muted ? "opacity-75" : ""}`}>
        <div className="absolute inset-0 bg-[repeating-linear-gradient(0deg,rgba(114,83,59,0.07)_0_1px,transparent_1px_18px)]" />
        <div className="absolute left-6 top-5 h-20 w-5 rounded border-2 border-moss/75 bg-moss/5" />
        <div className={`absolute left-16 right-6 top-11 h-5 rounded-sm border-2 border-[#805f32] ${state === "draft" || state === "failed" ? "border-dashed bg-transparent" : "bg-[#d8b679]"}`} />
        <div className="absolute bottom-5 left-16 right-8 h-3 rounded-full bg-ink/10" />
        {state === "built" ? <div className="absolute inset-0 bg-moss/10" /> : null}
        <span className={`absolute left-2 top-2 rounded px-2 py-0.5 text-[0.63rem] font-semibold uppercase tracking-[0.12em] ${badgeClass}`}>{badgeLabel}</span>
      </div>
    </div>
  );
}

function projectStatusStripClass(project: Project, planCount: number): string {
  if (isProjectArchived(project)) return "bg-sawdust";
  if (project.build_completed) return "bg-moss/40";
  if (project.status === "generation_failed") return "bg-amber-300";
  if (planCount > 0) return "bg-caution";
  return "bg-sawdust";
}

function projectPreviewState(project: Project, planCount: number): "ready" | "draft" | "built" | "archived" | "failed" {
  if (isProjectArchived(project)) return "archived";
  if (project.build_completed) return "built";
  if (project.status === "generation_failed") return "failed";
  if (planCount > 0) return "ready";
  return "draft";
}

function parseProjectFilters(params: ProjectsSearchParams): ProjectFilters {
  const type = stringParam(params.type);
  const status = stringParam(params.status);
  const plan = stringParam(params.plan);
  const record = stringParam(params.record);
  const archive = stringParam(params.archive);

  return {
    query: stringParam(params.q).trim(),
    type: isProjectType(type) ? type : "all",
    status: isProjectStatusFilter(status) ? status : "all",
    plan: plan === "has_plan" || plan === "no_plan" ? plan : "all",
    record: record === "has_record" || record === "no_record" ? record : "all",
    archive: archive === "archived" || archive === "all" ? archive : "active",
  };
}

function matchesProjectFilters({ project, planCount }: ProjectSummary, filters: ProjectFilters): boolean {
  if (filters.query.length > 0 && !projectSearchText(project).includes(filters.query.toLowerCase())) return false;
  if (filters.type !== "all" && project.project_type !== filters.type) return false;
  if (filters.status !== "all" && statusFilterValue(project) !== filters.status) return false;
  if (filters.plan === "has_plan" && planCount === 0) return false;
  if (filters.plan === "no_plan" && planCount > 0) return false;
  if (filters.record === "has_record" && !hasProjectRecord(project)) return false;
  if (filters.record === "no_record" && hasProjectRecord(project)) return false;

  return true;
}

function matchesArchiveFilter(project: Project, archiveFilter: ProjectFilters["archive"]): boolean {
  if (archiveFilter === "archived") return isProjectArchived(project);
  if (archiveFilter === "all") return true;
  return !isProjectArchived(project);
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

function areFiltersActive(filters: ProjectFilters): boolean {
  return filters.query.length > 0 || filters.type !== "all" || filters.status !== "all" || filters.plan !== "all" || filters.record !== "all" || filters.archive !== "active";
}

function areAdvancedFiltersActive(filters: ProjectFilters): boolean {
  return filters.type !== "all" || filters.status !== "all" || filters.plan !== "all" || filters.record !== "all";
}

function stringParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? "";
  return value ?? "";
}

function isProjectType(value: string): value is ProjectType {
  return projectTypes.includes(value as ProjectType);
}

function isProjectStatusFilter(value: string): value is ProjectStatus | "built" {
  return value === "built" || value === "draft" || value === "plan_generated" || value === "generation_failed";
}

function statusFilterValue(project: Project): ProjectStatus | "built" {
  if (project.build_completed) return "built";
  return project.status;
}

function projectSearchText(project: Project): string {
  return [
    project.title,
    projectTypeLabels[project.project_type],
    project.material_type,
    project.style_notes,
    project.intended_use,
    project.notes,
    project.build_actual_material,
    project.build_plan_changes,
    project.build_lessons_learned,
    ...project.safety_flags,
  ]
    .join(" ")
    .toLowerCase();
}

function ProjectListMetric({ label, value, note, tone = "neutral" }: { label: string; value: string; note: string; tone?: "primary" | "accent" | "neutral" }) {
  const valueClass = tone === "primary" ? "text-moss" : tone === "accent" ? "text-caution" : "text-ink";

  return (
    <div className="rounded-lg border border-sawdust bg-[#f5f3ee] p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink/55">{label}</p>
      <p className={`mt-2 font-serif text-3xl font-semibold tabular-nums ${valueClass}`}>{value}</p>
      <p className="mt-1 text-xs leading-5 text-ink/55">{note}</p>
    </div>
  );
}

function ProjectSignal({ label, value, tone = "neutral" }: { label: string; value: string; tone?: "neutral" | "ready" | "needs" }) {
  const toneClass = tone === "ready" ? "bg-moss/10 text-moss" : tone === "needs" ? "bg-amber-100 text-amber-900" : "bg-shop text-ink";

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 ${toneClass}`}>
      <span className="text-xs font-semibold uppercase tracking-wide opacity-70">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function projectListNextStepLabel(project: Project, planCount: number): string {
  if (isProjectArchived(project)) return "Archived review";
  if (planCount === 0) return "Needs generated plan";
  if (project.status === "generation_failed") return "Latest attempt needs review";
  if (project.build_completed) return "Built project record";
  return "Ready to review";
}

function projectListPrimaryActionLabel(project: Project, planCount: number): string {
  if (isProjectArchived(project)) return "Review archived project";
  if (planCount === 0) return "Open to generate";
  return "Open project";
}

function archiveSummaryLabel(archiveFilter: ProjectFilters["archive"]): string {
  if (archiveFilter === "archived") return "archived projects";
  if (archiveFilter === "all") return "projects";
  return "active projects";
}

function projectListEmptyState(filters: ProjectFilters): { title: string; body: string; clearLabel: string } {
  if (filters.archive === "archived") {
    return {
      title: "No archived projects match these filters.",
      body: "Restored projects return to Active projects. Clear filters to see the active workspace.",
      clearLabel: "View active projects",
    };
  }

  if (filters.archive === "active") {
    return {
      title: "No active projects match these filters.",
      body: "Archived projects stay hidden unless you choose Archived or All. Clear filters to return to the active list.",
      clearLabel: "Clear filters",
    };
  }

  return {
    title: "No projects match these filters.",
    body: "Clear filters to return to active projects.",
    clearLabel: "Clear filters",
  };
}

function statusLabel(project: Project, planCount = 0): string {
  if (project.build_completed) return "Built";
  if (project.status === "plan_generated") return "Plan generated";
  if (project.status === "generation_failed" && planCount > 0) return "Latest attempt failed";
  if (project.status === "generation_failed") return "Needs review";
  return "Draft";
}

function buildLogLabel(project: Project): string {
  if (project.build_completed) return "Built";
  if (hasBuildLog(project)) return "Build notes added";
  return "No build notes yet";
}

function filterSummaryLabel(filters: ProjectFilters): string {
  const active: string[] = [];
  if (filters.query.length > 0) active.push(`search "${filters.query}"`);
  if (filters.archive !== "active") active.push(archiveSummaryLabel(filters.archive));
  if (filters.type !== "all") active.push(projectTypeLabels[filters.type]);
  if (filters.status !== "all") active.push(statusFilterLabel(filters.status));
  if (filters.plan !== "all") active.push(filters.plan === "has_plan" ? "has generated plan" : "needs generated plan");
  if (filters.record !== "all") active.push(filters.record === "has_record" ? "has project record" : "no project record");
  return `Active filters: ${active.join(", ")}.`;
}

function statusFilterLabel(status: ProjectFilters["status"]): string {
  if (status === "built") return "built";
  if (status === "plan_generated") return "plan generated";
  if (status === "generation_failed") return "needs review";
  if (status === "draft") return "draft";
  return "all statuses";
}

function hasProjectRecord(project: Project): boolean {
  return project.notes.trim().length > 0 || hasBuildLog(project);
}

function hasBuildLog(project: Project): boolean {
  return (
    project.build_completed ||
    project.build_completed_at.length > 0 ||
    project.build_actual_material.trim().length > 0 ||
    project.build_plan_changes.trim().length > 0 ||
    project.build_lessons_learned.trim().length > 0
  );
}

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function dimensionLabel(project: Project): string {
  return `${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`;
}
