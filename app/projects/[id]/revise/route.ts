import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { classifyGenerationFailure } from "@/lib/ai/generation-feedback";
import { generateRevisedStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createGatedBuildPacketSnapshots, latestGatedBuildPacketSnapshot } from "@/lib/plans/gated-build-packet-snapshot";
import { classifyRevisionIntent, revisionIntentCategoryLabels } from "@/lib/plans/revision-intent";
import { maxRevisionInstructionLength, normalizeRevisionInstruction } from "@/lib/plans/revision-input";
import { createProjectIntakeRevisionDecision } from "@/lib/projects/project-intake-revision";
import { evaluateProjectWriteCommand, evaluateRevisionCommand } from "@/lib/projects/project-planning-lifecycle";
import { getProject, listGeneratedPlans, markProjectGenerationFailed, saveGeneratedPlan, updateProjectStructuredRevision } from "@/lib/storage/project-store";

export async function POST(request: Request, context: { params: Promise<{ id: string }> }): Promise<Response> {
  const { id } = await context.params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.redirect(new URL("/projects?error=Project%20not%20found", request.url), 303);
  }

  const writeDecision = evaluateProjectWriteCommand(project);
  if (!writeDecision.allowed) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=${writeDecision.reason}`, request.url), 303);
  }

  const formData = await request.formData();
  const revisionInstruction = normalizeRevisionInstruction(formData.get("revision_instruction"));
  if (revisionInstruction.length === 0) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=empty`, request.url), 303);
  }
  if (revisionInstruction.length > maxRevisionInstructionLength) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=too_long`, request.url), 303);
  }

  const plans = await listGeneratedPlans(project.id);
  const revisionDecision = evaluateRevisionCommand(project, { hasLatestPlan: plans.length > 0 });
  if (!revisionDecision.allowed) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=${revisionDecision.reason}`, request.url), 303);
  }
  const latestPlanSnapshot = latestGatedBuildPacketSnapshot(createGatedBuildPacketSnapshots({ project, plans }));
  if (!latestPlanSnapshot) {
    return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=no_plan`, request.url), 303);
  }
  const latestPlan = latestPlanSnapshot.plan;
  const revisionIntent = classifyRevisionIntent(revisionInstruction);
  if (revisionIntent.decision === "requires_structured_update") {
    const intakeRevision = createProjectIntakeRevisionDecision(project, revisionIntent);
    if (intakeRevision.decision === "apply_safe_patch") {
      const updatedProject = await updateProjectStructuredRevision(project.id, intakeRevision.patch);
      revalidatePath(`/projects/${project.id}`);
      if (!updatedProject) {
        return NextResponse.redirect(new URL(`/projects/${project.id}?revision_error=archived`, request.url), 303);
      }

      return NextResponse.redirect(new URL(`/projects/${project.id}?structured_revision=updated&clarification_status=${intakeRevision.clarificationGateDecision.status}#project-intake`, request.url), 303);
    }
  }
  if (revisionIntent.decision !== "allow_direct_revision" && revisionIntent.messageKey) {
    return redirectRevisionFailure(request, project.id, revisionIntent.messageKey, revisionIntent.categories);
  }

  try {
    const result = await generateRevisedStructuredProjectPlan({
      project,
      buildModel: latestPlanSnapshot.buildModel,
      latestPlan,
      revisionInstruction,
    });
    await saveGeneratedPlan({
      projectId: project.id,
      modelName: result.modelName,
      plan: result.plan,
      buildModel: latestPlanSnapshot.buildModel,
    });
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?revised=1&compare_plan=${latestPlan.id}`, request.url), 303);
  } catch (error) {
    const reason = classifyGenerationFailure(error);
    if (reason !== "archived") {
      await markProjectGenerationFailed(project.id);
    }
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=${reason}`, request.url), 303);
  }
}

function redirectRevisionFailure(request: Request, projectId: string, messageKey: NonNullable<ReturnType<typeof classifyRevisionIntent>["messageKey"]>, categories: ReturnType<typeof classifyRevisionIntent>["categories"]) {
  const categoryLabels = revisionIntentCategoryLabels(categories);
  const categoryQuery = categoryLabels.length > 0 ? `&revision_categories=${encodeURIComponent(categoryLabels.join(","))}` : "";
  const hash = messageKey === "structured_change_required" ? "#project-intake" : messageKey === "safety_sensitive_change" ? "#plan-readiness" : "#tweak-this-plan";

  return NextResponse.redirect(new URL(`/projects/${projectId}?revision_error=${messageKey}${categoryQuery}${hash}`, request.url), 303);
}
