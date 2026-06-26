---
name: postgres
description: >-
  Query and inspect a PostgreSQL database from the agent through the
  official PostgreSQL MCP server. Use this skill when the user wants to run
  SQL, list tables, describe a table schema, look up columns and data types,
  check row counts, sample data, pull aggregates, debug a slow query,
  inspect foreign keys or indexes, generate CRUD statements from a schema,
  or analyze query execution plans. Triggers on phrases like "query the
  users table in Postgres", "show me the schema for the orders database",
  "how many rows are in events", "what columns does the customers table
  have", "find the foreign keys on invoices", "run this SQL against my
  staging Postgres", "list all tables in the analytics schema", "explain
  the query plan for this SELECT", "create an index on users.email",
  "import this CSV into a new Postgres table", or any request to read,
  query, or describe a PostgreSQL database. Use this skill even if the
  user says "ask the database" or "query Postgres".
---

# PostgreSQL Skill

This skill exposes the **official Model Context Protocol PostgreSQL server** (`@modelcontextprotocol/server-postgres` on npm) as a single Fractal toolset. The server connects to a PostgreSQL database using a standard `postgresql://` connection string and surfaces every read-only tool the MCP server provides.

## Toolset

- `mcp` — PostgreSQL MCP server (`@modelcontextprotocol/server-postgres@latest`). Connects over `stdio`, runs every query inside a **read-only transaction**, and auto-discovers each table's schema as a resource. The connection string is passed as the first CLI argument (e.g. `postgresql://user:pass@host:5432/dbname`) or via the `DATABASE_URI` / `POSTGRES_URL` environment variable.

## Core tools

| Tool | What it does |
|---|---|
| `query` | Execute a single **read-only** SQL statement against the connected database. The server refuses writes (no `INSERT`, `UPDATE`, `DELETE`, `DROP`, `ALTER`, `TRUNCATE`, `CREATE`, `GRANT`, `REVOKE`, `VACUUM`, `COPY … FROM`, etc.). All queries are wrapped in a `READ ONLY` transaction. Input: `sql` (string). |
| `list_schemas` (resource template) | List every schema in the connected database. The `postgres://schemas` resource returns the available schemas. |
| `list_objects` (resource template) | List every object (tables, views, materialized views, foreign tables, sequences) inside a given schema. Accessed via the `postgres://<host>/<schema>/objects` resource. |
| `get_object_details` (resource template) | Return the columns, data types, nullability, defaults, indexes, and constraints for a specific table or view. Accessed via `postgres://<host>/<schema>/<object>/schema`. |
| `get_table_stats` (resource template) | Return per-table row estimates, table size, index size, and last-analyze / last-vacuum timestamps when the `pg_stat_*` views are accessible. |
| `execute_sql` (resource template, opt-in) | Resource template for executing parameterized SQL. Disabled by default for safety; enable with `--allow-execute-sql` (or its `PG_MCP_ALLOW_EXECUTE_SQL` environment-variable equivalent) only when read-only `query` is not enough. |

> Tool names are auto-discovered by the Fractal toolset at load time. Run `fractal toolsets get postgres::mcp` after install to see the exact tool surface for the version of `@modelcontextprotocol/server-postgres` currently installed in the workspace.

## Usage rules

- **Always read the schema before writing a query.** Call `get_object_details` for every table referenced in a `FROM` or `JOIN` clause so column names, types, and nullability are correct. Guessing schema is the #1 cause of broken SQL.
- **Use `query` for everything you can.** It is the only tool that is guaranteed to be enabled and is hard-coded to be read-only. Reach for `execute_sql` only when `query` is genuinely insufficient.
- **Never pass write statements to `query`.** They will be rejected. If the user wants to mutate data, confirm with them first and then re-run with the `execute_sql` capability explicitly enabled — but stay inside a transaction and use `BEGIN; … ROLLBACK;` for any exploratory work.
- **Use `ILIKE` for case-insensitive text searches** (e.g. `SELECT id, email FROM users WHERE email ILIKE '%@example.com'`) and `LIMIT` to cap large result sets (`SELECT * FROM events ORDER BY created_at DESC LIMIT 100`). The MCP server does not stream — `LIMIT 10_000` is a sane ceiling for "show me everything" requests.
- **Prefer `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON)` for query-plan inspection.** Wrap the user's query in an `EXPLAIN` and parse the JSON plan from the result. Do not invent plans from memory.
- **Quote identifiers with double quotes and bind values with `$1`, `$2` placeholders.** Use `to_regclass('public.users')` to verify a table exists before referencing it. Use `pg_size_pretty(pg_total_relation_size('public.users'))` when reporting sizes.
- **Never embed the user's connection string in a query or log line.** Treat `DATABASE_URI` / `POSTGRES_URL` as a secret — redact it in tool responses with a redactor when present, and never echo it back to the user.
- **For migrations, generate a transaction-wrapped script and have a human run it.** The MCP tool is read-only by design; even when `execute_sql` is enabled, treat any `ALTER` / `CREATE` / `DROP` as a draft and require explicit human approval before execution.

## Configuration

Pass the database connection string as the **first positional argument** to the MCP server, or set one of the standard environment variables before launching.

| Method | Example |
|---|---|
| CLI arg | `npx -y @modelcontextprotocol/server-postgres@latest postgresql://user:pass@db.example.com:5432/app` |
| `DATABASE_URI` env | `DATABASE_URI=postgresql://user:pass@db.example.com:5432/app npx -y @modelcontextprotocol/server-postgres@latest` |
| `POSTGRES_URL` env | `POSTGRES_URL=postgresql://user:pass@db.example.com:5432/app npx -y @modelcontextprotocol/server-postgres@latest` |

Supported DSN shapes:

- `postgresql://user:password@host:5432/dbname`
- `postgres://user:password@host:5432/dbname`
- `postgresql://user:password@host:5432/dbname?sslmode=require` (managed Postgres — Neon, Supabase, RDS, Cloud SQL, etc.)
- `postgresql+srv://…` (when behind a service-discovery proxy that supports the `+srv` scheme)

The MCP server **does not** manage the database, its schema, its users, or its connection pool. It only opens a short-lived connection per tool call and tears it down when the tool returns.

## Connection arguments

The toolset's default `args` invoke the server with no positional DSN — the user is expected to set `DATABASE_URI` (or `POSTGRES_URL`) in the workspace environment, or to add the DSN as a first argument. To bake a DSN into the toolset connection, edit `toolsets/mcp/index.ts` and add it as the last entry in the `args` array:

```ts
.withConnection({
  type: "mcp-server::stdio",
  command: "npx",
  args: [
    "-y",
    "@modelcontextprotocol/server-postgres@latest",
    "postgresql://user:pass@db.example.com:5432/app",
  ],
})
```

| Flag | Purpose |
|---|---|
| First positional DSN | The connection string the server will use. Equivalent to `DATABASE_URI`. |
| `--allow-execute-sql` | Enable the `execute_sql` resource template for parameterized writes. **Off by default.** |
| `--allow-non-readonly-functions` | Permit calls to volatile / mutating SQL functions (e.g. `nextval`, `gen_random_uuid()`). Default: **read-only**. |
| `--row-limit <n>` | Cap the maximum row count returned by `query` and the schema resources. Default: `1000`. |
| `--pool-max <n>` | Maximum concurrent connections the server will open. Default: `10`. |
| `--statement-timeout <ms>` | Server-side `statement_timeout` (in milliseconds) applied to every query. Default: `30000` (30 s). |
| `--idle-timeout <ms>` | Close idle connections after this many milliseconds. Default: `600000` (10 min). |
| `--dump-config` | Print the resolved configuration and exit. Useful for debugging. |

## Security notes

- The server is **read-only by default**. The `READ ONLY` transaction is enforced server-side, not by string-matching the input — even novel write expressions (e.g. via `pg_read_binary_file` or extension functions) are rejected at the protocol level.
- The DSN carries credentials. Store it in the workspace secret store, never in `args`. The Fractal connection runtime redacts the value from tool responses, but a leaked DSN is still a leaked DSN.
- The server runs with the privileges of the DSN role. Use a **least-privilege role** in production — read access to the specific schemas the agent needs, `SELECT` on `pg_catalog` and `information_schema` if you want schema resources, and nothing else.
- `execute_sql` is gated behind a CLI flag. Do not enable it in environments where the agent is exposed to untrusted input.

## When NOT to use this skill

- The data source is not PostgreSQL (MySQL, SQLite, MongoDB, BigQuery, Snowflake, etc.). Use a different skill.
- The user wants to **mutate** Postgres data. The MCP tool is read-only by design; reach for a migration tool, a dedicated DBA workflow, or enable `execute_sql` deliberately.
- The user wants to manage the Postgres **server itself** (replication, vacuum, configuration tuning, role grants). This skill is for querying, not for DB administration.
- The user wants a schema diff, a migration plan, or a generated migration script. Use this skill to *describe* both sides, then use a migration tool to *plan* the change.

## References

- Upstream server: <https://github.com/modelcontextprotocol/servers>
- npm package: <https://www.npmjs.com/package/@modelcontextprotocol/server-postgres>
- PostgreSQL docs: <https://www.postgresql.org/docs/>
- License: MIT
