---
name: "helium10"
description: "Use this skill when the user wants to work with Helium 10 in Fractal, including amazon seller research, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Helium 10

Connects the Fractal workspace to Helium 10 through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for amazon seller research.

## When to use this skill

Use it for tasks that involve Helium 10 or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Helium 10.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Helium 10 MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://mcp.helium10.com/mcp`.
- Authentication: Fractal starts an OAuth flow for this endpoint. The endpoint must support the OAuth discovery and authorization flow used by Fractal; this integration has not been independently tested against every provider.

## Safe operation

1. Inspect the tools advertised by the Helium 10 server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Helium 10 workspace.”
- “Find anything in Helium 10 that needs attention and explain why.”
- “Help me review amazon seller research in Helium 10.”
