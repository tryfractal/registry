---
name: qdrant
description: >-
  Give the agent a long-term, semantically searchable memory backed by the
  Qdrant vector database through the official Qdrant MCP server. Use this
  skill when the user wants the agent to remember things across sessions,
  recall prior conversations, store notes, documents, or code snippets, and
  retrieve them by meaning rather than exact keyword. Triggers on phrases
  like "remember this for next time", "save this to my memory", "what did
  I tell you about X last week", "store this code snippet so I can find it
  later", "search my notes for anything related to OAuth", "index these
  documents and let me query them", "build a RAG pipeline over my files",
  "vectorize this text and find similar items", "set up a vector database
  for semantic search", or any request involving embeddings, similarity
  search, or retrieval-augmented generation. Use this skill even if the
  user says "give the agent memory" or asks about semantic search.
---

# Qdrant Skill

This skill exposes the official **Qdrant MCP server** (`mcp-server-qdrant`) as a single Fractal toolset. It acts as a **semantic memory layer on top of a Qdrant vector database** — the agent can `store` free-form information and later `find` it back by meaning, not by exact keyword match. Embeddings are produced locally by FastEmbed (default model `sentence-transformers/all-MiniLM-L6-v2`); no external embedding API is required.

The server is also designed to act as a code-search or document-search backend: customize the `TOOL_STORE_DESCRIPTION` and `TOOL_FIND_DESCRIPTION` env vars to bias the agent toward your domain (snippets, runbooks, papers, tickets, etc.).

## Toolset

- `mcp` — Official Qdrant MCP server (`mcp-server-qdrant`, Python, FastMCP). Speaks the `stdio` transport by default; switch to `sse` or `streamable-http` with the `--transport` flag. The collection specified by `COLLECTION_NAME` is auto-created on first use.

## Core tools

| Tool | What it does |
|---|---|
| `qdrant-store` | Embed and persist a piece of information into the configured Qdrant collection. Returns a confirmation message. |
| `qdrant-find` | Run a semantic search across the collection and return the most relevant stored items. |
| `qdrant-store` *(read-only mode)* | Hidden automatically when `QDRANT_READ_ONLY=true` is set. |

### `qdrant-store` input

| Field | Type | Required | Description |
|---|---|---|---|
| `information` | string | yes | Natural-language text to embed and store. |
| `metadata` | JSON object | no | Arbitrary structured metadata attached to the point. Strings only; use it for things like `code`, `url`, `tags`, `source`. |
| `collection_name` | string | conditional | Target collection. Required if `COLLECTION_NAME` is not set; disabled (auto-filled) if a default is configured. |

### `qdrant-find` input

| Field | Type | Required | Description |
|---|---|---|---|
| `query` | string | yes | Natural-language query. The server embeds it and runs cosine-similarity search. |
| `collection_name` | string | conditional | Target collection. Same rule as `qdrant-store`. |

`qdrant-find` returns up to `QDRANT_SEARCH_LIMIT` (default `10`) results as separate messages, each with its stored `information` text and `metadata`.

## Environment variables

The MCP server is fully configured through environment variables. The only command-line argument is `--transport`. **Do not set both `QDRANT_URL` and `QDRANT_LOCAL_PATH` at the same time** — they are mutually exclusive.

| Variable | Description | Default |
|---|---|---|
| `QDRANT_URL` | URL of the Qdrant server (cloud or self-hosted). | none |
| `QDRANT_API_KEY` | API key for the Qdrant server. Required for Qdrant Cloud. | none |
| `QDRANT_LOCAL_PATH` | Path to a local Qdrant database (alternative to `QDRANT_URL`). | none |
| `COLLECTION_NAME` | Default collection to read/write. Auto-created on first use. | none |
| `EMBEDDING_PROVIDER` | Embedding provider. Only `fastembed` is supported. | `fastembed` |
| `EMBEDDING_MODEL` | FastEmbed model name. | `sentence-transformers/all-MiniLM-L6-v2` |
| `QDRANT_SEARCH_LIMIT` | Max results returned by `qdrant-find`. | `10` |
| `QDRANT_READ_ONLY` | When `true`, hides `qdrant-store` (read-only deployment). | `false` |
| `TOOL_STORE_DESCRIPTION` | Override the `qdrant-store` tool description shown to the model. | server default |
| `TOOL_FIND_DESCRIPTION` | Override the `qdrant-find` tool description shown to the model. | server default |

### FastMCP variables (inherited from the underlying transport)

| Variable | Description | Default |
|---|---|---|
| `FASTMCP_LOG_LEVEL` | `DEBUG` / `INFO` / `WARNING` / `ERROR` / `CRITICAL`. | `INFO` |
| `FASTMCP_SERVER_DEBUG` | Enable debug mode. | `false` |
| `FASTMCP_SERVER_HOST` | Bind host (set to `0.0.0.0` when running in Docker). | `127.0.0.1` |
| `FASTMCP_SERVER_PORT` | Bind port (only relevant for `sse` / `streamable-http`). | `8000` |

## Usage rules

- **Pick a clear default collection.** Set `COLLECTION_NAME` so the agent does not have to decide between collections on every call. One collection per bounded context (e.g. `agent-memory`, `code-snippets`, `docs`, `tickets`).
- **Store natural language, not raw blobs.** The `information` field is embedded as a single string. Long documents should be chunked into meaningful paragraphs before storing, with the source path or ID placed in `metadata`.
- **Use `metadata` for structured filters.** Put things you want to query by exact value (filename, ticket ID, status) in `metadata`; put the searchable prose in `information`. The default `qdrant-find` is semantic-only, so `metadata` is mainly a retrieval-side annotation today.
- **Set `QDRANT_READ_ONLY=true` in shared / multi-tenant deployments.** This hides `qdrant-store` from the model and prevents accidental writes.
- **Tune `QDRANT_SEARCH_LIMIT` for context budget.** Default `10` is conservative; raise it to 20–50 for broad retrieval, lower it to 3–5 for tight RAG prompts.
- **Customize `TOOL_STORE_DESCRIPTION` and `TOOL_FIND_DESCRIPTION` to scope the agent.** A code-search setup, a customer-support setup, and a research-paper setup all want very different tool descriptions — adjust the env vars to match the workload, not the underlying capability.
- **Use SSE or streamable HTTP for remote clients.** `--transport sse` (or `streamable-http`) lets a remote MCP client connect to a centralized Qdrant backend. `stdio` is the right default only when the MCP server and the client run in the same process.
- **Self-host with `QDRANT_LOCAL_PATH` for tiny deployments.** A local on-disk Qdrant instance is enough for a single-user personal memory; it avoids running the full Docker image.
- **Pin the embedding model.** Changing `EMBEDDING_MODEL` after points have been stored will produce dimension mismatches. Migrate the collection, do not silently swap the model.
- **Mind context cost.** `qdrant-find` returns the full stored text, not a snippet. Keep individual `information` payloads short (a paragraph or a code block) so a 10-result search fits in the model context.

## Connection arguments

Edit the toolset `args` list to customize the launch. The most common flags:

| Flag | Purpose |
|---|---|
| `--transport stdio` | Default. Run in the same process as the MCP client. |
| `--transport sse` | Expose an SSE endpoint on `FASTMCP_SERVER_HOST:FASTMCP_SERVER_PORT`. |
| `--transport streamable-http` | Streamable HTTP transport, the modern alternative to SSE. |

All other configuration is environment-driven (see the table above).

## Deployment modes

| Mode | When to use | Connection |
|---|---|---|
| **Qdrant Cloud** | Managed production cluster. | Set `QDRANT_URL` + `QDRANT_API_KEY`. |
| **Self-hosted Qdrant** (Docker / binary) | On-prem or in-cluster. | Set `QDRANT_URL` (e.g. `http://localhost:6333`) and an `QDRANT_API_KEY` if you enabled one. |
| **Local embedded Qdrant** | Single-user, dev, demos. | Set `QDRANT_LOCAL_PATH` to a writable directory. The MCP server manages the DB files itself. |
| **In-memory** (`QDRANT_URL=":memory:"`) | Tests, MCP Inspector. | `fastmcp dev ...` |

## Security notes

- **API keys are bearer credentials.** Treat `QDRANT_API_KEY` like any other secret — store it in your secret manager, never in a checked-in `.env`.
- **The MCP server is not a sandbox.** Any text the agent can `qdrant-store` will be embedded and persisted; the same model that writes to Qdrant can also read whatever was written earlier, including by other agents. Plan retention and rotation.
- **Embedding data leaves the host.** The model runs locally through FastEmbed, but the resulting vectors and payloads are sent to whichever Qdrant endpoint you configure (cloud or self-hosted). Verify that compliance posture for the chosen endpoint.
- **Read-only mode is a guardrail, not a permission boundary.** A determined agent can still hit Qdrant through the FastEmbed HTTP API or any other side channel; the real boundary is the Qdrant cluster's own access control.

## References

- Upstream docs: <https://github.com/qdrant/mcp-server-qdrant>
- Qdrant product: <https://qdrant.tech/>
- Qdrant documentation: <https://qdrant.tech/documentation/>
- REST API spec: <https://raw.githubusercontent.com/qdrant/qdrant/master/openapi/openapi-main.ytt.yaml>
- License: Apache-2.0
