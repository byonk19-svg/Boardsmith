import { generatedPlanSchema, type GeneratedPlan } from "@/lib/plans/plan-schema";

export function addRevisionAssumption(plan: GeneratedPlan, revisionInstruction: string): GeneratedPlan {
  const revisionAssumption = `Revision request: ${revisionInstruction}`;
  const nextPlan = {
    ...plan,
    assumptions: plan.assumptions.includes(revisionAssumption) ? plan.assumptions : [...plan.assumptions, revisionAssumption],
  };

  return generatedPlanSchema.parse(nextPlan);
}
