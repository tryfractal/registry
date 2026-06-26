---
name: gitlab
description: >-
  Operate a GitLab account — cloud or self-hosted — from the agent through
  the official `@modelcontextprotocol/server-gitlab` MCP server. Use this
  skill when the user wants to list, search, create, or update projects;
  read, create, update, or move files in a repository; create or list
  branches; open, review, merge, or comment on merge requests; file, list,
  update, or close issues; or fork a project. Triggers on phrases like
  "open a merge request on GitLab", "create a new issue in
  gitlab.com/my-team/my-repo", "fork this project into my namespace",
  "list my open merge requests", "search GitLab for projects matching
  foo", "show me main.go on the develop branch", "create a new branch
  called feature/billing", "close issue #42 and add wontfix", or any
  request to drive GitLab programmatically. Use this skill even if the
  user says "use gitlab" or asks about managing code on GitLab.
---

# GitLab Skill

This skill exposes the official **`@modelcontextprotocol/server-gitlab`** MCP server as a single Fractal toolset. The server speaks the GitLab REST API directly, so every action it can perform — create, read, update, delete, search, fork, comment, push, merge — is exposed as a structured tool call that the agent can drive from natural language.

## Toolset

- `mcp` — GitLab MCP server (`@modelcontextprotocol/server-gitlab`, version `2025.4.25` and newer). Connects to **gitlab.com** by default, or to a self-hosted instance via `GITLAB_API_URL`. Authentication uses a personal access token passed through `GITLAB_PERSONAL_ACCESS_TOKEN`. The server supports both the `npx` install and the `mcp/gitlab` Docker image — this skill defaults to the `npx` install for zero-config local startup.

## Available tools

| Tool | What it does |
|---|---|
| `create_or_update_file` | Create or update a single file in a project; auto-creates the target branch if it does not exist. Supports `previous_path` for renames. |
| `push_files` | Push multiple files in a single commit. |
| `get_file_contents` | Read the contents of a file or directory at a given `ref` (branch, tag, or commit SHA). |
| `search_repositories` | Search for GitLab projects by name, path, or description. Paginated. |
| `create_repository` | Create a new GitLab project (optionally initializing with a README). |
| `fork_repository` | Fork a project into the authenticated user's namespace (or a target namespace). |
| `create_branch` | Create a new branch from an existing `ref`. |
| `create_issue` | Create an issue with title, description, assignees, labels, and milestone. |
| `create_merge_request` | Open a new MR between two branches; supports `draft` and `allow_collaboration` flags. |

> The server is MIT-licensed and intentionally narrow: it ships exactly the tools above plus a small set of read helpers. For deep introspection (pipelines, jobs, wikis, security reports, releases, snippets, deploy keys, etc.) you can either reach the GitLab REST API directly through `mcp__execute_command` style escape hatches, or add a custom adapter that wraps the GitLab OpenAPI spec.

## Usage rules

- **Always pass the project as `project_id` (numeric ID or URL-encoded path).** Both `12345` and `my-group%2Fmy-project` are accepted. URL-encode any path that contains `/`. Never pass a raw URL — the API will reject it.
- **Branch is required for any file write.** For new work, create the branch first with `create_branch` (off `main` / `master` / your default branch) and then call `create_or_update_file` or `push_files` against it. The server will auto-create the branch on a single-file write, but for multi-file `push_files` the branch must already exist.
- **Use `push_files` for multi-file changes.** It produces a single commit, a single reviewable diff, and preserves a clean Git history. Do not call `create_or_update_file` in a loop.
- **Read with `ref` set to a branch, tag, or commit SHA.** Omitting `ref` returns the default branch. Always pass an explicit `ref` when reviewing a feature branch or a tag.
- **For self-hosted GitLab, set `GITLAB_API_URL`** to the full API base (for example `https://gitlab.internal.example.com/api/v4`). Do not include a trailing slash. The default `https://gitlab.com/api/v4` is used when the variable is empty.
- **Token scopes matter.** Use `api` for full read/write access, `read_api` for read-only, and `read_repository` / `write_repository` for repository-only operations. A read-only token will fail on any write tool with a 401 / 403.
- **Do not commit secrets into a project.** If the user wants to store credentials, point them at the project's CI/CD variables or the group's protected variables, not the repository.
- **Search is paginated.** `per_page` defaults to 20. Page through results explicitly when you need more than one page; do not assume the first page is exhaustive.

## Environment variables

| Variable | Required | Purpose |
|---|---|---|
| `GITLAB_PERSONAL_ACCESS_TOKEN` | yes | A GitLab personal access token with the scopes needed for the requested operations. |
| `GITLAB_API_URL` | no | Base URL of the GitLab API. Defaults to `https://gitlab.com/api/v4` for gitlab.com. Set this for self-hosted instances. |

The MCP client is expected to inject both variables into the toolset process. The token is **never** echoed back in tool responses; redact it client-side if you ever log the environment.

## Connection arguments

The toolset launches the server via `npx` so it works on any machine with Node 18+ and zero global installs. To switch to the Docker image, replace `command: "npx"` with `command: "docker"` and the `args` with `["run", "--rm", "-i", "mcp/gitlab"]`.

```jsonc
// .mcp.json equivalent for the Fractal runtime
{
  "mcpServers": {
    "gitlab": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-gitlab"],
      "env": {
        "GITLAB_PERSONAL_ACCESS_TOKEN": "<token>",
        "GITLAB_API_URL": "https://gitlab.com/api/v4"
      }
    }
  }
}
```

## Setting up a token

1. Open **User Settings → Access Tokens** in the GitLab web UI (for a self-hosted instance, prepend the host).
2. Pick a token name (for example `fractal-agent`) and an expiry date.
3. Select scopes:
   - `api` — full read/write (recommended for development).
   - `read_api` — read-only (use this for production agents that should never write).
   - `read_repository` + `write_repository` — repository-only access (narrowest useful scope for code-only agents).
4. Click **Create personal access token** and copy the value. GitLab only shows it once.

## Typical workflows

- **Open a merge request from a feature branch:** `create_branch` → `push_files` (or `create_or_update_file` for a single change) → `create_merge_request` with `source_branch` = the new branch and `target_branch` = the default branch.
- **Triage a backlog:** `get_file_contents` (to read a project's README) → `search_repositories` (to find the right project) → `create_issue` with the right labels and milestone.
- **Mirror a fix across forks:** `fork_repository` → `create_branch` in the fork → `create_or_update_file` → open an MR back to upstream.
- **Audit before writing:** call `get_file_contents` on the target `ref` first, then diff against the change you are about to make, then call `create_or_update_file` or `push_files`.

## Security notes

- A token with `api` scope can do anything the user can. Treat it like a password: do not log it, do not paste it into chat, and rotate it the moment it leaks.
- The server is not a security boundary. The agent that drives it inherits every permission the token carries. Pair this skill with a read-only or narrowly-scoped token when the workflow does not require writes.
- For multi-tenant agents, mint one token per workspace and store it in that workspace's secret store — never share a token across unrelated tenants.

## References

- GitLab REST API documentation: <https://docs.gitlab.com/api/>
- GitLab OpenAPI spec: <https://gitlab.com/gitlab-org/gitlab/-/raw/master/doc/api/openapi/openapi.yaml>
- MCP server source: <https://github.com/modelcontextprotocol/servers/tree/main/src/gitlab>
- npm package: <https://www.npmjs.com/package/@modelcontextprotocol/server-gitlab>
- License: MIT
