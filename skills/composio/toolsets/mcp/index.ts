import { FractalToolset } from "@fractal-os/plugin";

/**
 * Composio MCP toolset.
 *
 * Fixed endpoint: https://connect.composio.dev/mcp (Streamable HTTP).
 * Auth: account API key sent in the `x-consumer-api-key` header. The value
 * is the `${COMPOSIO_API_KEY}` placeholder, resolved by the Fractal toolset
 * service at connect time from the workspace/user .env or process env (a missing
 * key yields a guided error instead of an unauthenticated request). Tools are meta-tools (search, schemas,
 * connections, multi-execute, workbench) auto-discovered at load time.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Composio MCP — discover and run actions across 1,000+ apps with managed authentication. Search tools by intent, manage connections, execute in parallel, and process large results in a sandbox.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Search for tools and read their schemas before executing — never guess slugs or inputs.",
    },
    {
      type: "always",
      instruction:
        "Verify the app connection first; if missing, create the auth link and ask the user to authorize.",
    },
    {
      type: "always",
      instruction:
        "Ask for confirmation before sending, posting, deleting or any irreversible action, showing target and content.",
    },
    {
      type: "never",
      instruction:
        "Never store or print COMPOSIO_API_KEY or any app credential; they come from the environment only.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://connect.composio.dev/mcp",
    headers: { "x-consumer-api-key": "${COMPOSIO_API_KEY}" },
  })
  .build();
