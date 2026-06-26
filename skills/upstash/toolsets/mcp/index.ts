import { FractalToolset } from "@fractal-os/plugin";

/**
 * Upstash MCP toolset.
 *
 * Spawns the official `@upstash/mcp-server` (from the `upstash/mcp-server`
 * GitHub repository, published on npm as `@upstash/mcp-server`) and exposes
 * every tool it provides: Redis database lifecycle, Redis data primitives
 * (strings, hashes, lists, sets, sorted sets, JSON, streams, pub/sub), Vector
 * index management + similarity search, QStash publish / schedule / logs /
 * DLQ, Workflow run lifecycle, Upstash Box sandboxing + snapshots, and
 * account / billing introspection.
 *
 * Auth is supplied via `--email` and `--api-key` CLI flags (or the matching
 * `UPSTASH_EMAIL` / `UPSTASH_API_KEY` environment variables). A separate
 * `UPSTASH_BOX_API_KEY` (or `--box-api-key`) flag unlocks the Box tools.
 *
 * Read-only API keys are fully supported — the server automatically disables
 * every mutating tool when started with one.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Manage Upstash resources through the official @upstash/mcp-server. Provision, inspect, scale, back up, and delete Upstash Redis databases; run Redis commands (strings, hashes, lists, sets, sorted sets, JSON, streams, pub/sub); create and query Upstash Vector indexes; publish, schedule, and inspect QStash messages and DLQ; manage Upstash Workflow runs; spin up, snapshot, and clone Upstash Box sandboxes; pull account and billing info. Read-only API keys automatically disable all mutating tools.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use a read-only Upstash API key for read-only tasks. The server automatically disables every mutating tool (create / delete / update / backup restore / workflow retry) when started with a read-only key, so the agent can introspect the account without the ability to break it.",
    },
    {
      type: "always",
      instruction:
        "Reference Upstash credentials by env-var name (`UPSTASH_EMAIL`, `UPSTASH_API_KEY`, `UPSTASH_BOX_API_KEY`) — never echo the value of any API key, password, or Redis endpoint back into a log, tool response, or error message.",
    },
    {
      type: "always",
      instruction:
        "Pass a short human-readable description alongside every mutating call (e.g. \"the staging Redis database in eu-west-1\" or \"the daily-snapshot workflow run\") so the action is self-documenting in the Upstash audit log.",
    },
    {
      type: "always",
      instruction:
        "Prefer the typed Redis data tool (`redis_hash_*`, `redis_list_*`, `redis_sorted_set_*`, `redis_json_*`, `redis_stream_*`) over a raw `redis_run_command`. The typed tools preserve structure and let you update individual fields; a raw `SET` with a JSON blob is opaque to later reads.",
    },
    {
      type: "always",
      instruction:
        "Use `redis_scan` (with `MATCH <pattern>` and `COUNT <hint>`) to enumerate keys. Never call a `KEYS *` equivalent on a production-sized database — it blocks the server and trips monitoring.",
    },
    {
      type: "always",
      instruction:
        "Set a TTL on cache and session keys (`cache:*`, `session:*`, `ratelimit:*`) and skip it on durable data. Use `EXPIRE` to add a lifetime to an existing key and `PERSIST` to strip one.",
    },
    {
      type: "never",
      instruction:
        "Never call `redis_delete_database`, `vector_delete_index`, `vector_reset`, `qstash_delete_schedule`, `workflow_cancel_run`, or `box_delete` without an explicit, current confirmation from the user. These operations are not reversible and are billable.",
    },
    {
      type: "never",
      instruction:
        "Never pass the API key (or the Box key) as a literal in the args list or in a tool call. Supply it via `--api-key` / `--box-api-key` or, preferably, via the `UPSTASH_API_KEY` / `UPSTASH_BOX_API_KEY` environment variables so the value never lands in process listings or tool responses.",
    },
    {
      type: "never",
      instruction:
        "Do not leave a QStash `SUBSCRIBE` / `PSUBSCRIBE` handle or a long-lived `box_run` command dangling. Stateful subscriptions and in-flight Box commands hold real server-side resources — unsubscribe or stop the tool when you are done reading.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "@upstash/mcp-server@latest",
    ],
    env: {
      UPSTASH_EMAIL: "",
      UPSTASH_API_KEY: "",
    },
  })
  .build();
