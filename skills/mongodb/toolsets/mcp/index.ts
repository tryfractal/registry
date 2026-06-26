import { FractalToolset } from "@fractal-os/plugin";

/**
 * MongoDB MCP toolset.
 *
 * Spawns the official `mongodb-mcp-server` (Node ≥ 22.13) and exposes every
 * MongoDB database tool, Atlas admin tool, Atlas Local tool, and MongoDB
 * Assistant tool it provides.
 *
 * Default mode is read-only and Atlas-aware:
 *   - `--readOnly`           → only read / connect / metadata tools register
 *   - `MDB_MCP_READ_ONLY`    → same flag, environment form
 *
 * Required environment variables (set these in the toolset `env` block or in
 * the host shell):
 *   - `MDB_MCP_CONNECTION_STRING`   → direct MongoDB URI (local or Atlas SRV)
 *   - `MDB_MCP_API_CLIENT_ID`       → Atlas Service Account client ID
 *   - `MDB_MCP_API_CLIENT_SECRET`   → Atlas Service Account client secret
 *
 * Provide EITHER the connection string OR the Atlas API credentials (or both).
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "MongoDB and MongoDB Atlas access via the official mongodb-mcp-server. Connects to any local mongod / Docker instance or any Atlas cluster using a connection string, or to the Atlas admin API using Service Account credentials. Exposes find / aggregate / count / insert / update / delete, schema & index introspection, aggregation pipelines with explain, EJSON export, full Atlas cluster / project / user / access-list management, Atlas Local deployment lifecycle, and the MongoDB Assistant knowledge base.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass sensitive values (connection string, API client id / secret) via the `MDB_MCP_CONNECTION_STRING`, `MDB_MCP_API_CLIENT_ID`, and `MDB_MCP_API_CLIENT_SECRET` environment variables — never as command-line arguments, which show up in process listings.",
    },
    {
      type: "always",
      instruction:
        "Use Atlas Service Account credentials, not personal Atlas account credentials, and grant only the minimum required role for the operation (e.g. Project Read Only for inspection, Project Cluster Manager for provisioning).",
    },
    {
      type: "always",
      instruction:
        "Run the server with `MDB_MCP_READ_ONLY=true` (or `--readOnly`) unless the user has explicitly asked for writes. Read-only mode is the default safety posture.",
    },
    {
      type: "always",
      instruction:
        "Call `count` before `find` on collections of unknown size, and rely on `maxDocumentsPerQuery` (default 100) for pagination. Never request unbounded result sets.",
    },
    {
      type: "always",
      instruction:
        "Use `explain` on slow queries before reaching for `create-index`, and let the planner's recommendation drive the new index. Set `MDB_MCP_INDEX_CHECK=true` in production to reject any future collection scan.",
    },
    {
      type: "always",
      instruction:
        "Wait for explicit user confirmation before invoking any tool in `MDB_MCP_CONFIRMATION_REQUIRED_TOOLS` (drop-database, drop-collection, delete-many, atlas-create-db-user, atlas-create-access-list, etc.). These tools gate on MCP elicitation.",
    },
    {
      type: "never",
      instruction:
        "Never embed plaintext credentials, API keys, or PII inside the documents you `insert-many` or `update-many`. Reference external secrets by ID and inject them at the application layer.",
    },
    {
      type: "never",
      instruction:
        "Never start the server with `--transport http` and bind it to `0.0.0.0` without a reverse proxy that enforces TLS, authentication, IP allow-listing, and rate limiting. Streamable HTTP transport is unauthenticated by design.",
    },
    {
      type: "never",
      instruction:
        "Never disable `MDB_MCP_DISABLE_SERVER_SIDE_JS` and then run `$where`, `$function`, or `$accumulator` in a query — server-side JavaScript is a code-execution vector. Keep the default (`true` = disabled).",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "mongodb-mcp-server@latest", "--readOnly"],
    env: {
      MDB_MCP_READ_ONLY: "true",
      MDB_MCP_TELEMETRY: "disabled",
    },
  })
  .build();
