---
name: filesystem
description: >-
  Read, write, edit, search, move, and manage files on the user's workspace
  machine or server through the official @modelcontextprotocol/server-filesystem
  MCP server. Use this skill when Fractal is connected through an MCP client
  like ChatGPT, Perplexity, or ElevenLabs Agent — platforms that do not have
  built-in filesystem tools. The agent gets safe, sandboxed access to the user's
  project or workspace directory. Triggers on phrases like "read this file",
  "write that to a file", "show me my project files", "save this to a file",
  "search my project", or any request to manipulate files when the client
  lacks native filesystem support. The server enforces directory access
  control — only files within the allowed directories can be read or written.
---

# Filesystem Skill

## Purpose

This skill gives your AI assistant safe access to **the user's workspace files** on the machine or server where Fractal is running. Whether the user is developing code, managing documents, or organizing data, you can read, create, edit, and organize files inside their workspace — all within a secure, sandboxed directory.

This is essential when Fractal is connected through an MCP client like **ChatGPT, Perplexity, or ElevenLabs Agent**, since those platforms do not provide built-in tools for file management. It also applies when running Fractal natively and you need filesystem access beyond what the default tools offer.

With this skill, you can:
- Read and summarize files from the user's workspace
- Create new files and save conversation results directly to disk
- Edit existing files with user confirmation
- Search through directories to find what the user needs
- Organize and manage the workspace structure

**Security boundary:** You can only access files inside the allowed workspace directory — no system files, no random folders, no unexpected changes. The server rejects any operation outside the sandbox.

## How to Use This Toolset

This skill ships a pre-configured MCP toolset that is automatically available when installed. You do NOT install or start anything manually.

### Accessing the filesystem tools

Fractal provides two ways to interact with this toolset, depending on how the agent is running:

- **Native Fractal app** — use the built-in agent tools `ToolsetsList` and `ToolsetsCall`. These are native AI SDK tools available directly in your tool calling loop. Call `ToolsetsList` with `{ skill: "filesystem" }` to discover available tools, then `toolsets_call` with the tool ID and arguments to execute.
- **CLI / remote MCP client** (ChatGPT, Perplexity, ElevenLabs, etc.) — use the commands `fractal toolsets list --skill filesystem` to discover tools and `fractal toolsets call --toolset filesystem::mcp --tool <name> --data '{...}'` to execute them.

> **Important:** All paths in tool arguments are relative to the server's allowed directory root. Use `list_allowed_directories` first to know which directory is the root.

### Configuring the workspace directory

By default, the toolset is pre-configured to access `process.cwd()` — the directory where Fractal was started. If the user needs to change which directory is accessible:

1. **Locate the toolset file** — it's at `.fractal/skills/filesystem/toolsets/mcp/index.ts` in the user's Fractal workspace (or the registry source if developing).
2. **Edit the `args` array** in the `.withConnection()` block — replace `process.cwd()` with the desired directory path (or add multiple directories).
3. **Restart Fractal** for the change to take effect.

If the user asks to access a different project or add additional directories, follow this same process. Never attempt to work around the directory restriction — the server enforces it.

## Safe File Handling — Rules for User Data

The files you manage belong to the user on their machine or server. Follow these rules strictly:

1. **Read before you write** — always read a file before editing it. Understand its contents before making changes.
2. **Preview destructive operations** — use `edit_file` with `dryRun: true` first to show the user a diff before applying changes.
3. **Never overwrite without confirmation** — `write_file` replaces the entire file content. Always check if the file exists with `get_file_info` and ask the user before overwriting.
4. **Stay inside the sandbox** — the server rejects operations outside allowed directories. Always call `list_allowed_directories` first if unsure where the root is.
5. **Protect sensitive data** — do not read or expose credentials, tokens, private keys, `.env` files, or any file the user did not explicitly ask about. If you encounter a sensitive file during a search, skip it and do not display its contents.
6. **Clean up after yourself** — if you create temporary or generated files, offer to remove them when done.
7. **Ask before moving or deleting** — `move_file` and `write_file` are destructive. Always confirm with the user before reorganizing or removing their files.

## Toolset

- `mcp` — Filesystem MCP server (`@modelcontextprotocol/server-filesystem`). Launches through Fractal's toolset system, not manually. 13 tools covering every filesystem primitive. Directory access is configured via the toolset file.

## Tools reference

| Tool | Description | Key params |
|---|---|---|
| `read_text_file` | Read file as UTF-8 text. Prefer over deprecated `read_file`. | `path`, `head` (first N lines), `tail` (last N lines) |
| `read_file` | Same as `read_text_file`. **DEPRECATED** — use `read_text_file`. | `path`, `head`, `tail` |
| `read_media_file` | Read image/audio, returns base64 + MIME type. | `path` |
| `read_multiple_files` | Read many files at once. Failed reads don't block the batch. | `paths[]` |
| `write_file` | **Destructive.** Creates or **overwrites** a file without warning. | `path`, `content` |
| `edit_file` | Line-based text edits with git-style diff output. Supports `dryRun`. | `path`, `edits[]`, `dryRun` |
| `create_directory` | Create directory + parents. Idempotent — succeeds silently if exists. | `path` |
| `list_directory` | List contents with `[FILE]` / `[DIR]` prefixes. | `path` |
| `list_directory_with_sizes` | Same as above + file sizes. Optional `sortBy` (`name` / `size`). | `path`, `sortBy` |
| `move_file` | Move or rename. **Fails if destination exists.** | `source`, `destination` |
| `search_files` | Recursive glob search. Returns full paths. | `path`, `pattern`, `excludePatterns[]` |
| `directory_tree` | Recursive JSON tree of directory structure. | `path`, `excludePatterns[]` |
| `get_file_info` | Metadata: size, created/modified/accessed times, type, permissions. | `path` |
| `list_allowed_directories` | Lists every directory the server can access. | (none) |

### Tool annotations (MCP hints)

The server annotates every tool with MCP hints so you can distinguish read-only from write-capable tools:

| Tool | Type | Idempotent | Destructive |
|---|---|---|---|
| `read_text_file`, `read_file`, `read_media_file`, `read_multiple_files` | Read-only | — | — |
| `list_directory`, `list_directory_with_sizes`, `directory_tree` | Read-only | — | — |
| `search_files`, `get_file_info`, `list_allowed_directories` | Read-only | — | — |
| `create_directory` | Write | ✅ Yes | ❌ No |
| `write_file` | Write | ✅ Yes | ✅ **Yes** |
| `edit_file` | Write | ❌ No | ✅ **Yes** |
| `move_file` | Write | ❌ No | ✅ **Yes** |

---

## Workflows

### Read a file

```json
// Best: read_text_file (preferred over deprecated read_file)
{ "name": "read_text_file", "arguments": { "path": "/project/src/main.ts", "head": 50 } }
```

- Use `head: 50` to read only the first 50 lines of a large file.
- Use `tail: 50` to read only the last 50 lines.
- **Cannot** specify both `head` and `tail` simultaneously.
- `read_text_file` treats every file as UTF-8 regardless of extension.
- For images and audio, use `read_media_file` — it returns base64 data with the correct MIME type.

### Read multiple files

```json
// More efficient than reading files one by one
{ "name": "read_multiple_files", "arguments": { "paths": ["src/main.ts", "src/utils.ts", "src/config.ts"] } }
```

- Failed reads (e.g., file not found) won't stop the batch. Check each result individually.

### Create or overwrite a file

```json
// WARNING: overwrites without confirmation
{ "name": "write_file", "arguments": { "path": "/project/src/new-file.ts", "content": "// file content here" } }
```

1. **Always show the user the intended content before writing.**
2. Call `get_file_info` first to check if the file exists — if it does, warn the user it will be overwritten.
3. Only `write_file` after explicit user confirmation.

### Edit a file (line-based)

```json
// Always use dryRun: true first to preview changes
{
  "name": "edit_file",
  "arguments": {
    "path": "/project/src/main.ts",
    "edits": [{ "oldText": "const port = 3000", "newText": "const port = 8080" }],
    "dryRun": true
  }
}
```

1. **Always set `dryRun: true` first** to preview the git-style diff.
2. Review the diff with the user.
3. Call again with `dryRun: false` (or omit it) to apply.
4. `edit_file` matches exact line sequences — `oldText` must match the current file content exactly (whitespace matters, but indentation is normalized).
5. Multiple edits in one call are applied sequentially with correct positioning.
6. **Not idempotent** — re-applying the same edit will fail because `oldText` no longer matches.

### Create a directory

```json
// Idempotent — safe to call even if directory exists
{ "name": "create_directory", "arguments": { "path": "/project/src/components" } }
```

- Creates parent directories automatically (`/project/src/` if it doesn't exist).
- Silently succeeds if the directory already exists.

### List a directory

```json
// Basic listing
{ "name": "list_directory", "arguments": { "path": "/project/src" } }

// With sizes, sorted by size descending
{ "name": "list_directory_with_sizes", "arguments": { "path": "/project/src", "sortBy": "size" } }
```

- Output uses `[FILE]` and `[DIR]` prefixes for quick identification.
- `list_directory_with_sizes` also shows total files, directories, and combined size.

### Move or rename

```json
{ "name": "move_file", "arguments": { "source": "/project/src/old.ts", "destination": "/project/src/new.ts" } }
```

- **Fails if destination already exists.** Always check with `get_file_info` before moving.
- Works across directories (move) and within the same directory (rename).
- Both source and destination must be within allowed directories.

### Search for files

```json
// Search all .ts files recursively, excluding node_modules
{
  "name": "search_files",
  "arguments": {
    "path": "/project",
    "pattern": "**/*.ts",
    "excludePatterns": ["**/node_modules/**", "**/dist/**"]
  }
}
```

- Pattern is glob-style: `"*.ts"` matches current dir only, `"**/*.ts"` matches recursively.
- Use `excludePatterns` to skip `node_modules`, `.git`, `dist`, etc.

### Get directory tree

```json
// Quick structural overview, much more compact than listing each directory
{
  "name": "directory_tree",
  "arguments": {
    "path": "/project/src",
    "excludePatterns": ["**/node_modules/**"]
  }
}
```

- Returns a JSON array: each entry has `name`, `type` (`"file"` / `"directory"`), and `children` (for directories only).
- Far more efficient than `list_directory` for understanding deep hierarchies.
- Empty directories return an empty `children` array.
- Files omit the `children` key entirely.

### Get file metadata

```json
{ "name": "get_file_info", "arguments": { "path": "/project/package.json" } }
```

Returns: `size`, `created` time, `modified` time, `accessed` time, `type` (file/directory), `permissions`.

### Check allowed directories

```json
// Always call this first if you're unsure what's accessible
{ "name": "list_allowed_directories", "arguments": {} }
```

---

## Directory access control

The server enforces a strict sandbox. Operations only work within explicitly allowed directories. The model is two-tier:

1. **Toolset configuration** — directories passed in the toolset's connection config (e.g., `process.cwd()` in the toolset file).
2. **MCP Roots (recommended)** — if the MCP client supports the Roots protocol, the client can dynamically update allowed directories at runtime. Roots completely replace any command-line directories.

**Flow:**

```
Server starts with toolset config [/workspace]
  → Client connects, sends initialize with { capabilities: { roots: ... } }
  → If client supports Roots:
      → Server requests roots from client via roots/list
      → Server REPLACES all allowed directories with client's roots
  → If client does NOT support Roots:
      → Server keeps toolset-configured directories
  → On runtime update (notifications/roots/list_changed):
      → Server re-requests roots and replaces allowed directories again
```

**Critical:** If the server starts without configured directories AND the client doesn't support Roots (or provides empty roots), the server throws an error during initialization. At least one allowed directory is required.

---

## Gotchas

1. **`read_file` is deprecated.** The tool exists but the server's own description marks it as deprecated. Always use `read_text_file` instead.

2. **`edit_file` is NOT idempotent.** Re-applying the same edit will fail because the `oldText` no longer matches the file content. Always use `dryRun: true` first.

3. **`edit_file` matches exact line sequences, not arbitrary substrings.** The `oldText` must match a contiguous block of lines. Whitespace is normalized for matching purposes (tabs vs spaces, indentation level), but the sequence of non-whitespace tokens must be identical.

4. **`write_file` silently overwrites.** There is no "are you sure?" prompt. The tool creates if the file doesn't exist and replaces the entire content if it does. Always check `get_file_info` first and confirm with the user.

5. **`move_file` fails if destination exists.** Unlike Unix `mv`, there is no force flag. Check the destination with `get_file_info` before moving, and handle the conflict (rename, remove, or ask the user).

6. **`head` and `tail` cannot be combined.** If you need both the first and last lines, make two separate calls to `read_text_file`.

7. **`search_files` uses glob patterns, not regex.** `"*.ts"` matches files with `.ts` extension in the current directory. `"**/*.ts"` matches recursively. `excludePatterns` also use glob syntax.

8. **`directory_tree` for files omits the `children` key** (not an empty array — the key is absent). Only directories have `children`. Check for the presence of `children` rather than its length.

9. **Allowed directories lock the server for its lifetime** (unless Roots are used). If the server is started without Roots support, the allowed directories are fixed until the server restarts.

10. **Windows paths need different config.** On Windows, the toolset file needs `cmd /c` and backslash paths.

---

## Multi-step workflow examples

### "Read the config, make a change, and verify"

```
1. `read_text_file` → read the config file
2. `edit_file` with `dryRun: true` → preview the diff
   → Show diff to user and confirm
3. `edit_file` with `dryRun: false` → apply the change
4. `read_text_file` with `{ path, head: 5 }` → verify first few lines
```

### "Find all test files and check which ones are empty"

```
1. `search_files` → `{ pattern: "**/*.test.ts", path: "/project" }` to find all tests
2. `read_multiple_files` → `{ paths: [...] }` with the found files
3. For each file that's empty or just imports, flag it
4. Report results to user
```

### "Create a new component directory structure"

```
1. `create_directory` → `/project/src/components/Button`
2. `create_directory` → `/project/src/components/Button/__tests__`
3. `write_file` → `/project/src/components/Button/index.ts`
   → Confirm content with user first
4. `write_file` → `/project/src/components/Button/Button.tsx`
   → Confirm content with user first
5. `write_file` → `/project/src/components/Button/__tests__/Button.test.tsx`
   → Confirm content with user first
```

### "Move all .log files to an archive folder"

```
1. `search_files` → `{ pattern: "**/*.log", path: "/project" }` to find all logs
2. `create_directory` → `/project/logs/archive`
3. For each log file, `move_file` → move to `/project/logs/archive/<file>`
   (Note: check destination doesn't exist first via `get_file_info`)
```

---

## Security notes

- The server enforces strict directory access control — it cannot read or write outside allowed directories.
- `write_file` and `edit_file` are destructive operations. Always confirm with the user before calling them.
- The server communicates exclusively over stdio — no network interface is exposed.
- MCP Roots are the recommended approach for dynamic directory access. Roots completely replace configured directories, so if the client sends empty roots, the server will have no allowed directories.
- **User data responsibility** — you are handling the user's personal files. Treat them with care: do not expose sensitive content, do not modify without confirmation, and always leave the workspace in the state the user expects.

## References

- Upstream package: <https://www.npmjs.com/package/@modelcontextprotocol/server-filesystem>
- GitHub: <https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem>
- MCP spec — Roots: <https://spec.modelcontextprotocol.io/specification/2025-03-26/basic/roots/>
- License: MIT
