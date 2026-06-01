import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { classifyGenerationFailure } from "@/lib/ai/generation-feedback";
import { generateStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, saveGeneratedPlan } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
  }

  try {
    const buildModel = createBuildModelDraft(project, getTemplateHint(project.project_type), calculateSafetyReviewFlags(project));
    const result = await generateStructuredProjectPlan(project, buildModel);
    await saveGeneratedPlan({
      projectId: project.id,
      modelName: result.modelName,
      plan: result.plan,
      buildModel,
    });
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generated=1`, request.url), 303);
  } catch (error) {
    const reason = classifyGenerationFailure(error);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=${reason}`, request.url), 303);
  }
}
