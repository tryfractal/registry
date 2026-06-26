import { FractalToolset } from "@fractal-os/plugin";

/**
 * Notion MCP toolset.
 *
 * Spawns the official `@notionhq/notion-mcp-server` and exposes every tool it
 * provides — search, pages, blocks, data sources (databases), queries, comments,
 * users, and the Markdown page endpoints. Authentication is driven by the
 * `NOTION_TOKEN` env var (preferred) or by the `OPENAPI_MCP_HEADERS` JSON blob
 * when advanced header overrides (e.g. a custom `Notion-Version`) are needed.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Notion workspace automation via the official Notion MCP server (@notionhq/notion-mcp-server). Exposes search, page CRUD, block CRUD, data source CRUD, filtered queries, comments, users, and Markdown read/write of page content. Authentication uses the `NOTION_TOKEN` environment variable; the integration must have the target pages shared with it.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Resolve page, data source, and database identifiers with `API-post-search` (filtered by `page` or `data_source`) before guessing an ID. Never ask the user for raw Notion UUIDs when the title is known.",
    },
    {
      type: "always",
      instruction:
        "Use the data-source model for any database work. Discover a database's data source IDs with `API-retrieve-a-database`, read the schema with `API-retrieve-a-data-source`, and pass `data_source_id` (not `database_id`) to `API-query-data-source`, `API-update-a-data-source`, and `API-create-a-data-source`.",
    },
    {
      type: "always",
      instruction:
        "Prefer the Markdown tools for content work: `API-retrieve-page-markdown` to read a page (much cheaper than walking block trees) and `API-update-page-markdown` with `update_content` for targeted find-and-replace edits. Use `replace_content` only when you genuinely intend to overwrite the entire page.",
    },
    {
      type: "always",
      instruction:
        "Read `NOTION_TOKEN` from the environment. Never hardcode the integration secret in a prompt, page, comment, or block, and never echo it back in tool output.",
    },
    {
      type: "always",
      instruction:
        "For huge pages, page through `API-get-block-children` with `start_cursor` and `page_size` instead of dumping the full Markdown or full block tree in a single call. Pair with a tool-output budget.",
    },
    {
      type: "always",
      instruction:
        "For 'delete this page' requests, call `API-patch-page` with `archived: true` instead of attempting a hard delete — the MCP server does not expose a destructive delete-database tool by design.",
    },
    {
      type: "never",
      instruction:
        "Never call `API-delete-a-block` on a block the user did not explicitly ask to remove. Archive/restore via `API-patch-page` is the safer default for 'remove this' requests.",
    },
    {
      type: "never",
      instruction:
        "Do not run the HTTP transport with `--unsafe-disable-auth`. It is intended only for isolated networks and is vulnerable to DNS rebinding. Keep bearer auth on, and enable `--enable-token-passthrough` only when serving multiple tenants over TLS.",
    },
    {
      type: "never",
      instruction:
        "Do not attempt to bypass the integration's capability restrictions (e.g. by manually setting `Notion-Version` in `OPENAPI_MCP_HEADERS` to call a newer endpoint) if the integration's Configuration tab does not grant that capability. If a tool returns a permission error, surface it to the user — do not work around it.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@notionhq/notion-mcp-server@latest"],
  })
  .build();
