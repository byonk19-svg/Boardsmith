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

Optional local authenticated session state:

```env
BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE=.auth/hosted-smoke-storage-state.json
```

Optional future browser/session smoke values, only if the hosted login layer requires an email/password account:

```env
BOARDSMITH_HOSTED_SMOKE_EMAIL=
BOARDSMITH_HOSTED_SMOKE_PASSWORD=
```

Notes:

- `BOARDSMITH_HOSTED_SMOKE_URL` is the private hosted base URL. Do not print it in logs or docs.
- `VERCEL_AUTOMATION_BYPASS_SECRET` is the Vercel bypass secret. Do not print it.
- `BOARDSMITH_ACCESS_PASSWORD` is the separate Boardsmith app-level access password. Do not print it.
- If the app-level gate is disabled for a specific private environment, omit `BOARDSMITH_ACCESS_PASSWORD`; the helper will report whether it reaches app routes without it.
- `BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE` is an optional local path to an authenticated browser storage-state JSON file. `.auth/` is ignored by git. Do not commit this file or paste its contents anywhere.
- `BOARDSMITH_HOSTED_SMOKE_EMAIL` and `BOARDSMITH_HOSTED_SMOKE_PASSWORD` are placeholders for a future browser/session harness only. Do not use personal credentials for repeatable automation. If the hosted login layer is email-link or OAuth-only, use an authorized local browser session for UI smoke instead of storing a personal password.

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
- loads matching cookies from `BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE` when configured
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
- `hosted_auth_login_required`: Vercel protection was bypassed and the Boardsmith `/access` helper ran, but the hosted deployment routed to `/login`. This login layer is outside the current Boardsmith app code and requires an authorized hosted browser/session before project-detail UI smoke can run. The helper reports sanitized `hostedAuthMechanism` booleans such as whether an email input, password input, or OAuth text was present; it does not print login page content.
- `missing_storage_state_file`: `BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE` is configured, but the local session-state file is missing.
- `invalid_storage_state_file`: the configured local session-state file is not readable as a Playwright-style storage-state JSON object with a `cookies` array.
- `invalid_hosted_smoke_url` or `request_error`: check local env values without printing them.

If the output says `missing_required_env`, confirm `.env.hosted-smoke.local` exists in the repo root and contains the required values. Do not paste its values into chat, docs, commits, screenshots, or logs.

## Authenticated Hosted UI Smoke

Current repo inspection shows Boardsmith itself has only the `/access` password gate. There is no `/login` route in the app source. If `npm run smoke:hosted` reports `hosted_auth_login_required` or a final path like `/login?next=%2Fprojects`, the remaining blocker is a hosted login/auth layer outside this repo's app-level access gate.

Safe path:

1. Keep Vercel Deployment Protection enabled.
2. Keep using `VERCEL_AUTOMATION_BYPASS_SECRET` for the Vercel layer.
3. Keep using `BOARDSMITH_ACCESS_PASSWORD` for the Boardsmith `/access` layer when configured.
4. For the hosted `/login` layer, use an authorized browser session or a dedicated non-critical smoke account.
5. Do not automate with a personal account unless this is explicitly documented as a temporary local-only manual choice.
6. Do not commit `BOARDSMITH_HOSTED_SMOKE_EMAIL`, `BOARDSMITH_HOSTED_SMOKE_PASSWORD`, cookies, session storage, screenshots, or login logs.

The current route helper does not submit hosted `/login` credentials. Add browser/session automation only after the hosted auth mechanism is documented well enough to avoid printing credentials, cookies, headers, hosted URLs, project refs, row data, screenshots, or sensitive logs.

### Observed Hosted Login Requirement

Task 73K ran a read-only hosted login probe on June 9, 2026 using the ignored local env file and sanitized output only. After Vercel bypass and the Boardsmith `/access` helper, `/projects` redirected through a hosted auth redirect and ended at `/login?next=%2Fprojects`.

Sanitized mechanism indicators:

- hosted login page present
- form present
- email input present
- OAuth text present
- password input not detected

Treat the hosted auth layer as an interactive email/OAuth session requirement, not a simple password-submittable route check. A dedicated non-critical smoke account is still the right account boundary, but the current no-dependency route helper should not try to submit hosted login credentials.

Safe setup path:

1. Create or confirm a dedicated non-critical smoke identity in the hosted auth provider used by the private deployment.
2. Prefer an account label such as `boardsmith-hosted-smoke` if the provider supports labels or aliases.
3. Grant only the minimum hosted access needed to open the private Boardsmith deployment and run smoke on clearly labeled non-critical projects.
4. If the hosted login uses email link or OAuth, sign in through a local authorized browser session for UI smoke. Do not commit browser storage state, cookies, screenshots, or login logs.
5. If a future browser harness supports a safe email/password login path, read `BOARDSMITH_HOSTED_SMOKE_EMAIL` and `BOARDSMITH_HOSTED_SMOKE_PASSWORD` from `.env.hosted-smoke.local` only, redact them from all output, and keep them out of docs, chat, commits, and screenshots.
6. If no dedicated smoke identity can be created, record the hosted UI smoke as blocked. Do not use a personal account for repeatable automation unless it is explicitly documented as a temporary local-only manual fallback.

## Local Authenticated Session State

Task 73L added a local session-state path for authenticated hosted smoke without adding packages or changing app auth. This path is for private local verification only.

Ignored file:

```text
.auth/hosted-smoke-storage-state.json
```

The repo ignores `.auth/`, so this file must not appear in `git status --short`. Treat it like a secret because it can contain cookies or other session material.

One-time local capture:

1. Use a dedicated non-critical hosted smoke identity in the hosted auth provider.
2. Open the hosted app through the intended private hosted access path.
3. Complete Vercel bypass, the Boardsmith `/access` gate, and the hosted `/login` layer in a local browser session.
4. Export browser storage state to `.auth/hosted-smoke-storage-state.json` using a local browser tool that can save Playwright-style storage state.
5. Do not commit the storage-state file, screenshots, cookies, browser profile data, or login logs.
6. Confirm the file is ignored:

```bash
git check-ignore -v .auth/hosted-smoke-storage-state.json
git status --short
```

Route-level authenticated check:

1. Set this in `.env.hosted-smoke.local`:

```env
BOARDSMITH_HOSTED_SMOKE_STORAGE_STATE=.auth/hosted-smoke-storage-state.json
```

2. Run:

```bash
npm run smoke:hosted
```

When the session file is valid for the hosted domain, the helper loads only matching cookies into memory and checks the configured paths. Output reports only whether a storage-state path was provided and how many matching cookies were loaded. It does not print cookie names, values, the storage-state path, the hosted URL, request headers, project refs, row data, or page content.

If the session is stale or missing, rerun the one-time local capture. If the smoke identity is no longer needed or may be exposed, remove `.auth/hosted-smoke-storage-state.json` and rotate or revoke the hosted auth session in the provider.

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
