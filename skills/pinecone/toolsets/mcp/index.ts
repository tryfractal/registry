import { FractalToolset } from "@fractal-os/plugin";

/**
 * Pinecone Developer MCP toolset.
 *
 * Spawns the official `@pinecone-database/mcp` server and exposes every tool
 * Pinecone ships for documentation search and for managing serverless indexes
 * with integrated inference (create / describe / upsert / search / rerank /
 * cascading-search).
 *
 * The server is launched via `npx -y @pinecone-database/mcp` and reads the
 * `PINECONE_API_KEY` env var. Without an API key the documentation tools
 * still work, but every index/data tool will fail with an auth error.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Vector database access via the official Pinecone Developer MCP server. Search Pinecone documentation, list and describe indexes, create serverless indexes with integrated inference, upsert and semantically search records, rerank results with a dedicated reranker, and run cascading queries across multiple indexes.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Call `search-docs` before answering any Pinecone-specific question (metadata filtering syntax, distance metrics, pod-vs-serverless, region availability, etc.) — the official docs are the source of truth and the model otherwise hallucinates parameter names.",
    },
    {
      type: "always",
      instruction:
        "Call `list-indexes` (and then `describe-index` if needed) before any mutating or data operation to confirm the target index exists, is `Ready`, and uses integrated inference.",
    },
    {
      type: "always",
      instruction:
        "Send plain text in `upsert-records` and `search-records` against indexes created with `create-index-for-model` — the integrated-inference pipeline owns embedding, chunking, and normalization. Do not pre-compute raw float vectors.",
    },
    {
      type: "always",
      instruction:
        "Pass an explicit `namespace` for any multi-tenant, multi-user, or multi-environment data. The default empty namespace is only acceptable for throwaway prototypes.",
    },
    {
      type: "always",
      instruction:
        "Combine a metadata `filter` (pre-filter) with `rerank-documents` (post-filter rerank) for production-quality retrieval: filter cheaply first, then rerank the top-K down to the final top-N.",
    },
    {
      type: "never",
      instruction:
        "Never echo, log, or commit the value of `PINECONE_API_KEY`. It is a project-level secret that can read, write, and delete every index in the project — treat it like a database root password.",
    },
    {
      type: "never",
      instruction:
        "Never call data tools (upsert, search, describe-index-stats) on an index that does not have integrated inference enabled. Recreate it with `create-index-for-model` instead of trying to upsert raw vectors.",
    },
    {
      type: "never",
      instruction:
        "Never claim a record was deleted without verifying the namespace's vector count via `describe-index-stats`. This server exposes no dedicated delete tool, so deletion must be confirmed out-of-band or by a successful upsert-overwrite followed by a stats check.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@pinecone-database/mcp"],
    env: {
      PINECONE_API_KEY: "${PINECONE_API_KEY}",
    },
  })
  .build();
