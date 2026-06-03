import Link from "next/link";
import { projectTypeLabels, type Project } from "@/lib/projects/types";
import { listGeneratedPlans, listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [projects, params] = await Promise.all([listProjects(), searchParams]);
  const projectSummaries = await Promise.all(
    projects.map(async (project) => ({
      project,
      planCount: (await listGeneratedPlans(project.id)).length,
    })),
  );

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

      {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p> : null}

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
          <p className="font-medium text-ink">No projects yet.</p>
          <p className="mt-2 text-sm text-ink/65">Create a project intake to start a private planning record.</p>
          <Link href="/projects/new" className="mt-4 inline-flex rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Start first project
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {projectSummaries.map(({ project, planCount }) => (
            <article key={project.id} className="rounded-lg border border-sawdust bg-white p-5 transition hover:border-moss hover:shadow-soft">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-lg font-semibold text-ink">{project.title}</p>
                  <p className="mt-1 text-sm text-ink/65">
                    {projectTypeLabels[project.project_type]} | {project.width_inches} x {project.height_inches} x {project.depth_inches} in | Updated{" "}
                    {formatProjectDate(project.updated_at)}
                  </p>
                </div>
                <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">{statusLabel(project)}</span>
              </div>

              <div className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <ProjectSignal label="Plan" value={planCount > 0 ? "Latest plan saved" : "No generated plan yet"} />
                <ProjectSignal label="History" value={planCount === 1 ? "1 plan version" : `${planCount.toString()} plan versions`} />
                <ProjectSignal label="Notes" value={project.notes.trim().length > 0 ? "Notes added" : "No notes yet"} />
                <ProjectSignal label="Record" value={buildLogLabel(project)} />
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/projects/${project.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
                  Continue project
                </Link>
                <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                  {planCount > 0 ? "View latest plan" : "Generate plan"}
                </Link>
                {hasProjectRecord(project) ? (
                  <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
                    Review project record
                  </Link>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function ProjectSignal({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-shop p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{label}</p>
      <p className="mt-1 font-medium text-ink">{value}</p>
    </div>
  );
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
