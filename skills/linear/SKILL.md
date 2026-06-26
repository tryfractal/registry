---
name: linear
description: >-
  Read, search, create, and update issues, projects, cycles, labels,
  milestones, initiatives, and comments in Linear through the official
  hosted Linear MCP server. Use this skill when the user wants to look up
  a ticket, list their backlog, check issue status, create a new bug or
  feature request, assign work, change priority, move an issue between
  states, add a comment, or pull a filtered list of issues (by assignee,
  label, project, cycle, state, due date). Triggers on phrases like
  "create a Linear ticket for this bug", "open ENG-1234", "what's on my
  Linear backlog", "assign that issue to Maria and set priority urgent",
  "move the checkout bug to In Progress", "list all P0 issues in the Q3
  cycle", "add a comment to ENG-1234", "create a project called
  Onboarding v2", or any request to inspect or modify a Linear workspace.
  Use this skill even if the user says "check Linear" or "create a
  ticket".
---

# Linear Skill

This skill exposes the **official hosted Linear MCP server** (`https://mcp.linear.app/mcp`) as a single Fractal toolset. The server is centrally managed by Linear, follows the **authenticated remote MCP** spec, and uses **OAuth 2.1 with dynamic client registration** for auth — no API key needs to be generated up front. A Linear **API key** or existing **OAuth access token** can also be passed directly in an `Authorization: Bearer <token>` header for headless / CI use.

The skill is read-and-write capable: it can list, search, create, and update issues, projects, cycles, comments, labels, and the rest of the Linear data model.

## Toolset

- `mcp` — Linear's official hosted MCP server. Streamable HTTP transport at `https://mcp.linear.app/mcp`. Auth via interactive OAuth 2.1 flow (default) **or** `Authorization: Bearer <LINEAR_API_KEY | oauth_token>` for non-interactive setups.

## Core tools (always available)

The hosted server exposes the full Linear GraphQL surface as MCP tools. The most commonly used ones:

| Tool | What it does |
|---|---|
| `list_teams` | List all teams in the workspace. |
| `get_team` | Fetch one team by id or key (e.g. `ENG`). |
| `list_users` | List workspace members (filter by name, email, or team). |
| `get_user` | Fetch one user by id, email, or display name. |
| `list_issues` | Search issues with filters: `assignee`, `state`, `team`, `label`, `project`, `cycle`, `priority`, `dueDate`, `createdAt`, `updatedAt`, plus full-text `query`. |
| `get_issue` | Fetch one issue by id or human-readable identifier (e.g. `ENG-1234`). |
| `create_issue` | Create an issue with `title`, `description` (Markdown), `teamId`, `assigneeId`, `priority` (0–4, `0=No priority`, `1=Urgent`, `2=High`, `3=Medium`, `4=Low`), `stateId`, `labelIds`, `projectId`, `cycleId`, `dueDate`, `estimate`. |
| `update_issue` | Update any subset of fields on an issue — title, description, assignee, priority, state, labels, project, cycle, due date, estimate, parent. |
| `archive_issue` / `delete_issue` | Soft-archive or hard-delete an issue. |
| `list_issue_statuses` | List available workflow states (e.g. `Triage`, `In Progress`, `Done`) for a team. |
| `list_comments` | List comments on an issue. |
| `create_comment` | Post a Markdown comment on an issue (supports `@mentions`). |
| `list_projects` | List projects (filter by `state`: `planned`, `started`, `paused`, `completed`, `canceled`). |
| `create_project` | Create a project with `name`, `description`, `leadId`, `targetDate`, `state`. |
| `update_project` | Update project name, description, lead, target date, or state. |
| `list_cycles` | List cycles (sprints) for a team — current, previous, next, or all. |
| `get_cycle` | Fetch one cycle by id, including its scope and progress. |
| `list_labels` | List labels defined in a team (e.g. `bug`, `feature`). |
| `create_label` | Create a new label with `name` and `color`. |
| `list_milestones` | List project milestones. |
| `list_initiatives` | List workspace-level initiatives. |
| `list_attachments` | List attachments on an issue. |
| `create_attachment` | Attach an external URL (with optional `title` and `subtitle`) to an issue. |

The exact tool names and parameter schemas are introspected at MCP connect time; if a name above differs in your client, list the tools with the MCP `tools/list` call to confirm.

## Tool categories

| Category | What it unlocks |
|---|---|
| **Read** | `list_issues`, `get_issue`, `list_teams`, `list_users`, `list_projects`, `list_cycles`, `list_labels`, `list_comments`, `list_milestones`, `list_initiatives`. |
| **Write** | `create_issue`, `update_issue`, `create_comment`, `create_project`, `update_project`, `create_label`. |
| **Search** | `list_issues` with `query` and structured filters. |
| **Destructive** | `archive_issue`, `delete_issue`. Use with explicit user confirmation. |

## Usage rules

- **Use the human-readable identifier (`ENG-1234`), not the UUID.** Linear issues are usually referred to by their team-key + number. Pass it as the `id` argument and the server resolves it.
- **Filter at the server, not in your head.** Always pass `assignee`, `state`, `team`, `label`, `project`, `cycle`, or `query` to `list_issues` rather than fetching the whole backlog and filtering client-side — Linear's GraphQL filter is far cheaper.
- **Resolve names to ids first.** `create_issue` and `update_issue` accept ids, not names. Call `list_users` / `list_teams` / `list_issue_statuses` / `list_labels` to resolve `@Maria`, "Eng", "In Progress", or "bug" to their ids before mutating.
- **Priority uses Linear's scale.** `0 = No priority`, `1 = Urgent`, `2 = High`, `3 = Medium`, `4 = Low`. Do not invent values outside `0–4`.
- **Descriptions are Markdown.** Issue and comment bodies support Linear-flavored Markdown — `**bold**`, `*italic*`, `` `code` ``, fenced blocks, `[link](url)`, and `@mention` syntax. Do not paste HTML.
- **Confirm before destructive ops.** `delete_issue` is permanent. `archive_issue` is reversible but still destructive. Always show the issue identifier and ask before invoking either.
- **Mutate, don't recreate.** When the user says "change the priority of ENG-1234 to urgent", call `update_issue` on the existing id, never `create_issue` + `archive_issue`.
- **One create, one update at a time.** The MCP tools are per-object. For bulk operations (e.g. "move all 12 of these to Done"), loop with a clear progress note rather than batching into one call.

## Connection

The toolset connects to Linear's hosted MCP server over Streamable HTTP. Auth defaults to an interactive OAuth 2.1 flow (the user's browser opens, grants the requested scopes, and the token is cached). For non-interactive environments, set the `LINEAR_API_KEY` environment variable to a personal API key (or an OAuth access token from your own Linear OAuth app) and the server will pick it up from the `Authorization: Bearer` header automatically.

| Property | Value |
|---|---|
| URL | `https://mcp.linear.app/mcp` |
| Transport | Streamable HTTP |
| Auth (interactive) | OAuth 2.1 with dynamic client registration |
| Auth (headless / CI) | `Authorization: Bearer <LINEAR_API_KEY or oauth_token>` |

### Environment variables

| Variable | Purpose |
|---|---|
| `LINEAR_API_KEY` | Personal API key from **Linear → Settings → Account → Security & Access**. Treated as a Bearer token by the MCP server — no separate header wiring required. |
| `LINEAR_OAUTH_TOKEN` | (Optional) An OAuth access token from your own Linear OAuth app, also passed as a Bearer token. Useful when integrating with an existing OAuth flow. |

Generate a key at `https://linear.app/settings/account/security` and treat it like a password — never paste it into chat or commit it to source.

## Authentication flows

**Interactive (default).** The first time a tool is called, the MCP client opens a browser, the user signs in to Linear, approves the requested scopes, and the resulting token is cached at `~/.mcp-auth/`. Subsequent calls reuse the cached token until it expires or is revoked.

If you ever hit an `internal server error`, run `rm -rf ~/.mcp-auth` and reconnect.

**Headless / CI.** Set `LINEAR_API_KEY` (or `LINEAR_OAUTH_TOKEN`) in the environment before launching the MCP client. The server will pick up the token from the `Authorization: Bearer` header instead of running the OAuth dance — useful for scheduled automations, smoke tests, and `app` user integrations. A restricted API key is recommended so a leak can only read.

## Configuring specific clients

| Client | Setup |
|---|---|
| Claude Code | `claude mcp add --transport http linear-server https://mcp.linear.app/mcp`, then `/mcp` to authenticate. |
| Cursor | Add the connector from Cursor's MCP page (one click). |
| Windsurf / Zed / VS Code (stdio) | `npx -y mcp-remote https://mcp.linear.app/mcp` |
| Other (Streamable HTTP) | URL `https://mcp.linear.app/mcp`, no command, no env. |

For WSL, the docs recommend `wsl npx -y mcp-remote https://mcp.linear.app/sse --transport sse-only` if you hit transport issues.

## Security notes

- Treat `LINEAR_API_KEY` as a **secret**. Anyone with it can read and mutate every issue, project, and cycle in the workspace the key is scoped to.
- Use a **restricted API key** for read-only or single-team integrations. Scoped keys limit blast radius if leaked.
- MCP tools are not a security boundary. A malicious prompt that reaches `update_issue` can change priorities, assignees, and project membership. Always surface destructive actions in the UI before invoking them.

## References

- Upstream docs: <https://linear.app/docs/mcp>
- GraphQL API reference: <https://developers.linear.app/docs/graphql/working-with-the-graphql-api>
- Product home: <https://linear.app/>
- API keys & security: <https://linear.app/settings/account/security>
- License: MIT (third-party open source)
