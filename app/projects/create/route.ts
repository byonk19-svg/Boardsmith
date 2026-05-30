import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { parseProjectFormData } from "@/lib/projects/types";
import { createProject } from "@/lib/storage/project-store";

export async function POST(request: Request): Promise<Response> {
  try {
    const project = await createProject(parseProjectFormData(await request.formData()));
    revalidatePath("/");
    revalidatePath("/projects");
    return NextResponse.redirect(new URL(`/projects/${project.id}`, request.url), 303);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Project creation failed.";
    return NextResponse.redirect(new URL(`/projects/new?error=${encodeURIComponent(message)}`, request.url), 303);
  }
}
