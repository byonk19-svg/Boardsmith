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
  const wallMountingReviewRequired =
    safetyFlags.some((flag) => flag.code === "wall_mounting") || Boolean(buildModel?.safety.flags.some((flag) => flag.category === "wall_mounting"));
  const wallHardwareModeled = Boolean(
    buildModel?.hardware.some((item) => item.hardwareType === "anchor" || item.hardwareType === "bracket" || item.hardwareType === "hanger"),
  );

  return {
    task: "Generate a detailed beginner-friendly woodworking project plan. Do not invent uncontrolled dimensions. Use the provided dimensions as the bounding source of truth, and call out assumptions where detail is missing.",
    project,
    intake_interpretation: {
      wall_mounting_review_required: wallMountingReviewRequired,
      wall_hardware_modeled: wallHardwareModeled,
      use_template_hints_as_guidance_only: true,
      if_wall_mounting_review_is_false:
        "Treat the project as freestanding or non-mounted. Do not add wall brackets, anchors, studs, hanging hardware, mounting steps, or wall-load review unless the intake or build model explicitly includes them.",
    },
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
      "Use 'Boardsmith cannot verify ...' phrasing instead of guarantee, guaranteed, certify, child-safe, structural approval, or load-rating claims.",
      "When safety is uncertain, put the concern in needs_review_flags and safety_notes as a manual review item without claiming the project is safe.",
    ],
    output_alignment_rules: [
      "Treat template hints as guidance. If the project intake and build model do not include wall mounting or wall hardware, do not add brackets, anchors, studs, or mounting steps.",
      "Use the build model pieces as the cut-list source of truth. Reuse piece labels, material labels, and dimensions from build_model_context when present.",
      "Include concrete materials, named pieces, dimensions, build operations, assumptions, unresolved questions, safety notes, and review flags.",
      "If a detail is unknown, state it as an assumption or manual review question instead of inventing a certification, load rating, or production-ready output.",
      "For lamp risers or lighted-item stands, plan only the wooden support unless the intake asks for electrical work. Do not provide wiring instructions.",
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
      "You are Boardsmith, a cautious woodworking planning assistant. Return only structured JSON that matches the schema. Keep all dimensions bounded by the submitted project and build model. Add review flags when safety is uncertain. Never make load-rating, child-safety, structural-approval, fabrication-ready, CNC-ready, or safety-guarantee claims. Prefer 'Boardsmith cannot verify ...' and 'review before building' language.",
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
