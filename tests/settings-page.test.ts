import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/storage/project-store", () => ({
  isSupabasePersistenceConfigured: vi.fn(() => true),
}));

describe("SettingsPage", () => {
  it("renders private MVP posture boundaries", async () => {
    const { default: SettingsPage } = await import("@/app/settings/page");

    const markup = renderToStaticMarkup(React.createElement(SettingsPage));

    expect(markup).toContain("Private MVP posture");
    expect(markup).toContain("Private access gate only; not multi-user authentication.");
    expect(markup).toContain("Planning-aid-only generated plans with builder review required before cutting or building.");
    expect(markup).toContain("Project intake, notes, build logs, and validated plan history are saved in the configured storage setup.");
    expect(markup).toContain("No public sharing. Browser print only; no generated PDF, CAD, SVG, or DXF export.");
  });
});
