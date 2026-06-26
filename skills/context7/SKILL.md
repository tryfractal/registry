---
name: context7
description: >-
  Fetch up-to-date, version-pinned documentation and code examples for any
  library, framework, SDK, or API directly from the source via the Context7
  MCP server. Use this skill when the user asks how to use a library
  feature, requests an example from official docs, or when the agent is
  about to write code that depends on an external library whose API may
  have drifted from training data — for example Next.js, React, Hono, Zod,
  Stripe, Prisma, Tailwind, the MCP spec, LangChain, Vue, Svelte, Express,
  Fastify, tRPC, Drizzle, or any other package. Triggers on phrases like
  "use context7", "look up the docs for", "what's the latest API for Zod
  v4", "show me an example from the official docs", "how do I configure
  server actions in Next.js 15", "fetch the Stripe Node SDK README", or
  any request to confirm an external library's API before writing code.
  Use this skill even when the user says "check the docs" or asks for an
  example.
---

# Context7 Skill

Context7 pulls **current, version-pinned documentation and code examples** for any library on npm, PyPI, GitHub, etc., and injects them straight into the agent's context. The two tools exposed by the MCP server are:

- `resolve-library-id` — map a human name ("next.js", "hono", "zod") to a Context7 library ID.
- `get-library-docs` — fetch the docs and examples for that library, optionally scoped to a topic and token budget.

## Toolset

- `mcp` — Context7 MCP server (`@upstash/context7-mcp`). Connects to the hosted endpoint by default and falls back to a local `npx` spawn when an API key is provided.

## Usage rules

- **Use this skill whenever you would otherwise guess at an API.** If the user asks how to use a library feature, call `resolve-library-id` first, then `get-library-docs` with a focused topic.
- **Prefer the hosted endpoint** (`https://mcp.context7.com/mcp`) when the user has a `CONTEXT7_API_KEY` available — it gets higher rate limits and access to private repos. Without a key, the local `npx` stdio server still works for public libraries.
- **Cite the version.** When the docs return a version, mention it in the response so the user knows exactly what you looked up.
- **Don't fetch everything.** Pass a `topic` (e.g. `"server actions"`, `"middleware"`, `"routing"`) to `get-library-docs` to keep responses focused and within the token budget.
- **Library ID not found?** Try a different casing or the package's GitHub owner/repo. If still missing, fall back to the web and tell the user Context7 doesn't index that package yet.

## Configuration

The toolset reads the API key from the `CONTEXT7_API_KEY` environment variable. If it is set, the local server is started with `--api-key` so private repos and higher rate limits are available. If it is unset, the hosted endpoint is used anonymously with public-library access.

## Notes

- The official package is `@upstash/context7-mcp`. See https://context7.com/docs/resources/all-clients for installation in other MCP clients.
