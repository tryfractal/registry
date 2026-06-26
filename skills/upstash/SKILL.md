---
name: upstash
description: >-
  Drive your Upstash account through the official @upstash/mcp-server.
  Use this skill whenever the user wants to provision, list, inspect,
  scale, back up, or delete an Upstash Redis database; read or run
  commands against an existing Redis instance; manage Vector indexes,
  upsert or query embeddings, or run vector search; inspect, publish,
  debug, or retry QStash messages and webhooks; start, pause, list, or
  retry Workflow runs; read or replay the dead-letter queue; spin up or
  tear down an Upstash Box, clone a repo, run tests, snapshot a Box, or
  fan out snapshots; or pull account, region, or usage metrics. Triggers
  on phrases like "create a new Redis database in eu-west-1", "list my
  databases sorted by memory", "scale this database", "run a vector
  search", "retry a failed workflow run", "spin up a Box and run the
  tests", or any request to manage Upstash resources. Use this skill
  even if the user just says "use upstash" or asks how to deploy or
  debug a serverless data layer.
---

# Upstash Skill

This skill exposes the official **Upstash MCP server** (`@upstash/mcp-server` from `upstash/mcp-server` on GitHub) as a single Fractal toolset. It is the canonical way for an agent to provision, inspect, and operate Upstash resources — Redis databases, Vector indexes, QStash message queues, Workflow runs, and Upstash Box sandboxes — using the same console API a human would click through.

The server authenticates with the **email** of the Upstash account owner and an **API key** generated at *Console → Account → API Keys*. Read-only API keys are supported: when one is used, every tool that would mutate state is automatically disabled, so the agent can still read the account but cannot make changes.

## Toolset

- `mcp` — Upstash MCP server (`@upstash/mcp-server@latest` on npm). Default transport is `stdio`. Auth is supplied as `--email` and `--api-key` flags (or via the `UPSTASH_EMAIL` / `UPSTASH_API_KEY` environment variables). An optional `--box-api-key` flag (or `UPSTASH_BOX_API_KEY` env var) unlocks the Box tools.

## Redis database tools

The Redis tools let the agent provision and operate the Upstash-managed databases that live on Upstash's serverless Redis. Use these to set up a new database, list what you have, change the plan, take a backup, or tear one down.

| Tool | What it does |
|---|---|
| `redis_list_databases` | List every Redis database in the account, with region, plan, size, throughput, and current usage. |
| `redis_create_database` | Provision a new Upstash Redis database in a chosen region. Optional `tls`, `eviction`, `cluster`, and `plan` parameters. |
| `redis_get_database` | Return the full configuration of a single database (endpoint, port, password, read-only regions, replicas, current stats). |
| `redis_update_database` | Rename, change the plan, toggle TLS, or change the eviction policy of an existing database. |
| `redis_delete_database` | Permanently delete a database. |
| `redis_list_backups` | List every backup taken for a database. |
| `redis_create_backup` | Trigger a manual backup of a database. |
| `redis_restore_backup` | Restore a database to a chosen backup snapshot. |
| `redis_run_command` | Send an arbitrary Redis command (`GET`, `SET`, `HSET`, `ZADD`, `EVAL`, `FT.SEARCH`, etc.) against a database endpoint. |
| `redis_get_stats` | Return time-series metrics (throughput, latency, memory, connections, hits/misses) for a database. |

## Redis data tools (per-database)

These tools run commands *inside* an existing database and are addressable once the agent has the database ID.

| Tool | What it does |
|---|---|
| `redis_string_*` | `SET`, `GET`, `APPEND`, `INCR`, `DECR`, `EXPIRE`, `TTL`, `PERSIST`, `DEL`. Simple values, counters, short-lived cache, session blobs. |
| `redis_hash_*` | `HSET`, `HGET`, `HMSET`, `HGETALL`, `HINCRBY`, `HDEL`, `HKEYS`, `HVALS`. User profiles, per-field records, vector embeddings stored as hash fields. |
| `redis_list_*` | `LPUSH`, `RPUSH`, `LPOP`, `RPOP`, `LRANGE`, `LREM`, `LTRIM`, `LSET`. Queues, "latest N" feeds, work lists. |
| `redis_set_*` | `SADD`, `SREM`, `SMEMBERS`, `SISMEMBER`, `SINTER`, `SUNION`, `SDIFF`. Unique memberships, set algebra. |
| `redis_sorted_set_*` | `ZADD`, `ZRANGE`, `ZRANGEBYSCORE`, `ZREM`, `ZINCRBY`, `ZRANK`. Leaderboards, time-windowed analytics, rate-limit windows. |
| `redis_json_*` | `JSON.SET`, `JSON.GET`, `JSON.MERGE`, `JSON.DEL`, `JSON.NUMINCRBY`. Nested documents, config trees. |
| `redis_stream_*` | `XADD`, `XREAD`, `XLEN`, `XRANGE`, `XDEL`, `XTRIM`, plus consumer-group helpers. Event logs, at-least-once worker queues. |
| `redis_pubsub_*` | `PUBLISH`, `SUBSCRIBE`, `PSUBSCRIBE`. Real-time fan-out between services. |
| `redis_scan` | Cursor-based key enumeration with a `MATCH` pattern. Safe on production-sized keysets. |
| `redis_info` / `redis_dbsize` / `redis_type` | Server introspection. |

## Vector tools

Upstash Vector is the serverless vector database the same console exposes. Use these to manage indexes and run similarity search.

| Tool | What it does |
|---|---|
| `vector_list_indexes` | List every Vector index in the account. |
| `vector_create_index` | Provision a new Vector index, choosing dimension, distance metric (`COSINE`, `EUCLIDEAN`, `DOT_PRODUCT`), and region. |
| `vector_get_index` | Return the configuration of a single Vector index. |
| `vector_delete_index` | Delete a Vector index and all of its vectors. |
| `vector_upsert` | Insert or update a batch of vectors (raw floats or a generated embedding). |
| `vector_query` | Run a KNN or range search against an index; returns top-k matches with score and metadata. |
| `vector_delete_vectors` | Delete a batch of vectors by ID. |
| `vector_fetch` | Fetch a batch of vectors by ID. |
| `vector_reset` | Wipe every vector in an index. |

## QStash tools

QStash is Upstash's message queue and webhook scheduler. These tools cover the queue surface — publishing, scheduling, inspecting delivery, and reading logs.

| Tool | What it does |
|---|---|
| `qstash_publish` | Enqueue a single message to a destination URL, with optional delay, retries, dedupe, and headers. |
| `qstash_publish_batch` | Enqueue a batch of messages in one call. |
| `qstash_schedule` | Create a recurring or one-off scheduled publish. |
| `qstash_list_schedules` | List every active schedule, filterable by destination. |
| `qstash_delete_schedule` | Delete a schedule. |
| `qstash_get_message` | Fetch the state of a single in-flight or completed message. |
| `qstash_list_messages` | List recent messages, filterable by state, source, and time window. |
| `qstash_list_logs` | Pull the per-message delivery log (every retry, every response code, every DLQ hop). |
| `qstash_list_dlq` | List everything currently sitting in the dead-letter queue. |

## Workflow tools

Upstash Workflow is a durable-function runtime. These tools are the operational surface — list runs, read state, retry, pause.

| Tool | What it does |
|---|---|
| `workflow_list_runs` | List every workflow run, filterable by workflow name, status (`running`, `paused`, `failed`, `completed`), and time window. |
| `workflow_get_run` | Return the full state of one run, including every step result. |
| `workflow_retry_run` | Retry a failed or paused run from the last failed step. |
| `workflow_cancel_run` | Cancel an in-flight run. |
| `workflow_pause_run` / `workflow_resume_run` | Pause or resume a run mid-flight. |
| `workflow_list_failures` | List every failed step across all runs in a window. |
| `workflow_dlq` | List runs that exhausted their retries. |

## Upstash Box tools

Upstash Box is a sandboxed Linux VM with the Upstash CLI preinstalled. The Box tools let the agent create a Box, clone code into it, run commands, snapshot, and fan out copies — useful for ephemeral CI sandboxes and reproducible demo environments.

| Tool | What it does |
|---|---|
| `box_list` | List every Box in the account, with state, region, and size. |
| `box_create` | Provision a new Box, optionally with a region, size, and bootstrap command. |
| `box_get` | Return the state, network info, and last-known logs of a Box. |
| `box_run` | Run a shell command inside a Box. Returns stdout, stderr, and exit code. |
| `box_logs` | Stream the recent logs of a Box. |
| `box_delete` | Tear down a Box. |
| `box_snapshot` | Snapshot a Box's filesystem into a reusable image. |
| `box_clone_from_snapshot` | Create N copies of a snapshot, each one independently runnable. |
| `box_assign` | Attach a Box (or a Box clone) to a GitHub issue, PR, or external label. |
| `box_stop` / `box_start` | Stop or start a Box (state is preserved). |

> Box tools are gated behind a **Box API key** (`--box-api-key` or `UPSTASH_BOX_API_KEY`). The plain Redis / Vector / QStash / Workflow key does not unlock them.

## Account and billing tools

| Tool | What it does |
|---|---|
| `account_get` | Return the current account's email, plan, default region, and created date. |
| `list_regions` | List every region currently offered (and which ones your plan can deploy into). |
| `list_usage` | Return usage and cost for the current billing period, broken down by product. |
| `list_invoices` | List past invoices with download links. |

## Usage rules

- **Prefer the typed data tool over a raw `redis_run_command` call.** If the user says "store this profile", use the hash tool — not a `SET` with a JSON blob — unless they explicitly want a string. The typed tools preserve structure and let you update individual fields later.
- **Use `redis_scan` for key discovery, never a `KEYS *` equivalent.** A `MATCH <pattern>` with `COUNT <hint>` is the only safe way to enumerate keys on a production-sized Upstash database.
- **Pick the right lifetime for Redis entries.** Cache keys (`cache:*`, `session:*`, `ratelimit:*`) need a TTL; durable data (user records, order history) does not. Use `EXPIRE` to add a lifetime to an existing key, and `PERSIST` to strip one.
- **Use a read-only API key when the task is read-only.** A read-only key automatically disables every mutating tool, so the agent can introspect the account without the ability to delete a database, drop a vector index, or retry a workflow.
- **Never echo the API key back into a log, tool response, or error message.** Reference it by env-var name (`UPSTASH_API_KEY`); the toolset will inject it on startup.
- **Region matters.** Upstash databases are pinned to one region at create time. List the user's existing regions first (with `list_regions`) and prefer reusing one they already use, to keep latency flat and stay inside the free tier per region.
- **Vector indexes have a fixed dimension.** A `vector_create_index` is immutable on dimension. If the embedding model is going to change, plan ahead and pick the largest dimension you will need.
- **QStash retries have a budget.** The default is 3 retries with exponential backoff. A run that hits the budget lands in the DLQ — use `qstash_list_dlq` and `qstash_list_logs` to triage before re-publishing.
- **Tear down Boxes when you are done.** A Box is a billable running VM. Stop it (state preserved) for short pauses; `box_delete` for permanent teardown.
- **Confirm before destructive Upstash ops.** `redis_delete_database`, `vector_delete_index`, `vector_reset`, `qstash_delete_schedule`, `workflow_cancel_run`, and `box_delete` are not reversible. Wait for an explicit "yes" from the user before invoking them.
- **Disable telemetry when the user asks.** Pass `--disable-telemetry` (or set `DO_NOT_TRACK=1`) to opt out of the anonymous diagnostic ping.

## Connection arguments

Edit the toolset `args` list to customize the launch. The most common ones:

| Flag | Purpose |
|---|---|
| `--email <email>` | Email of the Upstash account owner. |
| `--api-key <key>` | Upstash API key (read-write or read-only). |
| `--box-api-key <key>` | Box-specific API key. Unlocks the Box tools. |
| `--debug` | Verbose logging to `stderr`. Use while developing, then drop. |
| `--disable-telemetry` | Opt out of the anonymous diagnostic ping (SDK version, runtime, OS/arch). |

Precedence is `args > env > default`, so a CLI flag overrides the matching env var if both are set.

## Environment variables

The toolset reads these (defaults from the upstream `upstash/mcp-server`):

| Variable | Default | Purpose |
|---|---|---|
| `UPSTASH_EMAIL` | — | Account email. Required if `--email` is not passed. |
| `UPSTASH_API_KEY` | — | Upstash API key. Required if `--api-key` is not passed. |
| `UPSTASH_BOX_API_KEY` | — | Box API key. Optional; only needed for the Box tools. |
| `UPSTASH_DISABLE_TELEMETRY` | `false` | Set to `1` to suppress the diagnostic ping. |
| `UPSTASH_LOG_LEVEL` | `INFO` | One of `DEBUG`, `INFO`, `WARN`, `ERROR`. |

## Common recipes

- **Provision a fresh Redis database in a chosen region.** Call `redis_create_database` with `region: "eu-west-1"`, capture the returned `id` and `endpoint`, then `redis_run_command` a `PING` to confirm reachability.
- **Back up before a destructive migration.** `redis_create_backup` returns a `backupId`; pin that ID in your change log, then `redis_run_command` your migration script, then `redis_list_backups` to confirm the backup is still listed.
- **Vector RAG pipeline.** `vector_create_index` with `dimension: 1536, distance: "COSINE"` → `vector_upsert` for each embedded chunk → `vector_query` at retrieval time with `topK: 5`.
- **Triage a failing QStash webhook.** `qstash_list_dlq` to see what is queued → `qstash_list_logs` against the failing message ID → read the response codes and body snippets → fix the destination → re-publish.
- **Fan out a Box for a release.** `box_create` → `box_run` to clone the repo and run the build → `box_snapshot` once the build is green → `box_clone_from_snapshot` with `count: 25` to hand each reviewer an identical environment.
- **Cost review.** `list_usage` for the current billing period, broken down by Redis / Vector / QStash / Workflow / Box.

## Standalone HTTP server

If the IDE runs in a worker process or the host has no `stdio` channel, the server can be launched standalone and consumed over HTTP:

```bash
npx -y @upstash/mcp-server@latest --port 8931
# then in the MCP client:
# { "mcpServers": { "upstash": { "url": "http://localhost:8931/mcp" } } }
```

## Security notes

- The Upstash API key is a credential. Treat `UPSTASH_API_KEY` (and `UPSTASH_BOX_API_KEY`) like any other secret — never commit it, never echo it in tool responses, and prefer a read-only key for introspection tasks.
- The Box tools have full shell access inside the Box they create. They are not a sandbox against the host machine, only against other Boxes. A bad `box_run` command can still exfiltrate anything inside the Box itself.
- Upstash resources are billable. Always confirm before `redis_delete_database`, `vector_reset`, or `box_delete`; these are not reversible.
- This skill is not a security boundary. Anyone who can issue tool calls against the connected Upstash account can read, mutate, or delete every resource in it.

## References

- Upstream server: <https://github.com/upstash/mcp-server>
- npm package: <https://www.npmjs.com/package/@upstash/mcp-server>
- Upstash documentation: <https://upstash.com/docs>
- Upstash homepage: <https://upstash.com/>
- License: MIT
