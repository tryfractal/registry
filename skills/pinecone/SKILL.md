---
name: pinecone
description: >-
  Manage a Pinecone vector database from the agent through the official
  Pinecone Developer MCP server. Use this skill when the user wants to
  search Pinecone docs, list indexes, inspect index configuration, create
  a new serverless index with integrated inference (text embeddings),
  upsert records, run semantic search over an index, filter results by
  metadata, rerank documents, or cascade a query across multiple indexes.
  Triggers on phrases like "list all my Pinecone indexes", "create a new
  index called my-docs with the multilingual-e5-large model", "upsert
  these documents into my index", "search my index for records about
  authentication", "how many vectors are in this index", "rerank these
  search results", "delete stale records from my Pinecone index", or
  any request to build or query a vector search index on Pinecone. Use
  this skill even if the user says "use Pinecone", "query my vector DB",
  "do a semantic search", or "build a RAG index".
---

# Pinecone Skill

This skill exposes the official **Pinecone Developer MCP server** (`@pinecone-database/mcp`) as a single Fractal toolset. It gives the agent first-class access to both the Pinecone documentation and the user's own serverless indexes (with integrated inference for embeddings and reranking).

## Toolset

- `mcp` — Pinecone Developer MCP server (`@pinecone-database/mcp`). Connects over `stdio` via `npx` and requires Node.js v18+. The single required env var is `PINECONE_API_KEY`. If `PINECONE_API_KEY` is missing the documentation tools still work, but every index/data tool will fail with an authentication error.

## Prerequisites

| Requirement | Why |
|---|---|
| Node.js v18+ | The MCP server is a Node process spawned via `npx`. |
| `npx` on `PATH` | Used to download and run `@pinecone-database/mcp` on first launch. |
| Pinecone account + API key | Generate at <https://app.pinecone.io/>. Pass it as `PINECONE_API_KEY` in the toolset's `env`. |
| Network egress to `api.pinecone.io` | The server talks to the Pinecone control plane and (for data plane operations) to the index host. |

## Core tools (always available)

| Tool | What it does |
|---|---|
| `search-docs` | Search the official Pinecone documentation. Use this to answer Pinecone-specific questions authoritatively (metadata filtering, pod-vs-serverless, distance metrics, etc.) before guessing. |
| `list-indexes` | List every index in the project that the API key can see, with their basic configuration. |
| `describe-index` | Describe a single index: dimension, metric, host URL, spec, status, and the integrated-inference model (if any). |
| `describe-index-stats` | Return per-namespace vector counts and the total record count for an index. |
| `create-index-for-model` | Create a new serverless index that uses an integrated-inference model (e.g. `multilingual-e5-large`, `llama-text-embed-v2`, `pinecone-sparse-english-v0`) to embed text into vectors on the server side. |
| `upsert-records` | Insert or update records in an index that has integrated inference enabled. Pass plain text and (optionally) metadata — the server handles the embedding. |
| `search-records` | Semantic search over an index using integrated inference. Supports `topK`, metadata filters, and reranking. |
| `cascading-search` | Run a query across multiple indexes at once, deduplicate, and rerank the combined result set. |
| `rerank-documents` | Rerank an arbitrary list of records or text documents using a dedicated reranking model (e.g. `cohere-rerank-3.5`, `bge-reranker-v2-m3`). |

## Supported index types

The Pinecone Developer MCP server only operates on **indexes with integrated inference**. Plain serverless indexes (raw-vector storage, no built-in embedding model) are **not** supported by this toolset — you must create a new index via `create-index-for-model` first, or manage those indexes through a different client. The Pinecone Assistant MCP is a separate product designed for knowledge-base chat and is not bundled here either.

## Usage rules

- **Search docs before guessing.** If a user asks "how do I filter by metadata" or "what's the difference between cosine and dotproduct", call `search-docs` first. The official docs are the source of truth and the model otherwise hallucinates parameter names.
- **Use `list-indexes` before mutating.** Before creating, upserting, or searching, call `list-indexes` (and then `describe-index` if needed) to confirm the target index exists, is `Ready`, and uses integrated inference. A non-ready or non-inference index will return opaque errors from the data tools.
- **Always pass an explicit `namespace` for multi-tenant data.** Namespaces isolate data inside a single index. The default empty namespace is fine for prototypes, but production data should always be namespaced (e.g. by tenant id, by user, by environment).
- **Embed on the server, not the client.** With `create-index-for-model` indexes, send **plain text** in `upsert-records` and `search-records`. Do not pre-compute embeddings and send raw float vectors — the integrated-inference pipeline will reject them, and you lose the model's chunking and normalization.
- **Use metadata filters for pre-filtering, reranking for post-filtering.** The cheapest way to narrow a search is a metadata `filter` (e.g. `{ "tenant": "acme" }`). After the initial `topK` retrieval, pass the result to `rerank-documents` for a higher-quality final ordering.
- **Use `cascading-search` for multi-source RAG.** When a query might be answered by more than one index (e.g. product docs + support tickets), call `cascading-search` with the list of index names and let the server deduplicate + rerank.
- **Confirm deletes explicitly.** There is no dedicated delete tool in this server — deletions are performed by upserting records with new contents or via out-of-band API calls. Never claim "deleted" without verifying via `describe-index-stats`.
- **Respect rate limits.** Pinecone's control plane has per-project QPS limits. If a tool returns a 429, back off and retry; do not burst-loop `upsert-records`.

## Configuration

The toolset launches the server as:

```bash
npx -y @pinecone-database/mcp
```

The following env vars are read by the server process:

| Env var | Required | Purpose |
|---|---|---|
| `PINECONE_API_KEY` | Yes for any data operation | The Pinecone project API key. |
| `PINECONE_HOST` | No | The host URL of a specific index. Optional convenience for scripts that always talk to one index. |
| `PINECONE_INDEX_NAME` | No | The default index name. Optional convenience for scripts. |

`PINECONE_API_KEY` is the only variable that must be set. Without it, `search-docs` still works but every other tool will return an authentication error.

## Connection arguments

The default toolset ships with no extra flags. Common optional arguments you can append to the `args` list:

| Flag | Purpose |
|---|---|
| (none) | The server uses sensible defaults — no logging flag, no region override. |

If you need to pin a specific version (recommended for reproducible production installs), replace `-y @pinecone-database/mcp` with `-y @pinecone-database/mcp@<version>` in the toolset `args`.

## Common workflows

**Bootstrap a new RAG index in three steps:**

1. `create-index-for-model` with `name: "my-docs"`, `model: "llama-text-embed-v2"`, `cloud: "aws"`, `region: "us-east-1"`.
2. Poll `describe-index` until `status.ready == true`.
3. `upsert-records` in batches of ~100 records, each with `id`, `text`, and a `metadata` object (e.g. `{ "source": "handbook.pdf", "section": "auth" }`).

**Query a RAG index:**

1. `search-records` with the same `indexName`, a natural-language `query`, `topK: 25`, and a `filter` narrowing by metadata.
2. Pass the top results to `rerank-documents` with `model: "cohere-rerank-3.5"` and `topN: 5`.
3. Inject the reranked top-5 into the prompt as context.

**Audit an index:**

1. `list-indexes` to see what's there.
2. `describe-index-stats` per index to see namespace sizes.
3. `search-docs` if anything looks unexpected ("why is my index in `ScalingUp` state", "what does `pod_size: p2.x1` mean", etc.).

## Troubleshooting

- **"Invalid API key"** — the `PINECONE_API_KEY` is wrong, expired, or has stray quotes/whitespace. Re-copy it from the Pinecone console and make sure the env value has no surrounding `"` characters.
- **"Index not found"** — `list-indexes` is the canonical way to discover the real index name. Names are case-sensitive.
- **"Index not ready"** — newly created indexes take a few seconds to a few minutes to become `Ready`. Poll `describe-index` with a short backoff loop; do not call data tools on a non-ready index.
- **"Unsupported operation: integrated inference required"** — the target index does not have an embedding model attached. Recreate it with `create-index-for-model` instead of trying to upsert raw vectors.
- **MCP server does not appear in the client** — verify `node --version` is >= 18, `npx` is on `PATH`, and the toolset `args` are valid JSON. Run `PINECONE_API_KEY=... npx -y @pinecone-database/mcp` manually to surface stderr.
- **Corporate firewall** — allow outbound to `api.pinecone.io` and to the index host (`<index-name>-<project-slug>.svc.<region>.pinecone.io`).

## Security notes

- `PINECONE_API_KEY` is a **secret** — it can read, write, and delete every index in the project. Treat it like a database root password. Never echo it in chat output, never commit it, never log the full env dump.
- The MCP server runs as a child of the agent process and inherits the agent's permissions. Anyone who can prompt the agent can call every tool, so client-level tool permissions and human-in-the-loop approvals are the real boundary.
- Metadata values are **not** a sandbox — anything you put in metadata is queryable by anyone with the API key. Do not store PII, secrets, or regulated data in metadata fields.

## References

- Upstream repo: <https://github.com/pinecone-io/pinecone-mcp>
- npm package: <https://www.npmjs.com/package/@pinecone-database/mcp>
- Pinecone docs: <https://docs.pinecone.io/>
- Pinecone homepage: <https://www.pinecone.io/>
- License: Apache-2.0
