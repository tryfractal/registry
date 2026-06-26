---
name: playwright
description: >-
  Drive a real browser (Chromium, Firefox, WebKit, or installed Chrome/Edge)
  from the agent through the official Microsoft Playwright MCP server. Use
  this skill when the user wants to navigate to a web page, click buttons
  or links, fill out forms, type into inputs, select dropdown options,
  scrape structured data, take a screenshot, run an end-to-end test, debug
  a web app, mock network requests in the browser, or interact with any
  browser surface. Triggers on phrases like "open this URL in a browser",
  "go to the dashboard and click on New", "fill out the signup form",
  "scrape the list of products from the search page", "take a screenshot
  of the homepage", "run a Playwright e2e test", "mock the /api/users
  endpoint", "save the page as a PDF", or any request to programmatically
  drive a browser. Use this skill even if the user says "use playwright"
  or asks how to test a web app.
---

# Playwright Skill

This skill exposes the full **Microsoft Playwright MCP server** (`@playwright/mcp`) as a single Fractal toolset. Playwright MCP uses Playwright's **accessibility tree** rather than pixel screenshots to drive the browser, so it works with text-only models and produces deterministic, structured interactions.

## Toolset

- `mcp` — Playwright MCP server (`@playwright/mcp@latest`). Default browser is **Chromium headed**, with the `devtools`, `network`, `storage`, and `config` capabilities pre-enabled. Additional capabilities (`vision`, `pdf`, `testing`) can be added by editing the toolset `args`.

## Core automation tools (always available)

| Tool | What it does |
|---|---|
| `browser_navigate` | Navigate to a URL. |
| `browser_navigate_back` | Go back in history. |
| `browser_close` | Close the page. |
| `browser_snapshot` | Capture an **accessibility snapshot** of the page (preferred over screenshots). |
| `browser_take_screenshot` | Save a PNG/JPEG screenshot of the page or a specific element. |
| `browser_click` | Click an element (supports double-click and modifier keys). |
| `browser_type` | Type into an editable element (supports `slowly` and `submit`). |
| `browser_fill_form` | Fill multiple form fields in one call. |
| `browser_hover` | Hover over an element. |
| `browser_select_option` | Select one or more options in a dropdown. |
| `browser_press_key` | Press a key (`Enter`, `ArrowLeft`, `a`, etc.). |
| `browser_drag` | Drag-and-drop between two elements. |
| `browser_drop` | Drop files or MIME-typed data onto an element. |
| `browser_file_upload` | Upload one or more local files via a file chooser. |
| `browser_handle_dialog` | Accept/dismiss `alert`, `confirm`, `prompt` dialogs. |
| `browser_evaluate` | Run a JavaScript expression on the page (or on a chosen element). |
| `browser_run_code_unsafe` | Run an arbitrary Playwright `page` snippet. **RCE-equivalent — never call with untrusted input.** |
| `browser_console_messages` | Read console output (filter by `level`: `error` / `warning` / `info` / `debug`). |
| `browser_network_requests` | List network requests since the last navigation. |
| `browser_network_request` | Get full headers + body of one request. |
| `browser_resize` | Resize the viewport. |
| `browser_wait_for` | Wait for a fixed time, for text to appear, or for text to disappear. |
| `browser_tabs` | List / create / close / select tabs. |

## Opt-in capabilities

The following capability groups ship behind `--caps=` flags. They are auto-discovered by the toolset at load time.

| Capability flag | What it unlocks |
|---|---|
| `--caps=vision` | Coordinate-based mouse tools (`browser_mouse_click_xy`, `browser_mouse_drag_xy`, `browser_mouse_wheel`, `browser_mouse_move_xy`, `browser_mouse_down`, `browser_mouse_up`). Use only when the accessibility tree is not enough. |
| `--caps=pdf` | `browser_pdf_save` — save the current page as a PDF. |
| `--caps=testing` | `browser_verify_*` and `browser_generate_locator` — assert elements / text / values are visible. |
| `--caps=devtools` | (Enabled by default) Highlight, annotation overlay, trace + video recording, and step-through debugging. |
| `--caps=network` | (Enabled by default) `browser_route` / `browser_route_list` / `browser_unroute` (mock network requests) and `browser_network_state_set` (go offline). |
| `--caps=storage` | (Enabled by default) Cookie + localStorage + sessionStorage read/write and `browser_storage_state` save/restore. |
| `--caps=config` | (Enabled by default) `browser_get_config` — return the resolved final config. |

## Usage rules

- **Prefer `browser_snapshot` over `browser_take_screenshot`.** The accessibility snapshot gives you stable element refs (`target`) you can pass to click / type / hover. Screenshots are for human review only.
- **Use `target` from the snapshot, not CSS selectors.** When a snapshot returns `ref=e15`, pass `target: "e15"` to `browser_click`. The refs are stable for the lifetime of the page; regenerate after navigation.
- **Use `element` to ask for human permission.** Pass a short human description (`"the Sign In button"`) so the action is self-documenting in the log.
- **Mock with `--caps=network` instead of patching code.** Use `browser_route` to intercept `**/api/users` and reply with a fixture — far cheaper than recompiling.
- **Persist auth with `--storage-state`.** Run a one-time login flow, save state, then restart with `--isolated --storage-state=auth.json` for repeatable test runs.
- **Don't call `browser_run_code_unsafe` with untrusted code.** It is the only tool with RCE-equivalent reach (executes in the MCP server process).
- **Close the browser when done.** Long-lived persistent profiles block other clients in the same workspace.

## Connection arguments

Edit the toolset `args` list to customize the launch. All flags also have matching `PLAYWRIGHT_MCP_*` environment variables. The most common ones:

| Flag | Purpose |
|---|---|
| `--browser <chrome\|firefox\|webkit\|msedge>` | Which browser engine to drive. Default: `chrome`. |
| `--device "iPhone 15"` | Emulate a specific device. |
| `--executable-path <path>` | Use a custom browser binary. |
| `--headless` | Run without a visible window (CI / servers). |
| `--isolated` | Keep the profile in memory; discard on close. |
| `--storage-state <path>` | Bootstrap from a saved cookies + localStorage file. |
| `--user-data-dir <path>` | Persist profile between sessions (default is per-workspace). |
| `--viewport-size 1280x720` | Initial viewport. |
| `--user-agent <string>` | Override the User-Agent. |
| `--ignore-https-errors` | Skip TLS validation. |
| `--proxy-server <url>` | Route through an HTTP or SOCKS proxy. |
| `--init-script <path.js>` | Run a JS file in every page before its own scripts. |
| `--init-page <path.ts>` | Run a TypeScript file against the Playwright `page` object on load. |
| `--allowed-origins <list>` / `--blocked-origins <list>` | Restrict which origins the browser may request. |
| `--grant-permissions geolocation,clipboard-read` | Pre-grant browser permissions. |
| `--output-dir <path>` | Where to write screenshots, traces, and saved state. |
| `--save-session` | Persist the session into the output directory. |
| `--secrets <dotenv-file>` | Redact matching values from tool responses. |
| `--cdp-endpoint <ws-url>` | Attach to an already-running browser via CDP. |
| `--extension` | Connect to a real browser through the Playwright MCP Chrome Extension. |
| `--caps vision,pdf,testing` | Enable extra capability groups. |

## Profiles

Three profile modes trade off between session isolation and login persistence:

- **Persistent (default)** — Login state is saved to `~/.cache/ms-playwright/mcp-{channel}-{workspace-hash}` per workspace. Two clients in the same workspace will conflict; point them at different `--user-data-dir` paths or run one with `--isolated`.
- **Isolated** — `npx @playwright/mcp@latest --isolated [--storage-state=auth.json]`. Each session starts clean; storage state is loaded from a file if provided.
- **Browser Extension** — `--extension` attaches to the user's live Chrome/Edge. Requires the [Playwright MCP Chrome Extension](https://github.com/microsoft/playwright/tree/main/packages/extension) to be installed.

## Output modes

- Default: snapshots, console messages, and network logs are returned inline in the tool response.
- `--output-mode file` plus `--output-dir <path>` writes them to disk so the response payload stays small. Use this for long-running sessions and CI.

## Standalone HTTP server

If the IDE runs in a worker process or there is no display, run the server standalone and connect over HTTP:

```bash
npx @playwright/mcp@latest --port 8931
# then in the MCP client:
# { "mcpServers": { "playwright": { "url": "http://localhost:8931/mcp" } } }
```

Docker (headless Chromium only) is also supported: `mcr.microsoft.com/playwright/mcp`.

## Security notes

- Playwright MCP is **not a security boundary**. Any secrets observed in tool responses can be exfiltrated by a malicious prompt. Use `--secrets` only as a convenience redactor, not as a control.
- `--allow-unrestricted-file-access` is a guardrail, not a sandbox. Client-level permissions are the real boundary.

## References

- Upstream docs: <https://github.com/microsoft/playwright-mcp>
- npm package: <https://www.npmjs.com/package/@playwright/mcp>
- License: Apache-2.0
