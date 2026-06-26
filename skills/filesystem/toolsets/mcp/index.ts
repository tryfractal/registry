import { FractalToolset } from "@fractal-os/plugin";

/**
 * @modelcontextprotocol/server-filesystem MCP toolset.
 *
 * Spawns the official filesystem MCP server and exposes all its file
 * operations: read, write, edit, search, move, directory management,
 * and metadata inspection. Directory access is controlled through
 * the command-line args (default: workspace root) and optionally
 * extended via the MCP Roots protocol when the client supports it.
 *
 * The server operates entirely within allowed directories — no file
 * outside the sandbox can be accessed.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Secure, sandboxed filesystem operations via the official @modelcontextprotocol/server-filesystem MCP server. Read, write, edit, search, move, and manage files and directories within configurable allowed directories. 13 tools covering every file-system primitive.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Call `list_allowed_directories` before any file operation to confirm the target path is within the server's sandbox.",
    },
    {
      type: "always",
      instruction:
        "Use `edit_file` with `dryRun: true` first to preview changes via git-style diff before applying them.",
    },
    {
      type: "always",
      instruction:
        "Prefer `search_files` with glob patterns and `excludePatterns` (e.g. `node_modules`, `.git`) to discover files efficiently.",
    },
    {
      type: "always",
      instruction:
        "Use `directory_tree` for exploring directory structure — it returns a compact JSON tree that is more efficient than `list_directory` for deep hierarchies.",
    },
    {
      type: "always",
      instruction:
        "Confirm with the user before calling `write_file` — it is destructive and overwrites existing content.",
    },
    {
      type: "always",
      instruction:
        "Check `get_file_info` on the destination before calling `move_file` — the move fails if the destination already exists.",
    },
    {
      type: "never",
      instruction:
        "Never attempt to read or write files outside the directories returned by `list_allowed_directories`. The server will reject the operation with an access-denied error.",
    },
    {
      type: "never",
      instruction:
        "Do not use `edit_file` with `head`/`tail` on the same call — the tool does not support specifying both simultaneously.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: [
      "-y",
      "@modelcontextprotocol/server-filesystem",
      process.cwd(),
    ],
  })
  .build();
