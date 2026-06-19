import { NextResponse } from "next/server";
import {
  createProjectIntakeDraft,
  encodeProjectIntakeDraft,
  projectIntakeDraftCookieName,
  projectIntakeDraftCookiePath,
} from "@/lib/projects/intake-draft";
import { naturalLanguageDraftToFormData, parseNaturalLanguageIntake } from "@/lib/projects/natural-language-intake";

export async function POST(request: Request): Promise<Response> {
  const formData = await request.formData();
  const rawIdea = formData.get("idea_text");
  const ideaText = typeof rawIdea === "string" ? rawIdea.trim() : "";

  if (ideaText.length < 8) {
    return NextResponse.redirect(new URL("/projects/new?error=invalid_idea", request.url), 303);
  }

  const result = parseNaturalLanguageIntake(ideaText);
  const draftFormData = naturalLanguageDraftToFormData(result.draft);
  draftFormData.set("draft_source", "natural_language");
  result.missingFields.forEach((field) => draftFormData.append("draft_missing_fields", field));
  result.blockedReasons.forEach((reason) => draftFormData.append("draft_blocked_reasons", reason));
  result.reviewNotes.forEach((note) => draftFormData.append("draft_review_notes", note));
  const response = NextResponse.redirect(new URL("/projects/new?draft=idea", request.url), 303);

  response.cookies.set(projectIntakeDraftCookieName, encodeProjectIntakeDraft(createProjectIntakeDraft(draftFormData)), {
    httpOnly: true,
    maxAge: 300,
    path: projectIntakeDraftCookiePath,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
