import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { classifyGenerationFailure } from "@/lib/ai/generation-feedback";
import { generateRevisedStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { maxRevisionInstructionLength, normalizeRevisionInstruction } from "@/lib/plans/revision-input";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, listGeneratedPlans, markProjectGenerationFailed, saveGeneratedPlan } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
  }

  if (typeof project.archived_at === "string" && project.archived_at.length > 0) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=archived`, request.url), 303);
  }

  const formData = await request.formData();
  const revisionInstruction = normalizeRevisionInstruction(formData.get("revision_instruction"));
  if (revisionInstruction.length === 0) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=empty`, request.url), 303);
  }
  if (revisionInstruction.length > maxRevisionInstructionLength) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=too_long`, request.url), 303);
  }

  const plans = await listGeneratedPlans(project.id);
  if (plans.length === 0) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=no_plan`, request.url), 303);
  }
  const latestPlan = plans.find((plan) => plan.is_latest) ?? plans[0];

  try {
    const buildModel =
      latestPlan.build_model_json ?? createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
    const result = await generateRevisedStructuredProjectPlan({
      project,
      buildModel,
      latestPlan,
      revisionInstruction,
    });
    await saveGeneratedPlan({
      projectId: project.id,
      modelName: result.modelName,
      plan: result.plan,
      buildModel,
    });
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?revised=1&compare_plan=${latestPlan.id}`, request.url), 303);
  } catch (error) {
    const reason = classifyGenerationFailure(error);
    await markProjectGenerationFailed(project.id);
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=${reason}`, request.url), 303);
  }
}
