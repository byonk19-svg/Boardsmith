import { describe, expect, it } from "vitest";
import {
  buildAccessRedirectUrl,
  createAccessCookieValue,
  hasValidAccessCookie,
  isAccessGateEnabled,
  isPublicAccessPath,
  sanitizeReturnTo,
} from "@/lib/access/private-access";

describe("private MVP access gate", () => {
  it("is disabled when no access password is configured", () => {
    expect(isAccessGateEnabled({})).toBe(false);
    expect(isAccessGateEnabled({ BOARDSMITH_ACCESS_PASSWORD: "   " })).toBe(false);
  });

  it("derives a cookie value without storing the raw password", async () => {
    const cookieValue = await createAccessCookieValue("private-password");

    expect(cookieValue).not.toContain("private-password");
    await expect(hasValidAccessCookie(cookieValue, "private-password")).resolves.toBe(true);
    await expect(hasValidAccessCookie(cookieValue, "wrong-password")).resolves.toBe(false);
  });

  it("keeps access and static framework paths public", () => {
    expect(isPublicAccessPath("/access")).toBe(true);
    expect(isPublicAccessPath("/access/verify")).toBe(true);
    expect(isPublicAccessPath("/_next/static/chunk.js")).toBe(true);
    expect(isPublicAccessPath("/favicon.ico")).toBe(true);
    expect(isPublicAccessPath("/projects")).toBe(false);
    expect(isPublicAccessPath("/projects/project-id/generate")).toBe(false);
  });

  it("sanitizes return paths before redirecting after access", () => {
    expect(sanitizeReturnTo("/projects/new")).toBe("/projects/new");
    expect(sanitizeReturnTo("https://evil.example/projects")).toBe("/");
    expect(sanitizeReturnTo("//evil.example/projects")).toBe("/");
    expect(sanitizeReturnTo("/access?returnTo=/projects")).toBe("/");
  });

  it("builds an access redirect with a local return path", () => {
    expect(buildAccessRedirectUrl("https://boardsmith.example/projects/new?x=1").toString()).toBe(
      "https://boardsmith.example/access?returnTo=%2Fprojects%2Fnew%3Fx%3D1",
    );
  });
});
