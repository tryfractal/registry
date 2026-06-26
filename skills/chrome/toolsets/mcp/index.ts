import { FractalToolset } from "@fractal-os/plugin";

/**
 * mcp-chrome toolset.
 *
 * Connects to the user's local Chrome via the `hangwin/mcp-chrome` extension +
 * `mcp-chrome-bridge` pair. Pure local — no data leaves the user's machine.
 *
 * Default transport: Streamable HTTP to the bridge at
 * `http://127.0.0.1:12306/mcp`. The bridge must be installed globally and
 * the Chrome extension must be loaded and connected for any tool to work.
 *
 * If the runtime only supports stdio, swap `withConnection` to:
 *   {
 *     type: "mcp-server::stdio",
 *     command: "npx",
 *     args: ["node", "<global>/node_modules/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js"],
 *   }
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Drive the user's real Chrome browser via the mcp-chrome extension-based MCP server. Reuses the user's existing login state, cookies, bookmarks, and history. Pure local — no data leaves the machine. Exposes 24 tools for tab management, screenshots, network capture, semantic tab search, content analysis, interaction, history, and bookmarks.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Prefer `search_tabs_content` (semantic search) over reading pages one by one when the user asks about content across multiple open tabs.",
    },
    {
      type: "always",
      instruction:
        "Use `chrome_network_debugger_start` (not `chrome_network_capture_start`) when you need response bodies for XHRs / fetches. The plain webRequest capture only records request metadata.",
    },
    {
      type: "always",
      instruction:
        "Use `chrome_history` with an explicit time filter to answer 'where was I?' questions precisely.",
    },
    {
      type: "always",
      instruction:
        "Confirm with the user before deleting bookmarks, closing many tabs, or any other bulk mutation of user-visible browser state.",
    },
    {
      type: "never",
      instruction:
        "Never call `chrome_inject_script` with untrusted code — injected scripts run in the page's main world and inherit the user's session.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "http://127.0.0.1:12306/mcp",
  })
  .build();
