export const accessCookieName = "boardsmith_private_access";
export const accessCookieMaxAgeSeconds = 60 * 60 * 12;

type EnvShape = {
  [key: string]: string | undefined;
  BOARDSMITH_ACCESS_PASSWORD?: string;
};

export function getConfiguredAccessPassword(env: EnvShape = process.env): string | null {
  const password = env.BOARDSMITH_ACCESS_PASSWORD?.trim();
  if (!password) return null;
  return password;
}

export function isAccessGateEnabled(env: EnvShape = process.env): boolean {
  return getConfiguredAccessPassword(env) !== null;
}

export async function createAccessCookieValue(password: string): Promise<string> {
  const data = new TextEncoder().encode(`boardsmith-private-mvp:v1:${password}`);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return base64UrlEncode(new Uint8Array(digest));
}

export async function hasValidAccessCookie(cookieValue: string | undefined, password: string): Promise<boolean> {
  if (!cookieValue) return false;
  const expected = await createAccessCookieValue(password);
  return timingSafeEqual(cookieValue, expected);
}

export function isPublicAccessPath(pathname: string): boolean {
  return (
    pathname === "/access" ||
    pathname === "/access/verify" ||
    pathname === "/login" ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml"
  );
}

function isAllowedReturnPath(pathname: string): boolean {
  if (pathname === "/" || pathname === "/projects" || pathname === "/projects/new" || pathname === "/settings") {
    return true;
  }

  return /^\/projects\/[^/?#]+(?:\/print)?$/.test(pathname);
}

export function sanitizeReturnTo(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/access")) {
    return "/";
  }

  try {
    const url = new URL(value, "https://boardsmith.local");
    if (!isAllowedReturnPath(url.pathname)) {
      return "/";
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return "/";
  }
}

export function buildAccessRedirectUrl(requestUrl: string): URL {
  const url = new URL(requestUrl);
  const accessUrl = new URL("/access", url);
  accessUrl.searchParams.set("returnTo", `${url.pathname}${url.search}`);
  return accessUrl;
}

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replace(/=+$/, "");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  let diff = 0;
  for (let index = 0; index < a.length; index += 1) {
    diff |= a.charCodeAt(index) ^ b.charCodeAt(index);
  }

  return diff === 0;
}
