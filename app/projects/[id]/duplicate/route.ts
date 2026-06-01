import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { duplicateProject } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const duplicatedProject = await duplicateProject(id);
    if (!duplicatedProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath("/");
    revalidatePath("/projects");
    revalidatePath(`/projects/${duplicatedProject.id}`);
    return NextResponse.redirect(new URL(`/projects/${duplicatedProject.id}?duplicated=1`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project duplication failed.";
    return NextResponse.redirect(new URL(`/projects/${id}?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
