---
name: "apple-apps"
description: "Use this skill when the user wants to work with Apple apps in Fractal, including mail, Calendar and more on your Mac, or asks to use its MCP tools. Do not load it for unrelated services."

---

# Apple apps

Connects the Fractal workspace to Apple apps through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for mail, Calendar and more on your Mac.

## When to use this skill

Use it for tasks that involve Apple apps or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need Apple apps.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the Apple apps MCP server.

## Connection

- Transport: `stdio`.
- Command: `npx -y mcp-icloud@2.1.4`.
- Authentication: this catalog entry does not declare credentials. If the provider requires authorization, follow the Connect flow and verify the endpoint response.

## Safe operation

1. Inspect the tools advertised by the Apple apps server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my Apple apps workspace.”
- “Find anything in Apple apps that needs attention and explain why.”
- “Help me review mail, Calendar and more on your Mac in Apple apps.”
