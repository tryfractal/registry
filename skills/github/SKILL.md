---
name: github
description: >-
  Drive GitHub — source code hosting, collaboration, CI/CD, and software
  delivery — directly from the agent through the official GitHub MCP server.
  Use this skill when the user wants to read, search, create, or update code,
  files, branches, commits, tags, or releases; list, create, update, label,
  comment on, or close issues; open, review, comment on, or merge pull
  requests; trigger or debug GitHub Actions workflow runs; investigate
  Dependabot, code-scanning, or secret-scanning alerts; manage projects,
  labels, milestones, gists, or stargazers; or look up orgs, teams, or
  users. Triggers on phrases like "open a pull request", "list open issues
  labeled bug", "why did the build fail on commit abc123", "is there a
  Dependabot alert for lodash", "create a release tag v1.2.0", "merge PR
  #42", "show me the last 20 commits", "fork the repo", or any request
  to read from or write to GitHub. Use this skill even if the user says
  "use github" or asks about repos, issues, PRs, or workflows.
---

# GitHub Skill

This skill exposes the full **official GitHub MCP server** (`github/github-mcp-server`, the Docker image `ghcr.io/github/github-mcp-server`) as a single Fractal toolset. It gives the agent direct, structured access to the GitHub REST and GraphQL APIs for repositories, issues, pull requests, Actions, code security, projects, discussions, gists, notifications, organizations, and users — with full read and write support behind a single Personal Access Token (PAT).

## Toolset

- `mcp` — Official GitHub MCP server (Docker image `ghcr.io/github/github-mcp-server`). Spawned via `docker run` so no local Go toolchain is required. Reads the `GITHUB_PERSONAL_ACCESS_TOKEN` env var, which must be set in the workspace before the toolset starts.

## Core tools (always available — the `default` toolset group)

The server always exposes the `context`, `repos`, `issues`, `pull_requests`, and `users` toolsets unless you override `GITHUB_TOOLSETS`. Highlights:

| Tool | What it does |
|---|---|
| `get_me` | Return the authenticated user (who the token belongs to). |
| `search_repositories` | Search repos across GitHub with full query syntax. |
| `search_code` | Full-text code search across the repos you can see. |
| `search_commits` | Search commit messages on the default branch. |
| `search_issues` / `search_pull_requests` / `search_users` / `search_orgs` | Cross-repo search. |
| `get_file_contents` | Read a file or directory at any ref (`refs/heads/main`, `refs/tags/v1`, `refs/pull/42/head`, etc.). |
| `get_repository_tree` | List a tree at a SHA / branch / tag, with optional path filter and recursion. |
| `get_commit` | Inspect a commit — metadata, stats, and (with `detail: "full_patch"`) the unified diff. |
| `list_commits` / `list_branches` / `list_tags` / `list_releases` | Walk history. |
| `create_or_update_file` | Commit a single file to a branch (requires the file's blob SHA if it already exists). |
| `push_files` | Commit many files in one commit. |
| `create_branch` / `delete_file` / `fork_repository` / `create_repository` | Repo write operations. |
| `issue_read` / `issue_write` / `list_issues` / `add_issue_comment` | Issues (including sub-issues and custom issue types). |
| `pull_request_read` / `create_pull_request` / `update_pull_request` / `merge_pull_request` | Pull request lifecycle. |
| `pull_request_review_write` | Submit, request, dismiss, or comment on reviews. |
| `add_comment_to_pending_review` / `add_reply_to_pull_request_comment` | Inline review comments. |
| `actions_list` / `actions_get` / `actions_run_trigger` / `get_job_logs` | GitHub Actions workflows, runs, jobs, artifacts. |
| `list_code_scanning_alerts` / `get_code_scanning_alert` | Code scanning. |
| `list_secret_scanning_alerts` / `get_secret_scanning_alert` | Secret scanning. |
| `list_dependabot_alerts` / `get_dependabot_alert` | Dependabot. |
| `list_global_security_advisories` / `get_global_security_advisory` | GHSA advisories. |
| `get_code_quality_finding` | Code quality findings. |
| `list_notifications` / `get_notification_details` / `dismiss_notification` / `mark_all_notifications_read` | Notification triage. |
| `projects_list` / `projects_get` / `projects_write` | GitHub Projects v2. |
| `list_discussions` / `get_discussion` / `get_discussion_comments` / `discussion_comment_write` | Discussions. |
| `list_gists` / `get_gist` / `create_gist` / `update_gist` | Gists. |
| `list_starred_repositories` / `star_repository` / `unstar_repository` | Stars. |
| `get_teams` / `get_team_members` | Org teams. |
| `label_write` / `list_label` / `get_label` | Repo labels. |

## Opt-in toolsets

Disable or add groups with the `GITHUB_TOOLSETS` env var (comma-separated, in the toolset `args`). The full list:

| Toolset | What it unlocks |
|---|---|
| `context` | **(on by default)** `get_me`, `get_team_members`, `get_teams` — identify the caller. |
| `repos` | **(on by default)** All repository CRUD. |
| `issues` | **(on by default)** All issue and sub-issue operations. |
| `pull_requests` | **(on by default)** All PR + review operations. |
| `users` | **(on by default)** Search users. |
| `orgs` | `search_orgs`. |
| `git` | `get_repository_tree` (low-level Git API). |
| `labels` | `label_write` / `list_label` / `get_label`. |
| `actions` | `actions_list` / `actions_get` / `actions_run_trigger` / `get_job_logs`. |
| `code_quality` | `get_code_quality_finding`. |
| `code_security` | `list_code_scanning_alerts` / `get_code_scanning_alert`. |
| `secret_protection` | `list_secret_scanning_alerts` / `get_secret_scanning_alert`. |
| `security_advisories` | GHSA database reads. |
| `dependabot` | `list_dependabot_alerts` / `get_dependabot_alert`. |
| `discussions` | Discussions read + comment write. |
| `gists` | Gist CRUD. |
| `stargazers` | Star / unstar / list. |
| `notifications` | Notification triage. |
| `projects` | Projects v2 read + write. |
| `copilot` | `assign_copilot_to_issue` / `request_copilot_review` (remote server only). |
| `copilot_spaces` | Copilot Spaces (remote server only). |
| `github_support_docs_search` | Search GitHub product + support docs (remote server only). |

Pass `GITHUB_TOOLSETS="all"` to enable every group, or `GITHUB_TOOLSETS="repos,issues,pull_requests,actions"` for a focused subset. `GITHUB_TOOLSETS` always wins over the CLI flag.

## Usage rules

- **Always call `get_me` first on a new token.** It confirms the token works, returns the authenticated login, and lets you scope later calls (e.g. to the user's own repos).
- **Read before you write.** Use `get_file_contents` (with the right `ref`) to fetch the current blob SHA before `create_or_update_file` — the SHA is required to update an existing file.
- **Use `search_*` for cross-repo queries, `list_*` for known scope.** `search_repositories` / `search_code` / `search_commits` are full GitHub search and rate-limited separately from the REST API; `list_pull_requests(owner, repo, state="open")` is the right call when you already know the repo.
- **Be specific with `state`, `since`, and pagination.** Every list tool supports `state` / `since` / `perPage` / `page` — narrow on the server, not in your own head.
- **Quote commit messages and PR titles precisely.** The server forwards them verbatim. Use `update_pull_request` / `actions_run_trigger` to fix a typo in a title without re-opening the PR.
- **Actions runs and PR head checks are the same data.** `pull_request_read` with `method: "get_check_runs"` is the fastest way to see if a PR's CI is green; `get_job_logs` with `failed_only: true` returns the failing job's tail.
- **Lockdown mode is the safer default for untrusted prompts.** Set `GITHUB_LOCKDOWN_MODE=1` in the toolset env so the server refuses to surface content authored by users without push access on public repos.
- **Read-only mode is your blast-radius reducer.** Set `GITHUB_READ_ONLY=1` to disable every write tool (`create_*`, `update_*`, `merge_*`, `*_write`, etc.) without removing the token's scopes.
- **The PAT scope matters.** `repo` is enough for most repo + issue + PR + Actions work; add `read:org` for team lookups, `notifications` for the notifications toolset, `security_events` for Dependabot / code scanning / secret scanning, `gist` for gists, `read:project` / `project` for Projects v2.

## Connection arguments

The toolset spawns the upstream container via `docker run -i --rm`. Override behavior by editing the toolset `args` list or by setting env vars that the container reads.

| Flag (CLI) | Env var | Purpose |
|---|---|---|
| `--toolsets a,b,c` | `GITHUB_TOOLSETS` | Enable specific toolset groups. `all` enables every group; `default` keeps the server default (`context,repos,issues,pull_requests,users`). |
| `--tools a,b` | `GITHUB_TOOLS` | Enable specific tools (additive with `--toolsets`). |
| `--read-only` | `GITHUB_READ_ONLY=1` | Drop every write tool. |
| `--lockdown-mode` | `GITHUB_LOCKDOWN_MODE=1` | Refuse to surface content from non-collaborators on public repos. |
| `--insiders` | `GITHUB_INSIDERS=true` | Early access to new tools (build-tagged image). |
| `--gh-host <url>` | `GITHUB_HOST` | GitHub Enterprise Server or Enterprise Cloud with data residency (`https://your-subdomain.ghe.com`). |
| (image tag) | — | Pin to a specific server version, e.g. `ghcr.io/github/github-mcp-server:v1.4.0`. |
| `GITHUB_MCP_SERVER_NAME` / `GITHUB_MCP_SERVER_TITLE` | — | Override the `name` / `title` returned in the MCP init response (useful when running multiple instances — github.com vs a GHES host). |
| `GITHUB_MCP_TOOL_*_DESCRIPTION` | — | Override individual tool descriptions. |

## Configuration

Set the token in the workspace environment before the toolset is loaded:

```bash
# .env (do not commit — add to .gitignore)
export GITHUB_PERSONAL_ACCESS_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

The toolset `args` pass `GITHUB_PERSONAL_ACCESS_TOKEN` into the container; the host shell variable is read and forwarded on each `docker run`. To target a different host, set `GITHUB_HOST` in the same env block.

## Recommended PAT scopes

- `repo` — repositories, issues, pull requests, Actions runs, gists
- `read:org` — teams, organization search
- `notifications` — notification triage
- `security_events` — Dependabot, code scanning, secret scanning, advisories
- `read:project` / `project` — Projects v2
- `gist` — gists (only required for the `gists` toolset)

A fine-grained PAT scoped to a single repo is the safest choice for a sandboxed agent.

## Read-only & lockdown recipes

```bash
# Read-only (zero write capability, no matter what the agent asks)
GITHUB_TOOLSETS="all" GITHUB_READ_ONLY=1 docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN \
  -e GITHUB_TOOLSETS \
  -e GITHUB_READ_ONLY \
  ghcr.io/github/github-mcp-server

# Lockdown: only collaborators' content surfaces on public repos
GITHUB_LOCKDOWN_MODE=1 docker run -i --rm \
  -e GITHUB_PERSONAL_ACCESS_TOKEN \
  -e GITHUB_LOCKDOWN_MODE \
  ghcr.io/github/github-mcp-server
```

## References

- Upstream docs: <https://github.com/github/github-mcp-server>
- Docker image: <https://ghcr.io/github/github-mcp-server>
- GitHub REST API reference: <https://docs.github.com/en/rest>
- OpenAPI description: <https://raw.githubusercontent.com/github/rest-api-description/main/descriptions/api.github.com/api.github.com.json>
- License: MIT
