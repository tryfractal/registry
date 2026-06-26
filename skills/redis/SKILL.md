---
name: redis
description: >-
  Drive a live Redis instance through the official redis-mcp-server.
  Use this skill whenever the user wants to store, read, delete, list,
  or search keys; manage strings, hashes, lists, sets, sorted sets,
  JSON documents, pub/sub channels, or Redis Streams; cache values with
  TTLs, run vector search against a Redis vector index, manage consumer
  groups, inspect or reindex a dataset, or run real-time workloads
  against a local, self-hosted, Redis Cloud, or Azure Managed Redis
  database. Triggers on phrases like "cache this with a 5 minute TTL",
  "store this in a hash", "add to a sorted set with score 100",
  "publish a message on orders:new", "search the vector index for
  closest 10 embeddings", or any request to programmatically read,
  write, or query Redis. Use this skill even if the user just says
  "use redis" or asks how to cache, queue, or session data.
---

# Redis Skill

This skill exposes the official **Redis MCP Server** (`redis-mcp-server` from `redis/mcp-redis`) as a single Fractal toolset. The server speaks the native Redis wire protocol (RESP) over the `redis://` and `rediss://` schemes, so it talks to any reachable Redis instance — local Docker, self-hosted cluster, Redis Cloud, or Azure Managed Redis with EntraID.

## Toolset

- `mcp` — Redis MCP Server (`redis-mcp-server@latest` from PyPI). Default transport is `stdio`. Connection defaults to `redis://localhost:6379/0` and is overridable via the `REDIS_URL` environment variable (or per-call `--url` flag in the toolset `args`). Supports SSL/TLS, cluster mode, and EntraID for Azure Managed Redis.

## Core data-structure tools

The server exposes one MCP tool per Redis data type. Use the one that matches the shape of the data, not a generic key-value command.

| Domain | What it does | When to reach for it |
|---|---|---|
| `string` | Set / get / append / incr / decr / expire / TTL / persist | Simple configuration values, counters, short-lived cache, session blobs. |
| `hash` | HSET / HGET / HMSET / HGETALL / HINCRBY / HDEL / HKEYS / HVALS | User profiles, product attributes, per-field updates, vector embeddings stored as hash fields. |
| `list` | LPUSH / RPUSH / LPOP / RPOP / LRANGE / LREM / LTRIM / LSET | Queues, message brokers, "latest N actions" feeds, work lists. |
| `set` | SADD / SREM / SMEMBERS / SISMEMBER / SINTER / SUNION / SDIFF | Unique values (user IDs, tags), set-algebra for joins and filters. |
| `sorted set` | ZADD / ZRANGE / ZRANGEBYSCORE / ZREM / ZINCRBY / ZRANK | Leaderboards, priority queues, time-windowed analytics, rate-limit windows. |
| `JSON` | JSON.SET / JSON.GET / JSON.MERGE / JSON.DEL / JSON.NUMINCRBY | Nested documents, config trees, anything you'd otherwise serialize into a string. |
| `stream` | XADD / XREAD / XLEN / XRANGE / XDEL / XTRIM + consumer groups (`XGROUP CREATE`, `XREADGROUP`, `XACK`) | Event sourcing, activity feeds, worker queues with replay. |
| `pubsub` | PUBLISH, `SUBSCRIBE` / `PSUBSCRIBE` (stateful, returns a handle), reading queued messages on the handle | Real-time notifications, chat fanout, pub/sub between services. |

## Cross-cutting tools

| Tool | What it does |
|---|---|
| `dbsize` | Total number of keys in the current logical database. |
| `scan` | Iterate keys with a `MATCH <pattern>` glob (`user:*`, `cache:session:*`) and a `COUNT` hint. Cursor-based — safe on production-sized keysets. |
| `del` / `unlink` | Delete one or more keys (`UNLINK` is non-blocking on large values). |
| `type` | Return the data type of a key (`string`, `hash`, `list`, `set`, `zset`, `stream`, `ReJSON-RL`). |
| `expire` / `ttl` / `persist` | Manage key lifetimes. |
| `info` | Server stats (memory, clients, replication, keyspace). |
| `client list` / `client kill` | Inspect and manage connected clients. |
| `docs` | Search the official Redis documentation and tutorials using a natural-language question (backed by the `MCP_DOCS_SEARCH_URL` HTTP API). Use this when you need the exact syntax or semantics of a command before issuing it. |
| `query_engine` | Manage vector indexes and run KNN / range vector search (e.g. `FT.CREATE`, `FT.SEARCH` with `*=>[KNN 10 @vec $BLOB]`). |
| `server_management` | Read server info, list databases, inspect connection state. |

## Usage rules

- **Prefer the typed tool over generic GET/SET.** If the user says "store this profile", use the hash tool — not `string` with a JSON blob — unless they explicitly want a string. The typed tool preserves the structure and lets you update individual fields later.
- **Pick the right lifetime.** `EXPIRE` / TTL is a first-class concept, not an afterthought. Cache entries (`cache:*`) should have a TTL; durable data (user records, order history) should not. Use `PERSIST` to strip a TTL if you set one by mistake.
- **Use `SCAN`, never `KEYS`.** The `scan` tool is the only safe way to enumerate keys on a production Redis. `KEYS *` blocks the server and will trip monitoring.
- **Cluster mode is opt-in.** Pass `--cluster-mode` (or set `REDIS_CLUSTER_MODE=true`) only when the target is actually a cluster. Wrong mode means the client tries a single-node connection and fails on MOVED redirects.
- **One logical operation per call.** A hash update is one call, not three (read → modify → write). The server uses a pipelined client; it is faster and avoids the lost-update race.
- **Never expose the connection string back to the user.** The `REDIS_URL` (and especially the password inside it) is a secret. Reference the env var by name; do not echo the value into logs or tool responses.
- **Tear down pub/sub handles.** Stateful `SUBSCRIBE` returns a handle ID. The handle holds a server-side connection — when you're done reading, send an explicit unsubscribe (or stop the tool) to release the connection.

## Connection

Edit the toolset `args` to point at your database. Two ways to configure:

| Mode | How |
|---|---|
| URL (recommended) | Pass `--url "redis://[user:pass@]host:port/db"` (or `rediss://...` for TLS). The single argument covers host, port, db, username, password, and SSL. |
| Individual flags | `--host`, `--port`, `--db`, `--username`, `--password`, `--ssl`, `--ssl-ca-path`, `--ssl-keyfile`, `--ssl-certfile`, `--ssl-cert-reqs`, `--ssl-ca-certs`, `--cluster-mode`. |

Run `redis-mcp-server --help` to see the full list. Precedence is `args > env > default`, so the URL flag overrides `REDIS_URL` if both are set.

## Environment variables

The toolset reads these (defaults from the upstream `redis-mcp-server`):

| Variable | Default | Purpose |
|---|---|---|
| `REDIS_URL` | `redis://127.0.0.1:6379/0` | Single-argument connection (URL scheme: `redis://` or `rediss://`). |
| `REDIS_HOST` | `127.0.0.1` | Fallback host when `REDIS_URL` is not set. |
| `REDIS_PORT` | `6379` | Fallback port. |
| `REDIS_DB` | `0` | Logical database number (0–15 on a default config). |
| `REDIS_USERNAME` | `default` | ACL username (Redis 6+). |
| `REDIS_PWD` | _(empty)_ | ACL password. |
| `REDIS_SSL` | `false` | Enable TLS. Prefer the `rediss://` URL scheme instead. |
| `REDIS_SSL_CA_PATH` | — | CA certificate for server verification. |
| `REDIS_SSL_KEYFILE` | — | Client private key (mutual TLS). |
| `REDIS_SSL_CERTFILE` | — | Client certificate (mutual TLS). |
| `REDIS_SSL_CERT_REQS` | `required` | Set to `none` to skip verification (do not do this in production). |
| `REDIS_SSL_CA_CERTS` | — | Path to a bundle of trusted CA certs. |
| `REDIS_CLUSTER_MODE` | `false` | Set to `true` for Redis Cluster. |
| `MCP_REDIS_LOG_LEVEL` | `WARNING` | One of `DEBUG`, `INFO`, `WARNING`, `ERROR`, `CRITICAL`. Set to `INFO` while debugging, then back to `WARNING` (or higher) for production. |
| `MCP_DOCS_SEARCH_URL` | _(internal)_ | Override the docs search endpoint. |

## EntraID (Azure Managed Redis)

For Azure-hosted Redis, set the auth flow plus the matching variables:

| Flow | Variables |
|---|---|
| Default Azure credential (dev) | `REDIS_ENTRAID_AUTH_FLOW=default_credential`, `REDIS_ENTRAID_SCOPES=https://redis.azure.com/.default` |
| Service principal | `REDIS_ENTRAID_AUTH_FLOW=service_principal`, `REDIS_ENTRAID_CLIENT_ID`, `REDIS_ENTRAID_CLIENT_SECRET`, `REDIS_ENTRAID_TENANT_ID` |
| Managed identity | `REDIS_ENTRAID_AUTH_FLOW=managed_identity`, `REDIS_ENTRAID_IDENTITY_TYPE=system_assigned` (or `user_assigned` + `REDIS_ENTRAID_USER_ASSIGNED_CLIENT_ID`) |

Token renewal is automatic; you do not need to refresh credentials in the tool call.

## Common recipes

- **Cache with TTL.** "Cache this lookup for 5 minutes" → set with `EX 300`. Pair with a `cache:*` key prefix and the `scan` tool to invalidate a namespace.
- **Per-user session.** `HSET session:user:<id> created <ts> user_id <id> data <json>` then `EXPIRE session:user:<id> 86400`. Use `HGETALL` to replay; `DEL` on logout.
- **Leaderboard.** `ZADD leaderboard:weekly <score> <user_id>`, then `ZREVRANGE leaderboard:weekly 0 9 WITHSCORES` for top 10.
- **Work queue with retries.** `LPUSH jobs:pending <payload>`. Worker: `BRPOP jobs:pending 5` (or use a `stream` with a consumer group for at-least-once delivery and `XACK`).
- **Rate limit.** `INCR rl:<user>:<bucket>`, then `EXPIRE rl:<user>:<bucket> 60` on the first hit. Read-and-reject when the value exceeds the cap.
- **Vector search.** Create an index via the `query_engine` tool (`FT.CREATE idx ON HASH PREFIX 1 doc: SCHEMA ... VECTOR HNSW 6 DIM 768 DISTANCE_METRIC COSINE`), then run KNN via `FT.SEARCH idx "*=>[KNN 10 @vec $BLOB]" PARAMS 2 BLOB <bytes>`.
- **Pub/sub between two services.** `PUBLISH orders:new <json>` on the producer side; on the consumer side, `SUBSCRIBE orders:new` and read queued messages off the returned handle.

## Security notes

- The connection string is a credential. Treat `REDIS_URL` like any other secret — do not commit it, do not echo it in tool responses, and prefer short-lived tokens (EntraID, IAM auth) over static passwords.
- The toolset has full read/write access to the database it connects to. Run it against a database scoped to the task, not your production primary. Use a dedicated logical DB (e.g. `redis://.../15` for a scratch namespace) and `FLUSHDB` it after integration tests.
- For multi-tenant workloads, rely on Redis ACL (`ACL SETUSER`, `+@read -@write`) rather than wrapping the toolset in application-level checks.
- This skill is not a sandbox. Anyone who can issue tool calls against the connected database can read, mutate, and delete every key.

## References

- Upstream server: <https://github.com/redis/mcp-redis>
- PyPI package: <https://pypi.org/project/redis-mcp-server/>
- Official Docker image: <https://hub.docker.com/r/mcp/redis>
- Redis documentation: <https://redis.io/docs/latest/>
- License: MIT
