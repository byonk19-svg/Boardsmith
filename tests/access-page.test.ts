import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

describe("private access page", () => {
  it("renders private MVP access copy and posts to the verify route", async () => {
    const { default: AccessPage } = await import("@/app/access/page");

    const markup = renderToStaticMarkup(
      await AccessPage({
        searchParams: Promise.resolve({ returnTo: "/projects/new" }),
      }),
    );

    expect(markup).toContain("Boardsmith private access");
    expect(markup).toContain("Enter the private MVP password to continue.");
    expect(markup).toContain("This is a temporary private MVP gate, not multi-user authentication.");
    expect(markup).toContain("This private MVP workspace uses the current storage setup; do not enter sensitive customer or production data.");
    expect(markup).toContain('action="/access/verify"');
    expect(markup).toContain('name="password"');
    expect(markup).toContain('name="returnTo"');
    expect(markup).toContain('value="/projects/new"');
  });
});
