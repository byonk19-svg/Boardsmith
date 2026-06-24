import type { Route } from "next";
import { redirect } from "next/navigation";
import { buildLoginRedirectPath } from "@/lib/access/login-redirect";
import { isAccessGateEnabled } from "@/lib/access/private-access";

export const dynamic = "force-dynamic";

export default async function LoginCompatibilityPage({
  searchParams,
}: {
  searchParams: Promise<{
    next?: string | string[];
    redirectTo?: string | string[];
    returnTo?: string | string[];
  }>;
}) {
  redirect(buildLoginRedirectPath(await searchParams, isAccessGateEnabled()) as Route);
}
