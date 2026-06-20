export const STRUCTURED_INTAKE_HEADING = "Structured intake";
export const PLANNING_PREFERENCES_HEADING = "Planning preferences";

export type ManagedSectionEntry = {
  label: string;
  value: string;
  rawLine: string;
};

export function formatManagedOptionLine<T extends string>(value: T | undefined, labels: Record<T, string>, label: string): string | undefined {
  return value ? `${label}: ${labels[value]}` : undefined;
}

export function formatManagedTextLine(value: string | undefined, label: string, maxLength: number): string | undefined {
  const trimmed = value?.trim().slice(0, maxLength);
  return trimmed ? `${label}: ${trimmed}` : undefined;
}

function formatManagedSection(heading: string, lines: string[]): string {
  return lines.length > 0 ? `${heading}\n${lines.map((line) => `- ${line}`).join("\n")}` : "";
}

export function appendManagedSection(existing: FormDataEntryValue | null, heading: string, lines: string[]): string {
  const baseText = typeof existing === "string" ? existing.trim() : "";
  return [baseText, formatManagedSection(heading, lines)].filter(Boolean).join("\n\n");
}

export function mergeManagedSection(existing: string, heading: string, lines: string[]): string {
  const baseSections = existing
    .split(/\n{2,}/)
    .map((section) => section.trim())
    .filter((section) => section.length > 0 && section !== heading && !section.startsWith(`${heading}\n`));

  return [...baseSections, formatManagedSection(heading, lines)].filter(Boolean).join("\n\n");
}

export function parseManagedSectionEntries(existing: string, heading: string): ManagedSectionEntry[] {
  const lines = existing.split(/\r?\n/);
  const headingIndex = lines.findIndex((line) => line.trim() === heading);
  if (headingIndex === -1) return [];

  const sectionLines: string[] = [];
  for (const line of lines.slice(headingIndex + 1)) {
    const trimmed = line.trim();
    if (!trimmed) break;
    if (!trimmed.startsWith("- ")) break;
    sectionLines.push(trimmed);
  }

  return sectionLines
    .map((line) => line.replace(/^-\s*/, ""))
    .map((rawLine) => {
      const separatorIndex = rawLine.indexOf(":");
      if (separatorIndex === -1) return null;

      const label = rawLine.slice(0, separatorIndex).trim();
      const value = rawLine.slice(separatorIndex + 1).trim();
      return label && value ? { label, value, rawLine } : null;
    })
    .filter((entry): entry is ManagedSectionEntry => Boolean(entry));
}
