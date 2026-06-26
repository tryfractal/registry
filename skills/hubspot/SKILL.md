---
name: hubspot
description: >-
  Connect any agent to a live HubSpot CRM through the official HubSpot MCP
  server. Use this skill when the user wants to query, create, update, or
  delete CRM records — contacts, companies, deals, tickets, leads,
  engagements (calls, emails, meetings, notes, tasks), products, line
  items, quotes, invoices, orders, carts, subscriptions, or segments — or
  read marketing assets such as campaigns, landing pages, and blog posts.
  Triggers on phrases like "look up the contact record for
  jane@example.com", "create a new deal in my pipeline", "summarize open
  tickets assigned to me", "log a call against this contact", "what's the
  deal value for Acme Inc", "add a note to the Acme deal", "show me all
  deals in closing stage", "pull Q3 campaign metrics", "find the owner
  of this company", or any request to read or write HubSpot data. Use this
  skill even if the user says "use HubSpot", "ask my CRM", or "check
  the deal pipeline".
---

# HubSpot Skill

This skill exposes the official **HubSpot MCP server** as a single Fractal toolset. The server speaks the Model Context Protocol over stdio, authenticates with a HubSpot private app access token, and gives the agent read/write access to the full HubSpot CRM object graph plus read-only access to marketing, content, and organizational data.

## Toolset

- `mcp` — HubSpot MCP server (`@hubspot/mcp-server@latest`). Authenticated with a `HUBSPOT_ACCESS_TOKEN` (or `HUBSPOT_PRIVATE_APP_TOKEN`) personal access token from a HubSpot user-level app. Connects to a single HubSpot account per running toolset.

## CRM objects — read & write

| Object | What the agent can do |
|---|---|
| **Contacts** | Search, fetch, create, update, delete. Read every standard and custom property (except sensitive-data properties). Associate with companies, deals, tickets, engagements. |
| **Companies** | Search, fetch, create, update, delete. Read domain, industry, number of employees, lifecycle stage, owner, custom properties. |
| **Deals** | Search, fetch, create, update, delete. Read deal stage, amount, close date, pipeline, deal owner, associated contacts and companies. |
| **Tickets** | Search, fetch, create, update, delete. Read subject, content, status, priority, owner, pipeline, associations. |
| **Leads** | Search, fetch, create, update, delete. Convert leads into contacts / deals / tickets. |
| **Products** | Fetch product catalog: name, price, SKU, description, custom properties. |
| **Line items** | Fetch, create, update, delete line items associated with deals or quotes. |
| **Quotes** | Fetch, create, update, delete sales quotes and their line items. |
| **Invoices** | Fetch, create, update invoices and their line items. |
| **Orders** | Fetch, create, update orders. |
| **Carts** | Fetch e-commerce carts and their line items. |
| **Subscriptions** | Fetch recurring subscription records. |
| **Segments (lists)** | Fetch, create, update active lists / static lists. Add or remove members in bulk. |

## Engagements — read & write

| Object | What the agent can do |
|---|---|
| **Calls** | Log a sales call (duration, outcome, notes, recording URL) against one or more contacts or companies. |
| **Emails** | Log sent or received emails (subject, body, direction, status) against a contact, company, or deal. |
| **Meetings** | Schedule, fetch, update, or delete meetings with attendees. |
| **Notes** | Create, fetch, update, or delete engagement notes attached to any record. |
| **Tasks** | Create, fetch, update, or complete follow-up tasks with due dates, owners, and priorities. |

## Marketing & content — read-only

| Object | What the agent can do |
|---|---|
| **Campaigns** | Fetch campaign metadata and aggregate campaign metrics (impressions, clicks, spend, CTR). |
| **Landing pages** | Fetch landing page name, URL, status, and content. |
| **Website pages** | Fetch site pages and their published content. |
| **Blog posts** | Fetch published blog posts and their content. |

## Organizational context — read-only

| Object | What the agent can do |
|---|---|
| **Users, owners, teams, roles, seats** | Fetch identity and reporting structure. |
| **Pipelines and stages** | Fetch deal, ticket, and other pipeline definitions. |
| **Custom properties** | List every standard and custom property on every object (except sensitive-data properties). |
| **Associations** | Read associations between contacts, companies, deals, tickets, engagements, and any other supported object. |

## Usage rules

- **Always pass an explicit `objectType` and `id` when fetching a single record.** Search and list endpoints return shapes that differ from single-record fetches; calling the right tool avoids ambiguous data.
- **Prefer the search tool for "find by name" requests.** HubSpot's `search` endpoint supports partial-match queries, case-insensitive matching, and result limits. Use it instead of pulling every record and filtering client-side.
- **Always include the property list when you need custom fields.** Default fetches return only common properties. Pass `properties=["name", "email", "custom_field_a", ...]` to opt into custom data.
- **Use associations explicitly.** After creating a deal, associate it to a contact and a company in the same flow. Orphan deals are the most common CRM hygiene issue.
- **Use the pipeline ID, not the pipeline name, when creating or updating deals and tickets.** Pipeline names are human-readable and may collide; IDs are stable.
- **Read sensitivity first.** HubSpot's MCP server never returns values from custom Sensitive Data Properties (PHI, Highly Sensitive Data) and exposes only a read-only view of standard records. If a request depends on a redacted field, surface the limitation to the user.
- **Log every customer-facing action as an engagement.** When you change a deal stage, log a call, send an email, or close a ticket, also create the corresponding engagement record so the timeline stays complete.
- **Batch where possible.** HubSpot's MCP server supports batch create / update / delete. Use batch endpoints instead of looping to stay inside the rate limit and to keep responses compact.
- **Never log the access token.** The token is injected via env vars and must never appear in tool inputs, outputs, comments, or error messages.
- **Never write to a record the user did not authorize.** Reads are cheap; writes need a clear instruction. When in doubt, draft a write as a preview and ask for confirmation.

## Configuration

| Environment variable | Purpose |
|---|---|
| `HUBSPOT_ACCESS_TOKEN` | The private app access token used to authenticate the MCP server. Generate from **Settings → Integrations → User-level apps** in the HubSpot UI. Recommended scope: only the scopes your workflow actually needs (least-privilege). |
| `HUBSPOT_PRIVATE_APP_TOKEN` | Alias accepted by older MCP server versions. If both are set, `HUBSPOT_ACCESS_TOKEN` wins. |
| `HUBSPOT_MCP_PORT` | Optional. Bind the MCP server to a specific local port when running in HTTP mode. |

The HubSpot account administrator must connect first; once the admin user-level app is approved, any agent in the same account can authenticate with the same access token.

## Authentication model

- **OAuth 2.0 (current).** Tokens are issued per user-level app, scoped to the objects and properties the app can read or write.
- **OAuth 2.1 (upcoming).** HubSpot will require PKCE and rotating single-use refresh tokens. The agent must be able to handle refresh tokens that change with every access token renewal.
- **Sensitive data is off by default.** Custom Sensitive Data Properties (including PHI) are never returned by the MCP server, even if a token has the right scope.

## Connection string

The toolset is launched with the stdio transport and the access token injected through the environment. Sample toolset config:

```json
{
  "command": "npx",
  "args": ["-y", "@hubspot/mcp-server@latest"],
  "env": {
    "HUBSPOT_ACCESS_TOKEN": "pat-na1-xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
  }
}
```

## Common workflows

- **Pipeline review.** "Show me every deal in the *Decision maker bought in* stage with amount > $1000, sorted by close date, and tell me who owns each one."
- **Lead enrichment.** "Look up the contact for `jane@example.com`, find their company, list all open deals and tickets for that company, and log a follow-up task for the owner."
- **Activity log.** "Summarize the last five calls, emails, and meetings logged against the Acme Inc deal."
- **List hygiene.** "Pull my active contact list `target_accounts_2026`, count its members, and export the email addresses."
- **Campaign recap.** "What are the impressions, clicks, and spend for the Q3 nurture campaign this month?"
- **Bulk update.** "Add the property `lead_source = partner_referral` to every contact in the list `march_partner_leads`."

## Security notes

- The HubSpot MCP server is not a security boundary. A malicious prompt that exfiltrates CRM data via legitimate tools is still a leak. Restrict the access token's scopes to the minimum the workflow needs.
- Least-privilege the user-level app: grant read where possible, write only where required, and never grant the "All scopes" wildcard.
- Rotate the access token if it appears in any log file, transcript, or pull request.

## References

- Upstream docs: <https://developers.hubspot.com/mcp>
- HubSpot API overview: <https://developers.hubspot.com/docs/api/overview>
- Public API spec collection: <https://github.com/HubSpot/HubSpot-public-api-spec-collection>
- HubSpot homepage: <https://www.hubspot.com/>
- License: MIT (the official MCP server is open source; HubSpot is a registered trademark of HubSpot, Inc.)
