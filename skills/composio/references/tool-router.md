# Composio MCP (Tool Router)

The server exposes a small set of meta-tools over MCP instead of thousands of tool definitions, so the agent's context stays small. The agent searches, connects, then executes.

## Endpoint & auth
- URL: `https://connect.composio.dev/mcp` (Streamable HTTP). No per-session URL needed.
- Header: `x-consumer-api-key: <COMPOSIO_API_KEY>` (key from dashboard → Settings → Sessions & API Key).
- Alternative: MCP clients can authenticate with OAuth instead of the key; revoke OAuth clients in the same dashboard page.
- Fractal: set `COMPOSIO_API_KEY`; the `mcp` toolset wires the URL and header.
- Claude Code: `claude mcp add --transport http composio https://connect.composio.dev/mcp --header "x-consumer-api-key: <KEY>"`.

## App auth flow
1. `COMPOSIO_MANAGE_CONNECTIONS` for the toolkit → returns an auth URL if not connected.
2. User authorizes in the browser.
3. `COMPOSIO_WAIT_FOR_CONNECTIONS` → proceed once active.

## Tips
- Use the remote workbench for bulk transformations and large payloads.
- Rotating the key (Regenerate in the dashboard) breaks existing header-based clients until updated.
- Docs: <https://docs.composio.dev/tool-router/using-with-mcp-clients>
