import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { evaluateProjectWriteCommand } from "@/lib/projects/project-planning-lifecycle";
import { getProject, updateProjectNotes } from "@/lib/storage/project-store";

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
    const notesValue = formData.get("notes");
    const notes = typeof notesValue === "string" ? notesValue : "";
    const project = await updateProjectNotes(id, notes);

    if (!project) {
      const latestProject = await getProject(id);
      if (latestProject && !evaluateProjectWriteCommand(latestProject).allowed) {
        return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived`, request.url), 303);
      }
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath(`/projects/${id}`);
    return NextResponse.redirect(new URL(`/projects/${id}?notes=updated`, request.url), 303);
  } catch (error) {
    void error;
    return NextResponse.redirect(new URL(`/projects/${id}?error=notes_failed`, request.url), 303);
  }
}
