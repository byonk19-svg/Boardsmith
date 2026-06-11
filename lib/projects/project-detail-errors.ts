const genericProjectDetailErrorMessage =
  "Something went wrong while updating this project. Try again or review the project details before retrying.";

const projectDetailErrorMessages = new Map<string, string>([
  ["archive_failed", "That project could not be archived. Try again from the project detail page."],
  ["restore_failed", "That project could not be restored. Try again from the project detail page."],
  ["duplicate_failed", "That project could not be duplicated. Review the project details and try again."],
  ["notes_failed", "Project notes could not be saved. Try again from the project detail page."],
  ["build_log_failed", "Build log changes could not be saved. Review the entered details and try again."],
  ["Project could not be archived.", "That project could not be archived. Try again from the project detail page."],
  ["Project could not be restored.", "That project could not be restored. Try again from the project detail page."],
  ["Project duplication failed.", "That project could not be duplicated. Review the project details and try again."],
  ["Project notes could not be saved.", "Project notes could not be saved. Try again from the project detail page."],
  ["Project build log could not be saved.", "Build log changes could not be saved. Review the entered details and try again."],
]);

export function getProjectDetailErrorMessage(error: string | string[] | undefined): string | null {
  if (typeof error !== "string" || error.length === 0) return null;

  return projectDetailErrorMessages.get(error) ?? genericProjectDetailErrorMessage;
}
