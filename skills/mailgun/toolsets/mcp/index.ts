import { FractalToolset } from "@fractal-os/plugin";

/**
 * Mailgun MCP toolset.
 *
 * Spawns the official `mailgun-mcp-server` (`@mailgun/mcp-server`, Apache 2.0)
 * and exposes Mailgun's transactional email, deliverability, and account
 * management surface as MCP tools.
 *
 * The server reads `MAILGUN_API_KEY` (required) and `MAILGUN_API_REGION`
 * (optional, default `us`) from the environment and authenticates against
 * the configured Mailgun region. The key never reaches the model — it is
 * consumed only by the local server process when calling the Mailgun API
 * over HTTPS.
 *
 * By default every product tag is registered (`send`, `validate`, `optimize`,
 * `inspect`). Pass `--tags <list>` in `args` or set `MAILGUN_MCP_TAGS` to
 * scope the toolset to a subset of capability groups.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Transactional email, deliverability diagnostics, and Mailgun account management via the official `mailgun-mcp-server`. Send email, retrieve and resend stored messages, manage domains, mailing lists, templates, webhooks, and inbound routes, query sending statistics and per-message logs, and review suppressions (bounces, unsubscribes, complaints, allowlist) and dedicated IP pool configuration.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Use the dedicated `MAILGUN_API_KEY` environment variable for authentication. Never paste the API key into tool arguments, prompt bodies, log lines, or commit messages.",
    },
    {
      type: "always",
      instruction:
        "Verify the sending domain (DNS, SPF, DKIM, MX) with the domain-verification tool before sending any production email. Sending from an unverified domain will be throttled or rejected.",
    },
    {
      type: "always",
      instruction:
        "Read before writing: call the corresponding list / get tool before mutating a webhook, route, template, or mailing list. The server exposes reads and updates freely, and mutations take effect immediately on live traffic.",
    },
    {
      type: "always",
      instruction:
        "Match `MAILGUN_API_REGION` (`us` or `eu`) to the region of the API key. A `us` key will not authenticate against `eu` endpoints and vice versa.",
    },
    {
      type: "always",
      instruction:
        "When the task is narrow, scope the toolset with `--tags <list>` (CLI) or `MAILGUN_MCP_TAGS` (env). Use `validate,inspect` for read-only deliverability work, or `send` for outbound mail workflows.",
    },
    {
      type: "never",
      instruction:
        "Never send email to recipients the user has not explicitly approved. Treat any address book, contact collection, or previously-known recipient as unconfirmed — require explicit confirmation before each send.",
    },
    {
      type: "never",
      instruction:
        "Never set a webhook URL to an internal, private, or otherwise unintended address. Webhook URLs are forwarded to Mailgun without server-side validation, so a confused prompt could route event data to an attacker-controlled endpoint.",
    },
    {
      type: "never",
      instruction:
        "Never bulk-delete suppressions, mailing list members, or domains through trial-and-error retries. The server exposes no delete operations by design — escalate destructive intent to the user before pursuing it out-of-band.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@mailgun/mcp-server"],
  })
  .build();
