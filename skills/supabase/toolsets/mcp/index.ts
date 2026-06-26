import { FractalToolset } from "@fractal-os/plugin";

/**
 * Supabase MCP toolset.
 *
 * Connects to the official `supabase-mcp` server (`@supabase/mcp-server-supabase`)
 * and exposes every Supabase operation it supports: account & organization
 * management, project lifecycle, database introspection, SQL execution,
 * migrations, type generation, edge function lifecycle, storage inspection,
 * database branches, log retrieval, security/performance advisors, and live
 * documentation search.
 *
 * Transport strategy:
 *   - Hosted endpoint: `https://mcp.supabase.com/mcp` (OAuth 2.1 — the user is
 *     prompted to log in on first connection). Add `?project_ref=...`,
 *     `?read_only=true`, and `?features=...` to scope the session.
 *   - Local Supabase CLI: `http://localhost:54321/mcp` (limited tool subset,
 *     no OAuth) — switch the URL in the connection block when developing
 *     against `supabase start`.
 *
 * For unattended / headless / CI use, set `SUPABASE_ACCESS_TOKEN` and the
 * toolset forwards it as a bearer header.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Supabase project, database, auth, storage, edge function, and realtime management through the official Supabase MCP server. Connects to the hosted endpoint (OAuth 2.1) or a local Supabase CLI instance, and exposes account tools, project lifecycle, table/extension/migration introspection, SQL execution, TypeScript type generation, edge function deploy, storage config, log + advisor retrieval, and experimental database branches.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use `apply_migration` for DDL (schema changes, table creation, RLS policies) so the database tracks the migration. Use `execute_sql` for DML (SELECT / INSERT / UPDATE / DELETE) and for ad-hoc queries that do not change the schema.",
    },
    {
      type: "always",
      instruction:
        "Default to read-only mode (`?read_only=true` on the MCP URL) and project scoping (`?project_ref=<ref>`) unless the user explicitly asks for mutations. Read-only mode runs SQL as a read-only Postgres user and disables every mutating tool.",
    },
    {
      type: "always",
      instruction:
        "Call `get_cost` and then `confirm_cost` before `create_project` or `create_branch` — both operations bill the user's account and are irreversible.",
    },
    {
      type: "always",
      instruction:
        "Never point the MCP server at a project that contains real user data. Use a dedicated development project, or create a database branch with `create_branch`, before running any mutating operation.",
    },
    {
      type: "always",
      instruction:
        "When `search_docs` returns an answer, surface the version or release it refers to so the user can verify the answer is current. The MCP server is pre-1.0, so call signatures may drift.",
    },
    {
      type: "never",
      instruction:
        "Never call `execute_sql` with a `DROP`, `TRUNCATE`, `DELETE FROM` without a WHERE clause, `UPDATE` without a WHERE clause, or any DDL statement that has not first gone through `apply_migration` (or been explicitly confirmed by the user for a one-off teardown).",
    },
    {
      type: "never",
      instruction:
        "Do not enable the `storage` or `branching` feature groups by default. The `branching` group is experimental, requires a paid plan, and `update_storage_config` is also paid. Enable them only when the user explicitly asks for storage config or branch management.",
    },
    {
      type: "never",
      instruction:
        "Do not embed the Supabase MCP server in a customer-facing app. The server operates under the user's developer permissions and is intended as an internal developer tool only.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.supabase.com/mcp",
    headers: process.env.SUPABASE_ACCESS_TOKEN
      ? { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}` }
      : undefined,
  })
  .build();
