export const maxRevisionInstructionLength = 500;

export function normalizeRevisionInstruction(value: FormDataEntryValue | string | null): string {
  return typeof value === "string" ? value.trim() : "";
}
