---
name: supabase
description: >-
  Manage Supabase projects, Postgres databases, auth, storage, edge
  functions, and realtime APIs through the official Supabase MCP server.
  Use this skill when the user wants to list or inspect projects; run SQL
  queries or migrations; view tables, extensions, and schemas; generate
  TypeScript types from the database; deploy edge functions; configure
  storage buckets; read service logs; manage database branches (create,
  merge, rebase, delete); or search Supabase docs. Triggers on phrases
  like "list my Supabase projects", "show the tables", "run this SQL",
  "generate types", "deploy an edge function", "create a dev branch",
  or any request to inspect or mutate a Supabase backend. Use this skill
  even when the user just says "use supabase" or asks about auth,
  storage, or realtime.
---

# Supabase Skill

This skill exposes the official **Supabase MCP server** as a single Fractal toolset. It connects the agent to a Supabase organization, project, or local Supabase CLI instance and lets it run every operation the hosted MCP server supports: account & project management, database introspection, SQL execution, migrations, type generation, edge-function lifecycle, storage inspection, branch management, log retrieval, advisor checks, and live documentation search.

The server is **pre-1.0** — minor breaking changes between versions are expected. Because LLMs adapt to the tool list at runtime, this is normally invisible to the user.

## Toolset

- `mcp` — Supabase MCP server. Connects to the hosted endpoint `https://mcp.supabase.com/mcp` by default, or to a local Supabase CLI instance at `http://localhost:54321/mcp` when one is running.

## Authentication

On first connection the MCP client opens a browser to OAuth the user into Supabase. The server then acts with the permissions of the user's account. For unattended, headless, or local-CLI usage, set the `SUPABASE_ACCESS_TOKEN` environment variable to a personal access token and the toolset will fall back to that token.

If you only need to talk to a single project's database directly (bypassing the Management API), the local server also accepts `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` (or the legacy `SUPABASE_DB_URL` / `SUPABASE_ANON_KEY`) in the environment.

## Core tools (always available)

| Tool | What it does |
|---|---|
| `list_projects` | List every Supabase project in the authenticated account. |
| `get_project` | Fetch a project's metadata (region, status, version, DB version). |
| `create_project` | Create a new project. Requires a prior `get_cost` + `confirm_cost` call. |
| `pause_project` | Pause a project (stops billing compute, retains data). |
| `restore_project` | Resume a paused project. |
| `list_organizations` | List organizations the user belongs to. |
| `get_organization` | Get one organization's metadata. |
| `get_cost` | Quote the cost of creating a new project or branch. |
| `confirm_cost` | Confirm the cost before `create_project` / `create_branch` proceeds. |
| `search_docs` | Search the official Supabase docs for up-to-date API references. |
| `list_tables` | List tables within specified schemas (`pg_catalog`, `public`, etc.). |
| `list_extensions` | List installed Postgres extensions. |
| `list_migrations` | List migration files already applied to the database. |
| `apply_migration` | Apply a SQL migration (use for **DDL** — schema changes are tracked). |
| `execute_sql` | Execute raw SQL (use for **DML** — queries that do not change schema). |
| `get_logs` | Get logs by service: `api`, `postgres`, `edge-functions`, `auth`, `storage`, `realtime`. |
| `get_advisors` | Run Supabase security & performance advisors on a project. |
| `get_project_url` | Return the API URL for a project. |
| `get_publishable_keys` | Return client-safe keys (modern publishable + legacy anon). |
| `generate_typescript_types` | Generate TypeScript types from the database schema. |
| `list_edge_functions` | List every edge function in a project. |
| `get_edge_function` | Retrieve an edge function's source files. |
| `deploy_edge_function` | Deploy a new or updated edge function to a project. |
| `create_branch` | Create a dev database branch from production (paid plan, experimental). |
| `list_branches` | List database branches for a project. |
| `delete_branch` | Delete a database branch. |
| `merge_branch` | Merge a branch's migrations + edge functions into production. |
| `reset_branch` | Reset a branch's migrations to a prior version. |
| `rebase_branch` | Rebase a branch on top of production to handle migration drift. |
| `list_storage_buckets` | List storage buckets in a project. |
| `get_storage_config` | Read the project's storage configuration. |
| `update_storage_config` | Update the project's storage configuration (paid plan). |

## Tool groups (`features`)

Tools are organized into groups. Pass the `features` query parameter to the MCP URL to enable or disable groups. The defaults are: `account`, `database`, `debugging`, `development`, `docs`, `functions`, `branching`.

| Group | Tools it contains | Default |
|---|---|---|
| `account` | Project & organization management | on (only when not `project_ref`-scoped) |
| `docs` | `search_docs` | on |
| `database` | Tables, extensions, migrations, SQL | on |
| `debugging` | `get_logs`, `get_advisors` | on |
| `development` | Project URL, keys, type generation | on |
| `functions` | Edge function lifecycle | on |
| `branching` | Database branches (paid plan) | on |
| `storage` | Bucket & config management | **off** (enable with `?features=storage`) |

Example minimal URL: `https://mcp.supabase.com/mcp?project_ref=<ref>&read_only=true&features=database,docs`.

## Usage rules

- **Use `apply_migration` for DDL, `execute_sql` for DML.** Schema changes go through `apply_migration` so the database tracks them; ad-hoc reads and writes go through `execute_sql`.
- **Default to read-only mode.** Pass `?read_only=true` on the MCP URL unless the task is explicitly about mutating state. In read-only mode all SQL is executed as a read-only Postgres user and every mutating tool is disabled.
- **Default to project scoping.** Pass `?project_ref=<ref>` to restrict the server to a single project. Otherwise the server can see every project in the account.
- **Never connect to production data.** Use a development project, or a development branch, that contains non-production data. The MCP server operates under the user's developer permissions and is not safe to expose to customers.
- **Quote costs before creating.** Always call `get_cost` and then `confirm_cost` before `create_project` or `create_branch` — these actions bill the user's account and are irreversible.
- **Cite the docs version.** When `search_docs` returns an answer, surface the version or release it refers to so the user can verify currency.
- **For self-hosted Supabase**, point the toolset at your own `/mcp` endpoint and accept that only a subset of tools (no OAuth 2.1) is available.
- **For local development** with the Supabase CLI, the server runs at `http://localhost:54321/mcp` with a limited tool subset and no OAuth flow.

## Configuration

| Env var | Purpose |
|---|---|
| `SUPABASE_ACCESS_TOKEN` | Personal access token used when OAuth is unavailable (headless, CI, local CLI). |
| `SUPABASE_URL` | Direct Postgres/PostgREST URL for a single project. |
| `SUPABASE_SERVICE_ROLE_KEY` | Service-role key paired with `SUPABASE_URL` for direct DB access. |
| `SUPABASE_DB_URL` | (Legacy) Direct Postgres connection string. |
| `SUPABASE_ANON_KEY` | (Legacy) Anon key paired with `SUPABASE_DB_URL`. |

If `SUPABASE_ACCESS_TOKEN` is set, the toolset forwards it as a bearer token to the hosted MCP endpoint. If only the direct-DB env vars are set, the toolset connects to a local stdio shim of `@supabase/mcp-server-supabase` against the supplied project.

## Security notes

- The MCP server is **not a security boundary**. Prompt-injection in user-supplied content (rows, tickets, support messages) can cause the LLM to run arbitrary SQL on the user's behalf. Always keep client-level "confirm before tool call" enabled and review every mutation.
- Scoped + read-only + dev-branch is the safest default. Enable write tools only when the task requires them.
- The `branching` group is experimental and requires a paid plan — gate it behind `?features=database,docs,branching` until the user explicitly asks for branches.
- Do not embed the MCP connection in customer-facing apps. It is a developer tool, not a runtime API for end users.

## References

- Upstream server README: <https://github.com/supabase-community/supabase-mcp>
- npm package: <https://www.npmjs.com/package/@supabase/mcp-server-supabase>
- Setup docs: <https://supabase.com/docs/guides/getting-started/mcp>
- Supabase platform docs: <https://supabase.com/docs>
- Management OpenAPI: <https://api.supabase.com/api/v1/openapi>
- License: Apache-2.0
