import { FractalToolset } from "@fractal-os/plugin";

/**
 * Linear MCP toolset.
 *
 * Connects to Linear's official hosted MCP server over Streamable HTTP. The
 * server is centrally managed by Linear and follows the authenticated remote
 * MCP spec, so no `npx` install is required.
 *
 * Auth:
 *   - Default: OAuth 2.1 with dynamic client registration. The MCP client
 *     opens a browser on first call, the user signs in to Linear, and the
 *     resulting token is cached at `~/.mcp-auth/`.
 *   - Headless / CI: set the `LINEAR_API_KEY` (or `LINEAR_OAUTH_TOKEN`)
 *     environment variable. The server picks it up from the
 *     `Authorization: Bearer <token>` header automatically — useful for
 *     restricted API keys, `app` user integrations, and existing OAuth apps.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read, search, create, and update issues, projects, cycles, comments, labels, milestones, and initiatives in Linear through the official hosted Linear MCP server. Connects over Streamable HTTP at https://mcp.linear.app/mcp with OAuth 2.1 by default, or via a Bearer token (LINEAR_API_KEY / LINEAR_OAUTH_TOKEN) for headless and CI use.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use the human-readable identifier (e.g. `ENG-1234`) as the `id` argument — Linear resolves it to the internal UUID. Do not paste UUIDs into prompts.",
    },
    {
      type: "always",
      instruction:
        "Filter at the server. Always pass `assignee`, `state`, `team`, `label`, `project`, `cycle`, `priority`, or `query` to `list_issues` instead of fetching the whole backlog and filtering client-side.",
    },
    {
      type: "always",
      instruction:
        'Resolve human names to ids before mutating. Call `list_users`, `list_teams`, `list_issue_statuses`, and `list_labels` to turn `@Maria`, "Eng", "In Progress", or "bug" into their internal ids before calling `create_issue` or `update_issue`.',
    },
    {
      type: "always",
      instruction:
        "Use Linear's priority scale: 0 = No priority, 1 = Urgent, 2 = High, 3 = Medium, 4 = Low. Never pass values outside 0–4.",
    },
    {
      type: "always",
      instruction:
        "Write issue and comment bodies in Linear-flavored Markdown (`**bold**`, `` `code` ``, fenced blocks, `[link](url)`, `@mention`). Do not paste HTML.",
    },
    {
      type: "always",
      instruction:
        "Mutate, don't recreate. When the user asks to change a field on an existing issue, call `update_issue` on the existing id — never `create_issue` + `archive_issue`.",
    },
    {
      type: "never",
      instruction:
        "Never call `delete_issue` or `archive_issue` without explicit user confirmation. `delete_issue` is permanent; `archive_issue` is reversible but still destructive — show the identifier and ask first.",
    },
    {
      type: "never",
      instruction:
        "Never log, print, echo, or paste `LINEAR_API_KEY` or `LINEAR_OAUTH_TOKEN` values into chat, tool responses, or source files. Treat them as passwords.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.linear.app/mcp",
    headers: {
      Authorization: "Bearer ${env:LINEAR_API_KEY}",
    },
  })
  .build();
