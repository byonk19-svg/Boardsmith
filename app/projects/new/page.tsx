import { projectTypeLabels, projectTypes, skillLevels, toolLabels, toolOptions } from "@/lib/projects/types";

export default function NewProjectPage() {
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">New Project</h1>
        <p className="mt-2 text-sm text-ink/65">Save the intake first. AI generation happens from the project detail page after deterministic safety review.</p>
      </div>

      <form action="/projects/create" method="post" className="space-y-6 rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <Field label="Project title">
          <input name="title" required minLength={2} className="input" placeholder="Entryway fall door hanger" />
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Project type">
            <select name="project_type" required className="input">
              {projectTypes.map((type) => (
                <option key={type} value={type}>
                  {projectTypeLabels[type]}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Skill level">
            <select name="skill_level" required className="input">
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
            <input name="width_inches" required type="number" min="0.1" max="240" step="0.125" className="input" />
          </Field>
          <Field label="Height">
            <input name="height_inches" required type="number" min="0.1" max="240" step="0.125" className="input" />
          </Field>
          <Field label="Depth">
            <input name="depth_inches" required type="number" min="0" max="240" step="0.125" className="input" defaultValue="0" />
          </Field>
          <Field label="Thickness">
            <input name="material_thickness_inches" required type="number" min="0.03125" max="12" step="0.03125" className="input" />
          </Field>
        </div>

        <Field label="Material type">
          <input name="material_type" required minLength={2} className="input" placeholder="1/4 inch birch plywood" />
        </Field>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">Tools available</legend>
          <div className="mt-3 grid gap-2 sm:grid-cols-3">
            {toolOptions.map((tool) => (
              <label key={tool} className="flex items-center gap-2 rounded-md border border-sawdust px-3 py-2 text-sm text-ink/75">
                <input name="tools_available" type="checkbox" value={tool} className="h-4 w-4 accent-moss" />
                {toolLabels[tool]}
              </label>
            ))}
          </div>
        </fieldset>

        <Field label="Style notes">
          <textarea name="style_notes" rows={4} className="input" placeholder="Rustic painted finish, rounded edges, layered lettering..." />
        </Field>

        <Field label="Intended use">
          <textarea name="intended_use" required rows={4} className="input" placeholder="Indoor front door decoration for seasonal use..." />
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
