---
name: meta-ads
description: >-
  Use this skill whenever the user wants to manage Meta advertising —
  create, list, update, or delete ad campaigns, ad sets, ads, or ad
  creatives; query performance insights with custom metrics, date ranges,
  and breakdowns; set up or connect Meta Pixels (datasets) for conversion
  tracking; manage product catalogs for Advantage+ catalog ads; or find
  ad accounts and Facebook Pages. Trigger this skill even when the user
  says "check my ad performance", "how are my campaigns doing", "create a
  new ad", "set up conversion tracking", "pull ROAS for this month",
  "what's my CTR", "launch a campaign", or "pause all my ads" without
  explicitly naming Meta or Facebook — if the task involves paid
  advertising, campaign management, or ad analytics, reach for this
  skill first. Uses the official Meta Ads CLI (Python, pip install
  meta-ads) for structured JSON output. Do NOT use for organic social
  media posting, organic Instagram management, or general social media
  strategy — only paid advertising operations through the Meta Marketing
  API.
---

# Meta Ads Skill

This skill gives the agent full control of Meta advertising through the official **Meta Ads CLI** (`meta-ads` on PyPI). One CLI wraps the entire Meta Marketing API — campaigns, ad sets, ads, creatives, Meta Pixels (datasets), product catalogs, and performance insights — with structured JSON output, three output formats, and consistent exit codes the agent can act on.

## Philosophy

The Meta Ads CLI follows a noun-verb command pattern (`meta ads <resource> <action>`) and treats every advertising resource as fully manageable through CRUD operations. It's built for developers and AI agents — non-interactive by default, JSON-ready, and designed for scripting and automation. No browser. No Ads Manager UI. Just clean terminal commands.

## Prerequisites

Before any command works, the host needs:

1. **Python 3.12+** and `pip install meta-ads`
2. **A Meta System User access token** with these scopes:
   - `business_management`, `ads_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`, `catalog_management`, `read_insights`
3. **An ad account ID** — find it with `meta ads adaccount list`, then set `AD_ACCOUNT_ID` in `.env` or as an env var
4. **A Facebook Business Page ID** (for ad creatives) — find it with `meta ads page list`

Set credentials in a `.env` file or as environment variables:

```
ACCESS_TOKEN=<your-system-user-token>
AD_ACCOUNT_ID=<your-ad-account-id>
BUSINESS_ID=<your-business-id>    # optional, auto-resolved from ad account
```

Configuration precedence (highest to lowest): command-line flags → environment variables → `.env` file → `~/.config/meta/`

## Global flags

Always place these **before** the `ads` subcommand:

| Flag | What it does |
|---|---|
| `--output <format>` / `-o` | Output format: `table` (default, human-readable), `json` (machine, always use this), `plain` (tab-separated for Unix pipes) |
| `--no-color` | Disable colored output |
| `--no-input` | Suppress interactive prompts (for scripting) |
| `--debug` | Enable debug output |
| `--help` / `-h` | Show help text |
| `--version` / `-v` | Show CLI version |

The agent should **always** use `--output json` for machine-readable responses.

## Resource hierarchy and CRUD operations

Meta advertising follows a strict hierarchy. Understanding it prevents mistakes:

```
Ad Account
 └── Campaign (objective + budget)
      └── Ad Set (targeting + optimization + pixel)
           └── Ad (creative reference + tracking)
                └── Ad Creative (media + copy, reusable across ads)
```

Deletes cascade downward: deleting a campaign removes all its ad sets and ads. Deleting an ad set removes its ads.

| Resource | CLI command | Operations |
|---|---|---|
| Ad Accounts | `adaccount` | `list`, `current` |
| Business Pages | `page` | `list` |
| Campaigns | `campaign` | `list`, `create`, `get`, `update`, `delete` |
| Ad Sets | `adset` | `list`, `create`, `get`, `update`, `delete` |
| Ads | `ad` | `list`, `create`, `get`, `update`, `delete` |
| Ad Creatives | `creative` | `list`, `create`, `get`, `update`, `delete` |
| Datasets (Pixels) | `dataset` | `list`, `create`, `get`, `connect`, `disconnect`, `assign-user` |
| Product Catalogs | `catalog` | `list`, `create`, `get`, `update`, `delete` |
| Insights | `insights` | `get` |
| Auth | `auth` | `status` |

For the full reference with every flag, subcommand, option value, and example, read `references/commands.md`. Use it whenever a command shape, flag, or allowed value is unclear.

## Understanding responses

When using `--output json`, every command returns a JSON array:

```json
[
  {
    "id": "123456789",
    "name": "Summer Sale Campaign",
    "effective_status": "ACTIVE",
    "objective": "OUTCOME_TRAFFIC",
    "daily_budget": "5000",
    "start_time": "2024-01-01"
  }
]
```

For list commands, the response is an array of objects. For get commands, typically a single object. Commands like `create` show the created resource.

## Exit codes

| Code | Meaning | What the agent should do |
|---|---|---|
| 0 | Success | Parse the JSON and present results. |
| 1 | General error | Read the error message, report to user. |
| 2 | Usage / bad argument | Fix the command syntax and retry once. |
| 3 | Authentication error | Tell the user to check `ACCESS_TOKEN` — it may be expired or missing. Do not retry. |
| 4 | API error | Read the error details. Retry once if transient; report if persistent. |
| 5 | Resource not found | Verify the ID is correct. Ask the user to confirm. |

## How the agent should operate

### Understand the hierarchy before acting

The most common mistake is trying to create an ad without a creative, or an ad set without a campaign. The agent must follow the chain: campaign → ad set → creative → ad. Always verify each parent resource exists before creating a child.

### Confirm destructive actions

Deleting a campaign cascades to all its ad sets and ads — this is irreversible and can wipe out significant spend history. Before calling `delete` on any resource:
- Show what will be deleted and its children
- Ask for explicit confirmation
- Consider using `--force` only after confirmation (it skips the interactive prompt)

Similarly, activating a campaign (`--status ACTIVE`) will start spending real money. Confirm the budget and targeting before activation.

### Default to paused

The CLI creates everything in `PAUSED` status by default. This is intentional and safe. The agent should follow this pattern: create → review with user → activate only when confirmed. Never set `--status ACTIVE` on creation without explicit user request.

### Use insights to inform decisions

Before creating or modifying campaigns, pull relevant insights. Before increasing a budget, check current spend and ROAS. Before pausing, check recent performance trends. Data should drive every recommendation.

### Handle auth failures gracefully

Exit code 3 means the system user token is expired or invalid. The token lives in the user's `.env` file — the agent can't fix this. Tell the user to regenerate their token in Meta Business Suite, and do not retry.

### Keep credentials invisible

The `ACCESS_TOKEN` is a system user token that grants broad account access. It must never appear in tool inputs, outputs, comments, chat logs, or error messages. Meta stores it in `.env` — the agent references it conceptually but never reveals it.

### Use the command reference

The agent should read `references/commands.md` whenever:
- A command shape, flag, or allowed enum value is unclear
- The user asks about a specific resource type or operation
- Checking whether a capability exists before attempting it
- Looking up optimization goals, billing events, custom event types, or CTA types

## Common workflows

**"Create a traffic campaign with a $50 daily budget targeting the US."**
→ First find the ad account: `meta ads adaccount list`. Then create the campaign: `meta --output json ads campaign create --name "..." --objective OUTCOME_TRAFFIC --daily-budget 5000`. Show the returned campaign ID. Then guide the user through ad set creation (targeting, optimization) and creative creation.

**"How are my campaigns performing this week?"**
→ `meta --output json ads insights get --date-preset last_7d --fields spend,impressions,clicks,ctr,cpc,conversions,purchase_roas`. Present a summary table. Flag campaigns with unusually high CPA or low ROAS. Compare against previous week if historical data is available.

**"Set up conversion tracking for my website."**
→ `meta --output json ads dataset create --name "Website Pixel"`. Then `meta --output json ads dataset connect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID>`. Walk the user through assigning permissions if needed. Show the pixel ID they need to install on their site. Then offer to create a conversion-optimized ad set using this pixel.

**"Create an ad with a video and test different headlines."**
→ Use Dynamic Creative Optimization: `meta --output json ads creative create --name "DCO Test" --page-id <PAGE_ID> --link-url <URL> --videos ./vid1.mp4 --videos ./vid2.mp4 --titles "Title A" --titles "Title B" --bodies "Body 1" --bodies "Body 2"`. Explain that Meta will automatically test combinations and optimize for the best performers. Up to 10 images/videos and 5 of each text variant.

**"Pause all my active campaigns."**
→ First list active campaigns: `meta --output json ads campaign list`. Filter for `effective_status: "ACTIVE"`. Then update each: `meta --output json ads campaign update <ID> --status PAUSED`. Confirm the count with the user before executing. Remind them that campaigns can be reactivated with `--status ACTIVE`.

**"Pull my ad insights broken down by age and gender for the last 30 days."**
→ `meta --output json ads insights get --date-preset last_30d --breakdown age --breakdown gender --fields spend,impressions,ctr,conversions,cost_per_conversion`. Present as a table. Highlight demographic segments with the best and worst performance.

**"Create a product catalog for my e-commerce store."**
→ `meta --output json ads catalog create --name "Spring Collection"` (default vertical is `commerce`). Show the catalog ID. Then offer to connect a pixel for conversion tracking. For specific verticals like hotels or vehicles, use `--vertical hotels`.

## Creative formats

The CLI auto-detects the creative format based on provided flags:

- `--video` → Video ad
- `--link-url` (no video) → Link ad (most common)
- Neither video nor link URL → Page photo post

Supported media: `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp` for images; `.mp4`, `.mov`, `.avi`, `.mkv`, `.wmv` for videos. The CLI uploads files automatically.

For Instagram placements, add `--instagram-actor-id <INSTAGRAM_ACCOUNT_ID>`.

## Insights power tips

- **Default fields** (when `--fields` omitted): `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `reach`
- **Default date range**: `last_30d`
- **Time granularity**: `all_days` (aggregated), `daily`, `weekly`, `monthly`
- **Sorting**: `<metric>_ascending` or `<metric>_descending` (e.g., `spend_descending`)
- **Breakdowns** (repeatable): `age`, `gender`, `country`, `publisher_platform`, `device_platform`, `platform_position`, `impression_device`

## References

- **`references/commands.md`** — Complete CLI reference: every resource, action, flag, option value, and working example. Read this when the agent needs exact syntax, allowed enum values, or is unsure about a command shape.
- **Meta Ads CLI overview:** <https://developers.facebook.com/docs/ads-commerce/ads-ai-connectors/ads-cli/ads-cli-overview>
- **Meta Marketing API docs:** <https://developers.facebook.com/docs/marketing-apis>
- **Getting started:** <https://developers.facebook.com/docs/ads-commerce/ads-ai-connectors/ads-cli/setup/get-started>

## Hosted MCP connection

This skill also includes a `hosted-mcp` toolset at `https://mcp.facebook.com/ads`. It uses Fractal's OAuth authorization flow and discovers tools from the provider after connection. The provider must support the MCP OAuth flow used by Fractal; this endpoint was not independently authorized during registry preparation. Use the current `Meta Ads` connector when its provider-specific setup or guidance is needed, and the hosted toolset when the user wants the provider's remote MCP server.
