import { FractalToolset } from "@fractal-os/plugin";

/**
 * Resend MCP toolset.
 *
 * Spawns the official `resend-mcp` server and exposes the full Resend
 * platform: emails (send, batch, schedule, cancel, update), contacts,
 * segments, topics, contact properties, broadcasts, domains, API keys,
 * webhooks, and inbound email. Tools are auto-discovered from the upstream
 * server at load time.
 *
 * Requires `RESEND_API_KEY` in the environment. Optional `SENDER_EMAIL_ADDRESS`
 * and `REPLY_TO_EMAIL_ADDRESSES` set sensible defaults for `from:` / `reply-to`
 * so the agent isn't prompted on every send.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Full Resend email platform via the official resend-mcp server — send transactional and marketing email, manage contacts / segments / topics / custom properties, run broadcast campaigns, configure sender domains, API keys, and webhooks, and read inbound email.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Confirm with the user (show the rendered payload, ask for a yes) before calling `send` or `batch send`. Both are non-undoable and deliver to real recipients.",
    },
    {
      type: "always",
      instruction:
        "Use a sender address on a verified domain. If a call fails with a domain error, point the user at https://resend.com/domains rather than retrying with a different from-address.",
    },
    {
      type: "always",
      instruction:
        "Honour topic subscriptions — if a contact has unsubscribed from a topic the send will be suppressed. Report suppression as a normal outcome, not an error.",
    },
    {
      type: "always",
      instruction:
        "Prefer `batch send` only for ≤ ~1000 recipients. Above that, create a Broadcast so the campaign can be scheduled, paused, and analytics-tracked.",
    },
    {
      type: "always",
      instruction:
        "Read the live tool schema with `fractal toolsets get resend::resend --tool <name>` before invoking any non-trivial call — the Resend API is versioned and tool shapes change.",
    },
    {
      type: "never",
      instruction:
        "Never use `onboarding@resend.dev` as a `from` address for production mail. It is restricted to the API key owner and is for testing only.",
    },
    {
      type: "never",
      instruction:
        "Do not echo complete message bodies or attachment contents back into the chat log. Resend returns full email bodies — treat them as PII unless the user asked to see them.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "resend-mcp"],
    setup: {
      RESEND_API_KEY: {
        label: "API key",
        description: "Resend dashboard → API keys. A key with “Sending access” is enough for email.",
        url: "https://resend.com/api-keys",
        placeholder: "re_...",
      },
    },
    env: {
      RESEND_API_KEY: "${RESEND_API_KEY}",
      ...(process.env.SENDER_EMAIL_ADDRESS
        ? { SENDER_EMAIL_ADDRESS: process.env.SENDER_EMAIL_ADDRESS }
        : {}),
      ...(process.env.REPLY_TO_EMAIL_ADDRESSES
        ? {
            REPLY_TO_EMAIL_ADDRESSES: process.env.REPLY_TO_EMAIL_ADDRESSES,
          }
        : {}),
    },
  })
  .build();
