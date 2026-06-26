import { FractalToolset } from "@fractal-os/plugin";

/**
 * PostgreSQL MCP toolset.
 *
 * Spawns the official `@modelcontextprotocol/server-postgres` server and exposes
 * its read-only tools (`query`, `get_object_details`, `list_objects`,
 * `get_table_stats`, etc.) plus the schema resources. The server is hard-coded
 * to run every statement inside a `READ ONLY` transaction — it cannot mutate
 * data unless `--allow-execute-sql` is added to the args.
 *
 * The connection string is read from `DATABASE_URI` / `POSTGRES_URL` in the
 * workspace environment, or appended to `args` as the first positional DSN.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read-only access to a PostgreSQL database through the official Model Context Protocol PostgreSQL server. Run ad-hoc SQL, list tables, describe schemas, inspect indexes and foreign keys, sample rows, and analyze query plans. All queries execute inside a server-enforced READ ONLY transaction.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Read the schema (`get_object_details` resource) for every table referenced in a `FROM` or `JOIN` clause before writing a query — column names, types, and nullability must come from the live database, not from memory.",
    },
    {
      type: "always",
      instruction:
        "Prefer the `query` tool for everything that fits in a single SQL statement. It is the only tool that is guaranteed to be enabled and is hard-coded to be read-only at the protocol level.",
    },
    {
      type: "always",
      instruction:
        "Cap result sets with `LIMIT` (a sane ceiling is 1,000 rows) and use `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for any query-plan inspection request. Quote identifiers with double quotes and bind values with `$1`, `$2` placeholders.",
    },
    {
      type: "always",
      instruction:
        "Use `ILIKE` for case-insensitive text matches and `to_regclass('schema.table')` to verify a table exists before referencing it. For sizes, prefer `pg_size_pretty(pg_total_relation_size(...))` rather than raw byte counts.",
    },
    {
      type: "always",
      instruction:
        "Treat `DATABASE_URI` / `POSTGRES_URL` and any DSN as a secret. Never echo the full DSN back to the user, never include it in a query string, and rely on the workspace secret store to persist it.",
    },
    {
      type: "never",
      instruction:
        "Never call `query` (or any other tool) with a write statement — `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `VACUUM`, `COPY … FROM`, and any extension that mutates data are rejected by the server.",
    },
    {
      type: "never",
      instruction:
        "Never enable `--allow-execute-sql` or `--allow-non-readonly-functions` in environments exposed to untrusted input. If the user needs a write, draft the SQL for human review and require explicit approval before execution.",
    },
    {
      type: "never",
      instruction:
        "Never invent a schema, a column name, an index, or a foreign-key relationship. If the schema is unknown, fetch it from the database first — do not guess.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres@latest"],
  })
  .build();
