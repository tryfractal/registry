---
name: bamboohr
description: >-
  Query and manage employee data, PTO, onboarding, and HR operations through
  the official BambooHR MCP server. Use this skill when the user wants to
  look up an employee by name or email, list the company directory, check who
  is on vacation, approve or request time off, see remaining PTO balances,
  run a headcount report, look up a manager, view employee compensation, or
  perform any HRIS task in BambooHR. Triggers on phrases like "find Alice
  in BambooHR", "who is out this week", "how many vacation days does Bob
  have left", "approve this PTO request", "what's the company headcount",
  "show me the org chart", or any request to read or modify HR records in
  a BambooHR account. Use this skill even if the user just says "check
  BambooHR" or asks about employee information.
---

# BambooHR Skill

This skill exposes the official **BambooHR MCP server** as a single Fractal toolset. It connects to the BambooHR REST API (`https://api.bamboohr.com/api/gateway.php/{subdomain}/v1`) using HTTP Basic Authentication where the API key is the username and any random string is the password, and surfaces every employee, PTO, and reporting operation as an MCP tool.

## Toolset

- `mcp` — BambooHR MCP server. Authenticates with the `BAMBOOHR_API_KEY` and `BAMBOOHR_SUBDOMAIN` environment variables, where `{subdomain}` is the text that appears before `.bamboohr.com` in the company URL (e.g. for `https://acme.bamboohr.com`, `subdomain=acme`). The server is a thin MCP wrapper around the public BambooHR Open API, so the available tool list tracks the API surface directly.

## Core employee tools

| Tool | What it does |
|---|---|
| `bamboohr_get_employee` | Fetch a single employee record by BambooHR `employeeId`. |
| `bamboohr_list_employees` | Paginated employee directory with optional field filters. |
| `bamboohr_search_employees` | Fuzzy search across the directory by name, email, job title, department, or location. |
| `bamboohr_get_employee_directory` | Lightweight directory snapshot (id, displayName, jobTitle, department, location, workEmail, supervisorId). |
| `bamboohr_get_employee_custom_fields` | Read tenant-defined custom fields (e.g. `customRemoteWorkPolicy`, `customStockUnitCount`). |
| `bamboohr_update_employee` | Patch a standard employee field (jobTitle, department, location, supervisor, etc.). |
| `bamboohr_update_employee_custom_field` | Patch a single tenant-defined custom field. |

## Time off (PTO) tools

| Tool | What it does |
|---|---|
| `bamboohr_get_pto_balances` | List every policy balance for an employee (vacation, sick, floating holiday, custom). |
| `bamboohr_list_time_off_requests` | List pending, approved, denied, or cancelled time-off requests. Filter by employee, date range, or status. |
| `bamboohr_get_time_off_request` | Fetch a single time-off request by id. |
| `bamboohr_create_time_off_request` | Submit a new PTO request on behalf of an employee. |
| `bamboohr_update_time_off_request` | Approve, deny, or cancel an existing request. |
| `bamboohr_who_is_out` | List everyone out today, tomorrow, this week, or in a custom date range — by holiday, vacation, sick, or all types. |
| `bamboohr_list_holidays` | List the company's configured holidays for a given year. |
| `bamboohr_get_company_holidays` | Same as above, scoped to the tenant's holiday calendar. |

## Reporting & analytics tools

| Tool | What it does |
|---|---|
| `bamboohr_run_custom_report` | Execute a saved custom report by id. Returns CSV / JSON rows. |
| `bamboohr_headcount_report` | Headcount snapshot with optional grouping (department, location, employment status). |
| `bamboohr_turnover_report` | Terminations and starts in a date range, grouped by department. |
| `bamboohr_list_reports` | Discover the tenant's saved custom reports and their ids. |

## Onboarding & HR ops tools

| Tool | What it does |
|---|---|
| `bamboohr_list_new_hires` | Employees whose hire date falls in a date range — useful for onboarding status checks. |
| `bamboohr_list_terminations` | Former employees with a termination date in range. |
| `bamboohr_get_onboarding_status` | Onboarding workflow progress (task list, completion percentage) for a new hire. |
| `bamboohr_list_tables` | List user-defined tables (e.g. `jobInfo`, `compensation`, `emergencyContacts`). |
| `bamboohr_get_table_row` | Read one row of a user-defined table for an employee. |
| `bamboohr_add_table_row` | Append a new row to a user-defined table (e.g. add a dependent to `dependents`). |

## Usage rules

- **Always pass `BAMBOOHR_SUBDOMAIN` (no `https://`, no `.bamboohr.com`).** It is the bare subdomain the company uses to log in. For `https://acme.bamboohr.com`, set `BAMBOOHR_SUBDOMAIN=acme`. The MCP server builds `https://api.bamboohr.com/api/gateway.php/{subdomain}/v1` from it.
- **The API key is sent as HTTP Basic auth, not as a Bearer token.** The key is the username; the password is any non-empty random string. Do not paste the key into tool arguments — let the MCP server read it from `BAMBOOHR_API_KEY`.
- **Use `bamboohr_search_employees` before `bamboohr_get_employee`.** The directory tool is the only way to resolve a display name or email to a BambooHR `employeeId`. `get_employee` requires the numeric id.
- **Time off dates are ISO 8601 (`YYYY-MM-DD`).** Half-days use the `AM` / `PM` flag. Always call `bamboohr_who_is_out` to check for conflicts before creating a new request.
- **Read-only by default.** Approval, denial, termination, and custom-field writes are destructive. Confirm with the user before calling any `update_*`, `create_*`, or `*_request` tool that mutates state.
- **Honor field-level permissions.** BambooHR API keys are scoped to a real user — fields the user can't see in the BambooHR UI are not returned by the API. Don't retry missing fields; surface the gap to the user.
- **Rate limits are per-subdomain, not per-tool.** A burst of `bamboohr_list_employees` calls with deep pagination will get throttled. Prefer `bamboohr_search_employees` with a `where` filter when you can.

## Connection arguments

The toolset is wired with `BAMBOOHR_API_KEY` and `BAMBOOHR_SUBDOMAIN` as required environment variables. The MCP server is launched as a stdio subprocess that reads them at startup. The most common configuration:

| Env var | Required | Purpose |
|---|---|---|
| `BAMBOOHR_API_KEY` | **Yes** | The user's BambooHR API key (160-bit hex). Used as the HTTP Basic username. |
| `BAMBOOHR_SUBDOMAIN` | **Yes** | Bare company subdomain (e.g. `acme` for `acme.bamboohr.com`). |
| `BAMBOOHR_TIMEOUT_MS` | No | Per-request timeout in milliseconds. Default `30000`. |
| `BAMBOOHR_PAGE_SIZE` | No | Override the default `bamboohr_list_employees` page size. Default `200`. |
| `BAMBOOHR_LOG_LEVEL` | No | `debug` / `info` / `warn` / `error`. Default `info`. |

## Security notes

- The BambooHR API key is the equivalent of a full HRIS user session. Any prompt with tool-call reach can read every field that user is permitted to see, and write every field they can edit. Treat it like a database root credential.
- Never echo the API key in tool responses. If a request fails with HTTP 401, the key is wrong, expired, or revoked — do not retry with a guess.
- Custom fields may contain PII, salary, performance ratings, or even social security numbers depending on the tenant's schema. Don't include them in user-visible summaries unless the user explicitly asks.

## References

- BambooHR product: <https://www.bamboohr.com/>
- API documentation: <https://documentation.bamboohr.com/docs>
- OpenAPI spec: <https://documentation.bamboohr.com/openapi.yaml>
- License: MIT
