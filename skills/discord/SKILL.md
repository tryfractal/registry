---
name: discord
description: >-
  Drive any Discord server, channel, thread, or DM through a 95-tool MCP
  server backed by discord.js. Use this skill when the user wants to send
  a message, read recent messages, search a channel, edit or delete a
  message, pin or react to a message, post an embed, reply to a thread,
  create a private channel, list roles, kick or ban a member, time someone
  out, set up a webhook, schedule an event, build a forum with tags, send
  a DM, prune inactive members, or audit permissions. Triggers on phrases
  like "send a message in #general", "read the last 20 messages from
  channel X", "create a private channel called team-lead", "list all
  roles", "kick @spammer", "timeout that user for an hour", "pin that
  message", "react with 🎉 to the announcement", "schedule an event",
  "send a DM to user 1234", or any request to programmatically control
  a Discord community.
---

# Discord Skill

This skill exposes the **`@pasympa/discord-mcp`** server as a single Fractal toolset. It speaks to Discord through `discord.js` v14 and covers the **full Discord Bot API surface** — 95+ tools across discovery, messages, channels, permissions, members, roles, forums, webhooks, scheduled events, invites, DMs, moderation, and screening. Multi-guild by default; destructive bulk operations default to **dry-run**.

## Toolset

- `mcp` — Discord MCP server (`@pasympa/discord-mcp@latest`). Every toolset group is exposed by default. The server is launched with `npx -y @pasympa/discord-mcp`; the bot token comes from `DISCORD_TOKEN` in the toolset `env` block. Privileged gateway intents (`DISCORD_MESSAGE_CONTENT`, `DISCORD_GUILD_MEMBERS`) are requested by default — both must be enabled in the Discord Developer Portal or the connection closes with code `4014`.

## Tool surface (95+ tools)

| Group | Count | What it covers |
|---|---|---|
| **Discovery** | 4 | `discord_list_guilds`, `discord_get_guild_info`, `discord_list_channels`, `discord_find_channel_by_name` |
| **Messages** | 18 | Send / read / edit / delete / reply / search / forward / crosspost / pin / unpin / fetch pinned, plain text and embeds (single + bulk), reactions (add/remove/list), threads (create), bulk delete (2–100) |
| **Channels** | 8 | Create / edit / move / clone / delete (text, voice, category, announcement), set position, follow announcement channel, lock permissions |
| **Permissions** | 6 | List overrides, set role/member overrides, reset, copy from one channel to another, full server-wide audit |
| **Members** | 11 | List, get, search, set nickname, kick, ban (with optional message-history delete), unban, bulk-ban, list bans, timeout, prune (with dry-run) |
| **Roles** | 9 | List, create, edit, delete, assign, unassign, get members, set position, set icon |
| **Forums** | 10 | List/create forum channels, create/read/update/delete posts, list threads, reply, get/set tags |
| **Webhooks** | 8 | Create/edit/delete/list, send, edit, fetch, delete webhook messages |
| **Scheduled events** | 7 | List/get/create/edit/delete voice/stage/external events, list subscribers, create invite |
| **Invites** | 5 | List (guild + per channel), get, create, delete |
| **Direct messages** | 7 | Send DM (text + embed), read DMs, reply, edit, edit embed, delete |
| **Moderation & screening** | 3 | Get audit log, get/update membership screening form |
| **Stats** | 1 | Server stats (members, channels, roles, boost level) |

Tool names are prefixed `discord_*`. Always pass the `channel_id` / `guild_id` / `user_id` / `message_id` you got from a discovery or read tool — never invent an ID.

## Usage rules

- **Resolve targets explicitly.** Call `discord_list_guilds`, `discord_list_channels`, or `discord_find_channel_by_name` before sending or moderating. The user typing `#general` means *look it up*, not *guess the id*.
- **Bulk is dry-run by default.** `discord_bulk_ban`, `discord_prune_members`, `discord_bulk_delete_messages`, `discord_delete_channel`, and `discord_delete_role` all default to `dry_run: true` and return a preview. Flip to `dry_run: false` only after the user confirms the preview.
- **Pass a `reason` to moderation tools.** Discord writes it to the audit log. Always include a short human-readable string (`"spam in #general"`, `"raid mitigation"`).
- **Reuse returned `message_id`s.** The id from `discord_send_message` is the same one you pass to `discord_edit_message`, `discord_delete_message`, `discord_reply_message`, `discord_add_reaction`, `discord_pin_message`, and `discord_forward_message`.
- **Prefer `discord_read_messages` + `discord_search_messages` over guessing.** Search the last 100 messages by keyword, and read with an explicit `limit` (1–100).
- **Privileged intents must be on in the portal.** If `DISCORD_MESSAGE_CONTENT` is `false` in the portal, message bodies come back empty and tool calls that need them fail. The toolset requests both intents by default; do not flip the env flags off unless the user asks.
- **Keep the token out of tool responses.** `DISCORD_TOKEN` is a password. Pass it via the toolset `env` block (or `.env`), never paste it into a tool call body.
- **Scope to one guild when needed.** Set `DISCORD_ALLOWED_GUILDS=<id1>,<id2>` in the toolset `env` to reject any tool call targeting a different guild — useful when the bot is invited to several communities.

## Setup

### 1. Create a Discord bot

1. Open <https://discord.com/developers/applications> → **New Application** → name it.
2. **Bot** tab → **Reset Token** → copy the token into `DISCORD_TOKEN`.
3. Enable both privileged intents in the portal:
   - **Server Members Intent**
   - **Message Content Intent**
   The MCP server requests both by default. If either portal toggle is **off**, Discord closes the connection with `4014` and every tool call fails.
4. **OAuth2 → URL Generator**:
   - Scopes: `bot`
   - Permissions: at minimum `Send Messages`, `Read Message History`, `Manage Channels`, `Manage Roles`, `Kick Members`, `Ban Members`, `Manage Messages`, `Manage Threads`, `Add Reactions`, `Manage Webhooks`, `Manage Events`, `View Audit Log`. Add more as needed.
5. Copy the URL and invite the bot to your server.

### 2. Configure the toolset

The connection block ships with `${env:DISCORD_TOKEN}` — set the env var in the workspace, or replace the placeholder with the literal token in a local `.env` file consumed by the MCP server (`@pasympa/discord-mcp` reads `.env` automatically via `dotenv`).

```bash
# .env
DISCORD_TOKEN=YOUR_BOT_TOKEN_HERE
```

Optional environment variables (edit the toolset `env` block to add them):

| Variable | Default | Purpose |
|---|---|---|
| `DISCORD_TOKEN` | — | **Required.** Bot token. |
| `DISCORD_ALLOWED_GUILDS` | *all* | Comma-separated guild IDs. Tool calls targeting any other guild are rejected. |
| `DISCORD_MCP_TOOLSETS` | `all` | Comma-separated subset (`discovery,messages,channels,permissions,members,roles,moderation,screening,stats,forums,webhooks,scheduled_events,invites,dm`) to keep the tool list small. |
| `DISCORD_MESSAGE_CONTENT` | `true` | Set `false` only if the user explicitly does not want the Message Content intent. |
| `DISCORD_GUILD_MEMBERS` | `true` | Set `false` only if the user explicitly does not want the Server Members intent. |

### 3. Finding Discord IDs

Enable **Developer Mode** in Discord: `Settings → Advanced → Developer Mode`. Right-click any server, channel, message, or user → **Copy ID**.

## Common workflows

- **Post a daily standup reminder** → `discord_list_channels` → find `#eng` → `discord_send_message` with the reminder text. Pin it with `discord_pin_message` if it should stick.
- **Triage a busy channel** → `discord_read_messages` with `limit: 50` → `discord_search_messages` for keywords (`"oncall"`, `"incident"`) → react with emojis to ack via `discord_add_reaction`.
- **Onboard a new role** → `discord_create_role` → `discord_set_role_permission` per channel → `discord_list_members` to find the user → `discord_add_role`.
- **Moderate a spammer** → `discord_list_members` (or `discord_search_members`) to find them → confirm with user → `discord_kick_member` or `discord_ban_member` (with `delete_message_days`) → `discord_read_messages` to verify the channel is clean.
- **Run a scheduled event** → `discord_create_scheduled_event` (voice / stage / external) → `discord_get_event_subscribers` to see who RSVPed → `discord_create_event_invite` to share.
- **Ship a forum** → `discord_create_forum_channel` with the topic → `discord_set_forum_tags` (e.g. Bug, Feature, Question) → `discord_create_forum_post` for each starter thread.
- **Notify a single user privately** → `discord_send_dm` with the user ID. Falls back to the user opening a DM with the bot first if they have not DMed the bot before.
- **Webhook automation** → `discord_create_webhook` on the target channel → `discord_send_webhook_message` with custom `username`, `avatar_url`, and an embed. Useful for CI/CD and build pipelines.

## Security notes

- The bot token is a **password**. Never commit it, never echo it back in a tool response, never paste it into a public channel.
- This toolset is **not a security boundary** — a malicious prompt in the same conversation can still exfiltrate data the bot can read. Run it in trusted environments only, and pair it with `DISCORD_ALLOWED_GUILDS` to limit blast radius.
- Give the bot **only the permissions it needs**. Start with read + send, add moderation permissions only when the workflow requires them.
- Prefer the toolset's own `dry_run` previews over the API's "force" flag — they exist so you can show the user what *would* happen before committing.

## References

- Discord developer docs: <https://discord.com/developers/docs/intro>
- Discord bot quickstart: <https://discord.com/developers/docs/getting-started>
- Discord OAuth2 / bot invite scopes: <https://discord.com/developers/docs/topics/oauth2>
- discord.js guide: <https://discordjs.guide>
- Upstream MCP server: <https://github.com/PaSympa/discord-mcp>
- npm package: <https://www.npmjs.com/package/@pasympa/discord-mcp>
- License: MIT
