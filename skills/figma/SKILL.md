---
name: "figma"
description: "Use this skill when the user wants to work with Figma in Fractal, including designs and prototypes, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Figma

Connects the Fractal workspace to Figma through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for designs and prototypes.

## When to use this skill

Use it for tasks that involve Figma or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Figma.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Figma MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `http://127.0.0.1:3845/mcp`.
- Local setup: open the provider’s desktop app, sign in with an eligible account, and enable its local MCP server from the app settings. Keep the desktop app open while using the integration. The local endpoint is read-only and works with files in a team project; provider support and plan requirements may apply.
- Setup guide: https://developers.figma.com/docs/figma-mcp-server/local-server-installation/
## Safe operation

1. Inspect the tools advertised by the Figma server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Figma workspace.”
- “Find anything in Figma that needs attention and explain why.”
- “Help me review designs and prototypes in Figma.”
