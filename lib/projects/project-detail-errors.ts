const genericProjectDetailErrorMessage =
  "Something went wrong while updating this project. Try again or review the project details before retrying.";

const projectDetailErrorMessages = new Map<string, string>([
  ["archive_failed", "That project could not be archived. Try again from the project detail page."],
  ["restore_failed", "That project could not be restored. Try again from the project detail page."],
  ["duplicate_failed", "That project could not be duplicated. Review the project details and try again."],
  ["notes_failed", "Project notes could not be saved. Try again from the project detail page."],
  ["build_log_failed", "Build log changes could not be saved. Review the entered details and try again."],
  ["shelf_layout_failed", "Shelf layout changes could not be saved. Review the shelf count, spacing, and height before trying again."],
  ["shelf_layout_invalid", "Shelf layout changes were not saved. Choose a layout and enter a whole-number shelf count for multiple shelves."],
  ["shelf_layout_schema_missing", "Shelf layout changes were not saved because the database needs the latest shelf-layout migration."],
  ["Project could not be archived.", "That project could not be archived. Try again from the project detail page."],
  ["Project could not be restored.", "That project could not be restored. Try again from the project detail page."],
  ["Project duplication failed.", "That project could not be duplicated. Review the project details and try again."],
  ["Project notes could not be saved.", "Project notes could not be saved. Try again from the project detail page."],
  ["Project build log could not be saved.", "Build log changes could not be saved. Review the entered details and try again."],
  ["Project shelf layout could not be saved.", "Shelf layout changes could not be saved. Review the shelf count, spacing, and height before trying again."],
]);

export function getProjectDetailErrorMessage(error: string | string[] | undefined): string | null {
  if (typeof error !== "string" || error.length === 0) return null;

  return projectDetailErrorMessages.get(error) ?? genericProjectDetailErrorMessage;
}
