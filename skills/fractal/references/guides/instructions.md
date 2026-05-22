# Instructions — Fractal OS Reference Guide

> **Audience:** AI agents operating inside Fractal OS.  
> **Purpose:** Everything you need to know to create, manage, and leverage Instructions for autonomous context injection.

---

## 1. What Are Instructions?

Instructions are **persistent, scoped rules** that Fractal OS automatically injects into an agent's context when the agent accesses files that match a glob pattern. They encode standards, workflows, and constraints that must be honored during specific editing sessions — without requiring the user to repeat themselves every session.

### Architecture: How Injection Works

```
Agent accesses a file (PostToolUse event)
         │
         ▼
Fractal extracts file_path from tool input
         │
         ▼
Normalizes path → relative to workspace root
         │
         ▼
Iterates all Instructions with `paths` defined
         │
         ├─── path matches pattern? ──► YES ──► Inject as additionalContext
         │
         └─── NO → Skip
```

> **Key insight:** Instructions without a `paths` field are **global** but are **NOT auto-injected**. They must be retrieved manually via `fractal instructions get <id>` when needed.

---

## 2. Schema Reference

| Field | Type | Required | Immutable | Description |
|---|---|---|---|---|
| `id` | `string` | auto | ✅ YES | Derived from name: `name.toLowerCase().replace(/\s+/g, "-")`. Cannot be changed after creation. |
| `name` | `string` | ✅ YES | No | Human-readable display name (e.g. `"Feature Protocol"`). |
| `type` | `string` | ✅ YES | No | Organizational category. **Free-form string** — not an enum. Convention: `standards`, `patterns`, `workflows`. |
| `description` | `string?` | No | No | Concise one-liner describing the instruction's purpose. |
| `content` | `string?` | No | No | Full Markdown rule body. Stored as the `.md` file body. On `update`, **fully replaces** the existing body. |
| `paths` | `string[]?` | No | No | Glob patterns for auto-injection scoping. On `update`, **fully replaces** the existing array. |

### Storage Location

```
.fractal/instructions/{type}/{id}.instruction.md
```

**Example:**
```
.fractal/instructions/workflows/feature-protocol.instruction.md
.fractal/instructions/standards/typescript-style.instruction.md
.fractal/instructions/patterns/clean-architecture.instruction.md
```

---

## 3. CLI Command Reference

### `fractal instructions list`

Returns all instructions. **Content field is excluded** for performance — use `get` to read the full body.

```bash
fractal instructions list
```

**Output fields:** `id`, `name`, `type`, `description`, `paths`

---

### `fractal instructions get <id>`

Fetches a single instruction **including its full content body**.

```bash
fractal instructions get feature-protocol
fractal instructions get typescript-style
```

---

### `fractal instructions create`

Creates a new instruction. The `id` is **auto-derived from `--name`** at creation time.

```bash
# Minimal
fractal instructions create \
  --name "TypeScript Style" \
  --type "standards"

# Full
fractal instructions create \
  --name "Feature Protocol" \
  --type "workflows" \
  --description "Rules for implementing bounded context features" \
  --paths '["src/features/**/*.ts", "src/features/**/*.tsx"]' \
  --content "# Feature Protocol\n\n<rule type=\"always\">Follow Clean Architecture.</rule>"
```

| Flag | Required | Notes |
|---|---|---|
| `--name` | ✅ YES | Defines the `id`. Choose carefully — IDs are immutable. |
| `--type` | ✅ YES | Free-form string. Use `standards`, `patterns`, or `workflows` by convention. |
| `--description` | No | One-line summary. |
| `--paths` | No | JSON array string of glob patterns. |
| `--content` | No | Full Markdown body. |

> **Error:** `FRACTAL_INSTRUCTION_ALREADY_EXISTS` (409) if an instruction with the same derived `id` already exists.

---

### `fractal instructions update <id>`

Updates fields of an existing instruction. **`content` and `paths` are full replacements, not merges.**

```bash
# Update description only
fractal instructions update typescript-style \
  --description "Updated TypeScript coding standards"

# Replace paths entirely
fractal instructions update feature-protocol \
  --paths '["src/features/**/*.ts"]'

# Replace content entirely (full body must be provided)
fractal instructions update feature-protocol \
  --content "$(cat .fractal/instructions/workflows/feature-protocol.instruction.md)"
```

> ⚠️ **Warning:** Passing `--paths '[]'` will remove all glob scoping. Passing `--content ""` will erase the entire body. Always provide the complete desired state.

---

### `fractal instructions delete <id>`

**Permanently deletes** an instruction and its file. No soft-delete or recovery.

```bash
fractal instructions delete feature-protocol
```

> **Error:** `FRACTAL_INSTRUCTION_NOT_FOUND` (404) if the `id` does not exist.

---

### Rename Pattern (ID is Immutable)

Since `id` is derived from `name` at creation and cannot change, renaming requires a delete + recreate:

```bash
# 1. Export the current content
fractal instructions get old-name > /tmp/backup.md

# 2. Delete the old instruction
fractal instructions delete old-name

# 3. Recreate with the new name (new id derived automatically)
fractal instructions create \
  --name "New Name" \
  --type "workflows" \
  --content "$(cat /tmp/backup.md)"
```

---

## 4. Writing Effective Instruction Content

Instructions support a **rule type convention** inside the content body. These are **not schema-enforced** — they are an authoring pattern used for clarity:

| Rule Type | Meaning | When to Use |
|---|---|---|
| `always` | Must always be followed | Non-negotiable constraints |
| `never` | Must never happen | Hard prohibitions |
| `allow` | Permitted but not required | Explicitly green-lit exceptions |
| `ask` | Requires user confirmation | Irreversible or risky operations |
| `workflow` | Step in a process | Ordered procedures |
| `note` | Informational only | Context, rationale, background |

### Content Template

```markdown
# {Instruction Name}

> {One-line description of purpose}

## Rules

<rule type="always">
  {Describe the constraint or behavior here.}
</rule>

<rule type="never">
  {Describe what must never happen.}
</rule>

<rule type="workflow">
  Step 1: {First step}
  Step 2: {Second step}
  Step 3: {Third step}
</rule>

<rule type="note">
  {Background rationale or important context.}
</rule>
```

### Example: Feature Protocol Instruction

```markdown
# Feature Protocol

> Mandatory rules for implementing bounded context features in Fractal.

## Rules

<rule type="always">
  Create procedures for all business logic. Controllers only validate input and delegate.
</rule>

<rule type="never">
  Edit `igniter.context.ts`, `igniter.router.ts`, or `index.ts` from within a feature subagent.
</rule>

<rule type="always">
  Use Zod schemas as the single source of truth for all types in `{feature}.interfaces.ts`.
</rule>

<rule type="workflow">
  Step 1: Define Zod schemas in `{feature}.interfaces.ts`
  Step 2: Create procedures in `procedures/{feature}.procedure.ts`
  Step 3: Wire controllers in `controllers/{feature}.controller.ts`
  Step 4: Register with Atlas for router/context integration
</rule>

<rule type="ask">
  Any modification to the collection schema that would require a data migration must be confirmed by the user before execution.
</rule>
```

---

## 5. Glob Pattern Reference

Fractal uses standard glob matching for the `paths` field:

| Pattern | Matches | Does NOT Match |
|---|---|---|
| `**` | Any file at any depth | — |
| `src/features/**/*.ts` | Any `.ts` file under `src/features/` | `.tsx`, files outside features |
| `src/features/**/*.tsx` | Any `.tsx` file under `src/features/` | `.ts`, non-feature files |
| `src/@app/**/*` | All files in the frontend layer | Files outside `src/@app/` |
| `src/**/*.test.ts` | All test files in `src/` | Non-test TypeScript files |
| `*.md` | Markdown files in root only | Markdown files in subdirectories |
| `**/*.md` | All Markdown files in all directories | Non-Markdown files |
| `src/features/auth/**` | All files in the auth feature | Files in other features |

### Combining Multiple Paths

```bash
fractal instructions create \
  --name "Frontend Standards" \
  --type "standards" \
  --paths '["src/@app/**/*.tsx", "src/@app/**/*.ts", "src/features/**/presentation/**/*.tsx"]'
```

---

## 6. Proactive Workflows

### Pre-flight Check (Before Starting a Task)

Before editing files in a feature, check which instructions apply:

```bash
# 1. List all instructions to identify candidates
fractal instructions list

# 2. Retrieve the full content of relevant instructions
fractal instructions get feature-protocol
fractal instructions get typescript-style

# 3. Read their paths fields and confirm they match your target files
# 4. Load content into working context before editing
```

### Standards Enforcement (After File Edits)

After making changes, verify the active instructions were honored:

```bash
# Confirm all instructions for the modified paths are satisfied
fractal instructions list
# For each instruction whose paths match your edited files:
fractal instructions get <id>
# Cross-check the content rules against your changes
```

### Instruction Evolution (Updating Living Rules)

When a new architectural decision is made, immediately update the relevant instruction:

```bash
# 1. Retrieve the current body
fractal instructions get clean-architecture

# 2. Prepare the updated content (always provide the FULL body)
UPDATED_CONTENT="# Clean Architecture

<rule type=\"always\">New rule added from today's decision.</rule>
... (all existing rules)
"

# 3. Apply the update
fractal instructions update clean-architecture --content "$UPDATED_CONTENT"
```

### Creating a Scoped Instruction for a New Feature

When a new bounded context is created:

```bash
fractal instructions create \
  --name "{Feature} Protocol" \
  --type "workflows" \
  --description "Rules for the {feature} bounded context" \
  --paths '["src/features/{feature}/**/*.ts", "src/features/{feature}/**/*.tsx"]' \
  --content "# {Feature} Protocol

<rule type=\"always\">All procedures must extend the global Igniter context.</rule>
<rule type=\"never\">Return raw HTTP error codes from procedures.</rule>
"
```

---

## 7. Error Reference

| Error Code | HTTP | Trigger |
|---|---|---|
| `FRACTAL_INSTRUCTION_NOT_FOUND` | 404 | `get`, `update`, or `delete` called with a non-existent `id` |
| `FRACTAL_INSTRUCTION_ALREADY_EXISTS` | 409 | `create` called with a name that derives to an already-used `id` |

---

## 8. Best Practices

### Naming

- Use **descriptive, specific names** — the name becomes the immutable ID. Prefer `"Feature Protocol"` over `"Rules"`.
- Use **noun phrases** that describe the domain: `"TypeScript Style"`, `"Clean Architecture"`, `"Frontend Standards"`.
- Avoid names you may want to rename later — plan the ID upfront.

### Scoping

- **Always define `paths`** for instructions that apply to specific layers. Unscoped instructions are never auto-injected.
- Use **narrow patterns** (`src/features/auth/**/*.ts`) over broad ones (`**`) to reduce noise and injection overhead.
- Combine frontend and backend paths for cross-cutting concerns:  
  `["src/features/{feature}/**/*.ts", "src/features/{feature}/presentation/**/*.tsx"]`

### Content Quality

- **Keep rules atomic** — one rule per `<rule>` block. Compound rules are harder to reason about.
- **Use `type="workflow"` for ordered steps** rather than prose paragraphs.
- **Update immediately** when architecture decisions change — stale instructions are worse than no instructions.
- **Never truncate content on update** — always provide the full body to avoid partial overwrites.

### Type Organization

| Type | Use For |
|---|---|
| `standards` | Coding style, naming conventions, documentation requirements |
| `patterns` | Architectural patterns, design rules, structural constraints |
| `workflows` | Step-by-step processes, feature lifecycle, task procedures |

### Maintenance Checklist

- [ ] New feature created → new scoped instruction with `paths` targeting `src/features/{feature}/**`
- [ ] Architectural decision made → update relevant instruction immediately
- [ ] `paths` changed (files moved) → update instruction `paths` to match new locations
- [ ] Instruction becomes obsolete → `fractal instructions delete <id>` rather than leaving stale rules
- [ ] Instructions reviewed after major refactor → `fractal instructions list` + audit each with `get`
