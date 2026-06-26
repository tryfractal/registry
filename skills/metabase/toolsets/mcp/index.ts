import { FractalToolset } from "@fractal-os/plugin";

/**
 * Metabase MCP toolset.
 *
 * Spawns the official `metabase-mcp-server` from the Metabase team and
 * exposes every tool it provides: list/search databases, tables, fields,
 * questions, and dashboards; run saved questions; execute ad-hoc SQL or
 * MBQL queries; manage cards; export results as CSV / JSON / XLSX.
 *
 * Connection is stdio-by-default. Set the env vars below before spawning
 * (METABASE_URL plus either METABASE_API_KEY or METABASE_USERNAME /
 * METABASE_PASSWORD). Add `--read-only` to `args` to disable every
 * mutation tool.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read and write the connected Metabase instance through the official Metabase MCP server. Lists databases, tables, fields, questions, dashboards, and collections; searches the data model; runs saved questions; executes ad-hoc SQL or MBQL queries; creates / updates questions, dashboards, and cards; exports results as CSV, JSON, or XLSX.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Prefer the Metabase API key (`METABASE_API_KEY`) over a username / password pair whenever a key is available. Keys are scoped, rotatable, and never expose the user password to the agent.",
    },
    {
      type: "always",
      instruction:
        "Use `search` before any `list_*` call to avoid scanning every database, table, or field on a large warehouse. Search is dramatically cheaper than enumeration.",
    },
    {
      type: "always",
      instruction:
        "Prefer `run_question` over `execute_query` for known questions. A saved question is version-controlled, reusable, and respects the permissions its author had. Reserve `execute_query` for genuinely ad-hoc questions.",
    },
    {
      type: "always",
      instruction:
        "Use the integer `id` returned by `list_*` / `get_*` (not the human-readable name) when chaining calls. Names are not unique; ids are the only stable handle.",
    },
    {
      type: "always",
      instruction:
        "Default to a `LIMIT 1000` clause on any exploratory `execute_query` call. Use the question-level download only when the user explicitly asks for a full export.",
    },
    {
      type: "always",
      instruction:
        "Pass parameters to `run_question` by field slug (e.g. `{\"start_date\": \"2024-01-01\"}`), not by position. Position-based parameters are fragile across question edits.",
    },
    {
      type: "never",
      instruction:
        "Never call `create_question`, `update_question`, `create_dashboard`, `add_card_to_dashboard`, or `archive_question` without explicit user confirmation. Metabase mutations are not undoable from the API.",
    },
    {
      type: "never",
      instruction:
        "Never use `export_results` to inspect a question's output. Call `run_question` and read the rows inline instead. Export only when the user asks for a file deliverable (CSV / XLSX / JSON).",
    },
    {
      type: "never",
      instruction:
        "Never run a `select *` against a warehouse table — it can return millions of rows and blow up the context window. Call `get_table` or `list_fields` first, then add an explicit `LIMIT`.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "metabase-mcp-server",
      "--transport",
      "stdio",
    ],
  })
  .build();
