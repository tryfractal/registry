import { FractalToolset } from "@fractal-os/plugin";

/**
 * computer-use-mcp toolset.
 *
 * Spawns `domdomegg/computer-use-mcp` and exposes its single `computer` tool,
 * which drives the host machine's mouse, keyboard, and screen through
 * `nut.js` (with `xdotool` on Linux for keyboard-layout safety and a
 * `screencapture` fallback on macOS 26+).
 *
 * WARNING: this gives the model complete control of the user's computer.
 * Prefer `playwright` (browser) or `chrome` (real Chrome session) whenever
 * the task can be done there. Use this only when the user has explicitly
 * accepted the safety tradeoffs.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Drive the host computer's mouse, keyboard, and screen through the domdomegg/computer-use-mcp server. Single `computer` tool with 11 actions (key, type, mouse_move, left_click, left_click_drag, right_click, middle_click, double_click, scroll, get_cursor_position, get_screenshot). Underlying driver is nut.js. WARNING: gives the model full control of the machine — only use in a sandboxed user account and only when no browser/API alternative applies."
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Call `get_screenshot` before any click, drag, or scroll. Read the red crosshair and the current screen state to derive coordinates — never guess pixel positions from memory.",
    },
    {
      type: "always",
      instruction:
        "Prefer keyboard shortcuts (`text=\"cmd+space\"`, `\"ctrl+s\"`, `\"alt+tab\"`) over visual targeting. The upstream server is tuned to favor hotkeys, and they are far more reliable than coordinate clicking.",
    },
    {
      type: "always",
      instruction:
        "Re-derive click coordinates from the screenshot's reported `image_width` / `image_height` — they may differ from the logical display after downsampling. Use those numbers as your coordinate space.",
    },
    {
      type: "always",
      instruction:
        "After a missed click, adjust the next attempt *proportionally* to the distance shown by the crosshair. Start with large corrections, not small nudges.",
    },
    {
      type: "always",
      instruction:
        "Wait and re-screenshot between actions. Applications take time to open, animate, and render — never assume a click 'didn't work' without visual confirmation.",
    },
    {
      type: "always",
      instruction:
        "On macOS, if a click on a background window has no effect, take another screenshot and click again — the first click only brought the window forward; the second one registers.",
    },
    {
      type: "always",
      instruction:
        "Run this skill inside a sandboxed user account, a VM, or a disposable profile. Treat it as giving a hyperactive toddler unsupervised access to a real computer.",
    },
    {
      type: "never",
      instruction:
        "Never use this skill when `playwright` (browser) or `chrome` (real Chrome) can perform the task — those are deterministic, easier to supervise, and have no real-machine side effects.",
    },
    {
      type: "never",
      instruction:
        "Do not expose the HTTP transport (MCP_TRANSPORT=http) on a public network — it has no authentication. Only run it behind a reverse proxy or inside a secured setup.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "computer-use-mcp"],
  })
  .build();
