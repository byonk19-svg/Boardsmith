"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { generateStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createBuildModelDraft } from "@/lib/build-model/create-build-model-draft";
import { parseProjectFormData } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { createProject, getProject, saveGeneratedPlan } from "@/lib/storage/project-store";
import { getTemplateHint } from "@/lib/templates/template-hints";

export async function createProjectAction(formData: FormData): Promise<void> {
  const project = await createProject(parseProjectFormData(formData));
  revalidatePath("/");
  revalidatePath("/projects");
  redirect(`/projects/${project.id}`);
}

export async function generateProjectPlanAction(formData: FormData): Promise<void> {
  const rawProjectId = formData.get("project_id");
  const projectId = typeof rawProjectId === "string" ? rawProjectId : "";
  const project = await getProject(projectId);
  if (!project) {
    redirect("/projects?error=Project%20not%20found");
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
    redirect(`/projects/${project.id}?generated=1`);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Plan generation failed.";
    redirect(`/projects/${project.id}?error=${encodeURIComponent(message)}`);
  }
}
