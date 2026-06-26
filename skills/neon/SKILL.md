---
name: neon
description: >-
  Manage serverless Postgres databases on Neon — projects, branches, SQL,
  migrations, and connection strings — through the official Neon MCP server.
  Use this skill when the user wants to create, list, describe, or delete
  a Neon project; create or reset a database branch; run a SQL query; list
  tables; describe a table schema; prepare or complete a migration; get a
  connection string; list slow queries; explain a query; or provision Neon
  Auth or the Data API. Triggers on phrases like "create a new Neon project
  called my-app", "list my Neon projects", "create a branch from
  production", "reset my dev branch from main", "run this query against
  my Neon database", "show me the schema of the users table", "give me
  the connection string", "prepare a migration that adds a created_at
  column", "what are my slowest queries", "explain this SELECT", "set
  up Neon Auth", or any request to drive a Neon Postgres workflow.
---

# Neon Skill

This skill exposes the **official Neon MCP server** (`@neondatabase/mcp-server-neon`) as a single Fractal toolset. The remote endpoint at `https://mcp.neon.tech/mcp` (Streamable HTTP transport) is maintained by the Neon team, so every tool is always up to date with the latest Neon Platform API and Postgres features — including branching, autoscaling, the Neon Data API, and Neon Auth.

## Toolset

- `mcp` — Neon MCP server (remote, Streamable HTTP, `https://mcp.neon.tech/mcp`). Authenticates either via OAuth (recommended — opens a browser on first use) or via an API key passed as a Bearer token. All tool categories are exposed by default; you can scope down with URL query params (`?readonly=true`, `?projectId=<id>`, `?category=querying&category=schema`).

## Core tools

| Tool | What it does |
|---|---|
| `list_projects` | List the first 10 Neon projects (raise `limit` to fetch more). |
| `list_shared_projects` | List projects shared with the current user. Supports search + `limit`. |
| `list_organizations` | List organizations the user has access to; filter by name or ID. |
| `describe_project` | Get details for a project (ID, name, branches, databases, region). |
| `create_project` | Provision a new Neon project (container for branches, roles, computes). |
| `delete_project` | Permanently delete a project and all its resources. |
| `search` | Search across organizations, projects, and branches; returns IDs and Console links. |
| `fetch` | Fetch full details for one organization, project, or branch by ID. |

## Branch management

| Tool | What it does |
|---|---|
| `create_branch` | Create a new branch (use for dev, preview, or migration isolation). |
| `delete_branch` | Delete a branch. |
| `describe_branch` | Get details for one branch (name, ID, parent, compute state). |
| `list_branch_computes` | List compute endpoints (ID, type, size, autoscaling, last active). |
| `compare_database_schema` | Show the schema diff between a child branch and its parent. |
| `reset_from_parent` | Reset the current branch to its parent; auto-preserves a backup if the branch has children. |

## SQL execution

| Tool | What it does |
|---|---|
| `get_connection_string` | Return the connection string for a branch / database / role. |
| `run_sql` | Execute a single SQL statement (read or write) against a Neon database. |
| `run_sql_transaction` | Execute multiple statements in one transaction (atomic commit/rollback). |
| `get_database_tables` | List all tables inside a database. |
| `describe_table_schema` | Get column names, types, and constraints for one table. |

## Database migrations (safe two-phase flow)

| Tool | What it does |
|---|---|
| `prepare_database_migration` | Run a migration on a **temporary branch** so the main branch is untouched. Returns the temporary branch ID and hints to test before committing. |
| `complete_database_migration` | Merge the tested migration into the main branch and clean up the temporary branch. |

## Query performance

| Tool | What it does |
|---|---|
| `list_slow_queries` | Find the slowest queries (requires the `pg_stat_statements` extension). |
| `explain_sql_statement` | Return the execution plan for a SQL statement. |
| `prepare_query_tuning` | Analyze a slow query and propose indexes — runs against a temporary branch. |
| `complete_query_tuning` | Apply (or discard) the proposed indexes on the main branch. |

## Neon Auth & Data API

| Tool | What it does |
|---|---|
| `provision_neon_auth` | Stand up Neon Auth on a project (integration with an auth provider). |
| `provision_neon_data_api` | Provision the HTTP-based Neon Data API (optional JWT auth via Neon Auth or external JWKS). |

## Documentation lookup

| Tool | What it does |
|---|---|
| `list_docs_resources` | List all Neon docs pages (sourced from `https://neon.com/docs/llms.txt`). |
| `get_doc_resource` | Fetch a single Neon docs page as Markdown. Call `list_docs_resources` first to get the slug. |

## Usage rules

- **OAuth is the default auth path.** Connecting without an API key will open a browser on first use and store a token for the workspace. Use the API-key Bearer header only when OAuth is unavailable (e.g. headless CI).
- **Scope down with URL query params for safety.** Append `?readonly=true` to disable every write tool, `?projectId=<id>` to confine every operation to a single project, and `?category=querying&category=schema` to expose only the read-only surface. These travel with every request and take effect immediately — no restart needed.
- **Use `prepare_*` / `complete_*` pairs for destructive changes.** `prepare_database_migration` and `prepare_query_tuning` always work on a temporary branch. Test there, then call `complete_*` to apply to the main branch. Never run a destructive migration on `main` directly.
- **Pass `projectId` and `branchId` explicitly when you have them.** The remote server can fall back to "last used" heuristics, but that produces surprising results when several projects share a name.
- **Prefer `compare_database_schema` over diffing by hand.** It is the canonical way to see what a migration will change before you commit it.
- **Use `run_sql_transaction` for multi-statement writes.** A `BEGIN ... COMMIT` block guarantees atomicity and gives a clean rollback on error.
- **For performance work, ask for `explain_sql_statement` first** — it is cheaper than a full `list_slow_queries` scan and works on a single statement.
- **List tables with `get_database_tables` before describing them** — table names are needed by `describe_table_schema`.
- **Don't hardcode connection strings in chat logs.** Use `get_connection_string` to fetch the current one; rotate keys in the Neon Console if a string is ever exposed.

## Connection arguments

The toolset uses the remote hosted MCP endpoint. The default config:

| Param | Value |
|---|---|
| `url` | `https://mcp.neon.tech/mcp` |
| `transport` | Streamable HTTP (the deprecated SSE endpoint at `/sse` is also available) |
| Auth | OAuth (browser flow) **or** `Authorization: Bearer <NEON_API_KEY>` header |

Common URL query params (compose with `&`):

| Param | Effect |
|---|---|
| `readonly=true` | Disable every write tool. `run_sql` is restricted to read-only statements. |
| `projectId=<id>` | Scope every operation to a single project. |
| `category=querying&category=schema` | Whitelist specific tool categories (repeatable or CSV). |
| `org_id=<id>` | (OAuth flow) Restrict to a specific organization. |

Examples:

```json
// OAuth, full access
{ "type": "http", "url": "https://mcp.neon.tech/mcp" }

// API key, full access
{
  "type": "http",
  "url": "https://mcp.neon.tech/mcp",
  "headers": { "Authorization": "Bearer <NEON_API_KEY>" }
}

// Read-only, scoped to one project
{ "type": "http", "url": "https://mcp.neon.tech/mcp?readonly=true&projectId=my-prod" }
```

## Environment variables

| Var | Required | Purpose |
|---|---|---|
| `NEON_API_KEY` | Only for the API-key auth flow | Bearer token for the remote MCP server. Generate at <https://console.neon.tech/app/settings/api-keys>. |
| `NEON_PROJECT_ID` | Optional | If set, scopes the connection to a single project at startup. |
| `NEON_READ_ONLY` | Optional | Set to `true` to force `?readonly=true` on the URL. |
| `NEON_CATEGORIES` | Optional | Comma-separated category whitelist (e.g. `querying,schema`). |

## IP allowlist

If the Neon project has IP Allow enabled, the remote MCP server's static IPs must be on the allowlist:

- `34.192.103.46`
- `23.22.233.166`

## Security notes

- **The Neon MCP server is powerful.** It can create and delete projects, drop tables, and run arbitrary SQL. Always review and authorize LLM actions before execution.
- **Not recommended for production.** The official guidance is to use this server for local development and IDE integrations only.
- **`readonly=true` is a real safety net.** Use it whenever the task is read-only — inspecting schemas, running `EXPLAIN`, listing slow queries, or fetching docs.
- **The remote endpoint is OAuth-aware.** Tokens are scoped per workspace; rotate the API key in the Neon Console if it is ever leaked.

## References

- Upstream server: <https://github.com/neondatabase/mcp-server-neon>
- Neon platform: <https://neon.com/>
- Neon docs: <https://neon.com/docs>
- API docs: <https://api-docs.neon.tech/>
- License: MIT
