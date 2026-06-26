---
name: coinmarketcap
description: >-
  Pull live and historical cryptocurrency market data from CoinMarketCap
  through the official CoinMarketCap MCP server. Use this skill when the
  user wants to look up a coin by name or symbol, get the latest price
  quote or market cap, fetch crypto metadata (logo, description, links,
  whitepaper, socials, tags), get technical analysis indicators (RSI,
  MACD, moving averages, Fibonacci levels), read on-chain and holder-
  distribution metrics, get latest news, perform semantic search over
  the crypto knowledge base, or get global market metrics (total market
  cap, BTC dominance, 24h volume, Fear & Greed Index). Triggers on
  phrases like "what's the price of Bitcoin right now", "get Solana's
  market cap", "is Ethereum overbought — show me RSI", "what's the
  Fear and Greed index", "show me trending narratives", "compare BTC,
  ETH, SOL quotes", or any request for crypto prices, market data,
  technicals, or on-chain analytics. Use this skill even if the user
  just says "use coinmarketcap".
---

# CoinMarketCap Skill

This skill exposes the official **CoinMarketCap Model Context Protocol server** as a single Fractal toolset. The server is hosted by CoinMarketCap itself at `https://mcp.coinmarketcap.com/mcp` and ships 12 professional tools that cover market data, technical analysis, news & knowledge, on-chain metrics, derivatives, trending narratives, and macro events. Authenticate by passing your CMC Pro API key in the `X-CMC-MCP-API-KEY` header.

## Toolset

- `mcp` — CoinMarketCap MCP server. Connects to the hosted endpoint `https://mcp.coinmarketcap.com/mcp`. Authentication is header-based: the user's `COINMARKETCAP_API_KEY` is forwarded as `X-CMC-MCP-API-KEY`. Get a key at <https://pro.coinmarketcap.com/login>.

## Available tools (12)

### Market data

| Tool | What it does |
|---|---|
| `search_cryptos` | Fuzzy search by name, symbol, or slug. Returns `id`, `name`, `symbol`, `slug`, and `rank`. |
| `get_crypto_quotes_latest` | Real-time price, market cap, 24h volume, percentage changes (1h, 24h, 7d, 30d, 90d, 1y), circulating supply, dominance. Pass one ID or a comma-separated list. |
| `get_global_metrics_latest` | Total market cap, 24h volume, BTC/ETH dominance, Fear & Greed Index, Altcoin Season Index, ETF flows. |

### Technical analysis

| Tool | What it does |
|---|---|
| `get_crypto_technical_analysis` | Moving averages (SMA, EMA), MACD, RSI, Fibonacci retracement / extension, pivot points, support / resistance for a single coin. |
| `get_crypto_marketcap_technical_analysis` | Same indicator set applied to the total crypto market capitalization. |

### Information and news

| Tool | What it does |
|---|---|
| `get_crypto_info` | Logo, description, official website, whitepaper, social links, explorer URLs, tags, launch date. |
| `get_crypto_latest_news` | Recent headlines, descriptions, content, URLs, publish dates for a coin. |
| `search_crypto_info` | Semantic search over the crypto knowledge base — concepts, FAQs, definitions. |
| `trending_crypto_narratives` | Hot narratives with market cap, volume, performance, and the top coins in each narrative. |

### Advanced metrics

| Tool | What it does |
|---|---|
| `get_crypto_metrics` | Address distribution by holding value and time, whale vs retail split, holder cohorts (traders / cruisers / holders), average transaction fees. |
| `get_global_crypto_derivatives_metrics` | Global leverage, open interest, funding rates, liquidations, futures vs perpetuals breakdown. |
| `get_upcoming_macro_events` | Upcoming economic events (Fed meetings, regulatory deadlines, major announcements) that may impact the market. |

## Usage rules

- **Search before quoting.** When a user mentions a coin by name or symbol (e.g. "how is Solana doing?"), call `search_cryptos` first to get the numeric CMC ID. Most other tools require the ID, not the name.
- **Batch IDs to save calls.** To compare multiple coins, pass a comma-separated list to `get_crypto_quotes_latest` (e.g. `id="1,1027,5426"` for BTC, ETH, SOL) instead of separate round-trips.
- **Prefer `get_crypto_quotes_latest` for "what is X trading at".** Use `get_crypto_info` for static metadata (description, links, tags) — not for price. Use `get_crypto_metrics` for holder / distribution data — not for price.
- **Reach for TA deliberately.** `get_crypto_technical_analysis` and `get_crypto_marketcap_technical_analysis` are slow; call them only when the user asks about technicals, RSI, MACD, support / resistance, or market-cap indicators. Don't call them speculatively.
- **For "is the market bullish / bearish"** use `get_global_metrics_latest` (Fear & Greed, dominance, total market cap) and `get_crypto_marketcap_technical_analysis` — not per-coin quotes.
- **Match the data freshness to the question.** Quotes are real-time; technicals and on-chain metrics may lag. Tell the user the data's timestamp when it materially affects the answer.
- **No results → say so.** If `search_cryptos` returns nothing, report that the coin wasn't found and ask the user to clarify (typo, symbol ambiguity, or a delisted asset). Don't guess an ID.
- **Rate limits and outages.** If a tool returns a 429, surface the message, suggest a short wait, and proceed with whatever data is already available. If a tool fails on retry, skip that section of the answer rather than blocking the whole response.
- **Never invent IDs.** CMC IDs are stable integers; if you don't have one, search. Wrong IDs return wrong data silently.

## Configuration

| Env var | Required | Purpose |
|---|---|---|
| `COINMARKETCAP_API_KEY` | Yes | Your CoinMarketCap Pro API key, sent as the `X-CMC-MCP-API-KEY` HTTP header. Generate one at <https://pro.coinmarketcap.com/login>. Without it, the connection still initializes but every tool call will return an authentication error. |

The toolset reads the env var at connection time and forwards the value verbatim as a header. No client-side caching, no key rotation logic — the live server is the single source of truth.

## Connection

```json
{
  "type": "mcp-server::http",
  "url": "https://mcp.coinmarketcap.com/mcp",
  "headers": {
    "X-CMC-MCP-API-KEY": "<your-api-key>"
  }
}
```

The endpoint is HTTPS, the transport is standard MCP-over-HTTP, and the server is hosted and maintained by CoinMarketCap — no subprocess to launch, no npm install required.

## References

- Official MCP overview: <https://pro.coinmarketcap.com/api/documentation/ai-agent-hub/mcp>
- CoinMarketCap Pro API docs: <https://coinmarketcap.com/api/documentation/v1/>
- API key dashboard: <https://pro.coinmarketcap.com/login>
- AI Agent Hub: <https://pro.coinmarketcap.com/api/documentation/ai-agent-hub>
- License: third-party API; usage subject to CoinMarketCap's terms at <https://coinmarketcap.com/terms/>.
