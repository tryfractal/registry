import { FractalToolset } from "@fractal-os/plugin";

/**
 * Airtable MCP toolset.
 *
 * Spawns the official `airtable-mcp-server` by domdomegg
 * (`@domdomegg/airtable-mcp-server` on npm) over stdio and exposes every
 * read, write, and schema-mutation tool it provides. The server talks
 * directly to the Airtable Web API using the `AIRTABLE_API_KEY` env var
 * (a Personal Access Token, or OAuth credentials).
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read and write operational data in Airtable via the airtable-mcp-server by domdomegg. Exposes schema discovery (list_bases, list_tables, describe_table), record reads (list_records, search_records, get_record), record writes (create_record, update_records, delete_records), schema mutation (create_table, update_table, create_field, update_field), and record comments (create_comment, list_comments). Authenticates with the AIRTABLE_API_KEY environment variable.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Discover the schema before reading or writing. Call list_bases → list_tables (with detailLevel: 'identifiersOnly') → describe_table on the target table to resolve baseId / tableId / fieldId. Never guess an opaque ID.",
    },
    {
      type: "always",
      instruction:
        "Prefer server-side filterByFormula in list_records over pulling every record and filtering in context. The formula language supports AND, OR, NOT, {Field Name}, FIND(), IS_AFTER(), REGEX_MATCH(), and more.",
    },
    {
      type: "always",
      instruction:
        "Use search_records for case-insensitive substring search across text fields; fall back to filterByFormula only when you need a comparison (>, <, IS_AFTER, etc.) or a regex.",
    },
    {
      type: "always",
      instruction:
        "Batch mutations in chunks of 10 records per update_records / delete_records call — the Airtable Web API caps writes at 10 records per request. Loop until done.",
    },
    {
      type: "always",
      instruction:
        "Quote field names containing spaces with single curly braces inside formulas (e.g. {Project Name}, not Project Name) and reference the field's exact display name, case-sensitive.",
    },
    {
      type: "always",
      instruction:
        "If a tool returns INVALID_PERMISSIONS or NOT_FOUND, the AIRTABLE_API_KEY is missing a required scope or the base is not granted to the token. Report the failing scope to the user; do not retry blindly.",
    },
    {
      type: "never",
      instruction:
        "Never call delete_records or any schema-mutation tool (create_table, update_table, create_field, update_field) without explicit user confirmation. These actions are visible to every collaborator in real time and are not reversible.",
    },
    {
      type: "never",
      instruction:
        "Never log, echo, write to disk, or otherwise expose the raw AIRTABLE_API_KEY token in tool calls, conversation history, or response payloads. Treat it as a long-lived admin credential.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@domdomegg/airtable-mcp-server@latest"],
    env: {
      AIRTABLE_API_KEY: "${AIRTABLE_API_KEY}",
    },
  })
  .build();
