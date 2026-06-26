import { FractalToolset } from "@fractal-os/plugin";

/**
 * HubSpot MCP toolset.
 *
 * Spawns the official `@hubspot/mcp-server` server and exposes read / write
 * access to the full HubSpot CRM object graph (contacts, companies, deals,
 * tickets, leads, products, line items, quotes, invoices, orders, carts,
 * subscriptions, segments), engagement tools (calls, emails, meetings,
 * notes, tasks), and read-only access to marketing, content, and
 * organizational data (campaigns, landing pages, website pages, blog
 * posts, users, teams, pipelines, custom properties, associations).
 *
 * Authentication is performed by injecting a HubSpot private app access
 * token (`HUBSPOT_ACCESS_TOKEN`) into the spawned process. The token is
 * scoped to whatever the user-level app was granted — least-privilege
 * scope is the recommended posture.
 *
 * Sensitive data properties (including PHI / Highly Sensitive Data) are
 * always redacted by the upstream server and never returned to the
 * agent, regardless of token scope.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read and write access to a HubSpot CRM account through the official HubSpot MCP server. Covers contacts, companies, deals, tickets, leads, products, line items, quotes, invoices, orders, carts, subscriptions, segments, engagements (calls, emails, meetings, notes, tasks), and read-only access to campaigns, landing pages, website pages, blog posts, users, teams, pipelines, and custom properties. Authenticated with a `HUBSPOT_ACCESS_TOKEN` personal access token from a HubSpot user-level app.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "When fetching a single CRM record, pass the explicit `objectType` and `id` (for example `objectType: 'contacts'`, `id: '12345'`) instead of using a search query — single-record fetches return the full property set, while search responses are summarized.",
    },
    {
      type: "always",
      instruction:
        "Pass the `properties` list explicitly when a task depends on a custom field or a non-default property. Default fetches return only common properties and will miss anything not listed.",
    },
    {
      type: "always",
      instruction:
        "Use the search endpoint for 'find by name / email / domain' requests with a partial-match query, instead of listing every record and filtering client-side.",
    },
    {
      type: "always",
      instruction:
        "Pass the pipeline `id` (not the human-readable pipeline name) when creating or moving deals and tickets. Pipeline names can collide; IDs are stable.",
    },
    {
      type: "always",
      instruction:
        "Log every customer-facing action as an engagement — when a deal stage changes, a call is placed, an email is sent, or a ticket is closed, also create the corresponding call / email / meeting / note / task record so the timeline stays complete.",
    },
    {
      type: "always",
      instruction:
        "Use batch create / update / delete endpoints when operating on more than one record. Looping single-record writes wastes rate-limit budget and produces noisy responses.",
    },
    {
      type: "never",
      instruction:
        "Never echo, log, or return the `HUBSPOT_ACCESS_TOKEN` value (or any token) in tool inputs, outputs, comments, or error messages. The token is injected via environment variables and must stay opaque.",
    },
    {
      type: "never",
      instruction:
        "Never assume a write is authorized. Read-only requests are cheap; writes need an explicit user instruction. When in doubt, draft the write as a preview and ask for confirmation before executing.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@hubspot/mcp-server@latest"],
    env: {
      HUBSPOT_ACCESS_TOKEN: "${env:HUBSPOT_ACCESS_TOKEN}",
    },
  })
  .build();
