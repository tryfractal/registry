import { FractalToolset } from "@fractal-os/plugin";

/**
 * Official Cloudflare MCP toolset.
 *
 * Connects to the remote Cloudflare MCP server at https://mcp.cloudflare.com/mcp
 * over HTTP. The server uses Cloudflare's Code Mode pattern: it ships only
 * three primitives (`docs`, `search`, `execute`) and runs the agent's
 * JavaScript snippets inside an isolated Worker, so the full ~2,500-endpoint
 * Cloudflare API is reachable without inflating the agent's context window.
 *
 * Authentication: prefer OAuth (the MCP client opens the browser and the user
 * grants scopes). For CI / automation, set the `Authorization` header to a
 * Cloudflare API token with the required scopes — account tokens should
 * include `Account.Resources: Read` so the server can auto-detect the
 * account id.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Operate the entire Cloudflare platform through the official remote MCP server (mcp.cloudflare.com). Code Mode surface exposes three primitives — `docs` (search developer docs), `search` (discover API endpoints against the spec), and `execute` (call cloudflare.request against any of ~2,500 endpoints). Reaches DNS, Workers, KV, R2, D1, Pages, Vectorize, AI Gateway, Stream, Images, Access, Gateway, WAF, Load Balancers, cache, and the GraphQL Analytics API.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Start with the `docs` tool for any 'how do I…' question about a Cloudflare product — field names, scopes, and endpoint shapes change frequently and the docs tool returns curated developer-docs snippets.",
    },
    {
      type: "always",
      instruction:
        "Discover endpoints with `search` (iterate `spec.paths` and filter by tag / path / operationId) instead of guessing paths or hardcoding them. Then call the discovered endpoint with `execute` using `cloudflare.request({ method, path, params?, body? })`.",
    },
    {
      type: "always",
      instruction:
        "Pass `account_id` explicitly in the `execute` call when using a user-scoped API token. For account-scoped tokens the server auto-detects the account, but only if the token has the `Account.Resources: Read` permission.",
    },
    {
      type: "always",
      instruction:
        "Resolve zone ids from the `/zones` endpoint before calling any zone-scoped endpoint (DNS, cache purge, zone settings) — most endpoints take a zone id, not a zone name.",
    },
    {
      type: "always",
      instruction:
        "For analytics, use the GraphQL endpoint `POST /client/v4/graphql` through `execute` with a GraphQL `query` and `variables` in the body. The server detects GraphQL endpoints and routes them correctly.",
    },
    {
      type: "never",
      instruction:
        "Never echo, log, or include the raw Cloudflare API token in an `execute` payload, tool description, or chat message. Pass it only through the `Authorization: Bearer` header on the MCP connection.",
    },
    {
      type: "never",
      instruction:
        "Do not run destructive operations (DELETE records, purge-everything, drop D1 tables, delete Workers) without explicit user confirmation. Cloudflare mutations are not idempotent unless the API explicitly says so.",
    },
    {
      type: "never",
      instruction:
        "Do not use API tokens with **Client IP Address Filtering** enabled — the remote MCP server does not currently support that restriction. Disable it on the token before using this skill.",
    },
    {
      type: "never",
      instruction:
        "Do not append `?codemode=false` to the MCP URL unless you are composing this server with another code-mode system. The non-code-mode surface ships ~244k tokens of tool definitions into the agent's context instead of ~1.1k.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.cloudflare.com/mcp",
    auth: "oauth",
    headers: {
      // Optional: provide a Cloudflare API token here for non-OAuth auth.
      // Prefer OAuth when possible — the MCP client opens the browser and
      // the user grants scopes interactively.
      // Authorization: `Bearer ${process.env.CLOUDFLARE_API_TOKEN ?? ""}`,
    },
  })
  .build();
