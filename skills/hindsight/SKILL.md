---
name: "hindsight"
description: "Use this skill when the user wants to work with Hindsight in Fractal, including memory that learns over time, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Hindsight

Connects the Fractal workspace to Hindsight through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for memory that learns over time.

## When to use this skill

Use it for tasks that involve Hindsight or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Hindsight.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Hindsight MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://api.hindsight.vectorize.io/mcp`.
- Authentication: Fractal starts an OAuth flow for this endpoint. The endpoint must support the OAuth discovery and authorization flow used by Fractal; this integration has not been independently tested against every provider.
- The provider also lists API-key authentication, but this skill configures the OAuth path; alternate modes are not represented as automatic fallbacks.

## Safe operation

1. Inspect the tools advertised by the Hindsight server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Hindsight workspace.”
- “Find anything in Hindsight that needs attention and explain why.”
- “Help me review memory that learns over time in Hindsight.”
