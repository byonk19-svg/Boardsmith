import { afterEach, describe, expect, it } from "vitest";
import { accessCookieName, createAccessCookieValue } from "@/lib/access/private-access";

const originalPassword = process.env.BOARDSMITH_ACCESS_PASSWORD;

describe("access verify route", () => {
  afterEach(() => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = originalPassword;
  });

  it("rejects a wrong password without setting the access cookie", async () => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = "private-password";
    const { POST } = await import("@/app/access/verify/route");
    const formData = new FormData();
    formData.set("password", "wrong-password");
    formData.set("returnTo", "/projects/new");

    const response = await POST(new Request("https://boardsmith.example/access/verify", { method: "POST", body: formData }));

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://boardsmith.example/access?error=1&returnTo=%2Fprojects%2Fnew");
    expect(response.cookies.get(accessCookieName)).toBeUndefined();
  });

  it("sets an HTTP-only access cookie and redirects after a correct password", async () => {
    process.env.BOARDSMITH_ACCESS_PASSWORD = "private-password";
    const expectedCookie = await createAccessCookieValue("private-password");
    const { POST } = await import("@/app/access/verify/route");
    const formData = new FormData();
    formData.set("password", "private-password");
    formData.set("returnTo", "/projects/new");

    const response = await POST(new Request("https://boardsmith.example/access/verify", { method: "POST", body: formData }));
    const cookie = response.cookies.get(accessCookieName);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe("https://boardsmith.example/projects/new");
    expect(cookie?.value).toBe(expectedCookie);
    expect(cookie?.httpOnly).toBe(true);
    expect(cookie?.sameSite).toBe("lax");
    expect(cookie?.path).toBe("/");
  });
});
