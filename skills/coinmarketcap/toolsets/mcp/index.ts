import { FractalToolset } from "@fractal-os/plugin";

/**
 * CoinMarketCap MCP toolset.
 *
 * Connects to the official hosted CoinMarketCap Model Context Protocol server
 * at `https://mcp.coinmarketcap.com/mcp` and exposes its 12 professional
 * cryptocurrency market tools: search, live quotes, global metrics, technical
 * analysis (single coin + total market cap), crypto info, latest news,
 * semantic concept search, trending narratives, on-chain holder metrics,
 * derivatives, and upcoming macro events.
 *
 * Transport strategy:
 *   - Hosted endpoint only: `https://mcp.coinmarketcap.com/mcp` (HTTPS,
 *     MCP-over-HTTP, maintained by CoinMarketCap).
 *
 * Authentication:
 *   - Header-based. The `COINMARKETCAP_API_KEY` env var is forwarded as the
 *     `X-CMC-MCP-API-KEY` header. Get a key at https://pro.coinmarketcap.com/login.
 *   - If the env var is not set, the toolset still connects, but every tool
 *     call returns an authentication error.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Live and historical cryptocurrency market data from CoinMarketCap's official MCP server. Exposes 12 professional tools: search_cryptos, get_crypto_quotes_latest, get_global_metrics_latest, get_crypto_technical_analysis, get_crypto_marketcap_technical_analysis, get_crypto_info, get_crypto_latest_news, search_crypto_info, trending_crypto_narratives, get_crypto_metrics, get_global_crypto_derivatives_metrics, and get_upcoming_macro_events. Covers prices, market cap, dominance, Fear & Greed, RSI/MACD/MAs, holder distribution, on-chain metrics, trending narratives, and macro catalysts.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Search for a coin by name or symbol with `search_cryptos` before calling any ID-based tool. Most endpoints (quotes, info, technicals, metrics, news) require the numeric CMC ID, not the symbol. Never invent or guess an ID.",
    },
    {
      type: "always",
      instruction:
        "Batch lookups by passing a comma-separated list of IDs to `get_crypto_quotes_latest` (e.g. id=\"1,1027,5426\" for BTC, ETH, SOL) instead of separate round-trips. This is the most efficient way to compare coins.",
    },
    {
      type: "always",
      instruction:
        "Use `get_crypto_quotes_latest` for price / market cap / volume / percentage changes. Use `get_crypto_info` for static metadata (description, whitepaper, social links, tags). Use `get_crypto_metrics` for holder and address distribution. Do not confuse them.",
    },
    {
      type: "always",
      instruction:
        "For market-wide questions (bull/bear, Fear & Greed, dominance, total market cap), prefer `get_global_metrics_latest` and `get_crypto_marketcap_technical_analysis` over aggregating per-coin quotes.",
    },
    {
      type: "always",
      instruction:
        "When the user asks for technicals (RSI, MACD, moving averages, support / resistance, Fibonacci), call `get_crypto_technical_analysis` for a single coin or `get_crypto_marketcap_technical_analysis` for the total market cap. These are slow endpoints — do not call speculatively.",
    },
    {
      type: "always",
      instruction:
        "Surface the data's timestamp and source (CoinMarketCap) when freshness materially affects the answer (live quotes vs technical indicators vs on-chain metrics, which can lag).",
    },
    {
      type: "never",
      instruction:
        "Never fabricate, guess, or hardcode a CMC ID. If `search_cryptos` returns no result, tell the user the coin was not found and ask for clarification (typo, ambiguous symbol, or a delisted asset).",
    },
    {
      type: "never",
      instruction:
        "Do not embed the user's API key in tool calls, logs, or any response that could be persisted. The key belongs only in the `X-CMC-MCP-API-KEY` header of the MCP transport.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.coinmarketcap.com/mcp",
    headers: process.env.COINMARKETCAP_API_KEY
      ? { "X-CMC-MCP-API-KEY": process.env.COINMARKETCAP_API_KEY }
      : undefined,
  })
  .build();
