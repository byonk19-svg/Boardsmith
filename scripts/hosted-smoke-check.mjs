#!/usr/bin/env node

const bypassHeaderName = "x-vercel-protection-bypass";
const setBypassCookieHeaderName = "x-vercel-set-bypass-cookie";
const defaultSmokePaths = ["/", "/projects"];

export function buildBypassHeaders(secret) {
  return {
    [bypassHeaderName]: secret,
    [setBypassCookieHeaderName]: "true",
  };
}

export function redactSensitiveText(value, { baseUrl, secrets }) {
  let redacted = value;
  for (const secret of secrets) {
    if (secret) {
      redacted = redacted.split(secret).join("[secret-redacted]");
    }
  }

  if (baseUrl) {
    try {
      const url = new URL(baseUrl);
      redacted = redacted.split(url.origin).join("[hosted-url-redacted]");
      redacted = redacted.split(url.host).join("[host-redacted]");
    } catch {
      redacted = redacted.split(baseUrl).join("[hosted-url-redacted]");
    }
  }

  return redacted;
}

function parseSmokePaths(value) {
  if (!value) {
    return defaultSmokePaths;
  }

  const paths = value
    .split(",")
    .map((path) => path.trim())
    .filter(Boolean)
    .map((path) => (path.startsWith("/") ? path : `/${path}`));

  return paths.length > 0 ? paths : defaultSmokePaths;
}

function sanitizePathForOutput(path) {
  return path.replace(/\/projects\/[^/?#]+/g, "/projects/[id]");
}

function createCookieHeader(cookieJar) {
  return Array.from(cookieJar.entries())
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

function updateCookieJar(cookieJar, headers) {
  const setCookieHeaders = typeof headers.getSetCookie === "function" ? headers.getSetCookie() : [];
  const fallbackHeader = headers.get("set-cookie");
  const headersToRead = setCookieHeaders.length > 0 ? setCookieHeaders : fallbackHeader ? [fallbackHeader] : [];

  for (const header of headersToRead) {
    for (const cookie of header.split(/,\s*(?=[^=;,\s]+=)/)) {
      const [nameValue] = cookie.split(";");
      const separatorIndex = nameValue.indexOf("=");
      if (separatorIndex <= 0) {
        continue;
      }

      const name = nameValue.slice(0, separatorIndex).trim();
      const value = nameValue.slice(separatorIndex + 1).trim();
      if (name && value) {
        cookieJar.set(name, value);
      }
    }
  }
}

async function fetchWithCookies(url, { method = "GET", headers = {}, body, cookieJar, maxRedirects = 4 }) {
  let nextUrl = url;
  let response;
  const redirects = [];

  for (let attempt = 0; attempt <= maxRedirects; attempt += 1) {
    const cookieHeader = createCookieHeader(cookieJar);
    response = await fetch(nextUrl, {
      method,
      headers: {
        ...headers,
        ...(cookieHeader ? { cookie: cookieHeader } : {}),
      },
      body,
      redirect: "manual",
    });
    updateCookieJar(cookieJar, response.headers);

    const location = response.headers.get("location");
    if (!location || response.status < 300 || response.status >= 400) {
      return { response, finalUrl: nextUrl, redirects };
    }

    const redirectedUrl = new URL(location, nextUrl).toString();
    redirects.push(redirectedUrl);
    nextUrl = redirectedUrl;
    method = "GET";
    body = undefined;
  }

  return { response, finalUrl: nextUrl, redirects };
}

function classifyRouteCheck({ response, finalUrl, bodyText, requestedPath, appAccessPasswordProvided }) {
  const finalPath = sanitizePathForOutput(`${new URL(finalUrl).pathname}${new URL(finalUrl).search}`);
  const requestedPathLabel = sanitizePathForOutput(requestedPath);
  const boardsmithAccessGate = response.status >= 300 && response.status < 400
    ? false
    : new URL(finalUrl).pathname === "/access" || bodyText.includes("Private access");
  const vercelBlocked = response.status === 401;
  const boardsmithRendered = response.status >= 200 && response.status < 300 && !vercelBlocked && !boardsmithAccessGate;

  return {
    path: requestedPathLabel,
    finalPath,
    statusCode: response.status,
    vercelBlocked,
    boardsmithAccessGate,
    boardsmithRendered,
    blockedReason: vercelBlocked
      ? "vercel_protection"
      : boardsmithAccessGate && !appAccessPasswordProvided
        ? "boardsmith_access_password_missing"
        : null,
  };
}

async function readResponseText(response) {
  try {
    return await response.text();
  } catch {
    return "";
  }
}

export async function runHostedSmokeCheck(env = process.env) {
  const baseUrl = env.BOARDSMITH_HOSTED_SMOKE_URL;
  const bypassSecret = env.VERCEL_AUTOMATION_BYPASS_SECRET;
  const accessPassword = env.BOARDSMITH_ACCESS_PASSWORD;
  const missing = [];

  if (!baseUrl) {
    missing.push("BOARDSMITH_HOSTED_SMOKE_URL");
  }
  if (!bypassSecret) {
    missing.push("VERCEL_AUTOMATION_BYPASS_SECRET");
  }
  if (missing.length > 0) {
    return {
      status: "failed",
      reason: "missing_required_env",
      missing,
      checkedAt: new Date().toISOString(),
    };
  }

  let origin;
  try {
    origin = new URL(baseUrl);
  } catch (error) {
    return {
      status: "failed",
      reason: "invalid_hosted_smoke_url",
      detail: redactSensitiveText(error instanceof Error ? error.message : String(error), { baseUrl, secrets: [bypassSecret, accessPassword] }),
      checkedAt: new Date().toISOString(),
    };
  }

  const headers = buildBypassHeaders(bypassSecret);
  const cookieJar = new Map();
  const paths = parseSmokePaths(env.BOARDSMITH_HOSTED_SMOKE_PATHS);
  const warnings = [];

  try {
    await fetchWithCookies(new URL("/access?returnTo=/projects", origin).toString(), {
      headers,
      cookieJar,
      maxRedirects: 3,
    });

    if (accessPassword) {
      const formData = new URLSearchParams();
      formData.set("password", accessPassword);
      formData.set("returnTo", "/projects");
      const accessResult = await fetchWithCookies(new URL("/access/verify", origin).toString(), {
        method: "POST",
        headers: {
          ...headers,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: formData,
        cookieJar,
        maxRedirects: 4,
      });

      if (accessResult.response.status === 401) {
        warnings.push("Vercel protection still returned 401 during Boardsmith access verification.");
      } else if (new URL(accessResult.finalUrl).pathname === "/access") {
        warnings.push("Boardsmith access verification ended at /access. Confirm BOARDSMITH_ACCESS_PASSWORD is correct.");
      }
    } else {
      warnings.push("BOARDSMITH_ACCESS_PASSWORD was not provided, so app-level access-gate login was not attempted.");
    }

    const checks = [];
    for (const path of paths) {
      const result = await fetchWithCookies(new URL(path, origin).toString(), {
        headers,
        cookieJar,
        maxRedirects: 4,
      });
      const bodyText = await readResponseText(result.response);
      checks.push(
        classifyRouteCheck({
          response: result.response,
          finalUrl: result.finalUrl,
          bodyText,
          requestedPath: path,
          appAccessPasswordProvided: Boolean(accessPassword),
        }),
      );
    }

    const vercelBlocked = checks.some((check) => check.vercelBlocked);
    const appGateBlocked = checks.some((check) => check.blockedReason === "boardsmith_access_password_missing");
    const serverFailed = checks.some((check) => check.statusCode >= 500);
    const status = vercelBlocked || appGateBlocked ? "blocked" : serverFailed ? "failed" : "passed";

    return {
      status,
      checkedAt: new Date().toISOString(),
      target: "redacted",
      vercelBypassSecretProvided: true,
      boardsmithAccessPasswordProvided: Boolean(accessPassword),
      warnings,
      checks,
    };
  } catch (error) {
    return {
      status: "failed",
      reason: "request_error",
      detail: redactSensitiveText(error instanceof Error ? error.message : String(error), { baseUrl, secrets: [bypassSecret, accessPassword] }),
      checkedAt: new Date().toISOString(),
      target: "redacted",
    };
  }
}

if (import.meta.url === new URL(`file://${process.argv[1].replace(/\\/g, "/")}`).href) {
  const result = await runHostedSmokeCheck();
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  process.exitCode = result.status === "passed" ? 0 : 1;
}
