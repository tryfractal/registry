---
name: "revenuecat"
description: "Use this skill when the user wants to work with RevenueCat in Fractal, including subscriptions, products and paywalls, or asks to use its MCP tools. Do not load it for unrelated services."

---

# RevenueCat

Connects the Fractal workspace to RevenueCat through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for subscriptions, products and paywalls.

## When to use this skill

Use it for tasks that involve RevenueCat or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need RevenueCat.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the RevenueCat MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://mcp.revenuecat.ai/mcp`.
- Authentication: provide the credential fields listed in the Connect dialog. Follow the linked provider documentation to create credentials with only the access this task needs.

## Safe operation

1. Inspect the tools advertised by the RevenueCat server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my RevenueCat workspace.”
- “Find anything in RevenueCat that needs attention and explain why.”
- “Help me review subscriptions, products and paywalls in RevenueCat.”
