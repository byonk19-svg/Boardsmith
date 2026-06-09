# Hosted Smoke Automation

Date: June 8, 2026

## Purpose

Boardsmith hosted UI smoke checks can be blocked before app route handling when Vercel Deployment Protection is enabled. This runbook documents a secret-safe automation path that keeps Vercel protection enabled while allowing authorized smoke checks to reach the private hosted app.

This is for private MVP verification only. It does not make the hosted app public and does not weaken the Boardsmith `/access` gate.

## Source

Vercel documents [Protection Bypass for Automation](https://vercel.com/docs/deployment-protection/methods-to-bypass-deployment-protection/protection-bypass-automation) as an authorized way to let tools reach protected deployments by sending:

- `x-vercel-protection-bypass`
- `x-vercel-set-bypass-cookie: true` when browser follow-up requests need a bypass cookie

Use the official Vercel Deployment Protection settings and documentation as the source of truth for creating, rotating, and revoking bypass secrets.

## One-Time Vercel Setup

1. Open the correct Boardsmith project in the Vercel dashboard.
2. Create a dedicated Protection Bypass for Automation secret.
3. Label it clearly, for example `boardsmith-hosted-smoke`.
4. Store the secret only in a secret-safe local, CI, or Codex environment variable.
5. Do not paste the secret into docs, chat, commits, screenshots, logs, or issue comments.

Recommended local environment variable name:

```bash
VERCEL_AUTOMATION_BYPASS_SECRET=
```

This secret bypasses Vercel Deployment Protection only. If `BOARDSMITH_ACCESS_PASSWORD` is configured, the Boardsmith app-level private access gate still applies.

## Local Env File

For repeatable local runs, create an ignored file named `.env.hosted-smoke.local` in the repo root. The existing `.gitignore` pattern `.env*.local` covers this file, so it must stay untracked.

Do not commit this file.

```env
BOARDSMITH_HOSTED_SMOKE_URL=
VERCEL_AUTOMATION_BYPASS_SECRET=
BOARDSMITH_ACCESS_PASSWORD=
```

Optional route list for the route-level helper:

```env
BOARDSMITH_HOSTED_SMOKE_PATHS=/,/projects
```

Notes:

- `BOARDSMITH_HOSTED_SMOKE_URL` is the private hosted base URL. Do not print it in logs or docs.
- `VERCEL_AUTOMATION_BYPASS_SECRET` is the Vercel bypass secret. Do not print it.
- `BOARDSMITH_ACCESS_PASSWORD` is the separate Boardsmith app-level access password. Do not print it.
- If the app-level gate is disabled for a specific private environment, omit `BOARDSMITH_ACCESS_PASSWORD`; the helper will report whether it reaches app routes without it.

## Route-Level Check

Use the no-dependency helper for a secret-safe route reachability check:

```bash
npm run smoke:hosted
```

The npm command uses Node's `--env-file-if-exists=.env.hosted-smoke.local` flag. If the file is missing, the helper still runs and reports the missing env vars in sanitized JSON.

The helper:

- reads secrets only from environment variables
- sends `x-vercel-protection-bypass`
- asks Vercel to set a bypass cookie with `x-vercel-set-bypass-cookie: true`
- posts to `/access/verify` only when `BOARDSMITH_ACCESS_PASSWORD` is provided
- checks `/` and `/projects` by default
- redacts the hosted URL, host, bypass secret, and app access password from error output
- prints sanitized status only

Expected success shape:

```json
{
  "status": "passed",
  "target": "redacted",
  "vercelBypassSecretProvided": true,
  "boardsmithAccessPasswordProvided": true
}
```

Blocked results:

- `vercel_protection`: the bypass secret is missing, wrong, revoked, or not attached to the correct Vercel project.
- `boardsmith_access_password_missing`: Vercel protection was bypassed, but the app-level `/access` gate still needs `BOARDSMITH_ACCESS_PASSWORD`.
- `invalid_hosted_smoke_url` or `request_error`: check local env values without printing them.

If the output says `missing_required_env`, confirm `.env.hosted-smoke.local` exists in the repo root and contains the required values. Do not paste its values into chat, docs, commits, screenshots, or logs.

## Browser Smoke With Bypass Header

For browser automation tools that support extra HTTP headers, configure the first navigation with:

```text
x-vercel-protection-bypass: <VERCEL_AUTOMATION_BYPASS_SECRET>
x-vercel-set-bypass-cookie: true
```

After Vercel sets the bypass cookie, continue through the normal Boardsmith `/access` flow if the app-level gate is enabled.

Do not put the bypass secret in a URL query string for Boardsmith hosted smoke. The header path is preferred because URLs are more likely to be captured in logs, screenshots, and browser history.

## Hosted Tweak This Plan Smoke

After the route-level check passes, run the UI smoke through the intended private hosted access path using a clearly labeled non-critical test project:

1. Open an active non-critical project with a latest generated plan.
2. Confirm `Tweak this plan` appears.
3. Submit one simple revision instruction.
4. Confirm the revised plan becomes latest.
5. Confirm the old plan remains in history.
6. Confirm the revised-vs-prior comparison copy is understandable.
7. Confirm the `Revised` marker appears in plan history.
8. Confirm print preview works for the revised latest plan.
9. Confirm archived projects do not allow new revisions but still allow detail/history/print viewing.
10. Confirm copy avoids engineering approval, structural approval, wall-safety guarantee, child-safety certification, load rating, fabrication-ready output, CAD/CNC readiness, and export claims.

## Redaction Rules

Do not record or commit:

- hosted URLs
- Vercel project refs
- bypass secrets
- access passwords
- cookies
- request headers
- connection strings
- Supabase row data
- screenshots that reveal private hosted data
- sensitive logs

Sanitized route names such as `/`, `/projects`, `/projects/[id]`, and `/projects/[id]/print` are acceptable when documenting smoke coverage.

## Rotate Or Revoke The Bypass Secret

Rotate or revoke the `boardsmith-hosted-smoke` bypass secret if:

- it was pasted into chat, docs, commits, screenshots, logs, browser history, or issue comments
- the local machine or CI environment may be compromised
- the smoke path is no longer needed
- Vercel protection behavior changes unexpectedly

After rotation:

1. Update only the secret-safe environment variable or secret manager value.
2. Rerun `npm run smoke:hosted`.
3. Do not commit the new secret or any output containing it.

## Non-Goals

- No public access.
- No disabling Vercel Deployment Protection.
- No bypass of the Boardsmith `/access` gate.
- No schema or migration changes.
- No app-generated PDF, SVG, DXF, CAD, CNC, or export pipeline.
- No public sharing, marketplace, shopping, pricing, vendor, inventory, auth expansion, production multi-user behavior, or new project types.
