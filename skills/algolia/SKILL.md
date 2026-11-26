---
name: algolia
description: >-
  Search, inspect, and manage Algolia indexes from the agent through the
  official Algolia MCP server. Use this skill when the user wants to
  search an index, list indices, read or update index configuration
  (searchable attributes, ranking, faceting, synonyms, rules), fetch or
  upsert records, delete objects, clear or copy an index, run A/B tests,
  inspect analytics, query suggestions, recommendations, or monitor
  usage metrics. Triggers on phrases like "search my products index",
  "what indices do I have in Algolia", "add this product to the
  products index", "clear the staging index", "copy production to
  staging", "run an A/B test", "show me search analytics", or any
  request to programmatically interact with an Algolia application. Use
  this skill even if the user just says "use algolia" or asks how to
  expose their search data to the agent.
---

# Algolia Skill

This skill exposes the **official Algolia MCP server** (`algolia/mcp`) as a single Fractal toolset. The server wraps Algolia's REST APIs behind a stable, typed tool surface so the agent can run searches, manage index settings, and operate on records without hand-crafting HTTP requests.

## Toolset

- `mcp` — Algolia MCP server (`go run github.com/algolia/mcp/cmd/mcp@latest` or the prebuilt Go binary in `cmd/mcp/mcp`). Tools are grouped by capability: `search`, `search_read`, `search_write`, `analytics`, `abtesting`, `collections`, `monitoring`, `querysuggestions`, `recommend`, `usage`. All groups are enabled by default; set `MCP_ENABLED_TOOLS` to a comma-separated list to scope down.

## Tool groups

| Group | What it does |
|---|---|
| `search` | Enables all search operations (read + write). The shorthand for "I want everything search-related." |
| `search_read` | Read-only index operations: list indices, get settings, run queries, get objects by ID. |
| `search_write` | Mutating index operations: clear, copy, move, delete index, set settings, batch insert/update/delete objects. |
| `analytics` | Search analytics — top searches, no-result rates, click-through rates by index. |
| `abtesting` | A/B test management — create, list, and stop experiments that split traffic between two index variants. |
| `collections` | Federated search across a group of indices with a single query. |
| `monitoring` | Index health — uptime, latency, indexing health, reachability per region. |
| `querysuggestions` | Query suggestions — manage the autocomplete index that powers "popular searches" lists. |
| `recommend` | Recommendations — configure recommend models (related items, frequently bought together) and fetch recommendations. |
| `usage` | Billing and quota — operations consumed per index per billing period. |

## Core read tools (search_read)

| Tool | What it does |
|---|---|
| `list_indices` | List every index in the application. |
| `get_index_settings` | Read the full settings object for one index (searchable attributes, ranking, faceting, etc.). |
| `search_single_index` | Run a query against one index — full filter, facet, and ranking support. |
| `get_objects` | Fetch records by `objectID`. |

## Core write tools (search_write)

| Tool | What it does |
|---|---|
| `save_object` / `save_objects` | Upsert one or many records (create or replace by `objectID`). |
| `delete_object` / `delete_objects` | Remove one or many records by `objectID`. |
| `partial_update_object` / `partial_update_objects` | Patch specific fields on existing records (does not touch unset fields). |
| `clear_objects` | Remove every record from an index (keeps settings). |
| `set_settings` | Replace the full settings object. |
| `copy_index` | Clone an entire index (settings + records) to a new name. |
| `move_index` | Rename an index. |
| `delete_index` | Permanently delete an index. |

## Usage rules

- **Scope write operations to one index at a time.** Pass an explicit `indexName` on every call. Never operate on a "default" or implicit index.
- **Prefer `partial_update_objects` over `save_objects` when you only need to change a few fields.** It avoids accidentally clobbering attributes that are not in the patch.
- **Read settings with `get_index_settings` before calling `set_settings`.** `set_settings` is a full replacement, not a merge — passing a partial object will wipe the missing keys.
- **Restrict to read-only mode when the agent is in an exploration context.** Set `MCP_ENABLED_TOOLS=search_read,analytics,usage` to disable all mutations.
- **Never hardcode API keys in prompts or tool calls.** The keys belong in the `env` block of the MCP server config.
- **Use the admin key only for write operations.** The search-only key is sufficient for `search_read` and analytics; never expose the admin key to client-side code.
- **Page large result sets.** For queries that may return many hits, pass `hitsPerPage` (default 20) and walk pages with `page` rather than requesting everything at once.
- **Throttle bulk inserts.** Use `batchSize` and small `waitForTasks` windows to stay under the per-index operations/minute limit.

## Connection arguments

| Flag / env | Purpose |
|---|---|
| `ALGOLIA_APP_ID` (required) | Application ID from the Algolia dashboard. |
| `ALGOLIA_INDEX_NAME` (required) | Default index used when a tool call does not pass `indexName`. |
| `ALGOLIA_API_KEY` (required) | Search-only API key. Sufficient for read + analytics operations. |
| `ALGOLIA_WRITE_API_KEY` (optional) | Admin API key. Required for `search_write`, `abtesting`, `collections`, `monitoring`, `querysuggestions`, `recommend`, and `usage` write operations. |
| `MCP_ENABLED_TOOLS` (optional) | Comma-separated allowlist of tool groups. Defaults to all. Example: `search_read,analytics,usage`. |
| `MCP_SERVER_TYPE` (optional) | `stdio` (default) or `sse`. |
| `MCP_SSE_PORT` (optional) | Port for the SSE server (default `8080`). Only used when `MCP_SERVER_TYPE=sse`. |

## Install

The MCP server is a Go binary. Two install paths are supported:

**Option A — run from source (no build step):**

```bash
go run github.com/algolia/mcp/cmd/mcp@latest
```

**Option B — clone and build:**

```bash
git clone https://github.com/algolia/mcp.git
cd mcp/cmd/mcp
go build
# binary is now at ./mcp
```

Then register it with the Fractal workspace. The toolset connection string in this folder is pre-configured to use Option A.

## Configuration

Minimum env block:

```json
{
  "mcpServers": {
    "algolia": {
      "command": "go",
      "args": ["run", "github.com/algolia/mcp/cmd/mcp@latest"],
      "env": {
        "ALGOLIA_APP_ID": "<APP_ID>",
        "ALGOLIA_INDEX_NAME": "<INDEX_NAME>",
        "ALGOLIA_API_KEY": "<API_KEY>"
      }
    }
  }
}
```

For write access, add `ALGOLIA_WRITE_API_KEY` to the same `env` block. To lock the server to read-only behavior, add `MCP_ENABLED_TOOLS=search_read,analytics,usage`.

## Security notes

- Algolia MCP is **not a security boundary**. Any data observable through the search API can be exfiltrated by a malicious prompt that names the right index.
- The admin key grants full read/write access to every index in the application. Treat it like a database root password — never paste it into chat logs, code, or test fixtures.
- The search-only key is safe to embed in client-side integrations but should still be rotated regularly.

## References

- Upstream server: <https://github.com/algolia/mcp>
- Algolia documentation: <https://www.algolia.com/doc/>
- API reference: <https://www.algolia.com/doc/api-reference/>
- OpenAPI spec: <https://api-specs.algolia.com/?download=1>
- License: MIT

## MCP connection

This registry entry connects to Algolia's remote MCP endpoint at `https://mcp.algolia.com/mcp` through Fractal's OAuth flow. Fractal discovers the available tools after authorization; follow the live tool list because it can depend on the connected account. The provider must support this OAuth flow, and this endpoint was not independently authorized during registry preparation.
