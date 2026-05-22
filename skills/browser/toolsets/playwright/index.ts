import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("playwright")
  .withDescription("Playwright MCP browser automation using the default Playwright browser session.")
  .withRules([
    {
      type: "always",
      instruction: "Use this toolset for browser navigation, page inspection, clicks, typing, screenshots, and extraction when a live browser session is needed."
    },
    {
      type: "always",
      instruction: "Prefer the default Playwright browser session while the browser toolset is configured without a custom CDP endpoint."
    }
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@playwright/mcp@latest", "--isolated", "--caps", "devtools,network,storage,config"]
  })
  .build();