#!/usr/bin/env node

import { readFile } from "node:fs/promises";

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

function parseExpectedText(value) {
  if (!value) {
    return [];
  }

  return value
    .split("||")
    .map((text) => text.trim())
    .filter(Boolean);
}

function sanitizePathForOutput(path) {
  return path.replace(/\/projects\/[^/?#]+/g, "/projects/[id]");
}

function detectHostedAuthMechanism(bodyText) {
  const lowerBody = bodyText.toLowerCase();
  const inputTypes = Array.from(bodyText.matchAll(/<input\b[^>]*type=["']?([^"'\s>]+)/gi)).map((match) => match[1].toLowerCase());
  const inputNames = Array.from(bodyText.matchAll(/<input\b[^>]*name=["']?([^"'\s>]+)/gi)).map((match) => match[1].toLowerCase());
  const hasEmailInput = inputTypes.includes("email") || inputNames.some((name) => name.includes("email"));
  const hasPasswordInput = inputTypes.includes("password") || inputNames.some((name) => name.includes("password"));
  const hasOAuthText = lowerBody.includes("google") || lowerBody.includes("github") || lowerBody.includes("oauth");
  const hasMagicLinkText = lowerBody.includes("magic link") || lowerBody.includes("email link") || lowerBody.includes("one-time");
  const mode = hasEmailInput && hasPasswordInput
    ? "email_password"
    : hasEmailInput && hasOAuthText
      ? "interactive_email_or_oauth"
      : hasEmailInput
        ? "interactive_email"
        : hasOAuthText
          ? "interactive_oauth"
          : "interactive_session";

  return {
    mode,
    hasForm: /<form\b/i.test(bodyText),
    hasEmailInput,
    hasPasswordInput,
    hasMagicLinkText,
    hasOAuthText,
  };
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

function storageStateCookieMatchesOrigin(cookie, origin) {
  if (!cookie || typeof cookie.name !== "string" || typeof cookie.value !== "string") {
    return false;
  }

  if (typeof cookie.expires === "number" && cookie.expires !== -1 && cookie.expires < Date.now() / 1000) {
    return false;
  }

  if (cookie.secure === true && origin.protocol !== "https:") {
    return false;
  }

  if (typeof cookie.domain !== "string" || !cookie.domain) {
    return false;
  }

  const cookieDomain = cookie.domain.startsWith(".") ? cookie.domain.slice(1) : cookie.domain;
  return origin.hostname === cookieDomain || origin.hostname.endsWith(`.${cookieDomain}`);
}

async function loadStorageStateCookies(storageStatePath, origin) {
  let parsed;
  try {
    parsed = JSON.parse(await readFile(storageStatePath, "utf8"));
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOENT") {
      return { status: "missing" };
    }

    return { status: "invalid" };
  }

  if (!parsed || typeof parsed !== "object" || !Array.isArray(parsed.cookies)) {
    return { status: "invalid" };
  }

  const cookies = parsed.cookies.filter((cookie) => storageStateCookieMatchesOrigin(cookie, origin));
  return { status: "loaded", cookies };
}

function addStorageStateCookies(cookieJar, cookies) {
  for (const cookie of cookies) {
    cookieJar.set(cookie.name, cookie.value);
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

function classifyRouteCheck({ response, finalUrl, bodyText, requestedPath, appAccessPasswordProvided, expectedText, expectedTextForOutput }) {
  const finalUrlParts = new URL(finalUrl);
  const finalPath = sanitizePathForOutput(`${finalUrlParts.pathname}${finalUrlParts.search}`);
  const requestedPathLabel = sanitizePathForOutput(requestedPath);
  const boardsmithAccessGate = response.status >= 300 && response.status < 400
    ? false
    : finalUrlParts.pathname === "/access" || bodyText.includes("Private access");
  const hostedAuthLogin = finalUrlParts.pathname === "/login";
  const vercelBlocked = response.status === 401;
  const boardsmithRendered = response.status >= 200 && response.status < 300 && !vercelBlocked && !boardsmithAccessGate && !hostedAuthLogin;
  const missingExpectedText = boardsmithRendered
    ? expectedText.flatMap((text, index) => (bodyText.includes(text) ? [] : [expectedTextForOutput[index] ?? "[expected-text-redacted]"]))
    : [];

  return {
    path: requestedPathLabel,
    finalPath,
    statusCode: response.status,
    vercelBlocked,
    boardsmithAccessGate,
    hostedAuthLogin,
    ...(hostedAuthLogin ? { hostedAuthMechanism: detectHostedAuthMechanism(bodyText) } : {}),
    boardsmithRendered,
    expectedTextRequired: expectedText.length > 0,
    missingExpectedText,
    blockedReason: vercelBlocked
      ? "vercel_protection"
      : hostedAuthLogin
        ? "hosted_auth_login_required"
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
  const storageStatePath = env.BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE;
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
  const expectedText = parseExpectedText(env.BOARDSMITH_HOSTED_SMOKE_EXPECT_TEXT);
  const expectedTextForOutput = expectedText.map((text) => redactSensitiveText(text, { baseUrl, secrets: [bypassSecret, accessPassword] }));
  const warnings = [];
  let storageStateCookiesLoaded = 0;

  try {
    if (storageStatePath) {
      const storageState = await loadStorageStateCookies(storageStatePath, origin);
      if (storageState.status === "missing") {
        return {
          status: "failed",
          reason: "missing_storage_state_file",
          checkedAt: new Date().toISOString(),
          target: "redacted",
          vercelBypassSecretProvided: true,
          boardsmithAccessPasswordProvided: Boolean(accessPassword),
          hostedSmokeStorageStateProvided: true,
        };
      }

      if (storageState.status === "invalid") {
        return {
          status: "failed",
          reason: "invalid_storage_state_file",
          checkedAt: new Date().toISOString(),
          target: "redacted",
          vercelBypassSecretProvided: true,
          boardsmithAccessPasswordProvided: Boolean(accessPassword),
          hostedSmokeStorageStateProvided: true,
        };
      }

      addStorageStateCookies(cookieJar, storageState.cookies);
      storageStateCookiesLoaded = storageState.cookies.length;
    }

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
          expectedText,
          expectedTextForOutput,
        }),
      );
    }

    const vercelBlocked = checks.some((check) => check.vercelBlocked);
    const appGateBlocked = checks.some((check) => check.blockedReason === "boardsmith_access_password_missing");
    const hostedAuthBlocked = checks.some((check) => check.blockedReason === "hosted_auth_login_required");
    const serverFailed = checks.some((check) => check.statusCode >= 500);
    const expectedTextMissing = checks.some((check) => check.missingExpectedText.length > 0);
    const status = vercelBlocked || appGateBlocked || hostedAuthBlocked ? "blocked" : serverFailed || expectedTextMissing ? "failed" : "passed";

    return {
      status,
      ...(expectedTextMissing ? { reason: "expected_text_missing" } : {}),
      checkedAt: new Date().toISOString(),
      target: "redacted",
      vercelBypassSecretProvided: true,
      boardsmithAccessPasswordProvided: Boolean(accessPassword),
      hostedSmokeStorageStateProvided: Boolean(storageStatePath),
      hostedSmokeStorageStateCookiesLoaded: storageStateCookiesLoaded,
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
