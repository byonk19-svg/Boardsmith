import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { classifyGenerationFailure } from "@/lib/ai/generation-feedback";
import { generateStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { createClarificationGateDecision } from "@/lib/projects/clarification-gate";
import { analyzeShelfLayoutIntent } from "@/lib/projects/shelf-layout-intent";
import { findBlockingShelfLayoutIssue } from "@/lib/projects/shelf-layout-validation";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getProject, markProjectGenerationFailed, saveGeneratedPlan } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
  }

  if (typeof project.archived_at === "string" && project.archived_at.length > 0) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=archived`, request.url), 303);
  }

  try {
    const clarificationGate = createClarificationGateDecision(project);

    if (clarificationGate.status === "blocked_for_safety" || clarificationGate.status === "concept_only" || clarificationGate.status === "unsupported") {
      await markProjectGenerationFailed(project.id);
      revalidatePath(`/projects/${project.id}`);
      return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=clarification_gate#plan-readiness`, request.url), 303);
    }

    if (analyzeShelfLayoutIntent(project).missingShelfCount) {
      await markProjectGenerationFailed(project.id);
      revalidatePath(`/projects/${project.id}`);
      return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=shelf_layout_missing#project-intake`, request.url), 303);
    }
    if (findBlockingShelfLayoutIssue(project)) {
      await markProjectGenerationFailed(project.id);
      revalidatePath(`/projects/${project.id}`);
      return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=shelf_layout_invalid#project-intake`, request.url), 303);
    }
    if (!clarificationGate.canGenerateFullPlan) {
      await markProjectGenerationFailed(project.id);
      revalidatePath(`/projects/${project.id}`);
      return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=clarification_gate#plan-readiness`, request.url), 303);
    }

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
    await markProjectGenerationFailed(project.id);
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=${reason}`, request.url), 303);
  }
}
