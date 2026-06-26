import { FractalToolset } from "@fractal-os/plugin";

/**
 * Redis MCP toolset.
 *
 * Spawns the official `redis-mcp-server` (published on PyPI from the
 * `redis/mcp-redis` GitHub repository) and exposes every Redis data
 * type — strings, hashes, lists, sets, sorted sets, JSON, streams, and
 * pub/sub — plus vector search, server introspection, and a docs lookup.
 *
 * Default connection targets `redis://localhost:6379/0`. Override the
 * target by exporting `REDIS_URL` (or by editing the `args` below to
 * pass `--url "redis://user:pass@host:6379/db"` directly).
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Read and write a live Redis instance through the official redis-mcp-server. Exposes typed tools for strings, hashes, lists, sets, sorted sets, JSON, Redis Streams, and pub/sub, plus vector search, SCAN-based key discovery, and TTL management. Connects via the `redis://` or `rediss://` URL scheme to local, self-hosted, Redis Cloud, or Azure Managed Redis (with EntraID).",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pick the typed tool that matches the data shape — `hash` for objects with discrete fields, `list` for queues, `set` for unique values, `sorted set` for ordered/ranked data, `JSON` for nested documents, `stream` for event logs, `string` for single values. Do not serialize structured data into a `string` blob when a typed tool is available.",
    },
    {
      type: "always",
      instruction:
        "Use `SCAN` (with `MATCH <pattern>` and `COUNT <hint>`) to enumerate keys. Never call `KEYS *` or its equivalent — it blocks the server and trips monitoring on any non-trivial database.",
    },
    {
      type: "always",
      instruction:
        "Apply a TTL on cache entries (`cache:*`, `session:*`, `ratelimit:*`) and skip it on durable data. Use `EXPIRE` to add a lifetime to an existing key, and `PERSIST` to remove a TTL when needed.",
    },
    {
      type: "always",
      instruction:
        "Pass a short human-readable `key` description (e.g. \"the user session blob for user 42\") alongside writes so the action is self-documenting in the tool log.",
    },
    {
      type: "always",
      instruction:
        "Reference connection settings by env-var name (`REDIS_URL`, `REDIS_HOST`, etc.) — never echo the value of `REDIS_URL` or any password back into a log, tool response, or error message.",
    },
    {
      type: "never",
      instruction:
        "Do not enable `--cluster-mode` (or set `REDIS_CLUSTER_MODE=true`) unless the target is actually a Redis Cluster. Cluster mode against a single node fails on MOVED redirects.",
    },
    {
      type: "never",
      instruction:
        "Do not call the typed write tools with values sourced from untrusted user input without validating them first. Redis is fast and unforgiving — a bad `FLUSHDB` against the production DB is unrecoverable.",
    },
    {
      type: "never",
      instruction:
        "Do not leave a `SUBSCRIBE` / `PSUBSCRIBE` handle dangling. Stateful subscriptions hold a real server-side connection; unsubscribe (or stop the tool) when you are done reading.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "uvx",
    args: [
      "--from",
      "redis-mcp-server@latest",
      "redis-mcp-server",
      "--url",
      "redis://localhost:6379/0",
    ],
    env: {
      REDIS_URL: "redis://localhost:6379/0",
      MCP_REDIS_LOG_LEVEL: "WARNING",
    },
  })
  .build();
