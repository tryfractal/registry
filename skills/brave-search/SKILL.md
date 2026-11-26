---
name: "brave-search"
description: "Use this skill when the user wants to work with Brave Search in Fractal, including private web search, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Brave Search

Connects the Fractal workspace to Brave Search through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for private web search.

## When to use this skill

Use it for tasks that involve Brave Search or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Brave Search.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Brave Search MCP server.

## Connection

- Transport: `stdio`.
- Command: `npx -y @brave/brave-search-mcp-server`.
- Authentication: provide the credential fields listed in the Connect dialog. Follow the linked provider documentation to create credentials with only the access this task needs.

## Safe operation

1. Inspect the tools advertised by the Brave Search server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Brave Search workspace.”
- “Find anything in Brave Search that needs attention and explain why.”
- “Help me review private web search in Brave Search.”
