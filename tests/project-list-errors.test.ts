import { describe, expect, it } from "vitest";
import { getProjectListErrorMessage } from "@/lib/projects/project-list-errors";

describe("project list error messages", () => {
  it("maps known project-list errors to calm copy", () => {
    expect(getProjectListErrorMessage("Project not found")).toBe(
      "That project could not be found. It may have been archived, restored, or removed from this workspace.",
    );
    expect(getProjectListErrorMessage("project_not_found")).toBe(
      "That project could not be found. It may have been archived, restored, or removed from this workspace.",
    );
  });

  it("does not expose unknown raw error query strings", () => {
    expect(getProjectListErrorMessage("Database exploded: stack trace")).toBe(
      "Something went wrong. Try again or return to the active project list.",
    );
    expect(getProjectListErrorMessage(undefined)).toBeNull();
    expect(getProjectListErrorMessage(["Project not found"])).toBeNull();
  });
});
