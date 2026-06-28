import { sanitizeReturnTo } from "@/lib/access/private-access";

type LoginRedirectSearchParams = {
  next?: string | string[];
  redirectTo?: string | string[];
  returnTo?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export function loginReturnTo(searchParams: LoginRedirectSearchParams): string {
  return sanitizeReturnTo(firstParam(searchParams.redirectTo) ?? firstParam(searchParams.next) ?? firstParam(searchParams.returnTo));
}

export function buildLoginRedirectPath(searchParams: LoginRedirectSearchParams, accessGateEnabled: boolean): string {
  const returnTo = loginReturnTo(searchParams);
  if (!accessGateEnabled) {
    return returnTo;
  }

  if (returnTo === "/") {
    return "/access";
  }

  const params = new URLSearchParams({ returnTo });
  return `/access?${params.toString()}`;
}
