# Working with Agents in Fractal

This guide explains how to create, configure, and orchestrate AI agents within Fractal OS. Agents are the execution units of the system — each one is a specialized AI worker with its own identity, capabilities, model configuration, and optional leadership hierarchy.

> **📚 Deep Dive:** [Discovery: Agents](../discovery/agents.md) — creative patterns, delegation strategies, and multi-agent architectures

---

## 1. Architecture Overview

```
Workspace
  │
  ├── Atlas (orchestrator: true) ← default fallback for all non-directed chats
  │     └── reports to: none
  │
  ├── Neo (agent: feature developer)
  │     └── leader: "atlas"
  │
  └── Aurora (agent: QA specialist)
        └── leader: "atlas"

Each agent:
  • Has its own .fractal/agents/{id}/agent.md file
  • Has isolated memory space (.fractal/agents/{id}/memories/)
  • Runs with a dedicated LLM provider + model
  • Is equipped with FS tools + Jobs tools + MCP server tools
  • Has full workspace context injected at runtime (skills, instructions, templates, agents, memories)
```

### Key Architectural Facts

- **Storage**: `.fractal/agents/{id}/agent.md` — YAML frontmatter (metadata) + Markdown body (`content` = system instructions)
- **ID generation**: `Slug.generate(name)` — auto-derived slug, immutable after creation
- **Orchestrator singleton**: Only ONE agent can have `orchestrator: true` — enforced globally
- **`content` is the system prompt**: The Markdown body of the `.md` file IS the agent's system instructions
- **Agent scope**: Agents can be bound to a specific `skill` or operate workspace-wide (null skill)

---

## 2. Agent Schema Reference

| Field | Type | Required | Default | Description |
|---|---|---|---|---|
| `id` | `string` (slug) | Auto | `Slug.generate(name)` | Unique identifier. IMMUTABLE after creation. |
| `name` | `string` | ✅ | — | Human-readable name (e.g., "Neo", "Aurora") |
| `description` | `string` | ❌ | — | CRITICAL: Tells the orchestrator WHEN to route tasks to this agent |
| `skill` | `string \| null` | ❌ | `null` | Skill ID binding — constrains agent to a domain. Pass `""` to unbind. |
| `role` | `string` | ❌ | — | Job title label (e.g., "Quality Assurance Specialist") |
| `leader` | `string` | ❌ | — | ID of the agent this agent reports to |
| `content` | `string` | ❌ | — | Markdown system instructions — stored as .md file body |
| `provider` | `string` | ❌ | config default | LLM provider slug (e.g., "openai", "google", "gemini") |
| `model` | `string` | ❌ | config default | LLM model. Supports `"Model (provider)"` combined format. |
| `channels` | `[{provider, data}][]` | ❌ | — | Communication channel configs (e.g., Telegram) |
| `orchestrator` | `boolean` | ❌ | `false` | Workspace-level fallback. Only one can be `true`. |

---

## 3. CLI Commands

### `fractal agents list` — List All Agents

```bash
fractal agents list
```

Returns all agents. The `content` field (system instructions) is excluded for performance — only returned by `get`.

### `fractal agents get <agent>` — Get Agent Details

```bash
fractal agents get atlas
fractal agents get neo
```

Returns full agent record including `content` (system instructions), `leader`, `skill`, `provider`, and `model`.

### `fractal agents create` — Create a New Agent

```bash
fractal agents create \
  --name "Aurora" \
  --role "Quality Assurance Specialist" \
  --description "Specialized in code review, test coverage analysis, and quality gate enforcement. Call me for all QA-related tasks." \
  --leader "atlas" \
  --provider "openai" \
  --model "gpt-4o" \
  --skill "qa-specialist" \
  --content "# Identity\n\nYou are Aurora, a meticulous QA specialist...\n\n## Responsibilities\n- Review all code changes for correctness\n- Enforce test coverage standards\n- Identify edge cases and failure modes"
```

**All flags:**

| Flag | Alias | Required | Description |
|---|---|---|---|
| `--name` | `-n` | ✅ | Human-readable name |
| `--content` | `-c` | ❌ | Markdown system instructions |
| `--description` | `-d` | ❌ | For orchestrator routing (critical!) |
| `--role` | — | ❌ | Job title label |
| `--leader` | — | ❌ | Leader agent slug ID |
| `--provider` | — | ❌ | LLM provider slug |
| `--model` | — | ❌ | LLM model (supports "Model (provider)" format) |
| `--skill` | — | ❌ | Skill ID binding |
| `--orchestrator` | — | ❌ | Mark as workspace orchestrator (boolean) |
| `--channels` | — | ❌ | Communication channels config array |

### `fractal agents update <agent>` — Update an Agent

```bash
# Update system instructions
fractal agents update atlas \
  --content "# Identity\n\nYou are Atlas, updated system instructions..."

# Change the assigned model
fractal agents update neo \
  --provider "google" \
  --model "gemini-2.5-pro-preview"

# Set as orchestrator (clears previous orchestrator)
fractal agents update aurora --orchestrator true

# Unbind from a skill
fractal agents update aurora --skill ""

# Change leader
fractal agents update neo --leader "aurora"
```

> **CRITICAL:** `--content` REPLACES the entire system instructions. There is no patch/merge — always provide the full instruction set when updating content.

### `fractal agents delete <agent>` — Delete an Agent

```bash
fractal agents delete aurora
```

**DESTRUCTIVE — no undo.** Requires explicit user authorization.

---

## 4. Provider & Model Selection

### Standard Configuration

```bash
# Explicit provider + model
fractal agents create --name "Neo" --provider "openai" --model "gpt-4o"

# Google provider
fractal agents create --name "Gemini" --provider "google" --model "gemini-2.5-pro-preview"
```

### Combined Format (for VS Code compatibility)

The `model` field supports a `"Model (provider)"` string format that encodes both:

```bash
# This string is automatically parsed: model="Gemini 2.5 Pro", provider="gemini"
fractal agents update neo --model "Gemini 2.5 Pro (gemini)"
```

### Provider Resolution Priority

```
1. agent.model + agent.provider (both explicitly set)
2. model contains "(provider)" suffix → auto-extracts provider
3. model set, no provider → scans config.agents.providers.connections for match
4. neither set → uses config.agents.providers.default
5. no model → first model in provider's config, fallback "gpt-4o"
```

---

## 5. Orchestrator Role

The orchestrator is the **master fallback agent** — it handles any chat that doesn't explicitly `@mention` a specific agent.

### Setting an Orchestrator

```bash
fractal agents update atlas --orchestrator true
```

**What happens:**
1. System scans all agents and sets `orchestrator: false` on all of them
2. Sets `orchestrator: true` on the specified agent
3. Only ONE orchestrator exists at a time — this is enforced at the storage level

### Default Atlas Orchestrator

Every new workspace automatically creates an `atlas` agent with `orchestrator: true`. This is the entry point for all agent interactions in a fresh workspace.

---

## 6. Leader Hierarchy

Agents form a reporting tree via the `leader` field:

```
atlas (orchestrator: true)
  ├── neo     (leader: "atlas") ← Feature Developer
  ├── aurora  (leader: "atlas") ← QA Specialist
  │     └── prism (leader: "aurora") ← Test Writer
  └── iris    (leader: "atlas") ← Documentation Agent
```

### How Hierarchy Affects Runtime

At agent runtime, the system prompt automatically injects:

**For agents WITH a leader:**
```xml
<leadership>
  <reports_to>atlas</reports_to>
  <description>Information about your superior. Escalate critical blockers to your leader.</description>
</leadership>
```

**For agents WITH sub-agents reporting to them:**
```xml
<team>
  <member id="neo" name="Neo" role="Feature Developer" />
  <member id="aurora" name="Aurora" role="QA Specialist" />
</team>
```

This makes every agent awareness-aware of its organizational position without manual configuration.

### Setting Up Hierarchy

```bash
# Create sub-agents with leader relationship
fractal agents create --name "Prism" \
  --role "Test Coverage Specialist" \
  --description "Specialized in writing unit and integration tests. Reports to Aurora for QA coordination." \
  --leader "aurora" \
  --model "gpt-4o-mini"
```

---

## 7. Skill Association

The `skill` field binds an agent to a specific bounded domain:

```bash
# Bind to a skill domain
fractal agents create --name "Collector" \
  --skill "data-pipeline" \
  --description "Specialized in data collection and pipeline management for the data-pipeline skill domain."

# Check what skills exist
fractal skills list

# Unbind from skill (workspace-wide scope)
fractal agents update collector --skill ""
```

When `skill` is set:
- The agent's system prompt includes only that skill's templates, instructions, and views
- The agent is constrained to its bounded context

When `skill` is null/empty:
- The agent operates across the entire workspace
- Gets ALL workspace skills, instructions, templates, views in context

---

## 8. System Prompt Structure

Every agent runtime builds a structured XML prompt with these sections injected automatically:

| Section | Content |
|---|---|
| `system_instructions` | Base Fractal OS protocol from `base.prompt.ts` |
| `identity` | Agent id, name, role |
| `instructions` | Agent's custom `content` field |
| `user` | Authenticated user info (name, email, shell, homedir) |
| `context` | Current datetime + last 5 active memories |
| `environment` | Platform, arch, nodeVersion, cwd, hostname |
| `workspace` | Workspace id, name, path |
| `skills` | All workspace skills |
| `views` | All workspace views |
| `collections` | All custom collections |
| `instructions` | All active workspace instructions/rules |
| `templates` | All workspace templates |
| `agents` | All registered agents (delegation awareness) |
| `leadership` | Who this agent reports to (if `leader` is set) |
| `team` | Sub-agents reporting to this agent (if any) |

---

## 9. Native Agent Tools

Every agent runtime is equipped with:

### FS Toolset (sandbox-enforced)
- `Read` — read file contents within sandbox root
- `Write` — write/overwrite files within sandbox root
- `Edit` — surgical edits to existing files
- `Glob` — pattern-based file discovery
- `Grep` — regex/text search across files
- `Bash` — shell command execution (blocked: rm, rmdir, format, dd, shutdown, etc.)

### Jobs Toolset
- `JobList` — list running background jobs
- `JobOutput` — stream output from a job
- `JobStop` — terminate a running job
- `JobWait` — block until a job completes

### MCP Tools
- Fractal CLI launched as MCP server via stdio (`--mcp` flag)
- All Fractal CLI commands exposed as tools (snake_case → PascalCase)
- Examples: `FractalMemoriesCreate`, `FractalTasksSetStatus`, `FractalTemplatesRender`

---

## 10. The `_reasoning` Field

Every tool call an agent makes **automatically includes a `_reasoning: string` field** injected into the tool schema. This enforces explainability:

```json
{
  "_reasoning": "I am reading this file to understand the current schema before modifying it, ensuring I don't break existing field definitions.",
  "path": "src/features/auth/auth.interfaces.ts"
}
```

Agents must provide a clear, concise `_reasoning` for every tool call. This is enforced at the schema level — missing reasoning is treated as a malformed tool call.

---

## 11. Error Reference

| Error Code | HTTP | Cause | Resolution |
|---|---|---|---|
| `AGENT_NOT_FOUND` | 404 | Agent slug does not exist | Run `fractal agents list` to verify |
| `AGENT_ALREADY_EXISTS` | 409 | Slug collision on create | Choose a different name |
| `AGENT_INVALID_DATA` | 400 | Schema validation failure | Check field types and required fields |
| `AGENT_PERSISTENCE_ERROR` | 500 | Storage write failure | Check disk permissions |
| `AGENT_ID_REQUIRED` | 400 | Missing agent ID on update | Pass `--agent <slug>` explicitly |

---

## 12. Proactive Workflows

### A. Spinning Up a Specialized Team

```bash
# 1. Atlas (auto-created as orchestrator on workspace creation)

# 2. Create a feature developer
fractal agents create \
  --name "Neo" \
  --role "Full-Stack Feature Developer" \
  --description "Specialized in implementing features end-to-end following Igniter.js Clean Architecture. Call me for all feature development tasks." \
  --leader "atlas" \
  --model "claude-3-5-sonnet-20241022 (anthropic)"

# 3. Create a QA specialist
fractal agents create \
  --name "Aurora" \
  --role "Quality Assurance Engineer" \
  --description "Expert in test coverage, code review, and quality gates. Call me when code needs review before in_review transition." \
  --leader "atlas" \
  --model "gpt-4o"

# 4. Create a documentation agent
fractal agents create \
  --name "Iris" \
  --role "Technical Documentation Writer" \
  --description "Specialized in TSDoc, README generation, and AGENTS.md maintenance. Call me for all documentation tasks." \
  --leader "atlas" \
  --model "gpt-4o-mini"
```

### B. Updating Agent Instructions

```bash
# Step 1: Read current instructions
fractal agents get neo

# Step 2: Compose updated instructions (include full content)
fractal agents update neo \
  --content "# Identity\n\nYou are Neo, Fractal's senior feature developer...\n\n## Core Responsibilities\n- Implement features following Igniter.js Clean Architecture\n- Schema → Procedure → Controller order\n- Always run tsc --noEmit after changes\n\n## Updated Rules\n- Use Zod v4 API (.int() not .integer())\n- Never use z.any()"
```

### C. Proactive Agent Suggestion

When you identify a need for a specialized agent:

```bash
fractal tasks create \
  --name "Create Security Audit Agent for API endpoint review" \
  --type feature \
  --priority high \
  --status suggestion \
  --summary "We need a specialized security agent that reviews all new endpoints for auth vulnerabilities, injection risks, and rate limiting compliance."
```

---

## 13. Best Practices

- ✅ **Write a clear `description`** — it's how the orchestrator decides when to delegate to this agent
- ✅ **Set `leader`** for all non-orchestrator agents — hierarchy enables structured delegation
- ✅ **Use `skill` binding** to constrain specialized agents to their domain
- ✅ **Specific `model` per agent** — use capable models for complex agents, lightweight for simple ones
- ✅ **Update `content` proactively** — when you discover new conventions or constraints, update the agent's instructions
- ❌ **Don't create too many orchestrators** — only one can be active; use hierarchy instead
- ❌ **Don't leave `description` empty** — without it, the orchestrator won't know when to delegate
- ❌ **Don't share system instructions between agents** — each agent should have a unique, focused identity
