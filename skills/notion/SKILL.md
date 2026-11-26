---
name: notion
description: >-
  Connect a Notion workspace to the agent through the official Notion MCP
  server. Use this skill when the user wants to read, search, create, update,
  archive, or move Notion pages; query, filter, sort, insert, update, or
  delete rows in a Notion database; create or update comments; manage block
  content on a page; list users; manage data sources, views, and templates;
  or export page content to Markdown. Triggers on phrases like "find the
  page about Q3 OKRs in Notion", "add a new task to my Tasks database",
  "search Notion for the onboarding doc", "create a page titled Meeting
  Notes under Engineering", "read the content of this Notion page",
  "append a bullet list to the launch plan", "comment shipped on the
  release page", "update the status of row 3 to Done", "move this page
  to Archive", "export this page to Markdown", or any request to
  interact with a Notion workspace. Use this skill even if the user says
  "use Notion", "open Notion", or "connect to my Notion".
---

# Notion Skill

This skill exposes the **official Notion MCP server** (`@notionhq/notion-mcp-server`) as a single Fractal toolset. The server targets the Notion REST API and gives the agent type-safe access to every page, database, data source, block, comment, and user in the connected workspace.

The server is the canonical Notion team–maintained MCP wrapper. It currently tracks Notion API version `2025-09-03` (with `2026-03-11` used internally for the Markdown page endpoints) and ships **22 tools** covering reads, writes, search, queries, comments, users, blocks, data sources, and Markdown export.

## Toolset

- `mcp` — Official Notion MCP server (`@notionhq/notion-mcp-server@latest`). Default transport is **stdio**. Authentication is driven by either the `NOTION_TOKEN` env var (recommended) or the `OPENAPI_MCP_HEADERS` JSON blob (advanced).

## Search & discovery

| Tool | What it does |
|---|---|
| `API-post-search` | Search the workspace by title. Filter by `page` or `data_source`. |
| `API-get-self` | Return the bot user / integration identity. |
| `API-get-user` | Fetch a single user by ID. |
| `API-get-users` | List all users visible to the integration. |

## Pages

| Tool | What it does |
|---|---|
| `API-post-page` | Create a new page under a parent page or data source. |
| `API-retrieve-a-page` | Read a page's metadata (title, parent, properties, last-edited). |
| `API-patch-page` | Update a page's properties or archive / restore it. |
| `API-retrieve-a-page-property` | Read a single property value on a page. |
| `API-move-page` | Move a page to a different parent. |

## Blocks (page content)

| Tool | What it does |
|---|---|
| `API-get-block-children` | List the child blocks of a page or block. |
| `API-patch-block-children` | Append blocks to a parent block / page. |
| `API-retrieve-a-block` | Read a single block. |
| `API-update-a-block` | Update an existing block's content. |
| `API-delete-a-block` | Soft-delete (archive) a block. |

## Data sources (databases) & queries

| Tool | What it does |
|---|---|
| `API-retrieve-a-database` | Get a database's metadata and its data source IDs. |
| `API-retrieve-a-data-source` | Get a data source's schema (properties, types, options). |
| `API-create-a-data-source` | Create a new data source under a parent page. |
| `API-update-a-data-source` | Update a data source's title, properties, or description. |
| `API-query-data-source` | Filter + sort rows in a data source. |

## Markdown page endpoints

| Tool | What it does |
|---|---|
| `API-retrieve-page-markdown` | Read a page's full content as Markdown. Pass `include_transcript: true` to inline meeting-note transcripts. |
| `API-update-page-markdown` | Edit a page with Markdown — `replace_content` to overwrite, or `update_content` for targeted find-and-replace. |

## Comments

| Tool | What it does |
|---|---|
| `API-create-a-comment` | Post a comment on a page or in a discussion thread. |
| `API-retrieve-a-comment` | Read a single comment. |

## Usage rules

- **Create a Notion internal integration first.** Visit <https://www.notion.so/profile/integrations> and create an internal integration, then copy its `ntn_…` (or legacy `secret_…`) secret into the `NOTION_TOKEN` env var. The integration's capabilities define what it can do — for read-only flows, set only **Read content** on the Configuration tab.
- **Share target pages with the integration.** An internal integration cannot see pages that have not been explicitly shared with it. Open the page → ⋯ menu → **Connect to integration**, or use the integration's **Access** tab to grant access in bulk.
- **Prefer the data-source model (API 2025-09-03).** Every database now has one or more data sources; pass `data_source_id` (not `database_id`) to `query-data-source`, `update-a-data-source`, and `create-a-data-source`. Use `retrieve-a-database` to discover a database's data source IDs, then `retrieve-a-data-source` to read its schema.
- **Use `API-post-search` before guessing IDs.** Search by title with the appropriate `filter` (`page` or `data_source`) to resolve a name to an ID instead of asking the user for one.
- **Prefer Markdown tools for content work.** Use `API-retrieve-page-markdown` to read a page (much cheaper than walking block trees) and `API-update-page-markdown` with `update_content` for targeted edits. Use `replace_content` only when you genuinely want to overwrite the whole page.
- **Never hardcode integration tokens in prompts.** Always read `NOTION_TOKEN` from the environment. Never paste the secret into a Notion page, comment, or block.
- **Do not call `API-delete-a-block` on a block you did not just create** without surfacing the destructive intent to the user. Archive/restore is a safer default for "remove this" requests.
- **Prefer `API-patch-page` with `archived: true` for "delete this page" requests.** The MCP server intentionally does not expose a hard-delete tool for databases; pages are archived, not destroyed.
- **Long Markdown pages still tokenize.** When a page is huge, query specific block ranges with `API-get-block-children` and `start_cursor` / `page_size` instead of dumping the full Markdown at once.

## Configuration

### 1. Create the integration

1. Open <https://www.notion.so/profile/integrations>.
2. Create a new **internal** integration (or pick an existing one).
3. Copy the secret — it looks like `ntn_****` (or `secret_****` for older accounts).
4. On the **Configuration** tab, restrict the capabilities if you want read-only behavior.

### 2. Share the target pages

In Notion, open each page you want the agent to access → ⋯ menu → **Connections** → **Connect to integration** → pick your integration. For workspace-wide access, use the integration's **Access** tab.

### 3. Set the env var

**Option A — `NOTION_TOKEN` (recommended):**

```bash
export NOTION_TOKEN="ntn_****"
```

**Option B — `OPENAPI_MCP_HEADERS` (advanced, allows custom `Notion-Version` and extra headers):**

```bash
export OPENAPI_MCP_HEADERS='{"Authorization": "Bearer ntn_****", "Notion-Version": "2025-09-03"}'
```

If you set `Notion-Version` yourself, it overrides the per-operation version the server picks internally.

### 4. (Optional) Self-host with Streamable HTTP

Run the server standalone so multiple clients can share one integration:

```bash
npx -y @notionhq/notion-mcp-server --transport http --port 3000 --auth-token "your-secret"
# available at http://127.0.0.1:3000/mcp
```

Or enable per-request token passthrough to serve multiple Notion integrations from one deployment:

```bash
npx -y @notionhq/notion-mcp-server --transport http --enable-token-passthrough
# clients send their Notion token via the `Notion-Token` header on `initialize`
```

## Transport options

| Transport | When to use | Auth |
|---|---|---|
| `stdio` (default) | Local agents, desktop MCP clients. | None at the transport layer — auth is the `NOTION_TOKEN` env var. |
| Streamable HTTP | Web clients, multi-tenant deployments. | Bearer token via `--auth-token` (or `AUTH_TOKEN` env var). |

For `--transport http` you can also use `--enable-token-passthrough` to accept a per-request `Notion-Token` header (must start with `ntn_` or `secret_`).

## Security notes

- The integration token is a **workspace secret**. Anyone who has it can read every page that has been shared with the integration. Treat it like a database password.
- The MCP server **scopes** the API: there is no hard-delete for databases, no transfer-ownership, and no workspace-settings write. There is still a non-zero blast radius — pages can be archived, blocks can be deleted, and properties can be rewritten. Restrict capabilities on the integration's Configuration tab if you only need read access.
- Do not use `--unsafe-disable-auth` with HTTP transport. It is intended only for isolated networks and is vulnerable to DNS rebinding.

## References

- Notion MCP server: <https://github.com/makenotion/notion-mcp-server>
- npm package: <https://www.npmjs.com/package/@notionhq/notion-mcp-server>
- Notion API reference: <https://developers.notion.com/reference/intro>
- Notion OpenAPI spec: <https://www.notion.so/help/notion-sdk-openapi>
- Create an integration: <https://www.notion.so/profile/integrations>
- License: MIT

## Hosted MCP connection

This skill also includes a `hosted-mcp` toolset at `https://mcp.notion.com/mcp`. It uses Fractal's OAuth authorization flow and discovers tools from the provider after connection. The provider must support the MCP OAuth flow used by Fractal; this endpoint was not independently authorized during registry preparation. Use the current `Notion` connector when its provider-specific setup or guidance is needed, and the hosted toolset when the user wants the provider's remote MCP server.
