import Link from "next/link";
import type { ReactNode } from "react";
import { projectIntakeExamples } from "@/lib/projects/intake-examples";
import { projectTypeLabels, type Project } from "@/lib/projects/types";
import { listGeneratedPlans, listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

type ProjectSummary = {
  project: Project;
  planCount: number;
};

export default async function DashboardPage() {
  const projects = await listProjects();
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
  const recentProjects = projectSummaries.slice(0, 4);
  const starterExamples = projectIntakeExamples.slice(0, 3);

  return (
    <div className="space-y-6">
      <section className="rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <p className="text-sm font-semibold uppercase tracking-wide text-moss">Planning aid</p>
            <h1 className="text-3xl font-semibold tracking-tight text-ink">Private Boardsmith workspace</h1>
            <p className="text-sm leading-6 text-ink/70">
              Resume recent plans, find drafts that still need generation, and start a small reviewable woodworking project. Verify dimensions,
              materials, fasteners, and tool safety before cutting or building.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
              New Project
            </Link>
            <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
              View Projects
            </Link>
          </div>
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-4">
        <Metric label="Total projects" value={projectSummaries.length.toString()} />
        <Metric label="With generated plans" value={projectsWithPlans.toString()} />
        <Metric label="Need generated plans" value={projectsNeedingPlans.toString()} />
        <Metric label="Most recent" value={latestProjectSummary ? latestProjectSummary.project.title : "None yet"} />
      </section>

      {projectSummaries.length === 0 ? (
        <section className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
          <p className="font-medium text-ink">No projects yet.</p>
          <p className="mt-2 text-sm text-ink/65">Create a project intake, then generate a plan from the project detail page.</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
              Start first project
            </Link>
            <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
              View Projects
            </Link>
          </div>
        </section>
      ) : (
        <section className="rounded-lg border border-sawdust bg-white p-5 shadow-soft">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-ink">Recent projects</h2>
              <p className="mt-1 text-sm text-ink/65">Most recently updated first.</p>
            </div>
            <Link href="/projects" className="text-sm font-semibold text-moss hover:text-moss/80">
              Browse all projects
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {recentProjects.map((summary) => (
              <ProjectShortcut key={summary.project.id} summary={summary} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-lg border border-sawdust bg-white p-5 shadow-soft">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-ink">Try a starter</h2>
            <p className="mt-1 text-sm text-ink/65">Load editable example details for a small, reviewable first pass.</p>
          </div>
          <Link href="/projects/new" className="text-sm font-semibold text-moss hover:text-moss/80">
            New Project
          </Link>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {starterExamples.map((example) => (
            <Link key={example.slug} href={`/projects/new?example=${example.slug}`} className="rounded-md border border-sawdust p-3 text-sm hover:bg-shop">
              <span className="font-semibold text-ink">{example.label}</span>
              <span className="mt-1 block leading-6 text-ink/65">{example.description}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

function ProjectShortcut({ summary }: { summary: ProjectSummary }) {
  const { project, planCount } = summary;

  return (
    <article className="rounded-md border border-sawdust p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h3 className="font-semibold text-ink">{project.title}</h3>
          <p className="mt-1 text-sm text-ink/65">
            {projectTypeLabels[project.project_type]} | {project.width_inches} x {project.height_inches} x {project.depth_inches} in | Updated{" "}
            {formatProjectDate(project.updated_at)}
          </p>
          <div className="mt-2 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
            <span className="rounded-md bg-shop px-2 py-1">{statusLabel(project)}</span>
            <span className="rounded-md bg-shop px-2 py-1">{planCount > 0 ? "Latest plan saved" : "No generated plan yet"}</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href={`/projects/${project.id}`} className="rounded-md bg-moss px-3 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Open project
          </Link>
          <Link href={`/projects/${project.id}`} className="rounded-md border border-sawdust px-3 py-2 text-sm font-semibold text-ink hover:bg-shop">
            {planCount > 0 ? "View latest plan" : "Generate plan"}
          </Link>
        </div>
      </div>
    </article>
  );
}

function Metric({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-sawdust bg-white p-4">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 truncate text-2xl font-semibold text-ink">{value}</p>
      {children}
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

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}
