import { FractalToolset } from "@fractal-os/plugin";

/**
 * shopify-mcp toolset (geli2001/shopify-mcp).
 *
 * Spawns the shopify-mcp server and exposes 31 tools for managing a
 * Shopify store through the Admin GraphQL API:
 *   - Products: full CRUD + variants + options
 *   - Customers: full CRUD + merge + addresses
 *   - Orders: smart lookup, cancel, close/open, mark as paid, fulfill, refund
 *   - Draft Orders: create + complete
 *   - Metafields: get / set / delete on any resource
 *   - Inventory: set absolute quantities at locations
 *   - Tags: add / remove on any taggable resource
 *
 * Authentication: OAuth client credentials (recommended) or legacy
 * static access token. Scopes required: read/write products, customers,
 * and orders.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Shopify store management via geli2001/shopify-mcp — 31 tools for products, customers, orders, metafields, inventory, tags, and draft orders through the Admin GraphQL API. Full CRUD + smart order lookup + cursor-based pagination + Shopify query syntax filtering.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Confirm with the user before calling `delete-product`, `delete-customer`, `order-cancel`, or `refund-create` — these are irreversible operations.",
    },
    {
      type: "always",
      instruction:
        "Call `get-product-by-id` before `manage-product-options` or `manage-product-variants` to get the product GID.",
    },
    {
      type: "always",
      instruction:
        "Use `get-orders` with Shopify query syntax (e.g. `financial_status:paid fulfillment_status:shipped`) to narrow results instead of paging through all orders.",
    },
    {
      type: "always",
      instruction:
        "Call `get-metafields` on the target resource before `set-metafields` — the set tool is atomic and overwrites existing values.",
    },
    {
      type: "always",
      instruction:
        "Show the user which customer fields will be kept before calling `customer-merge` — merging customers is permanent.",
    },
    {
      type: "always",
      instruction:
        "Preferred order lookup: try the order name (`#77235`) first, then numeric ID, then full GID. All three work with `get-order-by-id`.",
    },
    {
      type: "never",
      instruction:
        "Never call `order-cancel` without the `reason` and `restock` parameters — both are required.",
    },
    {
      type: "never",
      instruction:
        "Never promise a GraphQL mutation will succeed without the user confirming it. The shopify-mcp server executes mutations directly against the live store.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "shopify-mcp"],
  })
  .build();
