# Workspace Discovery: Advanced Patterns and Configurations

This file explores 20+ creative patterns for Workspace management, multi-project setups, team configurations, and advanced isolation strategies in Fractal OS.

---

## Category 1: Workspace Setup Patterns

### 1.1 The Monorepo Workspace

**Introduction:** Configure a single workspace that spans a monorepo with multiple packages, giving agents access to the full repository with appropriate constraints.

```typescript
// POST /workspaces/
{
  "name": "Fractal Monorepo",
  "path": "/Users/dev/fractal-monorepo",
  "color": "#6366f1",
  "tasks": [
    { "id": "pkg-core", "label": "Core Package", "color": "#6366f1", "description": "Changes to packages/core" },
    { "id": "pkg-ui", "label": "UI Package", "color": "#ec4899", "description": "Changes to packages/ui" },
    { "id": "pkg-cli", "label": "CLI Package", "color": "#10b981", "description": "Changes to packages/cli" },
    { "id": "cross-package", "label": "Cross-Package", "color": "#f59e0b", "description": "Changes spanning multiple packages" }
  ],
  "git": {
    "branchPrefix": "fractal",
    "commitInstructions": "Use scoped conventional commits: feat(core):, feat(ui):, fix(cli): etc. Breaking changes must use feat!: scope.",
    "prInstructions": "List affected packages. Mark breaking changes prominently. Include migration guide if needed."
  }
}
```

---

### 1.2 The Multi-Environment Workspace Strategy

**Introduction:** Create separate workspaces for the same project but different environments, each with their own agents and configurations.

```typescript
// Workspace per environment
// Production workspace (read-only agents)
{
  "name": "Fractal Production",
  "path": "/Users/dev/fractal",
  "color": "#ef4444",
  "git": {
    "forcePush": false,
    "branchPrefix": "hotfix",
    "commitInstructions": "Production hotfixes only. Every commit must reference a task ID and include a rollback plan."
  }
}

// Staging workspace (full access)
{
  "name": "Fractal Staging",
  "path": "/Users/dev/fractal-staging",
  "color": "#f59e0b",
  "git": {
    "branchPrefix": "staging",
    "commitInstructions": "RC commits only. Must be tested on staging before merge."
  }
}

// Development workspace (unrestricted)
{
  "name": "Fractal Dev",
  "path": "/Users/dev/fractal-dev",
  "color": "#10b981"
}
```

---

### 1.3 The Feature Branch Workspace

**Introduction:** Create a temporary workspace specifically for a long-running feature branch, keeping it completely isolated from main.

```typescript
{
  "name": "Fractal Auth V2 Feature",
  "path": "/Users/dev/fractal-auth-v2",
  "color": "#8b5cf6",
  "worktrees": {
    "deleteOldWorktrees": false,  // Keep worktrees for review
    "worktreeLimit": 5,
    "onCreateScript": "bun install && bun run db:seed:test"
  },
  "git": {
    "branchPrefix": "auth-v2",
    "commitInstructions": "All commits must reference auth-v2 epic. Format: feat(auth-v2): description"
  }
}
```

---

## Category 2: Git Workflow Configurations

### 2.1 Conventional Commits Enforcement

**Introduction:** Configure the workspace to generate perfectly formatted conventional commits via AI guidance.

```typescript
// PATCH /workspaces/{id}
{
  "git": {
    "commitInstructions": "MANDATORY: Use Conventional Commits specification.\n\nFormat: <type>(<scope>): <subject>\n\nTypes: feat, fix, docs, style, refactor, perf, test, chore, ci, revert\n\nScope: feature name, module, or file area (e.g., auth, chat, task)\n\nRules:\n- Subject must be lowercase, imperative, no period at end\n- Subject max 72 characters\n- Body: explain WHAT and WHY, not HOW\n- Footer: reference task IDs as 'Closes FRA-XXX'\n\nExamples:\n- feat(auth): add refresh token rotation\n- fix(chat): resolve streaming timeout on slow connections\n- refactor(memory): extract search logic into MemorySearchService"
  }
}
```

---

### 2.2 PR Description Template

**Introduction:** Guide agents to generate comprehensive PR descriptions that reviewers can act on immediately.

```typescript
{
  "git": {
    "prInstructions": "Generate PRs using this exact structure:\n\n## Summary\n[2-3 sentence description of what changed and why]\n\n## Changes\n- List each file/module changed with one-line explanation\n- Group by feature area\n\n## Testing\n- [ ] Unit tests added/updated\n- [ ] Integration tests pass\n- [ ] Manual testing performed on: [list scenarios]\n\n## Breaking Changes\n[NONE or describe what breaks and migration path]\n\n## Related Tasks\nCloses FRA-XXX\n\n## Screenshots\n[If UI changes: before/after screenshots or recording]"
  }
}
```

---

### 2.3 The Worktree Automation Setup

**Introduction:** Configure the workspace to automatically provision isolated environments for every task.

```typescript
{
  "worktrees": {
    "deleteOldWorktrees": true,
    "worktreeLimit": 10,
    "onCreateScript": "#!/bin/bash\nset -e\n\n# Install dependencies\nbun install --frozen-lockfile\n\n# Run database migrations\nbun run db:migrate\n\n# Seed test data\nbun run db:seed:dev\n\n# Build type declarations\nbun run build:types\n\necho '✅ Worktree ready for development'"
  }
}
```

---

## Category 3: Task Type Customization

### 3.1 Domain-Specific Task Taxonomy

**Introduction:** Replace generic task types with domain-specific ones that carry agent instructions.

```typescript
{
  "tasks": [
    {
      "id": "security-audit",
      "label": "Security Audit",
      "color": "#dc2626",
      "description": "Security review and vulnerability assessment tasks",
      "instructions": "Security audit tasks require:\n1. OWASP Top 10 checklist review\n2. Dependency vulnerability scan (bun audit)\n3. Authentication/authorization verification\n4. Sensitive data exposure audit\n5. Security test coverage verification"
    },
    {
      "id": "data-migration",
      "label": "Data Migration",
      "color": "#7c3aed",
      "description": "Database schema changes and data transformation tasks",
      "instructions": "Data migration tasks MUST:\n1. Include rollback procedure in content\n2. Test on staging before production\n3. Estimate data volume and duration\n4. Have a verification query to confirm success"
    },
    {
      "id": "performance",
      "label": "Performance",
      "color": "#0891b2",
      "description": "Performance optimization and profiling tasks",
      "instructions": "Performance tasks require:\n1. Baseline measurement before changes\n2. Target metric defined\n3. Profiling evidence attached\n4. Post-optimization measurement to prove improvement"
    },
    {
      "id": "incident",
      "label": "Incident Response",
      "color": "#f97316",
      "description": "Production incidents requiring immediate response",
      "instructions": "Incident tasks are URGENT. Protocol:\n1. Assess impact immediately\n2. Implement temporary mitigation first\n3. Document root cause\n4. Plan permanent fix as a separate task\n5. Write post-mortem after resolution"
    }
  ]
}
```

---

## Category 4: Label Systems

### 4.1 Engineering Process Labels

**Introduction:** Create labels that encode engineering process state beyond task status.

```typescript
{
  "labels": [
    {
      "id": "needs-design",
      "label": "Needs Design Review",
      "icon": "PenTool",
      "color": "#8b5cf6"
    },
    {
      "id": "security-sensitive",
      "label": "Security Sensitive",
      "icon": "Shield",
      "color": "#dc2626"
    },
    {
      "id": "breaking-change",
      "label": "Breaking Change",
      "icon": "AlertTriangle",
      "color": "#f97316"
    },
    {
      "id": "good-first-issue",
      "label": "Good First Issue",
      "icon": "Star",
      "color": "#10b981"
    },
    {
      "id": "blocked",
      "label": "Blocked",
      "icon": "Lock",
      "color": "#6b7280"
    },
    {
      "id": "expedite",
      "label": "Expedite",
      "icon": "Zap",
      "color": "#eab308"
    }
  ]
}
```

---

## Category 5: Workspace Path Helper Patterns

### 5.1 Understanding Path Resolution

**Introduction:** The workspace `path` helper is a scope-aware resolver that every service uses internally. Understanding it helps debug configuration issues.

```typescript
// In agent context (runtime access):
const runtime = await workspace.resolve(workspaceId);

// Global scope: ~/.fractal/workspaces
runtime.path("global", "workspaces")
// → /Users/dev/.fractal/workspaces

// Workspace scope: {project}/.fractal/
runtime.path("workspace", "agents")
// → /Users/dev/my-project/.fractal/agents

// Deep path: specific agent file
runtime.path("workspace", "agents", "atlas", "agent.md")
// → /Users/dev/my-project/.fractal/agents/atlas/agent.md

// Task file
runtime.path("workspace", "tasks", "FRA-012", "TASK.md")
// → /Users/dev/my-project/.fractal/tasks/FRA-012/TASK.md
```

---

## Category 6: Service Runtime Patterns

### 6.1 Accessing All 13 Runtime Services

**Introduction:** The workspace runtime exposes all 13 services that power Fractal OS. Understanding what's available helps you leverage the full system.

```typescript
// After resolving workspace runtime
const runtime = await context.fractal.workspaces.resolve();

// Knowledge Management
await runtime.memories.list({ query: "architecture" });
await runtime.instructions.list();
await runtime.templates.render({ template: "feature-spec", data: { name: "auth" } });
await runtime.skills.list();

// Task Lifecycle
await runtime.tasks.list();
await runtime.tasks.create({ name: "New Feature", type: "feature" });
await runtime.tasks.todos("FRA-012").list();
await runtime.tasks.comments("FRA-012").list();

// Agent Operations
await runtime.agents.list();
await runtime.agents.create({ name: "Neo", ... });

// Communication
await runtime.chats.list();
await runtime.events.emit({ type: "workspace.updated", payload: {} });

// Data & Files
await runtime.customCollections.list();
await runtime.views.render({ view: "task-board" });
await runtime.files.list();

// Automation
await runtime.routines.list();
await runtime.toolsets.list();
```

---

## Category 7: Isolation Verification

### 7.1 Confirming Workspace Isolation

**Introduction:** Before running any destructive operation, verify you're in the correct workspace.

```bash
# Step 1: Verify active workspace
fractal workspace get

# Step 2: Check FRACTAL_WORKSPACE_ID
echo $FRACTAL_WORKSPACE_ID

# Step 3: Verify workspace path matches expectations
# If workspace.path doesn't match current directory — STOP

# Step 4: Verify task count before bulk operations
fractal tasks list
```

---

### 7.2 The Managed .env Section Audit

**Introduction:** Periodically verify the managed section in `.env` is intact and correct.

```bash
# Check managed section is present
grep -A 5 "FRACTAL_MANAGED_SECTION" .env

# Expected output:
# # <FRACTAL_MANAGED_SECTION>
# # ⚡ Auto-generated by Fractal — DO NOT edit this block manually.
# FRACTAL_WORKSPACE_ID=my-workspace-slug
# # </FRACTAL_MANAGED_SECTION>
```

**If the managed section is missing or corrupted:**
1. Get workspace ID: `fractal workspace get`
2. Manually restore the section (exactly as above)
3. Verify: `echo $FRACTAL_WORKSPACE_ID` after sourcing `.env`

---

## Category 8: Soft Delete & Recovery

### 8.1 Archiving vs Deleting Workspaces

**Introduction:** Fractal never hard-deletes workspace configs. Use soft-delete (archive) strategically.

```typescript
// Archive a workspace (soft delete)
DELETE /workspaces/old-project-id
// Sets archived: true — data preserved, workspace hidden from active list

// To recover: manually update config.json
// ~/.fractal/workspaces/{id}/config.json
// Set "archived": false and "updatedAt": "<current ISO timestamp>"
```

---

### 8.2 Workspace Migration Pattern

**Introduction:** When moving a project to a new location, update the workspace path rather than recreating it.

```typescript
// Move project to new location
// Step 1: Move files on disk
// mv /old/path/project /new/path/project

// Step 2: Update workspace path via API
PATCH /workspaces/{id}
{
  "path": "/new/path/project"
}

// Step 3: Verify .env managed section still has correct workspace ID
// (the ID doesn't change — only the path changes)
fractal workspace get  // should return new path
```

---

## Category 9: Advanced Git Configuration

### 9.1 Safe Force Push Configuration

**Introduction:** Enable force push only for specific scenarios with explicit safeguards.

```typescript
{
  "git": {
    "forcePush": true,  // Enable for feature branches only
    "commitInstructions": "Force push is enabled. This workspace is for feature branch work only. NEVER force push to main or staging branches. Only use on personal feature branches prefixed with 'fractal/'.",
    "branchPrefix": "fractal"
  }
}
```

---

### 9.2 AI-Guided Commit Enforcement

**Introduction:** Use `commitInstructions` as a behavioral constraint for agents generating commits.

```typescript
{
  "git": {
    "commitInstructions": "ENFORCED COMMIT RULES:\n\n1. Every commit MUST reference a task ID: 'Relates to FRA-XXX'\n2. Every commit MUST have a non-empty body explaining WHY\n3. Commits touching database files MUST include migration rollback command in footer\n4. Commits touching .env files are FORBIDDEN — use environment variable management instead\n5. Commits exceeding 500 lines changed MUST be split into smaller commits\n\nViolating any rule = block the commit and explain which rule was violated."
  }
}
```

---

## Category 10: Multi-Workspace Orchestration

### 10.1 The Hub and Spoke Pattern

**Introduction:** One master workspace orchestrates work across multiple child workspaces via cross-workspace API calls.

```typescript
// Hub workspace: strategic planning and task coordination
// Spoke workspaces: implementation (one per microservice/package)

// Hub workspace config
{
  "name": "Fractal Hub",
  "path": "/Users/dev/fractal-hub",
  "tasks": [
    { "id": "cross-service", "label": "Cross-Service", "color": "#6366f1", "description": "Spans multiple service workspaces" }
  ]
}

// Each spoke has its own:
// - Agent team specialized for that service
// - Tasks scoped to its codebase
// - Instructions for its architecture patterns
// - Templates for its code generation needs
```

---

## Quick Reference: Workspace Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| Sharing workspace across unrelated projects | Context pollution, wrong agents, wrong instructions | Create separate workspaces per project |
| Editing `FRACTAL_MANAGED_SECTION` manually | FRACTAL_WORKSPACE_ID gets corrupted | Let Fractal manage it; restore from `fractal workspace get` |
| Large `worktreeLimit` on small disk | Disk exhaustion (each worktree = full repo) | Set limit based on `du -sh .git` size × limit |
| Empty `commitInstructions` | Inconsistent commits from agents | Always define commit conventions from day one |
| Not using custom task types | Generic types don't carry domain context | Create domain-specific types with `instructions` fields |
| Hard-deleting `.fractal/` directories | Loss of task history, memories, instructions | Use `DELETE /workspaces/:id` (soft delete) or archive specific resources |
