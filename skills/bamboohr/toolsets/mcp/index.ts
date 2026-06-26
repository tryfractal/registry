import { FractalToolset } from "@fractal-os/plugin";

/**
 * BambooHR MCP toolset.
 *
 * Spawns the official `bamboohr/mcp-server` and exposes every employee, PTO,
 * onboarding, and reporting operation as a Fractal tool. The server is a thin
 * MCP wrapper around the public BambooHR Open API
 * (`https://api.bamboohr.com/api/gateway.php/{subdomain}/v1`) and authenticates
 * with HTTP Basic Auth where the API key is the username and any random string
 * is the password.
 *
 * Required environment variables:
 *   - BAMBOOHR_API_KEY    BambooHR API key (160-bit hex). Used as the Basic
 *                         auth username. Treat it like an HRIS root credential.
 *   - BAMBOOHR_SUBDOMAIN  Bare company subdomain, no scheme and no `.bamboohr.com`
 *                         suffix. For `https://acme.bamboohr.com` set this to
 *                         `acme`. The MCP server builds the gateway URL from it.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "HRIS operations powered by the official BambooHR MCP server. Read and write employee records, PTO balances, time-off requests, onboarding workflows, custom reports, and headcount analytics through the BambooHR Open API. Supports fuzzy directory search, ISO 8601 time-off requests, custom tenant fields, and the full set of user-defined tables.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass `BAMBOOHR_SUBDOMAIN` as the bare subdomain only — no `https://` prefix, no `.bamboohr.com` suffix. For `https://acme.bamboohr.com` set it to `acme`. The MCP server derives the gateway URL from it.",
    },
    {
      type: "always",
      instruction:
        "Read the API key from the `BAMBOOHR_API_KEY` environment variable, never from a tool argument. The key is the HTTP Basic username; the password is any non-empty string. If the request returns 401, the key is wrong, expired, or revoked — surface the error to the user, do not retry with a guess.",
    },
    {
      type: "always",
      instruction:
        "Resolve names and emails to a BambooHR `employeeId` with `bamboohr_search_employees` or `bamboohr_get_employee_directory` before calling any `bamboohr_get_employee`, `bamboohr_get_pto_balances`, or `bamboohr_get_time_off_request` tool — those tools require the numeric id.",
    },
    {
      type: "always",
      instruction:
        "Use ISO 8601 date format (`YYYY-MM-DD`) for every time-off argument. For half-day requests include the `AM`/`PM` flag. Before creating a new time-off request, call `bamboohr_who_is_out` for the same date range to check for conflicts.",
    },
    {
      type: "always",
      instruction:
        "Prefer narrow filter arguments (`department`, `location`, `employmentStatus`, `hireDate`) on `bamboohr_list_employees` and `bamboohr_search_employees` over deep pagination. BambooHR rate limits are per-subdomain, not per-tool, so wide pulls are expensive.",
    },
    {
      type: "never",
      instruction:
        "Never call any `update_*`, `create_*`, or approval/denial tool (`bamboohr_update_employee`, `bamboohr_create_time_off_request`, `bamboohr_update_time_off_request`, `bamboohr_update_employee_custom_field`, `bamboohr_add_table_row`) without explicit user confirmation. These mutate real HR records and cannot be undone from the API.",
    },
    {
      type: "never",
      instruction:
        "Never include the raw `BAMBOOHR_API_KEY` value, social security numbers, salary figures, or other sensitive PII in a tool response that will be shown back to the user. Summarize, redact, and let the user request the specific field if they need it.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "@bamboohr/mcp-server@latest",
    ],
    env: {
      BAMBOOHR_API_KEY: "${env:BAMBOOHR_API_KEY}",
      BAMBOOHR_SUBDOMAIN: "${env:BAMBOOHR_SUBDOMAIN}",
    },
  })
  .build();
