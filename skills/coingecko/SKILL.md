---
name: "coingecko"
description: "Use this skill when the user wants to work with CoinGecko in Fractal, including crypto market data, or asks to use its MCP tools. Do not load it for unrelated services."

---

# CoinGecko

Connects the Fractal workspace to CoinGecko through its MCP server. The server advertises its available tools at runtime; the exact actions depend on the service, account, and granted permissions. The integration is intended for crypto market data.

## When to use this skill

Use it for tasks that involve CoinGecko or its connected account. The toolset handles the service operations exposed by the configured MCP endpoint.

## When not to use it

Do not use this skill for another provider or for general tasks that do not need CoinGecko.

## Capabilities

- `mcp` toolset: discovers and calls the tools provided by the CoinGecko MCP server.

## Connection

- Transport: `http`.
- MCP endpoint: `https://mcp.api.coingecko.com/mcp`.
- Authentication: this catalog entry does not declare credentials. If the provider requires authorization, follow the Connect flow and verify the endpoint response.

## Safe operation

1. Inspect the tools advertised by the CoinGecko server before acting.
2. Confirm the relevant account, workspace, record, and requested scope.
3. Use the narrowest operation that achieves the request; verify the returned result.
4. Ask before deletion, bulk updates, external publication, financial movement, or other consequential actions unless the user authorized that exact action.

## Example requests

- “Give me an overview of my CoinGecko workspace.”
- “Find anything in CoinGecko that needs attention and explain why.”
- “Help me review crypto market data in CoinGecko.”
