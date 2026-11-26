---
name: "obsidian"
description: "Use this skill when the user wants to work with Obsidian in Fractal, including notes in your vault, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Obsidian

Connects the Fractal workspace to Obsidian through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for notes in your vault.

## When to use this skill

Use it for tasks that involve Obsidian or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Obsidian.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Obsidian MCP server.

## Connection

- Transport: `stdio`.
- Command: `npx -y obsidian-mcp-server@3.7.2`.
- Authentication: provide the credential fields listed in the Connect dialog. Follow the linked provider documentation to create credentials with only the access this task needs.
- The server uses the connection environment values declared in the toolset configuration.

## Safe operation

1. Inspect the tools advertised by the Obsidian server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Obsidian workspace.”
- “Find anything in Obsidian that needs attention and explain why.”
- “Help me review notes in your vault in Obsidian.”
