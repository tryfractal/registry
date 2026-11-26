import { FractalToolset } from "@fractal-os/plugin";

/**
 * Algolia hosted MCP connection.
 * Tool definitions are discovered from the provider's remote server at runtime.
 */
export default FractalToolset.create("hosted-mcp")
  .withDescription("Connect to Algolia through the provider-hosted HTTP MCP endpoint. Tools are discovered from the live server and depend on the authorized account.")
  .withRules([
  {
    "type": "always",
    "instruction": "Use only tools discovered from this hosted MCP server; do not invent tool names or claim unsupported actions."
  },
  {
    "type": "always",
    "instruction": "Check the active account, workspace, and target before making changes."
  },
  {
    "type": "never",
    "instruction": "Never reveal credentials, access tokens, or secret values in chat or tool output."
  },
  {
    "type": "ask",
    "instruction": "Confirm the exact target before deletion, bulk changes, publication, financial movement, or other consequential actions unless the user has already authorized that specific action."
  }
])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.algolia.com/mcp",
    auth: "oauth",
  })
  .build();
