import { z } from "zod";
import { projectTypes } from "@/lib/projects/types";

export const confidenceLevels = ["low", "medium", "high"] as const;

const positiveMeasurement = z.number().positive().max(240);

export const generatedPlanSchema = z.object({
  project_summary: z.string().min(20),
  project_type: z.enum(projectTypes),
  dimensions: z.object({
    width_inches: positiveMeasurement,
    height_inches: positiveMeasurement,
    depth_inches: z.number().nonnegative().max(240),
    material_thickness_inches: positiveMeasurement,
  }),
  materials: z
    .array(
      z.object({
        name: z.string().min(1),
        quantity: z.string().min(1),
        notes: z.string().min(1),
      }),
    )
    .min(1),
  tools: z.array(z.string().min(1)).min(1),
  cut_list: z
    .array(
      z.object({
        part_name: z.string().min(1),
        quantity: z.number().int().positive(),
        length_inches: positiveMeasurement,
        width_inches: positiveMeasurement,
        thickness_inches: positiveMeasurement,
        material: z.string().min(1),
        notes: z.string().min(1),
      }),
    )
    .min(1),
  assembly_steps: z
    .array(
      z.object({
        step_number: z.number().int().positive(),
        title: z.string().min(1),
        instructions: z.string().min(10),
        tools_used: z.array(z.string().min(1)).min(1),
        safety_note: z.string().min(1).nullable(),
        estimated_time_minutes: z.number().int().positive().nullable(),
      }),
    )
    .min(1)
    .refine((steps) => steps.every((step, index) => step.step_number === index + 1), {
      message: "Assembly steps must be sequential starting at 1.",
    }),
  finishing_steps: z.array(z.string().min(1)).min(1),
  safety_notes: z.array(z.string().min(1)).min(2),
  assumptions: z.array(z.string().min(1)),
  needs_review_flags: z.array(z.string().min(1)),
  beginner_tips: z.array(z.string().min(1)),
  svg_readiness_notes: z.array(z.string().min(1)),
  estimated_difficulty: z.enum(["easy", "moderate", "hard"]),
  estimated_time: z.string().min(1),
  confidence_level: z.enum(confidenceLevels),
});

export type GeneratedPlan = z.infer<typeof generatedPlanSchema>;

export type GeneratedProjectPlanRecord = {
  id: string;
  project_id: string;
  created_at: string;
  model_name: string;
  plan_json: GeneratedPlan;
  plan_markdown: string;
  validation_status: "valid";
  warnings: string[];
  assumptions: string[];
  confidence_level: GeneratedPlan["confidence_level"];
  is_latest: boolean;
};

export const generatedProjectPlanRecordSchema = z.object({
  id: z.string(),
  project_id: z.string(),
  created_at: z.string(),
  model_name: z.string(),
  plan_json: generatedPlanSchema,
  plan_markdown: z.string(),
  validation_status: z.literal("valid"),
  warnings: z.array(z.string()),
  assumptions: z.array(z.string()),
  confidence_level: z.enum(confidenceLevels),
  is_latest: z.boolean(),
});

export const generatedPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: [
    "project_summary",
    "project_type",
    "dimensions",
    "materials",
    "tools",
    "cut_list",
    "assembly_steps",
    "finishing_steps",
    "safety_notes",
    "assumptions",
    "needs_review_flags",
    "beginner_tips",
    "svg_readiness_notes",
    "estimated_difficulty",
    "estimated_time",
    "confidence_level",
  ],
  properties: {
    project_summary: { type: "string" },
    project_type: { type: "string", enum: projectTypes },
    dimensions: {
      type: "object",
      additionalProperties: false,
      required: ["width_inches", "height_inches", "depth_inches", "material_thickness_inches"],
      properties: {
        width_inches: { type: "number" },
        height_inches: { type: "number" },
        depth_inches: { type: "number" },
        material_thickness_inches: { type: "number" },
      },
    },
    materials: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "quantity", "notes"],
        properties: {
          name: { type: "string" },
          quantity: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
    tools: { type: "array", items: { type: "string" } },
    cut_list: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["part_name", "quantity", "length_inches", "width_inches", "thickness_inches", "material", "notes"],
        properties: {
          part_name: { type: "string" },
          quantity: { type: "integer" },
          length_inches: { type: "number" },
          width_inches: { type: "number" },
          thickness_inches: { type: "number" },
          material: { type: "string" },
          notes: { type: "string" },
        },
      },
    },
    assembly_steps: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["step_number", "title", "instructions", "tools_used", "safety_note", "estimated_time_minutes"],
        properties: {
          step_number: { type: "integer" },
          title: { type: "string" },
          instructions: { type: "string" },
          tools_used: { type: "array", items: { type: "string" } },
          safety_note: { anyOf: [{ type: "string" }, { type: "null" }] },
          estimated_time_minutes: { anyOf: [{ type: "integer" }, { type: "null" }] },
        },
      },
    },
    finishing_steps: { type: "array", items: { type: "string" } },
    safety_notes: { type: "array", items: { type: "string" } },
    assumptions: { type: "array", items: { type: "string" } },
    needs_review_flags: { type: "array", items: { type: "string" } },
    beginner_tips: { type: "array", items: { type: "string" } },
    svg_readiness_notes: { type: "array", items: { type: "string" } },
    estimated_difficulty: { type: "string", enum: ["easy", "moderate", "hard"] },
    estimated_time: { type: "string" },
    confidence_level: { type: "string", enum: confidenceLevels },
  },
} as const;

export function renderPlanMarkdown(plan: GeneratedPlan): string {
  const lines = [
    `# ${plan.project_type.replaceAll("_", " ")} plan`,
    "",
    plan.project_summary,
    "",
    "## Safety Notes",
    ...plan.safety_notes.map((note) => `- ${note}`),
    "",
    "## Materials",
    ...plan.materials.map((item) => `- ${item.quantity} ${item.name}: ${item.notes}`),
    "",
    "## Cut List",
    ...plan.cut_list.map(
      (item) =>
        `- ${item.quantity.toString()}x ${item.part_name}: ${item.length_inches.toString()} in x ${item.width_inches.toString()} in x ${item.thickness_inches.toString()} in ${item.material}. ${item.notes}`,
    ),
    "",
    "## Assembly Steps",
    ...plan.assembly_steps.map((step) => `${step.step_number.toString()}. ${step.title}: ${step.instructions}`),
  ];

  return lines.join("\n");
}
