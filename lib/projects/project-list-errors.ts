const projectListErrorMessages = new Map<string, string>([
  ["project_not_found", "That project could not be found. It may have been archived, restored, or removed from this workspace."],
  ["Project not found", "That project could not be found. It may have been archived, restored, or removed from this workspace."],
]);

export function getProjectListErrorMessage(error: string | string[] | undefined): string | null {
  if (typeof error !== "string" || error.length === 0) return null;

  return projectListErrorMessages.get(error) ?? "Something went wrong. Try again or return to the active project list.";
}
