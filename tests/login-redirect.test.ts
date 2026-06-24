import { describe, expect, it } from "vitest";
import { buildLoginRedirectPath, loginReturnTo } from "@/lib/access/login-redirect";

describe("login compatibility redirect", () => {
  it("uses supported Boardsmith redirect query values", () => {
    expect(loginReturnTo({ redirectTo: "/projects/new" })).toBe("/projects/new");
    expect(loginReturnTo({ next: "/projects/project-id/print" })).toBe("/projects/project-id/print");
    expect(loginReturnTo({ returnTo: "/settings" })).toBe("/settings");
  });

  it("drops stale non-Boardsmith redirect targets", () => {
    expect(loginReturnTo({ redirectTo: "/recipes/new" })).toBe("/");
    expect(loginReturnTo({ redirectTo: "https://example.com/projects" })).toBe("/");
  });

  it("routes through private access only when the access gate is enabled", () => {
    expect(buildLoginRedirectPath({ redirectTo: "/projects/new" }, true)).toBe("/access?returnTo=%2Fprojects%2Fnew");
    expect(buildLoginRedirectPath({ redirectTo: "/projects/new" }, false)).toBe("/projects/new");
    expect(buildLoginRedirectPath({ redirectTo: "/recipes/new" }, true)).toBe("/access");
    expect(buildLoginRedirectPath({ redirectTo: "/recipes/new" }, false)).toBe("/");
  });
});
