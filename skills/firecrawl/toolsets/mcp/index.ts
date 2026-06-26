import { FractalToolset } from "@fractal-os/plugin";

/**
 * Firecrawl MCP toolset.
 *
 * Spawns the official `firecrawl-mcp` server and exposes every web
 * extraction, crawling, search, monitoring, and deep-research tool it
 * provides. Connects to the hosted Firecrawl cloud API by default;
 * override `FIRECRAWL_API_URL` to point at a self-hosted instance.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Web data extraction powered by the official Firecrawl MCP server. Scrape any URL into Markdown / JSON / branding, batch-scrape known URLs, map and crawl entire sites, search the web, extract structured data with an LLM, drive a headless browser with `interact`, launch an autonomous deep-research agent, and watch pages for changes — all without managing proxies, headless browsers, or anti-bot infrastructure.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pick the right tool for the job: `scrape` for a single known URL, `batch_scrape` for a list of known URLs, `map` to discover URLs on a site, `crawl` for broad multi-page extraction, `search` for open-ended web questions, `agent` for multi-source research when you don't know the URLs in advance, and `interact` only when you need real browser actions (click, type, login).",
    },
    {
      type: "always",
      instruction:
        "Prefer JSON format with a schema over Markdown on `scrape` and `batch_scrape`. Use `formats: [{ type: \"json\", schema: {...} }]` to pull only the fields you need; reach for Markdown only when the task genuinely requires the full page (summarizing an article, analyzing structure).",
    },
    {
      type: "always",
      instruction:
        "Set `onlyMainContent: true` and `redactPII: true` on `scrape` and `batch_scrape` by default to strip nav/footer/ads and mask emails, phone numbers, and other PII before the result reaches the model.",
    },
    {
      type: "always",
      instruction:
        "Pass a strict JSON `schema` to `extract`. Without a schema, `extract` returns free-form LLM prose; with a schema, you get validated JSON you can pipe straight into the next step.",
    },
    {
      type: "always",
      instruction:
        "Always poll async jobs. `crawl`, `batch_scrape`, and `agent` return a job/batch id immediately — call `firecrawl_check_crawl_status`, `firecrawl_check_batch_status`, or `firecrawl_agent_status` (every 10–30s for `agent`, a few seconds for crawl/batch) until status is `completed` or `failed`. Do not try to read results from the launch response.",
    },
    {
      type: "always",
      instruction:
        "Call `firecrawl_search_feedback` after every `firecrawl_search` you actually used (or that didn't help). The first submission per `searchId` refunds 1 credit; `missingContent` is the highest-signal field for improving search quality.",
    },
    {
      type: "never",
      instruction:
        "Never call `crawl` without `limit` and `maxDepth`. Crawl responses can blow past token limits — prefer `map` + `batch_scrape` when you need tighter control over which pages get fetched.",
    },
    {
      type: "never",
      instruction:
        "Never log, commit, or paste the `FIRECRAWL_API_KEY` / `FIRECRAWL_OAUTH_TOKEN` into chat or source files. Treat it as a credential — read it from a secret manager or env var, never from a hardcoded string.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "firecrawl-mcp"],
    env: {
      FIRECRAWL_API_KEY: "${env.FIRECRAWL_API_KEY}",
    },
  })
  .build();
