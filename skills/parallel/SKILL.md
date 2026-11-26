---
name: "parallel"
description: "Use this skill when the user wants to work with Parallel in Fractal, including web search and extraction, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Parallel

Connects the Fractal workspace to Parallel through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for web search and extraction.

## When to use this skill

Use it for tasks that involve Parallel or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Parallel.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Parallel MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://mcp.parallel.ai/mcp`.
- Authentication: this catalog entry does not declare credentials. If the provider requires authorization, follow the Connect flow and verify the endpoint response.

## Safe operation

1. Inspect the tools advertised by the Parallel server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Parallel workspace.”
- “Find anything in Parallel that needs attention and explain why.”
- “Help me review web search and extraction in Parallel.”
