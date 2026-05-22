# Templates — Fractal OS Reference Guide

> **Audience:** AI agents operating inside Fractal OS.  
> **Purpose:** Complete operational reference for the Templates capability — creation, rendering, validation, and proactive use.

---

## 1. What Are Templates?

Templates are reusable, parameterized text blueprints stored inside the Fractal workspace. They combine **Handlebars** for dynamic content, **AJV JSON Schema** for input validation, and an optional **auto-write** step that places the rendered output directly on disk. Every template is a plain Markdown file whose body is the template content; metadata lives in the collection record.

Templates serve two audiences:
- **Agents** — discover and render templates to scaffold code, specs, docs, or mocks without re-inventing boilerplate.
- **Humans** — define reusable conventions once, let agents apply them consistently.

---

## 2. Architecture Overview

```
Agent / CLI call
      │
      ▼
┌─────────────────────────────────────────────────────────────┐
│                  TemplateService.render()                    │
│                                                             │
│  1. Fetch template by ID          (throws TEMPLATE_NOT_FOUND)│
│  2. AJV Validation (if schema)    (throws TEMPLATE_VALIDATION_ERROR) │
│  3. Handlebars.compile(content)(data)                       │
│  4. Resolve output path (priority: arg > template > null)   │
│  5. Dynamic path: compile path with Handlebars if {{…}}     │
│  6. Resolve relative path → workspace.config.path           │
│  7. fs.mkdir (recursive) + fs.writeFile                     │
│  8. Return { content, output, filename, extension }         │
└─────────────────────────────────────────────────────────────┘
      │
      ▼
 Rendered file on disk  OR  content returned (console only)
```

### Storage Layout

```
.fractal/
├── templates/
│   └── {id}.template.md          ← Global templates
└── skills/
    └── {skill}/
        └── templates/
            └── {id}.template.md  ← Skill-bound templates
```

> **Rule:** `content` is the Markdown **body** of the `.template.md` file — never frontmatter. The `id` is derived from the filename (strip `.template.md`).

---

## 3. Schema Field Reference

| Field | Type | Required | Immutable | Description |
|-------|------|----------|-----------|-------------|
| `id` | `string` | auto | ✅ YES | Slug generated from `name` via `Slug.generate(name)`. **Never changes.** Rename = delete + recreate. |
| `name` | `string` | ✅ | — | Unique display name / slug used to derive the initial `id`. |
| `skill` | `string \| null` | — | — | Skill ID that owns this template. `null` = global template, available workspace-wide. |
| `description` | `string` | ✅ | — | Human + agent-readable purpose. Include **when** and **how** to use. Drives agent discoverability. |
| `output` | `string \| null` | — | — | Default output path. Supports Handlebars (e.g. `src/features/{{domain}}/procedures/{{domain}}.procedure.ts`). |
| `schema` | `any \| null` | — | — | JSON Schema object (or stringified JSON) used by AJV to validate render `data`. |
| `content` | `string \| null` | — | — | Raw Handlebars template body. On update, this is a **full replacement** — not a patch. |

> **Performance note:** `list()` omits `schema` and `content`. Always call `getById(<id>)` before rendering.

---

## 4. CLI Commands

### 4.1 List Templates

```bash
# All templates
fractal templates list

# Filter by skill
fractal templates list --skill igniter-feature

# Search by name or description
fractal templates list --query "procedure"

# Filter by rule/tag
fractal templates list --byRule backend
```

### 4.2 Get a Template (full, with content + schema)

```bash
fractal templates get feature-procedure
```

### 4.3 Render a Template

```bash
# Render to default output path (defined on the template)
fractal templates render feature-procedure \
  --data '{"domain":"chat","entity":"Message"}'

# Override output path at render time
fractal templates render feature-procedure \
  --output "src/features/chat/procedures/chat.procedure.ts" \
  --data '{"domain":"chat","entity":"Message"}'

# Render to console only (no --output, no template.output)
fractal templates render email-subject \
  --data '{"userName":"Felipe","plan":"Pro"}'
```

### 4.4 Create a Template

```bash
fractal templates create \
  --name "feature-procedure" \
  --description "Scaffolds an Igniter.js procedure file for a new feature domain. Use when bootstrapping a bounded context." \
  --output "src/features/{{domain}}/procedures/{{domain}}.procedure.ts" \
  --schema '{"type":"object","properties":{"domain":{"type":"string"}},"required":["domain"]}' \
  --content "$(cat ./my-template.md)" \
  --skill igniter-feature
```

### 4.5 Update a Template

```bash
# Update description and output path
fractal templates update feature-procedure \
  --description "Updated: Scaffolds Igniter.js procedure with context injection." \
  --output "src/features/{{domain}}/procedures/{{domain}}.procedure.ts"

# Replace content entirely (full replacement — not a patch)
fractal templates update feature-procedure \
  --content "$(cat ./updated-template.md)"

# Move to a different skill
fractal templates update feature-procedure \
  --skill igniter-v2
```

### 4.6 Delete a Template

```bash
# Permanent — no undo
fractal templates delete feature-procedure
```

---

## 5. Handlebars Syntax Guide

Templates use [Handlebars.js](https://handlebarsjs.com/) for interpolation. Both the `content` body and the `output` path string are compiled against the same `data` object.

### 5.1 Basic Interpolation

```handlebars
// File: src/features/{{domain}}/procedures/{{domain}}.procedure.ts

export class {{entity}}Procedure {
  static async create(ctx: IgniterContext) {
    // TODO: implement {{entity}} creation
  }
}
```

### 5.2 Conditionals

```handlebars
{{#if hasAuth}}
import { requireAuth } from '@core/guards';
{{/if}}
```

### 5.3 Iteration

```handlebars
{{#each fields}}
  - {{this.name}}: {{this.type}}
{{/each}}
```

### 5.4 Built-in Helpers

| Helper | Syntax | Output Example |
|--------|--------|----------------|
| `toLowerCase` | `{{toLowerCase domain}}` | `chat` → `chat` |

> **Only `toLowerCase` is registered.** Use it to normalize slugs.  
> Do **not** assume `toUpperCase`, `capitalize`, or other helpers exist — they are not registered.

### 5.5 Dynamic Output Paths

If the `output` field (or the `--output` flag) contains `{{`, Fractal automatically compiles it with the same data:

```
Template output: "src/features/{{domain}}/procedures/{{domain}}.procedure.ts"
Data:            { "domain": "chat" }
Resolved path:   "src/features/chat/procedures/chat.procedure.ts"
```

---

## 6. AJV Schema Validation

When a template has a `schema` defined, every `render` call validates `data` before Handlebars compilation. The AJV instance runs with `allErrors: true` and `strict: false`, plus `ajv-formats`.

### 6.1 Schema Patterns

**Required string field:**
```json
{
  "type": "object",
  "properties": {
    "domain": { "type": "string", "minLength": 1 }
  },
  "required": ["domain"]
}
```

**Optional field with default-like description:**
```json
{
  "type": "object",
  "properties": {
    "domain":      { "type": "string" },
    "entity":      { "type": "string" },
    "hasAuth":     { "type": "boolean" },
    "fields":      {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "type": { "type": "string" }
        },
        "required": ["name", "type"]
      }
    }
  },
  "required": ["domain", "entity"]
}
```

**Email format (ajv-formats):**
```json
{
  "type": "object",
  "properties": {
    "email": { "type": "string", "format": "email" }
  },
  "required": ["email"]
}
```

### 6.2 Validation Errors

When validation fails, Fractal throws `TEMPLATE_VALIDATION_ERROR` (HTTP 400) with:
- `errors` — AJV error array
- `input` — the rejected data object
- `expectedSchema` — the compiled schema

---

## 7. Output Path Patterns

| Pattern | Example | Result |
|---------|---------|--------|
| Static absolute | `/tmp/out.ts` | Written to `/tmp/out.ts` |
| Static relative | `src/out.ts` | Resolved against `workspace.config.path` |
| Dynamic relative | `src/features/{{domain}}/index.ts` | `data.domain` substituted, then resolved |
| Dynamic with helper | `src/features/{{toLowerCase domain}}/index.ts` | Lowercase substituted |
| No output | *(omit flag + no template.output)* | Content returned to console only |

**Priority chain (highest → lowest):**
```
--output flag  >  template.output field  >  null (console only)
```

---

## 8. Error Reference

| Code | HTTP | Trigger |
|------|------|---------|
| `TEMPLATE_NOT_FOUND` | 404 | Template ID does not exist |
| `TEMPLATE_ALREADY_EXISTS` | 409 | Create called with a name that maps to an existing ID |
| `TEMPLATE_VALIDATION_ERROR` | 400 | AJV schema validation failed |
| `TEMPLATE_RENDER_ERROR` | 500 | Handlebars compile/render threw an exception |

---

## 9. Proactive Workflows

### 9.1 Zero-Boilerplate Protocol

> **Trigger:** Agent is about to write a file that matches a known pattern (e.g., a new feature controller, procedure, or service).

```
1. fractal templates list --query "<pattern>"
2. If match found → fractal templates get <id>
3. fractal templates render <id> --data '<json>' [--output <path>]
4. Verify rendered file, then continue task.
```

Never hand-write boilerplate if a template exists. Always discover first.

### 9.2 Template Creation Workflow

> **Trigger:** Agent writes the same pattern ≥2 times, or user asks to "add a template."

```
1. Identify the repeating pattern and its variable parts.
2. Define the JSON Schema for all variable inputs.
3. Write the Handlebars body (include {{toLowerCase …}} for slugs).
4. Decide: global (.fractal/templates/) or skill-bound?
5. fractal templates create --name "…" --description "…" \
     --schema '<json>' --output '<dynamic-path>' --content "$(cat …)"
6. Verify with: fractal templates render <id> --data '<sample-json>'
```

### 9.3 Skill-Bound Template Protocol

> **Trigger:** A skill has domain-specific scaffolding (e.g., `igniter-feature` skill needs procedure/controller templates).

```bash
# Bind template to skill at creation
fractal templates create \
  --name "igniter-controller" \
  --skill igniter-feature \
  --description "Scaffolds controller for a new Igniter.js feature bounded context." \
  --output "src/features/{{domain}}/controllers/{{domain}}.controller.ts" \
  --schema '{"type":"object","properties":{"domain":{"type":"string"}},"required":["domain"]}' \
  --content "$(cat controller.template.md)"

# Discover skill templates
fractal templates list --skill igniter-feature
```

---

## 10. Template Type Examples

### Type A — Code Scaffold

**Use case:** Scaffolding an Igniter.js procedure file.

```handlebars
// src/features/{{toLowerCase domain}}/procedures/{{toLowerCase domain}}.procedure.ts

import { IgniterProcedure } from '@igniter-js/core';

/**
 * @description {{entity}} procedure — business logic for {{domain}} domain.
 */
export class {{entity}}Procedure extends IgniterProcedure {
  static async create(ctx: IgniterContext, input: Create{{entity}}Input) {
    // TODO: implement
  }
}
```

### Type B — Specification / Plan

**Use case:** Generating a structured task spec for Atlas to review.

```handlebars
# Task Spec: {{title}}

## Goal
{{goal}}

## Acceptance Criteria
{{#each criteria}}
- [ ] {{this}}
{{/each}}

## Affected Files
{{#each files}}
- `{{this}}`
{{/each}}
```

### Type C — Documentation

**Use case:** Auto-generating a feature README.

```handlebars
# {{entity}} Feature

> {{description}}

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
{{#each endpoints}}
| {{this.method}} | {{this.path}} | {{this.description}} |
{{/each}}
```

### Type D — Data Mock

**Use case:** Generating fixture JSON for tests.

```handlebars
{
  "id": "{{id}}",
  "name": "{{name}}",
  "email": "{{email}}",
  "createdAt": "{{createdAt}}"
}
```

---

## 11. Best Practices Checklist

```
[ ] Write a clear description: who should use this, when, and why.
[ ] Define a JSON Schema for ALL required inputs — prevents silent render errors.
[ ] Use {{toLowerCase domain}} for any value that becomes a file path or slug.
[ ] Set a dynamic output path on the template — agents should never have to guess.
[ ] Bind to a skill when the template is domain-specific; keep it global otherwise.
[ ] Verify with a dry-run render (no --output) before committing to disk writes.
[ ] Never patch content — updates are full replacements; keep source in version control.
[ ] Treat the ID as immutable; document renames as delete + recreate in task comments.
[ ] list() is for discovery only; always call getById() before rendering.
[ ] Use allErrors-aware schemas — AJV reports ALL failures, not just the first.
```

---

## 12. Quick-Reference Card

```bash
# Discover
fractal templates list [--skill X] [--query Y]

# Inspect (full content + schema)
fractal templates get <id>

# Render → disk
fractal templates render <id> --data '<json>'

# Render → stdout only
fractal templates render <id> --data '<json>'   # (no --output, no template.output)

# Create
fractal templates create --name X --description Y --schema Z --output P --content C [--skill S]

# Update (content = full replacement)
fractal templates update <id> [--description] [--output] [--content] [--schema] [--skill]

# Delete (permanent)
fractal templates delete <id>
```
