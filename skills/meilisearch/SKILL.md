---
name: meilisearch
description: >-
  Drive a Meilisearch instance (self-hosted, Cloud, or local Docker) from
  the agent through the official Meilisearch MCP server. Use this skill when
  the user wants to create, list, or delete search indices; add, update, or
  delete documents; run typo-tolerant or hybrid (keyword + vector) searches
  with filters, facets, and sorting; tune ranking rules, searchable
  attributes, faceting, or typo tolerance; manage API keys and permissions;
  inspect indexing tasks; or check server health, version, or stats.
  Triggers on phrases like "create a products index in Meilisearch",
  "index these 5,000 documents", "search for sneakers under $50 sorted by
  price", "set up typo tolerance for the title field", "make category
  filterable", "tune ranking rules so recent items win", "rotate the
  master key", "show me failed tasks", or any request to drive a
  Meilisearch engine.
---

# Meilisearch Skill

This skill exposes the official **Meilisearch MCP server** (`meilisearch-mcp` from PyPI) as a single Fractal toolset. The server speaks the Model Context Protocol over stdio and gives the agent full control over a Meilisearch instance: indices, documents, search, settings, API keys, tasks, and system health.

## Toolset

- `mcp` — Official Meilisearch MCP server (`meilisearch-mcp` on PyPI, installed via `uvx` or `pip`). Speaks stdio to the local Meilisearch instance and surfaces every Meilisearch feature as an MCP tool. Connects to one Meilisearch instance at a time and can switch instances dynamically.

## Connection management

| Tool | What it does |
|---|---|
| `get-connection-settings` | Show the current Meilisearch URL and whether an API key is configured. |
| `update-connection-settings` | Switch the URL and / or API key on the fly to point at a different instance (e.g. local Docker → Meilisearch Cloud). |

## Index operations

| Tool | What it does |
|---|---|
| `create-index` | Create a new index with an optional explicit primary key. |
| `list-indexes` | List all indexes with their size, document count, and last update timestamp. |
| `delete-index` | Delete an index and all of its documents. |
| `get-index-metrics` | Get per-index metrics: number of documents, indexing, search usage, and storage size. |

## Document operations

| Tool | What it does |
|---|---|
| `add-documents` | Add or update documents in an index (upsert by primary key). Supports both single-doc and bulk import. |
| `get-documents` | Retrieve documents from an index with pagination (`limit` / `offset`). |

## Search

| Tool | What it does |
|---|---|
| `search` | Run a typo-tolerant search against one index or across multiple indexes in a single call. Supports `q`, `filter`, `sort`, `facets`, `attributesToRetrieve`, `attributesToHighlight`, `limit`, `offset`, `showRankingScore`, hybrid `vector` + `hybrid` parameters for semantic / hybrid search. |

## Settings

| Tool | What it does |
|---|---|
| `get-settings` | Read the current settings for an index: ranking rules, searchable attributes, filterable attributes, sortable attributes, displayed attributes, stop words, synonyms, typo tolerance, faceting, pagination, and (when enabled) embedders. |
| `update-settings` | Update one or more settings of an index in a single call. All fields are optional — pass only the keys you want to change. |

## API keys

| Tool | What it does |
|---|---|
| `get-keys` | List all API keys (master, admin, search-only, custom). |
| `create-key` | Create a new API key with a specific name, description, UID, actions, indexes, and expiry. |
| `delete-key` | Delete an existing API key by its UID. |

## Tasks

| Tool | What it does |
|---|---|
| `get-task` | Get detailed information about a single task by its UID (status, type, index, error payload, duration). |
| `get-tasks` | List tasks with optional filters (`status`, `indexUids`, `types`, `limit`, `from`, `to`). |
| `cancel-tasks` | Cancel pending or enqueued tasks. |
| `delete-tasks` | Delete completed (or failed) tasks from history. |

## System & health

| Tool | What it does |
|---|---|
| `health-check` | Lightweight health probe (returns `available` or throws). |
| `get-health-status` | Detailed health snapshot (database, task runner, write queue, etc.). |
| `get-version` | Return the Meilisearch server version. |
| `get-stats` | Database-wide statistics: number of indexes, documents, and storage used. |
| `get-system-info` | OS / process information: memory usage, CPU, disk, runtime versions. |

## Usage rules

- **Use the MCP server only against a Meilisearch instance you control.** Do not point it at a third-party URL you do not own — the server can read, mutate, and delete data.
- **Always use an API key in production.** The local Docker image starts in dev mode without a master key, but the moment you expose the port or move to Meilisearch Cloud you must set `MEILI_MASTER_KEY`. Without it anyone on the network can read or wipe your data.
- **Prefer `update-connection-settings` for ephemeral hops.** Use it when the user is moving between a local Docker, a staging instance, and a production Cloud project inside one session. Restart the MCP server only when the URL / key combination is permanent.
- **Batch document writes.** `add-documents` accepts an array — never call it once per document. For imports above ~100k documents, prefer chunked batches of 10–50k and rely on the task system to track progress.
- **Watch the task UID.** Every write operation (create-index, add-documents, update-settings, …) returns a `taskUid`. Poll `get-task` with that UID (or use `get-tasks` with `indexUids`) to confirm the operation has finished before you read the data.
- **Run `get-stats` and `get-health-status` first when debugging.** If a search returns nothing or indexing stalls, start with health + stats before re-indexing.
- **Keep filterable / sortable attributes minimal.** Every attribute listed in `filterableAttributes` or `sortableAttributes` costs memory. Only add the fields you actually filter or sort on.
- **Tune typo tolerance deliberately.** Default typo tolerance is fine for short, common words. For SKUs, IDs, emails, or phone numbers, set `disableOnAttributes` so a one-character typo never matches a code.

## Connection arguments

The toolset runs the official Python MCP server. Override the launch by editing the toolset `args` list. The server reads these environment variables:

| Env var | Purpose | Default |
|---|---|---|
| `MEILI_HTTP_ADDR` | URL of the Meilisearch server. | `http://localhost:7700` |
| `MEILI_MASTER_KEY` | Master / admin API key (required in production). | _unset → unauthenticated dev mode_ |

Other useful launch flags (forwarded to `meilisearch-mcp` via the command in `args`):

| Flag | Purpose |
|---|---|
| `--no-pretty` | Disable formatted JSON output (smaller payloads over the wire). |
| `--transport stdio` | Force stdio transport (the only one currently supported). |

To point the skill at a different instance without editing the toolset, call `update-connection-settings` at runtime — the new URL and key persist for the rest of the session.

## Quick start

```bash
# 1. Start Meilisearch (Docker)
docker run -d -p 7700:7700 \
  -e MEILI_ENV=development \
  -v $(pwd)/meili_data:/meili_data \
  --name meili \
  getmeili/meilisearch:v1.28

# 2. The toolset will connect to http://localhost:7700 by default.
#    In production, set MEILI_HTTP_ADDR and MEILI_MASTER_KEY in the
#    environment before the agent starts.
```

## Embedding & hybrid search

Meilisearch supports vector search (embedders) and hybrid search (keyword + vector) from v1.10+. To use it:

1. Configure an embedder on the index via `update-settings` (`embedders` block — choose a provider, model, and document template).
2. Pass `vector` (an array of floats) and `hybrid` (`{"semanticRatio": 0.5}`) in the `search` payload.
3. The agent can call this through `search` — the tool already accepts the vector + hybrid arguments.

For embedding generation, the agent must produce the vector itself (Meilisearch does not embed at the server unless you wire a remote embedder provider like OpenAI or Hugging Face in the embedder config).

## Security notes

- The MCP server can **read, mutate, and delete** every document and index the API key has access to. Treat the master key like a database root password.
- The dynamic `update-connection-settings` flow is convenient for development but bypasses the strict per-instance credential isolation you get from a static environment. Keep it off in production.
- `MEILI_MASTER_KEY` is a **server-side secret**. Never log it, never echo it back, and never include it in agent-visible tool responses.

## References

- Upstream docs: <https://github.com/meilisearch/meilisearch-mcp>
- PyPI package: <https://pypi.org/project/meilisearch-mcp/>
- Meilisearch project: <https://www.meilisearch.com/>
- Meilisearch docs: <https://www.meilisearch.com/docs>
- OpenAPI spec: <https://github.com/meilisearch/open-api>
- License: MIT
