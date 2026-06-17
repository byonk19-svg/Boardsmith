import { revalidatePath } from "next/cache";
import { NextResponse } from "next/server";
import { classifyGenerationFailure } from "@/lib/ai/generation-feedback";
import { generateRevisedStructuredProjectPlan } from "@/lib/ai/generate-project-plan";
import { createGatedBuildPacketSnapshots, latestGatedBuildPacketSnapshot } from "@/lib/plans/gated-build-packet-snapshot";
import { maxRevisionInstructionLength, normalizeRevisionInstruction } from "@/lib/plans/revision-input";
import { evaluateProjectWriteCommand, evaluateRevisionCommand } from "@/lib/projects/project-planning-lifecycle";
import { getProject, listGeneratedPlans, markProjectGenerationFailed, saveGeneratedPlan } from "@/lib/storage/project-store";

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
    await markProjectGenerationFailed(project.id);
    revalidatePath(`/projects/${project.id}`);
    return NextResponse.redirect(new URL(`/projects/${project.id}?generation_error=${reason}`, request.url), 303);
  }
}
