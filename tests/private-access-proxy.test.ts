import { afterEach, describe, expect, it } from "vitest";
import { NextRequest } from "next/server";
import { accessCookieName, createAccessCookieValue } from "@/lib/access/private-access";

const originalPassword = process.env.BOARDSMITH_ACCESS_PASSWORD;

describe("private MVP proxy", () => {
  afterEach(() => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = originalPassword;
  });

  it("allows app routes when the access password is not configured", async () => {
    delete process.env.BOARDSMITH_ACCESS_PASSWORD;
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://boardsmith.example/projects"));

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects protected routes to private access when the cookie is missing", async () => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = "private-password";
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://boardsmith.example/projects/new"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://boardsmith.example/access?returnTo=%2Fprojects%2Fnew");
  });

  it("protects project note update routes when the access password is configured", async () => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = "private-password";
    const { proxy } = await import("@/proxy");

    const response = await proxy(new NextRequest("https://boardsmith.example/projects/project-id/notes"));

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe("https://boardsmith.example/access?returnTo=%2Fprojects%2Fproject-id%2Fnotes");
  });

  it("allows protected routes with a valid access cookie", async () => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = "private-password";
    const cookieValue = await createAccessCookieValue("private-password");
    const { proxy } = await import("@/proxy");

    const response = await proxy(
      new NextRequest("https://boardsmith.example/projects/new", {
        headers: { cookie: `${accessCookieName}=${cookieValue}` },
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
