import { FractalToolset } from "@fractal-os/plugin";

/**
 * Qdrant MCP toolset.
 *
 * Spawns the official `mcp-server-qdrant` server (Python, FastMCP) and exposes
 * the semantic-memory tools it provides:
 *   - `qdrant-store` — embed and persist free-form text into a Qdrant collection
 *   - `qdrant-find`  — semantic search over the same collection
 *
 * Embeddings are produced locally through FastEmbed (default model
 * `sentence-transformers/all-MiniLM-L6-v2`); no external embedding API is
 * required. The collection declared in `COLLECTION_NAME` is auto-created on
 * first use, so the toolset is safe to launch against an empty cluster.
 *
 * Configuration is fully environment-driven. The only command-line argument
 * is `--transport`; everything else (Qdrant URL, API key, embedding model,
 * search limit, read-only mode) comes from the `env` block below. The two
 * `QDRANT_URL` and `QDRANT_LOCAL_PATH` variables are mutually exclusive.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Semantic memory backed by Qdrant through the official Qdrant MCP server. Exposes `qdrant-store` to embed and persist natural-language information (notes, code snippets, documents, conversations) and `qdrant-find` to retrieve it by meaning via cosine similarity. Embeddings are produced locally with FastEmbed. Works with Qdrant Cloud, a self-hosted Qdrant cluster, or a local on-disk Qdrant database.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass the natural-language content to remember in `information` and put any structured side-data (file path, URL, ticket ID, language tag) in `metadata` as a JSON object of strings. Do not stuff the whole document into one giant `information` payload — chunk long documents into meaningful paragraphs before storing.",
    },
    {
      type: "always",
      instruction:
        "Use `qdrant-find` (semantic search) for any recall task where exact keywords are not guaranteed to match. Only fall back to keyword search of local files when the user explicitly asks for a literal text grep.",
    },
    {
      type: "always",
      instruction:
        "Prefer the configured default collection (`COLLECTION_NAME`). If a user explicitly names a different collection, pass `collection_name`; otherwise omit it so the tool uses the default. Do not invent new collection names on the fly.",
    },
    {
      type: "always",
      instruction:
        "When the user asks to remember something for next time, immediately call `qdrant-store` with a concise, self-contained summary of the information — not a raw transcript. The stored text will be re-embedded and re-read by future agents.",
    },
    {
      type: "always",
      instruction:
        "After `qdrant-find` returns results, cite the retrieved items by quoting or paraphrasing their `information` text and surface any relevant `metadata` (source, URL, etc.) so the user can verify provenance.",
    },
    {
      type: "never",
      instruction:
        "Never call `qdrant-store` with secrets (API keys, passwords, tokens, PII) inside `information` or `metadata`. Embeddings are persisted; treat the collection as world-readable to any future agent that has access.",
    },
    {
      type: "never",
      instruction:
        "Never set both `QDRANT_URL` and `QDRANT_LOCAL_PATH` at the same time — the server will refuse to start. Pick exactly one: cloud/self-hosted cluster URL OR local on-disk path.",
    },
    {
      type: "never",
      instruction:
        "Never change `EMBEDDING_MODEL` after points have been stored without migrating the collection. Different models produce different vector dimensions and a silent swap will make old points unreachable.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "uvx",
    args: ["mcp-server-qdrant"],
    env: {
      // Connection — set exactly ONE of QDRANT_URL or QDRANT_LOCAL_PATH.
      QDRANT_URL: process.env.QDRANT_URL ?? "",
      QDRANT_API_KEY: process.env.QDRANT_API_KEY ?? "",
      // Default collection. Auto-created on first use.
      COLLECTION_NAME: process.env.QDRANT_COLLECTION ?? "agent-memory",
      // Local embeddings via FastEmbed. Pin the model for reproducibility.
      EMBEDDING_PROVIDER: "fastembed",
      EMBEDDING_MODEL:
        process.env.QDRANT_EMBEDDING_MODEL ??
        "sentence-transformers/all-MiniLM-L6-v2",
      // Retrieval budget.
      QDRANT_SEARCH_LIMIT: process.env.QDRANT_SEARCH_LIMIT ?? "10",
      // Read-only deployments should set this to "true" to hide qdrant-store.
      QDRANT_READ_ONLY: process.env.QDRANT_READ_ONLY ?? "false",
    },
  })
  .build();
