import { FractalToolset } from "@fractal-os/plugin";

/**
 * Zapier MCP toolset.
 *
 * Connects to the user's Zapier MCP server over SSE. The connection URL
 * is unique per user and must be set via the ZAPIER_MCP_URL environment
 * variable — available from mcp.zapier.com after creating an MCP server.
 *
 * Tools are not hardcoded here because they depend on what the user
 * configured at mcp.zapier.com. The available tools are auto-discovered
 * from the upstream SSE endpoint at load time.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Zapier MCP — connect the agent to 9000+ apps and 30000+ actions via SSE. Tools are configured at mcp.zapier.com and auto-discovered. Send Slack messages, create Sheets rows, manage Jira/Asana tasks, update HubSpot deals, post Discord messages, and thousands more.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Ask the user what tools they have configured in their Zapier MCP server before attempting any call — the tool list is unique per user.",
    },
    {
      type: "always",
      instruction:
        "Include all required details (recipients, content, dates) when calling a Zapier tool. Many actions have mandatory fields.",
    },
    {
      type: "always",
      instruction:
        "Summarise what was done after each successful action — 'I posted to #general in Slack' or 'I added a row to your spreadsheet'.",
    },
    {
      type: "always",
      instruction:
        "When a tool fails with a permission error, suggest the user re-authenticates the connected app at mcp.zapier.com.",
    },
    {
      type: "never",
      instruction:
        "Never hardcode app credentials or authentication tokens — Zapier handles all auth through the connected app accounts configured at mcp.zapier.com.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: process.env.ZAPIER_MCP_URL ?? "",
  })
  .build();
