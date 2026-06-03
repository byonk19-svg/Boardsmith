import { cookies } from "next/headers";
import Link from "next/link";
import { findProjectIntakeExample, projectIntakeExamples } from "@/lib/projects/intake-examples";
import { decodeProjectIntakeDraft, projectIntakeDraftCookieName } from "@/lib/projects/intake-draft";
import { projectTypeLabels, projectTypes, skillLevels, toolLabels, toolOptions } from "@/lib/projects/types";

export default async function NewProjectPage({ searchParams }: { searchParams?: Promise<{ error?: string; example?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const selectedExample = findProjectIntakeExample(params.example);
  const draft =
    params.error === "invalid_intake" ? decodeProjectIntakeDraft((await cookies()).get(projectIntakeDraftCookieName)?.value) : undefined;
  const formValues = draft ?? selectedExample?.draft;
  const starterLoaded = !draft && selectedExample;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">New Project</h1>
        <p className="mt-2 text-sm text-ink/65">Save the intake first. AI generation happens from the project detail page after deterministic safety review.</p>
      </div>

      {params.error === "invalid_intake" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Project intake could not be saved.</p>
          <p className="mt-1">Check the required fields, dimensions, tools, and material details before trying again.</p>
        </section>
      ) : null}

      {starterLoaded ? (
        <section className="rounded-md border border-moss/30 bg-moss/10 p-4 text-sm leading-6 text-ink">
          <p className="font-semibold">Starter details loaded — review before creating.</p>
          <p className="mt-1 text-ink/70">These fields are editable. Boardsmith is still a planning aid, not a certified or load-rated plan.</p>
        </section>
      ) : null}

      <section className="space-y-3 text-sm leading-6 text-ink/70">
        <p className="font-medium text-ink">More detail produces better plans.</p>
        <p>
          Good MVP projects are specific, bounded, and easy to review before cutting. Boardsmith is a planning aid and may block drafts that fail validation or review.
        </p>
      </section>

      <section className="grid gap-4 rounded-lg border border-sawdust bg-white p-5 text-sm leading-6 text-ink/70 shadow-soft sm:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-ink">Example project details</h2>
          <ul className="space-y-3">
            {projectIntakeExamples.map((example) => (
              <li key={example.slug} className="space-y-1">
                <p className="font-semibold text-ink">{example.label}</p>
                <p>{example.description}</p>
                <Link
                  aria-label={`Use example: ${example.label}`}
                  className="inline-flex text-sm font-semibold text-moss hover:text-moss/80"
                  href={`/projects/new?example=${example.slug}`}
                >
                  Use this example
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-3">
          <h2 className="text-base font-semibold text-ink">Include these details</h2>
          <ul className="list-disc space-y-2 pl-5">
            <li>finished dimensions</li>
            <li>material and thickness</li>
            <li>tools available</li>
            <li>indoor or outdoor use</li>
            <li>mounting method if applicable</li>
            <li>finish preference</li>
            <li>safety-sensitive use such as child, wall-mounted, seating, climbing, or load-bearing</li>
          </ul>
        </div>
      </section>

      <form action="/projects/create" method="post" className="space-y-6 rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <Field label="Project title">
          <input name="title" required minLength={2} className="input" placeholder="Small bathroom wall shelf" defaultValue={formValues?.title} />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project type">
            <select name="project_type" required className="input" defaultValue={formValues?.project_type === "" ? undefined : formValues?.project_type}>
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {projectTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skill level">
            <select name="skill_level" required className="input" defaultValue={formValues?.skill_level === "" ? undefined : formValues?.skill_level}>
              {skillLevels.map((level) => (
                <option key={level} value={level}>
                  {level[0].toUpperCase()}
                  {level.slice(1)}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-4">
          <Field label="Width">
            <input name="width_inches" required type="number" min="0.1" max="240" step="any" className="input" placeholder="24" defaultValue={formValues?.width_inches} />
          </Field>
          <Field label="Height">
            <input name="height_inches" required type="number" min="0.1" max="240" step="any" className="input" placeholder="8" defaultValue={formValues?.height_inches} />
          </Field>
          <Field label="Depth">
            <input name="depth_inches" required type="number" min="0" max="240" step="any" className="input" defaultValue={formValues ? formValues.depth_inches : "0"} />
          </Field>
          <Field label="Thickness">
            <input
              name="material_thickness_inches"
              required
              type="number"
              min="0.03125"
              max="12"
              step="any"
              className="input"
              placeholder="0.75"
              defaultValue={formValues?.material_thickness_inches}
            />
          </Field>
        </div>

        <Field label="Material type">
          <input
            name="material_type"
            required
            minLength={2}
            className="input"
            placeholder="3/4 inch pine board or 1/2 inch plywood"
            defaultValue={formValues?.material_type}
          />
        </Field>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">Tools available</legend>
          <p className="mt-1 text-sm text-ink/60">Select only tools you can safely use. Boardsmith will keep planning guidance inside this tool list.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {toolOptions.map((tool) => (
              <label key={tool} className="flex items-center gap-2 rounded-md border border-sawdust px-3 py-2 text-sm text-ink/75">
                <input name="tools_available" type="checkbox" value={tool} className="h-4 w-4 accent-moss" defaultChecked={formValues?.tools_available.includes(tool)} />
                {toolLabels[tool]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Style notes">
          <textarea
            name="style_notes"
            rows={4}
            className="input"
            placeholder="Painted white finish, rounded front corners, hidden brackets if possible..."
            defaultValue={formValues?.style_notes}
          />
        </Field>

        <Field label="Intended use">
          <textarea
            name="intended_use"
            required
            rows={4}
            className="input"
            placeholder="Indoor bathroom shelf for light towels; wall-mounted into studs if possible..."
            defaultValue={formValues?.intended_use}
          />
        </Field>

        <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
          Save Project
        </button>
      </form>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {children}
    </label>
  );
}
