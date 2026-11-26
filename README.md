# Fractal Registry

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Marketplace](https://img.shields.io/badge/Marketplace-tryfractal.co-blue)](https://tryfractal.co/marketplace)
[![AGENTS.md](https://img.shields.io/badge/Agent-Ready-purple)](./AGENTS.md)

The **official registry of skills** for the [Fractal](https://tryfractal.co).

A skill in Fractal is more than a prompt. It can ship a `SKILL.md`, instructions, agents, toolsets, collections, views, hooks, templates, artifacts, goals, and routines. Installing a skill makes the system adapt to the user's domain — and, in many cases, replaces a third-party application with a personalized version that lives entirely inside the user's workspace. Browse the public catalog at **[tryfractal.co/marketplace](https://tryfractal.co/marketplace)** for the full skill card, logo, and install details. This README stays intentionally high-level and points to the marketplace for the canonical per-skill documentation.

---

## ✨ What lives here

| Skill | Description | Author |
|---|---|---|
| [`fractal`](./skills/fractal/) | The core Fractal OS skill — bootstraps every agent with the full operating system. | [Fractal](https://tryfractal.co) |
| [`playwright`](./skills/playwright/) | Browser automation powered by the official Microsoft Playwright MCP server — navigate, click, fill forms, scrape, mock network, run e2e. | [Fractal](https://tryfractal.co) |
| [`chrome`](./skills/chrome/) | Drive the user's real Chrome via the mcp-chrome extension MCP server — reuse login state, manage tabs, history, bookmarks, network. | [Fractal](https://tryfractal.co) |
| [`context7`](./skills/context7/) | Look up up-to-date, version-pinned documentation for any library via Context7 MCP. | [Fractal](https://tryfractal.co) |
| [`apple`](./skills/apple/) | Control native macOS apps — Messages, Mail, Notes, Calendar, Reminders, Contacts, Maps — via AppleScript through the apple-mcp server. | [Fractal](https://tryfractal.co) |
| [`resend`](./skills/resend/) | Full Resend email platform via the official resend-mcp server — send email, manage contacts, broadcasts, domains, webhooks. | [Fractal](https://tryfractal.co) |
| [`computer-use`](./skills/computer-use/) | Drive the local computer's mouse, keyboard, and screen via computer-use-mcp — a near-clone of Anthropic's Computer Use API. | [Fractal](https://tryfractal.co) |
| [`stripe`](./skills/stripe/) | Payments platform — customers, charges, subscriptions, invoices, Checkout, Connect. | [Fractal](https://tryfractal.co) |
| [`shopify`](./skills/shopify/) | Full store management — products, customers, orders, inventory, metafields, tags. | [Fractal](https://tryfractal.co) |
| [`coinmarketcap`](./skills/coinmarketcap/) | Crypto market data — quotes, listings, global metrics, exchange info. | [Fractal](https://tryfractal.co) |
| [`github`](./skills/github/) | Repos, PRs, issues, Actions, code security, releases. | [Fractal](https://tryfractal.co) |
| [`gitlab`](./skills/gitlab/) | MRs, issues, pipelines, projects (also self-hosted). | [Fractal](https://tryfractal.co) |
| [`linear`](./skills/linear/) | Issues, projects, cycles, comments, roadmaps. | [Fractal](https://tryfractal.co) |
| [`sentry`](./skills/sentry/) | Error tracking, issues, events, projects, releases. | [Fractal](https://tryfractal.co) |
| [`postgres`](./skills/postgres/) | Query any Postgres database — read SQL, inspect schema, run statements. | [Fractal](https://tryfractal.co) |
| [`mongodb`](./skills/mongodb/) | Query Atlas or local MongoDB — find, aggregate, list collections, indexes. | [Fractal](https://tryfractal.co) |
| [`redis`](./skills/redis/) | Keys, hashes, lists, sets, sorted sets, JSON, streams, pub/sub. | [Fractal](https://tryfractal.co) |
| [`neon`](./skills/neon/) | Serverless Postgres — projects, branches, run SQL, schema diffs, migrations. | [Fractal](https://tryfractal.co) |
| [`supabase`](./skills/supabase/) | Postgres, Auth, Storage, Edge Functions, branching, migrations. | [Fractal](https://tryfractal.co) |
| [`qdrant`](./skills/qdrant/) | Long-term semantic memory — store and recall free-form text. | [Fractal](https://tryfractal.co) |
| [`pinecone`](./skills/pinecone/) | Managed vector search — upsert, search, list indexes, integrated inference. | [Fractal](https://tryfractal.co) |
| [`meilisearch`](./skills/meilisearch/) | Typo-tolerant full-text search — indexes, documents, settings. | [Fractal](https://tryfractal.co) |
| [`algolia`](./skills/algolia/) | Hosted search & discovery — search, index management, analytics. | [Fractal](https://tryfractal.co) |
| [`upstash`](./skills/upstash/) | Serverless Redis, Vector, QStash, Workflows, Upstash Box. | [Fractal](https://tryfractal.co) |
| [`cloudflare`](./skills/cloudflare/) | Workers, KV, R2, D1, DNS, Pages, Analytics, security. | [Fractal](https://tryfractal.co) |
| [`digitalocean`](./skills/digitalocean/) | Droplets, apps, databases, networking, Kubernetes, storage. | [Fractal](https://tryfractal.co) |
| [`notion`](./skills/notion/) | Pages, blocks, data sources, comments, queries, Markdown export. | [Fractal](https://tryfractal.co) |
| [`hubspot`](./skills/hubspot/) | Contacts, companies, deals, tickets, engagements, marketing. | [Fractal](https://tryfractal.co) |
| [`airtable`](./skills/airtable/) | Bases, tables, records, fields, comments, schema mutation. | [Fractal](https://tryfractal.co) |
| [`metabase`](./skills/metabase/) | Questions, dashboards, databases, run SQL, cards, collections. | [Fractal](https://tryfractal.co) |
| [`bamboohr`](./skills/bamboohr/) | Employees, PTO, time off, onboarding, reporting. | [Fractal](https://tryfractal.co) |
| [`slack`](./skills/slack/) | Channels, messages, threads, reactions, users, search. | [Fractal](https://tryfractal.co) |
| [`discord`](./skills/discord/) | Guilds, channels, messages, threads, members, moderation. | [Fractal](https://tryfractal.co) |
| [`twilio`](./skills/twilio/) | SMS, voice, WhatsApp, Verify, email, TwiML, Studio, conversations. | [Fractal](https://tryfractal.co) |
| [`mailgun`](./skills/mailgun/) | Transactional email, deliverability, events, domains, suppressions. | [Fractal](https://tryfractal.co) |
| [`firecrawl`](./skills/firecrawl/) | Web crawl, scrape, extract, map, search, batch, monitor. | [Fractal](https://tryfractal.co) |
| [`replicate`](./skills/replicate/) | Run ML models on Replicate — image gen, LLMs, audio, video, fine-tuned. | [Fractal](https://tryfractal.co) |
| [`filesystem`](./skills/filesystem/) | Sandboxed file read, write, edit, search, tree, and directory management via MCP. | [Fractal](https://tryfractal.co) |
| [`zapier`](./skills/zapier/) | Connect to 9000+ apps and 30000+ actions via the Zapier MCP server. | [Fractal](https://tryfractal.co) |

This table highlights selected skills. Browse the [marketplace](https://tryfractal.co/marketplace) for the complete catalog, including the new service integrations. The registry is open to **anyone** who wants to publish a skill — a developer, a marketing agency, a freelancer, a creator, a small business owner, or anyone else. See [`AGENTS.md`](./AGENTS.md) for end-to-end worked examples covering very different kinds of users.

---

## 🚀 Quick start

### Use a skill

```bash
# Install the Fractal CLI
npm install -g @fractal-os/cli

# Install any skill from the registry
fractal skills install --source tryfractal/registry --skill fractal
```

That's it. The skill is now active in your workspace.

### Browse the marketplace

Visit **[tryfractal.co/marketplace](https://tryfractal.co/marketplace)** to filter by category, search by keyword, and click into a skill to see screenshots, default prompts, and the install command.

### Build your own skill

A skill can be as small as a tone of voice for the agent, or as large as a full app replacing a third-party SaaS. See [`CONTRIBUTING.md`](./.github/CONTRIBUTING.md) for the end-to-end guide. The short version:

1. Fork this repo.
2. Create `skills/<your-skill>/` with `SKILL.md` + `.fractal/manifest.json` (and any optional subfolders — collections, views, toolsets, artifacts, etc.).
3. Open a PR using the **New skill submission** issue template.
4. Wait for the Fractal team to review and merge.

The marketplace picks up your skill within minutes of merge. The Fractal Plugin SDK (`@fractal-os/plugin`) is installed at the workspace level — skills are source-only and do not include a `package.json`.

---

## 🗂 Repository layout

```
registry/
├── README.md                 ← you are here
├── AGENTS.md                 ← operational manual for human + AI agents
├── CHANGELOG.md              ← registry-level changes
├── LICENSE                   ← MIT
├── .github/                  ← community health files
│   ├── CONTRIBUTING.md
│   ├── CODE_OF_CONDUCT.md
│   ├── SECURITY.md
│   ├── PULL_REQUEST_TEMPLATE.md
│   ├── CODEOWNERS
│   └── ISSUE_TEMPLATE/       (7 issue templates)
└── skills/                   ← every skill lives here
    ├── fractal/
    │   ├── SKILL.md
    │   └── .fractal/manifest.json
    └── playwright/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for Playwright)
    └── chrome/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for mcp-chrome)
    └── context7/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for Context7)
    └── resend/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for resend-mcp)
    └── computer-use/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for computer-use-mcp)
    └── filesystem/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for filesystem)
    └── zapier/
        ├── SKILL.md
        ├── .fractal/manifest.json
        └── toolsets/mcp/                        (MCP toolset for Zapier)
    └── (additional registry skills — see the marketplace)
```

Each skill is a self-contained folder. Mandatory files: `SKILL.md` + `.fractal/manifest.json`. Optional subfolders: `references/`, `toolsets/`, `templates/`, `instructions/`, `collections/`, `views/`, `agents/`, `hooks/`, `artifacts/`, `goals/`, `routines/`, `assets/`. Skills never include a `package.json` — the Plugin SDK is installed at the workspace level. See [`AGENTS.md`](./AGENTS.md) for the full reference.

---

## 🤝 Contributing

We welcome contributions of any size — bug reports, doc fixes, new skills, skill updates. Read **[CONTRIBUTING.md](./.github/CONTRIBUTING.md)** first. By contributing, you agree to the [Code of Conduct](./.github/CODE_OF_CONDUCT.md).

For **security issues**, **do not open a public issue**. Follow the [Security policy](./.github/SECURITY.md) and email `team@tryfractal.co`.

---

## 🔌 Quick Links

- **[Fractal](https://tryfractal.co)** — the Organic Operating System
- **[@fractal-os/cli](https://www.npmjs.com/package/@fractal-os/cli)** — install Fractal globally
- **[@fractal-os/plugin](https://www.npmjs.com/package/@fractal-os/plugin)** — the official Plugin SDK for building skills
- **[Marketplace](https://tryfractal.co/marketplace)** — browse the public catalog
- **[Our manifest](https://tryfractal.co/blog/organic-computing)** — the vision behind the Fractal

---

## 📜 License

[MIT](./LICENSE) — see [`LICENSE`](./LICENSE) for the full text.

Each skill can declare its own license in its `.fractal/manifest.json`. By default, contributions are MIT.

---

## 🛟 Maintainers

The **Fractal team** maintains this registry. Tag `@tryfractal/fractal-team` in issues / PRs for visibility.

- For questions, open a Discussion or join the [Fractal Discord](https://discord.gg/tryfractal).
- For security, email `team@tryfractal.co` (see [`SECURITY.md`](./.github/SECURITY.md)).
