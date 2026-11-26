---
name: sentry
description: >-
  Investigate production errors through the official Sentry MCP server. Use
  this skill when the user wants to look up an issue by ID or URL, read the
  stacktrace, check error frequency and first-seen timing, triage unresolved
  issues, or find which release caused a crash. Triggers on phrases like
  "look up Sentry issue 12345", "investigate this TypeError", "how many
  times has this error fired", "triage production errors", "what release
  caused this crash", or any request to inspect errors captured by Sentry.
  Use this skill even if the user just says "check Sentry", "open Sentry",
  "look at the errors", or hands you a sentry.io URL.
---

# Sentry Skill

This skill exposes the **official Sentry MCP server** (`mcp-server-sentry`, the Anthropic-maintained reference implementation) as a single Fractal toolset. The server speaks the Sentry REST API and gives the agent direct, structured access to issue details, stacktraces, and event metadata for the projects the configured auth token can see.

Sentry is the de-facto error-tracking and performance-monitoring platform for production software. The MCP wrapper focuses on the read path — fetching a single issue and the event behind it so the agent can reason about root cause — while leaving bulk list / search / write operations for the [Sentry REST API](https://docs.sentry.io/api/).

## Toolset

- `mcp` — Official Sentry MCP server (`mcp-server-sentry`). Default transport is **stdio**. The server is a thin Python wrapper around the public Sentry REST API and is run with `uvx` (no persistent install required). Authentication is driven by the `SENTRY_AUTH_TOKEN` environment variable (or the `--auth-token` flag). All requests run against the public Sentry API at `https://sentry.io/api/0/`.

## Tools

| Tool | What it does |
|---|---|
| `get_sentry_issue` | Retrieve and analyze a Sentry issue by numeric ID or by full Sentry issue URL. Returns the issue title, ID, status (unresolved / resolved / ignored / resolvedInNextRelease / resolvedInRelease), level (fatal / error / warning / info / debug / sample), first-seen and last-seen timestamps, event count, and the full formatted stacktrace for the most recent event. Accepts a bare numeric ID (`"12345"`) or any `https://<subdomain>.sentry.io/issues/<id>/` URL. |

## What `get_sentry_issue` returns

| Field | Description |
|---|---|
| `title` | Issue title (e.g. `TypeError: Cannot read properties of undefined (reading 'id')`). |
| `issue_id` | Numeric Sentry issue ID. |
| `status` | One of `unresolved`, `resolved`, `ignored`, `resolvedInNextRelease`, `resolvedInRelease`. |
| `level` | Severity — `fatal`, `error`, `warning`, `info`, `debug`, or `sample`. |
| `first_seen` | ISO-8601 timestamp of the very first occurrence. |
| `last_seen` | ISO-8601 timestamp of the most recent occurrence. |
| `count` | Total number of events Sentry has recorded for this issue. |
| `stacktrace` | Formatted multi-exception stacktrace (every frame with file, line, function, and source context). |

## Usage rules

- **Always pass a numeric ID or a full Sentry URL to `get_sentry_issue`.** The tool accepts `"12345"` (bare ID) or `https://<your-org>.sentry.io/issues/12345/` (full URL). Non-`.sentry.io` hostnames, malformed paths, or non-numeric IDs are rejected with a `SentryError`. If the user pastes a shortened or staging URL, ask for the canonical sentry.io URL before calling the tool.
- **Prefer the URL form when the user pastes one.** If the user hands you `https://acme.sentry.io/issues/98765/events/abcdef/`, normalize it to `https://acme.sentry.io/issues/98765/` (drop the `/events/<id>/` suffix) before passing it to the tool — the parser only looks at the final path segment after `/issues/`.
- **Read `SENTRY_AUTH_TOKEN` from the environment, never from a prompt.** A Sentry auth token grants the same access as the user that minted it, including the ability to read every project that user can see. Treat it like a database password. Do not echo it back in tool output and do not commit it to a repo.
- **Scope tokens to the projects you actually need.** Create a dedicated auth token in Sentry → Settings → Auth Tokens with only `project:read` and `event:read` scopes. Do not give the agent a token that also has `project:write`, `org:write`, or `team:admin` unless the user has explicitly asked for write operations.
- **Triaging "is this still happening" questions.** Call `get_sentry_issue` once and compare `last_seen` to the current time, then read `count` and `status`. A `resolved` issue with a `last_seen` in the past hour means it was auto-resolved or marked resolved manually and is still firing — surface that to the user before assuming it is fixed.
- **Multi-exception stacktraces.** If a Sentry event captures several exceptions (chained `cause` / `suppressed` exceptions), the formatted `stacktrace` field contains all of them, one block per exception. Do not stop reading at the first one — the root cause is often the innermost exception.
- **Use the stacktrace source context for hypotheses.** The formatted stacktrace includes up to a few lines of source code for each frame. Read those lines before guessing at the root cause; Sentry is the source of truth for what the production code path actually looked like.
- **Self-hosted Sentry requires `SENTRY_BASE_URL`.** If the user is on a self-hosted Sentry deployment (e.g. `https://errors.acme.internal`), set `SENTRY_BASE_URL` to that host before calling the tool. The tool's URL parser still requires the hostname to end in `.sentry.io` for URL-form input, so for self-hosted instances pass a bare numeric ID, not a URL.
- **Pair with Sentry's web UI for actions the MCP tool does not support.** Bulk search, listing all unresolved issues, marking an issue resolved, assigning an issue, or commenting on an issue are not exposed by this server. Direct the user to `https://<org>.sentry.io/issues/<id>/` for those, or fall back to the Sentry REST API directly if a write is explicitly requested.
- **Rate limits.** The Sentry REST API enforces per-token rate limits. If a call returns HTTP `429`, back off and retry after the `Retry-After` header. Do not burst hundreds of `get_sentry_issue` calls in a tight loop — the auth token will be temporarily throttled.

## Configuration

### 1. Create an auth token

1. Open `https://sentry.io/settings/auth-tokens/` (or the equivalent page on your self-hosted instance).
2. Click **Create New Token**.
3. Give it a descriptive name (e.g. `fractal-agent`).
4. Select the minimum scopes you need — `project:read` and `event:read` are enough for the tool to function.
5. Optionally restrict the token to a single organization and a single set of projects.
6. Copy the token — it is only shown once.

### 2. Set the env var

**Option A — `SENTRY_AUTH_TOKEN` (recommended):**

```bash
export SENTRY_AUTH_TOKEN="sntrys_****"
```

**Option B — pass `--auth-token` on the command line** (only for one-off testing; do not use in shared config):

```bash
uvx mcp-server-sentry --auth-token "sntrys_****"
```

### 3. (Optional) Self-hosted Sentry

```bash
export SENTRY_BASE_URL="https://errors.acme.internal"
```

When `SENTRY_BASE_URL` is set, the server issues requests against that host instead of `sentry.io`. The auth-token format is the same.

## Transport options

| Transport | When to use | Auth |
|---|---|---|
| `stdio` (default) | Local agents, desktop MCP clients, CI. | None at the transport layer — the server reads `SENTRY_AUTH_TOKEN` from the environment (or `--auth-token`). |
| Streamable HTTP | Multi-tenant deployments, sharing one server across many workspaces. | Bearer token in the `Authorization` header; token must have the same Sentry scopes as above. |

For a standalone HTTP server, run the underlying server in a long-lived container and connect MCP clients to its `/mcp` endpoint.

## Security notes

- A Sentry auth token **is a credential**. Anyone who has it can read every issue, event, and stacktrace in the projects the token can see. Rotate it on personnel changes and on any accidental exposure (logs, screenshots, chat transcripts, commits).
- The MCP server is a **read-only** wrapper around the public Sentry REST API. There are no write tools exposed by `mcp-server-sentry`. Even so, a leaked `event:read` token is sufficient to enumerate every error in production — restrict the token's project scope and use a short-lived token when possible.
- Stacktraces can leak secrets. Frame arguments, source-context lines, and breadcrumbs occasionally contain PII, API keys, or user data that the application sent through. Do not echo raw stacktraces into public artifacts without scrubbing them first.
- The MCP server is **not a security boundary**. A malicious prompt can exfiltrate anything the tool returns. Use Sentry's own project-level access controls and IP allow-listing in addition to token scoping.

## References

- Sentry MCP server source: <https://github.com/modelcontextprotocol/servers-archived/tree/main/src/sentry>
- Sentry REST API reference: <https://docs.sentry.io/api/>
- Sentry OpenAPI spec: <https://raw.githubusercontent.com/getsentry/sentry-api-schema/master/openapi-derefed.json>
- Sentry auth tokens: <https://sentry.io/settings/auth-tokens/>
- Sentry product docs: <https://docs.sentry.io/>
- License: MIT

## MCP connection

This registry entry connects to Sentry's remote MCP endpoint at `https://mcp.sentry.dev/mcp` through Fractal's OAuth flow. Fractal discovers the available tools after authorization; follow the live tool list because it can depend on the connected account. The provider must support this OAuth flow, and this endpoint was not independently authorized during registry preparation.
