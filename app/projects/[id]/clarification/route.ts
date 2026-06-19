import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { createClarificationAnswerUpdate } from "@/lib/projects/clarification-answer-loop";
import { evaluateProjectWriteCommand } from "@/lib/projects/project-planning-lifecycle";
import { getProject, updateProjectClarificationAnswers } from "@/lib/storage/project-store";

function clarificationAnswerErrorCode(error: unknown): string {
  if (error instanceof ZodError) return "clarification_answers_invalid";
  if (error instanceof Error && /schema cache|column/i.test(error.message)) return "clarification_answers_schema_missing";

  return "clarification_answers_failed";
}

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;

  try {
    const existingProject = await getProject(id);
    if (!existingProject) {
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }
    const writeDecision = evaluateProjectWriteCommand(existingProject);
    if (!writeDecision.allowed) {
      return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived#plan-readiness`, request.url), 303);
    }

    const formData = await request.formData();
    const answerUpdate = createClarificationAnswerUpdate(existingProject, formData);
    const project = await updateProjectClarificationAnswers(id, answerUpdate.update);

    if (!project) {
      const latestProject = await getProject(id);
      if (latestProject && !evaluateProjectWriteCommand(latestProject).allowed) {
        return NextResponse.redirect(new URL(`/projects/${id}?error=project_archived#plan-readiness`, request.url), 303);
      }
      return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
    }

    revalidatePath(`/projects/${id}`);
    return NextResponse.redirect(new URL(`/projects/${id}?clarification_answers=updated&clarification_status=${answerUpdate.nextDecision.status}#plan-readiness`, request.url), 303);
  } catch (error) {
    const errorCode = clarificationAnswerErrorCode(error);
    console.error("Project clarification answers update failed", { projectId: id, error });
    return NextResponse.redirect(new URL(`/projects/${id}?error=${errorCode}#plan-readiness`, request.url), 303);
  }
}
