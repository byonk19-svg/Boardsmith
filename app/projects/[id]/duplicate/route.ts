import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { evaluateProjectWriteCommand } from "@/lib/projects/project-planning-lifecycle";
import { duplicateProject, getProject } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const sourceProject = await getProject(id);
    if (!sourceProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }
    const writeDecision = evaluateProjectWriteCommand(sourceProject);
    if (!writeDecision.allowed) {
      return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived`, request.url), 303);
    }

    const duplicatedProject = await duplicateProject(id);
    if (!duplicatedProject) {
      const latestProject = await getProject(id);
      if (latestProject && !evaluateProjectWriteCommand(latestProject).allowed) {
        return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived`, request.url), 303);
      }
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${duplicatedProject.id}`);
    return NextResponse.redirect(new URL(`/projects/${duplicatedProject.id}?duplicated=1`, request.url), 303);
  } catch (error) {
    void error;
    return NextResponse.redirect(new URL(`/projects/${id}?error=duplicate_failed`, request.url), 303);
  }
}
