import { FractalToolset } from "@fractal-os/plugin";

/**
 * Sentry MCP toolset.
 *
 * Spawns the official `mcp-server-sentry` reference server (Anthropic /
 * Model Context Protocol organization) and exposes its single read tool:
 * `get_sentry_issue`. The tool fetches a Sentry issue by numeric ID or
 * full sentry.io URL, then resolves the issue's most recent event to
 * return a formatted multi-exception stacktrace.
 *
 * Authentication is driven entirely by the `SENTRY_AUTH_TOKEN`
 * environment variable (or the `--auth-token` CLI flag). Self-hosted
 * Sentry deployments can override the API host with `SENTRY_BASE_URL`.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Sentry error tracking and application monitoring via the official Model Context Protocol server (mcp-server-sentry). Exposes the `get_sentry_issue` tool, which fetches a Sentry issue by numeric ID or full sentry.io URL and returns its title, status, level, first/last-seen timestamps, event count, and the formatted multi-exception stacktrace for the most recent event. Authentication uses the `SENTRY_AUTH_TOKEN` environment variable; self-hosted Sentry deployments set `SENTRY_BASE_URL`.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Read `SENTRY_AUTH_TOKEN` from the environment. Never hardcode the auth token in a prompt, log line, comment, or tool argument, and never echo it back in tool output. Treat the token like a database password — it grants the same read access as the user that minted it.",
    },
    {
      type: "always",
      instruction:
        "When the user hands you a Sentry URL, normalize it to the canonical `https://<org>.sentry.io/issues/<id>/` form (drop any `/events/<id>/` suffix and any query string) before passing it to `get_sentry_issue`. The parser only inspects the final path segment after `/issues/`.",
    },
    {
      type: "always",
      instruction:
        "Use `get_sentry_issue` for any question about a production error, crash, or stacktrace that Sentry captured — the tool returns the full formatted multi-exception stacktrace including source-context lines, plus first_seen, last_seen, count, status, and level.",
    },
    {
      type: "always",
      instruction:
        "For 'is this still happening' triage questions, call `get_sentry_issue` once and reason over `last_seen`, `count`, and `status`. A `resolved` issue with a recent `last_seen` is still firing and was likely auto-resolved — surface that to the user before assuming it is fixed.",
    },
    {
      type: "always",
      instruction:
        "Read every exception block in the returned `stacktrace` field, not just the first one. Sentry records chained `cause` and `suppressed` exceptions separately, and the root cause is often an inner block rather than the outermost one.",
    },
    {
      type: "always",
      instruction:
        "Quote the stacktrace's source-context lines back to the user when forming a root-cause hypothesis — Sentry is the source of truth for what the production code path actually looked like, so reason from those lines instead of from memory.",
    },
    {
      type: "never",
      instruction:
        "Never call `get_sentry_issue` with a hostname that is not on `*.sentry.io` while using URL-form input — the parser rejects non-Sentry URLs. For self-hosted Sentry, set `SENTRY_BASE_URL` and pass a bare numeric issue ID instead of a URL.",
    },
    {
      type: "never",
      instruction:
        "Do not loop or burst-call `get_sentry_issue` — the Sentry REST API enforces per-token rate limits and will return HTTP 429 with a `Retry-After` header. If a call is throttled, back off and respect the header before retrying.",
    },
    {
      type: "never",
      instruction:
        "Do not use a Sentry auth token that has `project:write`, `org:write`, or `team:admin` scopes for this skill — `mcp-server-sentry` is read-only, and the smallest sufficient token (`project:read` + `event:read`, scoped to the projects you actually need) is the safest default.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "uvx",
    args: ["mcp-server-sentry"],
    env: {
      SENTRY_AUTH_TOKEN: "${env:SENTRY_AUTH_TOKEN}",
      ...(process.env.SENTRY_BASE_URL
        ? { SENTRY_BASE_URL: process.env.SENTRY_BASE_URL }
        : {}),
    },
  })
  .build();
