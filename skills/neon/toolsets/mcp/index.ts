import { FractalToolset } from "@fractal-os/plugin";

/**
 * Official Neon MCP toolset.
 *
 * Connects to the remote Neon MCP server at `https://mcp.neon.tech/mcp`
 * (Streamable HTTP transport, maintained by the Neon team). Authenticates
 * either via OAuth (default — opens a browser on first use) or via a
 * `NEON_API_KEY` Bearer token.
 *
 * Exposes every Neon tool category by default:
 *   - projects      → list / describe / create / delete projects
 *   - branches      → create / describe / reset / compare branches
 *   - schema        → list tables, describe schemas, compare diffs
 *   - querying      → run_sql, run_sql_transaction, explain, slow queries
 *   - neon_auth     → provision Neon Auth
 *   - data_api      → provision the Neon Data API
 *   - docs          → list / fetch Neon documentation pages
 *
 * Append `?readonly=true`, `?projectId=<id>`, or `?category=<list>` to the
 * URL to scope down to a read-only or single-project view.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Manage serverless Postgres on Neon (projects, branches, schemas, SQL, migrations, Auth, Data API, and docs) through the official remote Neon MCP server. Connects to https://mcp.neon.tech/mcp via Streamable HTTP — OAuth on first use, or a `NEON_API_KEY` Bearer token for headless / CI.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass an explicit `projectId` (and `branchId` when relevant) on every call. Falling back to the server's 'last used' heuristic produces surprising results when several projects share a name.",
    },
    {
      type: "always",
      instruction:
        "Prefer the two-phase migration flow: call `prepare_database_migration` to apply the change on a temporary branch, test it, then call `complete_database_migration` to merge into the main branch. Never run a destructive schema change against `main` directly.",
    },
    {
      type: "always",
      instruction:
        "Use `compare_database_schema` to review the exact diff between a migration branch and its parent before calling `complete_database_migration` — it is the canonical pre-commit check.",
    },
    {
      type: "always",
      instruction:
        "For multi-statement writes, use `run_sql_transaction` instead of repeated `run_sql` calls. A single transaction guarantees atomicity and gives a clean rollback on error.",
    },
    {
      type: "always",
      instruction:
        "When investigating query performance, call `explain_sql_statement` first — it is cheaper than `list_slow_queries` and works on a single statement. Only escalate to `list_slow_queries` when you need a global view (it requires the `pg_stat_statements` extension).",
    },
    {
      type: "always",
      instruction:
        "Before describing a table, call `get_database_tables` to discover its name and schema — `describe_table_schema` requires both.",
    },
    {
      type: "never",
      instruction:
        "Never call `create_project` or `delete_project` without first confirming the project name and region with the user — `delete_project` is irreversible and removes every branch, database, role, and compute.",
    },
    {
      type: "never",
      instruction:
        "Never print, log, or echo a connection string returned by `get_connection_string` into a chat transcript. Treat it like a password; if it is ever exposed, rotate the role's password in the Neon Console immediately.",
    },
    {
      type: "never",
      instruction:
        "Never run a non-read-only `run_sql` (or any write tool) when the connection is scoped with `?readonly=true`. The remote server enforces read-only mode at the tool level — read-only is a real safety net, not a hint.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.neon.tech/mcp",
  })
  .build();
