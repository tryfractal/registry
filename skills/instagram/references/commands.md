# Clinstagram CLI Command Reference

Complete reference for every clinstagram command. All commands return structured JSON with `exit_code`, `data` (on success), `error` and `remediation` (on failure), and `backend_used`. Always use `--json` for machine-readable output.

Global flags (`--json`, `--account`, `--backend`, `--proxy`, `--dry-run`, `--enable-growth-actions`) go **before** the command name.

---

## Posting

### `post photo <path|url>`
Publish a single photo.

```
clinstagram --json post photo cat.jpg
clinstagram --json post photo cat.jpg --caption "Morning vibes"
clinstagram --json post photo cat.jpg --caption "Hello world" --tags "#cats #morning" --mention "@friend"
clinstagram --json post photo https://example.com/image.jpg
```

| Flag | Description |
|---|---|
| `--caption <text>` | Caption text. Supports hashtags and @mentions inline. |
| `--tags "<tag1> <tag2>"` | Space-separated hashtags (without `#` — the CLI adds them). |
| `--mention "@user"` | Tag a user in the post. Repeatable. |

### `post video <path|url>`
Publish a single video.

```
clinstagram --json post video clip.mp4
clinstagram --json post video clip.mp4 --caption "Behind the scenes"
clinstagram --json post video https://example.com/video.mp4 --tags "#bts"
```

Same flags as `post photo`.

### `post reel <path|url>`
Publish a reel.

```
clinstagram --json post reel trending.mp4
clinstagram --json post reel trending.mp4 --caption "Watch till the end"
clinstagram --json post reel trending.mp4 --tags "#reels #viral"
```

Same flags as `post photo`.

### `post carousel <path1> <path2> ...`
Publish a carousel (multiple images/videos).

```
clinstagram --json post carousel img1.jpg img2.jpg img3.jpg
clinstagram --json post carousel img1.jpg img2.jpg --caption "Swipe left"
clinstagram --json post carousel photo.jpg video.mp4 --tags "#carousel"
```

| Flag | Description |
|---|---|
| `--caption <text>` | Caption for the carousel. |
| `--tags "<tag1> <tag2>"` | Space-separated hashtags. |
| `--mention "@user"` | Tag a user. Repeatable. |

---

## Direct Messages

### `dm inbox`
List DM threads in your inbox.

```
clinstagram --json dm inbox
clinstagram --json dm inbox --unread
clinstagram --json dm inbox --limit 10
```

| Flag | Description |
|---|---|
| `--unread` | Only show unread threads. |
| `--limit <n>` | Max threads to return. |

### `dm thread <@user|thread_id>`
Fetch messages from a specific DM thread.

```
clinstagram --json dm thread @alice
clinstagram --json dm thread 839201
clinstagram --json dm thread @alice --limit 20
```

| Flag | Description |
|---|---|
| `--limit <n>` | Max messages to return. |

### `dm send <@user> "<message>"`
Send a text DM to a user.

```
clinstagram --json dm send @alice "Thanks for reaching out!"
clinstagram --json dm send @bob "Here's the link you asked for: https://..."
```

### `dm send-media <@user> <path|url>`
Send a photo or video via DM.

```
clinstagram --json dm send-media @alice photo.jpg
clinstagram --json dm send-media @bob https://example.com/image.jpg
```

### `dm search "<query>"`
Search across your DM threads.

```
clinstagram --json dm search "project"
clinstagram --json dm search "invoice"
```

---

## Stories

### `story list`
List stories from your feed.

```
clinstagram --json story list
clinstagram --json story list @alice
```

### `story post-photo <path|url>`
Post a photo to your story.

```
clinstagram --json story post-photo sunset.jpg
clinstagram --json story post-photo sunset.jpg --mention @friend
clinstagram --json story post-photo https://example.com/photo.jpg
```

| Flag | Description |
|---|---|
| `--mention "@user"` | Tag a user in the story. Repeatable. |
| `--link "<url>"` | Add a swipe-up/link sticker (if account is eligible). |

### `story post-video <path|url>`
Post a video to your story.

```
clinstagram --json story post-video clip.mp4
clinstagram --json story post-video clip.mp4 --link "https://tryfractal.co"
```

| Flag | Description |
|---|---|
| `--mention "@user"` | Tag a user in the story. Repeatable. |
| `--link "<url>"` | Add a swipe-up/link sticker (if account is eligible). |

### `story viewers <story_id>`
Check who viewed a specific story.

```
clinstagram --json story viewers 1234567890
```

---

## Analytics

### `analytics profile`
Pull profile-level analytics.

```
clinstagram --json analytics profile
```

Returns: follower count, following count, total posts, engagement rate, reach, impressions, profile visits, website clicks.

### `analytics post <media_id>`
Pull analytics for a specific post.

```
clinstagram --json analytics post 1234567890
```

Returns: likes, comments, saves, shares, reach, impressions, profile visits from post.

### `analytics hashtag "<hashtag>"`
Search hashtag performance data.

```
clinstagram --json analytics hashtag "photography"
clinstagram --json analytics hashtag "startup"
```

Returns: post count using hashtag, reach estimate, related hashtags.

---

## Comments

### `comments list <media_id>`
List comments on a post.

```
clinstagram --json comments list 1234567890
clinstagram --json comments list 1234567890 --limit 50
```

| Flag | Description |
|---|---|
| `--limit <n>` | Max comments to return. |

### `comments reply <comment_ref> "<text>"`
Reply to a specific comment.

```
clinstagram --json comments reply 987654321 "Great point!"
```

### `comments delete <comment_ref>`
Delete a specific comment.

```
clinstagram --json comments delete 987654321
```

---

## Followers

### `followers list`
List your followers.

```
clinstagram --json followers list
clinstagram --json followers list --limit 100
```

| Flag | Description |
|---|---|
| `--limit <n>` | Max followers to return. |

### `followers following`
List accounts you follow.

```
clinstagram --json followers following
```

### `followers follow @user`
Follow a user. **Requires `--enable-growth-actions`.**

```
clinstagram --json --enable-growth-actions followers follow @alice
```

### `followers unfollow @user`
Unfollow a user. **Requires `--enable-growth-actions`.**

```
clinstagram --json --enable-growth-actions followers unfollow @bob
```

---

## User Lookup

### `user info @username`
Get detailed info about a user.

```
clinstagram --json user info @alice
```

Returns: username, full name, bio, website, follower count, following count, post count, is_verified, is_private, profile picture URL.

### `user search "<query>"`
Search for users by name or username.

```
clinstagram --json user search "alice"
clinstagram --json user search "photographer"
```

### `user posts @username`
List a user's recent posts.

```
clinstagram --json user posts @alice
clinstagram --json user posts @alice --limit 10
```

| Flag | Description |
|---|---|
| `--limit <n>` | Max posts to return. |

---

## Auth & Config

### `auth login -u <username>`
Log in with username/password for private API access. Supports 2FA.

```
clinstagram auth login -u your_username
```

Prompts for password interactively. If 2FA is enabled, prompts for the challenge code.

### `auth connect-ig --token <token>`
Store an Instagram Login token for official Graph API access (posting, comments, analytics).

```
clinstagram auth connect-ig --token <instagram-login-token>
```

### `auth connect-fb --token <token>`
Store a Facebook Login token for official Graph API access (above + DMs, story publishing).

```
clinstagram auth connect-fb --token <facebook-login-token>
```

### `auth status`
Show which backends are configured and their status.

```
clinstagram --json auth status
```

Returns: configured backends, compliance mode, session validity.

### `auth probe`
Live-check token validity for all configured backends.

```
clinstagram --json auth probe
```

Returns: token validity, expiration, scopes for each backend.

### `auth logout`
Clear all stored sessions and tokens.

```
clinstagram auth logout --yes
```

### `config mode <mode>`
Set the compliance mode.

```
clinstagram config mode hybrid-safe
clinstagram config mode official-only
clinstagram config mode private-enabled
```

### `config set proxy <url>`
Configure a SOCKS5 or HTTP proxy for private API traffic.

```
clinstagram config set proxy socks5://localhost:1080
clinstagram config set proxy http://proxy.example.com:8080
```

---

## Utility

### `agent-info`
Output a machine-readable manifest of the CLI for agent discovery (ACF format).

```
clinstagram agent-info
```

### `doctor`
Run a health check: verify Python version, check clinstagram installation, test session validity, probe connectivity.

```
clinstagram --json doctor
```

### `update --check`
Check if a newer version of clinstagram is available.

```
clinstagram update --check
```

---

## Configuration File

clinstagram stores its configuration at `~/.clinstagram/config.toml`:

```toml
[rate_limits]
graph_dm_per_hour = 200       # Meta's hard limit
private_dm_per_hour = 30      # Conservative default
private_follows_per_day = 20  # Below Instagram's threshold
request_delay_min = 2.0       # Seconds between private API writes
request_delay_max = 5.0
request_jitter = true         # Randomized delays
```

Secrets (passwords, tokens, sessions) are stored in the OS keychain (macOS Keychain, Linux Secret Service, Windows Credential Manager). **No plaintext tokens on disk.**

---

## Exit Codes Reference

| Exit Code | Meaning | Key Field | Agent Action |
|---|---|---|---|
| 0 | Success | `data` | Parse and present results. |
| 1 | Bad arguments | `error` | Fix the command syntax. |
| 2 | Auth error | `remediation` | Run `clinstagram auth login`. |
| 3 | Rate limited | `retry_after` | Wait that many seconds. |
| 4 | API error | `error` | Retry once; report if persistent. |
| 5 | Challenge required | `remediation` | Prompt user for 2FA code. |
| 6 | Policy blocked | `remediation` | Explain mode limitation. |
| 7 | Capability unavailable | `remediation` | Connect required backend. |

Example error response:
```json
{
  "exit_code": 2,
  "error": "session_expired",
  "remediation": "Run: clinstagram auth login"
}
```

---

## Quick Reference Card

```
# Auth
clinstagram auth login -u <user>
clinstagram auth connect-ig --token <token>
clinstagram auth connect-fb --token <token>
clinstagram --json auth status
clinstagram --json auth probe

# Posting
clinstagram --json post photo <path> --caption "..."
clinstagram --json post video <path> --caption "..."
clinstagram --json post reel <path> --caption "..."
clinstagram --json post carousel <img1> <img2> --caption "..."

# DMs
clinstagram --json dm inbox --unread --limit 10
clinstagram --json dm thread @alice --limit 20
clinstagram --json dm send @alice "message"
clinstagram --json dm send-media @alice photo.jpg
clinstagram --json dm search "query"

# Stories
clinstagram --json story list
clinstagram --json story list @alice
clinstagram --json story post-photo <path> --mention @user --link "url"
clinstagram --json story post-video <path> --mention @user --link "url"
clinstagram --json story viewers <story_id>

# Analytics
clinstagram --json analytics profile
clinstagram --json analytics post <media_id>
clinstagram --json analytics hashtag "query"

# Comments
clinstagram --json comments list <media_id> --limit 50
clinstagram --json comments reply <comment_ref> "text"
clinstagram --json comments delete <comment_ref>

# Followers
clinstagram --json followers list --limit 100
clinstagram --json followers following
clinstagram --json --enable-growth-actions followers follow @user
clinstagram --json --enable-growth-actions followers unfollow @user

# Users
clinstagram --json user info @username
clinstagram --json user search "query"
clinstagram --json user posts @username --limit 10

# Config
clinstagram config mode hybrid-safe
clinstagram config set proxy socks5://localhost:1080

# Utility
clinstagram --json doctor
clinstagram update --check
```
