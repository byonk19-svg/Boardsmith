import { execFile } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import { afterEach, describe, expect, it } from "vitest";

const execFileAsync = promisify(execFile);

type CapturedRequest = {
  path: string;
  bypassHeader: string | undefined;
  setBypassCookieHeader: string | undefined;
  cookie: string | undefined;
};

const servers: ReturnType<typeof createServer>[] = [];
const tempDirs: string[] = [];

type SmokeCheckResult = {
  status: string;
  checks: {
    path: string;
    finalPath: string;
    statusCode: number;
    vercelBlocked: boolean;
    boardsmithAccessGate: boolean;
    hostedAuthLogin: boolean;
    hostedAuthMechanism?: {
      mode: string;
      hasForm: boolean;
      hasEmailInput: boolean;
      hasPasswordInput: boolean;
      hasMagicLinkText: boolean;
      hasOAuthText: boolean;
    };
    boardsmithRendered: boolean;
    blockedReason: string | null;
  }[];
};

type PackageJson = {
  scripts?: Record<string, string>;
};

afterEach(async () => {
  await Promise.all(
    servers.map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => {
            if (error) {
              reject(error);
              return;
            }
            resolve();
          });
        }),
    ),
  );
  servers.length = 0;

  await Promise.all(tempDirs.map((dir) => rm(dir, { force: true, recursive: true })));
  tempDirs.length = 0;
});

async function startSmokeServer({ hostedLoginRequired = false } = {}) {
  const capturedRequests: CapturedRequest[] = [];
  const server = createServer((request: IncomingMessage, response: ServerResponse) => {
    capturedRequests.push({
      path: request.url ?? "",
      bypassHeader: Array.isArray(request.headers["x-vercel-protection-bypass"])
        ? request.headers["x-vercel-protection-bypass"][0]
        : request.headers["x-vercel-protection-bypass"],
      setBypassCookieHeader: Array.isArray(request.headers["x-vercel-set-bypass-cookie"])
        ? request.headers["x-vercel-set-bypass-cookie"][0]
        : request.headers["x-vercel-set-bypass-cookie"],
      cookie: Array.isArray(request.headers.cookie) ? request.headers.cookie.join("; ") : request.headers.cookie,
    });

    if (request.headers["x-vercel-protection-bypass"] !== "test-bypass-secret") {
      response.writeHead(401, { "content-type": "text/plain" });
      response.end("Vercel protection");
      return;
    }

    if (request.url?.startsWith("/access/verify")) {
      response.writeHead(303, {
        location: "/projects",
        "set-cookie": "boardsmith_access=test-cookie; Path=/; HttpOnly",
      });
      response.end();
      return;
    }

    if (request.url?.startsWith("/projects")) {
      if (hostedLoginRequired) {
        if (request.headers.cookie?.includes("hosted_auth=session-cookie")) {
          response.writeHead(200, { "content-type": "text/html" });
          response.end("<main>Boardsmith projects</main>");
          return;
        }

        response.writeHead(307, { location: "/login?next=%2Fprojects" });
        response.end();
        return;
      }

      if (!request.headers.cookie?.includes("boardsmith_access=test-cookie")) {
        response.writeHead(307, { location: "/access?returnTo=%2Fprojects" });
        response.end();
        return;
      }

      response.writeHead(200, { "content-type": "text/html" });
      response.end("<main>Boardsmith projects</main>");
      return;
    }

    if (request.url?.startsWith("/login")) {
      response.writeHead(200, { "content-type": "text/html" });
      response.end(`
        <main>
          <form action="/login" method="post">
            <label>Email<input name="email" type="email" /></label>
            <button type="submit">Continue with email</button>
          </form>
          <button type="button">Continue with GitHub</button>
        </main>
      `);
      return;
    }

    response.writeHead(200, {
      "content-type": "text/html",
      "set-cookie": "vercel_bypass=test-cookie; Path=/; HttpOnly",
    });
    response.end("<main>Boardsmith private access</main>");
  });

  servers.push(server);
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  if (!address || typeof address === "string") {
    throw new Error("Expected a TCP test server address.");
  }

  return { baseUrl: `http://127.0.0.1:${String(address.port)}`, capturedRequests };
}

async function writeStorageStateFile(baseUrl: string) {
  const dir = await mkdtemp(join(tmpdir(), "boardsmith-hosted-smoke-"));
  tempDirs.push(dir);
  const path = join(dir, "storage-state.json");
  const domain = new URL(baseUrl).hostname;

  await writeFile(
    path,
    JSON.stringify({
      cookies: [
        {
          name: "hosted_auth",
          value: "session-cookie",
          domain,
          path: "/",
          expires: -1,
          httpOnly: true,
          secure: false,
          sameSite: "Lax",
        },
      ],
      origins: [],
    }),
  );

  return path;
}

describe("hosted smoke check script", () => {
  it("keeps a local hosted smoke npm command that loads the ignored env file", async () => {
    const packageJson = JSON.parse(await readFile("package.json", "utf8")) as PackageJson;

    expect(packageJson.scripts?.["smoke:hosted"]).toBe("node --env-file-if-exists=.env.hosted-smoke.local scripts/hosted-smoke-check.mjs");
  });

  it("sends Vercel bypass headers and redacts secret-bearing values", async () => {
    const { baseUrl, capturedRequests } = await startSmokeServer();

    const { stdout } = await execFileAsync("node", ["scripts/hosted-smoke-check.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOARDSMITH_HOSTED_SMOKE_URL: baseUrl,
        VERCEL_AUTOMATION_BYPASS_SECRET: "test-bypass-secret",
        BOARDSMITH_ACCESS_PASSWORD: "test-access-password",
        BOARDSMITH_HOSTED_SMOKE_PATHS: "/projects",
      },
    });

    const result = JSON.parse(stdout) as SmokeCheckResult;
    expect(result.status).toBe("passed");
    expect(result.checks).toEqual([
      {
        path: "/projects",
        finalPath: "/projects",
        statusCode: 200,
        vercelBlocked: false,
        boardsmithAccessGate: false,
        hostedAuthLogin: false,
        boardsmithRendered: true,
        blockedReason: null,
      },
    ]);
    expect(capturedRequests.some((request) => request.bypassHeader === "test-bypass-secret")).toBe(true);
    expect(capturedRequests.every((request) => request.setBypassCookieHeader === "true")).toBe(true);
    expect(capturedRequests.some((request) => request.cookie?.includes("boardsmith_access=test-cookie"))).toBe(true);
    expect(stdout).not.toContain("test-bypass-secret");
    expect(stdout).not.toContain("test-access-password");
    expect(stdout).not.toContain(baseUrl);
  });

  it("reports hosted login redirects as an auth blocker instead of a rendered Boardsmith page", async () => {
    const { baseUrl } = await startSmokeServer({ hostedLoginRequired: true });

    const failure = await execFileAsync("node", ["scripts/hosted-smoke-check.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOARDSMITH_HOSTED_SMOKE_URL: baseUrl,
        VERCEL_AUTOMATION_BYPASS_SECRET: "test-bypass-secret",
        BOARDSMITH_ACCESS_PASSWORD: "test-access-password",
        BOARDSMITH_HOSTED_SMOKE_PATHS: "/projects",
      },
    }).catch((error: unknown) => error);

    if (!failure || typeof failure !== "object" || !("stdout" in failure)) {
      throw new Error("Expected hosted smoke check script to fail with stdout.");
    }

    const result = JSON.parse((failure as { stdout: string }).stdout) as SmokeCheckResult;
    expect(result.status).toBe("blocked");
    expect(result.checks).toEqual([
      {
        path: "/projects",
        finalPath: "/login?next=%2Fprojects",
        statusCode: 200,
        vercelBlocked: false,
        boardsmithAccessGate: false,
        hostedAuthLogin: true,
        hostedAuthMechanism: {
          mode: "interactive_email_or_oauth",
          hasForm: true,
          hasEmailInput: true,
          hasPasswordInput: false,
          hasMagicLinkText: false,
          hasOAuthText: true,
        },
        boardsmithRendered: false,
        blockedReason: "hosted_auth_login_required",
      },
    ]);
    expect((failure as { stdout: string }).stdout).not.toContain("test-bypass-secret");
    expect((failure as { stdout: string }).stdout).not.toContain("test-access-password");
    expect((failure as { stdout: string }).stdout).not.toContain(baseUrl);
  });

  it("uses a local storage-state cookie file to verify an authenticated hosted session", async () => {
    const { baseUrl, capturedRequests } = await startSmokeServer({ hostedLoginRequired: true });
    const storageStatePath = await writeStorageStateFile(baseUrl);

    const { stdout } = await execFileAsync("node", ["scripts/hosted-smoke-check.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOARDSMITH_HOSTED_SMOKE_URL: baseUrl,
        VERCEL_AUTOMATION_BYPASS_SECRET: "test-bypass-secret",
        BOARDSMITH_ACCESS_PASSWORD: "test-access-password",
        BOARDSMITH_HOSTED_SMOKE_PATHS: "/projects",
        BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE: storageStatePath,
      },
    });

    const result = JSON.parse(stdout) as SmokeCheckResult & {
      hostedSmokeStorageStateProvided: boolean;
      hostedSmokeStorageStateCookiesLoaded: number;
    };
    expect(result.status).toBe("passed");
    expect(result.hostedSmokeStorageStateProvided).toBe(true);
    expect(result.hostedSmokeStorageStateCookiesLoaded).toBe(1);
    expect(result.checks).toEqual([
      {
        path: "/projects",
        finalPath: "/projects",
        statusCode: 200,
        vercelBlocked: false,
        boardsmithAccessGate: false,
        hostedAuthLogin: false,
        boardsmithRendered: true,
        blockedReason: null,
      },
    ]);
    expect(capturedRequests.some((request) => request.cookie?.includes("hosted_auth=session-cookie"))).toBe(true);
    expect(stdout).not.toContain("test-bypass-secret");
    expect(stdout).not.toContain("test-access-password");
    expect(stdout).not.toContain("session-cookie");
    expect(stdout).not.toContain(storageStatePath);
    expect(stdout).not.toContain(baseUrl);
  });

  it("fails safely when the configured storage-state file is missing", async () => {
    const { baseUrl } = await startSmokeServer();
    const missingStorageStatePath = join(tmpdir(), "boardsmith-missing-storage-state.json");

    const failure = await execFileAsync("node", ["scripts/hosted-smoke-check.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOARDSMITH_HOSTED_SMOKE_URL: baseUrl,
        VERCEL_AUTOMATION_BYPASS_SECRET: "test-bypass-secret",
        BOARDSMITH_ACCESS_PASSWORD: "test-access-password",
        BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE: missingStorageStatePath,
      },
    }).catch((error: unknown) => error);

    if (!failure || typeof failure !== "object" || !("stdout" in failure)) {
      throw new Error("Expected hosted smoke check script to fail with stdout.");
    }

    const result = JSON.parse((failure as { stdout: string }).stdout) as {
      status: string;
      reason: string;
      hostedSmokeStorageStateProvided: boolean;
    };
    expect(result.status).toBe("failed");
    expect(result.reason).toBe("missing_storage_state_file");
    expect(result.hostedSmokeStorageStateProvided).toBe(true);
    expect((failure as { stdout: string }).stdout).not.toContain("test-bypass-secret");
    expect((failure as { stdout: string }).stdout).not.toContain("test-access-password");
    expect((failure as { stdout: string }).stdout).not.toContain(missingStorageStatePath);
    expect((failure as { stdout: string }).stdout).not.toContain(baseUrl);
  });

  it("fails clearly when the bypass secret is missing without printing env values", async () => {
    const { baseUrl } = await startSmokeServer();

    const failure = await execFileAsync("node", ["scripts/hosted-smoke-check.mjs"], {
      cwd: process.cwd(),
      env: {
        ...process.env,
        BOARDSMITH_HOSTED_SMOKE_URL: baseUrl,
        VERCEL_AUTOMATION_BYPASS_SECRET: "",
        BOARDSMITH_ACCESS_PASSWORD: "test-access-password",
      },
    }).catch((error: unknown) => error);

    if (!failure || typeof failure !== "object" || !("stdout" in failure)) {
      throw new Error("Expected hosted smoke check script to fail with stdout.");
    }

    expect((failure as { stdout: string }).stdout).toContain("VERCEL_AUTOMATION_BYPASS_SECRET");
    expect((failure as { stdout: string }).stdout).not.toContain("test-access-password");
    expect((failure as { stdout: string }).stdout).not.toContain(baseUrl);
  });
});
