---
name: composio
description: >-
  Connect the agent to 1,000+ apps (Gmail, Slack, GitHub, Notion, Linear,
  Google Calendar, HubSpot, Jira, Stripe and more) through the Composio Tool
  Router MCP server, with managed authentication, just-in-time tool discovery
  and sandboxed execution. Use this skill when the user wants to act on an
  external app or service — send an email, create an issue, post a message,
  update a CRM record, read a calendar, search docs — without writing API code,
  or asks to connect, link or re-authorize an app account. Triggers on "send an
  email", "create a GitHub issue", "post to Slack", "add to Notion", "connect my
  Gmail", "which apps are connected", or any cross-app workflow. Requires
  COMPOSIO_API_KEY.
---

# Composio Skill

[Composio](https://composio.dev) is an integration layer for agents: **1,000+ toolkits (apps), managed OAuth/API-key auth, tool discovery by intent, and sandboxed execution**. This skill connects the agent to it through the **Tool Router MCP server**, so it can work in the user's apps without one integration per app.

## Toolset

- `mcp` — Composio MCP server at `https://connect.composio.dev/mcp` (Streamable HTTP). Authenticates with the account API key sent in the `x-consumer-api-key` header, so the MCP itself needs no OAuth. The URL is fixed; the only variable is `COMPOSIO_API_KEY`.

## Setup

1. Copy your API key from the Composio dashboard (Settings → Sessions & API Key).
2. Add it to the workspace `.env` (or `~/.fractal/.env`) — Fractal resolves the `${COMPOSIO_API_KEY}` header placeholder from there or from the process environment:

```bash
COMPOSIO_API_KEY=<YOUR_COMPOSIO_API_KEY>
```

MCP clients can authenticate either with that key in the `x-consumer-api-key` header or with OAuth; this skill uses the header. App accounts (Gmail, Slack, GitHub…) are authorized separately, once, through a link the agent requests with `COMPOSIO_MANAGE_CONNECTIONS`.

Manual MCP client config (Claude Code, Cursor, etc.):

```bash
claude mcp add --transport http composio https://connect.composio.dev/mcp --header "x-consumer-api-key: $COMPOSIO_API_KEY"
```

## Workflow (always in this order)

1. **Discover** — `COMPOSIO_SEARCH_TOOLS` with the task in natural language.
2. **Connect** — `COMPOSIO_MANAGE_CONNECTIONS`; if not linked, share the auth link and `COMPOSIO_WAIT_FOR_CONNECTIONS`.
3. **Inspect** — `COMPOSIO_GET_TOOL_SCHEMAS` for the exact inputs.
4. **Execute** — `COMPOSIO_MULTI_EXECUTE_TOOL` (batch independent calls in one request).
5. **Report** — say what happened with ids/links; surface errors verbatim with the next fix.

## Tool Router meta-tools

| Tool | Purpose |
|---|---|
| `COMPOSIO_SEARCH_TOOLS` | Find tools and a suggested plan for a use case |
| `COMPOSIO_GET_TOOL_SCHEMAS` | Exact input schema for specific tool slugs |
| `COMPOSIO_MANAGE_CONNECTIONS` | Check/create app connections, returns auth links |
| `COMPOSIO_WAIT_FOR_CONNECTIONS` | Wait until the user finishes authorizing |
| `COMPOSIO_MULTI_EXECUTE_TOOL` | Run one or many tools in parallel |
| `COMPOSIO_REMOTE_WORKBENCH` / `COMPOSIO_REMOTE_BASH_TOOL` | Sandboxed Python/bash for bulk or large-output processing |
| `COMPOSIO_PROXY_EXECUTE` | Raw authenticated call to an app's API when no tool fits |
| `COMPOSIO_SEARCH_SKILLS` / `COMPOSIO_USE_SKILL` / `COMPOSIO_MANAGE_SKILL` | Reusable skills stored in Composio |

The exact set can vary by Composio version; trust the tool list at connection time.

## Usage rules

- **Intent first, slugs second.** Slugs look like `GMAIL_SEND_EMAIL` but change over time — always confirm via search.
- **Batch independent work** in one multi-execute call; keep dependent steps sequential.
- **Large results**: process in the remote workbench instead of pulling everything into context.
- **Pagination**: follow cursors until the user's question is answered, not blindly to the end.
- **Failures**: `connection not found/expired` → re-run manage connections; `invalid input` → re-read the schema; `rate limited` → back off and retry once; anything else → report and ask.
- **Least privilege**: only link the toolkits the task needs.

## Examples

- "Send the weekly update to the team on Slack" → search → confirm channel + text → execute.
- "Create a Linear issue from this bug and email me the link" → search both toolkits → connect if needed → issue first, then email.
- "What's on my calendar tomorrow?" → read-only, no confirmation needed.

## Privacy & security

- App auth is managed by Composio; the agent never sees app passwords or OAuth secrets.
- `COMPOSIO_API_KEY` is a secret: environment only, never logged or stored.
- Actions run against the user's real accounts — treat every write as production.
- Users can review and revoke connections in the Composio dashboard.

## References

- [references/tool-router.md](references/tool-router.md) — MCP URL, auth header, client setup
- [references/troubleshooting.md](references/troubleshooting.md) — common errors and fixes
- Docs: <https://docs.composio.dev> · Toolkits: <https://composio.dev/toolkits>
