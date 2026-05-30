import Link from "next/link";
import { notFound } from "next/navigation";
import { generateProjectPlanAction } from "@/app/actions";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import type { GeneratedPlan } from "@/lib/plans/plan-schema";
import { projectTypeLabels, toolLabels, type Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";

export default async function ProjectDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; generated?: string }>;
}) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const project = await getProject(id);
  if (!project) notFound();

  const plans = await listGeneratedPlans(project.id);
  const latestPlan = plans.length > 0 ? (plans.find((plan) => plan.is_latest) ?? plans[0]) : null;
  const buildModel = latestPlan?.build_model_json ?? createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
  const buildModelSource = latestPlan?.build_model_json ? "saved" : "derived";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Link href="/projects" className="text-sm font-medium text-moss hover:underline">
            Back to projects
          </Link>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-ink">{project.title}</h1>
          <p className="mt-2 text-sm text-ink/65">
            {projectTypeLabels[project.project_type]} · {project.skill_level} · {project.status.replaceAll("_", " ")}
          </p>
        </div>
        <form action={generateProjectPlanAction} className="no-print">
          <input type="hidden" name="project_id" value={project.id} />
          <button type="submit" className="rounded-md bg-moss px-4 py-2 text-sm font-semibold text-white hover:bg-moss/90">
            Generate Plan
          </button>
        </form>
      </div>

      {query.error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-800">{query.error}</p> : null}
      {query.generated ? <p className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">Generated and saved a new validated plan version.</p> : null}

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <ProjectIntakeCard project={project} />
        <div className="rounded-lg border border-sawdust bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Safety review</h2>
          {project.safety_review_required ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {project.safety_flags.map((flag) => (
                <span key={flag} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                  {flag}
                </span>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm text-ink/65">No deterministic safety flags were triggered. User review is still required before building.</p>
          )}
          <p className="mt-4 text-sm leading-6 text-ink/65">
            Plans are aids, not professional approvals. Review dimensions, materials, tool safety, fasteners, and mounting details before cutting.
          </p>
        </div>
      </section>

      <BuildModelView buildModel={buildModel} source={buildModelSource} />

      {latestPlan ? <PlanView plan={latestPlan.plan_json} createdAt={latestPlan.created_at} modelName={latestPlan.model_name} /> : <EmptyPlanState />}

      {plans.length > 0 ? (
        <section className="no-print rounded-lg border border-sawdust bg-white p-5">
          <h2 className="text-lg font-semibold text-ink">Plan history</h2>
          <div className="mt-4 divide-y divide-sawdust">
            {plans.map((plan, index) => (
              <div key={plan.id} className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-ink">Version {plans.length - index}</p>
                  <p className="text-xs text-ink/60">
                    {new Date(plan.created_at).toLocaleString()} - {plan.model_name} - {plan.confidence_level} confidence
                  </p>
                </div>
                {plan.is_latest ? <span className="w-fit rounded-md bg-moss px-2.5 py-1 text-xs font-semibold text-white">Latest</span> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function ProjectIntakeCard({ project }: { project: Project }) {
  return (
    <section className="rounded-lg border border-sawdust bg-white p-5">
      <h2 className="text-lg font-semibold text-ink">Project intake</h2>
      <dl className="mt-4 grid gap-3 text-sm">
        <Row
          label="Dimensions"
          value={`${project.width_inches.toString()} x ${project.height_inches.toString()} x ${project.depth_inches.toString()} in`}
        />
        <Row label="Material" value={`${project.material_type}, ${project.material_thickness_inches.toString()} in thick`} />
        <Row label="Tools" value={project.tools_available.map((tool) => toolLabels[tool]).join(", ")} />
        <Row label="Intended use" value={project.intended_use} />
        {project.style_notes ? <Row label="Style notes" value={project.style_notes} /> : null}
      </dl>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-semibold text-ink/80">{label}</dt>
      <dd className="mt-1 leading-6 text-ink/65">{value}</dd>
    </div>
  );
}

function EmptyPlanState() {
  return (
    <section className="rounded-lg border border-dashed border-sawdust bg-white p-8 text-center">
      <h2 className="text-lg font-semibold text-ink">No generated plan yet</h2>
      <p className="mt-2 text-sm text-ink/65">Use Generate Plan after configuring `OPENAI_API_KEY`. Invalid generated JSON will not be saved.</p>
    </section>
  );
}

function BuildModelView({ buildModel, source }: { buildModel: BoardsmithBuildModel; source: "saved" | "derived" }) {
  return (
    <section className="rounded-lg border border-sawdust bg-white p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-ink">Project Structure</h2>
          <p className="mt-2 text-sm leading-6 text-ink/65">
            {source === "saved" ? "A deterministic planning model saved with the latest generated plan." : "A deterministic planning model derived from the project intake."} It is not CAD and does not verify safety, mounting, or load capacity.
          </p>
        </div>
        <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">
          {buildModel.confidence.level} confidence
        </span>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <StructureGroup title="Pieces">
          <div className="space-y-3">
            {buildModel.pieces.map((piece) => (
              <div key={piece.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">{piece.label}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {piece.quantity.toString()}x {piece.pieceType.replaceAll("_", " ")} - {formatBuildModelDimensions(piece.dimensions)}
                </p>
                {piece.notes.length > 0 ? <p className="mt-1 text-sm leading-6 text-ink/65">{piece.notes[0]}</p> : null}
              </div>
            ))}
          </div>
        </StructureGroup>

        <StructureGroup title="Materials">
          <div className="space-y-3">
            {buildModel.materials.map((material) => (
              <div key={material.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
                <p className="text-sm font-semibold text-ink">{material.label}</p>
                <p className="mt-1 text-xs text-ink/55">
                  {material.materialType.replaceAll("_", " ")} - {material.nominalThicknessInches ? `${material.nominalThicknessInches.toString()} in` : "thickness unknown"}
                </p>
              </div>
            ))}
          </div>
        </StructureGroup>

        <StructureGroup title="Hardware">
          {buildModel.hardware.length > 0 ? (
            <div className="space-y-3">
              {buildModel.hardware.map((item) => (
                <div key={item.id} className="border-b border-sawdust pb-3 last:border-0 last:pb-0">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="mt-1 text-xs text-ink/55">
                    {item.hardwareType.replaceAll("_", " ")} - {item.quantity ? `${item.quantity.toString()} needed` : "quantity to review"}
                  </p>
                  {item.notes.length > 0 ? <p className="mt-1 text-sm leading-6 text-ink/65">{item.notes[0]}</p> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-ink/65">No hardware placeholders were needed for this draft.</p>
          )}
        </StructureGroup>

        <StructureGroup title="Connections">
          {buildModel.connections.length > 0 ? (
            <ul className="space-y-3">
              {buildModel.connections.map((connection) => (
                <li key={connection.id} className="text-sm leading-6 text-ink/70">
                  <strong className="text-ink">{connection.connectionType.replaceAll("_", " ")}</strong>: {connection.locationDescription}
                  {connection.strengthCritical ? <span className="font-medium text-caution"> - needs review</span> : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink/65">No obvious physical connections were added yet.</p>
          )}
        </StructureGroup>

        <StructureGroup title="Operations">
          {buildModel.operations.length > 0 ? (
            <ol className="space-y-3">
              {buildModel.operations.map((operation) => (
                <li key={operation.id} className="text-sm leading-6 text-ink/70">
                  <strong className="text-ink">
                    {operation.sequenceNumber.toString()}. {operation.title}
                  </strong>
                  : {operation.description}
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-ink/65">No operations were added yet.</p>
          )}
        </StructureGroup>

        <StructureGroup title="Needs Review">
          <div className="space-y-3">
            {buildModel.safety.flags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {buildModel.safety.flags.map((flag) => (
                  <span key={flag.id} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                    {flag.message}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-ink/65">No deterministic BBM safety flags were added. Builder review is still required.</p>
            )}
            {buildModel.unresolvedQuestions.length > 0 ? <List items={buildModel.unresolvedQuestions} /> : null}
          </div>
        </StructureGroup>
      </div>

      <div className="mt-5 rounded-md bg-shop p-4">
        <p className="text-sm font-semibold text-ink">Export readiness</p>
        <p className="mt-2 text-sm leading-6 text-ink/65">
          SVG: {readinessLabel(buildModel.exportReadiness.svgCandidate)} - PDF: {readinessLabel(buildModel.exportReadiness.pdfCandidate)} - DXF:{" "}
          {readinessLabel(buildModel.exportReadiness.dxfCandidate)} - CAD: {readinessLabel(buildModel.exportReadiness.cadCandidate)}
        </p>
        {buildModel.exportReadiness.notes.length > 0 ? <p className="mt-2 text-sm leading-6 text-ink/65">{buildModel.exportReadiness.notes.join(" ")}</p> : null}
      </div>
    </section>
  );
}

function StructureGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/55">{title}</h3>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function formatBuildModelDimensions(dimensions: BoardsmithBuildModel["pieces"][number]["dimensions"]): string {
  const length = dimensions.lengthInches ? `${dimensions.lengthInches.toString()} in` : "length unknown";
  const width = dimensions.widthInches ? `${dimensions.widthInches.toString()} in` : "width unknown";
  const thickness = dimensions.thicknessInches ? `${dimensions.thicknessInches.toString()} in` : "thickness unknown";
  return `${length} x ${width} x ${thickness}`;
}

function readinessLabel(isCandidate: boolean): string {
  return isCandidate ? "candidate later" : "not enough information";
}

function PlanView({ plan, createdAt, modelName }: { plan: GeneratedPlan; createdAt: string; modelName: string }) {
  return (
    <article className="space-y-5 print:space-y-4">
      <section className="rounded-lg border border-sawdust bg-white p-6 shadow-soft">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-ink">Generated Plan</h2>
            <p className="mt-2 text-sm text-ink/60">
              {new Date(createdAt).toLocaleString()} - {modelName} - {plan.confidence_level} confidence
            </p>
          </div>
          <span className="w-fit rounded-md bg-shop px-3 py-1 text-xs font-semibold uppercase tracking-wide text-ink/70">{plan.estimated_difficulty}</span>
        </div>
        <p className="mt-5 leading-7 text-ink/75">{plan.project_summary}</p>
      </section>

      <Section title="Warnings and Safety Notes" tone="warning">
        <ul className="space-y-2">
          {plan.safety_notes.map((note) => (
            <li key={note} className="text-sm leading-6 text-ink/75">
              {note}
            </li>
          ))}
        </ul>
        {plan.needs_review_flags.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2">
            {plan.needs_review_flags.map((flag) => (
              <span key={flag} className="rounded-md bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">
                {flag}
              </span>
            ))}
          </div>
        ) : null}
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Materials">
          <ul className="space-y-3">
            {plan.materials.map((item) => (
              <li key={`${item.name}-${item.quantity}`} className="text-sm leading-6 text-ink/75">
                <strong className="text-ink">{item.quantity} {item.name}</strong>: {item.notes}
              </li>
            ))}
          </ul>
        </Section>
        <Section title="Tools">
          <ul className="space-y-2">
            {plan.tools.map((tool) => (
              <li key={tool} className="text-sm leading-6 text-ink/75">
                {tool}
              </li>
            ))}
          </ul>
        </Section>
      </div>

      <Section title="Cut List">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-sawdust text-xs uppercase tracking-wide text-ink/55">
                <th className="py-2 pr-3">Part</th>
                <th className="py-2 pr-3">Qty</th>
                <th className="py-2 pr-3">Length</th>
                <th className="py-2 pr-3">Width</th>
                <th className="py-2 pr-3">Thickness</th>
                <th className="py-2 pr-3">Material</th>
                <th className="py-2">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sawdust">
              {plan.cut_list.map((item) => (
                <tr key={`${item.part_name}-${item.quantity.toString()}`}>
                  <td className="py-3 pr-3 font-semibold text-ink">{item.part_name}</td>
                  <td className="py-3 pr-3 text-ink/70">{item.quantity}</td>
                  <td className="py-3 pr-3 text-ink/70">{item.length_inches} in</td>
                  <td className="py-3 pr-3 text-ink/70">{item.width_inches} in</td>
                  <td className="py-3 pr-3 text-ink/70">{item.thickness_inches} in</td>
                  <td className="py-3 pr-3 text-ink/70">{item.material}</td>
                  <td className="py-3 text-ink/70">{item.notes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Assembly Steps">
        <ol className="space-y-4">
          {plan.assembly_steps.map((step) => (
            <li key={step.step_number} className="rounded-md bg-shop p-4">
              <p className="font-semibold text-ink">
                {step.step_number}. {step.title}
              </p>
              <p className="mt-2 text-sm leading-6 text-ink/70">{step.instructions}</p>
              <p className="mt-2 text-xs font-medium text-ink/55">Tools: {step.tools_used.join(", ")}</p>
              {step.safety_note ? <p className="mt-2 text-sm font-medium text-caution">{step.safety_note}</p> : null}
            </li>
          ))}
        </ol>
      </Section>

      <div className="grid gap-5 lg:grid-cols-2">
        <Section title="Finishing Guide">
          <List items={plan.finishing_steps} />
        </Section>
        <Section title="Beginner Tips">
          <List items={plan.beginner_tips} />
        </Section>
        <Section title="Assumptions">
          <List items={plan.assumptions} />
        </Section>
        <Section title="SVG/PDF Readiness Notes">
          <List items={plan.svg_readiness_notes} />
        </Section>
      </div>
    </article>
  );
}

function Section({ title, children, tone = "default" }: { title: string; children: React.ReactNode; tone?: "default" | "warning" }) {
  return (
    <section className={`rounded-lg border p-5 ${tone === "warning" ? "border-amber-200 bg-amber-50" : "border-sawdust bg-white"}`}>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function List({ items }: { items: string[] }) {
  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li key={item} className="text-sm leading-6 text-ink/75">
          {item}
        </li>
      ))}
    </ul>
  );
}
