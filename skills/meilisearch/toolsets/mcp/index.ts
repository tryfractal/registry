import { FractalToolset } from "@fractal-os/plugin";

/**
 * Official Meilisearch MCP toolset.
 *
 * Spawns the `meilisearch-mcp` Python package (installed on demand via `uvx`)
 * and exposes the full Meilisearch feature surface to the agent:
 *   - connection management  (switch URL / API key at runtime)
 *   - index CRUD + metrics
 *   - document add / fetch
 *   - search (typo-tolerant, multi-index, hybrid keyword + vector)
 *   - settings (ranking, faceting, filtering, typo tolerance, embedders)
 *   - API key CRUD
 *   - task monitoring (enqueue / processing / succeeded / failed / canceled)
 *   - system health, version, stats
 *
 * The server connects to the Meilisearch instance whose URL is in
 * `MEILI_HTTP_ADDR` and authenticates with `MEILI_MASTER_KEY`. In development
 * the toolset defaults to `http://localhost:7700` with no API key.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Meilisearch management and search via the official `meilisearch-mcp` server. Exposes index CRUD, document add / get, typo-tolerant and hybrid (keyword + vector) search, settings tuning (ranking, faceting, filtering, typo tolerance, embedders), API key management, task monitoring, and system health against any Meilisearch instance — local Docker, self-hosted, or Meilisearch Cloud.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use `get-connection-settings` before the first call in a session to confirm the active Meilisearch URL and API key. If the user mentions a different instance (local, staging, Cloud), call `update-connection-settings` to switch.",
    },
    {
      type: "always",
      instruction:
        "When the user wants to add or update documents, batch them in a single `add-documents` call — never loop one document at a time. Use chunked batches of 10–50k documents for large imports.",
    },
    {
      type: "always",
      instruction:
        "Every write operation returns a `taskUid`. When the next read depends on the write completing (e.g. add documents → search them, update settings → reindex), poll `get-task` with that UID (or `get-tasks` filtered by `indexUids`) until `status` is `succeeded`.",
    },
    {
      type: "always",
      instruction:
        "When debugging empty results or stalled indexing, run `get-health-status` and `get-stats` first, then inspect recent tasks with `get-tasks`, before re-indexing or recreating the index.",
    },
    {
      type: "always",
      instruction:
        "Configure the minimum set of `filterableAttributes` and `sortableAttributes` needed by the user's filters and sorts — every attribute listed there costs memory and slows indexing.",
    },
    {
      type: "never",
      instruction:
        "Never point the toolset at a Meilisearch instance you do not own or control. The master key grants full read / write / delete access to every index the key can see.",
    },
    {
      type: "never",
      instruction:
        "Never log, echo, or include `MEILI_MASTER_KEY` (or any other Meilisearch API key) in tool responses, comments, or commit messages. Treat it as a database root password.",
    },
    {
      type: "never",
      instruction:
        "Never call `delete-index` or `delete-key` without explicit user confirmation in the same turn. Both are destructive and irrecoverable from the agent side.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "uvx",
    args: ["-n", "meilisearch-mcp"],
  })
  .build();
