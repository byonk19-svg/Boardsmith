import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { evaluateProjectWriteCommand } from "@/lib/projects/project-planning-lifecycle";
import { projectBuildLogSchema } from "@/lib/projects/types";
import { getProject, updateProjectBuildLog } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const existingProject = await getProject(id);
    if (!existingProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }
    const writeDecision = evaluateProjectWriteCommand(existingProject);
    if (!writeDecision.allowed) {
      return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived`, request.url), 303);
    }

    const formData = await request.formData();
    const buildLog = projectBuildLogSchema.parse({
      build_completed: formData.get("build_completed") === "on",
      build_completed_at: formValue(formData, "build_completed_at"),
      build_actual_material: formValue(formData, "build_actual_material"),
      build_plan_changes: formValue(formData, "build_plan_changes"),
      build_lessons_learned: formValue(formData, "build_lessons_learned"),
    });
    const project = await updateProjectBuildLog(id, buildLog);

    if (!project) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath(`/projects/${id}`);
    return NextResponse.redirect(new URL(`/projects/${id}?build_log=updated`, request.url), 303);
  } catch (error) {
    void error;
    return NextResponse.redirect(new URL(`/projects/${id}?error=build_log_failed`, request.url), 303);
  }
}

function formValue(formData: FormData, name: string): string {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}
