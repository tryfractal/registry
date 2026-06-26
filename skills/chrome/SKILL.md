---
name: chrome
description: >-
  Drive the user's real Chrome browser from the agent via the
  mcp-chrome extension-based MCP server, inheriting login state, cookies,
  extensions, and bookmarks. Use this skill when the user wants to act on
  their live Chrome tabs — open, switch, or close tabs; capture a
  screenshot; monitor network traffic including XHR response bodies;
  search across all open tabs; read the current page HTML or text; fill
  forms on sites where they are already logged in; search browsing
  history with time filters; or manage bookmarks. Triggers on phrases
  like "use my chrome", "open a new tab", "close the YouTube tabs",
  "what's on the page I'm looking at", "summarize the article in my
  current tab", "search my open tabs", or any task that needs the
  user's live Chrome session, cookies, or history.
---

# Chrome Skill

This skill wraps **`hangwin/mcp-chrome`**, a Chrome extension–based MCP server that attaches to the user's real Chrome via a small bridge. The agent inherits the user's login state, cookies, extensions, and bookmarks — no re-authentication, no clean environment.

## How it works

`mcp-chrome` is a **two-part system**:

1. A **Chrome extension** that runs inside the user's browser and exposes the `chrome.*` APIs (tabs, history, bookmarks, webRequest, debugger, scripting, etc.).
2. A **`mcp-chrome-bridge` Node.js process** that connects to the extension and speaks MCP. The bridge is published to npm as `mcp-chrome-bridge` and is launched automatically by the toolset.

The extension is downloaded from the GitHub Releases page and loaded as an unpacked extension in `chrome://extensions/`. Once installed, it listens on `http://127.0.0.1:12306` and the bridge forwards MCP calls to it.

## Toolset

- `mcp` — `mcp-chrome-bridge` running locally. Connects to the user's Chrome via the `mcp-chrome` extension. Pure local: **no data leaves the user's machine**.

## Tools exposed (24 total)

### Browser management (7)

| Tool | What it does |
|---|---|
| `get_windows_and_tabs` | List every open window and tab. |
| `chrome_navigate` | Navigate the active tab to a URL and optionally set the viewport. |
| `chrome_switch_tab` | Make another tab the active one. |
| `chrome_close_tabs` | Close specific tabs (or whole windows). |
| `chrome_go_back_or_forward` | Browser history navigation. |
| `chrome_inject_script` | Inject a content script into a page. |
| `chrome_send_command_to_inject_script` | Send a command to a previously injected script. |

### Screenshots & visual (1)

| Tool | What it does |
|---|---|
| `chrome_screenshot` | Capture a full-page, viewport, or element-targeted screenshot. |

### Network monitoring (4)

| Tool | What it does |
|---|---|
| `chrome_network_capture_start` / `chrome_network_capture_stop` | Use the `webRequest` API to record every request the page makes. |
| `chrome_network_debugger_start` / `chrome_network_debugger_stop` | Use the DevTools `Debugger` API to record request **and response bodies**. |
| `chrome_network_request` | Send a custom HTTP request (bypasses the browser). |

### Content analysis (4)

| Tool | What it does |
|---|---|
| `search_tabs_content` | **Semantic** search across all open tabs using the built-in vector index (SIMD-accelerated). |
| `chrome_get_web_content` | Extract the HTML / text content of the current page. |
| `chrome_get_interactive_elements` | List every clickable element on the page (buttons, links, inputs). |
| `chrome_console` | Read console output from the page. |

### Interaction (3)

| Tool | What it does |
|---|---|
| `chrome_click_element` | Click an element by CSS selector. |
| `chrome_fill_or_select` | Fill inputs and select dropdown options. |
| `chrome_keyboard` | Simulate keyboard input and shortcuts. |

### Data management (5)

| Tool | What it does |
|---|---|
| `chrome_history` | Search browsing history with time filters. |
| `chrome_bookmark_search` | Find bookmarks by keyword. |
| `chrome_bookmark_add` | Add a bookmark (optionally into a folder). |
| `chrome_bookmark_delete` | Delete a bookmark. |
| _(search history)_ | Implicit via `chrome_history`. |

## Usage rules

- **Verify the extension is connected first.** If any tool call returns an extension-not-connected error, tell the user to open the extension popup and click *connect*. The bridge cannot reach Chrome otherwise.
- **Prefer semantic search over tab-by-tab scraping.** `search_tabs_content` finds relevant content across all open tabs in one call — far cheaper than reading every page.
- **Use `chrome_history` to answer "where was I?" questions.** Time filters (`past week`, `past month`) make the answers precise.
- **Use `chrome_network_debugger_start` before clicking actions that trigger XHRs/fetches** if you need to capture response bodies. The plain `webRequest` capture only records request metadata.
- **Never call `chrome_inject_script` with untrusted code.** Injected scripts run in the page's main world with full access to the page's JS context and the user's session.
- **Bookmarks and history are user state.** Always confirm before deleting or bulk-modifying.
- **All processing is local.** Don't worry about sending sensitive pages to a remote service — nothing leaves the machine.

## Installation

Before this toolset can run, the user must:

1. **Download the Chrome extension** from <https://github.com/hangwin/mcp-chrome/releases> (unpacked, not from the Chrome Web Store).
2. **Open `chrome://extensions/`**, enable *Developer mode*, and click *Load unpacked* — point it at the extracted extension folder.
3. **Install the bridge**:
   ```bash
   npm install -g mcp-chrome-bridge
   ```
   (pnpm users may need `pnpm config set enable-pre-post-scripts true` first, or run `mcp-chrome-bridge register` manually.)
4. **Click the extension icon** in Chrome's toolbar, then click *connect* to see the MCP endpoint.

When the toolset is invoked, the bridge runs as a local subprocess and connects to the extension at `http://127.0.0.1:12306/mcp`.

## Connection modes

The toolset defaults to **Streamable HTTP** at `http://127.0.0.1:12306/mcp`. If the runtime only supports stdio, point `command` / `args` at the bridge's stdio entrypoint:

```ts
withConnection({
  type: "mcp-server::stdio",
  command: "npx",
  args: ["node", "<global node_modules>/mcp-chrome-bridge/dist/mcp/mcp-server-stdio.js"],
});
```

## Roadmap (upstream)

The mcp-chrome project is in active development. Features planned or in progress: **authentication**, **recording and playback**, **workflow automation**, and **Firefox extension support**.

## References

- Upstream: <https://github.com/hangwin/mcp-chrome>
- Releases: <https://github.com/hangwin/mcp-chrome/releases>
- Bridge package: `mcp-chrome-bridge` on npm
- License: MIT
