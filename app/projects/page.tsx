import Link from "next/link";
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

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-2 text-sm text-ink/65">Saved project intakes, generated plan history, and private build records.</p>
        </div>
        <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
          New Project
        </Link>
      </div>

      {typeof params.error === "string" ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p> : null}
      {params.archived ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project archived. It is hidden from the active project list, and its plans are preserved.</p> : null}
      {params.restored ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Project restored to the active project list.</p> : null}

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
          <p className="font-medium text-ink">No projects yet.</p>
          <p className="mt-2 text-sm text-ink/65">Create a project intake to start a private planning record.</p>
          <Link href="/projects/new" className="mt-4 inline-flex rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Start first project
          </Link>
        </div>
      ) : (
        <>
          <section className="rounded-lg border border-sawdust bg-white p-4 shadow-soft">
            <form action="/projects" className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr_1fr_auto] xl:items-end">
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Search
                <input
                  name="q"
                  type="search"
                  defaultValue={filters.query}
                  placeholder="Title, use, style notes..."
                  className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss"
                />
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Project type
                <select name="type" defaultValue={filters.type} className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss">
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
                <select name="status" defaultValue={filters.status} className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss">
                  <option value="all">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="plan_generated">Plan generated</option>
                  <option value="generation_failed">Needs review</option>
                  <option value="built">Built</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Plan state
                <select name="plan" defaultValue={filters.plan} className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss">
                  <option value="all">Any plan state</option>
                  <option value="has_plan">Has latest plan</option>
                  <option value="no_plan">No plan yet</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Record
                <select name="record" defaultValue={filters.record} className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss">
                  <option value="all">Any record state</option>
                  <option value="has_record">Has notes or build log</option>
                  <option value="no_record">No record yet</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-ink">
                Archive
                <select name="archive" defaultValue={filters.archive} className="rounded-md border border-sawdust px-3 py-2 text-sm font-normal text-ink outline-none focus:border-moss">
                  <option value="active">Active projects</option>
                  <option value="archived">Archived projects</option>
                  <option value="all">All projects</option>
                </select>
              </label>
              <div className="flex flex-wrap gap-2">
                <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                  Apply
                </button>
                {filtersActive ? (
                  <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
                    Clear filters
                  </Link>
                ) : null}
              </div>
            </form>
            <p className="mt-3 text-sm text-ink/65">
              Showing {filteredProjectSummaries.length.toString()} of {archiveFilteredSummaries.length.toString()} {archiveSummaryLabel(filters.archive)}. Most recently updated first.
            </p>
          </section>

          {filteredProjectSummaries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
              <p className="font-medium text-ink">No projects match these filters.</p>
              <p className="mt-2 text-sm text-ink/65">Clear filters to return to all projects.</p>
              <div className="mt-4 flex flex-wrap justify-center gap-2">
                <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
                  Clear filters
                </Link>
                <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                  New Project
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredProjectSummaries.map(({ project, planCount }) => (
                <article key={project.id} className="rounded-lg border border-sawdust bg-white p-4 transition hover:border-moss hover:shadow-soft">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-ink">{project.title}</p>
                      <p className="mt-1 text-sm text-ink/65">
                        {projectTypeLabels[project.project_type]} | {project.width_inches} x {project.height_inches} x {project.depth_inches} in | Updated{" "}
                        {formatProjectDate(project.updated_at)}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {isProjectArchived(project) ? (
                        <span className="w-fit rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-amber-900">Archived</span>
                      ) : null}
                      <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">{statusLabel(project)}</span>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-sm">
                    <ProjectSignal label="Plan" value={planCount > 0 ? "Latest plan saved" : "No generated plan yet"} />
                    <ProjectSignal label="History" value={planCount === 1 ? "1 plan version" : `${planCount.toString()} plan versions`} />
                    <ProjectSignal label="Notes" value={project.notes.trim().length > 0 ? "Notes added" : "No notes yet"} />
                    <ProjectSignal label="Record" value={buildLogLabel(project)} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link href={`/projects/${project.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                      Open project
                    </Link>
                    <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                      {planCount > 0 ? "View latest plan" : "Generate plan"}
                    </Link>
                    {hasProjectRecord(project) ? (
                      <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                        Review project record
                      </Link>
                    ) : null}
                    {isProjectArchived(project) ? (
                      <form action={`/projects/${project.id}/restore`} method="post" className="inline-flex flex-col">
                        <input type="hidden" name="return_to" value="archived_list" />
                        <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                          Restore project
                        </button>
                      </form>
                    ) : (
                      <form action={`/projects/${project.id}/archive`} method="post" className="inline-flex flex-col">
                        <button type="submit" className="w-fit rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                          Archive project
                        </button>
                        <span className="mt-1 text-xs text-ink/55">Hides this project without deleting plans.</span>
                      </form>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
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

function ProjectSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-md bg-shop px-2.5 py-1.5">
      <span className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </div>
  );
}

function isProjectArchived(project: Project): boolean {
  return typeof project.archived_at === "string" && project.archived_at.length > 0;
}

function archiveSummaryLabel(archiveFilter: ProjectFilters["archive"]): string {
  if (archiveFilter === "archived") return "archived projects";
  if (archiveFilter === "all") return "projects";
  return "active projects";
}

function statusLabel(project: Project): string {
  if (project.build_completed) return "Built";
  if (project.status === "plan_generated") return "Plan generated";
  if (project.status === "generation_failed") return "Needs review";
  return "Draft";
}

function buildLogLabel(project: Project): string {
  if (project.build_completed) return "Built";
  if (hasBuildLog(project)) return "Build notes added";
  return "No build notes yet";
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
