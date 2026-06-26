---
name: stripe
description: >-
  Drive the Stripe payments platform — customers, charges, subscriptions,
  invoices, refunds, Checkout, products, prices, payouts, balances,
  disputes, and connected accounts — through the official Stripe MCP server.
  Use this skill when the user wants to create or update a customer, charge
  a card, refund, set up a subscription, generate an invoice, build a
  Checkout session, manage products and prices, reconcile balances, issue
  payouts, or respond to disputes. Triggers on phrases like "create a
  Stripe customer", "charge $49.99", "set up a subscription", "create a
  Checkout session", "make a payment link", "what's my balance", "issue
  a payout", "respond to this dispute", or any request involving Stripe
  payments or subscriptions. Use this skill even if the user just says
  "use Stripe" or asks how to accept payments online.
---

# Stripe Skill

This skill exposes the official **Stripe Model Context Protocol (MCP) server** (`@stripe/mcp`) as a single Fractal toolset. The server lets the agent read, write, and search the full Stripe API — payments, subscriptions, billing, Connect, reporting, and the Stripe knowledge base — without hand-crafting HTTP calls or juggling REST endpoints.

The server has two run modes:

- **Hosted** — `https://mcp.stripe.com` (OAuth; no local process).
- **Local** — `npx -y @stripe/mcp --api-key=$STRIPE_SECRET_KEY` (stdio; what this toolset launches by default).

## Toolset

- `mcp` — Stripe MCP server (`@stripe/mcp@latest`). Authenticates with a Stripe **Restricted API Key (RAK)** so the toolset can only perform the actions you explicitly allow. Same tool surface as the hosted server, but reachable from any environment (CI, sandbox, behind a firewall) without opening outbound OAuth.

## API tools (always available)

| Tool | What it does |
|---|---|
| `stripe_api_search` | Search for Stripe API methods by keyword. |
| `stripe_api_details` | Get detailed parameter information for a specific Stripe API method. |
| `stripe_api_read` | Read data with any Stripe API `GET` method. |
| `stripe_api_write` | Write data with any Stripe API `POST`, `PATCH`, `PUT`, and `DELETE` method. |

## Account

| Tool | What it does |
|---|---|
| `get_stripe_account_info` | Retrieve the authenticated account (display name, country, default currency, capabilities, branding, etc.). |

## Refunds

| Tool | What it does |
|---|---|
| `create_refund` | Create a refund for a charge or payment intent, with optional reason, amount, and metadata. |

## Search & fetch

| Tool | What it does |
|---|---|
| `search_stripe_resources` | Search Stripe resources (customers, charges, subscriptions, invoices, etc.) by free-text query. |
| `fetch_stripe_resources` | Fetch a single Stripe object by ID. |

## Documentation & guidance

| Tool | What it does |
|---|---|
| `search_stripe_documentation` | Search the Stripe documentation and knowledge base (docs, support articles) for the given question, optionally filtered by language. |
| `stripe_implementation_planner` | Guide the user through Stripe products to help them accept payments, sell online, set up billing, or build any Stripe integration. |
| `send_stripe_mcp_feedback` | Submit feedback from the user or agent about the Stripe MCP server tools. |
| `stripe_report` | Search, retrieve, and create financial reports and report runs. |

## Usage rules

- **Use a Restricted API Key (RAK), never a full secret key.** Generate a RAK at `https://dashboard.stripe.com/apikeys` with only the resources the agent needs (e.g. `Customers: read/write`, `Charges: read`, `Refunds: write`). Full secret keys have account-wide power and should not be pasted into agent runtimes.
- **Prefer the typed tools over raw `stripe_api_write`** when they exist (`create_refund`, `get_stripe_account_info`, etc.). The typed tools validate parameters and return structured results; `stripe_api_write` is the escape hatch for the rest of the API.
- **Confirm before any money-moving action.** Charges, refunds, payouts, and subscription cancellations should always include a clear human-readable description and be gated by a confirmation step in your client. Stripe operations are not reversible from the agent side.
- **Look up the API first, write second.** For any non-trivial call, call `stripe_api_search` → `stripe_api_details` to confirm the exact endpoint, required parameters, and idempotency requirements before calling `stripe_api_read` or `stripe_api_write`.
- **Use idempotency keys for writes that may be retried.** Pass an `idempotency_key` for charge, refund, and payout writes to prevent double-spend on network retries.
- **For Connect platforms, target a connected account explicitly.** Pass the `--stripe-account=acct_xxxxxxxxx` flag in the toolset `args`, or include a `Stripe-Account: acct_xxx` header. Restricted keys for connected accounts must have the appropriate Connect permissions enabled.
- **Never log or echo the API key.** Treat `$STRIPE_SECRET_KEY` like any other secret — read it from env, never from chat history or tool output. Rotate immediately if it leaks.
- **Don't confuse test mode with live mode.** Keys prefixed `sk_test_` and `pk_test_` hit the sandbox and never move real money; `sk_live_` / `pk_live_` hit production. The agent must confirm with the user which environment the current key targets before performing a write.

## Connection arguments

The toolset launches the Stripe MCP server locally via stdio. The most common flags:

| Flag | Purpose |
|---|---|
| `--api-key=<sk_…>` | Stripe secret key (or Restricted API Key). Overrides the `STRIPE_SECRET_KEY` env var. |
| `--stripe-account=acct_…` | Make all calls as this connected account (Connect platforms only). |
| `--tools=<list>` | Restrict the toolset to a subset of the published tools. |
| `--tools-readonly` | Expose only read-only tools. Useful for analysis / reporting agents. |
| `--enable-tools=<list>` | Force-enable specific tools that are otherwise off by default. |
| `--disable-tools=<list>` | Force-disable specific tools. |

## Environment variables

| Variable | Purpose |
|---|---|
| `STRIPE_SECRET_KEY` | Default Stripe secret / Restricted API key. The toolset passes this to the server as `--api-key`. |
| `STRIPE_CONNECTED_ACCOUNT` | Optional. Connected-account ID (`acct_…`) for Connect platforms. |

## Hosted (remote) server

If you prefer not to run a local process, point the toolset at Stripe's hosted MCP endpoint instead:

```json
{
  "mcpServers": {
    "stripe": {
      "url": "https://mcp.stripe.com"
    }
  }
}
```

The hosted server uses OAuth and is reachable from any environment with outbound HTTPS.

## Supported API methods

Because `stripe_api_read` and `stripe_api_write` proxy to any Stripe REST endpoint, the effective surface is the **entire Stripe API** — customers, charges, payment intents, setup intents, payment methods, subscriptions, subscription items, schedules, invoices, invoice items, products, prices, coupons, promotion codes, discounts, tax rates, tax codes, checkout sessions, payment links, terminal readers, terminal locations, Connect accounts, account links, transfers, payouts, balance, balance transactions, top-ups, disputes, radar, reviews, payment intents, sources, tokens, tokens, webhooks, webhook endpoints, events, files, file links, mandates, payment-method domains, treasury, issuing cards, Climate orders, and more.

For the current exhaustive list, see `https://docs.stripe.com/api`.

## Treasury (agentic finance)

With explicit opt-in, the Stripe MCP server can be extended with **Treasury** tools that let the agent move money, pay bills, and create and manage cards (FinancialAccount, ReceivedCredit, OutboundPayment, OutboundTransfer, Issuing cards). Treasury access is gated by Stripe — request access from the dashboard and configure the relevant Restricted API Key scopes before enabling the corresponding tools.

## Security notes

- The Stripe MCP server is **not a security boundary**. A malicious prompt can still instruct the agent to call `stripe_api_write` with attacker-controlled parameters. The real control is which RAK you issue and which scopes it carries.
- Always enable **human confirmation** of write tools in your MCP client. Stripe explicitly recommends it to mitigate prompt-injection attacks, especially when the Stripe MCP shares a context with other servers.
- Rotate the API key if it ever appears in logs, screenshots, or chat history. Treat any `sk_*` value as production-credential equivalent.

## References

- Upstream docs: <https://docs.stripe.com/mcp>
- npm package: <https://www.npmjs.com/package/@stripe/mcp>
- Source repository: <https://github.com/stripe/ai>
- API reference: <https://docs.stripe.com/api>
- OpenAPI spec: <https://github.com/stripe/openapi>
- License: MIT
