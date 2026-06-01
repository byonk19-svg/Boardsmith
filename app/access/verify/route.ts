import { NextResponse } from "next/server";
import {
  accessCookieMaxAgeSeconds,
  accessCookieName,
  createAccessCookieValue,
  getConfiguredAccessPassword,
  sanitizeReturnTo,
} from "@/lib/access/private-access";

export async function POST(request: Request): Promise<NextResponse> {
  const configuredPassword = getConfiguredAccessPassword();
  const formData = await request.formData();
  const passwordValue = formData.get("password");
  const returnToValue = formData.get("returnTo");
  const submittedPassword = typeof passwordValue === "string" ? passwordValue : "";
  const returnTo = sanitizeReturnTo(typeof returnToValue === "string" ? returnToValue : "/");

  if (!configuredPassword) {
    return NextResponse.redirect(new URL(returnTo, request.url), 303);
  }

  if (submittedPassword !== configuredPassword) {
    const accessUrl = new URL("/access", request.url);
    accessUrl.searchParams.set("error", "1");
    accessUrl.searchParams.set("returnTo", returnTo);
    return NextResponse.redirect(accessUrl, 303);
  }

  const response = NextResponse.redirect(new URL(returnTo, request.url), 303);
  response.cookies.set({
    name: accessCookieName,
    value: await createAccessCookieValue(configuredPassword),
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: accessCookieMaxAgeSeconds,
  });

  return response;
}
