import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  createProjectIntakeDraft,
  decodeProjectIntakeDraft,
  encodeProjectIntakeDraft,
  projectIntakeDraftCookieName,
  projectIntakeDraftCookiePath,
  type ProjectIntakeDraft,
} from "@/lib/projects/intake-draft";
import { parseProjectFormData } from "@/lib/projects/types";
import { createProject } from "@/lib/storage/project-store";

function preserveDraftRedirect(request: Request, formData: FormData, path: string, trustedDraft?: ProjectIntakeDraft): Response {
  if (trustedDraft?.draft_source === "natural_language") {
    formData.set("draft_source", "natural_language");
    formData.set("draft_status", trustedDraft.draft_status ?? "");
    formData.delete("draft_missing_fields");
    formData.delete("draft_blocked_reasons");
    formData.delete("draft_review_notes");
    trustedDraft.draft_missing_fields?.forEach((field) => formData.append("draft_missing_fields", field));
    trustedDraft.draft_blocked_reasons?.forEach((reason) => formData.append("draft_blocked_reasons", reason));
    trustedDraft.draft_review_notes?.forEach((note) => formData.append("draft_review_notes", note));
  }

  const response = NextResponse.redirect(new URL(path, request.url), 303);
  response.cookies.set(projectIntakeDraftCookieName, encodeProjectIntakeDraft(createProjectIntakeDraft(formData)), {
    httpOnly: true,
    maxAge: 300,
    path: projectIntakeDraftCookiePath,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function POST(request: Request): Promise<Response> {
  let formData: FormData | undefined;

  try {
    formData = await request.formData();

    const trustedDraft = decodeProjectIntakeDraft((await cookies()).get(projectIntakeDraftCookieName)?.value);
    const trustedNaturalLanguageDraft = trustedDraft.draft_source === "natural_language" ? trustedDraft : undefined;
    const draftSource = trustedNaturalLanguageDraft?.draft_source ?? formData.get("draft_source");
    const draftStatus = trustedNaturalLanguageDraft?.draft_status ?? formData.get("draft_status");
    const draftResolution = formData.get("draft_resolution");
    if (draftSource === "natural_language" && draftStatus === "blocked_for_safety") {
      return preserveDraftRedirect(request, formData, "/projects/new?draft=idea&error=blocked_idea", trustedNaturalLanguageDraft);
    }
    if (
      draftSource === "natural_language" &&
      (draftStatus === "concept_only" || draftStatus === "unsupported") &&
      draftResolution !== "supported_template_selected"
    ) {
      return preserveDraftRedirect(request, formData, "/projects/new?draft=idea&error=unresolved_idea", trustedNaturalLanguageDraft);
    }

    const project = await createProject(parseProjectFormData(formData));
    revalidatePath("/");
    revalidatePath("/projects");
    const response = NextResponse.redirect(new URL(`/projects/${project.id}`, request.url), 303);
    response.cookies.set(projectIntakeDraftCookieName, "", {
      maxAge: 0,
      path: projectIntakeDraftCookiePath,
    });
    return response;
  } catch (error) {
    void error;
    const response = NextResponse.redirect(new URL("/projects/new?error=invalid_intake", request.url), 303);

    if (formData) {
      response.cookies.set(projectIntakeDraftCookieName, encodeProjectIntakeDraft(createProjectIntakeDraft(formData)), {
        httpOnly: true,
        maxAge: 300,
        path: projectIntakeDraftCookiePath,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
      });
    }

    return response;
  }
}
