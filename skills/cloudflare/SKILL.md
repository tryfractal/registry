---
name: cloudflare
description: >-
  Operate the entire Cloudflare platform — DNS, Workers, KV, R2, D1, Pages,
  Vectorize, AI Gateway, Stream, Images, Access, WAF, Load Balancers, and
  Analytics — directly from the agent through the official remote MCP server.
  Use this skill when the user wants to add or delete DNS records, deploy a
  Worker, upload to R2, query D1 with SQL, read or write KV, create a Pages
  project, manage Vectorize, inspect zone analytics, purge cache, configure
  WAF rules, or debug a 5xx. Triggers on phrases like "add an A record for
  api.example.com", "list all my Workers", "create a KV namespace",
  "upload this file to R2", "run SELECT against my D1", "deploy my Pages
  project", "purge the cache for /pricing", "rotate the API token", "list
  my zones", or any request to read or mutate state on the Cloudflare
  platform. Use this skill even if the user says "manage my Cloudflare".
---

# Cloudflare Skill

This skill exposes the **official remote Cloudflare MCP server** (`https://mcp.cloudflare.com/mcp`) as a single Fractal toolset. The server uses Cloudflare's **Code Mode** pattern: the 2M-token OpenAPI spec lives on the server side, and the agent only ships ~1.1k tokens of tool surface to its own context. All ~2,500 Cloudflare API endpoints (Workers, KV, R2, D1, DNS, Pages, Vectorize, Stream, Images, AI Gateway, Access, Gateway, WAF, Load Balancers, GraphQL Analytics, etc.) are reachable through three primitives.

## Toolset

- `mcp` — Cloudflare MCP server, **remote HTTP transport** at `https://mcp.cloudflare.com/mcp`. Authenticate by either OAuth (recommended — connect and authorize in the browser) or by passing a Cloudflare API token as a Bearer header. The server runs in **Code Mode by default**; append `?codemode=false` to the URL to instead expose one tool per API endpoint (much heavier context — only do this when composing with another code-mode system).

## Core tools (always available)

| Tool | What it does |
|---|---|
| `docs` | Search Cloudflare's developer documentation (developers.cloudflare.com) and return relevant snippets. Use this for "how do I…" questions before guessing an endpoint. |
| `search` | Write a JavaScript snippet that runs against `spec.paths` to discover which API endpoints match a query. Returns matching `{ method, path, summary }` records. |
| `execute` | Write a JavaScript snippet that calls `cloudflare.request({ method, path, body?, params? })` against the discovered endpoints and returns the API response. Supports all ~2,500 Cloudflare API endpoints and the GraphQL Analytics API. |

## What you can do with it (non-exhaustive)

| Domain | Example tasks |
|---|---|
| **DNS** | List, create, update, or delete A / AAAA / CNAME / TXT / MX / NS / SRV / CAA records on any zone. |
| **Zones** | List zones, inspect zone settings, add or remove domains, change plan, transfer ownership. |
| **Workers** | List deployed scripts, deploy a new Worker, fetch tail logs, delete a script, set secrets, bind KV / R2 / D1. |
| **KV** | Create / rename / delete namespaces, write and read keys, list keys, set TTL, generate signed URLs. |
| **R2** | List buckets, create or delete buckets, upload objects, generate presigned URLs, set lifecycle rules, configure CORS. |
| **D1** | List databases, create databases, run arbitrary SQL (`query` / `execute` / `batch`), export results, manage migrations. |
| **Pages** | List projects, create projects, deploy, set custom domains, configure environment variables, view build status. |
| **Vectorize** | Create indexes, insert vectors, query by vector, delete by id, list indexes. |
| **AI Gateway** | List gateways, inspect logs, create or update gateway configs, view request / token usage. |
| **Stream** | Upload videos, list videos, fetch playback URLs, set signed token TTL, delete videos. |
| **Images** | Upload images, derive variants, list variants, generate signed URLs. |
| **Access** | List applications, create / update / delete Access apps, manage policies, list service tokens. |
| **Gateway** | List policies, create DNS / network / HTTP policies, list locations. |
| **WAF** | List firewall rules, create / update / delete rules, manage rate limits, custom rulesets, IP lists. |
| **Load Balancers** | List pools, origins, load balancers, create / update health checks. |
| **Cache** | Purge by URL, purge by tag, purge everything, inspect cache rules. |
| **Analytics** | Run GraphQL queries against the Analytics API for HTTP, DNS, Workers, Spectrum, etc. |
| **Account** | List accounts, list members, manage API tokens, list billing items, view subscription. |

## Usage rules

- **Always start with `docs` for "how do I" questions.** The Cloudflare API surface is large and changes frequently. `docs` returns curated developer-docs snippets so you can confirm field names, scopes, and endpoint shape before writing code.
- **Use `search` to discover endpoints, not memorized paths.** Run a small JS snippet that iterates `spec.paths` and filters by tag / path / summary. This is dramatically cheaper than guessing, and the spec is always up to date.
- **Chain `search` → `execute`.** The standard pattern is: `search` to find the matching endpoint, then `execute` a `cloudflare.request(...)` call against it. Read the `search` result to learn required path parameters and request-body shape.
- **Pass `account_id` explicitly for user tokens.** Account-scoped tokens auto-detect the account; user tokens require `account_id` in the `execute` call. Look up the account id with `search` (`/accounts`) if the user did not provide one.
- **For analytics, use the GraphQL endpoint.** Hit `POST /client/v4/graphql` with a GraphQL query through `execute`. The server detects GraphQL endpoints and routes them correctly.
- **Prefer zone-id lookups over zone names.** Most DNS / zone endpoints take a zone id, not a zone name. Resolve with `search` against `/zones` first.
- **Treat `execute` output as live API state.** The response is the real Cloudflare response — surface `success`, `errors`, `result_info` (for pagination), and the raw body faithfully to the user. Do not invent data when an endpoint returns an error.
- **Paginate with `result_info` and `per_page` / `page`.** For list endpoints, loop until `result_info.has_more` is false, or pass `per_page` / `page` explicitly through `params` on `cloudflare.request`.
- **Never log or echo the raw API token.** It grants whatever scopes the token has. Pass it through the MCP auth header only; do not include it in `execute` payloads.
- **Mutations are not idempotent unless the API says so.** Confirm with the user before `DELETE`, `purge_cache` (everything), and bulk updates that touch many records.

## Connection arguments

The toolset connects over HTTP to the remote server. Configure via the `headers` map and the optional `url` query string.

| Argument | Purpose |
|---|---|
| `url` (`https://mcp.cloudflare.com/mcp`) | The remote MCP server endpoint. **Always required.** |
| `?codemode=false` (URL query) | Opt out of Code Mode and expose one tool per API endpoint. Only use when composing with another code-mode system — it ships ~244k tokens instead of ~1.1k. |
| `Authorization: Bearer <CLOUDFLARE_API_TOKEN>` (header) | API token for non-OAuth auth. Needs the scopes for the endpoints you call. Account tokens should include `Account Resources: Read` so the server can auto-detect the account id. |
| OAuth (default) | Use when no `Authorization` header is set — the MCP client opens the browser, you pick the account and grant scopes, done. |

### Recommended scopes (minimum for common tasks)

| Scope | What it unlocks |
|---|---|
| `Zone:Read` | List and inspect zones, list DNS records. |
| `DNS:Edit` | Create / update / delete DNS records. |
| `Zone:Cache Purge` | Purge cache by URL, tag, or everything. |
| `Account:Read` | List workers, KV namespaces, R2 buckets, D1 databases, Pages projects, etc. |
| `Account:Workers Scripts:Edit` | Deploy, update, or delete Workers. |
| `Account:Workers KV Storage:Edit` | Create / delete KV namespaces, write keys. |
| `Account:R2:Edit` | Create / delete R2 buckets, upload / delete objects. |
| `Account:D1:Edit` | Create databases, run SQL. |
| `Account:Pages:Edit` | Create / deploy Pages projects. |
| `Account:Vectorize:Edit` | Create / delete indexes, insert / query vectors. |
| `Account:AI Gateway:Read` | Read gateway configs and logs. |
| `Account:Stream:Edit` | Upload / delete videos. |
| `Account:Images:Edit` | Upload images, manage variants. |
| `Account:Access:Edit` | Create / update / delete Access applications and policies. |
| `Account:Firewall Services:Edit` | Create / update WAF rules, rate limits, lists. |
| `Account:Load Balancers:Edit` | Create / update pools, origins, load balancers. |
| `User:Read` | Read account / membership info for the calling user. |

API tokens with **Client IP Address Filtering** enabled are not currently supported by the server — disable that restriction on the token.

## Code Mode pattern

```js
// 1. Discover the endpoint
search({
  code: `async () => {
    const out = [];
    for (const [path, methods] of Object.entries(spec.paths)) {
      for (const [method, op] of Object.entries(methods)) {
        if (op.tags?.some(t => t.toLowerCase() === 'dns') &&
            op.operationId?.toLowerCase().includes('record')) {
          out.push({ method: method.toUpperCase(), path, summary: op.summary });
        }
      }
    }
    return out;
  }`,
});

// 2. Call the endpoint
execute({
  account_id: "<your-account-id>",
  code: `async () => {
    const r = await cloudflare.request({
      method: "GET",
      path: \`/zones/\${zoneId}/dns_records\`,
      params: { type: "A", name: "api.example.com" },
    });
    return r;
  }`,
});
```

The agent writes JavaScript that runs in a Cloudflare Worker, so each call is isolated and stateless.

## Output mode

By default the server returns API responses inline. For long-running bulk operations (purge everything, list millions of DNS records, dump a large D1 table) prefer small `per_page` windows and explicit pagination, since the full payload is shipped back to the agent's context.

## Security notes

- The MCP server is **not a security boundary**. Any secret reachable through the API token's scopes is reachable through `execute`. Use a least-privilege token — one scope per job — and rotate frequently.
- The server logs the bearer token only for the duration of the request. It is not persisted server-side beyond standard Cloudflare request logging.
- Cloudflare API tokens with **Client IP Address Filtering** are not supported — disable that restriction on the token before using this skill.
- Treat DNS changes as production-impacting. A wrong record can take a service offline; confirm with the user before applying.

## References

- Upstream repo: <https://github.com/cloudflare/mcp>
- Remote MCP endpoint: `https://mcp.cloudflare.com/mcp`
- Cloudflare developer docs: <https://developers.cloudflare.com/api/>
- OpenAPI spec: <https://developers.cloudflare.com/api/resources/openapi.json>
- API token scopes: <https://developers.cloudflare.com/fundamentals/api/reference/permissions/>
- Code Mode blog post: <https://blog.cloudflare.com/code-mode-mcp/>
- License: Apache-2.0
