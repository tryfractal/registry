import { FractalToolset } from "@fractal-os/plugin";

/**
 * Stripe MCP toolset.
 *
 * Spawns the official `@stripe/mcp` server and exposes every tool it provides:
 *   - stripe_api_search / stripe_api_details / stripe_api_read / stripe_api_write
 *   - get_stripe_account_info
 *   - create_refund
 *   - search_stripe_resources / fetch_stripe_resources
 *   - search_stripe_documentation / stripe_implementation_planner
 *   - send_stripe_mcp_feedback
 *   - stripe_report
 *
 * Authenticates with a Stripe Restricted API Key (RAK) passed via the
 * `STRIPE_SECRET_KEY` environment variable. For Connect platforms, set
 * `STRIPE_CONNECTED_ACCOUNT` to scope all calls to a specific connected
 * account.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Stripe payments platform via the official Stripe MCP server (@stripe/mcp). Exposes the full Stripe API — customers, charges, subscriptions, invoices, refunds, payment intents, products, prices, checkout sessions, payment links, payouts, balances, disputes, connected accounts, reporting — plus Stripe's documentation and knowledge-base search.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use a Stripe Restricted API Key (RAK), never a full secret key. Generate one at https://dashboard.stripe.com/apikeys with only the resources the agent needs (e.g. 'Customers: read/write', 'Charges: read', 'Refunds: write').",
    },
    {
      type: "always",
      instruction:
        "Prefer the typed tools (create_refund, get_stripe_account_info, stripe_report, etc.) over raw stripe_api_write. The typed tools validate parameters and return structured results; stripe_api_write is the escape hatch for the rest of the API.",
    },
    {
      type: "always",
      instruction:
        "For any non-trivial call, call stripe_api_search then stripe_api_details first to confirm the exact endpoint, required parameters, and idempotency requirements before invoking stripe_api_read or stripe_api_write.",
    },
    {
      type: "always",
      instruction:
        "Pass an idempotency_key when calling stripe_api_write for charge, refund, payout, and subscription write operations to prevent double-spend on network retries.",
    },
    {
      type: "always",
      instruction:
        "Confirm with the user whether the active key is a test (sk_test_…) or live (sk_live_…) key before performing any money-moving write. Test mode hits the sandbox; live mode hits production.",
    },
    {
      type: "always",
      instruction:
        "For Connect platforms, scope every call to a connected account either by setting the STRIPE_CONNECTED_ACCOUNT env var (passed as --stripe-account) or by including a Stripe-Account header. The RAK must have the matching Connect permissions enabled.",
    },
    {
      type: "never",
      instruction:
        "Never log, echo, print, or return the raw Stripe API key in tool output or chat. Treat STRIPE_SECRET_KEY like any other secret — read it from env only, never from chat history. Rotate immediately if it ever leaks.",
    },
    {
      type: "never",
      instruction:
        "Never call a write tool (create_refund, stripe_api_write, stripe_report create actions) without an explicit user confirmation in the same turn. Money-moving and resource-creating actions must be gated by a human approval step.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "@stripe/mcp@latest",
      "--api-key",
      "${STRIPE_SECRET_KEY}",
      "--stripe-account",
      "${STRIPE_CONNECTED_ACCOUNT}",
    ],
    env: {
      STRIPE_SECRET_KEY: "${STRIPE_SECRET_KEY}",
      STRIPE_CONNECTED_ACCOUNT: "${STRIPE_CONNECTED_ACCOUNT}",
    },
  })
  .build();
