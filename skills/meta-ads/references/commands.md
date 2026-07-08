# Meta Ads CLI Command Reference

Complete reference for every `meta` command. All commands return structured JSON when using `--output json`. Use this reference whenever a command shape, flag, or allowed enum value is unclear.

Command syntax: `meta [global options] ads <resource> <action> [options]` or `meta auth <action>`.

Global flags (`--output`, `--no-color`, `--no-input`, `--debug`, `--help`, `--version`) go **before** `ads`.

---

## Authentication

### `meta auth status`

Check authentication status. Shows a masked version of the stored token.

```bash
meta auth status
```

The system user access token must be set in `.env` or as `ACCESS_TOKEN` environment variable. Required scopes: `business_management`, `ads_management`, `pages_show_list`, `pages_read_engagement`, `pages_manage_ads`, `catalog_management`, `read_insights`.

---

## Ad Accounts

### `meta ads adaccount list`

List all ad accounts the authenticated user can access.

```bash
meta ads adaccount list
meta ads adaccount list --limit 50
meta --output json ads adaccount list
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 25 | Max accounts to return |

**Output columns:** `id`, `name`, `account_status`, `currency`, `timezone_name`

### `meta ads adaccount current`

Show the currently configured ad account ID (from `--ad-account-id` flag or `AD_ACCOUNT_ID` env var).

```bash
meta ads adaccount current
```

---

## Facebook Business Pages

### `meta ads page list`

List all Facebook Business Pages the authenticated user can access. Use the returned IDs with `--page-id` when creating ad creatives.

```bash
meta ads page list
meta ads page list --limit 50
meta --output json ads page list
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 25 | Max pages to return |

**Output columns:** `id`, `name`, `category`

---

## Ad Campaigns

### `meta ads campaign list`

List ad campaigns in the configured ad account.

```bash
meta ads campaign list
meta ads campaign list --limit 25
meta --output json ads campaign list
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 10 | Max campaigns to return |

**Output columns:** `name`, `effective_status`, `id`, `objective`, `daily_budget`, `lifetime_budget`, `start_time`

### `meta ads campaign create`

Create a new ad campaign.

```bash
meta ads campaign create --name "My Campaign" --objective OUTCOME_TRAFFIC
meta ads campaign create --name "Sales Campaign" --objective OUTCOME_SALES --daily-budget 5000
meta ads campaign create --name "Awareness" --objective OUTCOME_AWARENESS --lifetime-budget 100000
```

| Option | Required | Default | Description |
|---|---|---|---|
| `--name` | Yes | — | Campaign name |
| `--objective` | Yes | — | Campaign objective |
| `--daily-budget` | No | — | Daily budget in cents (5000 = $50.00) |
| `--lifetime-budget` | No | — | Lifetime budget in cents |
| `--status` | No | `PAUSED` | Initial status: `ACTIVE` or `PAUSED` |

**Objectives:** `OUTCOME_APP_PROMOTION`, `OUTCOME_AWARENESS`, `OUTCOME_ENGAGEMENT`, `OUTCOME_LEADS`, `OUTCOME_SALES`, `OUTCOME_TRAFFIC`

### `meta ads campaign get`

Get details of a specific campaign.

```bash
meta ads campaign get <CAMPAIGN_ID>
meta --output json ads campaign get <CAMPAIGN_ID>
```

### `meta ads campaign update`

Update a campaign. At least one option required.

```bash
meta ads campaign update <CAMPAIGN_ID> --name "New Name"
meta ads campaign update <CAMPAIGN_ID> --status ACTIVE
meta ads campaign update <CAMPAIGN_ID> --daily-budget 10000
```

| Option | Description |
|---|---|
| `--name` | New campaign name |
| `--status` | New status: `ACTIVE`, `PAUSED`, `ARCHIVED` |
| `--daily-budget` | New daily budget in cents |
| `--lifetime-budget` | New lifetime budget in cents |

### `meta ads campaign delete`

Delete a campaign **and all its ad sets and ads**. This cascades downward and is irreversible.

```bash
meta ads campaign delete <CAMPAIGN_ID>
meta ads campaign delete <CAMPAIGN_ID> --force    # Skip confirmation
```

| Option | Short | Description |
|---|---|---|
| `--force` | `-f` | Skip confirmation prompt |

---

## Ad Sets

### `meta ads adset list`

List ad sets. Optionally filter by campaign.

```bash
meta ads adset list                          # All ad sets in account
meta ads adset list <CAMPAIGN_ID>             # Filter by campaign
meta ads adset list --limit 25
```

| Argument | Required | Description |
|---|---|---|
| `<CAMPAIGN_ID>` | No | Filter ad sets in this campaign |

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 10 | Max ad sets to return |

**Output columns:** `name`, `effective_status`, `id`, `optimization_goal`, `billing_event`, `daily_budget`, `lifetime_budget`, `start_time`

### `meta ads adset create`

Create an ad set for a campaign.

```bash
# Traffic ad set
meta ads adset create <CAMPAIGN_ID> --name "US Audience" \
  --optimization-goal LINK_CLICKS --billing-event IMPRESSIONS \
  --bid-amount 500 --targeting-countries US

# Conversion ad set with Pixel tracking
meta ads adset create <CAMPAIGN_ID> --name "Purchase Conversions" \
  --optimization-goal OFFSITE_CONVERSIONS \
  --billing-event IMPRESSIONS --pixel-id <PIXEL_ID> \
  --custom-event-type PURCHASE --targeting-countries US,CA
```

| Option | Required | Default | Description |
|---|---|---|---|
| `--name` | Yes | — | Ad set name |
| `--optimization-goal` | Yes | — | Optimization goal |
| `--billing-event` | Yes | — | Billing event |
| `--daily-budget` | No | — | Daily budget in cents. Omit if campaign uses CBO. |
| `--lifetime-budget` | No | — | Lifetime budget in cents. Requires `--end-time`. |
| `--bid-amount` | No | — | Bid amount in cents |
| `--start-time` | No | — | Start time (ISO 8601) |
| `--end-time` | No | — | End time (ISO 8601). Required with `--lifetime-budget`. |
| `--status` | No | `PAUSED` | Initial status: `ACTIVE` or `PAUSED` |
| `--targeting-countries` | No | — | Comma-separated country codes (e.g., `US,CA,GB`) |
| `--pixel-id` | No | — | Dataset (pixel) ID for conversion tracking |
| `--custom-event-type` | No | `PURCHASE` | Conversion event type. Used with `--pixel-id`. |

**Optimization Goals:** `APP_INSTALLS`, `CONVERSATIONS`, `EVENT_RESPONSES`, `IMPRESSIONS`, `LANDING_PAGE_VIEWS`, `LEAD_GENERATION`, `LINK_CLICKS`, `OFFSITE_CONVERSIONS`, `PAGE_LIKES`, `POST_ENGAGEMENT`, `REACH`, `THRUPLAY`, `VALUE`

**Billing Events:** `APP_INSTALLS`, `CLICKS`, `IMPRESSIONS`, `LINK_CLICKS`, `PAGE_LIKES`, `POST_ENGAGEMENT`, `THRUPLAY`

**Custom Event Types:** `ADD_PAYMENT_INFO`, `ADD_TO_CART`, `ADD_TO_WISHLIST`, `COMPLETE_REGISTRATION`, `CONTACT`, `CONTENT_VIEW`, `CUSTOMIZE_PRODUCT`, `DONATE`, `FIND_LOCATION`, `INITIATED_CHECKOUT`, `LEAD`, `OTHER`, `PURCHASE`, `SCHEDULE`, `SEARCH`, `START_TRIAL`, `SUBMIT_APPLICATION`, `SUBSCRIBE`

### `meta ads adset get`

Get details of a specific ad set.

```bash
meta ads adset get <AD_SET_ID>
meta --output json ads adset get <AD_SET_ID>
```

### `meta ads adset update`

Update an ad set. At least one option required.

```bash
meta ads adset update <AD_SET_ID> --name "New Name"
meta ads adset update <AD_SET_ID> --status ACTIVE
meta ads adset update <AD_SET_ID> --daily-budget 10000
meta ads adset update <AD_SET_ID> --bid-amount 750
```

| Option | Description |
|---|---|
| `--name` | New ad set name |
| `--status` | New status: `ACTIVE`, `PAUSED`, `ARCHIVED` |
| `--daily-budget` | New daily budget in cents |
| `--lifetime-budget` | New lifetime budget in cents |
| `--bid-amount` | New bid amount in cents |
| `--end-time` | New end time (ISO 8601) |

### `meta ads adset delete`

Delete an ad set **and all its ads**. Cascades downward.

```bash
meta ads adset delete <AD_SET_ID>
meta ads adset delete <AD_SET_ID> --force    # Skip confirmation
```

| Option | Short | Description |
|---|---|---|
| `--force` | `-f` | Skip confirmation prompt |

---

## Ads

### `meta ads ad list`

List ads. Optionally filter by ad set.

```bash
meta ads ad list                    # All ads in account
meta ads ad list <AD_SET_ID>         # Filter by ad set
meta ads ad list --limit 25
```

| Argument | Required | Description |
|---|---|---|
| `<AD_SET_ID>` | No | Filter ads in this ad set |

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 10 | Max ads to return |

**Output columns:** `name`, `effective_status`, `id`, `adset_id`, `campaign_id`, `created_time`

### `meta ads ad create`

Create an ad in an ad set. Requires a pre-existing ad creative.

```bash
meta ads ad create <AD_SET_ID> --name "My Ad" --creative-id <CREATIVE_ID>
meta ads ad create <AD_SET_ID> --name "Conversion Ad" --creative-id <CREATIVE_ID> --pixel-id <PIXEL_ID>
```

| Option | Required | Default | Description |
|---|---|---|---|
| `--name` | Yes | — | Ad name |
| `--creative-id` | Yes | — | Ad creative ID to use |
| `--status` | No | `PAUSED` | Initial status: `ACTIVE` or `PAUSED` |
| `--pixel-id` | No | — | Dataset (pixel) ID for conversion tracking |
| `--tracking-specs` | No | — | Raw JSON tracking specs (mutually exclusive with `--pixel-id`) |

**Note:** Use `--pixel-id` **or** `--tracking-specs`, not both.

### `meta ads ad get`

Get details of a specific ad.

```bash
meta ads ad get <AD_ID>
meta --output json ads ad get <AD_ID>
```

### `meta ads ad update`

Update an ad. At least one option required.

```bash
meta ads ad update <AD_ID> --name "New Name"
meta ads ad update <AD_ID> --creative-id <NEW_CREATIVE_ID>
meta ads ad update <AD_ID> --status ACTIVE
```

| Option | Description |
|---|---|
| `--name` | New ad name |
| `--creative-id` | New ad creative ID |
| `--status` | New status: `ACTIVE`, `PAUSED`, `ARCHIVED` |

### `meta ads ad delete`

Delete an ad.

```bash
meta ads ad delete <AD_ID>
meta ads ad delete <AD_ID> --force    # Skip confirmation
```

| Option | Short | Description |
|---|---|---|
| `--force` | `-f` | Skip confirmation prompt |

---

## Ad Creatives

### `meta ads creative list`

List ad creatives in the ad account.

```bash
meta ads creative list
meta ads creative list --limit 25
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 10 | Max creatives to return |

**Output columns:** `name`, `id`, `status`, `title`, `body`

### `meta ads creative create`

Create an ad creative. Supports two modes: **standard** (single asset) and **Dynamic Creative Optimization** (multiple variants, Meta tests combinations).

#### Standard — link ad (most common)

```bash
meta ads creative create --name "Summer Sale" --image ./banner.jpg \
  --page-id <PAGE_ID> --body "50% off everything!" \
  --link-url https://example.com --title "Shop Now" \
  --call-to-action SHOP_NOW
```

| Option | Required | Description |
|---|---|---|
| `--name` | Yes | Creative name |
| `--page-id` | Yes | Facebook Business Page ID (identity of the ad) |
| `--image` | No* | Path to image file |
| `--video` | No* | Path to video file |
| `--body` | No | Main body text / ad copy |
| `--title` | No | Title text below image |
| `--link-url` | No | Destination URL on click |
| `--description` | No | Link description below title |
| `--call-to-action` | No | CTA button type |
| `--instagram-actor-id` | No | Instagram account ID for Instagram placements |

*Provide `--image` **or** `--video`, not both.

#### Standard — video ad

```bash
meta ads creative create --name "Video Promo" --page-id <PAGE_ID> \
  --video ./promo.mp4 --body "Watch our new collection" \
  --title "New Arrivals" --link-url https://example.com/new
```

#### Standard — page photo post (no link URL)

```bash
meta ads creative create --name "Page Post" --page-id <PAGE_ID> \
  --image ./photo.jpg --body "Check out our latest product!"
```

#### Dynamic Creative Optimization (DCO)

Requires `--link-url` and at least one image or video. Uses plural flags — repeat each for multiple variants. Meta automatically tests combinations and optimizes for best performers.

```bash
meta ads creative create --name "DCO Test" --page-id <PAGE_ID> \
  --link-url https://example.com \
  --images ./img1.jpg --images ./img2.jpg --images ./img3.jpg \
  --titles "Shop Now" --titles "Learn More" \
  --bodies "50% off everything!" --bodies "Free shipping today!" \
  --descriptions "Limited time offer" --descriptions "While supplies last" \
  --call-to-actions SHOP_NOW --call-to-actions LEARN_MORE
```

| Option | Max | Description |
|---|---|---|
| `--images` | 10 | Image file paths (repeat for each) |
| `--videos` | 10 | Video file paths (repeat for each) |
| `--titles` | 5 | Title variations (repeat for each) |
| `--bodies` | 5 | Body text variations (repeat for each) |
| `--descriptions` | 5 | Description variations (repeat for each) |
| `--call-to-actions` | 5 | CTA types (repeat for each) |

### Format auto-detection

| Conditions | Format |
|---|---|
| `--video` provided | Video ad |
| `--link-url` provided (no video) | Link ad |
| No video or link URL | Page photo post |

### Supported media formats

**Images:** `.jpg`, `.jpeg`, `.png`, `.gif`, `.bmp`, `.webp`
**Videos:** `.mp4`, `.mov`, `.avi`, `.mkv`, `.wmv`

The CLI auto-uploads media files on create/update.

### CTA types

`APPLY_NOW`, `BOOK_TRAVEL`, `BUY_NOW`, `CONTACT_US`, `DOWNLOAD`, `GET_OFFER`, `GET_QUOTE`, `LEARN_MORE`, `NO_BUTTON`, `OPEN_LINK`, `SHOP_NOW`, `SIGN_UP`, `SUBSCRIBE`, `WATCH_MORE`

### Instagram placements

```bash
meta ads creative create --name "Insta Ad" --page-id <PAGE_ID> \
  --instagram-actor-id <INSTAGRAM_ACCOUNT_ID> \
  --image ./banner.jpg --body "Shop our collection" \
  --link-url https://example.com
```

### `meta ads creative get`

Get details of a specific creative.

```bash
meta ads creative get <CREATIVE_ID>
meta --output json ads creative get <CREATIVE_ID>
```

### `meta ads creative update`

Update specific fields on an existing creative. Only specified fields change.

```bash
meta ads creative update <CREATIVE_ID> --name "New Name"
meta ads creative update <CREATIVE_ID> --body "Updated copy" --title "New Title"
meta ads creative update <CREATIVE_ID> --image ./new-banner.jpg
meta ads creative update <CREATIVE_ID> --status PAUSED
```

| Option | Description |
|---|---|
| `--name` | New creative name |
| `--image` | New image file to upload |
| `--video` | New video file to upload |
| `--body` | New main body text |
| `--title` | New title |
| `--link-url` | New destination URL |
| `--description` | New link description |
| `--call-to-action` | New CTA button type |
| `--instagram-actor-id` | New Instagram account ID |
| `--status` | New status: `ACTIVE` or `PAUSED` |

**Note:** Some fields cannot be updated post-creation due to Meta API restrictions. If an update fails, create a new creative instead.

### `meta ads creative delete`

Delete an ad creative. **Cannot delete creatives used by active ads** — pause or delete those ads first.

```bash
meta ads creative delete <CREATIVE_ID>
meta ads creative delete <CREATIVE_ID> --force    # Skip confirmation
```

| Option | Short | Description |
|---|---|---|
| `--force` | `-f` | Skip confirmation prompt |

---

## Datasets (Meta Pixels)

### `meta ads dataset list`

List datasets (Meta Pixels / Conversions API endpoints).

```bash
meta ads dataset list
meta ads dataset list --business-id <BUSINESS_ID>
meta ads dataset list --limit 50
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--business-id` | — | Auto-resolved | List datasets owned by this business |
| `--limit` | `-l` | 25 | Max datasets to return |

**Output columns:** `name`, `id`, `creation_time`, `last_fired_time`

### `meta ads dataset get`

Get details of a specific dataset.

```bash
meta ads dataset get <PIXEL_ID>
meta --output json ads dataset get <PIXEL_ID>
```

### `meta ads dataset create`

Create a new dataset (pixel) under a business. The CLI auto-assigns the authenticated user with `ADVERTISE`, `ANALYZE`, and `EDIT` permissions.

```bash
meta ads dataset create --name "My Website Pixel"
meta ads dataset create --name "My Pixel" --business-id <BUSINESS_ID>
```

| Option | Required | Description |
|---|---|---|
| `--name` | Yes | Dataset name |
| `--business-id` | No | Business to create under (auto-resolved from ad account if omitted) |

### `meta ads dataset connect`

Connect a dataset to an ad account and/or product catalog. At least one of `--ad-account-id` or `--catalog-id` required.

```bash
meta ads dataset connect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID>
meta ads dataset connect <PIXEL_ID> --catalog-id <CATALOG_ID>
meta ads dataset connect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID> --catalog-id <CATALOG_ID>
```

| Option | Description |
|---|---|
| `--ad-account-id` | Ad account to connect the dataset to |
| `--catalog-id` | Product catalog to connect the dataset to |
| `--business-id` | Business that owns the dataset (auto-resolved if omitted) |

### `meta ads dataset disconnect`

Remove a dataset's connection from an ad account.

```bash
meta ads dataset disconnect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID>
meta ads dataset disconnect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID> --force
```

| Option | Short | Required | Description |
|---|---|---|---|
| `--ad-account-id` | — | Yes | Ad account to disconnect from |
| `--business-id` | — | No (inferred) | Business that owns the dataset |
| `--force` | `-f` | No | Skip confirmation prompt |

### `meta ads dataset assign-user`

Grant permissions to a user on a dataset.

```bash
meta ads dataset assign-user <PIXEL_ID>                              # Self, default permissions
meta ads dataset assign-user <PIXEL_ID> --user-id <USER_ID>           # Specific user
meta ads dataset assign-user <PIXEL_ID> --tasks ADVERTISE --tasks ANALYZE --tasks EDIT
```

| Option | Default | Description |
|---|---|---|
| `--user-id` | Authenticated user | User ID to assign |
| `--tasks` | `ADVERTISE`, `ANALYZE` | Permissions to grant (repeat for multiple) |

**Available tasks:** `ADVERTISE`, `ANALYZE`, `EDIT`, `UPLOAD`

---

## Product Catalogs

All catalog commands accept `--business-id` (auto-resolved from ad account if omitted, or read from `BUSINESS_ID` env var).

### `meta ads catalog list`

List product catalogs for a business.

```bash
meta ads catalog list
meta ads catalog list --business-id <BUSINESS_ID>
meta ads catalog list --limit 50
```

| Option | Short | Default | Description |
|---|---|---|---|
| `--limit` | `-l` | 25 | Max catalogs to return |

**Output columns:** `name`, `id`, `vertical`, `product_count`, `feed_count`

### `meta ads catalog get`

Get details of a specific catalog.

```bash
meta ads catalog get <CATALOG_ID>
meta --output json ads catalog get <CATALOG_ID>
```

### `meta ads catalog create`

Create a product catalog.

```bash
meta ads catalog create --name "My Product Catalog"
meta ads catalog create --name "Hotel Inventory" --vertical hotels
```

| Option | Required | Default | Description |
|---|---|---|---|
| `--name` | Yes | — | Catalog name |
| `--vertical` | No | `commerce` | Catalog type |

**Verticals:** `adoptable_pets`, `commerce`, `destinations`, `flights`, `generic`, `home_listings`, `hotels`, `local_service_businesses`, `offer_items`, `offline_commerce`, `transactable_items`, `vehicles`

### `meta ads catalog update`

Update a catalog.

```bash
meta ads catalog update <CATALOG_ID> --name "Renamed Catalog"
```

| Option | Description |
|---|---|
| `--name` | New catalog name |

### `meta ads catalog delete`

Delete a product catalog. Cannot delete catalogs with active product feeds or ads referencing them.

```bash
meta ads catalog delete <CATALOG_ID>
meta ads catalog delete <CATALOG_ID> --force    # Skip confirmation
```

| Option | Short | Description |
|---|---|---|
| `--force` | `-f` | Skip confirmation prompt |

---

## Insights

### `meta ads insights get`

Query ad performance data with flexible date ranges, breakdowns, custom fields, sorting, and filtering.

```bash
# Account-level, last 30 days (default)
meta ads insights get

# Specific metrics
meta ads insights get --fields spend,impressions,ctr,cpc,conversions,purchase_roas

# Filter by resource
meta ads insights get --campaign-id <CAMPAIGN_ID>
meta ads insights get --adset-id <AD_SET_ID>
meta ads insights get --ad-id <AD_ID>

# Date range: preset
meta ads insights get --date-preset last_7d
meta ads insights get --date-preset this_month

# Date range: custom
meta ads insights get --since 2024-01-01 --until 2024-01-31

# Time granularity
meta ads insights get --time-increment daily --fields spend
meta ads insights get --time-increment weekly

# Breakdowns (repeatable)
meta ads insights get --breakdown age --breakdown gender
meta ads insights get --breakdown publisher_platform --fields spend,impressions,ctr

# Sorting
meta ads insights get --sort spend_descending
meta ads insights get --sort conversions_ascending

# Limit results
meta ads insights get --campaign-id <ID> --limit 100
```

| Option | Default | Description |
|---|---|---|
| `--date-preset` | `last_30d` | Predefined date range |
| `--since` | — | Start date (YYYY-MM-DD). Requires `--until`. |
| `--until` | — | End date (YYYY-MM-DD). Requires `--since`. |
| `--time-increment` | `all_days` | Granularity: `all_days`, `daily`, `weekly`, `monthly` |
| `--breakdown` | — | Breakdown dimension (repeatable) |
| `--fields` | `spend,impressions,clicks,ctr,cpc,reach` | Comma-separated metrics |
| `--campaign-id` | — | Filter by campaign |
| `--adset-id` | — | Filter by ad set |
| `--ad-id` | — | Filter by ad |
| `--sort` | — | Sort order: `<metric>_ascending` or `<metric>_descending` |
| `--limit` / `-l` | 50 | Max rows to return |

### Date presets

`today`, `yesterday`, `last_3d`, `last_7d`, `last_14d`, `last_30d`, `last_90d`, `this_month`, `last_month`

### Breakdowns

`age`, `gender`, `country`, `publisher_platform`, `device_platform`, `platform_position`, `impression_device`

### Common fields

| Field | Description |
|---|---|
| `spend` | Total amount spent |
| `impressions` | Times ads were shown |
| `reach` | Unique users who saw the ad |
| `clicks` | Total clicks |
| `ctr` | Click-through rate |
| `cpc` | Cost per click |
| `cpm` | Cost per 1,000 impressions |
| `frequency` | Average times each person saw the ad |
| `conversions` | Number of conversions |
| `cost_per_conversion` | Cost per conversion |
| `purchase_roas` | Return on ad spend |

Any valid Meta Insights API field can be used.

---

## Scripting & Automation

### Non-interactive mode

Use `--no-input` and `--force` to suppress all interactive prompts — essential for CI/CD and agent use:

```bash
meta --no-input ads campaign delete <CAMPAIGN_ID> --force
```

### JSON output for piping

```bash
# Get all campaign IDs
meta --output json ads campaign list | jq -r '.[].id'

# Iterate over campaigns
for id in $(meta --output json ads campaign list | jq -r '.[].id'); do
  meta --output json ads insights get --campaign-id "$id" --fields spend,conversions
done
```

### Exit codes in scripts

```bash
meta ads campaign list
case $? in
  0) echo "Success" ;;
  3) echo "Auth error — check ACCESS_TOKEN" ;;
  4) echo "API error — check request" ;;
  5) echo "Not found — verify ID" ;;
esac
```

---

## Full Workflow: First Campaign End-to-End

```bash
# 1. Setup
export ACCESS_TOKEN=<TOKEN>
meta ads adaccount list                              # Find your ad account
export AD_ACCOUNT_ID=<ID>

# 2. Find your Business Page
meta ads page list                                    # Save the PAGE_ID

# 3. Create campaign
meta ads campaign create --name "My First Campaign" --objective OUTCOME_TRAFFIC --daily-budget 5000
# Save CAMPAIGN_ID

# 4. Create ad set
meta ads adset create <CAMPAIGN_ID> --name "US Audience" \
  --optimization-goal LINK_CLICKS --billing-event IMPRESSIONS \
  --targeting-countries US
# Save AD_SET_ID

# 5. Create ad creative
meta ads creative create --name "Hero Banner" --image ./banner.jpg \
  --page-id <PAGE_ID> --body "Check out our deals!" \
  --title "Shop Now" --link-url https://example.com --call-to-action SHOP_NOW
# Save CREATIVE_ID

# 6. Create ad
meta ads ad create <AD_SET_ID> --name "Hero Banner Ad" --creative-id <CREATIVE_ID>
# Save AD_ID

# 7. Review, then activate
meta ads campaign update <CAMPAIGN_ID> --status ACTIVE
meta ads adset update <AD_SET_ID> --status ACTIVE
meta ads ad update <AD_ID> --status ACTIVE
```

## Full Workflow: Conversion Tracking Setup

```bash
# 1. Create a dataset (Pixel)
meta ads dataset create --name "Website Pixel"
# Save PIXEL_ID

# 2. Connect to ad account
meta ads dataset connect <PIXEL_ID> --ad-account-id <AD_ACCOUNT_ID>

# 3. (Optional) Connect to catalog for product-level tracking
meta ads dataset connect <PIXEL_ID> --catalog-id <CATALOG_ID>

# 4. Create conversion campaign
meta ads campaign create --name "Sales Campaign" --objective OUTCOME_SALES

# 5. Create conversion ad set with Pixel
meta ads adset create <CAMPAIGN_ID> --name "Purchase Optimization" \
  --optimization-goal OFFSITE_CONVERSIONS --billing-event IMPRESSIONS \
  --pixel-id <PIXEL_ID> --custom-event-type PURCHASE \
  --targeting-countries US

# 6. Create creative and ad
meta ads creative create --name "Product Ad" --page-id <PAGE_ID> \
  --image ./product.jpg --body "Buy now!" \
  --link-url https://example.com --call-to-action SHOP_NOW
meta ads ad create <AD_SET_ID> --name "Product Ad" --creative-id <CREATIVE_ID> --pixel-id <PIXEL_ID>
```

---

## Exit Codes Reference

| Exit Code | Meaning | Agent Action |
|---|---|---|
| 0 | Success | Parse JSON and present results |
| 1 | General error | Read error message, report to user |
| 2 | Usage / bad argument | Fix command syntax, retry once |
| 3 | Authentication error | Tell user to check ACCESS_TOKEN — may be expired/missing. Do not retry. |
| 4 | API error | Read error details. Retry once if transient; report if persistent. |
| 5 | Resource not found | Verify ID is correct. Ask user to confirm. |

## Quick Reference Card

```bash
# Auth
meta auth status

# Discovery
meta ads adaccount list
meta ads page list

# Campaigns
meta ads campaign list --limit 25
meta ads campaign create --name "X" --objective OUTCOME_TRAFFIC --daily-budget 5000
meta ads campaign get <ID>
meta ads campaign update <ID> --status ACTIVE
meta ads campaign delete <ID> --force

# Ad Sets
meta ads adset list [CAMPAIGN_ID]
meta ads adset create <CAMPAIGN_ID> --name "X" --optimization-goal LINK_CLICKS --billing-event IMPRESSIONS --targeting-countries US
meta ads adset get <ID>
meta ads adset update <ID> --status ACTIVE
meta ads adset delete <ID> --force

# Ads
meta ads ad list [AD_SET_ID]
meta ads ad create <AD_SET_ID> --name "X" --creative-id <CREATIVE_ID>
meta ads ad get <ID>
meta ads ad update <ID> --status ACTIVE
meta ads ad delete <ID> --force

# Creatives
meta ads creative list
meta ads creative create --name "X" --page-id <ID> --image ./img.jpg --body "..." --link-url https://...
meta ads creative get <ID>
meta ads creative update <ID> --body "New copy"
meta ads creative delete <ID> --force

# Datasets (Pixels)
meta ads dataset list
meta ads dataset create --name "X"
meta ads dataset get <ID>
meta ads dataset connect <ID> --ad-account-id <AD_ACCOUNT_ID>
meta ads dataset disconnect <ID> --ad-account-id <AD_ACCOUNT_ID> --force
meta ads dataset assign-user <ID> --tasks ADVERTISE --tasks ANALYZE

# Catalogs
meta ads catalog list
meta ads catalog create --name "X" [--vertical commerce]
meta ads catalog get <ID>
meta ads catalog update <ID> --name "New Name"
meta ads catalog delete <ID> --force

# Insights
meta ads insights get
meta ads insights get --date-preset last_7d --fields spend,impressions,ctr,conversions
meta ads insights get --campaign-id <ID> --breakdown age --breakdown gender
meta ads insights get --since 2024-01-01 --until 2024-01-31 --time-increment daily
meta ads insights get --sort spend_descending --limit 100
```
