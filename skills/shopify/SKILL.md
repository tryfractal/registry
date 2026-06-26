---
name: shopify
description: >-
  Manage a Shopify store's products, customers, orders, metafields, inventory,
  and tags through the shopify-mcp server (geli2001/shopify-mcp). Use this
  skill when the user wants to list, create, update, or delete products and
  their variants/options; manage customers (CRUD, merge, addresses); handle
  orders (smart lookup, cancel, close/open, mark as paid, fulfill, refund,
  draft orders); set metafields on any resource; manage inventory quantities
  at locations; or add/remove tags on any taggable resource. Triggers on
  phrases like "show me my products", "create a new product", "find a
  customer", "cancel order #12345", "update inventory for SKU PROD-001",
  "set metafields on this product", "create a draft order", "merge these
  two customers", or any request to manage a Shopify store's data. Requires
  a Shopify custom app with Admin API scopes and either client credentials
  or a legacy access token.
---

# Shopify Skill

This skill wraps **`shopify-mcp`** (by geli2001), an MCP server that provides **31 tools** for interacting with the Shopify Admin GraphQL API. All tools support cursor-based pagination, sorting, and advanced filtering using Shopify's query syntax.

## Toolset

- `mcp` — `shopify-mcp` (npm package). Connects to the Shopify Admin GraphQL API. Requires either **client credentials** (Dev Dashboard apps, recommended) or a **static access token** (legacy custom apps).

## Product Management (8 tools)

| Tool | What it does |
|---|---|
| `get-products` | List products with search by title, pagination, sorting, and Shopify query syntax filtering. |
| `get-product-by-id` | Get full product details — SEO, options with values, media, variants, collections, tags, vendor, price range, inventory. |
| `create-product` | Create a product with title, description, vendor, type, tags, status, SEO, metafields, options, and collection membership. |
| `update-product` | Update product fields including SEO, metafields, collections to join/leave, and handle redirects. |
| `delete-product` | Permanently delete a product. |
| `manage-product-options` | Create, update, or delete product options (Size, Color, etc.) with variant strategies. |
| `manage-product-variants` | Bulk create or update variants with price, SKU, weight, barcode, tracked inventory, taxable flag, and option values. |
| `delete-product-variants` | Delete one or more variants from a product. |

## Customer Management (8 tools)

| Tool | What it does |
|---|---|
| `get-customers` | List customers with freetext or query syntax search, sorting, and pagination. |
| `get-customer-by-id` | Get full customer details — name, email, phone, addresses, tags, note, tax status, amount spent, order count, metafields. |
| `create-customer` | Create a customer with name, email, phone, tags, note, tax exemptions, metafields, and addresses. |
| `update-customer` | Update customer info including marketing consent, metafields, and email marketing state. |
| `delete-customer` | Permanently delete a customer. |
| `customer-merge` | Merge two customer records, controlling which fields to keep from which customer. |
| `manage-customer-address` | Create, update, or delete a customer's mailing address with optional default flag. |

## Order Management (10 tools)

| Tool | What it does |
|---|---|
| `get-orders` | List orders with status, query syntax, sorting, and pagination. |
| `get-order-by-id` | Smart lookup — accepts order name (`#77235`), numeric ID, or full GID. Returns pricing, customer, addresses, line items, tags, notes, metafields, cancel reason, return status, discount codes. |
| `update-order` | Update order tags, email, note, phone, PO number, custom attributes, metafields, and shipping address. |
| `get-customer-orders` | Get all orders for a specific customer. |
| `order-cancel` | Cancel an order with reason, restock, refund, and customer notification. **Irreversible.** |
| `order-close-open` | Close or reopen an order. |
| `order-mark-as-paid` | Mark an order as paid (for manual/offline payments). |
| `create-fulfillment` | Create a fulfillment with tracking info. |
| `refund-create` | Create a full or partial refund with line item restocking and shipping refund. |
| `create-draft-order` | Create a draft order with line items, customer, discounts, and addresses. |

## Draft Order Management (1 tool)

| Tool | What it does |
|---|---|
| `complete-draft-order` | Convert a draft order into a real order. |

## Metafield Management (3 tools)

| Tool | What it does |
|---|---|
| `get-metafields` | Get metafields for any resource — products, orders, customers, variants, collections. Supports namespace filtering and pagination. |
| `set-metafields` | Create or update up to 25 metafields atomically on any resource. |
| `delete-metafields` | Delete metafields from any resource. |

## Inventory Management (1 tool)

| Tool | What it does |
|---|---|
| `inventory-set-quantities` | Set absolute inventory quantities (available or on_hand) at specific locations. |

## Tag Management (1 tool)

| Tool | What it does |
|---|---|
| `manage-tags` | Add or remove tags on any taggable resource — orders, products, customers, draft orders, articles. |

## Usage rules

- **Confirm before destructive operations.** `delete-product`, `delete-customer`, `order-cancel`, and `refund-create` are irreversible. Always show the target resource and ask for explicit confirmation.
- **Use `get-product-by-id` before `manage-product-options` or `manage-product-variants`.** These tools require the product GID — get it from the full product lookup.
- **Use `customer-merge` carefully.** Merging customers is permanent. Show the user which fields will be kept from which customer before proceeding.
- **Prefer `refund-create` over manual adjustments.** The refund tool handles restocking and line-item tracking correctly; manual adjustments bypass accounting.
- **Use `create-draft-order` for phone/chat sales and wholesale orders.** Draft orders convert to real orders via `complete-draft-order` — the standard path for non-webstore sales.
- **Set metafields before publishing.** Metafields created after a product is live may need cache purges before they appear on the storefront.
- **Check `get-metafields` before `set-metafields`.** The set tool is atomic — read existing metafields first to avoid overwriting values you want to keep.

## Configuration

### Client Credentials (recommended — Dev Dashboard apps)

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": [
        "shopify-mcp",
        "--clientId", "<YOUR_CLIENT_ID>",
        "--clientSecret", "<YOUR_CLIENT_SECRET>",
        "--domain", "<YOUR_SHOP>.myshopify.com"
      ]
    }
  }
}
```

### Static Access Token (legacy custom apps)

```json
{
  "mcpServers": {
    "shopify": {
      "command": "npx",
      "args": [
        "shopify-mcp",
        "--accessToken", "<YOUR_ACCESS_TOKEN>",
        "--domain", "<YOUR_SHOP>.myshopify.com"
      ]
    }
  }
}
```

### Required Admin API scopes

- `read_products`, `write_products`
- `read_customers`, `write_customers`
- `read_orders`, `write_orders`

## Additional options

- `--apiVersion`: Specify the Shopify API version (default: `2026-01`). Also available as `SHOPIFY_API_VERSION` env var.

## References

- Upstream package: <https://www.npmjs.com/package/shopify-mcp>
- GitHub: <https://github.com/geli2001/shopify-mcp>
- Shopify Admin API: <https://shopify.dev/docs/api/admin-graphql>
- License: MIT
