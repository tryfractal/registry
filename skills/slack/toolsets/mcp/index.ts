import { FractalToolset } from "@fractal-os/plugin";

/**
 * Official Slack MCP toolset.
 *
 * Spawns the official `@modelcontextprotocol/server-slack` server and exposes
 * every Slack Web API tool it provides — channel listing, message posting,
 * thread replies, emoji reactions, channel history, thread replies, user
 * directory, and user profile lookup. Connects on behalf of a single bot user
 * whose scopes and channel membership define the effective blast radius.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Slack workspace access via the official Slack MCP server. List channels and users, post and reply to messages, react with emoji, and read channel / thread history. Scoped to a single bot user OAuth token — every action is bounded by the app's installed scopes and channel membership.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Resolve human-readable channel and user names to opaque IDs (C… and U…) before calling any write tool. Run `slack_list_channels` or `slack_get_users` first and look up the matching record by `#channel-name` or `@display_name`.",
    },
    {
      type: "always",
      instruction:
        "Treat the `ts` field returned by `slack_post_message` as the message id. Pass it back unchanged as `thread_ts` when replying in a thread, and as `timestamp` when adding a reaction.",
    },
    {
      type: "always",
      instruction:
        "Read the relevant history (`slack_get_channel_history` or `slack_get_thread_replies`) before posting in a channel, so the reply is contextual and does not duplicate an existing message.",
    },
    {
      type: "always",
      instruction:
        "Use `slack_reply_to_thread` for follow-ups on an existing message instead of posting a new top-level message. Threads are the canonical way to keep a discussion in one place on Slack.",
    },
    {
      type: "always",
      instruction:
        "Restrict the workspace to a known channel set in shared or CI environments by setting `SLACK_CHANNEL_IDS` to a comma-separated list of `C…` ids. Without it, the bot can read every public channel it has been added to.",
    },
    {
      type: "never",
      instruction:
        "Never read, log, or echo the value of the `SLACK_BOT_TOKEN` environment variable. The token is a production secret; the MCP server reads it from the environment and the agent should treat it as opaque.",
    },
    {
      type: "never",
      instruction:
        "Do not post to a channel that the bot is not a member of. If `slack_post_message` returns `not_in_channel` or `channel_not_found`, ask the user to invite the bot to that channel rather than retrying blindly.",
    },
    {
      type: "never",
      instruction:
        "Do not call `slack_post_message` or `slack_reply_to_thread` with raw, untrusted HTML — Slack mrkdwn treats `<…>` as link targets. Sanitize dynamic content or route it through a controlled formatter before posting.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-slack"],
    env: {
      SLACK_BOT_TOKEN: "${SLACK_BOT_TOKEN}",
      SLACK_TEAM_ID: "${SLACK_TEAM_ID}",
      SLACK_CHANNEL_IDS: "${SLACK_CHANNEL_IDS}",
    },
  })
  .build();
