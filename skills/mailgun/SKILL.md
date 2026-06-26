---
name: mailgun
description: >-
  Send, route, and analyze email through Mailgun's transactional email
  delivery platform via the official mailgun-mcp-server. Use this skill when
  the user wants to send an email, deliver a transactional message (welcome,
  password reset, receipt, notification, OTP, alert), look up a stored
  message, resend a message, list domains, check domain DNS verification,
  inspect or update tracking settings, manage mailing lists, create or update
  email templates, query sending analytics, review bounces, unsubscribes, and
  complaints (suppressions), inspect dedicated IPs, classify bounce types,
  manage event webhooks, or update inbound email routing rules. Triggers on
  phrases like "send this email", "fire off a welcome email", "show me
  delivery stats", "verify the DNS for mg.example.com", "list my Mailgun
  domains", "create a webhook", "resend message abc123", "set up an
  inbound route", or any task involving transactional email or
  deliverability diagnostics.
---

# Mailgun Skill

This skill exposes the official **`mailgun-mcp-server`** (`@mailgun/mcp-server`, published by Mailgun) as a single Fractal toolset. It gives the agent a workflow-oriented interface for sending email, diagnosing deliverability, and managing domains, templates, mailing lists, webhooks, and inbound routes — all backed by Mailgun's REST API.

The MCP server runs locally and authenticates with a Mailgun API key passed as an environment variable. It never exposes the key to the model; the key is only read by the server process when calling the Mailgun API over HTTPS.

## Toolset

- `mcp` — Mailgun MCP server (`@mailgun/mcp-server`, Apache 2.0). Connects via `stdio`, scopes the registered tools to one or more product tags (`send`, `validate`, `optimize`, `inspect`), and targets either the US or EU Mailgun region.

## Core capabilities

The Mailgun MCP server organizes its surface into the following capability groups. Tools are tagged with one or more product tags and can be filtered via `--tags` (CLI) or `MAILGUN_MCP_TAGS` (env).

| Group | What it covers | Typical tag |
|---|---|---|
| Messaging | Send emails, retrieve stored messages, resend messages | `send` |
| Domains | View domain details, verify DNS configuration, manage click / open / unsubscribe tracking | `send` / `inspect` |
| Webhooks | List, create, update, and delete event webhooks | `inspect` |
| Routes | View and update inbound email routing rules | `inspect` |
| Mailing Lists | Create and manage mailing lists and their members | `send` |
| Templates | Create and manage versioned email templates | `send` |
| Analytics | Query sending metrics, usage metrics, and per-message logs | `inspect` |
| Stats | Aggregate statistics by domain, tag, provider, device, country | `inspect` |
| Suppressions | View bounces, unsubscribes, complaints, and allowlist entries | `inspect` / `validate` |
| IPs & IP Pools | View IP assignments and dedicated IP pool configuration | `inspect` |
| Bounce Classification | Analyze bounce types and delivery issues | `validate` |

Run `--list-tags` on the server binary to print the active tag set, or `--help` for the full flag reference. Unknown tags are rejected at startup with a clear error.

## Common tool names

The tool names below follow Mailgun's `verb_noun` convention. Always introspect the live toolset to get the exact set registered for the configured tags — names may evolve as the server adds endpoints.

| Tool | What it does |
|---|---|
| `mailgun_send_email` | Send a transactional or bulk email through a verified sending domain. |
| `mailgun_get_message` | Retrieve a stored message by its Mailgun message ID. |
| `mailgun_resend_message` | Resend a previously sent message to the same or a different recipient set. |
| `mailgun_list_domains` | List all domains on the account, with verification status. |
| `mailgun_get_domain` | Get a single domain's configuration and DNS verification state. |
| `mailgun_update_domain_tracking` | Toggle click, open, and unsubscribe tracking on a domain. |
| `mailgun_list_webhooks` | List event webhooks for a domain. |
| `mailgun_create_webhook` | Register a new event webhook (delivered, opened, bounced, complained, etc.). |
| `mailgun_update_webhook` | Update an existing webhook's URL or event types. |
| `mailgun_delete_webhook` | Delete an event webhook. |
| `mailgun_list_routes` | List inbound email routing rules. |
| `mailgun_update_route` | Update an existing inbound route's expression or actions. |
| `mailgun_list_mailing_lists` | List all mailing lists on a domain. |
| `mailgun_create_mailing_list` | Create a new mailing list. |
| `mailgun_list_mailing_list_members` | List members of a mailing list. |
| `mailgun_add_mailing_list_members` | Add members to a mailing list. |
| `mailgun_list_templates` | List versioned email templates. |
| `mailgun_create_template` | Create a new versioned email template. |
| `mailgun_update_template` | Update an existing template (creates a new version). |
| `mailgun_get_stats` | Get aggregate sending stats, filterable by domain, tag, provider, device, country. |
| `mailgun_get_logs` | Query per-message delivery logs and events. |
| `mailgun_list_bounces` | List bounced recipients for a domain. |
| `mailgun_list_unsubscribes` | List recipients who unsubscribed. |
| `mailgun_list_complaints` | List spam complaint recipients. |
| `mailgun_list_allowlist` | List allowlisted recipients (bypass suppression). |
| `mailgun_classify_bounce` | Classify a bounce response (hard / soft / block / etc.). |
| `mailgun_list_ips` | List dedicated IP addresses assigned to the account. |
| `mailgun_list_ip_pools` | List dedicated IP pool configuration. |

The exact tool name, required parameters, and return shape for each are discoverable at runtime via the MCP `tools/list` method.

## Usage rules

- **Pass the API key as an environment variable, never in tool arguments.** The `MAILGUN_API_KEY` env var is read by the server process only; never paste the key into a `to`, `from`, or body field.
- **Use a dedicated sending domain per environment.** Configure a separate domain for production, staging, and dev, and prefer the `postmaster@<domain>` sender when sending ad-hoc mail. Sending from an unverified domain will hard-fail.
- **Verify DNS before sending.** Call the domain-verification tool first; sending from a domain with missing SPF / DKIM / MX records will be throttled or rejected by recipient providers.
- **Scope tags to the task.** Set `MAILGUN_MCP_TAGS` to expose only the tools you need. For a workflow that only needs to validate addresses, set `validate`; for one that only inspects logs, set `inspect`. The CLI flag `--tags` wins over the env var when both are set.
- **Choose the right region.** Set `MAILGUN_API_REGION=eu` for EU-resident data residency. Mixing US and EU regions in one workflow causes unnecessary latency and may violate data-residency requirements.
- **Read before write.** Always call the corresponding list / get tool before mutating a webhook, route, template, or mailing list. The server exposes reads and updates freely, but mutations are visible immediately to live traffic.
- **Never expose the API key in logs, prompt bodies, or commit messages.** If a key leaks, rotate it from the Mailgun dashboard.
- **Use a dedicated API key with the minimum required scope.** Create a separate key per agent / workflow and revoke it when decommissioned.

## Connection arguments

The toolset launches the server with `npx -y @mailgun/mcp-server`. The launch arguments and env vars are configurable on the toolset's `withConnection({...})` block.

| Setting | Default | Purpose |
|---|---|---|
| `MAILGUN_API_KEY` | — (required) | Mailgun API key. Read by the server, never exposed to the model. |
| `MAILGUN_API_REGION` | `us` | API region: `us` or `eu`. |
| `MAILGUN_MCP_TAGS` | (all) | Comma-separated product tags to enable. Equivalent to `--tags`. CLI flag wins. |
| `--tags <list>` | — | Same as the env var but supplied as an MCP arg. Useful for one-off tag filtering. |
| `--list-tags` | — | Print supported tag values and exit. |
| `--help` | — | Print full CLI usage and exit. |

Valid `MAILGUN_MCP_TAGS` values today: `send`, `validate`, `optimize`, `inspect`. Filtering is OR-semantics — a tool is registered if **any** of its tags appears in the active set. When unspecified, every tool is registered.

### CLI launch form

```jsonc
{
  "mcpServers": {
    "mailgun": {
      "command": "npx",
      "args": ["-y", "@mailgun/mcp-server"],
      "env": {
        "MAILGUN_API_KEY": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        "MAILGUN_API_REGION": "us"
      }
    }
  }
}
```

### Tag-scoped form (logs / validation only)

```jsonc
{
  "mcpServers": {
    "mailgun": {
      "command": "npx",
      "args": ["-y", "@mailgun/mcp-server", "--tags", "validate,inspect"],
      "env": {
        "MAILGUN_API_KEY": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

## Security notes

- **The API key never reaches the model.** It is consumed by the MCP server process; tool arguments and responses are filtered to omit credential material. The server does not log API keys, request parameters, or response bodies.
- **Local execution only.** The server runs as a local stdio process. All Mailgun API calls go over HTTPS with TLS validation enforced. No third-party services see message content beyond Mailgun itself.
- **The server exposes no delete operations.** Read and update paths only — which limits the blast radius of a confused-deputy attack via a crafted prompt.
- **Rate limiting is server-side only.** Each tool call from the model translates directly into a Mailgun API request. Mailgun enforces per-account rate limits; throttled requests return an error to the agent.
- **Prompt injection surface.** As with any MCP server, a malicious prompt can trick the agent into calling a write tool. Always confirm sensitive mutations (template publishes, webhook URL changes, mailing-list bulk adds) before the agent calls them.
- **Webhook URLs are passed through unvalidated.** The server forwards arbitrary URLs to Mailgun as webhook destinations. Ensure the agent never sets a webhook URL to an internal or sensitive address.

## Troubleshooting

- **"API key not set" / `401 Unauthorized`** — `MAILGUN_API_KEY` is missing, empty, or revoked. Generate a new key in the Mailgun dashboard and update the env var.
- **"Unknown tag"** — A value in `MAILGUN_MCP_TAGS` or `--tags` is not in the server's allowlist. Run `--list-tags` to see the current set.
- **Empty results from list tools** — Most list endpoints require a `domain` parameter. Confirm the domain exists and is verified with `mailgun_list_domains` first.
- **Send silently fails** — Some MCP clients require a paid plan to invoke tools that write to external systems. Check the client's tool-call approval policy.
- **Region mismatch** — A key from `us` will not work against `eu` endpoints, and vice versa. Set `MAILGUN_API_REGION` to match the key's region.

## References

- Upstream MCP server: <https://github.com/mailgun/mailgun-mcp-server>
- npm package: <https://www.npmjs.com/package/@mailgun/mcp-server>
- Mailgun documentation: <https://documentation.mailgun.com/>
- Mailgun REST API reference: <https://documentation.mailgun.com/docs/mailgun/api-reference/send/mailgun/openapi-final>
- License: Apache 2.0
