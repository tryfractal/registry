import { FractalToolset } from "@fractal-os/plugin";

/**
 * GitLab MCP toolset.
 *
 * Spawns the official `@modelcontextprotocol/server-gitlab` server and
 * exposes every tool it provides for project management, file operations,
 * issue / merge-request creation, branching, forking, and search.
 *
 * Connection:
 *   command:  npx
 *   args:     -y @modelcontextprotocol/server-gitlab
 *   env:      GITLAB_PERSONAL_ACCESS_TOKEN (required)
 *             GITLAB_API_URL               (optional, defaults to https://gitlab.com/api/v4)
 *
 * To switch to the Docker image instead, replace the command with
 * `docker` and the args with `["run", "--rm", "-i", "mcp/gitlab"]`.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Official GitLab MCP server. Connects to gitlab.com or a self-hosted GitLab instance via the REST API and exposes tools to search, create, read, update, and delete projects, branches, files, issues, and merge requests. Authenticated with a personal access token; supports both the `npx` install and the `mcp/gitlab` Docker image.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Pass the project as `project_id` — either the numeric ID (e.g. `12345`) or the URL-encoded path (e.g. `my-group%2Fmy-project`). Never pass a raw URL; the API will reject it. URL-encode any `/` in the path.",
    },
    {
      type: "always",
      instruction:
        "For multi-file changes use `push_files` (single commit, clean history). Do not call `create_or_update_file` in a loop — it produces N commits and a noisy review diff.",
    },
    {
      type: "always",
      instruction:
        "When reading a file, pass an explicit `ref` (branch, tag, or commit SHA) whenever the user is reviewing a non-default branch. Omitting `ref` returns the default branch, which is rarely what a code review needs.",
    },
    {
      type: "always",
      instruction:
        "For self-hosted GitLab, set `GITLAB_API_URL` to the full API base (e.g. `https://gitlab.internal.example.com/api/v4`). Do not include a trailing slash. Leave it unset for gitlab.com.",
    },
    {
      type: "always",
      instruction:
        "Use a read-only token (`read_api`, or `read_repository` for repo-only reads) for audit, triage, and review workflows. Use a write token (`api` or `read_repository`+`write_repository`) only for agents that actually need to mutate the project.",
    },
    {
      type: "never",
      instruction:
        "Never echo, log, or commit the `GITLAB_PERSONAL_ACCESS_TOKEN`. If the user shares a token in chat, treat it as exposed and recommend rotating it.",
    },
    {
      type: "never",
      instruction:
        "Do not commit secrets, API keys, or credentials into a GitLab project. Point the user at CI/CD variables or group-level protected variables instead.",
    },
    {
      type: "never",
      instruction:
        "Do not call `create_repository` on a name that already exists in the namespace — the API will return a 400 and you will have orphaned metadata. Search first with `search_repositories`.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-gitlab"],
    env: {
      GITLAB_PERSONAL_ACCESS_TOKEN: "${env:GITLAB_PERSONAL_ACCESS_TOKEN}",
      GITLAB_API_URL: "${env:GITLAB_API_URL}",
    },
  })
  .build();
