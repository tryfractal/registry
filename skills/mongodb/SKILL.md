---
name: mongodb
description: >-
  Connect to MongoDB databases and Atlas clusters from the agent through the
  official MongoDB MCP server. Use this skill when the user wants to query,
  insert, update, or delete documents in a MongoDB collection; run an
  aggregation pipeline; list databases or collections; inspect a collection's
  schema or indexes; create or drop indexes; export query results; manage
  Atlas clusters, projects, users, or access lists; load the sample dataset;
  search the MongoDB knowledge base; or troubleshoot a connection. Triggers
  on phrases like "query the users collection", "run this aggregation
  against the orders database", "show me the schema of the products
  collection", "list all databases", "create an index on email", "find
  documents where status is active", "insert a new document", "update
  matching documents", "export results as EJSON", "create a free Atlas
  cluster", "count documents matching this filter", or any request to
  drive MongoDB or Atlas from the agent.
---

# MongoDB Skill

This skill exposes the official **MongoDB MCP server** (`mongodb-mcp-server`) as a single Fractal toolset. It works against any MongoDB instance — local `mongod`, Docker, or MongoDB Atlas — and supports both direct connection strings and Atlas API Service Account credentials.

## Toolset

- `mcp` — MongoDB MCP server (`mongodb-mcp-server@latest`, Node ≥ 22.13). Default mode is **read-only** (see `MDB_MCP_READ_ONLY` below) and has `atlas`, `mongodb` and `collectionSchema` enabled. All write tools are gated behind user confirmation via elicitation.

## Database tools (always available)

| Tool | What it does |
|---|---|
| `connect` | Connect to a MongoDB instance using a connection string. |
| `switch-connection` | Switch to a different MongoDB connection mid-session. |
| `list-databases` | List all databases on the current connection. |
| `list-collections` | List all collections in a given database. |
| `db-stats` | Storage and document statistics for a single database. |
| `collection-schema` | Infer the schema (field types, sample values) of a collection. |
| `collection-indexes` | List the indexes on a collection. |
| `collection-storage-size` | Total size in bytes of a collection. |
| `find` | Run a `find()` query against a collection. |
| `aggregate` | Run an aggregation pipeline against a collection. |
| `aggregate-db` | Run an aggregation pipeline against a whole database. |
| `count` | Count documents in a collection, with an optional filter. |
| `explain` | Return the query planner's winning plan for a `find` or `aggregate`. |
| `export` | Export a `find` or `aggregate` result to an EJSON file on disk. |
| `mongodb-logs` | Read the most recent `mongod` log entries. |
| `create-collection` | Create a new collection (auto-creates the parent database). |
| `create-index` | Create an index on a collection. |
| `insert-many` | Insert an array of documents into a collection. |
| `update-many` | Update every document matching a filter. |
| `delete-many` | Delete every document matching a filter. |
| `rename-collection` | Rename a collection within the same database. |
| `drop-collection` | Drop a collection and all of its indexes. |
| `drop-database` | Drop a database and all of its data files. |
| `drop-index` | Drop a named index from a collection. |

## Atlas tools (enabled when Atlas API credentials are configured)

| Tool | What it does |
|---|---|
| `atlas-list-orgs` | List organizations accessible to the service account. |
| `atlas-list-projects` | List projects inside an organization. |
| `atlas-list-clusters` | List clusters inside a project. |
| `atlas-inspect-cluster` | Get full metadata + state of a cluster. |
| `atlas-create-cluster` | Provision a new M10–M80 dedicated cluster. |
| `atlas-create-free-cluster` | Provision a free (M0) cluster. |
| `atlas-upgrade-cluster` | Upgrade a free or Flex cluster to a higher tier. |
| `atlas-pause-resume-cluster` | Pause or resume a dedicated cluster. |
| `atlas-create-project` | Create a new Atlas project. |
| `atlas-create-access-list` | Add IP / CIDR ranges to a project's access list. |
| `atlas-inspect-access-list` | List the current access list for a project. |
| `atlas-create-db-user` | Create a database user in a project. |
| `atlas-list-db-users` | List database users in a project. |
| `atlas-list-alerts` | List active alerts for a project. |
| `atlas-get-performance-advisor` | Get suggested indexes, slow queries, and schema advice. |
| `atlas-load-sample-dataset` | Load the sample dataset and poll job status by `jobId`. |
| `atlas-connect-cluster` | Connect the data tools to a specific Atlas cluster. |
| `atlas-streams-build` | Create a Stream Processing workspace, connection, processor, or PrivateLink. |
| `atlas-streams-discover` | Inspect stream processing resources and diagnose processors. |
| `atlas-streams-manage` | Start / stop / scale / reconfigure a stream processor. |
| `atlas-streams-teardown` | Delete stream processing resources. |

## Atlas Local tools (always available)

| Tool | What it does |
|---|---|
| `atlas-local-list-deployments` | List local Atlas deployments. |
| `atlas-local-create-deployment` | Create a local Atlas deployment (default image: `preview`). |
| `atlas-local-connect-deployment` | Connect to a local Atlas deployment. |
| `atlas-local-delete-deployment` | Delete a local Atlas deployment. |

## Assistant tools (always available)

| Tool | What it does |
|---|---|
| `list-knowledge-sources` | List the available data sources in the MongoDB Assistant knowledge base. |
| `search-knowledge` | Search official MongoDB docs, expert guides, and curated content. |

## Usage rules

- **Pass the connection string via the `MDB_MCP_CONNECTION_STRING` env var, never as a CLI argument.** Connection strings contain credentials that show up in process listings.
- **Atlas API credentials must be set as `MDB_MCP_API_CLIENT_ID` + `MDB_MCP_API_CLIENT_SECRET` env vars.** Use a Service Account, not an OAuth user, and grant only the minimum required roles (see the *Atlas API Permissions* table upstream).
- **Default to read-only mode.** Start the server with `MDB_MCP_READ_ONLY=true` (or `--readOnly`). Remove the flag only when the user explicitly wants writes.
- **Confirm destructive tools.** `drop-database`, `drop-collection`, `delete-many`, `atlas-create-db-user`, `atlas-create-access-list`, and several more (`MDB_MCP_CONFIRMATION_REQUIRED_TOOLS`) require user confirmation via MCP elicitation. Wait for the user to approve before invoking them.
- **Use the `count` tool before `find` on large collections.** This prevents accidentally pulling millions of documents. Pair with `maxDocumentsPerQuery` (default 100) for pagination.
- **Use `explain` before adding an index.** Run `explain` on a slow query first, then `create-index` based on the planner's recommendation. The `indexCheck` flag (`MDB_MCP_INDEX_CHECK=true`) will reject any future query that does a collection scan.
- **Paginate large `insert-many` / `update-many` calls.** The driver enforces a `maxRequestPayloadBytes` ceiling — split into batches rather than sending one massive payload.
- **Never embed raw PII or secrets in documents.** Use environment-injected credentials and reference them by ID instead.
- **Disable telemetry in production.** Set `MDB_MCP_TELEMETRY=disabled` or `DO_NOT_TRACK=1` to opt out of usage telemetry.

## Connection arguments

Edit the toolset `args` list to customize the launch. All flags also accept matching `MDB_MCP_*` environment variables. The most common ones:

| Flag / Env var | Purpose |
|---|---|
| `--connectionString` / `MDB_MCP_CONNECTION_STRING` | MongoDB connection URI (`mongodb://…` or `mongodb+srv://…`). |
| `--apiClientId` / `MDB_MCP_API_CLIENT_ID` | Atlas Service Account client ID. |
| `--apiClientSecret` / `MDB_MCP_API_CLIENT_SECRET` | Atlas Service Account client secret. |
| `--readOnly` / `MDB_MCP_READ_ONLY` | When `true`, only read / connect / metadata tools are registered. |
| `--indexCheck` / `MDB_MCP_INDEX_CHECK` | Reject any query that does a collection scan. |
| `--disableServerSideJs` / `MDB_MCP_DISABLE_SERVER_SIDE_JS` | Disallow `$where`, `$function`, `$accumulator`. Default: `true`. |
| `--disabledTools` / `MDB_MCP_DISABLED_TOOLS` | Comma-separated list of tool names, operation types (`create`, `update`, `delete`, `read`, `metadata`, `connect`), or categories (`atlas`, `mongodb`) to disable. |
| `--confirmationRequiredTools` / `MDB_MCP_CONFIRMATION_REQUIRED_TOOLS` | Tools that require elicitation before running. |
| `--maxDocumentsPerQuery` / `MDB_MCP_MAX_DOCUMENTS_PER_QUERY` | Cap on documents returned per `find` / `aggregate`. Default: `100`. |
| `--maxBytesPerQuery` / `MDB_MCP_MAX_BYTES_PER_QUERY` | Cap on bytes returned per `find` / `aggregate`. Default: `16 MiB`. |
| `--maxTimeMS` / `MDB_MCP_MAX_TIME_MS` | Per-operation `maxTimeMS` ceiling. |
| `--loggers` / `MDB_MCP_LOGGERS` | Comma-separated `disk,mcp,stderr`. Default: `disk,mcp`. |
| `--logPath` / `MDB_MCP_LOG_PATH` | Folder for log files. |
| `--exportsPath` / `MDB_MCP_EXPORTS_PATH` | Folder for `export` tool output. |
| `--exportTimeoutMs` / `MDB_MCP_EXPORT_TIMEOUT_MS` | Expiry for exported data. Default: `300000` (5 min). |
| `--transport` / `MDB_MCP_TRANSPORT` | `stdio` (default) or `http`. |
| `--httpHost` / `MDB_MCP_HTTP_HOST` | HTTP bind host. Default: `127.0.0.1`. |
| `--httpPort` / `MDB_MCP_HTTP_PORT` | HTTP port. Default: `3000`. |
| `--telemetry` / `MDB_MCP_TELEMETRY` | `enabled` (default) or `disabled`. |
| `--previewFeatures` / `MDB_MCP_PREVIEW_FEATURES` | Comma-separated preview features (e.g. `mcpUI`). |
| `--dryRun` / `MDB_MCP_DRY_RUN` | Dump config + enabled tools and exit, no server. |
| `--allowRequestOverrides` / `MDB_MCP_ALLOW_REQUEST_OVERRIDES` | Allow per-request header / query overrides. Default: `false`. |

## Configuration methods

The server reads configuration in this order of precedence (highest first):

1. Command-line arguments
2. Environment variables
3. JSON config file pointed to by `MDB_MCP_CONFIG`

The config file uses camelCase keys (e.g. `connectionString`, `readOnly`, `apiClientId`):

```json
{
  "connectionString": "mongodb+srv://user:pass@cluster.mongodb.net/myDatabase",
  "readOnly": true,
  "loggers": ["mcp", "stderr"],
  "maxDocumentsPerQuery": 100
}
```

```bash
# Linux / macOS
chmod 600 /path/to/config.json
export MDB_MCP_CONFIG="/path/to/config.json"
npx -y mongodb-mcp-server@latest
```

## Standalone HTTP server

For remote clients (web UIs, multi-tenant hosts) the server can run over Streamable HTTP instead of stdio:

```bash
npx -y mongodb-mcp-server@latest --transport http --httpHost=0.0.0.0 --httpPort=8080
```

> **Security notice:** HTTP transport is not authenticated. Always put it behind a reverse proxy with TLS, IP allow-listing, and rate limiting. Never expose it directly to the public internet.

## Resources

| URI | Content |
|---|---|
| `config://config` | Resolved server configuration with secrets redacted. |
| `debug://mongodb` | Last connectivity attempt and any error. |
| `exported-data://{exportName}` | Data exported by the `export` tool, addressable by the unique export name. |

## Atlas API roles (cheat sheet)

| Goal | Minimum role | Scope |
|---|---|---|
| List orgs / projects | Org Read Only | Organization |
| Create a new project | Org Project Creator | Organization |
| Read clusters & databases | Project Read Only | Project |
| Create / manage clusters | Project Cluster Manager | Project |
| Manage IP access lists | Project IP Access List Admin | Project |
| Manage database users | Project Database Access Admin | Project |
| Manage stream processing | Project Stream Processing Owner | Project |

Prefer project-scoped roles; never grant Organization Owner for routine work.

## References

- Upstream docs: <https://github.com/mongodb-js/mongodb-mcp-server>
- npm package: <https://www.npmjs.com/package/mongodb-mcp-server>
- MongoDB documentation: <https://www.mongodb.com/docs/>
- Atlas Service Accounts: <https://www.mongodb.com/docs/atlas/configure-api-access-project-org/>
- License: Apache-2.0
