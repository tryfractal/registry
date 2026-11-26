import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("mcp")
  .withDescription(
    "Connect to Suno's MCP server to create music and work with the authorized Suno account.",
  )
  .withRules([
    {
      type: "always",
      instruction: "Use the tools discovered from Suno and their current schemas. Music generation consumes the user's Suno credits.",
    },
    {
      type: "never",
      instruction: "Never reveal credentials or access tokens in chat or tool output.",
    },
    {
      type: "ask",
      instruction: "Confirm before publishing or making consequential changes unless the user has authorized the specific action.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://api.suno.com/mcp",
    auth: "oauth",
  })
  .build();
