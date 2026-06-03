import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { createProjectIntakeDraft, encodeProjectIntakeDraft, projectIntakeDraftCookieName } from "@/lib/projects/intake-draft";
import { parseProjectFormData } from "@/lib/projects/types";
import { createProject } from "@/lib/storage/project-store";

export async function POST(request: Request): Promise<Response> {
  let formData: FormData | undefined;

  try {
    formData = await request.formData();
    const project = await createProject(parseProjectFormData(formData));
    revalidatePath("/");
    revalidatePath("/projects");
    const response = NextResponse.redirect(new URL(`/projects/${project.id}`, request.url), 303);
    response.cookies.set(projectIntakeDraftCookieName, "", {
      maxAge: 0,
      path: "/projects/new",
    });
    return response;
  } catch (error) {
    void error;
    const response = NextResponse.redirect(new URL("/projects/new?error=invalid_intake", request.url), 303);

    if (formData) {
      response.cookies.set(projectIntakeDraftCookieName, encodeProjectIntakeDraft(createProjectIntakeDraft(formData)), {
        httpOnly: true,
        maxAge: 300,
        path: "/projects/new",
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  }
}
