import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { archiveProject } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const formData = await request.formData().catch(() => null);
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
    const message = error instanceof Error ? error.message : "Project could not be archived.";
    return NextResponse.redirect(new URL(`/projects/${id}?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
