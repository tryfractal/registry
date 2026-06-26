import { FractalToolset } from "@fractal-os/plugin";

/**
 * Microsoft Playwright MCP toolset.
 *
 * Spawns the official `@playwright/mcp` server and exposes every browser
 * automation tool it provides. Capabilities shipped by default:
 *   - devtools  → highlight / annotation / trace / video / step-debug
 *   - network   → route mocking + offline mode
 *   - storage   → cookie / localStorage / sessionStorage read & write
 *   - config    → resolved config introspection
 *
 * Add `vision`, `pdf`, or `testing` to `args` to enable coordinate-based mouse
 * interaction, PDF export, and test-style assertions respectively.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Browser automation via the official Microsoft Playwright MCP server. Drives Chromium / Firefox / WebKit / Chrome / Edge using the accessibility tree (no vision model required). Exposes navigation, clicks, typing, form filling, screenshots, network mocking, storage manipulation, PDF export, and test-style assertions.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Prefer `browser_snapshot` over `browser_take_screenshot` — the accessibility snapshot gives stable element refs (`target`) you can pass to `browser_click`, `browser_type`, `browser_hover`, etc. Screenshots are for human review only.",
    },
    {
      type: "always",
      instruction:
        "Pass a short human-readable `element` description alongside every interaction (click, type, hover, etc.) so the action is self-documenting in the tool log.",
    },
    {
      type: "always",
      instruction:
        "Use the `target` ref from the most recent snapshot, not a CSS selector, when interacting with elements. Regenerate the snapshot after every navigation.",
    },
    {
      type: "always",
      instruction:
        "When you need stable login state, run a one-time login flow, then restart with `--isolated --storage-state=<file>`. Do not share a persistent profile between two concurrent MCP clients in the same workspace.",
    },
    {
      type: "always",
      instruction:
        "Use `browser_route` (network capability) to mock API responses instead of recompiling the app under test.",
    },
    {
      type: "never",
      instruction:
        "Never call `browser_run_code_unsafe` with untrusted input — it executes arbitrary JavaScript in the Playwright server process and is RCE-equivalent.",
    },
    {
      type: "never",
      instruction:
        "Do not call `browser_take_screenshot` as a substitute for `browser_snapshot`. Screenshots cannot drive interactions and waste context tokens.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "@playwright/mcp@latest",
      "--isolated",
      "--caps",
      "devtools,network,storage,config",
    ],
  })
  .build();
