import OpenAI from "openai";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { assertGeneratedPlanQuality } from "@/lib/plans/plan-quality";
import { generatedPlanJsonSchema, generatedPlanSchema, type GeneratedPlan } from "@/lib/plans/plan-schema";
import type { Project } from "@/lib/projects/types";
import { calculateSafetyReviewFlags } from "@/lib/safety/safety-review";
import { getTemplateHint } from "@/lib/templates/template-hints";

export type GenerateProjectPlanResult = {
  plan: GeneratedPlan;
  modelName: string;
};

export function buildProjectPlanPromptContext(project: Project, buildModel?: BoardsmithBuildModel) {
  const safetyFlags = calculateSafetyReviewFlags(project);
  const hint = getTemplateHint(project.project_type);

  return {
    task: "Generate a detailed beginner-friendly woodworking project plan. Do not invent uncontrolled dimensions. Use the provided dimensions as the bounding source of truth, and call out assumptions where detail is missing.",
    project,
    deterministic_safety_flags: safetyFlags,
    template_hints: hint,
    build_model_context: buildModel
      ? {
          schemaVersion: buildModel.schemaVersion,
          units: buildModel.units,
          project: buildModel.project,
          dimensions: buildModel.dimensions,
          pieces: buildModel.pieces,
          materials: buildModel.materials,
          hardware: buildModel.hardware,
          connections: buildModel.connections,
          operations: buildModel.operations,
          safety: buildModel.safety,
          assumptions: buildModel.assumptions,
          unresolvedQuestions: buildModel.unresolvedQuestions,
          exportReadiness: buildModel.exportReadiness,
          confidence: buildModel.confidence,
        }
      : null,
    deterministic_quality_rules: [
      "Generated project_type must match the build model project type.",
      "Generated dimensions must not exceed confirmed build model dimensions.",
      "Every deterministic build model safety flag must appear in needs_review_flags or safety_notes.",
      "Wall-mounted work must mention stud, anchor, fastener, or wall-structure review.",
      "Cut-list materials must appear in the materials section.",
      "Every cut-list part must map to a build model piece label, id, or piece type.",
      "Every cut-list material must map to a build model material label, id, or material type.",
      "Cut-list dimensions must not exceed the matched build model piece dimensions.",
      "Do not claim load capacity, child safety, structural approval, or guaranteed safety.",
    ],
    safety_rules: [
      "Include safety disclaimers.",
      "Warn that the plan requires user review before cutting or building.",
      "Do not make structural, load-bearing, child-furniture, or professional safety guarantees.",
      "Do not tell minors to use dangerous tools.",
      "Do not recommend bypassing guards or PPE.",
      "For wall-mounted items include stud/anchor caution.",
      "Include a practical measure twice, cut once warning.",
    ],
  };
}

function buildPrompt(project: Project, buildModel?: BoardsmithBuildModel): string {
  return JSON.stringify(buildProjectPlanPromptContext(project, buildModel), null, 2);
}

export async function generateStructuredProjectPlan(project: Project, buildModel?: BoardsmithBuildModel): Promise<GenerateProjectPlanResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local before generating plans.");
  }

  const modelName = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: modelName,
    instructions:
      "You are Boardsmith, a cautious woodworking planning assistant. Return only structured JSON that matches the schema. Keep all dimensions bounded by the submitted project, add review flags when safety is uncertain, and never guarantee load-bearing safety.",
    input: buildPrompt(project, buildModel),
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
  if (buildModel) {
    assertGeneratedPlanQuality(validation.data, buildModel);
  }

  return {
    plan: validation.data,
    modelName,
  };
}
