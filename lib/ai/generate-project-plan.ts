import OpenAI from "openai";
import { generatedPlanJsonSchema, generatedPlanSchema, type GeneratedPlan } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";

export type GenerateProjectPlanResult = {
  plan: GeneratedPlan;
  modelName: string;
};

function buildPrompt(project: Project): string {
  const safetyFlags = calculateSafetyReviewFlags(project);
  const hint = getTemplateHint(project.project_type);

  return JSON.stringify(
    {
      task: "Generate a detailed beginner-friendly woodworking project plan. Do not invent uncontrolled dimensions. Use the provided dimensions as the bounding source of truth, and call out assumptions where detail is missing.",
      project,
      deterministic_safety_flags: safetyFlags,
      template_hints: hint,
      safety_rules: [
        "Include safety disclaimers.",
        "Warn that the plan requires user review before cutting or building.",
        "Do not make structural, load-bearing, child-furniture, or professional safety guarantees.",
        "Do not tell minors to use dangerous tools.",
        "Do not recommend bypassing guards or PPE.",
        "For wall-mounted items include stud/anchor caution.",
        "Include a practical measure twice, cut once warning.",
      ],
    },
    null,
    2,
  );
}

export async function generateStructuredProjectPlan(project: Project): Promise<GenerateProjectPlanResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local before generating plans.");
  }

  const modelName = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: modelName,
    instructions:
      "You are Woodcut Wizard, a cautious woodworking planning assistant. Return only structured JSON that matches the schema. Keep all dimensions bounded by the submitted project, add review flags when safety is uncertain, and never guarantee load-bearing safety.",
    input: buildPrompt(project),
    text: {
      format: {
        type: "json_schema",
        name: "woodworking_project_plan",
        description: "Validated woodworking project plan for the private MVP.",
        strict: true,
        schema: generatedPlanJsonSchema,
      },
    },
  });

  const output = response.output_text;
  if (!output) {
    throw new Error("OpenAI returned no structured output.");
  }

  const parsed: unknown = JSON.parse(output);
  const validation = generatedPlanSchema.safeParse(parsed);
  if (!validation.success) {
    throw new Error(`Generated plan failed validation: ${validation.error.message}`);
  }

  return {
    plan: validation.data,
    modelName,
  };
}
