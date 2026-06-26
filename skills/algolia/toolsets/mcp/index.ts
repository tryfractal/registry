import { FractalToolset } from "@fractal-os/plugin";

/**
 * Algolia MCP toolset.
 *
 * Spawns the official `algolia/mcp` server (a Go binary built from
 * github.com/algolia/mcp/cmd/mcp) and exposes every Algolia tool it
 * provides. The server is invoked via `go run` so no build step is
 * required; for production use, build the binary once and point
 * `command` at the absolute path.
 *
 * Tool groups shipped by the server:
 *   - search          → all search operations (read + write)
 *   - search_read     → list indices, get settings, run queries, get objects
 *   - search_write    → clear, copy, move, delete, set settings, batch writes
 *   - analytics       → search analytics
 *   - abtesting       → A/B test management
 *   - collections     → federated search across grouped indices
 *   - monitoring      → index health and reachability
 *   - querysuggestions → autocomplete / popular searches
 *   - recommend       → recommend models and recommendations
 *   - usage           → operations consumed per billing period
 *
 * Set `MCP_ENABLED_TOOLS` to a comma-separated allowlist to restrict
 * which groups are exposed (for example, `search_read,analytics,usage`
 * for a read-only configuration).
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Algolia search and index management via the official algolia/mcp server. Exposes full-text search across Algolia indices, read/write of index settings (searchable attributes, ranking, faceting, custom ranking, synonyms, rules), batch record upsert/delete, A/B testing, search analytics, federated collections, monitoring, query suggestions, recommendations, and usage metrics. All 10 tool groups are enabled by default; scope down with MCP_ENABLED_TOOLS.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass an explicit `indexName` on every tool call. Do not rely on the ALGOLIA_INDEX_NAME default for operations that should target a specific index.",
    },
    {
      type: "always",
      instruction:
        "Prefer `partial_update_objects` over `save_objects` when the change is a field-level patch. `save_objects` replaces the entire record and will clobber attributes that are not in the payload.",
    },
    {
      type: "always",
      instruction:
        "Call `get_index_settings` and read the current value before calling `set_settings`. `set_settings` is a full replacement, not a merge — omitting a key removes it.",
    },
    {
      type: "always",
      instruction:
        "Page large result sets explicitly with `hitsPerPage` and walk pages with `page`. Do not request unbounded hits even when the dataset is small.",
    },
    {
      type: "always",
      instruction:
        "Use the search-only API key (ALGOLIA_API_KEY) for read operations and analytics. The admin key (ALGOLIA_WRITE_API_KEY) is only required for write operations and A/B test management.",
    },
    {
      type: "never",
      instruction:
        "Never write an admin API key, an application ID, or any other secret into a tool argument, a prompt, or a committed file. Secrets belong in the MCP server `env` block only.",
    },
    {
      type: "never",
      instruction:
        "Never call a write tool (save_objects, delete_objects, clear_objects, set_settings, copy_index, move_index, delete_index) without an explicit user instruction. Read tools are safe to call freely.",
    },
    {
      type: "never",
      instruction:
        "Never call `delete_index` on a production index. The operation is irreversible and removes both settings and every record.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "go",
    args: ["run", "github.com/algolia/mcp/cmd/mcp@latest"],
  })
  .build();
