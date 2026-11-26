---
name: zapier
description: >-
  Connect the agent to 9000+ apps and 30000+ actions through the Zapier MCP
  server — send Slack messages, create Google Sheets rows, send Gmail, manage
  Jira/Asana tasks, update HubSpot deals, post Discord messages, create Linear
  issues, and thousands more pre-built integrations. Use this skill when the
  user wants to interact with any of Zapier's connected apps — send a message,
  create a record, update a field, search for data, or trigger an action —
  without writing custom API code. Triggers on phrases like "send a Slack
  message", "add a row to my spreadsheet", "create a task in Asana", "update
  the deal in HubSpot", "post to Discord", "send an email via Gmail", or any
  request that involves automating one of Zapier's 9000+ integrated apps
  through natural language. Requires a Zapier account and an MCP server
  configured at mcp.zapier.com.
---

# Zapier Skill

This skill connects the agent to **Zapier's ecosystem of 9000+ apps and 30000+ actions** through the Zapier MCP server. Each tool in the server corresponds to a Zapier action you configure — choose the app, pick the action, connect your account, and the agent can call it directly.

## Toolset

- `mcp` — Zapier MCP server (hosted by Zapier at `actions.zapier.com`). Connects via HTTP SSE transport. The connection URL is unique per user and must be set via the `ZAPIER_MCP_URL` environment variable.

## How it works

1. **Create an MCP server** at [mcp.zapier.com](https://mcp.zapier.com).
2. **Add tools** — pick an app (Slack, Google Sheets, Gmail, Jira, Asana, HubSpot, Discord, GitHub, etc.), select an action (Send Channel Message, Create Spreadsheet Row, Send Email, Create Task, etc.), connect your account, and configure required fields.
3. **Connect the agent** — the Zapier UI provides an SSE URL (`https://actions.zapier.com/mcp/<id>/sse`) that the MCP client connects to. Set it as `ZAPIER_MCP_URL`.
4. **Start automating** — the agent can now call every tool you configured.

The agent does not need any Zapier-specific credentials — all authentication is handled by Zapier through the connected app accounts.

## Example tools you can configure

| App | Example action |
|---|---|
| Slack | Send channel message, create channel, update status, search messages |
| Google Sheets | Add row, update data, create spreadsheet, find data |
| Gmail | Send email, search messages, manage labels, manage drafts |
| Jira | Create task, update epics, search stories, manage sprints |
| Asana | Create task, update project, add comment, assign task |
| HubSpot | Manage contacts, create deals, update records, search |
| GitHub | Create issue, manage PRs, update repos, list issues |
| Discord | Send message, manage servers, create events, manage roles |
| Linear | Create issue, update project, search issues |
| Notion | Create page, update database, search content |

The actual available tools depend on what the user configured at mcp.zapier.com. The agent discovers them at connection time.

## Usage rules

- **Ask the user what they configured first.** The available tools are unique to each user's Zapier MCP server. Start by asking "what tools do you have configured in your Zapier MCP server?" or inspect the tool list at connection time.
- **Be clear and specific when calling tools.** Include all necessary details — recipients, dates, content, and any other required fields. Zapier actions often have mandatory fields that must be filled.
- **Use the tool's response as confirmation.** The agent should summarise what it did after each successful action — "I posted an update to #general in Slack" or "I added a row to your sales spreadsheet."
- **Handle permission errors gracefully.** If an action fails with a permission error, the connected app account may need to be re-authenticated at mcp.zapier.com.
- **Chain actions when needed.** You can call multiple Zapier tools in sequence — e.g. find all unread emails, summarise them, and create tasks for those needing follow-up.

## Configuration

The toolset reads the Zapier MCP server URL from the `ZAPIER_MCP_URL` environment variable:

```bash
export ZAPIER_MCP_URL="https://actions.zapier.com/mcp/<your-server-id>/sse"
```

If this variable is not set, the toolset will fail to connect. The user can get this URL from their MCP server configuration page at [mcp.zapier.com](https://mcp.zapier.com).

### Manual MCP client configuration

```json
{
  "mcpServers": {
    "zapier": {
      "url": "https://actions.zapier.com/mcp/<your-server-id>/sse"
    }
  }
}
```

## Privacy & security

- Zapier logs every action in your MCP server's History tab at mcp.zapier.com.
- No data is stored by Zapier beyond what is required to execute the action.
- Each client has its own data and usage policies.
- Authentication is managed entirely by Zapier — the agent never handles app credentials.

## References

- Zapier MCP docs: <https://docs.zapier.com/mcp/home>
- MCP server setup: <https://mcp.zapier.com>
- Available integrations: <https://zapier.com/apps>
- Compare with Zapier Agents: <https://docs.zapier.com/mcp/home#quick-comparison>
- License: Proprietary (Zapier)

## Hosted MCP connection

This skill also includes a `hosted-mcp` toolset at `https://mcp.zapier.com/api/v1/connect`. It uses Fractal's OAuth authorization flow and discovers tools from the provider after connection. The provider must support the MCP OAuth flow used by Fractal; this endpoint was not independently authorized during registry preparation. Use the current `Zapier` connector when its provider-specific setup or guidance is needed, and the hosted toolset when the user wants the provider's remote MCP server.
