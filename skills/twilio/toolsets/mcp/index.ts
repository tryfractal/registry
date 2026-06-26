import { FractalToolset } from "@fractal-os/plugin";

/**
 * Twilio MCP toolset.
 *
 * Connects to the official Twilio-hosted MCP server at
 * `https://mcp.twilio.com/docs` over the MCP HTTP transport. The server
 * indexes Twilio's public OpenAPI specification (1,800+ endpoints across 30+
 * products) plus Twilio, SendGrid, and Segment documentation.
 *
 * The hosted server is read-only and exposes a two-tool search-then-retrieve
 * workflow:
 *   - `twilio__search`    — natural-language query over the public spec and docs
 *   - `twilio__retrieve`  — full parameter + response schema for one or more IDs
 *
 * No installation, no authentication, no Twilio account, and no API keys are
 * required. The connection uses `type: "mcp-server::http"` with a `url` only.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Query the official Twilio communications platform via the hosted Twilio MCP server (https://mcp.twilio.com/docs). Exposes `twilio__search` (natural-language search across 1,800+ Twilio API operations, Twilio / SendGrid / Segment docs) and `twilio__retrieve` (full parameter and response schemas for selected operation IDs). Read-only: searches and retrieves API specifications and documentation only — does not execute Twilio API calls on the user's behalf.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Always start with `twilio__search` to discover the correct operation IDs. Do not guess Twilio endpoint paths from memory — Twilio's surface is 1,800+ endpoints and many products (Programmable Messaging, Conversations) ship multiple API versions.",
    },
    {
      type: "always",
      instruction:
        "Pass the operation IDs returned by `twilio__search` straight into a single `twilio__retrieve` call to fetch the full request and response schemas in one round-trip. Do not call `twilio__retrieve` on guessed IDs.",
    },
    {
      type: "always",
      instruction:
        "When the user names a specific Twilio product (Verify, TaskRouter, Studio, Sync, Conversations, Flex, Lookup, Frontline, Content, Notify, Proxy, Trust Hub, etc.), include that product name in the `twilio__search` query so unrelated products do not pollute the ranking.",
    },
    {
      type: "always",
      instruction:
        "Default to the latest API version returned by `twilio__search`. Only pass `filter.version` (e.g. `\"2010-04-01\"`) when the user explicitly asks for a legacy surface — Programmable Messaging has a current `v1` and a legacy `v2010`.",
    },
    {
      type: "always",
      instruction:
        "When generating code, mirror the field names returned by `twilio__retrieve` exactly. Twilio uses PascalCase for body fields and resource attributes (e.g. `FriendlyName`, `StatusCallback`); do not normalize them to camelCase or snake_case.",
    },
    {
      type: "always",
      instruction:
        "If `twilio__search` returns zero results, tell the user the operation does not exist in the public spec and suggest the closest matching product or version. Do not invent endpoints.",
    },
    {
      type: "never",
      instruction:
        "Never claim the toolset can send SMS, place calls, run Verify OTPs, write to Sync, or perform any other mutating Twilio action. The hosted server is read-only — it only searches and retrieves public specs and docs.",
    },
    {
      type: "never",
      instruction:
        "Never tell the user to paste `TWILIO_ACCOUNT_SID` or `TWILIO_AUTH_TOKEN` into the agent. This toolset does not use Twilio credentials; any actual API call must go through the user's own Twilio integration, never through this skill.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.twilio.com/docs",
  })
  .build();
