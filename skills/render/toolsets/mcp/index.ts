import { FractalToolset } from "@fractal-os/plugin";

/**
 * Render integration over MCP.
 * Tool definitions are discovered from the configured server at runtime.
 */
export default FractalToolset.create("mcp")
  .withDescription("Connect to Render through its HTTP MCP server. Available tools are discovered from the live server and depend on the connected account.")
  .withRules([
    {
      "type": "always",
      "instruction": "Use only tools discovered from the configured MCP server; do not invent tool names or claim unsupported actions."
    },
    {
      "type": "always",
      "instruction": "Check the connected account, workspace, and target records before making changes; preserve the user’s stated scope."
    },
    {
      "type": "never",
      "instruction": "Never reveal credentials, access tokens, or secret values in chat or tool output."
    },
    {
      "type": "ask",
      "instruction": "Confirm the exact target before deletion, bulk changes, external publication, financial movement, or other consequential actions unless the user has already authorized that specific action."
    }
  ])
  .withConnection({
    "type": "mcp-server::http",
    "url": "https://mcp.render.com/mcp",
    "headers": {
      "Authorization": "Bearer ${env.RENDER_TOKEN}"
    },
    "setup": {
      "RENDER_TOKEN": {
        "label": "API key",
        "description": "Enter the api key issued by Render. Follow the linked provider guide to create a credential with only the access you need.",
        "url": "https://dashboard.render.com/u/settings?add-api-key",
        "placeholder": "rnd_…"
      }
    }
  })
  .build();
