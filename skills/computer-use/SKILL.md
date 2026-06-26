---
name: computer-use
description: >-
  Give the agent complete control of the local computer's mouse, keyboard,
  and screen via the computer-use-mcp server (a near-clone of Anthropic's
  Computer Use API). Use this skill when the user wants to drive a desktop
  GUI — clicking icons, opening applications, filling forms in desktop
  apps, navigating menus, dragging windows, taking screenshots, or
  performing any task that needs a keyboard and mouse because no API,
  CLI, or browser automation is available. Triggers on phrases like
  "use my computer", "control my mouse", "click on the desktop", "open
  the Calculator app", "type into this window", "take a screenshot",
  "automate the desktop", or any GUI task where the user accepts the
  safety tradeoffs. Use this skill even when the user says "control my
  computer". WARNING: only use in a sandboxed user account, VM, or
  disposable profile, and only when the task cannot be done through a
  browser or API tool.
---

# Computer Use Skill

This skill wraps **`domdomegg/computer-use-mcp`**, a Model Context Protocol server that exposes a **single `computer` tool** with eleven actions. Under the hood it drives the host's actual mouse, keyboard, and screen through `nut.js` (with `xdotool` on Linux for keyboard layout safety, and a `screencapture` fallback on macOS 26+).

It is a near-clone of Anthropic's official Computer Use API, but installable with one `npx` and designed to work locally on macOS, Windows, and Linux.

## Toolset

- `mcp` — `computer-use-mcp` (v1.x) running locally. Single tool: **`computer`**, with 11 `action` values. Default transport is `stdio`; an opt-in `MCP_TRANSPORT=http` mode is also available.

## The `computer` tool

| Parameter | Type | Required | Description |
|---|---|---|---|
| `action` | enum | yes | One of the 11 actions below. |
| `coordinate` | `[x, y]` | for most click / move / scroll actions | Pixel position from the **top-left** of the screen. Coordinates are auto-scaled from API image space to logical screen space. |
| `text` | string | for `key`, `type`, `scroll` | For `key`: a key or chord (`"Return"`, `"ctrl+s"`). For `type`: literal text. For `scroll`: direction (`"up"`, `"down"`, `"left"`, `"right"`) optionally with `:N` pixels (default 300). |

### Actions

| Action | What it does |
|---|---|
| `key` | Press a key or chord. `text="ctrl+shift+p"` opens the command palette in most editors. |
| `type` | Type literal text. On Linux + `xdotool` this respects the X11 keyboard layout; otherwise falls back to `nut.js` (US QWERTY mapping). |
| `mouse_move` | Move the cursor to `(x, y)` without clicking. |
| `left_click` | Left-click. If `coordinate` is given, moves there first. |
| `left_click_drag` | Press left, move to `(x, y)`, release. |
| `right_click` | Right-click. |
| `middle_click` | Middle-click. |
| `double_click` | Double left-click. |
| `scroll` | Scroll at `(x, y)` in the direction given by `text` (e.g. `"down:500"`). |
| `get_cursor_position` | Return the cursor's current `(x, y)` in API image coordinates. |
| `get_screenshot` | Capture the whole screen, downsample to fit Claude's vision limits (≤ 1568px long edge, ≤ 1.15MP), draw a red crosshair at the cursor, return as PNG with `image_width` / `image_height` metadata. |

## Usage rules

> **The most important rule:** this skill gives the model complete control of the user's machine. Read the upstream warning — treat it like giving a hyperactive toddler access to your computer.

- **Always start with a screenshot.** Call `get_screenshot` before any click or move, read the crosshair, and decide coordinates. Do not guess pixel positions from memory.
- **Prefer keyboard shortcuts over clicks.** The upstream tool is tuned to nudge the model toward hotkeys. `ctrl+c`, `cmd+space`, `alt+tab` are almost always more reliable than visual targeting.
- **Watch for focus issues on macOS.** Clicking an unfocused window only brings it forward; the click is dropped. Take a screenshot, then click again — the second click will register.
- **Use a small, common resolution.** 720p works best; on Retina/HiDPI displays, downsample (e.g. macOS [`displayoverride-mac`](https://github.com/domdomegg/displayoverride-mac)) or zoom the active window. Larger screens produce screenshots that get downsampled and confuse coordinate math.
- **Use the crosshair to recover from misses.** The red crosshair in every screenshot shows where the cursor actually went. If it missed the target by `dx,dy` pixels, scale that delta up for the next attempt — start with large adjustments.
- **Wait between actions.** Apps take time to open, animate, or render. Take a second screenshot before deciding the previous click "didn't work".
- **Use a sandboxed user account.** The upstream warning is not theoretical. Run this in a guest / VM / disposable profile for anything beyond trivial automation.
- **Re-derive coordinates from the screenshot's reported `image_width`/`image_height`.** They may differ from the logical display after downsampling; use them as your coordinate space.
- **If a click missed, adjust *proportionally* to the distance, not by small nudges.** A 100px miss should not be corrected with a 5px nudge.

## Coordinate space

The tool accepts pixel coordinates and **automatically scales** them from API image space to logical screen space. Two rules of thumb:

1. Coordinates you pass to `left_click` etc. are interpreted in the **logical** display coordinate space.
2. The `get_screenshot` response reports the **API image** dimensions (which may be smaller after downsampling). When you read those back as `(x, y)` from a screenshot, you are already in the right space — the tool handles the rest.

## Installation

The MCP server itself is one `npx`:

```bash
npx -y computer-use-mcp
```

That's it. On first run `nut.js` will need permission to control the host (macOS Accessibility / Input Monitoring, Windows UAC, Linux `xdotool` install). The server's own `package.json` ships `build` / `lint` / `test:e2e` for local development.

## Best results (from upstream)

1. **Use a strong model.** Latest Claude recommended.
2. **720p resolution.** Smaller than the OS default is much more reliable.
3. **Install the Rango browser extension.** When the desktop task involves a browser, Rango exposes single-letter navigation hints that are far more reliable than visual coordinate clicking. You can bump its font size in the extension settings.

## HTTP transport (opt-in)

The server also supports `MCP_TRANSPORT=http`. Run:

```bash
MCP_TRANSPORT=http PORT=3000 npx -y computer-use-mcp
```

It listens on `http://localhost:3000/mcp`. **There is no authentication on the HTTP endpoint** — only expose it behind a reverse proxy or inside a secured setup.

## References

- Upstream: <https://github.com/domdomegg/computer-use-mcp>
- Anthropic's Computer Use guide: <https://docs.anthropic.com/en/docs/build-with-claude/computer-use>
- Underlying driver: [`nut.js`](https://github.com/nut-tree/nut.js)
- License: MIT
