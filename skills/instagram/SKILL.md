---
name: instagram
description: >-
  Use this skill whenever the user wants to do anything with Instagram —
  post content (photos, videos, reels, carousels), read or send direct
  messages, manage stories, pull analytics, handle comments, browse
  followers, or look up profiles. Trigger this skill even when the user
  says "post this", "check my DMs", "what's my engagement", "who
  unfollowed me", or "send them a message" without explicitly naming
  Instagram — if the task involves posting, messaging, or social
  analytics on a visual platform, reach for this skill first. Also
  activate for Instagram story monitoring, inbox triage, comment
  management, and follower audits. Uses the clinstagram CLI (Meta Graph
  API + instagrapi). Do NOT use for cross-platform social strategy or
  content calendars spanning multiple platforms — only direct Instagram
  account actions.
---

# Instagram Skill

This skill gives the agent full control of an Instagram account through the **clinstagram CLI** ([paperfoot/clinstagram](https://github.com/paperfoot/clinstagram)). One CLI, two backends (Meta Graph API + instagrapi private API), zero browser automation. Every command returns structured JSON with semantic exit codes, and a policy engine picks the safest backend automatically.

## Philosophy

Clinstagram wraps two entirely different APIs behind one interface so the agent doesn't have to choose. The policy router inspects the current compliance mode and available credentials, then routes to the safest backend:

- **Meta Graph API** (`graph_ig` / `graph_fb`) — official, rate-limited, OAuth-based. Safe for everything it supports.
- **instagrapi private API** (`private`) — full-featured, supports proxy, cold DMs, personal accounts. Higher risk but more capable.

This means the agent gets the best of both worlds: official API safety for routine operations, private API power when needed, with policy-driven routing that the user controls.

## Prerequisites

Before any command works, the host needs:

1. **Python 3.10+** and `pip install clinstagram`
2. **Authentication:** at minimum `clinstagram auth login -u <username>` (supports 2FA). For higher limits, also connect Graph API tokens:
   - `clinstagram auth connect-ig --token <token>` → posting, comments, analytics via Graph API
   - `clinstagram auth connect-fb --token <token>` → above + DMs, story publishing via Graph API
3. **Compliance mode** (default `hybrid-safe`):
   - `official-only` — Graph API only, safest, limited features
   - `hybrid-safe` — Graph API for writes, private API for reads. Best default.
   - `private-enabled` — everything works, full access, higher risk

If `clinstagram` isn't installed or authenticated, commands fail with exit code 2 and a `remediation` field telling the user exactly what to run.

## Global flags

Always place these **before** the command name:

| Flag | What it does |
|---|---|
| `--json` | Structured JSON output. The agent should **always** use this. |
| `--account <name>` | Switch between stored accounts. |
| `--backend auto\|graph_ig\|graph_fb\|private` | Override policy routing for a specific call. |
| `--proxy <url>` | Route private API through SOCKS5/HTTP proxy (useful for geo-issues). |
| `--dry-run` | Validate without executing. **Use before any post or DM send.** |
| `--enable-growth-actions` | Unlock follow/unfollow. Must be explicit. |

## Command groups at a glance

For the full reference with every flag, subcommand, and example, read `references/commands.md`. Use it whenever a command shape is unclear or the agent needs the exact syntax.

| Group | What it covers |
|---|---|
| `post` | Photos, videos, reels, carousels — with captions, tags, mentions |
| `dm` | Inbox, threads, send text/media, search conversations |
| `story` | List stories, post photo/video stories, check viewers |
| `analytics` | Profile stats, post metrics, hashtag performance |
| `comments` | List, reply, delete |
| `followers` | List, following, follow/unfollow (needs `--enable-growth-actions`) |
| `user` | Profile info, search, list posts |
| `auth` | Login, connect tokens, status check, probe, logout |
| `config` | Compliance mode, proxy |

## Understanding responses

Every command returns JSON like this:

```json
{
  "exit_code": 0,
  "data": { ... },
  "backend_used": "graph_fb"
}
```

The `backend_used` field tells the agent which backend handled the request — useful context to share with the user. On error, the shape changes:

```json
{
  "exit_code": 2,
  "error": "session_expired",
  "remediation": "Run: clinstagram auth login"
}
```

The `remediation` field is the exact fix — the agent can relay it directly.

## Exit codes and how to handle them

| Code | Meaning | What the agent should do |
|---|---|---|
| 0 | Success | Parse `data` and present results. |
| 1 | Bad arguments | Fix the syntax and retry once. |
| 2 | Auth expired | Tell the user to run `clinstagram auth login`. Don't retry — the session is dead. |
| 3 | Rate limited | Read `retry_after` (seconds), wait, then retry once. |
| 4 | API error | Retry once. If it persists, report the error to the user. |
| 5 | 2FA challenge | Prompt the user for the challenge code. The CLI waits for it. |
| 6 | Policy blocked | Explain which compliance mode is set and which would unlock it. Never change the mode — the user decides. |
| 7 | Backend missing | Read `remediation` — it names the backend to connect. Tell the user. |

## How the agent should operate

### Confirm destructive actions

Posting and sending DMs are public, immediate, and non-undoable. Before calling `post` or `dm send`:
- Show the caption, media reference, and target
- Ask for explicit confirmation
- Consider running `--dry-run` first to validate the command shape

The same applies to `followers follow` and `followers unfollow` — these affect real accounts and carry reputation risk. Never use growth actions without explicit permission.

### Handle failures gracefully

Duplicate posts and duplicate messages are worse than a failed attempt. **Never retry a `post` or `dm send` more than once.** If it fails twice, surface the error and ask the user how to proceed.

When auth expires (exit code 2), the session is gone — don't retry, just surface the remediation. When rate limited (exit code 3), wait the full `retry_after` period.

### Respect the compliance boundary

The compliance mode is the user's risk tolerance dial. The agent can **explain** what each mode unlocks, but must **never** change it without an explicit request. Same for `--enable-growth-actions` — explain what it does, let the user decide.

### Keep credentials invisible

Clinstagram stores secrets in the OS keychain (macOS Keychain, Linux Secret Service, Windows Credential Manager). Tokens, passwords, 2FA codes, and session data must never appear in tool inputs, outputs, comments, or error messages.

### Use the command reference

The agent should read `references/commands.md` whenever:
- A command shape or flag is unclear
- The user asks about a specific Instagram operation
- Checking whether a capability is supported before attempting it

The reference is the source of truth for every subcommand, flag, and example. Don't guess syntax — look it up.

## Common workflows

Here are real user prompts and what the agent should do for each:

**"Post this photo to Instagram with the caption 'New feature launch! Link in bio.' and tag @ourcompany."**
→ Run `--dry-run` first, show the preview, get confirmation, then `clinstagram --json post photo <path> --caption "..." --mention "@ourcompany"`. Track the `backend_used` and share the permalink.

**"Check my Instagram DMs for anything unread that needs a reply."**
→ `clinstagram --json dm inbox --unread --limit 20`. For each thread, read the last few messages, classify urgency, and present a summary. Don't reply without asking.

**"How's my Instagram performing this week vs last week?"**
→ `clinstagram --json analytics profile`. Compare with last week's data if available. Surface trends: follower delta, engagement rate change, top post. If there's no historical data, note that and suggest pulling analytics regularly.

**"Who watched my latest story?"**
→ Get the story ID from `clinstagram --json story list`, then `clinstagram --json story viewers <id>`. Highlight verified accounts, mutual follows, or notable viewers.

**"List comments on my last post and flag any that need a response."**
→ Get the media ID from `clinstagram --json user posts @me --limit 1`, then `clinstagram --json comments list <id>`. Flag questions, complaints, or high-value engagement. Offer to draft replies.

## References

- **`references/commands.md`** — Complete CLI reference: every subcommand, flag, and working example. Read this when the agent needs exact syntax or is unsure about a command shape.
- **Clinstagram source:** <https://github.com/paperfoot/clinstagram>
- **Meta Graph API docs:** <https://developers.facebook.com/docs/instagram-api>
