# Tasks — Fractal OS Reference Guide

Tasks are the primary unit of work in Fractal OS. They drive the full **Task Lifecycle Engine**, coordinate AI agent execution, track progress via todos and comments, and optionally isolate work in Git worktrees.

---

## 1. Task Lifecycle

```
┌─────────────┐
│ suggestion  │ ──► backlog ──► planning ──► todo ──► in_progress
└─────────────┘                                            │
       │                                          ┌────────┴────────┐
       └──────────────────────────────────────────►  in_review (⚠)  │
                                                  └────────┬────────┘
                                                           │
                                                       finished
                                                           │
                                                    ◄──────┘ (reopen → backlog | todo)
```

> ⚠ **`in_review` is blocked** when any todo has a status other than `finished`. The system throws `FRACTAL_TASK_REVIEW_BLOCKED`.

### Valid Status Transitions

| From \ To      | suggestion | backlog | planning | todo | in_progress | in_review | finished |
|----------------|:----------:|:-------:|:--------:|:----:|:-----------:|:---------:|:--------:|
| `suggestion`   | —          | ✅      | ✅       | ✅   | ✅          | ❌        | ❌       |
| `backlog`      | ❌         | —       | ✅       | ✅   | ✅          | ❌        | ❌       |
| `planning`     | ❌         | ❌      | —        | ✅   | ✅          | ❌        | ❌       |
| `todo`         | ❌         | ❌      | ❌       | —    | ✅          | ❌        | ❌       |
| `in_progress`  | ❌         | ❌      | ❌       | ❌   | —           | ✅ (⚠)   | ✅       |
| `in_review`    | ❌         | ❌      | ❌       | ✅   | ✅          | —         | ✅       |
| `finished`     | ❌         | ✅      | ❌       | ✅   | ❌          | ❌        | —        |

---

## 2. Task Schema

### 2.1 Task Fields

| Field        | Type       | Required | Default         | Description                                                                 |
|--------------|------------|----------|-----------------|-----------------------------------------------------------------------------|
| `id`         | `string`   | auto     | `{WS}-{N}`      | e.g. `FRA-012` — first 3 chars of workspace name (uppercase) + incrementing number |
| `slug`       | `string`   | auto     | URL-safe        | Auto-generated from `name`                                                  |
| `name`       | `string`   | ✅       | —               | Short goal description                                                      |
| `type`       | `string`   | ✅       | —               | `"bug"` \| `"feature"` \| `"refactor"` \| `"docs"` \| `"task"` \| `"config"` |
| `status`     | `enum`     | ✅       | `"suggestion"`  | See [Status Transitions](#valid-status-transitions)                        |
| `priority`   | `enum`     | —        | `"no_priority"` | `"no_priority"` \| `"urgent"` \| `"high"` \| `"medium"` \| `"low"`       |
| `assigned`   | `string?`  | —        | —               | Agent ID or username                                                        |
| `dueAt`      | `string?`  | —        | —               | ISO 8601 timestamp                                                          |
| `summary`    | `string?`  | —        | —               | 1–2 sentence "why" description                                              |
| `content`    | `string?`  | —        | —               | Full Markdown body (stored as `.md`)                                        |
| `template`   | `string?`  | —        | —               | Template ID for scaffolding                                                 |
| `chat`       | `string?`  | —        | —               | Associated chat session ID                                                  |
| `attachments`| `array`    | —        | `[]`            | `[{ uri: string, observation?: string }]`                                   |
| `worktree`   | `object`   | —        | see below       | Git worktree configuration                                                  |

### 2.2 Worktree Sub-Schema

| Field              | Type       | Default        | Description                            |
|--------------------|------------|----------------|----------------------------------------|
| `worktree.enabled` | `boolean`  | `false`        | Create isolated Git worktree on start  |
| `worktree.base`    | `string?`  | current branch | Base branch to fork from              |
| `worktree.branch`  | `string?`  | `task/{id}`    | Branch name for the worktree           |
| `worktree.path`    | `string?`  | auto           | Filesystem path for the worktree       |

---

## 3. Todo Schema

Todos are step-level checklists within a task. Agents **must** create todos before executing.

| Field          | Type      | Required | Default  | Description                                           |
|----------------|-----------|----------|----------|-------------------------------------------------------|
| `id`           | `string`  | auto     | —        | e.g. `FRA-012-T001` (`{taskId}-T{padded_count}`)     |
| `taskId`       | `string?` | auto     | —        | Parent task ID                                        |
| `description`  | `string`  | ✅       | —        | Step description                                      |
| `status`       | `enum`    | ✅       | `"todo"` | `"todo"` \| `"in_progress"` \| `"in_review"` \| `"finished"` |
| `agent`        | `string?` | —        | —        | Fractal agent ID assigned to this todo                |
| `instructions` | `string?` | —        | —        | Behavioral guidance for the agent                     |
| `output`       | `any?`    | auto     | —        | Auto-populated by the agent on completion             |

---

## 4. Comment Schema

Comments provide threaded progress reporting. Agents **must** post comments to report progress, not just chat.

| Field          | Type      | Required | Default  | Description                                           |
|----------------|-----------|----------|----------|-------------------------------------------------------|
| `id`           | `string`  | auto     | UUID     | Auto-generated `randomUUID()`                         |
| `taskId`       | `string?` | auto     | —        | Parent task ID                                        |
| `body`         | `string`  | ✅       | —        | Markdown content                                      |
| `author`       | `string`  | ✅       | —        | Display name (human or agent label)                   |
| `authorType`   | `enum`    | ✅       | `"user"` | `"user"` \| `"agent"`                                |
| `agentId`      | `string?` | cond.    | —        | **Required** when `authorType="agent"`                |
| `parentId`     | `string?` | —        | —        | Parent comment ID (enables threading)                 |
| `attachments`  | `array`   | —        | `[]`     | `[{ uri: string, observation?: string }]`             |
| `createdAt`    | `string`  | auto     | —        | ISO 8601 timestamp                                    |
| `updatedAt`    | `string`  | auto     | —        | ISO 8601 timestamp                                    |

---

## 5. Storage Layout

```
.fractal/
└── tasks/
    └── {taskId}/           e.g. FRA-012/
        ├── TASK.md          ← Task record (Markdown + frontmatter)
        ├── todos/
        │   ├── FRA-012-T001.json
        │   └── FRA-012-T002.json
        └── comments/
            ├── {uuid}.json
            └── {uuid}.json
```

---

## 6. CLI Reference

### 6.1 Task Commands

```bash
# List all tasks (with optional filters)
fractal tasks list
fractal tasks list --status in_progress
fractal tasks list --priority high

# Get full task detail
fractal tasks get --task FRA-012

# Create a new task (interactive or flags)
fractal tasks create
fractal tasks create --name "Fix login redirect" --type bug --priority high

# Update task fields
fractal tasks update --task FRA-012 --name "Updated name" --priority urgent

# Delete a task
fractal tasks delete --task FRA-012

# Change task status
fractal tasks set_status --task FRA-012 --status in_progress

# Start task (worktree + prompt + chat + autopilot dispatch)
fractal tasks start --task FRA-012

# Generate execution prompt for the task
fractal tasks prompt --task FRA-012

# Create or switch to the task's Git branch/worktree
fractal tasks branch --task FRA-012
```

### 6.2 Todo Commands

```bash
# List todos for a task
fractal tasks todos list --task FRA-012

# Create a new todo
fractal tasks todos create --task FRA-012 --description "Implement schema validation"

# Update a todo's status
fractal tasks todos set_status --task FRA-012 --id FRA-012-T001 --status in_progress
fractal tasks todos set_status --task FRA-012 --id FRA-012-T001 --status finished
```

### 6.3 Comment Commands

```bash
# Add a comment (human)
fractal tasks comment add --task FRA-012 --body "Reviewed — LGTM" --author "Felipe"

# Add a comment as agent
fractal tasks comment add --task FRA-012 \
  --body "✅ Schema validation implemented. Running tests." \
  --author "Atlas" \
  --author-type agent \
  --agent-id atlas

# List all comments on a task
fractal tasks comment list --task FRA-012

# Reply to a comment (threaded)
fractal tasks comment add --task FRA-012 \
  --body "Test suite passed." \
  --author "Atlas" \
  --author-type agent \
  --agent-id atlas \
  --parent-id {parentCommentId}
```

---

## 7. Task Start & Autopilot Flow

When `fractal tasks start --task <id>` is called (or status transitions to `in_progress`), the following sequence executes automatically:

```
fractal tasks start --task FRA-012
        │
        ▼
1. worktree.enabled=true?
   └─ YES → git worktree add .worktrees/FRA-012 task/FRA-012
        │
        ▼
2. Generate execution prompt
   └─ fractal tasks prompt --task FRA-012
        │
        ▼
3. Create new chat session
   └─ chat.id stored in task.chat
        │
        ▼
4. Dispatch background agent job
   └─ Agent receives: task record + todos + prompt
        │
        ▼
5. Agent executes autonomously:
   ├─ Iterates todos as checklist
   ├─ Posts comments for progress
   └─ Sets todos to finished one by one
```

---

## 8. Git Worktree Usage

Worktrees isolate task work in a separate directory without switching branches in the main workspace.

```bash
# Enable worktree on task creation
fractal tasks create \
  --name "Refactor auth module" \
  --type refactor \
  --worktree-enabled true \
  --worktree-branch task/FRA-012

# Manually create worktree after task exists
fractal tasks branch --task FRA-012

# The worktree is created at:
# .worktrees/FRA-012/   (or worktree.path if set)
# on branch:            task/FRA-012 (or worktree.branch if set)
```

**Finish operations:**
- `merge_to_main` — merges worktree branch into main and removes worktree
- `create_branch` — keeps the branch open for PR review flow

---

## 9. Agent Comment Protocol

Agents **must** use task comments (not only chat) to report progress. This ensures traceability independent of the active chat session.

```typescript
// Correct: agent posting a progress comment
{
  taskId: "FRA-012",
  body: "## Progress Update\n\n- ✅ Schema defined\n- 🔄 Controller in progress\n- ⬜ Tests pending",
  author: "Atlas",
  authorType: "agent",   // REQUIRED field
  agentId: "atlas"       // REQUIRED when authorType="agent"
}

// Correct: threaded reply to another comment
{
  taskId: "FRA-012",
  parentId: "comment-uuid-here",
  body: "All tests passing. Marking todo as finished.",
  author: "Atlas",
  authorType: "agent",
  agentId: "atlas"
}
```

**Rules:**
- Never use external AI names (e.g. "ChatGPT", "Gemini") as `agentId` — use the Fractal agent record ID
- `authorType: "agent"` requires `agentId` to be set
- Progress comments should use Markdown checklists for scanability
- Post a comment **before** starting a todo and **after** finishing it

---

## 10. Proactive Workflows

### 10.1 Task-Driven Execution (Standard)

```
User creates feature request
        │
        ▼
Agent creates task (type=feature, status=suggestion)
        │
        ▼
Agent breaks down task into todos (min. 3–5 steps)
        │
        ▼
Agent sets status → in_progress (triggers autopilot)
        │
        ▼
Agent iterates todos: set_status in_progress → execute → set_status finished → comment
        │
        ▼
All todos finished → set_status in_review
        │
        ▼
Human reviews → set_status finished
```

### 10.2 Proactive Suggestion Workflow

When the agent detects a problem, improvement opportunity, or tech debt:

```bash
# Create a suggestion task immediately — don't wait for user to ask
fractal tasks create \
  --name "Upgrade @igniter-js to v2.1" \
  --type refactor \
  --status suggestion \
  --priority low \
  --summary "Current v2.0 has deprecated queue API. Upgrade prevents future breaking changes."
```

### 10.3 Todo Breakdown Pattern

Before executing, always decompose the task into atomic, verifiable steps:

```bash
fractal tasks todos create --task FRA-012 --description "Read task.instructions.md and existing code"
fractal tasks todos create --task FRA-012 --description "Define Zod schema in [feature].interfaces.ts"
fractal tasks todos create --task FRA-012 --description "Implement procedure logic"
fractal tasks todos create --task FRA-012 --description "Implement controller (validation + delegation)"
fractal tasks todos create --task FRA-012 --description "Write unit tests"
fractal tasks todos create --task FRA-012 --description "Run tsc --noEmit and verify"
fractal tasks todos create --task FRA-012 --description "Post final summary comment"
```

---

## 11. Best Practices Checklist

### Before Starting a Task
- [ ] Read `task.instructions.md` before touching any file
- [ ] Read the task record, all todos, and all comments via `fractal tasks get`
- [ ] Check Fractal memories for related historical context
- [ ] Set task status to `in_progress` **before** making any edits
- [ ] Create all todos before executing (decompose first)
- [ ] Post an initial comment: "Starting execution. Plan: …"

### During Execution
- [ ] Set each todo to `in_progress` before working on it
- [ ] Set each todo to `finished` immediately after completing it
- [ ] Post a progress comment after each major milestone
- [ ] Use `authorType: "agent"` with `agentId` on all agent comments
- [ ] Never skip status updates — they are the source of truth

### Before Moving to `in_review`
- [ ] All todos are `finished` (otherwise `FRACTAL_TASK_REVIEW_BLOCKED`)
- [ ] Post a completion summary comment with results/outputs
- [ ] Verify with `fractal tasks todos list --task <id>` that all todos are done
- [ ] Run `bun run tsc --noEmit` and `bun test` — no errors

### After Review
- [ ] Human sets status to `finished` or requests changes (`in_progress`)
- [ ] Create a Fractal memory documenting lessons learned
- [ ] If worktree was used: merge or create PR as appropriate

---

## 12. Error Reference

| Error Code                         | Trigger                                               | Resolution                              |
|------------------------------------|-------------------------------------------------------|-----------------------------------------|
| `FRACTAL_TASK_REVIEW_BLOCKED`      | Transition to `in_review` with unfinished todos       | Set all todos to `finished` first       |
| `FRACTAL_TASK_INVALID_TRANSITION`  | Attempted illegal status transition (see matrix)      | Check transition table in Section 1     |
| `FRACTAL_TASK_NOT_FOUND`           | `--task <id>` does not match any record               | Run `fractal tasks list` to confirm IDs |
| `FRACTAL_TODO_NOT_FOUND`           | `--id <todoId>` does not match any todo               | Run `fractal tasks todos list --task`   |
| `FRACTAL_COMMENT_AGENT_ID_MISSING` | `authorType="agent"` but `agentId` not provided       | Always include `agentId` for agents     |
