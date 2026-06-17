import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { evaluateRestoreCommand } from "@/lib/projects/project-planning-lifecycle";
import { getProject, restoreProject } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const formData = await request.formData().catch(() => null);
    const existingProject = await getProject(id);
    if (!existingProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }
    const restoreDecision = evaluateRestoreCommand(existingProject);
    if (!restoreDecision.allowed) {
      if (formData?.get("return_to") === "archived_list") {
        return NextResponse.redirect(new URL("/projects?archive=archived&error=project_not_archived", request.url), 303);
      }
      return NextResponse.redirect(new URL(`/projects/${id}?error=project_not_archived`, request.url), 303);
    }

    const project = await restoreProject(id);

    if (!project) {
      const latestProject = await getProject(id);
      if (latestProject && !evaluateRestoreCommand(latestProject).allowed) {
        if (formData?.get("return_to") === "archived_list") {
          return NextResponse.redirect(new URL("/projects?archive=archived&error=project_not_archived", request.url), 303);
        }
        return NextResponse.redirect(new URL(`/projects/${id}?error=project_not_archived`, request.url), 303);
      }
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    if (formData?.get("return_to") === "archived_list") {
      return NextResponse.redirect(new URL("/projects?archive=archived&restored=1", request.url), 303);
    }
    return NextResponse.redirect(new URL(`/projects/${id}?restored=1`, request.url), 303);
  } catch (error) {
    void error;
    return NextResponse.redirect(new URL(`/projects/${id}?error=restore_failed`, request.url), 303);
  }
}
