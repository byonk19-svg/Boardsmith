import { describe, expect, it } from "vitest";
import { getProjectDetailErrorMessage } from "@/lib/projects/project-detail-errors";

describe("project detail error messages", () => {
  it("maps known action error keys to safe detail-page copy", () => {
    expect(getProjectDetailErrorMessage("archive_failed")).toBe("That project could not be archived. Try again from the project detail page.");
    expect(getProjectDetailErrorMessage("restore_failed")).toBe("That project could not be restored. Try again from the project detail page.");
    expect(getProjectDetailErrorMessage("duplicate_failed")).toBe("That project could not be duplicated. Review the project details and try again.");
    expect(getProjectDetailErrorMessage("notes_failed")).toBe("Project notes could not be saved. Try again from the project detail page.");
    expect(getProjectDetailErrorMessage("build_log_failed")).toBe("Build log changes could not be saved. Review the entered details and try again.");
  });

  it("keeps legacy literal messages safe and hides unknown raw details", () => {
    expect(getProjectDetailErrorMessage("Project notes could not be saved.")).toBe("Project notes could not be saved. Try again from the project detail page.");
    expect(getProjectDetailErrorMessage("Database exploded: stack trace")).toBe(
      "Something went wrong while updating this project. Try again or review the project details before retrying.",
    );
    expect(getProjectDetailErrorMessage(undefined)).toBeNull();
    expect(getProjectDetailErrorMessage(["notes_failed"])).toBeNull();
  });
});
