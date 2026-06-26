---
name: airtable
description: >-
  Read and write operational data in Airtable — the no-code relational
  database used for CRMs, project trackers, content calendars, and
  back-office apps. Use this skill when the user wants to query, create,
  update, or delete records in an Airtable base; inspect a base schema;
  list bases, tables, fields, or views; add or rename tables and fields;
  post or read comments on records; or automate any routine Airtable
  workflow. Triggers on phrases like "show me the leads base", "search
  Airtable for invoices over $5,000", "create a record in the Tasks
  table", "update the status of ticket #42", "what tables are in this
  base", "move this deal to Closed Won", or any request to programmatically
  interact with an Airtable base from the agent. If the task is about
  Google Sheets, Notion, or SQL, prefer a skill focused on that domain.
---

# Airtable Skill

This skill exposes the **`airtable-mcp-server`** by `domdomegg` (the most widely adopted Airtable MCP server) as a single Fractal toolset. The server speaks directly to the official Airtable Web API using a personal access token (PAT) or OAuth credentials, so any action the agent takes corresponds 1:1 to an Airtable record operation.

## Toolset

- `mcp` — Airtable MCP server (`@domdomegg/airtable-mcp-server`). Spawns over stdio and exposes read, write, and schema-mutation tools for every base the configured token can see.

## Tool reference

### Schema discovery

| Tool | What it does |
|---|---|
| `list_bases` | List every Airtable base the configured token has access to (returns `id`, `name`, `permissionLevel`). |
| `list_tables` | List tables in a base. `detailLevel` controls payload size: `tableIdentifiersOnly` (IDs only), `identifiersOnly` (IDs + names), `full` (fields + views). |
| `describe_table` | Same payload as `list_tables` but scoped to a single table — cheaper than re-listing the whole base. |
| `get_record` | Fetch a single record by ID. |

### Reading records

| Tool | What it does |
|---|---|
| `list_records` | Paginated list of records. Supports `maxRecords` (default 100) and Airtable `filterByFormula` for server-side filtering. |
| `search_records` | Case-insensitive substring search across all text fields (or a specific `fieldIds` subset). |

### Writing records

| Tool | What it does |
|---|---|
| `create_record` | Insert one record with the given `fields` object. |
| `update_records` | Patch one or more records in a single call (10-record batch limit per request). |
| `delete_records` | Delete one or more records by ID. |

### Schema mutation

| Tool | What it does |
|---|---|
| `create_table` | Create a table with an array of field definitions (`name`, `type`, `description`, `options`). |
| `update_table` | Rename a table or change its description. |
| `create_field` | Add a new field to an existing table. |
| `update_field` | Rename a field or change its description. |

### Comments

| Tool | What it does |
|---|---|
| `create_comment` | Post a comment on a record (optionally threaded via `parentCommentId`). |
| `list_comments` | List comments on a record, newest first, paginated. |

## Usage rules

- **Always discover before you write.** Call `list_bases` → `list_tables` (with `detailLevel: "identifiersOnly"`) → `describe_table` on the target table before reading or writing. Never assume a `baseId` / `tableId` / `fieldId` — they are stable but opaque, and guessing leads to silent write errors.
- **Prefer server-side filtering.** Use `filterByFormula` in `list_records` instead of pulling every record and filtering in context. The Airtable formula language is powerful (`AND`, `OR`, `NOT`, `{Field Name}`, `FIND()`, `IS_AFTER()`, etc.) and saves round-trips.
- **Search with `search_records`, not a formula.** `search_records` runs an optimized full-text pass; only fall back to `filterByFormula` when you need a comparison (`>`, `<`, `IS_AFTER`, `REGEX_MATCH`, ...).
- **Batch updates.** Airtable caps mutations at 10 records per request. Loop `update_records` in chunks of 10 rather than calling it once per record.
- **Preserve the `id` field on update.** When patching, return the full record (`id` + changed `fields`), not just the new field values.
- **Hard-delete only on explicit request.** Airtable's `delete_records` is irreversible. Confirm with the user before any bulk delete, and prefer archiving via a status field when uncertain.
- **Schema changes are first-class writes.** Creating / renaming a field is just as consequential as deleting a record — confirm before doing it, especially in shared bases.
- **Respect token scopes.** If a tool returns `403 INVALID_PERMISSIONS` or `404 NOT_FOUND`, the configured `AIRTABLE_API_KEY` is missing the required scope (`schema.bases:read`, `data.records:read`, `schema.bases:write`, `data.records:write`, `data.recordComments:read`, `data.recordComments:write`) or the base itself. Tell the user; do not retry.
- **Don't echo secrets back.** The token is a long-lived credential. If the user pastes it in chat, prefer configuring it through the workspace secret store rather than inlining it in tool calls or logs.

## Configuration

The toolset reads the API key from the `AIRTABLE_API_KEY` environment variable. The key is a Personal Access Token (PAT) — create one at <https://airtable.com/create/tokens> with the scopes matching the operations you want to perform:

| Scope | Required for |
|---|---|
| `schema.bases:read` | `list_bases`, `list_tables`, `describe_table` |
| `data.records:read` | `list_records`, `search_records`, `get_record`, `list_comments` |
| `schema.bases:write` | `create_table`, `update_table`, `create_field`, `update_field` |
| `data.records:write` | `create_record`, `update_records`, `delete_records` |
| `data.recordComments:read` | `list_comments` |
| `data.recordComments:write` | `create_comment` |

Grant the token access to only the bases it needs. PATs look like `pat12.abc123...` and are issued per-user, per-workspace.

### Setting the env var

```bash
# macOS / Linux
export AIRTABLE_API_KEY="pat12.your_token_here"

# or in a workspace .env (preferred for shared workspaces)
echo 'AIRTABLE_API_KEY=pat12.your_token_here' >> .env
```

## Connection arguments

The toolset ships with stdio transport. To switch to HTTP mode (for remote / multi-client setups), edit the toolset `args`:

```bash
MCP_TRANSPORT=http PORT=3000 npx -y @domdomegg/airtable-mcp-server
# → expose http://localhost:3000/mcp to the client
```

The HTTP transport has **no built-in authentication** — only run it behind a reverse proxy or on a trusted network.

## Formula cookbook

A few `filterByFormula` patterns the agent will reach for often:

| Goal | Formula |
|---|---|
| Status equals "Blocked" | `{Status} = 'Blocked'` |
| Created in the last 7 days | `IS_AFTER({Created}, DATEADD(TODAY(), -7, 'days'))` |
| Name contains "Acme" (case-insensitive) | `FIND(LOWER('acme'), LOWER({Name}))` |
| Amount > 5000 | `{Amount} > 5000` |
| Tag includes "vip" | `FIND('vip', ARRAYJOIN({Tags}, ','))` |
| AND across fields | `AND({Status} = 'Open', IS_AFTER({Due}, TODAY()))` |
| OR across fields | `OR({Owner} = 'felipe', {Priority} = 'urgent')` |

Always quote field names containing spaces with single curly braces: `{Project Name}`, not `Project Name`.

## Pagination

`list_records` and `list_comments` return up to 100 records per page (configurable via `pageSize` / `maxRecords` up to the Airtable API cap). The response includes an `offset` token — pass it back to fetch the next page until `offset` is absent. The agent should loop until exhausted rather than truncating silently.

## Security notes

- Airtable MCP is a **direct proxy to the Airtable Web API** — every tool call is an authenticated HTTP request under the configured token's identity. Treat the token as you would an `Airtable` admin password.
- A leaked PAT can read, modify, and delete every base it has been granted access to. Rotate immediately if exposed (<https://airtable.com/create/tokens> → Revoke).
- The agent should never log, echo, or store the raw token in conversation history, tool responses, or files.
- Schema mutations (renames, new fields) are visible to every collaborator on the base in real time — confirm before executing.

## References

- Upstream server: <https://github.com/domdomegg/airtable-mcp-server>
- npm package: <https://www.npmjs.com/package/@domdomegg/airtable-mcp-server>
- Airtable Web API docs: <https://airtable.com/developers/web/api/introduction>
- Formula reference: <https://support.airtable.com/docs/formula-field-reference>
- Token creation: <https://airtable.com/create/tokens>
- License: MIT
