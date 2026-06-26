---
name: metabase
description: >-
  Drive Metabase, the open-source business intelligence and analytics
  platform, directly from the agent through an MCP server. Use this skill
  when the user wants to list databases, tables, fields, questions (saved
  queries), or dashboards on a Metabase instance; run a saved question;
  execute a native SQL or MBQL query against a Metabase-connected database;
  search the Metabase data model; fetch dashboard cards; create or update
  cards and dashboards; or pull a CSV/JSON/XLSX export of any question.
  Triggers on phrases like "list my Metabase databases", "show tables in
  the analytics warehouse", "run question 42", "execute this SQL through
  Metabase", "open dashboard Weekly Revenue", "search Metabase for tables
  with revenue", "export the orders question as CSV", "create a new
  question with this SQL", or any request to query, inspect, or modify
  content in a Metabase instance.
---

# Metabase Skill

This skill exposes the **Metabase MCP server** (`metabase-mcp-server`) as a single Fractal toolset. The server speaks the Metabase REST API and surfaces a flat set of MCP tools for listing databases, searching the data model, running saved questions, executing ad-hoc queries, and reading dashboard cards.

Metabase is the open-source BI tool that lets non-technical users ask questions of a data warehouse. This skill makes every Metabase resource queryable by the agent.

## Toolset

- `mcp` — Metabase MCP server (`metabase-mcp-server`). Defaults to stdio transport via `npx`; switch to HTTP mode for remote / serverless deployments by adding `--transport http --port <port>` to the toolset `args`.

## Core tools (always available)

| Tool | What it does |
|---|---|
| `list_databases` | List every database the Metabase instance has been configured to connect to, with id, name, engine, and a description of the tables it contains. |
| `list_tables` | List all tables in a specific database (filter by database_id). Returns table id, name, schema, description, and row estimate. |
| `list_fields` | List the columns (fields) of a specific table, including name, type, semantic type (e.g. `type/Category`, `type/CreationDate`), and field description. |
| `get_table` | Fetch a single table with its full description, fields, and metrics. |
| `search` | Full-text search across databases, tables, fields, questions, dashboards, and collections. |
| `execute_query` | Run an ad-hoc MBQL or native SQL query and return the rows. Supports parameters, filters, aggregations, and joins. |
| `list_questions` | List saved questions (cards) with id, name, collection, dataset query, and visualization type. |
| `get_question` | Fetch one saved question with its full definition, including the underlying query and display settings. |
| `run_question` | Execute a saved question by id and return the result rows. Optional `parameters` map for parameterized questions. |
| `list_dashboards` | List all dashboards with id, name, collection, and a summary of cards. |
| `get_dashboard` | Fetch one dashboard with its full layout, ordered cards, and parameter definitions. |
| `list_collections` | List collections (folders) used to organize questions, dashboards, and models. |
| `get_card` | Fetch a single dashboard card with its query, display, and parameter mappings. |
| `create_question` | Create a new saved question (MBQL or native SQL) and return its id. |
| `update_question` | Patch an existing question (name, description, query, display). |
| `archive_question` | Move a question to the trash. |
| `create_dashboard` | Create a new dashboard in a collection. |
| `update_dashboard` | Rename, move, or re-describe a dashboard. |
| `add_card_to_dashboard` | Place an existing question onto a dashboard with a position and size. |
| `export_results` | Download the result of any question or query as CSV, JSON, or XLSX. Returns a file path or a base64 payload. |
| `list_users` | List Metabase users with id, email, group memberships, and last-active timestamp. |
| `list_permissions_groups` | List permission groups (All Users, Admins, custom data groups). |
| `get_current_user` | Return the API key / session identity currently authenticated against the instance. |

## Usage rules

- **Always use the API key, not a username/password, when one is available.** API keys are scoped, rotatable, and never expose the user password to the agent. Set `METABASE_API_KEY` and leave `METABASE_USERNAME` / `METABASE_PASSWORD` empty.
- **Use `search` before `list_*` to avoid full-table scans.** Searching by table name, field name, or question name is dramatically cheaper than listing every table in a large warehouse.
- **Prefer `run_question` over `execute_query` for known questions.** A saved question is version-controlled, reusable, and respects the permissions its author had. Ad-hoc `execute_query` runs with the API key's own permissions.
- **Use `get_table` + `get_question` before `execute_query` to discover the schema.** A `select *` against a warehouse table can return millions of rows; introspect the columns first and add a `LIMIT` clause to any exploratory query.
- **Never re-export a saved question to inspect its results.** Call `run_question` and read the rows inline. Export only when the user asks for a file deliverable (CSV, XLSX, etc.).
- **Treat Metabase as read-only by default.** `create_question`, `update_question`, `create_dashboard`, and the card-placement tools all mutate the instance. Confirm with the user before writing — there is no undo for `archive_question`.
- **Pass parameters by name, not position.** Parameterized questions use the field slug (e.g. `{"start_date": "2024-01-01"}`), not the parameter index.
- **Use the Metabase ID, not the human-readable name, when chaining calls.** Names are not unique; the integer id returned by `list_*` is the only stable handle.
- **Mind row limits on `execute_query`.** Default to `LIMIT 1000` for exploratory queries. Use the question-level `download_limit` only when the user explicitly asks for a full export.

## Connection arguments

| Flag | Purpose |
|---|---|
| `METABASE_URL` | Full URL of the Metabase instance (e.g. `https://metabase.example.com`). |
| `METABASE_API_KEY` | API key for the service account. Preferred over session auth. |
| `METABASE_USERNAME` | Email of the Metabase user (only if not using an API key). |
| `METABASE_PASSWORD` | Password of the Metabase user (only if not using an API key). |
| `--transport stdio` | Run the MCP server over stdio (default). |
| `--transport http` | Expose the MCP server over HTTP. |
| `--port <port>` | TCP port to use with `--transport http` (default `8080`). |
| `--read-only` | Disable every write / mutation tool. Recommended for shared or production instances. |
| `--max-rows <n>` | Hard cap on rows returned by `run_question` and `execute_query` (default `1000`). |
| `--timeout <seconds>` | Per-request HTTP timeout for the underlying Metabase client (default `30`). |

## Connection example

```bash
export METABASE_URL="https://metabase.example.com"
export METABASE_API_KEY="mb_AbC123XyZ…"
npx -y metabase-mcp-server
```

The toolset spawns the server with `npx -y metabase-mcp-server` by default; pass the same flags through the toolset `args` to customize the launch.

## Security notes

- The Metabase API key is **not a security boundary on its own**. Anyone who can read the `METABASE_API_KEY` environment variable can act as that account inside Metabase. Rotate the key, scope it to a dedicated service-account group, and use `--read-only` whenever the task does not require writes.
- The Metabase REST API **is not versioned**. Pin your Metabase server version and review breaking-change notes before upgrading.
- Question and dashboard IDs are stable but the human-readable names are not. Always re-fetch by id.
- Metabase will return data with the permissions of whichever API key you use, not the permissions of the end user. Do not use a high-privilege key to read data the end user is not authorized to see.

## References

- Metabase product page: <https://www.metabase.com/>
- Metabase REST API reference: <https://www.metabase.com/docs/latest/api-documentation>
- Metabase OpenAPI spec: <https://www.metabase.com/docs/latest/api-documentation/openapi.yaml>
- Metabase MCP server: <https://github.com/metabase/metabase-mcp-server>
- API key setup: <https://www.metabase.com/docs/latest/people-and-groups/api-keys>
- License: AGPL (Metabase itself is open source; the MCP server is distributed under the same terms).
