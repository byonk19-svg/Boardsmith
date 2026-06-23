import { extractProjectIntakeSignals } from "@/lib/projects/project-intake-signals";
import type { Project, ProjectIntake } from "@/lib/projects/types";

type WallShelfSupportGuidanceProject = Pick<Project | ProjectIntake, "style_notes" | "intended_use">;

export type WallShelfSupportGuidance = {
  mountingMethod: string | null;
  supportCount: string | null;
  supportCountQuantity: number | null;
  hardwareLabel: string;
  mountingMethodSentence: string | null;
  supportCountSentence: string | null;
};

function supportCountQuantity(value: string | undefined): number | null {
  if (!value) return null;
  if (value === "2") return 2;
  if (value === "3") return 3;
  return null;
}

function hardwareLabelFor(mountingMethod: string | undefined, fallback: string): string {
  if (!mountingMethod) return fallback;
  if (/visible l brackets/i.test(mountingMethod)) return "Visible L bracket placeholders";
  if (/hidden|floating/i.test(mountingMethod)) return "Hidden/floating bracket placeholders";
  if (/cleat|french cleat/i.test(mountingMethod)) return "Cleat/French cleat hardware to review";
  if (/not sure/i.test(mountingMethod)) return "Mounting hardware to review";
  if (/not wall-mounted/i.test(mountingMethod)) return "Support hardware to review";
  return fallback;
}

function supportCountSentence(value: string | undefined): string | null {
  if (!value || /not applicable/i.test(value)) return null;
  if (/not sure/i.test(value)) return "Support/bracket count still needs review before buying or installing.";
  if (/more than 3/i.test(value)) return "Intake support/bracket count is more than 3; confirm the exact hardware quantity before buying or installing.";
  return `Intake support/bracket count: ${value}.`;
}

export function createWallShelfSupportGuidance(project: WallShelfSupportGuidanceProject, fallbackHardwareLabel = "Wall bracket placeholders"): WallShelfSupportGuidance {
  const signals = extractProjectIntakeSignals(project);
  const mountingMethod = signals.mountingMethod ?? null;
  const supportCount = signals.supportCount ?? null;

  return {
    mountingMethod,
    supportCount,
    supportCountQuantity: supportCountQuantity(signals.supportCount),
    hardwareLabel: hardwareLabelFor(signals.mountingMethod, fallbackHardwareLabel),
    mountingMethodSentence: mountingMethod ? `Selected mounting method: ${mountingMethod}.` : null,
    supportCountSentence: supportCountSentence(signals.supportCount),
  };
}
