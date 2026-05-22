# Working with Workspaces in Fractal

This guide explains the Workspace system in Fractal OS — the top-level isolation boundary that scopes all agent data, tools, and runtime services. Every Fractal operation happens within a workspace context.

> **📚 Deep Dive:** [Discovery: Workspaces](../discovery/workspaces.md) — workspace patterns, multi-project setups, and isolation strategies

---

## 1. Architecture Overview

```
Global Registry (~/.fractal/)
  └── workspaces/
        └── {workspace-id}/
              └── config.json          ← workspace metadata

Workspace Root ({workspace.path}/)
  └── .fractal/
        ├── agents/                    ← agent configurations + memories
        ├── skills/                    ← installed skills
        ├── instructions/              ← workspace coding rules
        ├── templates/                 ← code/doc templates
        ├── collections/               ← custom data collections
        ├── tasks/                     ← task records, todos, comments
        ├── files/                     ← uploaded/tracked files
        └── views/                     ← custom data views

.env (workspace root)
  └── FRACTAL_WORKSPACE_ID=my-workspace-slug   ← auto-injected on create
```

### Dual Storage Model

| Scope | Purpose | Location |
|---|---|---|
| **Global** | Workspace registry (config.json per workspace) | `~/.fractal/workspaces/{id}/config.json` |
| **Workspace** | All runtime data (agents, tasks, memories, templates, etc.) | `{workspace.path}/.fractal/{resource}/` |

---

## 2. Workspace Schema Reference

### Main Schema

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` (slug) | Auto | `Slug.generate(name)` | Unique identifier. Auto-derived from name. |
| `name` | `string` | ✅ | — | Human-readable workspace name |
| `path` | `string` | ✅ | — | Absolute filesystem path to the project root |
| `logo` | `string` | ❌ | — | Optional logo URL |
| `color` | `string` | ❌ | — | Optional hex color for UI display |
| `tasks` | `FractalWorkspaceTaskType[]` | Auto | default types | Task type definitions (bug, feature, refactor, docs, config) |
| `labels` | `FractalWorkspaceLabel[]` | Auto | `[]` | Custom label definitions |
| `worktrees` | `FractalWorkspaceWorktrees` | Auto | see below | Git worktree configuration |
| `git` | `FractalWorkspaceGit` | Auto | see below | Git behavior configuration |
| `archived` | `boolean` | Auto | `false` | Soft-delete flag |
| `createdAt` | `string` | Auto | now | ISO timestamp |
| `updatedAt` | `string` | Auto | now | ISO timestamp |

### Worktrees Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `deleteOldWorktrees` | `boolean` | `true` | Auto-delete worktrees when tasks finish |
| `worktreeLimit` | `number` (1–50) | `15` | Max concurrent worktrees |
| `onCreateScript` | `string` | `""` | Bash script to run after worktree creation |

### Git Configuration

| Field | Type | Default | Description |
|---|---|---|---|
| `branchPrefix` | `string` | `"fractal"` | Prefix for auto-created branches |
| `forcePush` | `boolean` | `false` | Allow force push on agent branches |
| `commitInstructions` | `string` | `""` | AI instructions for commit message generation |
| `prInstructions` | `string` | `""` | AI instructions for PR description generation |

### Default Task Types (seeded on creation)

| ID | Label | Color |
|---|---|---|
| `feature` | Feature | `#6366f1` (indigo) |
| `bug` | Bug | `#ef4444` (red) |
| `refactor` | Refactor | `#f59e0b` (amber) |
| `docs` | Documentation | `#10b981` (green) |
| `config` | Configuration | `#64748b` (slate) |

---

## 3. CLI Commands

### `fractal workspace get` — Get Current Workspace

```bash
fractal workspace get
```

Reads `FRACTAL_WORKSPACE_ID` from the environment and returns the current workspace metadata (path, logo, color, status).

> **Note:** This is currently the only CLI command for workspace management. Workspace create/update/list/delete operations are available via the HTTP API and programmatically.

---

## 4. HTTP API Endpoints

Base path: `/workspaces`

| Method | Path | Action | Body/Params |
|---|---|---|---|
| `POST` | `/workspaces/` | Create workspace | Body: `{ name, path, logo?, color? }` |
| `GET` | `/workspaces/` | List all workspaces | — |
| `GET` | `/workspaces/:id` | Get workspace by ID | Params: `id` (or `"current"`) |
| `PATCH` | `/workspaces/:id` | Update workspace | Body: partial workspace fields |
| `DELETE` | `/workspaces/:id` | Soft-delete workspace | Params: `id` |

---

## 5. Workspace Creation Flow

When a workspace is created (`create()`), the system performs this sequence:

```
1. Slug.generate(name) → workspace ID
   └── collision check against existing workspaces

2. Scaffold .fractal/ directory structure
   └── .fractal/agents/ .fractal/skills/ .fractal/instructions/
       .fractal/templates/ .fractal/collections/ .fractal/tasks/
       .fractal/files/ .fractal/views/
   └── Each directory gets a .gitkeep file

3. Inject managed section into .env and .env.sample
   └── # <FRACTAL_MANAGED_SECTION>
       FRACTAL_WORKSPACE_ID=my-workspace-slug
       # </FRACTAL_MANAGED_SECTION>

4. Create default Atlas orchestrator agent
   └── id: "atlas"
       name: "Atlas"
       role: "AIOS Architect & Workspace Orchestrator"
       orchestrator: true
       (skipped if orchestrator already exists)

5. Persist config.json to ~/.fractal/workspaces/{id}/config.json
```

---

## 6. The Workspace Runtime

The `WorkspaceRuntime` is the central object injected into all services. It provides:

```typescript
type FractalWorkspaceRuntime = {
  config: FractalWorkspace;          // parsed workspace config
  core: FractalCollectionsManager;   // workspace-scoped collections instance
  path: FractalWorkspacePathHelper;  // scope-aware path resolver
  activity: FractalActivityInstance; // activity/notification tracking
  store: InferedStore;               // shared reactive state store

  // All 13 bound services:
  toolsets: ToolsetService;
  templates: TemplateService;
  skills: SkillService;
  memories: MemoryService;
  agents: AgentService;
  instructions: InstructionService;
  tasks: FractalTaskService;
  events: FractalEventService;
  chats: ChatService;
  files: FileService;
  customCollections: FractalCollectionService;
  views: FractalViewService;
  routines: FractalRoutineService;
}
```

### Path Helper

The `path` helper resolves scope-aware paths:

```typescript
// Global scope → ~/.fractal/workspaces
path("global", "workspaces")

// Workspace scope → {workspace.path}/.fractal/agents
path("workspace", "agents")

// Specific file
path("workspace", "tasks", "FRA-012", "TASK.md")
```

---

## 7. Workspace Isolation

### What Is Isolated Per Workspace

Everything in `.fractal/` is workspace-scoped:
- Agent configurations and their memories
- Skills and their templates, guides, recipes
- Instructions (coding rules)
- Templates (code/doc generators)
- Custom collections
- Tasks, todos, comments
- Files and uploads
- Views (data visualizations)
- Routines (scheduled jobs)

### What Is Global (Shared Across Workspaces)

Only the workspace **registry** is global:
- `~/.fractal/workspaces/{id}/config.json` — workspace metadata
- `FRACTAL_INSTALL_PATH` env var overrides the `~/.fractal` global root

### The `.env` Managed Section

Every workspace has `FRACTAL_WORKSPACE_ID` auto-injected into `.env`:

```bash
# <FRACTAL_MANAGED_SECTION>
# ⚡ Auto-generated by Fractal — DO NOT edit this block manually.

# @description Unique identifier for this Fractal workspace.
FRACTAL_WORKSPACE_ID=my-workspace-slug

# </FRACTAL_MANAGED_SECTION>
```

**Rules:**
- NEVER edit the managed section manually
- The `FRACTAL_WORKSPACE_ID` is used by ALL Fractal CLI commands to identify the active workspace
- Both `.env` and `.env.sample` receive the managed section

---

## 8. Soft Delete Behavior

`delete(id)` is a **soft delete**:
- Sets `archived = true` on the config
- Updates `updatedAt`
- Does NOT remove `~/.fractal/workspaces/{id}/config.json`
- Does NOT touch any `.fractal/` data in the workspace path

To exclude archived workspaces from list results, filter client-side on `archived === false`.

---

## 9. Git Worktree Integration

When tasks use `worktree.enabled = true`, the workspace's git config governs behavior:

```typescript
// workspace.config.git
{
  branchPrefix: "fractal",    // branches become "fractal/FRA-012"
  forcePush: false,           // safe mode: no force push
  commitInstructions: "...",  // AI-guided commit messages
  prInstructions: "..."       // AI-guided PR descriptions
}

// workspace.config.worktrees
{
  deleteOldWorktrees: true,   // auto-cleanup
  worktreeLimit: 15,          // max concurrent git worktrees
  onCreateScript: "bun install" // run after each worktree creation
}
```

Worktrees are created at: `.fractal/tasks/{taskId}/worktree` (default) unless overridden by task config.

---

## 10. Updating Workspace Configuration

```typescript
// Via HTTP API PATCH /workspaces/:id
{
  "name": "Fractal v2",
  "color": "#6366f1",
  "worktrees": {
    "deleteOldWorktrees": true,
    "worktreeLimit": 20,
    "onCreateScript": "bun install && bun run build:types"
  },
  "git": {
    "branchPrefix": "fractal",
    "commitInstructions": "Use conventional commits format: feat/fix/refactor/docs/chore. Include task ID in parentheses.",
    "prInstructions": "Summarize changes in 2-3 sentences. List affected files. Tag @atlas for review."
  }
}
```

### Adding Custom Task Types

```typescript
// PATCH /workspaces/:id
{
  "tasks": [
    // ...existing default types...
    {
      "id": "security-audit",
      "label": "Security Audit",
      "color": "#dc2626",
      "description": "Security review and vulnerability assessment tasks",
      "instructions": "When working on security audit tasks, always check OWASP top 10 and run security scanners."
    }
  ]
}
```

### Adding Custom Labels

```typescript
{
  "labels": [
    {
      "id": "breaking-change",
      "label": "Breaking Change",
      "icon": "AlertTriangle",
      "color": "#f97316"
    },
    {
      "id": "needs-review",
      "label": "Needs Atlas Review",
      "icon": "Eye",
      "color": "#8b5cf6"
    }
  ]
}
```

---

## 11. Error Reference

| Error Code | HTTP | Cause | Resolution |
|---|---|---|---|
| `WORKSPACE_NOT_FOUND` | 404 | Workspace ID does not exist | Check `FRACTAL_WORKSPACE_ID` env var |
| `WORKSPACE_ALREADY_EXISTS` | 400 | Slug collision on create | Choose a different workspace name |

---

## 12. Proactive Workflows

### A. Verifying Active Workspace

```bash
# Check which workspace is active
fractal workspace get

# Verify FRACTAL_WORKSPACE_ID is set
echo $FRACTAL_WORKSPACE_ID
```

### B. Configuring Git Conventions

When starting a new project, configure the workspace git instructions to enforce commit conventions:

```typescript
// PATCH /workspaces/current
{
  "git": {
    "commitInstructions": "Always use Conventional Commits: feat(scope): description. Include task ID like (FRA-012). Keep subject under 72 chars. Use imperative mood.",
    "prInstructions": "PR title must follow: [FRA-XXX] feat: description. Body must include: Summary, Changes, Testing, Breaking Changes."
  }
}
```

### C. Setting Up Worktree Automation

```typescript
{
  "worktrees": {
    "deleteOldWorktrees": true,
    "worktreeLimit": 10,
    "onCreateScript": "bun install --frozen-lockfile && bun run db:migrate"
  }
}
```

---

## 13. Best Practices

- ✅ **Always verify `FRACTAL_WORKSPACE_ID`** before running CLI commands
- ✅ **Never edit the `FRACTAL_MANAGED_SECTION`** in `.env` manually
- ✅ **Configure `commitInstructions`** early — it guides all agent-generated commits
- ✅ **Set `worktreeLimit`** based on available disk space (each worktree = full repo copy)
- ✅ **Add custom task types** for domain-specific work categories (security-audit, data-migration, etc.)
- ❌ **Don't delete workspace data in `.fractal/`** directly — use CLI/API commands
- ❌ **Don't confuse global (registry) vs workspace (runtime) scope** — different paths, different responsibilities
