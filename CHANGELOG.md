# Changelog

All notable changes to the **Fractal Registry** (this repository) are documented here. Per-skill changes are documented in each skill's own `CHANGELOG.md`.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Add 238 MCP service skills and hosted OAuth toolsets for eight existing integrations.

## [1.0.0] — 2026-06-26

### Added

- **Initial marketplace release** — 38 skills ready for installation from `tryfractal.co/marketplace`.
- Standardised skill layout: every skill ships `SKILL.md` (agent-facing manual) + `.fractal/manifest.json` (marketplace metadata).
- Standardised toolset folder convention: MCP-only skills use `toolsets/mcp/`, custom toolsets use one folder per entity.
- Repository governance: `README.md`, `AGENTS.md`, `CONTRIBUTING.md`, `CODE_OF_CONDUCT.md`, `SECURITY.md`, `CODEOWNERS`, and 7 issue templates.
- Skills are fully independent — no cross-references between `SKILL.md` files.
- Marketplace integration via the public Fractal site at `tryfractal.co/marketplace`.

### Skills

<details>
<summary><b>Core</b></summary>

- **[fractal](./skills/fractal/SKILL.md)** — Core Fractal OS skill that bootstraps every agent with the operating system, memory, task lifecycle, and orchestration protocols. → [Marketplace](https://tryfractal.co/marketplace/fractal) · [SKILL.md](./skills/fractal/SKILL.md)

</details>

<details>
<summary><b>Browser & Device Automation</b></summary>

- **[playwright](./skills/playwright/SKILL.md)** — Browser automation powered by the official Microsoft Playwright MCP server. Navigate, click, fill forms, scrape data, mock network, and run e2e flows. → [Marketplace](https://tryfractal.co/marketplace/playwright) · [SKILL.md](./skills/playwright/SKILL.md)
- **[chrome](./skills/chrome/SKILL.md)** — Drive the user's real Chrome via the `mcp-chrome` extension-based MCP server. Reuse login state, manage tabs, history, bookmarks, and network. → [Marketplace](https://tryfractal.co/marketplace/chrome) · [SKILL.md](./skills/chrome/SKILL.md)
- **[computer-use](./skills/computer-use/SKILL.md)** — Control the local mouse, keyboard, and screen via `computer-use-mcp` for desktop GUI automation. → [Marketplace](https://tryfractal.co/marketplace/computer-use) · [SKILL.md](./skills/computer-use/SKILL.md)
- **[filesystem](./skills/filesystem/SKILL.md)** — Read, write, edit, search, move, and organize files on the local machine via the filesystem MCP server. → [Marketplace](https://tryfractal.co/marketplace/filesystem) · [SKILL.md](./skills/filesystem/SKILL.md)

</details>

<details>
<summary><b>Email & Communication</b></summary>

- **[resend](./skills/resend/SKILL.md)** — Full Resend email platform via the official MCP server. Send transactional and marketing email, manage contacts, broadcasts, domains, and webhooks. → [Marketplace](https://tryfractal.co/marketplace/resend) · [SKILL.md](./skills/resend/SKILL.md)
- **[mailgun](./skills/mailgun/SKILL.md)** — Email delivery platform for transactional email, inbound routing, deliverability tooling, domains, and suppressions. → [Marketplace](https://tryfractal.co/marketplace/mailgun) · [SKILL.md](./skills/mailgun/SKILL.md)
- **[twilio](./skills/twilio/SKILL.md)** — Communications API platform for SMS, voice, WhatsApp, email, and customer engagement. → [Marketplace](https://tryfractal.co/marketplace/twilio) · [SKILL.md](./skills/twilio/SKILL.md)
- **[slack](./skills/slack/SKILL.md)** — Team collaboration platform for channels, messages, threads, reactions, and users. → [Marketplace](https://tryfractal.co/marketplace/slack) · [SKILL.md](./skills/slack/SKILL.md)
- **[discord](./skills/discord/SKILL.md)** — Communication platform for communities. Manage guilds, channels, threads, messages, members, and moderation. → [Marketplace](https://tryfractal.co/marketplace/discord) · [SKILL.md](./skills/discord/SKILL.md)

</details>

<details>
<summary><b>Payments & Commerce</b></summary>

- **[stripe](./skills/stripe/SKILL.md)** — Payments platform for online payments, subscriptions, invoicing, Checkout, Connect, and financial operations. → [Marketplace](https://tryfractal.co/marketplace/stripe) · [SKILL.md](./skills/stripe/SKILL.md)
- **[shopify](./skills/shopify/SKILL.md)** — Commerce platform for online stores. Manage products, customers, orders, inventory, metafields, tags, and Admin GraphQL workflows. → [Marketplace](https://tryfractal.co/marketplace/shopify) · [SKILL.md](./skills/shopify/SKILL.md)
- **[coinmarketcap](./skills/coinmarketcap/SKILL.md)** — Cryptocurrency market data platform. Real-time quotes, listings, global metrics, technicals, and market intelligence. → [Marketplace](https://tryfractal.co/marketplace/coinmarketcap) · [SKILL.md](./skills/coinmarketcap/SKILL.md)

</details>

<details>
<summary><b>Developer Platforms</b></summary>

- **[github](./skills/github/SKILL.md)** — Developer platform for source code hosting, collaboration, and CI/CD. Manage repos, PRs, issues, Actions, releases, and code security. → [Marketplace](https://tryfractal.co/marketplace/github) · [SKILL.md](./skills/github/SKILL.md)
- **[gitlab](./skills/gitlab/SKILL.md)** — DevSecOps platform for projects, merge requests, issues, pipelines, and self-hosted GitLab instances. → [Marketplace](https://tryfractal.co/marketplace/gitlab) · [SKILL.md](./skills/gitlab/SKILL.md)
- **[linear](./skills/linear/SKILL.md)** — Issue tracking and product planning tool. Create and update issues, manage projects and cycles, and query roadmaps. → [Marketplace](https://tryfractal.co/marketplace/linear) · [SKILL.md](./skills/linear/SKILL.md)
- **[sentry](./skills/sentry/SKILL.md)** — Application monitoring and error tracking platform. Inspect issues, events, stacktraces, projects, and releases. → [Marketplace](https://tryfractal.co/marketplace/sentry) · [SKILL.md](./skills/sentry/SKILL.md)
- **[zapier](./skills/zapier/SKILL.md)** — Automation platform connecting 9000+ apps and 30000+ actions through the Zapier MCP server. → [Marketplace](https://tryfractal.co/marketplace/zapier) · [SKILL.md](./skills/zapier/SKILL.md)

</details>

<details>
<summary><b>Databases</b></summary>

- **[postgres](./skills/postgres/SKILL.md)** — Open-source relational database. Query tables, inspect schemas, and run read-only SQL. → [Marketplace](https://tryfractal.co/marketplace/postgres) · [SKILL.md](./skills/postgres/SKILL.md)
- **[mongodb](./skills/mongodb/SKILL.md)** — Document database platform. Find documents, run aggregations, inspect indexes, and manage Atlas clusters. → [Marketplace](https://tryfractal.co/marketplace/mongodb) · [SKILL.md](./skills/mongodb/SKILL.md)
- **[redis](./skills/redis/SKILL.md)** — In-memory data store. Manage keys, hashes, lists, sets, sorted sets, JSON, streams, and pub/sub. → [Marketplace](https://tryfractal.co/marketplace/redis) · [SKILL.md](./skills/redis/SKILL.md)
- **[neon](./skills/neon/SKILL.md)** — Serverless Postgres platform. Manage projects and branches, run SQL, and handle schema diffs and migrations. → [Marketplace](https://tryfractal.co/marketplace/neon) · [SKILL.md](./skills/neon/SKILL.md)
- **[supabase](./skills/supabase/SKILL.md)** — Open-source backend platform. Manage Postgres, auth, storage, edge functions, branching, and migrations. → [Marketplace](https://tryfractal.co/marketplace/supabase) · [SKILL.md](./skills/supabase/SKILL.md)

</details>

<details>
<summary><b>Vector & Search</b></summary>

- **[qdrant](./skills/qdrant/SKILL.md)** — Open-source vector database for semantic search and long-term memory workflows. → [Marketplace](https://tryfractal.co/marketplace/qdrant) · [SKILL.md](./skills/qdrant/SKILL.md)
- **[pinecone](./skills/pinecone/SKILL.md)** — Managed vector database for semantic search, retrieval, and indexed inference workflows. → [Marketplace](https://tryfractal.co/marketplace/pinecone) · [SKILL.md](./skills/pinecone/SKILL.md)
- **[algolia](./skills/algolia/SKILL.md)** — Hosted search and discovery platform. Manage indexes, records, ranking, and analytics. → [Marketplace](https://tryfractal.co/marketplace/algolia) · [SKILL.md](./skills/algolia/SKILL.md)
- **[meilisearch](./skills/meilisearch/SKILL.md)** — Open-source search engine. Manage indexes, documents, typo tolerance, and ranking settings. → [Marketplace](https://tryfractal.co/marketplace/meilisearch) · [SKILL.md](./skills/meilisearch/SKILL.md)
- **[upstash](./skills/upstash/SKILL.md)** — Serverless data platform for Redis, Vector, QStash, Workflows, and Upstash Box. → [Marketplace](https://tryfractal.co/marketplace/upstash) · [SKILL.md](./skills/upstash/SKILL.md)

</details>

<details>
<summary><b>Cloud & DevOps</b></summary>

- **[cloudflare](./skills/cloudflare/SKILL.md)** — Cloud platform for DNS, CDN, edge compute, security, storage, and developer services. → [Marketplace](https://tryfractal.co/marketplace/cloudflare) · [SKILL.md](./skills/cloudflare/SKILL.md)
- **[digitalocean](./skills/digitalocean/SKILL.md)** — Developer cloud for compute, databases, networking, Kubernetes, and storage. → [Marketplace](https://tryfractal.co/marketplace/digitalocean) · [SKILL.md](./skills/digitalocean/SKILL.md)

</details>

<details>
<summary><b>Productivity & Workspace</b></summary>

- **[notion](./skills/notion/SKILL.md)** — Workspace platform for docs, wikis, tasks, and knowledge management. → [Marketplace](https://tryfractal.co/marketplace/notion) · [SKILL.md](./skills/notion/SKILL.md)
- **[hubspot](./skills/hubspot/SKILL.md)** — CRM platform for sales, marketing, service, and operations. → [Marketplace](https://tryfractal.co/marketplace/hubspot) · [SKILL.md](./skills/hubspot/SKILL.md)
- **[airtable](./skills/airtable/SKILL.md)** — No-code relational database and collaboration platform for operational workflows. → [Marketplace](https://tryfractal.co/marketplace/airtable) · [SKILL.md](./skills/airtable/SKILL.md)
- **[bamboohr](./skills/bamboohr/SKILL.md)** — HR software for employee data, PTO, onboarding, and reporting. → [Marketplace](https://tryfractal.co/marketplace/bamboohr) · [SKILL.md](./skills/bamboohr/SKILL.md)

</details>

<details>
<summary><b>Marketing & Social Media</b></summary>

- **[instagram](./skills/instagram/SKILL.md)** — Post, message, analyze, and manage your Instagram account through the clinstagram CLI (Meta Graph API + instagrapi). → [Marketplace](https://tryfractal.co/marketplace/instagram) · [SKILL.md](./skills/instagram/SKILL.md)
- **[meta-ads](./skills/meta-ads/SKILL.md)** — Create, manage, and optimize Meta ad campaigns — from creative to conversion tracking to insights — via the official Meta Ads CLI. → [Marketplace](https://tryfractal.co/marketplace/meta-ads) · [SKILL.md](./skills/meta-ads/SKILL.md)

</details>

<details>
<summary><b>Analytics & BI</b></summary>

- **[metabase](./skills/metabase/SKILL.md)** — Open-source business intelligence platform for dashboards, questions, and SQL exploration. → [Marketplace](https://tryfractal.co/marketplace/metabase) · [SKILL.md](./skills/metabase/SKILL.md)

</details>

<details>
<summary><b>Web & Data</b></summary>

- **[firecrawl](./skills/firecrawl/SKILL.md)** — Web crawling and extraction platform for scraping, crawling, search, and change monitoring. → [Marketplace](https://tryfractal.co/marketplace/firecrawl) · [SKILL.md](./skills/firecrawl/SKILL.md)
- **[replicate](./skills/replicate/SKILL.md)** — Cloud platform to run and integrate machine learning models via API. → [Marketplace](https://tryfractal.co/marketplace/replicate) · [SKILL.md](./skills/replicate/SKILL.md)
- **[context7](./skills/context7/SKILL.md)** — Up-to-date, version-pinned documentation and code examples for any library or framework. → [Marketplace](https://tryfractal.co/marketplace/context7) · [SKILL.md](./skills/context7/SKILL.md)

</details>

<details>
<summary><b>Platform-Specific</b></summary>

- **[apple](./skills/apple/SKILL.md)** — Interact with native macOS apps via AppleScript through the apple-mcp server. → [Marketplace](https://tryfractal.co/marketplace/apple) · [SKILL.md](./skills/apple/SKILL.md)

</details>

[1.0.0]: https://github.com/tryfractal/registry/releases/tag/v1.0.0
