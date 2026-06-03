import Link from "next/link";
import type { ReactNode } from "react";
import { isSupabasePersistenceConfigured, listProjects } from "@/lib/storage/project-store";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const projects = await listProjects();
  const latestProject = projects.length > 0 ? projects[0] : null;
  const latestTitle = latestProject ? latestProject.title : "None yet";

  return (
    <div className="space-y-8">
      <section className="grid gap-6 rounded-lg border border-sawdust bg-white p-6 shadow-soft md:grid-cols-[1.4fr_0.6fr]">
        <div className="space-y-4">
          <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-ink">Generate structured woodworking plans without giving up control of the measurements.</h1>
          <p className="max-w-2xl text-base leading-7 text-ink/70">
            Start with supported beginner-friendly project types, deterministic safety flags, and schema-validated AI output before anything is saved.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/projects/new" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
              New Project
            </Link>
            <Link href="/projects" className="rounded-md border border-sawdust px-4 py-2 text-sm font-semibold text-ink hover:bg-shop">
              View Projects
            </Link>
          </div>
        </div>
        <div className="rounded-md bg-shop p-5">
          <p className="text-sm font-semibold text-ink">MVP guardrails</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-ink/70">
            <li>Structured JSON only</li>
            <li>Zod validation before save</li>
            <li>No load-bearing guarantees</li>
            <li>Auth and exports deferred</li>
          </ul>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Metric label="Projects" value={projects.length.toString()} />
        <Metric label="Storage" value={isSupabasePersistenceConfigured() ? "Supabase" : "Local private"} />
        <Metric label="Latest" value={latestTitle}>
          {latestProject ? (
            <Link href={`/projects/${latestProject.id}`} className="mt-3 inline-flex text-sm font-semibold text-moss hover:text-moss/80">
              Continue latest project
            </Link>
          ) : null}
        </Metric>
      </section>
    </div>
  );
}

function Metric({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="rounded-lg border border-sawdust bg-white p-5">
      <p className="text-sm font-medium text-ink/60">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-ink">{value}</p>
      {children}
    </div>
  );
}
