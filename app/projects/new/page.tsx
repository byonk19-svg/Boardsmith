import { cookies } from "next/headers";
import Link from "next/link";
import { ProjectIntakeFormEnhancements } from "@/app/projects/new/ProjectIntakeFormEnhancements";
import { ProjectIntakeLiveSummary, ProjectIntakeSubmitLabel } from "@/app/projects/new/ProjectIntakeLiveSummary";
import { findProjectIntakeExample, projectIntakeExamples } from "@/lib/projects/intake-examples";
import { decodeProjectIntakeDraft, projectIntakeDraftCookieName } from "@/lib/projects/intake-draft";
import {
  boardSizeLabels,
  boardSizeOptions,
  cutStrategyLabels,
  cutStrategyOptions,
  higherRiskSpotLabels,
  higherRiskSpotOptions,
  installLocationLabels,
  installLocationOptions,
  measurementConfidenceLabels,
  measurementConfidenceOptions,
  moistureExposureLabels,
  moistureExposureOptions,
  mountingMethodLabels,
  mountingMethodOptions,
  projectTypeLabels,
  projectTypes,
  shelfLayoutLabels,
  shelfLayoutOptions,
  shelfLoadLabels,
  shelfLoadOptions,
  skillLevels,
  studAccessLabels,
  studAccessOptions,
  supportCountLabels,
  supportCountOptions,
  toolLabels,
  wallTypeLabels,
  wallTypeOptions,
  type ProjectType,
  type ToolOption,
} from "@/lib/projects/types";

const intakeProjectTypes: ProjectType[] = ["simple_shelf", ...projectTypes.filter((type) => type !== "simple_shelf")];

const intakeSections = [
  { id: "project-basics", label: "Project Info", detail: "Name and template", status: "Details added", tone: "ready" },
  { id: "size-material", label: "Size & Board", detail: "Shelf size and boards", status: "Missing dimensions", tone: "warn" },
  { id: "mounting-safety", label: "Mounting", detail: "Wall, load, and exposure", status: "Needs review", tone: "review" },
  { id: "tools-finish", label: "Tools & Finish", detail: "Cutting, tools, and notes", status: "Not started", tone: "neutral" },
] as const;

const toolGroups = [
  { label: "Layout", tools: ["tape_measure", "pencil", "level"] },
  { label: "Mounting and safety", tools: ["drill", "stud_finder", "safety_glasses", "clamps"] },
  { label: "Cutting", tools: ["jigsaw", "circular_saw", "miter_saw"] },
  { label: "Finishing", tools: ["sander", "paint_brush"] },
] satisfies readonly { label: string; tools: readonly ToolOption[] }[];

const measurementGuide = [
  { label: "Shelf width", cue: "left to right", example: "For a shelf, this is how long it runs along the wall." },
  { label: "Shelf depth", cue: "from wall to front edge", example: "For a shelf, this is how far it sticks out from the wall." },
  { label: "Total project height", cue: "full top-to-bottom size", example: "Usually optional for one plain shelf; needed for multi-shelf units, side panels, lips, or visible brackets." },
  { label: "Board thickness", cue: "each board, not the whole project", example: "A common 1x board is usually 0.75 inches thick." },
] as const;

function draftOption<T extends string>(value: T | "" | undefined, fallback: T): T {
  return value === "" || value === undefined ? fallback : value;
}

function formatDraftMetadataLabel(value: string): string {
  return value
    .replaceAll("_", " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word, index) => (index === 0 ? `${word.charAt(0).toUpperCase()}${word.slice(1)}` : word))
    .join(" ");
}

export default async function NewProjectPage({ searchParams }: { searchParams?: Promise<{ error?: string; example?: string; draft?: string }> }) {
  const params = searchParams ? await searchParams : {};
  const selectedExample = findProjectIntakeExample(params.example);
  const draft =
    params.error === "invalid_intake" || params.draft === "idea"
      ? decodeProjectIntakeDraft((await cookies()).get(projectIntakeDraftCookieName)?.value)
      : undefined;
  const formValues = draft ?? selectedExample?.draft;
  const starterLoaded = !draft && selectedExample;
  const ideaDraftLoaded = Boolean(draft && params.draft === "idea");
  const ideaDraftStatus = ideaDraftLoaded ? formValues?.draft_status : "";
  const ideaDraftMetadataItems =
    ideaDraftLoaded && formValues
      ? [
          ...(formValues.draft_status === "concept_only" ? ["Concept-only draft: choose a supported project type before saving a build setup."] : []),
          ...(formValues.draft_status === "unsupported" ? ["Unsupported draft: choose a supported project type only if this idea honestly fits one."] : []),
          ...(formValues.draft_status === "blocked_for_safety" ? ["Safety-blocked draft: do not generate build instructions from this idea."] : []),
          ...(formValues.draft_missing_fields ?? []).map((field) => `Missing detail: ${formatDraftMetadataLabel(field)}`),
          ...(formValues.draft_blocked_reasons ?? []).map((reason) => `Safety-sensitive term: ${formatDraftMetadataLabel(reason)}`),
          ...(formValues.draft_review_notes ?? []),
        ]
      : [];
  const unknownExample = typeof params.example === "string" && params.example.length > 0 && !selectedExample;
  const starterChooserOpen = Boolean(starterLoaded) || unknownExample;
  const selectedProjectType =
    ideaDraftLoaded &&
    (!formValues?.project_type ||
      formValues.draft_status === "concept_only" ||
      formValues.draft_status === "unsupported" ||
      formValues.draft_status === "blocked_for_safety")
      ? ""
      : formValues?.project_type === "" || !formValues?.project_type
        ? "simple_shelf"
        : formValues.project_type;
  const needsSupportedTemplateChoice = selectedProjectType === "";
  const selectedShelfLayout = needsSupportedTemplateChoice ? "" : formValues?.shelf_layout === "" || !formValues?.shelf_layout ? "single_shelf" : formValues.shelf_layout;
  const selectedShelfCount = needsSupportedTemplateChoice ? "" : (formValues?.shelf_count ?? "1");
  const showShelfDepthWarning = selectedProjectType === "simple_shelf" && formValues?.depth_inches.trim() === "0";
  const selectedMountingMethod = draftOption(formValues?.mounting_method, "not_sure");
  const selectedWallType = draftOption(formValues?.wall_type, "not_sure");
  const selectedStudAccess = draftOption(formValues?.stud_access, "not_sure");
  const selectedShelfLoad = draftOption(formValues?.shelf_load, "not_sure");
  const selectedMoistureExposure = draftOption(formValues?.moisture_exposure, "normal_indoor");
  const selectedBoardSize = draftOption(formValues?.board_size, "other_not_sure");
  const selectedMeasurementConfidence = draftOption(formValues?.measurement_confidence, "close_estimate");
  const selectedInstallLocation = draftOption(formValues?.install_location, "other_not_sure");
  const selectedSupportCount = draftOption(formValues?.support_count, "not_sure");
  const selectedCutStrategy = draftOption(formValues?.cut_strategy, "not_sure");
  const selectedHigherRiskSpots = formValues?.higher_risk_spots ?? [];
  const visibleIntakeSections = needsSupportedTemplateChoice
    ? [
        { id: "project-basics", label: "Project Info", detail: "Name and template", status: "Choose template", tone: "warn" },
        { id: "size-material", label: "Size & Material", detail: "Known measurements", status: "Review details", tone: "neutral" },
        { id: "mounting-safety", label: "Safety", detail: "Use and constraints", status: "Needs review", tone: "review" },
        { id: "tools-finish", label: "Tools & Finish", detail: "Tools and notes", status: "Review details", tone: "neutral" },
      ]
    : intakeSections;

  return (
    <div className="dashboard-canvas -mx-5 -my-8 px-5 py-8 sm:-mx-6 sm:px-6">
      <div className="mx-auto max-w-7xl space-y-8">
      <header className="max-w-3xl">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-caution">Project Setup</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold leading-tight text-moss sm:text-5xl">
          Tell Boardsmith what you want to build
        </h1>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink/65">
          Add the basic details first. You will review everything before Boardsmith generates a build plan.
        </p>
      </header>

      {params.error === "invalid_intake" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Project intake needs a little more detail.</p>
          <p className="mt-1">Check the required fields, dimensions, material, and at least one safe tool before trying again.</p>
        </section>
      ) : null}

      {params.error === "invalid_idea" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Project idea needs a few more words.</p>
          <p className="mt-1">Add the rough object, size, material, and where it will be used, then draft the setup again.</p>
        </section>
      ) : null}

      {params.error === "blocked_idea" ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
          <p className="font-semibold">This idea cannot be saved as a build setup.</p>
          <p className="mt-1">Boardsmith will not create build instructions from safety-sensitive natural-language drafts in the private MVP.</p>
        </section>
      ) : null}

      {params.error === "unresolved_idea" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Choose a supported project type before saving.</p>
          <p className="mt-1">Concept-only and unsupported ideas need an explicit supported template selection before they become a saved project setup.</p>
        </section>
      ) : null}

      {ideaDraftLoaded ? (
        <section className="rounded-md border border-moss/30 bg-moss/10 p-4 text-sm leading-6 text-ink">
          <p className="font-semibold">Idea drafted into setup fields - review before saving.</p>
          <p className="mt-1 text-ink/70">
            Boardsmith inferred only obvious details. Confirm dimensions, material, tools, mounting, and safety notes before creating the project.
          </p>
        </section>
      ) : null}

      {ideaDraftStatus === "concept_only" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Concept-only idea - not a supported build packet yet.</p>
          <p className="mt-1">
            Boardsmith kept this as review guidance instead of choosing a template for you. Select a supported project type only if the idea can honestly fit one of the current templates.
          </p>
        </section>
      ) : null}

      {ideaDraftStatus === "unsupported" ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Unsupported idea - not a Boardsmith build packet.</p>
          <p className="mt-1">
            This draft did not match the current woodworking planning templates. Select a supported project type only if the idea can honestly fit one.
          </p>
        </section>
      ) : null}

      {ideaDraftStatus === "blocked_for_safety" ? (
        <section className="rounded-md border border-red-200 bg-red-50 p-4 text-sm leading-6 text-red-950">
          <p className="font-semibold">Safety-sensitive idea - do not create build instructions from this draft.</p>
          <p className="mt-1">
            This idea includes safety-sensitive terms that Boardsmith should not turn into a full build packet in the private MVP.
          </p>
        </section>
      ) : null}

      {ideaDraftMetadataItems.length > 0 ? (
        <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
          <p className="font-semibold">Draft review before saving</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {ideaDraftMetadataItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
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

      <section className="rounded-lg border border-sawdust bg-white/90 p-5 text-sm leading-6 text-ink/70 shadow-soft">
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div>
            <h2 className="text-base font-semibold text-ink">Draft from an idea</h2>
            <p className="mt-2">
              Paste a plain-language project idea and Boardsmith will prefill the setup form with conservative guesses. It does not generate a
              build plan or save a project until you review and submit the fields below.
            </p>
          </div>
          <form action="/projects/draft" method="post" className="space-y-3">
            <label className="block space-y-2">
              <span className="text-sm font-semibold text-ink">Project idea</span>
              <textarea
                name="idea_text"
                rows={4}
                minLength={8}
                maxLength={2000}
                className="input"
                placeholder="Example: Bathroom wall shelf, 24 x 8 x 6 inches, 3/4 inch pine board, drill and sander available, towels only, mount into studs if possible."
              />
            </label>
            <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white shadow-soft transition hover:bg-moss/90">
              Draft setup fields
            </button>
          </form>
        </div>
      </section>

      <details className="rounded-lg border border-sawdust bg-white/90 p-5 text-sm leading-6 text-ink/70 shadow-soft" open={starterChooserOpen}>
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

      <section className="rounded-lg border border-sawdust bg-white/90 p-5 shadow-soft">
        <div>
          <h2 className="text-base font-semibold text-ink">What we need</h2>
          <p className="mt-1 max-w-2xl text-sm leading-6 text-ink/65">
            Work through the four sections, then save the setup. You can still edit details from the project page before generating.
          </p>
        </div>
        <nav aria-label="Project intake sections" className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleIntakeSections.map((section, index) => (
            <a
              key={section.id}
              href={`#${section.id}`}
              className={`rounded-lg border bg-white p-4 text-sm shadow-soft transition hover:-translate-y-0.5 hover:border-moss/60 ${
                section.tone === "ready"
                  ? "border-t-4 border-t-moss"
                  : section.tone === "warn"
                    ? "border-t-4 border-t-caution"
                    : section.tone === "review"
                      ? "border-t-4 border-t-sawdust"
                      : "border-t-4 border-t-sawdust"
              } border-sawdust`}
            >
              <span className="text-[0.68rem] font-semibold uppercase tracking-[0.14em] text-ink/50">Step {(index + 1).toString()}</span>
              <span className="mt-2 block text-base font-semibold text-ink">{section.label}</span>
              <span className="mt-1 block text-ink/65">{section.detail}</span>
              <span className={`mt-3 inline-flex rounded bg-shop px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-wide ${
                section.tone === "ready" ? "text-moss" : section.tone === "warn" ? "text-caution" : "text-ink/60"
              }`}>
                {section.status}
              </span>
            </a>
          ))}
        </nav>
      </section>

      <form id="project-intake-form" action="/projects/create" method="post" className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <ProjectIntakeFormEnhancements />
        {ideaDraftLoaded ? (
          <>
            <input type="hidden" name="draft_source" value="natural_language" />
            <input type="hidden" name="draft_status" value={ideaDraftStatus ?? ""} />
          </>
        ) : null}
        <div className="min-w-0 space-y-8">
        <div className="rounded-lg border border-sawdust bg-white/90 p-4 shadow-soft">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-xl text-sm leading-6 text-ink/70">
              Fill project, size, mounting, and tool details. Save when the setup is accurate enough to review.
            </p>
            <p className="w-fit rounded-md border border-sawdust bg-shop px-3 py-2 text-xs font-semibold uppercase tracking-wide text-ink/60">
              Save and review project when ready
            </p>
          </div>
        </div>

        <section id="project-basics" className="scroll-mt-24 space-y-5 rounded-lg border border-sawdust bg-white p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <SectionIcon label="1" />
            <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">Project</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">Give this project a name and choose the closest type. You can refine details after the setup is saved.</p>
            </div>
          </div>
          <Field label="Project title" help="Use a plain name you will recognize in the project list.">
            <input name="title" required minLength={2} className="input" placeholder="Example: Small bathroom wall shelf" defaultValue={formValues?.title} />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Project type" help="Pick the closest match. Boardsmith will use this to ask the right questions.">
              <select name="project_type" required className="input" defaultValue={selectedProjectType}>
                {selectedProjectType === "" ? <option value="">Choose a supported project type</option> : null}
                {intakeProjectTypes.map((type) => (
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

        <section id="size-material" className="scroll-mt-24 space-y-5 rounded-lg border border-sawdust bg-white p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <SectionIcon label="2" />
            <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">{needsSupportedTemplateChoice ? "Size and material" : "Size and board"}</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">
              {needsSupportedTemplateChoice
                ? "Keep only measurements and material details you already know. Choose a supported template before treating this as a build setup."
                : "Measure the space where the shelf will go. Use inches. Estimates are okay because you will review before cutting."}
            </p>
            </div>
          </div>

          <div className="rounded-md border border-moss/25 bg-moss/10 p-4 text-sm leading-6 text-ink/75">
            <p className="font-semibold text-ink">{needsSupportedTemplateChoice ? "Known size details" : "Shelf size"}</p>
            <p className="mt-1">
              {needsSupportedTemplateChoice
                ? "Review the measurements from the idea. Boardsmith will not use them as build truth until the idea fits a supported template."
                : "For one wall shelf, fill in width, depth from the wall, board thickness, and material. Add total height only for multi-shelf units, side panels, front lips, or visible brackets."}
            </p>
          </div>

          <details className="rounded-md border border-sawdust bg-shop/40 p-4 text-sm leading-6 text-ink/70">
            <summary className="cursor-pointer font-semibold text-ink">Need help measuring?</summary>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {measurementGuide.map((item) => (
                <div key={item.label}>
                  <p className="font-semibold text-ink">
                    {item.label} = {item.cue}
                  </p>
                  <p className="mt-1">{item.example}</p>
                </div>
              ))}
            </div>
          </details>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label={needsSupportedTemplateChoice ? "Template layout, if applicable" : "Shelf layout"}
              help={
                needsSupportedTemplateChoice
                  ? "Leave this for later unless you intentionally convert the idea to a supported wall-shelf template."
                  : "For wall shelf projects, choose whether this is one shelf, separate shelves, or one connected unit."
              }
            >
              <select name="shelf_layout" className="input" defaultValue={selectedShelfLayout}>
                {needsSupportedTemplateChoice ? <option value="">Choose layout after template</option> : null}
                {shelfLayoutOptions.map((layout) => (
                  <option key={layout} value={layout}>
                    {shelfLayoutLabels[layout]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label={needsSupportedTemplateChoice ? "Count, if applicable" : "Number of shelves"}
              help={
                needsSupportedTemplateChoice
                  ? "Only use this when the selected supported template needs a count."
                : "Use 1 for a single shelf. Required for multiple shelves or connected shelf units."
              }
            >
              <input name="shelf_count" type="number" min="1" max="20" step="1" className="input" placeholder="1" defaultValue={selectedShelfCount} />
            </Field>
            <Field label={needsSupportedTemplateChoice ? "Width, inches" : "Shelf width, inches"} help="Left to right. Example: 24 in.">
              <input name="width_inches" required type="number" min="0.1" max="240" step="any" className="input" placeholder="Example: 24" defaultValue={formValues?.width_inches} />
            </Field>
            <Field
              label={needsSupportedTemplateChoice ? "Depth, inches" : "Shelf depth from wall, inches"}
              help={needsSupportedTemplateChoice ? "Front-to-back depth if known. Example: 6-12 in." : "How far the shelf sticks out. Example: 6-8 in."}
            >
              <input name="depth_inches" required type="number" min="0" max="240" step="any" className="input" placeholder="Example: 8" defaultValue={formValues?.depth_inches} />
            </Field>
            <Field label="Actual board thickness, inches" help="Thickness of the real board. A common 1x board is usually 0.75 in thick.">
              <input
                name="material_thickness_inches"
                required
                type="number"
                min="0.03125"
                max="12"
                step="any"
                className="input"
                placeholder="Example: 0.75"
                defaultValue={formValues?.material_thickness_inches}
              />
            </Field>
            <Field label="Board size from store" help="Store names are approximate. Boardsmith uses the actual dimensions above for the plan.">
              <select name="board_size" className="input" defaultValue={selectedBoardSize}>
                {boardSizeOptions.map((option) => (
                  <option key={option} value={option}>
                    {boardSizeLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Measurement confidence" help="Tell Boardsmith whether these numbers are final or still rough.">
              <select name="measurement_confidence" className="input" defaultValue={selectedMeasurementConfidence}>
                {measurementConfidenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {measurementConfidenceLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          {showShelfDepthWarning ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm leading-6 text-amber-950">
              A shelf usually needs a depth greater than 0. Did you mean how far it should stick out from the wall? Use 0 only for flat wall art or signs.
            </p>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Board material" help="Name the real or likely material, such as pine, common board, poplar, oak, plywood, MDF, or not sure.">
              <input
                name="material_type"
                required
                minLength={2}
                className="input"
                placeholder="Pine, common board, poplar, plywood, or not sure"
                defaultValue={formValues?.material_type}
              />
            </Field>
          </div>

          <details className="rounded-md border border-sawdust bg-white p-4 text-sm leading-6 text-ink/70">
            <summary className="cursor-pointer font-semibold text-ink">Extra details only if needed</summary>
            <p className="mt-2 text-ink/60">Open this for multiple shelves, visible brackets, front lips, side panels, or a connected shelf unit.</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <Field label="Shelf spacing, inches, optional" help="Approximate open space between shelves. Leave blank if not sure yet.">
                <input
                  name="shelf_spacing_inches"
                  type="number"
                  min="0.1"
                  max="120"
                  step="any"
                  className="input"
                  placeholder="Optional"
                  defaultValue={formValues?.shelf_spacing_inches}
                />
              </Field>
              <Field label="Total project height, inches, optional" help="Only needed if the shelf has a front lip, side panels, brackets with visible height, or if this is a multi-shelf unit.">
                <input
                  name="height_inches"
                  type="number"
                  min="0.1"
                  max="240"
                  step="any"
                  className="input"
                  placeholder="Optional"
                  defaultValue={formValues?.height_inches}
                />
              </Field>
            </div>
          </details>
        </section>

        <section id="mounting-safety" className="scroll-mt-24 space-y-5 rounded-lg border border-sawdust bg-white p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <SectionIcon label="3" />
            <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">Mounting and safety</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">
              {needsSupportedTemplateChoice
                ? 'Capture known safety context without treating the idea as build-ready. Choose "not sure" when needed.'
                : 'Wall shelves depend on the wall, supports, fasteners, and what they will hold. Choose "not sure" when needed.'}
            </p>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How do you want to mount it?" help="This affects the plan and the review questions Boardsmith will show later.">
              <select name="mounting_method" className="input" defaultValue={selectedMountingMethod}>
                {mountingMethodOptions.map((option) => (
                  <option key={option} value={option}>
                    {mountingMethodLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="What will it mount into?" help="Use not sure if the wall type or stud location has not been checked.">
              <select name="wall_type" className="input" defaultValue={selectedWallType}>
                {wallTypeOptions.map((option) => (
                  <option key={option} value={option}>
                    {wallTypeLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Can you attach to studs?" help="Stud access is a review item; Boardsmith does not certify wall safety or load capacity.">
              <select name="stud_access" className="input" defaultValue={selectedStudAccess}>
                {studAccessOptions.map((option) => (
                  <option key={option} value={option}>
                    {studAccessLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={needsSupportedTemplateChoice ? "What will it hold?" : "What will the shelf hold?"} help="Expected load changes warnings. Heavy items always need manual review.">
              <select name="shelf_load" className="input" defaultValue={selectedShelfLoad}>
                {shelfLoadOptions.map((option) => (
                  <option key={option} value={option}>
                    {shelfLoadLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Moisture exposure" help="Bathroom, sink, shower, and outdoor exposure affect finish and hardware review.">
              <select name="moisture_exposure" className="input" defaultValue={selectedMoistureExposure}>
                {moistureExposureOptions.map((option) => (
                  <option key={option} value={option}>
                    {moistureExposureLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Where on the wall will it go?" help="This helps Boardsmith ask better install and clearance questions.">
              <select name="install_location" className="input" defaultValue={selectedInstallLocation}>
                {installLocationOptions.map((option) => (
                  <option key={option} value={option}>
                    {installLocationLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Planned mounting height, optional" help="Example: center of shelf around 60 in from floor, above toilet, above towel bar.">
              <input
                name="planned_mounting_height"
                className="input"
                placeholder="Around 60 in from floor, above toilet, or not sure"
                defaultValue={formValues?.planned_mounting_height}
              />
            </Field>
            <Field label="How many supports or brackets?" help="Use not applicable for freestanding projects. Support count still needs manual review.">
              <select name="support_count" className="input" defaultValue={selectedSupportCount}>
                {supportCountOptions.map((option) => (
                  <option key={option} value={option}>
                    {supportCountLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <fieldset className="rounded-md border border-sawdust p-4">
            <legend className="px-1 text-sm font-semibold text-ink">{needsSupportedTemplateChoice ? "Is this idea in a higher-risk spot?" : "Is this shelf in a higher-risk spot?"}</legend>
            <p className="mt-1 text-sm text-ink/60">Check every item that applies. These create review prompts, not automatic approval.</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {higherRiskSpotOptions.map((option) => (
                <label key={option} className="flex items-center gap-2 rounded-md bg-shop/60 px-3 py-2 text-sm text-ink/75">
                  <input
                    name="higher_risk_spots"
                    type="checkbox"
                    value={option}
                    className="h-4 w-4 accent-moss"
                    defaultChecked={selectedHigherRiskSpots.includes(option)}
                  />
                  {higherRiskSpotLabels[option]}
                </label>
              ))}
            </div>
          </fieldset>

          <Field label="Anything behind or near the shelf location?" help="Examples: tile, mirror, outlet, plumbing, towel bar, vent, cabinet, or door swing.">
            <textarea
              name="wall_obstructions"
              rows={3}
              className="input"
              placeholder="Tile wall, nearby mirror, plumbing, towel bar, outlet, door swing, or not sure."
              defaultValue={formValues?.wall_obstructions}
            />
          </Field>

          <section className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
            <p className="font-semibold">Final mounting check required.</p>
            <p className="mt-1">
              Boardsmith can help plan the shelf, but final wall structure, anchors, fasteners, and load capacity still need human review.
            </p>
          </section>
        </section>

        <section id="tools-finish" className="scroll-mt-24 space-y-5 rounded-lg border border-sawdust bg-white p-5 shadow-soft">
          <div className="flex items-start gap-4">
            <SectionIcon label="4" />
            <div>
            <h2 className="font-serif text-2xl font-semibold text-ink">Tools and finish</h2>
            <p className="mt-1 text-sm leading-6 text-ink/65">Select only the tools you already have and know how to use safely.</p>
            </div>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-ink">Tools available</legend>
            <div className="mt-1 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-ink/60">Not sure yet? Select the basic layout tools you have now, then regenerate later if your tool list changes.</p>
              <button
                type="button"
                data-basic-tools
                className="w-fit rounded-md border border-sawdust bg-white px-3 py-2 text-sm font-semibold text-ink hover:border-moss"
              >
                Quick select: Basic layout tools
              </button>
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {toolGroups.map((group) => (
                <div key={group.label} className="rounded-md border border-sawdust p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-ink/55">{group.label}</p>
                  <div className="mt-2 grid gap-2">
                    {group.tools.map((tool) => (
                      <label key={tool} className="flex items-center gap-2 rounded-md bg-shop/60 px-3 py-2 text-sm text-ink/75">
                        <input
                          name="tools_available"
                          type="checkbox"
                          value={tool}
                          className="h-4 w-4 accent-moss"
                          defaultChecked={formValues?.tools_available.includes(tool)}
                        />
                        {toolLabels[tool]}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="How will the board be cut?" help="Store-cut or pre-cut boards can keep beginner plans from assuming you own every saw.">
              <select name="cut_strategy" className="input" defaultValue={selectedCutStrategy}>
                {cutStrategyOptions.map((option) => (
                  <option key={option} value={option}>
                    {cutStrategyLabels[option]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Finish, optional" help="Example: painted white, clear coat, moisture-resistant finish.">
              <input name="finish_preference" className="input" placeholder="Painted white, clear coat, or not sure" defaultValue={formValues?.finish_preference} />
            </Field>
            <Field label="Edges, optional" help="Example: sanded edges, rounded front corners, eased edges.">
              <input name="edge_treatment" className="input" placeholder="Sanded edges, rounded corners, or not sure" defaultValue={formValues?.edge_treatment} />
            </Field>
          </div>

          <Field label="Anything else Boardsmith should know?" help="Add anything uncertain, unusual, or not covered above. For example: near a shower, over a toilet, hidden brackets preferred, avoid heavy storage, confirm bracket size later.">
            <textarea
              name="intended_use"
              rows={4}
              className="input"
              placeholder="Near a shower, over a toilet, hidden brackets preferred, avoid heavy storage, confirm bracket size later."
              defaultValue={formValues?.intended_use}
            />
          </Field>
          <input name="style_notes" type="hidden" value={formValues?.style_notes ?? ""} />
        </section>

        </div>

        <aside className="min-w-0 lg:sticky lg:top-6 lg:self-start">
          <div className="space-y-6">
            <ProjectIntakeLiveSummary />
            <section className="rounded-lg border border-moss bg-moss p-5 text-white shadow-soft">
              <p className="text-sm font-semibold">Maker&apos;s tip</p>
              <p className="mt-3 text-sm leading-6 text-white/85">
                {needsSupportedTemplateChoice
                  ? "Choose a supported template only when the idea honestly fits one. Unsupported concepts should stay at review guidance instead of becoming build packets."
                  : "For wall shelves, note nearby outlets, plumbing, tile, mirrors, and towel bars now. Those details help Boardsmith ask safer review questions before mounting."}
              </p>
            </section>
            {ideaDraftStatus === "concept_only" || ideaDraftStatus === "unsupported" ? (
              <label className="block rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <span className="flex items-start gap-3">
                  <input name="draft_resolution" type="checkbox" value="supported_template_selected" required className="mt-1 h-4 w-4 accent-moss" />
                  <span>
                    <span className="block font-semibold">I am intentionally choosing a supported template.</span>
                    <span className="mt-1 block">
                      Save only if this idea honestly fits the selected project type. Boardsmith will not create a full build packet for unsupported concepts.
                    </span>
                  </span>
                </span>
              </label>
            ) : null}
            <button type="submit" className="w-full rounded-md bg-moss px-4 py-3 text-sm font-semibold text-white shadow-soft transition hover:bg-moss/90 active:scale-[0.99]">
              <ProjectIntakeSubmitLabel />
            </button>
          </div>
        </aside>
      </form>
      </div>
    </div>
  );
}

function SectionIcon({ label }: { label: string }) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-moss text-sm font-semibold text-white shadow-soft">
      {label}
    </span>
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
