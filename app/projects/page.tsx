import Link from "next/link";
import { projectTypeLabels } from "@/lib/projects/types";
import { listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

export default async function ProjectsPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [projects, params] = await Promise.all([listProjects(), searchParams]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-ink">Projects</h1>
          <p className="mt-2 text-sm text-ink/65">Saved project intakes and generated plan histories.</p>
        </div>
        <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
          New Project
        </Link>
      </div>

      {params.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{params.error}</p> : null}

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
          <p className="font-medium text-ink">No projects yet.</p>
          <p className="mt-2 text-sm text-ink/65">Create the first intake before generating a plan.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {projects.map((project) => (
            <Link key={project.id} href={`/projects/${project.id}`} className="rounded-lg border border-sawdust bg-white p-5 transition hover:border-moss hover:shadow-soft">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-lg font-semibold text-ink">{project.title}</p>
                  <p className="mt-1 text-sm text-ink/65">
                    {projectTypeLabels[project.project_type]} · {project.width_inches} x {project.height_inches} x {project.depth_inches} in
                  </p>
                </div>
                <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">{project.status.replaceAll("_", " ")}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
