---
name: slack
description: >-
  Interact with a Slack workspace through the official Slack MCP server.
  Use this skill when the user wants to list channels, post messages,
  reply to threads, add emoji reactions, fetch channel history, read
  thread replies, look up users, or get a user's profile. Triggers on
  phrases like "post in #general that the deploy is done", "reply to
  that thread", "react with a :white_check_mark:", "show the last 20
  messages in #eng", "list channels", "find Alex's Slack handle", or
  any request to read from or write to a Slack workspace. Use this skill
  even when the user just says "ask slack", "ping the team", or "check
  slack for updates". If the task is about email, calendar, or another
  chat platform, use the skill for that domain.
---

# Slack Skill

This skill exposes the **official Slack MCP server** (`@modelcontextprotocol/server-slack`) as a single Fractal toolset. It talks to the Slack Web API using a bot user OAuth token, so every action is scoped to whatever channels and scopes the app has been granted.

## Toolset

- `mcp` — Slack MCP server (`@modelcontextprotocol/server-slack`). Connects to the Slack Web API on behalf of a single bot user. Channel access is bounded by the app's installed scopes and, optionally, the `SLACK_CHANNEL_IDS` allow-list.

## Required scopes

The Slack app behind the bot token must have these OAuth scopes installed before the server can do anything useful:

| Scope | What it unlocks |
|---|---|
| `channels:history` | Read message content and metadata in public channels the bot is in. |
| `channels:read` | List public channels and read their basic metadata. |
| `chat:write` | Post new top-level messages and thread replies. |
| `reactions:write` | Add emoji reactions to messages. |
| `users:read` | List users and read basic profile fields. |
| `users.profile:read` | Read detailed profile fields (title, timezone, etc.). |

If a tool returns a `missing_scope` error, re-install the app from the Slack App management UI after adding the missing scope — the token alone is not enough.

## Core tools

| Tool | Purpose | Required inputs | Optional inputs |
|---|---|---|---|
| `slack_list_channels` | List public or pre-defined channels in the workspace. | — | `limit` (1–200, default 100), `cursor` |
| `slack_post_message` | Post a new top-level message to a channel. | `channel_id`, `text` | — |
| `slack_reply_to_thread` | Post a reply under an existing message thread. | `channel_id`, `thread_ts`, `text` | — |
| `slack_add_reaction` | Add an emoji reaction to a message. | `channel_id`, `timestamp`, `reaction` (no colons) | — |
| `slack_get_channel_history` | Fetch recent messages from a channel, oldest first. | `channel_id` | `limit` (default 10) |
| `slack_get_thread_replies` | Read every reply in a specific message thread. | `channel_id`, `thread_ts` | — |
| `slack_get_users` | List workspace users with basic profile fields. | — | `limit` (1–200, default 100), `cursor` |
| `slack_get_user_profile` | Get detailed profile info for one user. | `user_id` | — |

All IDs are opaque strings: channels start with `C`, users with `U`, teams with `T`, and message timestamps look like `1714078123.000200` (they double as the `ts` / `thread_ts` parameter).

## Usage rules

- **Resolve names to IDs first.** Every write tool takes a `channel_id` or `user_id`, not a name. Call `slack_list_channels` or `slack_get_users` first, then look up the matching record by `#channel-name` or `@display_name` before posting.
- **Treat the timestamp returned by `slack_post_message` as the message id.** Pass it back as `thread_ts` when replying, and as `timestamp` when reacting. The tool response includes it as `ts`.
- **Prefer the channel allow-list (`SLACK_CHANNEL_IDS`) in shared environments.** Without it, the bot can read every public channel it has been added to. Restrict it to a comma-separated list of `C…` ids during development and CI.
- **Use threads for follow-ups, not new top-level messages.** When the user says "reply to that", look up the original `ts` from `slack_get_channel_history` and call `slack_reply_to_thread` with the same `channel_id`.
- **Read the history before writing.** Run `slack_get_channel_history` (or `slack_get_thread_replies` for a thread) so you can quote context, avoid duplicates, and respect the channel's tone. Do not re-post something that is already there.
- **Sanitize user-supplied text before posting.** The `text` field is rendered as Slack mrkdwn. Escape `<`, `>`, and `&` only if the user explicitly asked for literal characters; otherwise let Slack render its own formatting.
- **Never embed the bot token in source, logs, or tool args.** The MCP server reads it from the `SLACK_BOT_TOKEN` environment variable. The agent should never read or echo the value.

## Connection arguments

The toolset is launched via `npx` and reads its config from environment variables. Set these on the MCP server (or in the toolset's `env` block) before invoking any tool.

| Env var | Required | Purpose |
|---|---|---|
| `SLACK_BOT_TOKEN` | ✅ | Bot User OAuth Token from your Slack app (starts with `xoxb-`). |
| `SLACK_TEAM_ID` | ✅ | Workspace ID (starts with `T`). Used to scope lookups. |
| `SLACK_CHANNEL_IDS` | optional | Comma-separated allow-list of `C…` channel ids. If unset, the bot sees every public channel it has been added to. |

To find the `SLACK_TEAM_ID`, open the Slack workspace URL — it contains the `T…` segment. To find a `SLACK_CHANNEL_IDS` entry, right-click a channel in the Slack client → "View channel details" → copy the ID at the bottom.

## Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `missing_scope` error | The app was installed before the scope was added. | Add the scope in OAuth & Permissions, then reinstall the app — the old token will not be updated in place. |
| `channel_not_found` on `slack_post_message` | Bot is not in the channel, or `channel_id` is wrong. | Invite the bot to the channel (`/invite @YourApp` in Slack) or re-run `slack_list_channels` to get the correct id. |
| `not_in_channel` | The bot can see the channel in a list but has not been added. | Invite the bot from inside Slack, or add the `channels:join` scope and call `conversations.join`. |
| `invalid_auth` | The `xoxb-…` token is from a different workspace or has been revoked. | Reinstall the app and copy the fresh bot token. |
| Empty `slack_list_channels` result | The bot has not been added to any public channel yet. | Invite it to at least one channel, or set `SLACK_CHANNEL_IDS` explicitly. |

## Security notes

- The Slack MCP server is **not a security boundary**. Any user with access to the bot token can read every channel the bot is in. Treat the token as a production secret: store it in an env file, a secret manager, or the workspace-level MCP env, never in chat or committed config.
- A bot that has `chat:write` can post in any channel it is a member of. If you do not want the agent to broadcast to the whole workspace, set `SLACK_CHANNEL_IDS` to a tight allow-list and treat the agent as untrusted for anything outside that list.
- Slack mrkdwn is a partial HTML dialect. If you allow user-supplied input in `text`, you are also allowing user-supplied link targets. Prefer `slack_post_message` for static content and route dynamic content through a sanitizer.

## References

- Upstream docs: <https://github.com/modelcontextprotocol/servers/tree/main/src/slack>
- npm package: <https://www.npmjs.com/package/@modelcontextprotocol/server-slack>
- Slack API reference: <https://api.slack.com/web>
- Slack app management: <https://api.slack.com/apps>
- License: MIT
