import {
  parseManagedSectionEntries,
  PLANNING_PREFERENCES_HEADING,
  STRUCTURED_INTAKE_HEADING,
  type ManagedSectionEntry,
} from "@/lib/projects/managed-intake-sections";
import type { Project, ProjectIntake } from "@/lib/projects/types";

export type ProjectIntakeSignals = {
  mountingMethod?: string;
  wallType?: string;
  studAccess?: string;
  shelfLoad?: string;
  moistureExposure?: string;
  measurementConfidence?: string;
  installLocation?: string;
  plannedMountingHeight?: string;
  supportCount?: string;
  higherRiskSpots: string[];
  wallObstructions?: string;
  boardSize?: string;
  cutPlan?: string;
  finishPreference?: string;
  edgeTreatment?: string;
};

type ProjectIntakeSignalSource = Omit<Pick<ProjectIntake | Project, "style_notes" | "intended_use">, never>;

function firstValue(entries: ManagedSectionEntry[], label: string): string | undefined {
  return entries.find((entry) => entry.label === label)?.value;
}

function allValues(entries: ManagedSectionEntry[], label: string): string[] {
  return entries.filter((entry) => entry.label === label).map((entry) => entry.value);
}

export function extractProjectIntakeSignals(project: ProjectIntakeSignalSource): ProjectIntakeSignals {
  const structuredEntries = parseManagedSectionEntries(project.intended_use, STRUCTURED_INTAKE_HEADING);
  const preferenceEntries = parseManagedSectionEntries(project.style_notes, PLANNING_PREFERENCES_HEADING);

  return {
    mountingMethod: firstValue(structuredEntries, "Mounting method"),
    wallType: firstValue(structuredEntries, "Wall type"),
    studAccess: firstValue(structuredEntries, "Stud access"),
    shelfLoad: firstValue(structuredEntries, "What it will hold"),
    moistureExposure: firstValue(structuredEntries, "Moisture exposure"),
    measurementConfidence: firstValue(structuredEntries, "Measurement confidence"),
    installLocation: firstValue(structuredEntries, "Install location"),
    plannedMountingHeight: firstValue(structuredEntries, "Planned mounting height"),
    supportCount: firstValue(structuredEntries, "Support/bracket count"),
    higherRiskSpots: allValues(structuredEntries, "Higher-risk spot"),
    wallObstructions: firstValue(structuredEntries, "Nearby wall conditions or obstructions"),
    boardSize: firstValue(preferenceEntries, "Board size from store"),
    cutPlan: firstValue(preferenceEntries, "Cut plan"),
    finishPreference: firstValue(preferenceEntries, "Finish preference"),
    edgeTreatment: firstValue(preferenceEntries, "Edge treatment"),
  };
}
