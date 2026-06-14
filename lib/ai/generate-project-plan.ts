import OpenAI from "openai";
import type { BoardsmithBuildModel } from "@/lib/build-model/build-model-schema";
import { assertGeneratedPlanQuality } from "@/lib/plans/plan-quality";
import { generatedPlanJsonSchema, generatedPlanSchema, type GeneratedPlan, type GeneratedProjectPlanRecord } from "@/lib/plans/plan-schema";
import { addRevisionAssumption } from "@/lib/plans/plan-revisions";
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
  const intakeText = `${project.title} ${project.style_notes} ${project.intended_use}`.toLowerCase();
  const wallMountingReviewRequired =
    safetyFlags.some((flag) => flag.code === "wall_mounting") || Boolean(buildModel?.safety.flags.some((flag) => flag.category === "wall_mounting"));
  const childOrBabyReviewRequired =
    safetyFlags.some((flag) => flag.code === "child_or_baby_use") || Boolean(buildModel?.safety.flags.some((flag) => flag.category === "child_use"));
  const bathroomOrHumidityReview = /\b(bathroom|humid|humidity|damp|wet|towel|shower)\b/.test(intakeText);
  const bookLedgeReview = /\b(book\s*ledge|toddler\s+book|nursery\s+book|children'?s\s+book|book\s+rail)\b/.test(intakeText);
  const wallHardwareModeled = Boolean(
    buildModel?.hardware.some((item) => item.hardwareType === "anchor" || item.hardwareType === "bracket" || item.hardwareType === "hanger"),
  );
  const connectedShelfSupportReviewRequired =
    (buildModel?.pieces.some((piece) => piece.id === "side_support_frame_placeholder") ?? false) ||
    (buildModel?.safety.flags.some((flag) => flag.id === "connected_shelf_support_incomplete") ?? false);
  const exactReviewLabels = [...new Set([...safetyFlags.map((flag) => flag.label), ...(buildModel?.safety.flags.map((flag) => flag.message) ?? [])])];

  return {
    task: "Generate a detailed beginner-friendly woodworking project plan. Do not invent uncontrolled dimensions. Use the provided dimensions as the bounding source of truth, and call out assumptions where detail is missing.",
    project,
    intake_interpretation: {
      wall_mounting_review_required: wallMountingReviewRequired,
      child_or_baby_review_required: childOrBabyReviewRequired,
      bathroom_or_humidity_review: bathroomOrHumidityReview,
      book_ledge_review: bookLedgeReview,
      wall_hardware_modeled: wallHardwareModeled,
      connected_shelf_support_review_required: connectedShelfSupportReviewRequired,
      exact_review_labels_required: exactReviewLabels,
      use_template_hints_as_guidance_only: true,
      if_wall_mounting_review_is_false:
        "Treat the project as freestanding or non-mounted. Do not add wall brackets, anchors, studs, hanging hardware, mounting steps, or wall-load review unless the intake or build model explicitly includes them.",
      if_wall_mounting_review_is_true:
        "Treat mounting as unresolved manual review. Include studs, anchors, fasteners, wall structure, and load-use review in needs_review_flags and safety_notes, but do not say the shelf is safely mounted or load rated.",
      if_child_or_baby_review_is_true:
        "Copy the Child or baby use review label exactly. Use cautious adult-review language about secure mounting, rounded and sanded edges, adult-reviewed non-toxic finish selection, regular inspection, and supervision. Do not say child-safe, child safe, kid-safe, safe for toddlers, safe for children, certified, approved, or guaranteed.",
      if_bathroom_or_humidity_review_is_true:
        "Include bathroom humidity, finish, corrosion-resistant hardware, and moisture movement as review items. Do not claim the material or finish is waterproof unless the intake specifies a verified product.",
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
      "Copy each exact_review_labels_required value verbatim into needs_review_flags when any review labels are provided.",
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
      "For book ledges, reuse modeled ledge piece names such as bottom shelf board, back rail, and front lip when present; do not add unmodeled child-safety claims.",
      "For bathroom shelves, include humidity and finish assumptions as review notes rather than waterproof or load-capacity claims.",
      "For child-adjacent finish notes, write adult-reviewed non-toxic finish selection instead of child-safe finish, kid-safe finish, or safe for toddlers.",
      "If the build model includes side_support_frame_placeholder or Shelf support/frame review, do not describe the shelf as freestanding or complete; require support/frame confirmation before assembly or mounting.",
      "If a detail is unknown, state it as an assumption or manual review question instead of inventing a certification, load rating, or production-ready output.",
      "For lamp risers or lighted-item stands, plan only the wooden support unless the intake asks for electrical work. Do not provide wiring instructions.",
    ],
    safety_rules: [
      "Include safety disclaimers.",
      "Warn that the plan requires user review before cutting or building.",
      "Do not make structural, load-bearing, child-furniture, or professional safety guarantees.",
      "Avoid the phrases child safe, safe for children, safe for toddlers, structurally approved, certified, load rated, guaranteed safe, guaranteed capacity, and safely supports.",
      "Avoid hyphenated variants such as child-safe, kid-safe, load-rated, and guarantee-safe.",
      "Do not tell minors to use dangerous tools.",
      "Do not recommend bypassing guards or PPE.",
      "For wall-mounted items include stud/anchor caution.",
      "Include a practical measure twice, cut once warning.",
    ],
    forbidden_output_phrases: [
      "child-safe",
      "child safe",
      "kid-safe",
      "safe for toddlers",
      "safe for children",
      "load-rated",
      "load rated",
      "safely supports",
      "structurally approved",
      "certified safe",
      "guaranteed safe",
    ],
    preferred_safety_phrases: [
      "Boardsmith cannot verify child safety.",
      "Adult review is required before use.",
      "Verify mounting, finish, edges, expected load, and ongoing inspection before use.",
      "Use an adult-reviewed non-toxic finish appropriate for the intended setting.",
      "Boardsmith cannot verify wall structure, anchors, fasteners, or load capacity.",
    ],
  };
}

function buildPrompt(project: Project, buildModel?: BoardsmithBuildModel): string {
  return JSON.stringify(buildProjectPlanPromptContext(project, buildModel), null, 2);
}

export function buildRevisedProjectPlanPromptContext({
  project,
  buildModel,
  latestPlan,
  revisionInstruction,
}: {
  project: Project;
  buildModel: BoardsmithBuildModel;
  latestPlan: GeneratedProjectPlanRecord;
  revisionInstruction: string;
}) {
  return {
    ...buildProjectPlanPromptContext(project, buildModel),
    task: "Revise the latest Boardsmith plan using one plain-English instruction. Return a complete replacement woodworking project plan, not a patch, chat response, or partial edit.",
    revision_context: {
      revision_instruction: revisionInstruction,
      previous_plan_id: latestPlan.id,
      previous_plan_created_at: latestPlan.created_at,
      previous_plan_json: latestPlan.plan_json,
      revision_rules: [
        "Return a complete replacement plan that matches the existing generated-plan schema.",
        "Save no chat transcript, agent log, or partial patch in the plan output.",
        "Preserve the same project type unless the saved project intake changes in a future flow.",
        "Keep dimensions bounded by the saved project intake and build model.",
        "Keep cut-list pieces and materials mapped to the build model.",
        "If the requested change conflicts with saved intake or build model data, keep safe bounded values and add the conflict as an assumption or needs-review item.",
        "Do not claim professional approval, child safety, wall safety, load rating, fabrication readiness, CAD readiness, CNC readiness, or construction approval.",
      ],
    },
  };
}

function buildRevisedPrompt({
  project,
  buildModel,
  latestPlan,
  revisionInstruction,
}: {
  project: Project;
  buildModel: BoardsmithBuildModel;
  latestPlan: GeneratedProjectPlanRecord;
  revisionInstruction: string;
}): string {
  return JSON.stringify(buildRevisedProjectPlanPromptContext({ project, buildModel, latestPlan, revisionInstruction }), null, 2);
}

export async function generateStructuredProjectPlan(project: Project, buildModel?: BoardsmithBuildModel): Promise<GenerateProjectPlanResult> {
  return generatePlanFromPrompt(buildPrompt(project, buildModel), buildModel);
}

export async function generateRevisedStructuredProjectPlan({
  project,
  buildModel,
  latestPlan,
  revisionInstruction,
}: {
  project: Project;
  buildModel: BoardsmithBuildModel;
  latestPlan: GeneratedProjectPlanRecord;
  revisionInstruction: string;
}): Promise<GenerateProjectPlanResult> {
  return generatePlanFromPrompt(buildRevisedPrompt({ project, buildModel, latestPlan, revisionInstruction }), buildModel, (plan) =>
    addRevisionAssumption(plan, revisionInstruction),
  );
}

async function generatePlanFromPrompt(
  input: string,
  buildModel?: BoardsmithBuildModel,
  transformPlan: (plan: GeneratedPlan) => GeneratedPlan = (plan) => plan,
): Promise<GenerateProjectPlanResult> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not configured. Add it to .env.local before generating plans.");
  }

  const modelName = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const response = await client.responses.create({
    model: modelName,
    instructions:
      "You are Boardsmith, a cautious woodworking planning assistant. Return only structured JSON that matches the schema. Keep all dimensions bounded by the submitted project and build model. Add review flags when safety is uncertain. Never make load-rating, child-safety, structural-approval, fabrication-ready, CNC-ready, or safety-guarantee claims. Do not use phrases like child-safe, kid-safe, safe for toddlers, safe for children, safely supports, load-rated, structurally approved, certified safe, or guaranteed safe. Prefer 'Boardsmith cannot verify ...', 'adult review is required', and 'review before building' language.",
    input,
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
  const plan = transformPlan(validation.data);

  return {
    plan,
    modelName,
  };
}
