import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { evaluateArchiveCommand } from "@/lib/projects/project-planning-lifecycle";
import { archiveProject, getProject } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const formData = await request.formData().catch(() => null);
    const existingProject = await getProject(id);
    if (!existingProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }
    const archiveDecision = evaluateArchiveCommand(existingProject);
    if (!archiveDecision.allowed) {
      if (formData?.get("return_to") === "project_detail") {
        return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived`, request.url), 303);
      }
      return NextResponse.redirect(new URL("/projects?error=project_archived", request.url), 303);
    }

    const project = await archiveProject(id);

    if (!project) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${id}`);
    if (formData?.get("return_to") === "project_detail") {
      return NextResponse.redirect(new URL(`/projects/${id}?archived=1`, request.url), 303);
    }
    return NextResponse.redirect(new URL("/projects?archived=1", request.url), 303);
  } catch (error) {
    void error;
    return NextResponse.redirect(new URL(`/projects/${id}?error=archive_failed`, request.url), 303);
  }
}
