---
name: "metricool"
description: "Use this skill when the user wants to work with Metricool in Fractal, including social media analytics and planning, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Metricool

Connects the Fractal workspace to Metricool through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for social media analytics and planning.

## When to use this skill

Use it for tasks that involve Metricool or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Metricool.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Metricool MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://ai.metricool.com/mcp`.
- Authentication: Fractal starts an OAuth flow for this endpoint. The endpoint must support the OAuth discovery and authorization flow used by Fractal; this integration has not been independently tested against every provider.

## Safe operation

1. Inspect the tools advertised by the Metricool server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Metricool workspace.”
- “Find anything in Metricool that needs attention and explain why.”
- “Help me review social media analytics and planning in Metricool.”
