import { FractalToolset } from "@fractal-os/plugin";

/**
 * Context7 MCP toolset.
 *
 * Exposes two tools (auto-discovered from the upstream MCP server):
 *   - `resolve-library-id` — map a human name to a Context7 library ID
 *   - `get-library-docs`   — fetch up-to-date docs + examples for that ID
 *
 * Connection strategy:
 *   - If `CONTEXT7_API_KEY` is set, spawn the local stdio server with the key
 *     (private repos + higher rate limits).
 *   - Otherwise, fall back to the hosted HTTP endpoint
 *     (https://mcp.context7.com/mcp) for public-library access.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Fetch up-to-date, version-pinned documentation and code examples for any library via Context7 MCP. Exposes `resolve-library-id` and `get-library-docs`.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Call `resolve-library-id` before `get-library-docs` whenever the user asks about a library, framework, or SDK — never guess the Context7 library ID.",
    },
    {
      type: "always",
      instruction:
        "Pass a focused `topic` argument to `get-library-docs` (e.g. 'server actions', 'middleware') instead of fetching the full library page.",
    },
    {
      type: "always",
      instruction:
        "Cite the version reported by Context7 in the response so the user knows which release was queried.",
    },
    {
      type: "never",
      instruction:
        "Do not use Context7 to look up language fundamentals, well-known built-ins, or anything that has not changed in years — call the docs only when the answer may have drifted from training data.",
    },
  ])
  .withConnection(
    process.env.CONTEXT7_API_KEY
      ? {
          type: "mcp-server::stdio",
          command: "npx",
          args: [
            "-y",
            "@upstash/context7-mcp",
            "--api-key",
            process.env.CONTEXT7_API_KEY,
          ],
        }
      : {
          type: "mcp-server::http",
          url: "https://mcp.context7.com/mcp",
        },
  )
  .build();
