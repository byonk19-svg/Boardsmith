import type { Project, ProjectIntake } from "@/lib/projects/types";

export type WallShelfMountingIntentKind = "explicit_wall_mounted" | "implicit_wall_mounted" | "explicit_non_mounted" | "unknown";

export type WallShelfMountingIntent = {
  kind: WallShelfMountingIntentKind;
  wallMounted: boolean;
  nonMounted: boolean;
  supportMethodSpecified: boolean;
  wallFastenerContextSpecified: boolean;
  expectedUseSpecified: boolean;
  finishProtectionSpecified: boolean;
};

type WallShelfIntentProject = Omit<Pick<ProjectIntake | Project, "project_type" | "title" | "style_notes" | "intended_use">, "project_type"> & {
  project_type: string;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function projectText(project: WallShelfIntentProject): string {
  return normalize([project.title, project.style_notes, project.intended_use].filter(Boolean).join(" "));
}

function hasExplicitNonMountedText(text: string): boolean {
  return (
    /\b(no|not|without)\s+(?:wall\s+)?(?:mounting|mounted|mount|anchors?|studs?|brackets?|hanging)\b/.test(text) ||
    /\b(freestanding|free standing|tabletop|desktop|countertop|riser|display board|sits on|standalone|stand alone)\b/.test(text)
  );
}

function hasExplicitMountedText(text: string): boolean {
  return /\b(wall mounted|wall mount|mounted|mounting|mount|hang|hanging|anchor|stud|bracket|cleat|wall shelf|wall shelves)\b/.test(text);
}

export function hasWallShelfSupportMethod(project: WallShelfIntentProject): boolean {
  return /\b(brackets?|cleats?|standards?|side\s+supports?|vertical\s+supports?|support\s+method|frame|uprights?|rails?|studs?|anchors?)\b/.test(
    projectText(project),
  );
}

export function hasWallShelfFastenerContext(project: WallShelfIntentProject): boolean {
  return /\b(studs?|anchors?|fasteners?|screws?|drywall|plaster|tile|masonry|wall\s+type|wall\s+structure)\b/.test(projectText(project));
}

export function hasWallShelfExpectedUseContext(project: WallShelfIntentProject): boolean {
  return /\b(light|decor|towels?|books?|plants?|display|load|weight|pantry|spice|storage|toiletries|nursery|hold|holding)\b/.test(projectText(project));
}

export function hasWallShelfFinishProtectionContext(project: WallShelfIntentProject): boolean {
  return /\b(finish|paint|stain|seal|sealed|sealer|polyurethane|spar\s+urethane|varnish|exterior\s+screws?|stainless|galvanized|cedar|treated|weatherproof|waterproof|moisture[-\s]+resistant)\b/.test(
    projectText(project),
  );
}

export function isBathroomOrHumidityText(project: WallShelfIntentProject): boolean {
  return /\b(bathroom|humid|humidity|damp|wet|towel|shower)\b/.test(projectText(project));
}

export function analyzeWallShelfMountingIntent(project: WallShelfIntentProject): WallShelfMountingIntent {
  const text = projectText(project);
  const nonMounted = hasExplicitNonMountedText(text);
  const explicitMounted = hasExplicitMountedText(text);
  const simpleShelfTemplate = project.project_type === "simple_shelf";
  const kind: WallShelfMountingIntentKind = nonMounted
    ? "explicit_non_mounted"
    : explicitMounted
      ? "explicit_wall_mounted"
      : simpleShelfTemplate
        ? "implicit_wall_mounted"
        : "unknown";

  return {
    kind,
    wallMounted: kind === "explicit_wall_mounted" || kind === "implicit_wall_mounted",
    nonMounted: kind === "explicit_non_mounted",
    supportMethodSpecified: hasWallShelfSupportMethod(project),
    wallFastenerContextSpecified: hasWallShelfFastenerContext(project),
    expectedUseSpecified: hasWallShelfExpectedUseContext(project),
    finishProtectionSpecified: hasWallShelfFinishProtectionContext(project),
  };
}
