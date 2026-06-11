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
  const unknownExample = typeof params.example === "string" && params.example.length > 0 && !selectedExample;
  const starterChooserOpen = Boolean(starterLoaded) || unknownExample;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-moss">Project intake</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">Start a project plan</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-ink/65">
          Save a clear project intake first. Boardsmith generates a plan from the project detail page after deterministic safety review.
        </p>
      </div>

      {params.error === "invalid_intake" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Project intake needs a little more detail.</p>
          <p className="mt-1">Check the required fields, dimensions, material, and at least one safe tool before trying again.</p>
        </section>
      ) : null}

      {starterLoaded ? (
        <section className="rounded-md border border-moss/30 bg-moss/10 p-4 text-sm leading-6 text-ink">
          <p className="font-semibold">Starter details loaded - review before creating.</p>
          <p className="mt-1 text-ink/70">These fields are editable. Boardsmith is still a planning aid, not a certified or load-rated plan.</p>
        </section>
      ) : null}

      {unknownExample ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Starter example was not found.</p>
          <p className="mt-1">Choose one of the examples below or fill in your own project details.</p>
        </section>
      ) : null}

      <details className="rounded-lg border border-sawdust bg-white p-4 text-sm leading-6 text-ink/70 shadow-soft" open={starterChooserOpen}>
        <summary className="cursor-pointer text-base font-semibold text-ink">
          Start from an example
          <span className="ml-2 text-sm font-normal text-ink/60">optional editable starters</span>
        </summary>
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-3">
            <p>Examples fill the form with beginner-friendly details. You can also skip them and start with Project basics below.</p>
            <ul className="grid gap-2 sm:grid-cols-2">
            {projectIntakeExamples.map((example) => (
              <li key={example.slug} className="rounded-md border border-sawdust p-3">
                <div className="flex h-full flex-col gap-2">
                  <div className="min-w-0">
                    <p className="font-semibold text-ink">{example.label}</p>
                    <p className="mt-1 text-ink/65">{example.description}</p>
                  </div>
                  <Link
                    aria-label={`Use example: ${example.label}`}
                    className="mt-auto text-sm font-semibold text-moss hover:text-moss/80"
                    href={`/projects/new?example=${example.slug}`}
                  >
                    Use example
                  </Link>
                </div>
              </li>
            ))}
          </ul>
          </div>
          <div className="space-y-4 rounded-md bg-shop p-4">
            <div>
              <h2 className="text-base font-semibold text-ink">Good input example</h2>
              <p className="mt-2 text-ink/70">
                Small indoor wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board, drill and sander available, light decor only,
                mount into studs if possible, painted finish.
              </p>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-ink">Include what you know</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>finished dimensions or your best current estimate</li>
                <li>material and thickness, even if it may change later</li>
                <li>tools you can safely use</li>
                <li>indoor/outdoor location, mounting, finish, and safety-sensitive uses</li>
              </ul>
            </div>
          </div>
        </div>
      </details>

      <form action="/projects/create" method="post" className="space-y-6 rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <section className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-ink">Project basics</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">Name the project and choose the closest template. You can refine details after the intake is saved.</p>
          </div>
          <Field label="Project title" help="Use a plain name you will recognize in the project list.">
            <input name="title" required minLength={2} className="input" placeholder="Small bathroom wall shelf" defaultValue={formValues?.title} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project type" help="Pick the closest match. Boardsmith uses it to choose cautious starter assumptions.">
              <select name="project_type" required className="input" defaultValue={formValues?.project_type === "" ? undefined : formValues?.project_type}>
                {projectTypes.map((type) => (
                  <option key={type} value={type}>
                    {projectTypeLabels[type]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Skill level" help="This changes how much beginner guidance the generated plan includes.">
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
        </section>

        <section className="space-y-4 border-t border-sawdust pt-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Size and material</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">Use inches. If you are not sure yet, enter your best estimate and call that out in the notes below.</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-4">
            <Field label="Width" help="Left to right finished size.">
              <input name="width_inches" required type="number" min="0.1" max="240" step="any" className="input" placeholder="24" defaultValue={formValues?.width_inches} />
            </Field>
            <Field label="Height" help="Top to bottom finished size.">
              <input name="height_inches" required type="number" min="0.1" max="240" step="any" className="input" placeholder="8" defaultValue={formValues?.height_inches} />
            </Field>
            <Field label="Depth" help="Front to back size. Use 0 for flat signs.">
              <input name="depth_inches" required type="number" min="0" max="240" step="any" className="input" placeholder="6" defaultValue={formValues ? formValues.depth_inches : "0"} />
            </Field>
            <Field label="Material thickness" help="Common boards are often 0.75 in; plywood may be 0.25 or 0.5 in.">
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

          <Field label="Material type" help="Name the real or likely material. Avoid vendor links or shopping notes.">
            <input
              name="material_type"
              required
              minLength={2}
              className="input"
              placeholder="3/4 inch pine board or 1/2 inch plywood"
              defaultValue={formValues?.material_type}
            />
          </Field>
        </section>

        <section className="space-y-4 border-t border-sawdust pt-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Tools and safety context</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">Select only tools you can safely use. Boardsmith keeps generated guidance inside this tool list.</p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Tools available</legend>
            <p className="mt-1 text-sm text-ink/60">Not sure yet? Select the basic layout tools you have now, then regenerate later if your tool list changes.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {toolOptions.map((tool) => (
                <label key={tool} className="flex items-center gap-2 rounded-md border border-sawdust px-3 py-2 text-sm text-ink/75">
                  <input name="tools_available" type="checkbox" value={tool} className="h-4 w-4 accent-moss" defaultChecked={formValues?.tools_available.includes(tool)} />
                  {toolLabels[tool]}
                </label>
              ))}
            </div>
          </fieldset>
        </section>

        <section className="space-y-4 border-t border-sawdust pt-5">
          <div>
            <h2 className="text-lg font-semibold text-ink">Use, constraints, and finish notes</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">This is where safety review gets better. Mention mounting, outdoor use, child-adjacent use, seating, climbing, or any load concern.</p>
          </div>

          <Field label="Intended use" help="Describe where it will live, what it will hold, and what use should be excluded.">
            <textarea
              name="intended_use"
              required
              rows={4}
              className="input"
              placeholder="Indoor bathroom shelf for light towels; wall-mounted into studs if possible; not for climbing or heavy storage."
              defaultValue={formValues?.intended_use}
            />
          </Field>

          <Field label="Finish, location, and constraints" help="Add finish preference, indoor/outdoor exposure, mounting method, edge treatment, and anything you are unsure about.">
            <textarea
              name="style_notes"
              rows={4}
              className="input"
              placeholder="Painted white finish, rounded front corners, hidden brackets if possible, confirm final bracket size before cutting."
              defaultValue={formValues?.style_notes}
            />
          </Field>
        </section>

        <section className="rounded-md bg-shop p-4 text-sm leading-6 text-ink/70">
          <p className="font-semibold text-ink">Before saving</p>
          <p className="mt-1">
            Review the intake for real dimensions, material thickness, safe tools, intended use, and anything safety-sensitive. Boardsmith saves the intake first; generated plans are saved only after validation.
          </p>
        </section>

        <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
          Save project intake
        </button>
      </form>
    </div>
  );
}

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {help ? <span className="block text-sm leading-6 text-ink/60">{help}</span> : null}
      {children}
    </label>
  );
}
