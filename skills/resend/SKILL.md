---
name: resend
description: >-
  Send transactional or marketing email, manage contacts, audiences,
  broadcasts, sender domains, API keys, and webhooks through the
  official Resend MCP server. Use this skill whenever the user wants to
  send a single email or a batch, schedule a send, attach files, set
  CC/BCC/reply-to/tags, read inbound email, create or update a contact,
  import contacts from CSV, create or run a broadcast campaign, verify
  or add a sender domain, manage topic subscriptions, manage custom
  contact properties, create or list API keys, or subscribe to webhook
  events. Triggers on phrases like "send an email with resend", "add
  this person to my contacts", "create a broadcast for the product
  launch", "verify my sending domain", "list my API keys", or any
  task involving the Resend email platform. Use this skill even when
  the user just says "send an email" and Resend is the workspace's
  email provider.
---

# Resend Skill

This skill wraps the **official Resend MCP server** (`resend-mcp` on npm). Resend is the modern transactional and marketing email API; the MCP server exposes the **full Resend platform** — emails, contacts, broadcasts, domains, segments, topics, contact properties, API keys, webhooks, and inbound email — as MCP tools the agent can call directly.

## Toolset

- `mcp` — `npx -y resend-mcp`, the official Resend MCP server. Runs over stdio by default, with the `RESEND_API_KEY` environment variable injected. Supports an optional HTTP transport for remote / web-based integrations.

## Prerequisites

Before the toolset can run, the workspace needs:

1. A **Resend account** with at least one **API key** (create one at <https://resend.com/api-keys>).
2. A **verified sending domain** (Resend rejects sends from unverified domains; configure at <https://resend.com/domains>).
3. The `RESEND_API_KEY` environment variable set to `re_xxxxxxxxx`.

If `RESEND_API_KEY` is not set the toolset will still start, but every authenticated call will fail at runtime — surface that error clearly to the user.

## Capabilities

The MCP server exposes a tool for every public Resend API. They cluster into the following groups:

| Group | What you can do |
|---|---|
| **Emails** | `send`, `list`, `get`, `cancel`, `update`, `batch send`. Supports HTML, plain text, local-file / URL / base64 attachments, CC, BCC, reply-to, scheduled delivery, tags, and topic-based sending. |
| **Received emails** | `list` and `read` inbound messages; `list` and `download` their attachments. |
| **Contacts** | `create`, `list`, `get`, `update`, `remove`. Manage segment memberships, topic subscriptions, and CSV contact imports. Custom contact properties are first-class. |
| **Broadcasts** | `create`, `send`, `list`, `get`, `update`, `remove`. Supports scheduling, personalization placeholders, and preview text. |
| **Domains** | `create`, `list`, `get`, `update`, `remove`, `verify`. Configure tracking, TLS, and sending / receiving capabilities. |
| **Segments** | `create`, `list`, `get`, `remove`. |
| **Topics** | `create`, `list`, `get`, `update`, `remove`. Subscription topics. |
| **Contact properties** | `create`, `list`, `get`, `update`, `remove`. Custom contact attributes (e.g. `plan`, `signup_date`). |
| **API keys** | `create`, `list`, `remove`. |
| **Webhooks** | `create`, `list`, `get`, `update`, `remove`. Subscribe to email events (`delivered`, `bounced`, `opened`, …). |
| **Contact imports** | `create-contact-import` (upload CSV), `get-contact-import` (status), `list-contact-imports` (history). |

The exact tool names and input shapes are auto-discovered by the Fractal toolset at load time — call `fractal toolsets get resend::mcp --tool <name>` to inspect the live schema before invoking anything non-trivial.

## Usage rules

- **Always confirm before sending.** `send` and `batch send` are not undoable. For transactional mail with a real recipient, show the rendered payload first and ask for an explicit go.
- **Use a verified sender.** Calls fail with a domain error if the `from` address is on an unverified domain. If the user hasn't set up DNS, point them at <https://resend.com/domains> first.
- **Honor topic subscriptions.** If a contact has unsubscribed from a topic, the send will be suppressed — surface that as a normal outcome, not a failure.
- **Schedule deliberately.** Scheduled sends can be `cancel`-ed but not edited. For complex drip campaigns use a Broadcast or an external scheduler.
- **Redact PII from logs.** Resend returns full email bodies. The skill should not echo complete message bodies to disk or chat unless the user explicitly asked to see them.
- **Respect rate limits.** `batch send` accepts arrays but Resend's per-second quota still applies. For >1000 recipients, prefer a Broadcast.
- **Test sends go to the account owner only.** Resend's `onboarding@resend.dev` sender is for the API key owner — never use it for production mail.

## Configuration

### Stdio (default — used by this toolset)

```json
{
  "mcpServers": {
    "resend": {
      "command": "npx",
      "args": ["-y", "resend-mcp"],
      "env": { "RESEND_API_KEY": "re_xxxxxxxxx" }
    }
  }
}
```

Optional environment variables:

| Variable | Effect |
|---|---|
| `RESEND_API_KEY` | Required. The API key used for every call. |
| `SENDER_EMAIL_ADDRESS` | Default `from:` address when the tool call omits one. Saves the user from being prompted each time. |
| `REPLY_TO_EMAIL_ADDRESSES` | Comma-separated default `reply-to` addresses. |

### HTTP transport (optional)

If you need the server reachable over HTTP (e.g. for web-based MCP clients), run it standalone and connect by URL:

```bash
npx -y resend-mcp --http --port 3000   # listens on http://127.0.0.1:3000/mcp
```

Clients authenticate with the API key in the `Authorization: Bearer re_…` header. The Fractal toolset would need its `withConnection` swapped to `mcp-server::http` to use this mode.

### Local development build

Clone <https://github.com/resend/resend-mcp>, run `pnpm install && pnpm run build`, and replace the `npx` command in the toolset args with `node <repo>/dist/index.js`.

## References

- Upstream docs: <https://resend.com/docs/mcp-server>
- Server source: <https://github.com/resend/resend-mcp>
- npm package: <https://www.npmjs.com/package/resend-mcp>
- Resend API reference: <https://resend.com/docs/api-reference>
- License: MIT
