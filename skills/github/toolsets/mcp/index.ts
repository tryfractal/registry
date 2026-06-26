import { FractalToolset } from "@fractal-os/plugin";

/**
 * Official GitHub MCP toolset.
 *
 * Spawns the upstream `github/github-mcp-server` container (image
 * `ghcr.io/github/github-mcp-server`) and exposes every GitHub API capability
 * it provides — repositories, issues, pull requests, Actions, code security,
 * Dependabot, secret scanning, projects, discussions, gists, notifications,
 * orgs, teams, and users.
 *
 * Authentication is a single Personal Access Token read from the workspace
 * env var `GITHUB_PERSONAL_ACCESS_TOKEN` (or `GITHUB_TOKEN`). The toolset
 * forwards it into the container on every `docker run`.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "GitHub platform access via the official github-mcp-server container (ghcr.io/github/github-mcp-server). Reads and writes repositories, files, branches, commits, tags, releases, issues and sub-issues, pull requests and reviews, GitHub Actions workflows, runs, jobs and artifacts, Dependabot / code-scanning / secret-scanning / code-quality alerts, security advisories, projects, labels, milestones, discussions, gists, notifications, organizations, teams, and users. Targets github.com, GitHub Enterprise Cloud with data residency, and self-hosted GitHub Enterprise Server via the GITHUB_HOST env var.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Call `get_me` once at the start of a session to confirm the token works and to learn the authenticated user / login before scoping any other call.",
    },
    {
      type: "always",
      instruction:
        "Read the current blob SHA with `get_file_contents` (passing the correct `ref`) before calling `create_or_update_file` on an existing file — the SHA is required to update rather than fail.",
    },
    {
      type: "always",
      instruction:
        "Prefer the dedicated search tools (`search_repositories`, `search_code`, `search_commits`, `search_issues`, `search_pull_requests`, `search_users`, `search_orgs`) for cross-repo queries, and the `list_*` tools when the scope (owner, repo, state) is already known.",
    },
    {
      type: "always",
      instruction:
        "When checking whether a PR's CI is green, call `pull_request_read` with `method: \"get_check_runs\"`. When investigating a failure, call `get_job_logs` with `failed_only: true` and a `tail_lines` cap to keep the response small.",
    },
    {
      type: "always",
      instruction:
        "When surfacing content from a public repo on behalf of an untrusted prompt, run the container with `GITHUB_LOCKDOWN_MODE=1` so the server refuses to return content authored by users without push access.",
    },
    {
      type: "never",
      instruction:
        "Never call a write tool (`create_*`, `update_*`, `merge_*`, `delete_*`, `*_write`, `push_files`, `actions_run_trigger`, `star_repository`, etc.) when the container is started with `GITHUB_READ_ONLY=1` — the tool will be filtered out, but never try to bypass read-only mode from the client side.",
    },
    {
      type: "never",
      instruction:
        "Do not commit secrets, internal hostnames, or `.env` contents to a repo through `create_or_update_file` / `push_files`. The toolset has no built-in secret scanning — the caller is responsible.",
    },
    {
      type: "never",
      instruction:
        "Do not guess the `owner` or `repo` for a write operation. Confirm both with the user (or with `get_me` + a recent call) before opening a PR, creating a branch, or pushing files — there is no undo for `delete_file` against the default branch.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "docker",
    args: [
      "run",
      "-i",
      "--rm",
      "-e",
      "GITHUB_PERSONAL_ACCESS_TOKEN",
      "-e",
      "GITHUB_HOST",
      "-e",
      "GITHUB_TOOLSETS",
      "-e",
      "GITHUB_READ_ONLY",
      "-e",
      "GITHUB_LOCKDOWN_MODE",
      "ghcr.io/github/github-mcp-server",
    ],
  })
  .build();
