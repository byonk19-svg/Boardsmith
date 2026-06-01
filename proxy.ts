import { NextResponse, type NextRequest } from "next/server";
import { accessCookieName, buildAccessRedirectUrl, getConfiguredAccessPassword, hasValidAccessCookie, isPublicAccessPath } from "@/lib/access/private-access";

export async function proxy(request: NextRequest) {
  const password = getConfiguredAccessPassword();
  if (!password || isPublicAccessPath(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  const cookieValue = request.cookies.get(accessCookieName)?.value;
  if (await hasValidAccessCookie(cookieValue, password)) {
    return NextResponse.next();
  }

  return NextResponse.redirect(buildAccessRedirectUrl(request.url));
}

export const config = {
  matcher: ["/((?!api|.*\\..*).*)"],
};
