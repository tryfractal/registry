# Fractal OS — Memory Capability Reference

> **Audience:** AI agents operating within Fractal OS.  
> **Scope:** Everything you need to read, write, search, and supersede memories correctly.

---

## 1. What Are Memories?

Memories are the **persistent, agent-scoped knowledge store** of Fractal OS. They allow any agent to record facts, architectural decisions, user preferences, lessons learned, and contextual state that must survive across sessions.

Every memory is:
- **Scoped to an agent** — resolved from `FRACTAL_AGENT_ID` env var.  
- **Stored as Markdown + YAML frontmatter** on disk.  
- **Immutable once written** — knowledge is updated by *superseding*, not editing.  
- **Vector-searchable** — the `description` field is the primary retrieval signal.

---

## 2. Storage Layout

```
.fractal/
└── agents/
    └── {agent}/
        └── memories/
            └── {uuid}.memory.md        ← one file per memory
```

Each file contains YAML frontmatter followed by an optional Markdown body (`content`):

```markdown
---
id: "550e8400-e29b-41d4-a716-446655440000"
title: "Use Zod for all schema definitions"
description: "All API payloads and domain types must be defined with Zod schemas as single source of truth"
category: "architecture"
tags: ["zod", "schema", "typescript"]
agent: "atlas"
confidence: 1
status: "active"
scopes: ["src/features/**/*.ts"]
links: []
supersedes: []
createdAt: "2026-01-15T10:00:00.000Z"
updatedAt: "2026-01-15T10:00:00.000Z"
---

## Full Context

Always define Zod schemas in `[feature].interfaces.ts`. Controllers and procedures
must import types inferred from these schemas — never define types separately.
```

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Agent Runtime                        │
│  (FRACTAL_AGENT_ID = "atlas")                           │
└────────────────────┬────────────────────────────────────┘
                     │ all R/W scoped to this agent
                     ▼
┌─────────────────────────────────────────────────────────┐
│               Memory Collection Layer                   │
│  .fractal/agents/{agent}/memories/{uuid}.memory.md      │
│                                                         │
│  • UUID primary key (crypto.randomUUID())               │
│  • YAML frontmatter + Markdown content                  │
│  • Immutable — supersedes pattern for updates           │
└──────────┬──────────────────────────┬───────────────────┘
           │ fuzzy full-text search   │ graph traversal
           ▼                          ▼
┌──────────────────┐      ┌──────────────────────────────┐
│  Search Engine   │      │  Knowledge Graph Endpoint    │
│  title   × 5     │      │  (linked UUID traversal)     │
│  description × 4 │      └──────────────────────────────┘
│  tags    × 3     │
│  content × 1     │
└──────────────────┘
```

**Key invariants:**
1. IDs are **random UUIDs** — never semantic slugs like `AGENT::CATEGORY::SLUG`.
2. `forgot()` sets `status = "deprecated"` — the file is **never deleted from disk**.
3. `create()` with `supersedes` auto-calls `forgot()` on every listed UUID before creating.
4. `list()` returns only `status = "active"` records by default (limit 10).

---

## 4. Complete Field Reference

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` (UUID) | auto | `crypto.randomUUID()` | Unique identifier. Never set manually. |
| `title` | `string` | ✅ | — | Brief human-readable summary (search weight ×5). |
| `description` | `string` | ✅ | — | Vector-optimized retrieval sentence (search weight ×4). |
| `category` | `enum` | ✅ | — | One of 9 categories — see §6. |
| `tags` | `string[]` | ✅ | — | Searchable keyword tags (search weight ×3). |
| `content` | `string?` | — | `null` | Full Markdown body (search weight ×1). |
| `agent` | `string` | ✅ | `FRACTAL_AGENT_ID` | Agent that owns this memory. |
| `confidence` | `number` (0–1) | — | `1` | How certain the agent is about this knowledge. |
| `links` | `string[]` | — | `[]` | Related memory UUIDs (graph edges). |
| `supersedes` | `{id: string, reason: string}[]` | — | `[]` | UUIDs this memory replaces, plus the reason. |
| `status` | `enum` | — | `"active"` | `active` \| `deprecated` \| `archived` \| `ttl_expired` |
| `deprecatedBy` | `string?` | — | `null` | UUID of the memory that replaced this one. |
| `deprecatedAt` | `string?` | — | `null` | ISO 8601 timestamp of deprecation. |
| `deprecatedReason` | `string?` | — | `null` | Human-readable reason for deprecation. |
| `scopes` | `string[]?` | — | `null` | Glob patterns limiting relevance (e.g., `src/features/**/*.ts`). |
| `expiresAt` | `string?` | — | `null` | ISO 8601 TTL — system auto-expires after this date. |
| `createdAt` | `string` | auto | now | ISO 8601 creation timestamp. |
| `updatedAt` | `string` | auto | now | ISO 8601 last update timestamp. |
| `metadata` | `any?` | — | `null` | Arbitrary structured data for tooling use. |

---

## 5. CLI Commands

### 5.1 `fractal memories list` — Browse Active Memories

```bash
fractal memories list [flags]
```

| Flag | Type | Default | Description |
|---|---|---|---|
| `--status` | `string` | `"active"` | Filter by status enum value. |
| `--category` | `string` | — | Filter by category name. |
| `--scopes` | JSON `string[]` | — | Filter memories whose scopes match. |
| `--query` | `string` | — | Full-text fuzzy search across all weighted fields. |
| `--limit` | `number` | `10` | Maximum results to return. |
| `--offset` | `number` | `0` | Pagination offset. |

**Examples:**

```bash
# List active memories (default — only 10 shown)
fractal memories list

# Search for architecture decisions
fractal memories list --query "zod schema" --category architecture

# Find deprecated memories about routing
fractal memories list --status deprecated --query "router"

# Scope-filtered: memories relevant to the features layer
fractal memories list --scopes '["src/features/**/*.ts"]'

# Paginate through all lessons
fractal memories list --category lesson --limit 20 --offset 20
```

> [!WARNING]
> The default limit is **10**. Always pass `--limit` when you need full coverage. Always pass `--status deprecated` explicitly when auditing superseded knowledge.

---

### 5.2 `fractal memories get <uuid>` — Retrieve a Specific Memory

```bash
fractal memories get <uuid>
```

**Example:**

```bash
fractal memories get 550e8400-e29b-41d4-a716-446655440000
```

Returns the full memory record including `content`, `links`, and `supersedes` chain.

**Error:** `MEMORY_NOT_FOUND (404)` if UUID does not exist for the current agent.

---

### 5.3 `fractal memories create` — Record New Knowledge

```bash
fractal memories create [flags]
```

| Flag | Type | Required | Description |
|---|---|---|---|
| `--title` | `string` | ✅ | Brief human-readable title. |
| `--description` | `string` | ✅ | Retrieval-optimized summary sentence. |
| `--category` | `string` | ✅ | One of the 9 category values. |
| `--agent` | `string` | ✅ | Agent identifier (usually set via `FRACTAL_AGENT_ID`). |
| `--tags` | JSON `string[]` | ✅ | Keyword tags. |
| `--content` | `string` | — | Full Markdown body. |
| `--confidence` | `number` | — | Certainty score 0–1 (default `1`). |
| `--links` | JSON `string[]` | — | Related memory UUIDs. |
| `--supersedes` | JSON `{id, reason}[]` | — | Memories this replaces (triggers auto-deprecation). |

**Examples:**

```bash
# Simple architecture decision record
fractal memories create \
  --title "Igniter.js procedures must never return raw HTTP codes" \
  --description "Business logic errors must be mapped to domain errors in [feature].errors.ts, never returned as raw HTTP status codes from procedures" \
  --category architecture \
  --agent atlas \
  --tags '["igniter", "errors", "procedures", "clean-architecture"]'

# Lesson with full Markdown content
fractal memories create \
  --title "Bun test runner requires explicit --timeout for long async tests" \
  --description "bun test fails silently on async tests exceeding 5000ms default timeout; always pass --timeout flag for integration tests" \
  --category lesson \
  --agent atlas \
  --tags '["bun", "testing", "async", "timeout"]' \
  --content "## Details\n\nRun with: \`bun test --timeout 30000\`\n\nAffects all tests that spin up a real HTTP server." \
  --confidence 0.95

# Superseding an outdated memory
fractal memories create \
  --title "Use @igniter-js/collections v2 schema API" \
  --description "The defineCollection() API changed in v2; use createCollection() instead and import from @igniter-js/collections/v2" \
  --category architecture \
  --agent atlas \
  --tags '["igniter", "collections", "v2", "migration"]' \
  --supersedes '[{"id":"old-uuid-here","reason":"API changed in v2 — defineCollection is removed"}]'
```

> [!IMPORTANT]
> When using `--supersedes`, the system automatically calls `forgot()` on each listed UUID before creating the new memory. You do not need to run `forgot` manually.

---

### 5.4 `fractal memories forgot <uuid> --reason <text>` — Deprecate a Memory

```bash
fractal memories forgot <uuid> --reason "<human-readable reason>"
```

**Example:**

```bash
fractal memories forgot 550e8400-e29b-41d4-a716-446655440000 \
  --reason "Architecture changed; Zod v4 migration removes .parse() in favor of .safeParse() everywhere"
```

**What this does:**
- Sets `status = "deprecated"` on the target memory.
- Sets `deprecatedAt` to the current ISO timestamp.
- Sets `deprecatedReason` to the `--reason` text.
- **Does NOT delete the file from disk** — the knowledge chain is preserved.

**Errors:**
- `MEMORY_NOT_FOUND (404)` — UUID does not exist.
- `MEMORY_ALREADY_DEPRECATED (400)` — already deprecated; no-op needed.
- `MEMORY_AGENT_REQUIRED (400)` — `FRACTAL_AGENT_ID` not set.

---

## 6. Memory Categories

| Category | When to Use | Examples |
|---|---|---|
| `preference` | User's stated stylistic or behavioral choices | "Felipe prefers concise responses", "Dark mode only" |
| `architecture` | Structural decisions about the codebase or system | "Use Zod single-source-of-truth", "Procedures never return HTTP codes" |
| `workflow` | Step-by-step process or ritual that must be followed | "Always read task.instructions.md before starting a task" |
| `context` | Situational state true right now but potentially transient | "Current sprint focuses on chat feature v2" |
| `lesson` | Hard-won insights from bugs, failures, or experiments | "bun test --timeout needed for async integration tests" |
| `constraint` | Absolute rules that must never be violated | "Never edit igniter.router.ts from a feature agent" |
| `tooling` | Knowledge about CLI tools, scripts, or dev environment | "fractal memories list defaults to limit 10" |
| `security` | Security policies, secrets hygiene, access rules | "FRACTAL_AGENT_ID must not be logged in plain text" |
| `reference` | External documentation pointers or API references | "Igniter.js v3 changelog at github.com/…" |

---

## 7. Search Patterns & Filter Recipes

The search engine applies **fuzzy full-text matching** with field weights:

```
title       ×5   ← most important: write descriptive titles
description ×4   ← optimize for retrieval: write a full sentence
tags        ×3   ← use consistent taxonomy
content     ×1   ← lowest weight: detailed prose
```

### Practical Filter Recipes

```bash
# Find all active architecture decisions
fractal memories list --category architecture --limit 50

# Search for anything related to testing
fractal memories list --query "test bun async"

# Find memories scoped to the chat feature
fractal memories list --scopes '["src/features/chat/**"]'

# Audit all superseded (deprecated) memories
fractal memories list --status deprecated --limit 50

# Find high-confidence lessons only (post-process confidence client-side)
fractal memories list --category lesson --limit 50

# Combine query + category for precise retrieval
fractal memories list --query "collections schema" --category architecture
```

---

## 8. Proactive Workflows

### 8.1 Read-First Protocol (Start of Every Session)

Before beginning any task, always pull active memories for context continuity:

```bash
# Step 1 — Load recent active memories
fractal memories list --limit 20

# Step 2 — Load memories scoped to the work area
fractal memories list --scopes '["src/features/[feature]/**"]' --limit 10

# Step 3 — Search for memories specific to the task topic
fractal memories list --query "<topic keywords>" --limit 10
```

> [!TIP]
> Combine these three queries at the start of any new task. They collectively restore your working context faster than re-reading source files.

---

### 8.2 Write-Proactively Protocol (End of Every Significant Action)

Never wait for the user to ask you to save something. Create memories immediately when:

| Trigger | Category | Confidence |
|---|---|---|
| A bug is fixed and root cause understood | `lesson` | `0.95` |
| An architectural pattern is established | `architecture` | `1.0` |
| User states a preference explicitly | `preference` | `1.0` |
| A CLI command behavior is discovered | `tooling` | `1.0` |
| A hard constraint is identified | `constraint` | `1.0` |
| Current work focus shifts | `context` | `0.8` |

```bash
# Example: record a lesson immediately after fixing a bug
fractal memories create \
  --title "ElectronJS IPC handlers must be registered before window load" \
  --description "If BrowserWindow.loadURL() is called before ipcMain.handle() is registered, the renderer's ipc calls silently fail" \
  --category lesson \
  --agent atlas \
  --tags '["electron", "ipc", "race-condition", "window"]' \
  --confidence 0.98
```

---

### 8.3 State Tracking Protocol (Long Tasks)

For tasks that span multiple sessions, use `context` memories to snapshot progress:

```bash
# Before pausing a task
fractal memories create \
  --title "Chat v2 refactor — paused at message streaming layer" \
  --description "Refactor of chat feature v2 is paused mid-implementation; streaming controller is half-done, procedures are complete" \
  --category context \
  --agent atlas \
  --tags '["chat", "v2", "streaming", "in-progress"]' \
  --confidence 0.9 \
  --scopes '["src/features/chat/**"]'

# On resume — search for the state snapshot
fractal memories list --category context --query "chat v2"
```

---

### 8.4 Supersede Flow (Updating Outdated Knowledge)

Because memories are **immutable**, use the supersede pattern when knowledge changes:

```
Step 1: Find the outdated memory UUID
  └── fractal memories list --query "<old knowledge>"

Step 2: Create a new memory with --supersedes pointing to the old UUID
  └── fractal memories create --supersedes '[{"id":"<old-uuid>","reason":"..."}]' ...

Step 3: System auto-deprecates the old memory
  └── (no manual forgot() needed)

Step 4: Optionally link the new memory to related knowledge
  └── --links '["<related-uuid-1>", "<related-uuid-2>"]'
```

```bash
# Example: updating a tooling memory
fractal memories create \
  --title "fractal CLI v2 uses 'fractal memories forgot' not 'fractal memories delete'" \
  --description "The CLI command to deprecate memories changed from 'delete' to 'forgot' in v2; 'delete' no longer exists" \
  --category tooling \
  --agent atlas \
  --tags '["fractal", "cli", "memories", "v2"]' \
  --supersedes '[{"id":"prev-uuid-about-delete-command","reason":"Command renamed to forgot in v2"}]'
```

---

## 9. Knowledge Graph

Memories can reference each other via the `links` field (UUID array). This enables graph traversal for related knowledge clusters.

```bash
# When creating a memory, link to related memories
fractal memories create \
  --title "Igniter.js controller pattern" \
  --description "..." \
  --category architecture \
  --agent atlas \
  --tags '["igniter", "controller"]' \
  --links '["uuid-of-procedure-pattern", "uuid-of-error-handling-pattern"]'
```

Use `fractal memories get <uuid>` to retrieve a memory's `links` array, then recursively fetch related memories for deep context loading.

---

## 10. Error Reference

| Error Code | HTTP | Cause | Resolution |
|---|---|---|---|
| `MEMORY_NOT_FOUND` | 404 | UUID does not exist for agent | Verify UUID from `list`; check `--status deprecated` |
| `MEMORY_AGENT_REQUIRED` | 400 | `FRACTAL_AGENT_ID` not set | Set env var before running CLI |
| `MEMORY_ALREADY_DEPRECATED` | 400 | `forgot` called on already-deprecated memory | No-op; memory is already inactive |

---

## 11. Best Practices Checklist

### Writing Memories

- [ ] **Title is a self-contained statement** — not a vague label. `"Zod v3 parse() is deprecated"` not `"Zod note"`.
- [ ] **Description is a full retrieval sentence** — written so a search engine can surface it by topic. Front-load the most important keywords.
- [ ] **Tags use consistent lowercase taxonomy** — reuse existing tag terms rather than inventing new ones each time.
- [ ] **Category matches the knowledge type** — architectural patterns → `architecture`; gotchas from bugs → `lesson`.
- [ ] **Scopes are set for feature-specific knowledge** — prevents cross-feature noise in retrieval.
- [ ] **Confidence is honest** — use `0.7–0.9` for inferred or partially verified knowledge; `1.0` only for confirmed facts.
- [ ] **Never create a memory for transient state** — (e.g., a build is running) unless tracking a long task pause.

### Updating Knowledge

- [ ] **Never edit a memory file directly** — always use the supersede pattern.
- [ ] **Always provide a reason in `--supersedes`** — future agents need to understand why the old knowledge was invalidated.
- [ ] **Link new memories to their predecessors** — even after superseding, `--links` to the deprecated UUID preserves the audit chain.
- [ ] **Check for existing memories before creating** — run `list --query` first to avoid duplicates.

### Reading Memories

- [ ] **Always start a session with `list --limit 20`** — restore context before any action.
- [ ] **Use `--category` to focus** — broad queries without category return noisy results.
- [ ] **Remember default limit is 10** — pass `--limit` explicitly when auditing.
- [ ] **Use `--status deprecated` to audit superseded knowledge** — useful when debugging why something changed.

---

## 12. Quick Reference Card

```bash
# --- READ ---
fractal memories list                          # active memories (limit 10)
fractal memories list --limit 50               # broader scan
fractal memories list --query "zod schema"     # fuzzy search
fractal memories list --category architecture  # by category
fractal memories list --status deprecated      # audit old knowledge
fractal memories get <uuid>                    # full record by UUID

# --- WRITE ---
fractal memories create \
  --title "..." \
  --description "..." \
  --category architecture \
  --agent atlas \
  --tags '["tag1","tag2"]'

# --- SUPERSEDE (update knowledge) ---
fractal memories create \
  --title "Updated: ..." \
  --description "..." \
  --category architecture \
  --agent atlas \
  --tags '["..."]' \
  --supersedes '[{"id":"<old-uuid>","reason":"Why old knowledge is wrong"}]'

# --- DEPRECATE (standalone) ---
fractal memories forgot <uuid> --reason "No longer valid because..."
```

---

*Last updated: 2026-05-20 | Fractal OS Memory Capability Reference v1.0*
