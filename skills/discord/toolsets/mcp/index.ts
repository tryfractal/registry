import { FractalToolset } from "@fractal-os/plugin";

/**
 * Discord MCP toolset.
 *
 * Spawns the community Discord MCP server (`@pasympa/discord-mcp`) and exposes
 * the full Discord Bot API surface — 95+ tools across messages, channels,
 * members, roles, permissions, forums, webhooks, scheduled events, invites,
 * direct messages, moderation, and screening. Backed by `discord.js` v14.
 *
 * Multi-guild by default. The toolset surfaces every toolset group; pin a
 * specific subset with `DISCORD_MCP_TOOLSETS=discovery,messages,...` and a
 * specific guild allow-list with `DISCORD_ALLOWED_GUILDS=...` by editing the
 * `env` block below.
 */
export default FractalToolset
  .create("mcp")
  .withDescription(
    "Discord automation through the @pasympa/discord-mcp server (discord.js v14). Send, read, edit, delete, search, pin, react, reply, and forward messages — including embeds and DMs. Create, edit, move, clone, and delete channels and threads. Manage roles, permission overwrites, members (nickname, kick, ban, unban, timeout, bulk-ban, prune), forums, webhooks, scheduled events, invites, and the audit log. Destructive bulk operations default to dry-run.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Resolve guild and channel targets explicitly before sending or moderating. Call `discord_list_guilds`, `discord_list_channels`, or `discord_find_channel_by_name` first — never invent a `guild_id`, `channel_id`, `user_id`, or `message_id`.",
    },
    {
      type: "always",
      instruction:
        "Pass a short human-readable `reason` argument to every moderation tool call (kick, ban, timeout, prune, bulk-ban, bulk-delete, role delete, channel delete). Discord writes it to the audit log.",
    },
    {
      type: "always",
      instruction:
        "When the user names a channel like `#general` or a category by name, look it up with `discord_find_channel_by_name` first to obtain the `channel_id`, then pass that ID to the action tool.",
    },
    {
      type: "always",
      instruction:
        "Prefer the `discord_read_messages` and `discord_search_messages` tools before assuming the contents of a channel. Search the last 100 messages by keyword, and read the last N with an explicit `limit`.",
    },
    {
      type: "always",
      instruction:
        "Reuse the `message_id` returned by `discord_send_message` for follow-up edits, replies, reactions, pinning, forwarding, and deletion — never paraphrase a message id.",
    },
    {
      type: "always",
      instruction:
        "For multi-step workflows (read, decide, act, verify), confirm the intended target with the user once before running destructive bulk actions, even when the dry-run summary is empty.",
    },
    {
      type: "never",
      instruction:
        "Never disable the privileged Message Content or Server Members gateway intents by setting `DISCORD_MESSAGE_CONTENT=false` or `DISCORD_GUILD_MEMBERS=false` unless the user explicitly asks — Discord closes the connection with code 4014 and every tool call fails.",
    },
    {
      type: "never",
      instruction:
        "Never call destructive bulk tools (`discord_bulk_ban`, `discord_prune_members`, `discord_bulk_delete_messages`, `discord_delete_channel`, `discord_delete_role`) with `dry_run:false` without an explicit user instruction in the same turn. The defaults are dry-run for a reason.",
    },
    {
      type: "never",
      instruction:
        "Never commit, log, or echo the `DISCORD_TOKEN` value. Treat it like a password — pass it via the toolset `env` block or `DISCORD_TOKEN` in a `.env` file, never inline in a tool call response.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@pasympa/discord-mcp"],
    env: {
      // Required: bot token from https://discord.com/developers/applications
      DISCORD_TOKEN: "${env:DISCORD_TOKEN}",
      // Optional: comma-separated guild ID allow-list. Restricts the server to
      // the listed guilds; tool calls targeting any other guild are rejected.
      // Unset = no restriction.
      // DISCORD_ALLOWED_GUILDS: "123456789012345678",
      // Optional: limit the exposed toolsets (default = all).
      // DISCORD_MCP_TOOLSETS: "discovery,messages,members",
      // Optional: privileged intent flags — leave TRUE unless the user asks.
      DISCORD_MESSAGE_CONTENT: "true",
      DISCORD_GUILD_MEMBERS: "true",
    },
  })
  .build();
