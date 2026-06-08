import { execFile } from "node:child_process";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
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

type SmokeCheckResult = {
  status: string;
  checks: {
    path: string;
    finalPath: string;
    statusCode: number;
    vercelBlocked: boolean;
    boardsmithAccessGate: boolean;
    boardsmithRendered: boolean;
    blockedReason: string | null;
  }[];
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
});

async function startSmokeServer() {
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
      if (!request.headers.cookie?.includes("boardsmith_access=test-cookie")) {
        response.writeHead(307, { location: "/access?returnTo=%2Fprojects" });
        response.end();
        return;
      }

      response.writeHead(200, { "content-type": "text/html" });
      response.end("<main>Boardsmith projects</main>");
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

describe("hosted smoke check script", () => {
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
    expect(result.checks).toEqual([{ path: "/projects", finalPath: "/projects", statusCode: 200, vercelBlocked: false, boardsmithAccessGate: false, boardsmithRendered: true, blockedReason: null }]);
    expect(capturedRequests.some((request) => request.bypassHeader === "test-bypass-secret")).toBe(true);
    expect(capturedRequests.every((request) => request.setBypassCookieHeader === "true")).toBe(true);
    expect(capturedRequests.some((request) => request.cookie?.includes("boardsmith_access=test-cookie"))).toBe(true);
    expect(stdout).not.toContain("test-bypass-secret");
    expect(stdout).not.toContain("test-access-password");
    expect(stdout).not.toContain(baseUrl);
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
