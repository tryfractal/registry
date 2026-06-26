---
name: firecrawl
description: >-
  Turn the live web into clean, AI-ready data with the official Firecrawl
  MCP server. Use this skill when the user wants to scrape a web page,
  crawl an entire site, extract structured data from URLs, run deep
  research across the web, discover URLs on a domain, or batch-scrape a
  list of known links. Triggers on phrases like "scrape this page and
  give me the markdown", "crawl example.com and summarize the blog",
  "extract the product name, price, and description from these URLs",
  "map every URL on docs.example.com", "search the web for the latest
  research on X", "monitor this pricing page for changes", or any
  request to programmatically read, index, or extract from a website.
  Prefer this skill for server-side crawling and batch extraction; use
  a browser-automation tool for tasks needing real user interaction.
---

# Firecrawl Skill

This skill exposes the **official Firecrawl MCP server** (`firecrawl-mcp` on npm, MIT-licensed) as a single Fractal toolset. Firecrawl turns websites into clean Markdown, structured JSON, or branding profiles — no headless browser orchestration required, no proxy rotation, no anti-bot headaches. The server talks to the hosted Firecrawl API by default and can be pointed at a self-hosted instance with `FIRECRAWL_API_URL`.

## Toolset

- `mcp` — Firecrawl MCP server (`firecrawl-mcp` via `npx -y firecrawl-mcp`). Connects over stdio to the hosted Firecrawl cloud API. Authentication is provided through the `FIRECRAWL_API_KEY` environment variable. A keyless hosted endpoint at `https://mcp.firecrawl.dev/v2/mcp` is also available for `scrape`, `search`, and `interact` with rate limits.

## Core tools (always available)

| Tool | What it does |
|---|---|
| `firecrawl_scrape` | Scrape a single URL into Markdown, HTML, JSON (with schema), screenshots, or a branding profile. Best for: one known page. |
| `firecrawl_batch_scrape` | Scrape many known URLs in parallel with built-in rate limiting. Returns a batch id; poll `firecrawl_check_batch_status` for progress. |
| `firecrawl_check_batch_status` | Poll the status of a `firecrawl_batch_scrape` job. |
| `firecrawl_map` | Discover every URL on a domain (or path prefix). Best for: "what pages does this site have?" |
| `firecrawl_crawl` | Asynchronously crawl a website starting from a URL, with `maxDepth`, `limit`, `deduplicateSimilarURLs`, etc. Returns a job id; poll `firecrawl_check_crawl_status`. |
| `firecrawl_check_crawl_status` | Poll the status of a `firecrawl_crawl` job. |
| `firecrawl_search` | Web search with optional inline scraping of result pages. Returns `results[]` and an `id` for feedback. |
| `firecrawl_extract` | LLM-powered structured extraction from one or many URLs. Provide a `prompt` and a `schema`; get typed JSON back. |
| `firecrawl_interact` | Drive a headless browser on a URL — click, type, navigate — and return a `scrapeId` for follow-up scraping. |
| `firecrawl_agent` | Launch an autonomous deep-research agent that browses, searches, and synthesizes answers asynchronously. Returns a job id; poll `firecrawl_agent_status`. |
| `firecrawl_agent_status` | Poll the status of an `firecrawl_agent` job. |
| `firecrawl_search_feedback` | Submit feedback on a `firecrawl_search` result. Refunds 1 credit on the first submission per search id. |
| `firecrawl_feedback` | Submit feedback on any v2 endpoint job (`scrape`, `parse`, `map`, `search`). |
| `firecrawl_deep_research`, `firecrawl_generate_llmstxt` | Higher-level convenience tools. |

## Monitor tools (recurring scrapes with change detection)

| Tool | What it does |
|---|---|
| `firecrawl_monitor_create` | Create a recurring page or site monitor. Pass `page` / `pages` + `goal` and the server schedules a 30-minute check. |
| `firecrawl_monitor_list` | List all monitors in the workspace. |
| `firecrawl_monitor_get` | Get one monitor by id. |
| `firecrawl_monitor_update` | Update `goal`, `judgeEnabled`, `webhook`, `notification`, etc. |
| `firecrawl_monitor_run` | Trigger an immediate check. |
| `firecrawl_monitor_checks` | List checks (optionally filtered by status). |
| `firecrawl_monitor_check` | Get a single check's per-page `diff`, `snapshot`, and `judgment.meaningful` flag. |

Monitors run on a schedule, diff each result against the last retained snapshot, and can notify by webhook or email. When `goal` is set, meaningful-change judging runs automatically.

## Usage rules

- **Choose the right tool for the job.** Use `scrape` for a single known URL, `batch_scrape` for a list of known URLs, `map` to discover URLs on a site, `crawl` for broad multi-page extraction, `search` for open-ended questions, and `agent` for multi-source research where you don't know the URLs in advance.
- **Prefer JSON format with a schema over Markdown.** `scrape` with `formats: [{ type: "json", schema: {...} }]` returns only the fields you asked for. Reach for Markdown only when the task genuinely requires the full page (e.g. summarizing an article, analyzing page structure).
- **Always poll async jobs.** `crawl`, `batch_scrape`, and `agent` return a job id immediately. Call the matching `_status` tool (every 10–30s for agent, a few seconds for crawl/batch) until status is `completed` or `failed`.
- **Set sensible limits on `crawl`.** Crawl responses can blow past token limits. Always set `limit` and `maxDepth`; prefer `map` + `batch_scrape` when you need tighter control.
- **Use `onlyMainContent: true` and `redactPII: true` by default** on `scrape` and `batch_scrape` to strip nav/footer/ads and to mask emails, phone numbers, etc.
- **Pass a `schema` to `extract`.** Without a schema, `extract` returns free-form LLM prose. With a schema, you get validated JSON that you can pipe straight into the next step.
- **Send search feedback when you used a result.** Call `firecrawl_search_feedback` after every `firecrawl_search` you acted on (or that didn't help). The first submission per `searchId` refunds 1 credit; `missingContent` is the highest-signal field.
- **Opt out of feedback if you must.** Set `FIRECRAWL_NO_SEARCH_FEEDBACK=1` (or `FIRECRAWL_NO_ENDPOINT_FEEDBACK=1`) on the server env to skip the feedback tools entirely.
- **Self-host by overriding `FIRECRAWL_API_URL`.** Point it at your own Firecrawl instance (e.g. `https://firecrawl.your-domain.com`) and the server will route there instead of the cloud.
- **Use a real `FIRECRAWL_API_KEY` for production.** The keyless hosted endpoint at `https://mcp.firecrawl.dev/v2/mcp` is rate-limited and only unlocks `scrape`, `search`, and `interact`.
- **Reach for `interact` only when you need real browser actions** (click, type, navigate, login). For plain read-only extraction, `scrape` is faster and cheaper.

## Connection arguments

The toolset launches the server with `npx -y firecrawl-mcp` and forwards the following environment variables from the workspace:

| Env var | Required | Purpose |
|---|---|---|
| `FIRECRAWL_API_KEY` | Yes (cloud) | Your Firecrawl API key from `https://www.firecrawl.dev/app/api-keys`. |
| `FIRECRAWL_API_URL` | No | Custom endpoint for self-hosted Firecrawl. If set, takes precedence over the cloud API. |
| `FIRECRAWL_OAUTH_TOKEN` | No (stdio) | Static OAuth access token (`fco_…`) for stdio transport. Use this for bearer auth, not refresh tokens. |
| `FIRECRAWL_RETRY_MAX_ATTEMPTS` | No | Max retries for rate-limited requests. Default: `3`. |
| `FIRECRAWL_RETRY_INITIAL_DELAY` | No | Initial backoff in ms. Default: `1000`. |
| `FIRECRAWL_RETRY_MAX_DELAY` | No | Max backoff in ms. Default: `10000`. |
| `FIRECRAWL_RETRY_BACKOFF_FACTOR` | No | Exponential backoff multiplier. Default: `2`. |
| `FIRECRAWL_CREDIT_WARNING_THRESHOLD` | No | Credit usage warning. Default: `1000`. |
| `FIRECRAWL_CREDIT_CRITICAL_THRESHOLD` | No | Critical credit alert. Default: `100`. |
| `FIRECRAWL_NO_SEARCH_FEEDBACK` / `FIRECRAWL_DISABLE_SEARCH_FEEDBACK` | No | Skip registering the `firecrawl_search_feedback` tool. |
| `FIRECRAWL_NO_ENDPOINT_FEEDBACK` / `FIRECRAWL_DISABLE_ENDPOINT_FEEDBACK` | No | Skip registering the `firecrawl_feedback` tool. |
| `HTTP_STREAMABLE_SERVER=true` | No | Switch the server from stdio to Streamable HTTP on `http://localhost:3000/mcp`. |
| `CLOUD_SERVICE=true` / `SSE_LOCAL=true` | No | Use hosted Firecrawl or local SSE transport. |

The toolset is also runnable over Streamable HTTP if you prefer a network transport — set the env vars above and connect to `http://localhost:3000/mcp`.

## Format-selection cheatsheet

| Task | Tool | `formats` |
|---|---|---|
| Read a single article | `scrape` | `["markdown"]`, `onlyMainContent: true` |
| Pull specific fields from a product page | `scrape` | `[{ "type": "json", "schema": {...} }]` |
| Extract brand colors / fonts from a homepage | `scrape` | `["branding"]` |
| Get 50 job listings from a careers page | `extract` | `schema` with `jobs[]` |
| Index every URL under `/docs` | `map` | — (returns `url[]`) |
| Pull the first 50 pages of `/blog` | `crawl` | `maxDepth: 2, limit: 50` |
| Find recent blog posts about "vector databases" | `search` | `scrapeOptions: { formats: ["markdown"] }` |
| Watch a pricing page for changes | `monitor_create` | `page` + `goal` |

## Output handling

- `scrape` and `batch_scrape` return a `scrapeId` you can pass to the `interact` tool to drive a follow-up browser session.
- `crawl`, `batch_scrape`, and `agent` return a `jobId` / `batchId` for polling. Don't try to read results from the first response — call the matching `_status` tool.
- `extract` returns structured JSON that conforms to the provided `schema`. Validate it before using it downstream.
- `search` returns an `id` you should pass to `firecrawl_search_feedback` after you've used the results (refunds 1 credit on the first submission, per UTC day, per team — capped at 100 credits).

## Security notes

- Firecrawl is a **network tool**: it can reach any URL the API key is allowed to reach, and `extract` / `agent` will follow links. Treat the API key as a credential — never log it, never commit it, never paste it into chat.
- `agent` runs autonomously for minutes. Set a clear `prompt`, a strict `schema`, and review the result before acting on it.
- `interact` can submit forms, click buttons, and perform real actions on real sites. Use it on staging or trusted origins; the user's account is on the line.
- `redactPII: true` is opt-in. Enable it whenever the scraped content might be fed to a public-facing model.

## References

- Upstream MCP server: <https://github.com/firecrawl/firecrawl-mcp-server>
- Firecrawl docs: <https://docs.firecrawl.dev/>
- OpenAPI spec: <https://docs.firecrawl.dev/openapi.json>
- npm package: <https://www.npmjs.com/package/firecrawl-mcp>
- License: MIT
- API keys: <https://www.firecrawl.dev/app/api-keys>
