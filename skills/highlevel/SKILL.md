---
name: "highlevel"
description: "Use this skill when the user wants to work with HighLevel in Fractal, including cRM and marketing workspace, or asks to use its MCP tools. Do not load it for unrelated services."

---

# HighLevel

Connects the Fractal workspace to HighLevel through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for cRM and marketing workspace.

## When to use this skill

Use it for tasks that involve HighLevel or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need HighLevel.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the HighLevel MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://services.leadconnectorhq.com/mcp`.
- Authentication: provide the credential fields listed in the Connect dialog. Follow the linked provider documentation to create credentials with only the access this task needs.

## Safe operation

1. Inspect the tools advertised by the HighLevel server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my HighLevel workspace.”
- “Find anything in HighLevel that needs attention and explain why.”
- “Help me review cRM and marketing workspace in HighLevel.”
