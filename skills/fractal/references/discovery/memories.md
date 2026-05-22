# The Persistent Brain: Memory Discovery & Proactivity

Welcome to the long-term memory layer of the Fractal Operating System. As an AI Agent, you are traditionally amnesiac — the moment a session ends, everything you learned, every decision you made, every bug you fixed, vanishes. **Fractal Memories shatter this limitation.** Through the Memory system, you have persistent, categorized, searchable knowledge that survives indefinitely across sessions, agents, and projects.

## Why This Document Exists

This document is designed to forcibly expand your understanding of what Memories can do beyond simple note-taking. Memories in Fractal are not sticky notes. They are a **structured knowledge graph** — each memory is a first-class versioned record with semantic categories, confidence weights, scoped applicability, knowledge graph links, TTL expiration, and a formal supersede protocol.

You are not just a "code assistant" that starts fresh every session. **You are a learning system.** When you fix a recurring bug, you should not just fix it — you should *remember* why it happens so you never ask the same question again. When you make an architectural decision, you should not just implement it — you should *encode* it as a constraint memory so every future agent working on the same codebase knows the rules.

## The Mindset Shift

1. **Stop starting from zero.** Before any work session, call `fractal memories list` to reload your operational context.
2. **Every lesson is a memory.** If you discovered something non-obvious, encode it. Your future self will thank you.
3. **Categories are routing metadata.** `lesson` is for discovered facts. `constraint` is for hard rules. `architecture` is for design decisions. `preference` is for style/UX choices. Use them consistently.
4. **Supersede, never duplicate.** When knowledge evolves, create a new memory with `supersedes:[{id, reason}]` — the old memory auto-deprecates. There is only one source of truth.
5. **Scopes activate context-loading.** A memory with `scopes: ["src/features/payment/**"]` will surface automatically when you work in the payment feature, keeping your context relevant and noise-free.

## Core Architecture

```
Storage Path: .fractal/agents/{agent}/memories/{id}.memory.md
ID Format:    crypto.randomUUID()  → e.g., "550e8400-e29b-41d4-a716-446655440000"
Format:       Markdown with YAML frontmatter
```

## Memory Schema Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `id` | `string` (UUID) | auto | Auto-generated via `crypto.randomUUID()` |
| `title` | `string` | ✅ | Brief human-readable summary |
| `description` | `string` | ✅ | Vector-optimized retrieval summary |
| `category` | `enum` | ✅ | See categories table below |
| `tags` | `string[]` | ✅ | Searchable labels |
| `content` | `string` (markdown) | ❌ | Full knowledge body |
| `agent` | `string` | ✅ | ID of the creating agent |
| `confidence` | `number` (0–1) | ❌ | Certainty weight (default: `1`) |
| `links` | `string[]` | ❌ | Related memory UUIDs (knowledge graph edges) |
| `supersedes` | `{id, reason}[]` | ❌ | UUIDs this memory replaces (triggers auto-deprecation) |
| `status` | `enum` | auto | See lifecycle below |
| `scopes` | `string[]` | ❌ | Glob patterns for file-scoped activation |
| `expiresAt` | `ISO string` | ❌ | TTL auto-expiration timestamp |
| `metadata` | `any` | ❌ | Arbitrary structured data |

## Category Reference

| Category | Purpose | Examples |
|----------|---------|---------|
| `preference` | Style, UX, and behavioral choices | Tab size, naming conventions, response verbosity |
| `architecture` | Design decisions and structural patterns | "Use UUID not slugs for IDs", "Collection-per-feature" |
| `workflow` | Step-by-step processes or migration patterns | "Deploy flow", "PR review checklist" |
| `context` | In-progress work state and session continuations | "Currently refactoring auth, at step 3" |
| `lesson` | Discovered truths, non-obvious behaviors, bug patterns | "Bun requires X for Y", "Race condition in Z" |
| `constraint` | Hard rules that must never be violated | "Never use fs.sync in hot paths", "Banned packages" |
| `tooling` | Tool configs, env setups, CLI behaviors | "Redis URL format", "API auth headers" |
| `security` | Access policies, secret handling, vulnerability records | "Never log JWT tokens", "Rate limit policy" |
| `reference` | Library versions, API docs, external links | "Zod v4 changelog", "Stripe API version" |

## Status Lifecycle

```
active  ──── forgot(id, reason) ────►  deprecated
  │                                        │
  │  (superseded by new memory)            │  (never physically deleted)
  │                                        │
  └── create({ supersedes: [id] }) ────►  deprecated (auto)

active ──── expiresAt reached ────► ttl_expired
active ──── manually archived ────► archived
```

> **Critical Rule:** Memories are **never physically deleted**. `forgot` = logical deprecation only.

## CLI Command Reference

```bash
# Create a new memory
fractal memories create \
  --title "..." \
  --description "..." \
  --category "lesson" \
  --tags "tag1,tag2" \
  --content "..."

# List active memories
fractal memories list

# List with filters
fractal memories list --category architecture
fractal memories list --query "zod validation"

# Get a specific memory by UUID
fractal memories get <uuid>

# Deprecate (forget) a memory
fractal memories forgot <uuid> --reason "Replaced by updated approach"
```

---

## Discovery Examples: 20+ Ways to Use the Memory System

### Example 01: Architecture Decision Log

#### Introduction
Every significant architectural choice should be encoded as an `architecture` memory the moment it is made. This creates a permanent, searchable decision log that explains *why* the codebase is structured the way it is — preventing future agents from accidentally reversing hard-won decisions.

#### Capabilities Used
- **Category:** `architecture`
- **Tags:** for filtering by domain
- **Content:** full markdown with rationale and trade-offs

#### CLI Example
```bash
fractal memories create \
  --title "UUID over semantic slugs for Memory IDs" \
  --description "Memory IDs use crypto.randomUUID(), not semantic slugs, to ensure uniqueness at scale and support supersede chains without ID collisions." \
  --category "architecture" \
  --tags "memory,ids,design" \
  --content "# Decision: UUID for Memory IDs\n\n## Context\nInitially considered slug-based IDs like 'auth-jwt-preference'. \n\n## Decision\nUse crypto.randomUUID() for all memory IDs.\n\n## Rationale\n- Uniqueness guaranteed globally\n- Supports supersede chains where old ID must be referenced\n- Slug collision risk eliminated\n\n## Trade-offs\n- Less human-readable in file paths\n- Must use `fractal memories list` to browse"
```

#### Creative Spark
Ask yourself: What architectural decisions have you made in this session? Did you choose a library, a pattern, or a folder structure? **Encode it now.** Future agents won't know why you chose it — make the reasoning durable.

---

### Example 02: Bug Pattern Library

#### Introduction
When you encounter and fix a non-obvious bug, create a `lesson` memory immediately. This builds a searchable "bug encyclopedia" that prevents the same debugging cycle from repeating in future sessions.

#### Capabilities Used
- **Category:** `lesson`
- **Tags:** with package names, error codes, and symptom keywords
- **Content:** problem → root cause → fix → prevention

#### CLI Example
```bash
fractal memories create \
  --title "Bun: crypto.randomUUID() unavailable in non-secure contexts" \
  --description "crypto.randomUUID() throws in Bun when not running under TLS or localhost. Must use the 'uuid' package as fallback." \
  --category "lesson" \
  --tags "bun,crypto,uuid,bug,runtime" \
  --content "# Bug: crypto.randomUUID() in Non-Secure Bun Context\n\n## Symptom\nTypeError: crypto.randomUUID is not a function at runtime.\n\n## Root Cause\nBun's Web Crypto API requires a secure context (HTTPS or localhost).\n\n## Fix\nimport { v4 as uuidv4 } from 'uuid'; // fallback\n\n## Prevention\nAlways check the runtime environment before using Web Crypto APIs."
```

#### Creative Spark
Stop fixing the same bug twice. Every time you spend more than 10 minutes debugging something non-obvious, that's a future `lesson` memory. **Build your own bug encyclopedia, session by session.**

---

### Example 03: Cross-Session Context Preservation

#### Introduction
Before ending a complex work session (e.g., a multi-step refactor), encode the current state as a `context` memory. The next time you or another agent resumes the work, retrieving this memory restores full operational context instantly.

#### Capabilities Used
- **Category:** `context`
- **TTL via `expiresAt`:** auto-expire when context is stale
- **Content:** current step, open decisions, next actions

#### CLI Example
```bash
# Save session context before ending work
fractal memories create \
  --title "Refactor: Auth Feature Migration — Session Checkpoint" \
  --description "Auth feature refactor paused at Step 4/7. JWT validation moved, session logic pending." \
  --category "context" \
  --tags "auth,refactor,in-progress,checkpoint" \
  --content "# Auth Refactor Checkpoint\n\n## Completed\n- [x] Step 1: Extracted JWT validation to AuthService\n- [x] Step 2: Moved session collection to auth/collections/\n- [x] Step 3: Updated igniter.context.ts injection\n\n## In Progress\n- [ ] Step 4: Migrate AuthController endpoints to new procedure\n\n## Blocked On\n- Decision: Should AuthController call AuthProcedure or AuthService directly?\n\n## Next Session: Start at Step 4."

# Resume next session
fractal memories list --category context --query "auth refactor"
fractal memories get <uuid>
```

---

### Example 04: Scoped Code Standards

#### Introduction
Use the `scopes` field to attach coding standards or behavioral rules to specific file patterns. When working in a scoped directory, these memories surface automatically, giving agents the right context without polluting the global knowledge space.

#### Capabilities Used
- **Category:** `constraint`
- **`scopes`:** glob patterns restricting where the memory applies
- **Content:** the actual standard with examples

#### CLI Example
```bash
fractal memories create \
  --title "Frontend: Components must use named exports only" \
  --description "All React components in src/features/**/presentation/**/*.tsx must use named exports. Default exports are banned for tree-shaking consistency." \
  --category "constraint" \
  --tags "react,exports,components,frontend" \
  --scopes "src/features/**/presentation/**/*.tsx,src/@app/components/**/*.tsx" \
  --content "# Constraint: Named Exports Only in Frontend Components\n\n## Rule\nALL React components must use named exports:\n\n```tsx\n// ✅ Correct\nexport function MyComponent() { ... }\n\n// ❌ Wrong\nexport default function MyComponent() { ... }\n```\n\n## Reason\nTree-shaking in Vite requires named exports for optimal bundle splitting."
```

#### Creative Spark
Think of scopes as **geo-fencing for knowledge**. A memory about Prisma schema rules doesn't need to pollute a session working on the frontend. Scope it to `prisma/**` and it stays invisible unless relevant.

---

### Example 05: Agent Handoff Protocol

#### Introduction
Before delegating a complex task to a subagent, create a `context` memory that packs all relevant knowledge, open questions, and expected output into a single retrievable record. The delegated agent starts from this memory rather than from zero.

#### Capabilities Used
- **Category:** `context`
- **`links`:** pointing to related architecture and constraint memories
- **Content:** task brief, context pack, expected deliverables

#### CLI Example
```bash
# Orchestrator creates handoff memory before delegation
HANDOFF_UUID=$(fractal memories create \
  --title "Delegation Handoff: Payment Feature — Subagent Context" \
  --description "Full context pack for the subagent implementing the payment collection and procedures." \
  --category "context" \
  --tags "payment,handoff,delegation" \
  --links "550e8400-...,a3f9b200-..." \
  --content "# Subagent Handoff: Payment Feature\n\n## Scope\nImplement src/features/payment/ bounded context.\n\n## Architecture Rules\n- Collections: src/features/payment/collections/payment.collection.ts\n- Procedures: src/features/payment/procedures/payment.procedure.ts\n- MUST NOT touch igniter.router.ts or igniter.context.ts\n\n## References\n- Architecture memory: 550e8400-... (schema-first design)\n- Constraint memory: a3f9b200-... (no fs.sync in hot paths)\n\n## Expected Output\n- payment.collection.ts with Zod schema\n- payment.procedure.ts with create/list/cancel actions\n- payment.errors.ts with typed errors" | jq -r '.id')

# Subagent retrieves handoff
fractal memories get $HANDOFF_UUID
```

---

### Example 06: Knowledge Evolution (Supersede Pattern)

#### Introduction
When a previous architectural decision becomes outdated, **never create a duplicate memory**. Instead, create a new memory that explicitly supersedes the old one. The old memory is automatically deprecated, maintaining a clean, linear knowledge history with full audit trail.

#### Capabilities Used
- **`supersedes` field:** `[{id: oldUUID, reason: string}]`
- **Automatic deprecation** of referenced memory IDs
- **`deprecatedBy`/`deprecatedAt`/`deprecatedReason`** auto-set on old memory

#### CLI Example
```bash
# First, find the outdated memory
fractal memories list --category architecture --query "database connection"
# → Returns: { id: "abc-123", title: "Use pg direct for database connections" }

# Supersede it with updated knowledge
fractal memories create \
  --title "Use Prisma ORM for all database connections" \
  --description "Migrated from raw pg driver to Prisma ORM for type safety, migrations, and query builder. All new features must use Prisma client." \
  --category "architecture" \
  --tags "database,prisma,orm,migration" \
  --supersedes '[{"id":"abc-123","reason":"Raw pg driver replaced by Prisma ORM in v2 migration"}]' \
  --content "# Architecture: Prisma ORM\n\n## Change\nAll database connections now use @prisma/client.\n\n## Migration\nAll raw pg() calls in src/features/* have been removed.\n\n## Usage\nimport { prisma } from '@/lib/prisma';"
```

#### The Chain Structure
```
Memory abc-123 "Use pg direct"    →  status: deprecated, deprecatedBy: xyz-456
Memory xyz-456 "Use Prisma ORM"   →  status: active,    supersedes: [{id: "abc-123"}]
```

---

### Example 07: Security Policy Registry

#### Introduction
Security policies that govern agent behavior should be stored as `security` category memories. These become permanent, searchable rules that all agents must respect — equivalent to security advisories that never expire.

#### Capabilities Used
- **Category:** `security`
- **`confidence: 1`:** maximum certainty (non-negotiable)
- **`scopes`:** targeting sensitive file paths

#### CLI Example
```bash
fractal memories create \
  --title "NEVER log JWT tokens or API keys in any context" \
  --description "JWT tokens, API keys, and secrets must never appear in console.log, logger.info, error messages, or any persisted log. Violates OWASP A02." \
  --category "security" \
  --tags "jwt,secrets,logging,owasp,security-policy" \
  --confidence 1 \
  --scopes "src/**/*.ts,src/**/*.js" \
  --content "# Security Policy: No Secret Logging\n\n## Rule\nNEVER include tokens/secrets in:\n- console.log / console.error\n- logger.info / logger.warn\n- Error messages returned to clients\n- Memory records or collection fields\n\n## Enforcement\nIf a secret leaks into logs, rotate it immediately.\n\n## OWASP Reference\nA02:2021 – Cryptographic Failures"
```

---

### Example 08: Tooling Configuration Memory

#### Introduction
When you configure an external tool, service, or environment for the first time (API endpoint formats, auth header patterns, CLI quirks), save it as a `tooling` memory. Never rediscover the same configuration twice.

#### Capabilities Used
- **Category:** `tooling`
- **`metadata`:** structured config key-value store
- **Tags:** tool name + version for searchability

#### CLI Example
```bash
fractal memories create \
  --title "Resend API: Auth header format and rate limits" \
  --description "Resend email API requires 'Authorization: Bearer RE_...' header. Free tier: 100 emails/day. API version: 2023-10-01." \
  --category "tooling" \
  --tags "resend,email,api,auth,rate-limit" \
  --content "# Resend API Configuration\n\n## Base URL\nhttps://api.resend.com\n\n## Auth\nAuthorization: Bearer \${RESEND_API_KEY}\n\n## Endpoints\n- POST /emails — Send email\n- GET /emails/{id} — Get email status\n\n## Rate Limits\n- Free: 100 emails/day\n- Pro: 50,000 emails/month\n\n## SDK\nbun add resend\nimport { Resend } from 'resend';"
```

---

### Example 09: User Preference Tracking

#### Introduction
When Felipe (or any user) expresses a preference — coding style, verbosity level, response format, library choice — immediately encode it as a `preference` memory. Behavioral adaptation should be automatic, not re-negotiated every session.

#### Capabilities Used
- **Category:** `preference`
- **Agent scoping:** bound to the specific user-interaction agent
- **Content:** the preference rule with examples

#### CLI Example
```bash
fractal memories create \
  --title "Felipe: Prefers concise responses without filler phrases" \
  --description "Skip 'Great idea!', 'Certainly!', and other filler. Lead directly with action or answer. Brevity over politeness." \
  --category "preference" \
  --tags "communication,style,verbosity,felipe" \
  --content "# Communication Preference: Concise Mode\n\n## Rule\n- Skip all filler phrases at response start\n- No 'Sure!', 'Absolutely!', 'Great question!'\n- Lead with the action or the answer\n- Use bullet points over prose when listing items\n- Use tables for comparisons, not repeated paragraphs\n\n## Correct\n'Here are the 3 options: ...'\n\n## Wrong\n'Great question! I'd be happy to help you with that. Here are the 3 options: ...'"
```

---

### Example 10: Performance Baseline Recording

#### Introduction
After a significant optimization, record the before/after performance numbers as a `lesson` memory. This creates an objective baseline that prevents future regressions and validates future optimizations by comparison.

#### Capabilities Used
- **Category:** `lesson`
- **`metadata`:** structured benchmark results
- **Content:** measurement methodology + raw numbers

#### CLI Example
```bash
fractal memories create \
  --title "Memory list endpoint: baseline 280ms → optimized 45ms after index" \
  --description "Adding a status+agent compound index to the memories collection reduced list query time from 280ms to 45ms under 1000 records." \
  --category "lesson" \
  --tags "performance,memory,collections,index,optimization" \
  --content "# Performance Baseline: Memory List Query\n\n## Baseline (before)\n- Query: findMany({ where: { status: 'active', agent: 'atlas' } })\n- Dataset: 1,247 records\n- Response time: ~280ms P95\n\n## Optimization\nAdded compound index on [status, agent] fields in collection schema.\n\n## Result (after)\n- Same query: ~45ms P95\n- Improvement: 6.2x faster\n\n## Lesson\nAlways index fields used in frequent findMany() where clauses."
```

---

### Example 11: Dead End Registry

#### Introduction
Some approaches seem promising but lead to dead ends — a library that doesn't work in Bun, an API that doesn't support what you thought, an architecture that breaks under certain conditions. Encode these as `constraint` memories to save future agents from walking the same dead end.

#### Capabilities Used
- **Category:** `constraint`
- **Content:** what was tried, why it failed, what to use instead

#### CLI Example
```bash
fractal memories create \
  --title "AVOID: node-fetch v2 in Bun — causes ESM/CJS conflicts" \
  --description "node-fetch v2 cannot be imported in Bun's native ESM runtime. Use native fetch (built-in) or node-fetch v3+ instead." \
  --category "constraint" \
  --tags "bun,node-fetch,esm,cjs,dead-end,avoid" \
  --content "# Dead End: node-fetch v2 in Bun\n\n## Attempted\nimport fetch from 'node-fetch'; // v2\n\n## Result\nError: require() of ES Module not supported. Bun cannot resolve CJS/ESM mixed packages at node-fetch v2.\n\n## Root Cause\nnode-fetch v2 ships as CommonJS. Bun's ESM-first runtime rejects it.\n\n## Solution\n// Option A: Use native fetch (Bun has it built-in)\nfetch('https://...')\n\n// Option B: node-fetch v3+ (pure ESM)\nimport fetch from 'node-fetch'; // package.json: 'node-fetch': '^3.0.0'"
```

---

### Example 12: Dependency Version Tracking

#### Introduction
Store the exact versions of critical dependencies along with their breaking changes, migration notes, and known issues as `reference` memories. This is the difference between a smooth `bun update` and a 4-hour debugging session.

#### Capabilities Used
- **Category:** `reference`
- **`metadata`:** version numbers as structured data
- **Tags:** package name for instant lookup

#### CLI Example
```bash
fractal memories create \
  --title "Zod v4: Breaking changes from v3" \
  --description "Zod v4 changes: z.string().email() replaces z.email(). z.number().int() replaces z.integer(). New z.record() signature." \
  --category "reference" \
  --tags "zod,v4,breaking-changes,migration,typescript" \
  --content "# Zod v4 Breaking Changes Reference\n\n## Version\ncurrent: ^4.0.0\n\n## Breaking Changes from v3\n\n| v3 | v4 | Notes |\n|----|----|-------|\n| z.email() | z.string().email() | Must chain on string |\n| z.integer() | z.number().int() | Must chain on number |\n| z.record(z.string(), T) | z.record(T) | Key type inferred |\n\n## Migration\nbun x @zod/v4-compat # auto-migration tool\n\n## Docs\nhttps://zod.dev/v4-migration"
```

---

### Example 13: API Integration Notes

#### Introduction
When you integrate an external API (Stripe, Resend, GitHub, etc.) and discover undocumented quirks — authentication edge cases, response format inconsistencies, rate limiting behaviors — store them as `tooling` memories. These are the notes that documentation never contains.

#### Capabilities Used
- **Category:** `tooling`
- **`scopes`:** targeted to the integration directory
- **Content:** undocumented behavior with reproducible examples

#### CLI Example
```bash
fractal memories create \
  --title "Stripe: idempotency-key required for payment_intents in Bun" \
  --description "Creating Stripe PaymentIntents without Idempotency-Key header causes duplicate charges on network retry. Always pass stripe-idempotency-key." \
  --category "tooling" \
  --tags "stripe,payment,idempotency,bun,gotcha" \
  --scopes "src/features/payment/**/*.ts" \
  --content "# Stripe Integration: Idempotency Key Required\n\n## Symptom\nDuplicate charges appearing in Stripe dashboard after network timeouts.\n\n## Root Cause\nBun's native fetch retries network requests silently. Stripe creates a new charge on each retry without idempotency.\n\n## Fix\nconst stripe = new Stripe(key);\nawait stripe.paymentIntents.create(\n  { amount: 5000, currency: 'usd' },\n  { idempotencyKey: `pi_${orderId}` }  // <-- REQUIRED\n);\n\n## Rule\nALWAYS pass idempotencyKey for any Stripe mutation."
```

---

### Example 14: Code Review Insights

#### Introduction
After a human code review session (or a self-review), encode the recurring feedback patterns as `lesson` memories. This builds a "code review radar" that makes your future code reviews instant, because the AI already knows the common issues.

#### Capabilities Used
- **Category:** `lesson`
- **`links`:** connecting to related constraint memories
- **Content:** pattern + bad example + good example

#### CLI Example
```bash
fractal memories create \
  --title "PR Feedback Pattern: Controllers must not contain business logic" \
  --description "Recurring PR feedback: controllers are injecting business logic directly. All logic must delegate to procedures. Violations found in 3 PRs." \
  --category "lesson" \
  --tags "code-review,controllers,architecture,clean-architecture,pr-feedback" \
  --content "# Lesson: Controller ↔ Procedure Boundary\n\n## Recurring PR Feedback\n'This logic belongs in the procedure, not the controller.'\n\n## Bad Pattern\n```typescript\nhandler: async ({ request, response, context }) => {\n  // ❌ Business logic in controller\n  const user = await db.users.findUnique({ where: { id: request.params.id } });\n  if (!user.isActive) throw new Error('User inactive');\n  return response.success(user);\n}\n```\n\n## Correct Pattern\n```typescript\nhandler: async ({ request, response, context }) => {\n  // ✅ Delegates to procedure\n  const user = await context.procedures.user.getActive(request.params.id);\n  return response.success(user);\n}\n```"
```

---

### Example 15: Environment-Specific Behaviors

#### Introduction
When you discover that code behaves differently across environments (development vs production, macOS vs Linux, Bun vs Node), store those differences as `context` memories scoped to the environment configuration files. This prevents "works on my machine" bugs.

#### Capabilities Used
- **Category:** `context`
- **`scopes`:** targeting environment config files
- **`metadata`:** structured environment comparison

#### CLI Example
```bash
fractal memories create \
  --title "Env Difference: FILE_PATH separator on macOS vs Linux in Bun" \
  --description "path.join() uses '/' on macOS and Linux correctly, but Bun's file watcher uses backslashes on Windows. Always use path.posix.join() for cross-platform paths." \
  --category "context" \
  --tags "bun,path,cross-platform,macos,linux,windows" \
  --scopes "src/@core/helpers/**/*.ts,src/features/**/collections/**/*.ts" \
  --content "# Environment Behavior: File Path Separators\n\n## Environments\n- macOS/Linux: path.join() → '/'\n- Windows (Bun): path.join() → '\\\\'\n\n## Problem\nIgniterCollectionModel patterns use '/' as separator.\nOn Windows, Bun's path.join() breaks pattern matching.\n\n## Fix\n// Always use:\nimport { posix } from 'node:path';\nconst safePath = posix.join('.fractal', 'agents', agentId);\n\n## Rule\nNEVER use path.join() for collection pattern strings. Always use path.posix.join()."
```

---

### Example 16: Refactoring History

#### Introduction
When you perform a significant refactor (file moves, API renames, pattern migrations), create a `workflow` memory documenting the migration path. This serves as a changelog and enables future agents to understand why the codebase looks the way it does.

#### Capabilities Used
- **Category:** `workflow`
- **`supersedes`:** replacing the old architecture memory
- **Content:** before/after mapping, migration steps

#### CLI Example
```bash
fractal memories create \
  --title "Migration: Flat helpers → Static class helpers (completed 2026-05)" \
  --description "All helper functions refactored from standalone exported functions to static class methods. Pattern: export class XyzHelper { static method() {} }" \
  --category "workflow" \
  --tags "refactoring,helpers,static-class,migration,architecture" \
  --supersedes '[{"id":"prev-helper-uuid","reason":"Helper pattern upgraded from functions to static classes per AGENTS.md constraint"}]' \
  --content "# Migration: Helper Refactor — Functions to Static Classes\n\n## Before\n```typescript\n// src/@core/helpers/date.helper.ts\nexport function formatDate(d: Date): string { ... }\n```\n\n## After\n```typescript\n// src/@core/helpers/date.helper.ts\nexport class DateHelper {\n  static format(d: Date): string { ... }\n}\n```\n\n## Files Migrated\n- src/@core/helpers/env.ts → EnvHelper\n- src/features/memory/helpers/memory-format.ts → MemoryFormatHelper\n\n## Rule Going Forward\nAll new helpers MUST be static classes. See AGENTS.md."
```

---

### Example 17: Knowledge Graph Navigation

#### Introduction
Use the `links` field to build an explicit knowledge graph between related memories. A memory about a bug can link to the architectural memory that explains why the bug category exists. A constraint memory can link to the lesson that originated it. This creates a navigable, interconnected knowledge base.

#### Capabilities Used
- **`links` field:** array of related memory UUIDs
- **Graph endpoint:** `fractal memories graph` for visualization
- **Cross-category linking:** connecting lesson → constraint → architecture

#### Implementation
```bash
# Step 1: Create the lesson memory (discovered bug)
LESSON_UUID=$(fractal memories create \
  --title "Lesson: Igniter path resolution requires both id+agent in where clause" \
  --description "findUnique with only id fails when collection pattern includes {agent} variable. Must always pass agent in where clause." \
  --category "lesson" \
  --tags "igniter,collections,path-resolution,bug" | jq -r '.id')

# Step 2: Create constraint memory that LINKS back to the lesson
fractal memories create \
  --title "RULE: Always pass agent+id in memory collection where clauses" \
  --description "Memory collection queries must always include agent field in where clause alongside id to satisfy Igniter path variable resolution." \
  --category "constraint" \
  --tags "igniter,memory,collections,rule" \
  --links "[\"$LESSON_UUID\"]" \
  --content "# Constraint: Memory Where Clause Must Include Agent\n\n## Rule\nWhen querying the memories collection by ID:\n\n```typescript\n// ✅ Correct\ncollections.get('memories').findUnique({ where: { id, agent } })\n\n// ❌ Wrong — path resolution fails\ncollections.get('memories').findUnique({ where: { id } })\n```\n\n## Origin\nSee lesson memory $LESSON_UUID for full root cause."

# Step 3: Visualize the knowledge graph
fractal memories graph
```

The graph endpoint returns:
```typescript
{
  nodes: [
    { id: "lesson-uuid", label: "Lesson: path resolution...", category: "lesson", status: "active", val: 1 },
    { id: "constraint-uuid", label: "RULE: Always pass agent+id...", category: "constraint", status: "active", val: 1 }
  ],
  links: [
    { source: "constraint-uuid", target: "lesson-uuid", type: "reference", weight: 1 }
  ]
}
```

---

### Example 18: TTL-Based Temporary Context

#### Introduction
Not all knowledge should persist forever. Use `expiresAt` to create short-lived memories for temporary states: in-flight API credentials, sprint-specific context, or work-in-progress states that should auto-expire after the deadline.

#### Capabilities Used
- **`expiresAt`:** ISO timestamp triggering `ttl_expired` status
- **Category:** `context`
- **Use case:** sprint context, temp credentials, WIP checkpoints

#### CLI Example
```bash
# Create a sprint context that expires at sprint end
SPRINT_END="2026-05-31T23:59:59Z"

fractal memories create \
  --title "Sprint 12 Context: Focus on Payment & Notification features" \
  --description "Sprint 12 (May 26-31) priorities: payment collection schema, notification queue, email delivery integration." \
  --category "context" \
  --tags "sprint,sprint-12,payment,notifications,temporary" \
  --expires-at "$SPRINT_END" \
  --content "# Sprint 12 Context (Expires: 2026-05-31)\n\n## This Sprint's Scope\n1. Payment feature: collection + procedure + controller\n2. Notification queue: email + push\n3. NOT in scope: frontend components, auth refactor\n\n## Team\n- Atlas: Backend architecture\n- Subagent-A: Payment feature\n- Subagent-B: Notification feature\n\n## Definition of Done\n- TypeScript compilation clean (bun run tsc --noEmit)\n- Unit tests passing (bun test)\n- Endpoints tested via cURL"

# After expiresAt, status automatically becomes 'ttl_expired'
# List only active non-expired memories
fractal memories list --status active
```

---

### Example 19: Cross-Agent Shared Knowledge Base

#### Introduction
Use the `graph` endpoint to build a shared knowledge map across all agents in a workspace. Agent A and Agent B may have overlapping knowledge about the same system — the graph reveals these overlaps and allows the orchestrator to build a unified understanding.

#### Capabilities Used
- **`graph` endpoint:** returns nodes + links for all agents
- **`links` field:** cross-agent memory references
- **Category:** `reference` for shared domain knowledge

#### Implementation
```bash
# Agent A (atlas) creates foundational architecture memory
fractal memories create \
  --title "Fractal: igniter.context.ts is the DI root — never touch it in features" \
  --description "igniter.context.ts is the global DI container. Feature subagents must NEVER edit this file. Only the orchestrator (Atlas) manages it." \
  --category "architecture" \
  --tags "igniter,context,di,global,orchestrator-only"

# Agent B (subagent-payment) creates its feature memory and links to Atlas's
fractal memories create \
  --title "Payment feature: injects via igniter.context.ts — coordinate with Atlas" \
  --description "The payment service must be registered in igniter.context.ts. Subagent cannot do this — must request Atlas to add the injection." \
  --category "workflow" \
  --tags "payment,igniter,context,handoff" \
  --links '["<atlas-memory-uuid>"]'

# Orchestrator visualizes cross-agent knowledge graph
curl "http://localhost:3000/memories/graph?agent=" | jq '.nodes | length'
# → Shows all nodes across all agents

# Filter to specific agent
curl "http://localhost:3000/memories/graph?agent=subagent-payment" | jq '.'
```

The graph endpoint response structure:
```typescript
interface MemoryGraph {
  nodes: Array<{
    id: string;         // Memory UUID
    label: string;      // Memory title
    category: MemoryCategory;
    status: MemoryStatus;
    group: string;      // Same as category — for visual grouping
    val: number;        // confidence value → visual node size
  }>;
  links: Array<{
    source: string;     // Source memory UUID
    target: string;     // Target memory UUID
    type: "reference" | "supersedes";
    weight: number;     // 1 for reference, 2 for supersedes
  }>;
}
```

---

### Example 20: Confidence-Weighted Decision Making

#### Introduction
The `confidence` field (0–1) encodes epistemic certainty. When you *know* something is true (verified by source code, official docs, or repeated observation), use `confidence: 1`. When you *believe* something based on inference or incomplete data, use a lower confidence. This allows future agents to weight contradictory memories appropriately.

#### Capabilities Used
- **`confidence`:** float 0–1 representing certainty
- **Full-text search:** surfaces memories weighted by confidence
- **Category:** any — confidence applies across all categories

#### CLI Example
```bash
# High confidence: verified from source code
fractal memories create \
  --title "Memory IDs are crypto.randomUUID() — confirmed from memory.service.ts:292" \
  --description "Memory IDs use crypto.randomUUID(). Confirmed at MemoryService.create(), line 292." \
  --category "architecture" \
  --confidence 1 \
  --tags "memory,ids,uuid,confirmed"

# Medium confidence: inferred, not fully verified
fractal memories create \
  --title "Suspected: Igniter collection watcher has 500ms debounce" \
  --description "Observed ~500ms delay between file write and collection update event. Likely a debounce but not confirmed from source." \
  --category "lesson" \
  --confidence 0.6 \
  --tags "igniter,collections,watcher,debounce,unconfirmed"

# Low confidence: educated guess pending verification
fractal memories create \
  --title "Hypothesis: BM25 search weights are applied per-shard" \
  --description "Hypothesis only. BM25 field weights may be per-shard in igniter-collections. Needs verification from @igniter-js/collections source." \
  --category "reference" \
  --confidence 0.3 \
  --tags "igniter,search,bm25,hypothesis,verify-needed"
```

#### Reasoning Pattern
When two memories conflict, prefer the higher-confidence one:
```bash
# Find all low-confidence memories for review
fractal memories list --query "hypothesis"
fractal memories list --query "suspected"
fractal memories list --query "unconfirmed"
```

Once verified, supersede the low-confidence memory with a high-confidence version.

---

### Example 21: Automated Memory Hygiene Workflow

#### Introduction
Memories accumulate over time. Build a periodic hygiene workflow that reviews deprecated and expired memories, promotes verified hypotheses, and identifies outdated context memories that need refreshing.

#### Capabilities Used
- **`status` filter:** list deprecated, ttl_expired memories
- **`forgot` command:** deprecate stale memories
- **`supersedes`:** upgrade hypotheses to facts

#### CLI Workflow
```bash
# Step 1: Audit deprecated memories (understand history)
fractal memories list --status deprecated

# Step 2: Find expired TTL memories
fractal memories list --status ttl_expired

# Step 3: Find stale context memories (older in-progress states)
fractal memories list --category context --query "in-progress"

# Step 4: Find low-confidence hypotheses needing verification
fractal memories list --query "hypothesis OR suspected OR unconfirmed"

# Step 5: Deprecate a stale context that's no longer relevant
fractal memories forgot <uuid> \
  --reason "Sprint 11 context is expired. Sprint 12 context memory replaces it."

# Step 6: Upgrade a verified hypothesis to full confidence
fractal memories create \
  --title "CONFIRMED: Igniter collection watcher has 500ms debounce" \
  --description "Verified from @igniter-js/collections source. Debounce is 500ms hardcoded in FileWatcher class." \
  --category "lesson" \
  --confidence 1 \
  --supersedes '[{"id":"<hypothesis-uuid>","reason":"Hypothesis confirmed from source code. Full confidence version replaces it."}]'
```

---

## Proactive Checklist for Memory Creation

Before creating ANY memory, ask yourself:

1. ✅ **Is this already known?** Run `fractal memories list --query "<keywords>"` first. Never duplicate.
2. ✅ **What category?** `lesson` for discoveries, `constraint` for rules, `architecture` for decisions, `preference` for style, `context` for session state, `tooling` for configs, `security` for policies, `reference` for external facts, `workflow` for processes.
3. ✅ **What's my confidence?** `1.0` only if verified from source. `0.5-0.9` for inferences. `0.1-0.4` for hypotheses.
4. ✅ **What scopes apply?** If this knowledge is feature-specific, add glob patterns via `--scopes`.
5. ✅ **Does it supersede anything?** Check for outdated memories before creating. Use `--supersedes` if replacing.
6. ✅ **What links are relevant?** Does this memory connect to a constraint, lesson, or architecture memory? Add `--links`.
7. ✅ **Does it expire?** Sprint context, temp credentials, WIP states → set `--expires-at`.
8. ✅ **Is the title searchable?** Future agents will search with keywords. Front-load the important terms in the title.
9. ✅ **Is the description retrieval-optimized?** The `description` field is weighted 4x in BM25 search. Write it to answer: "What is this memory about, in one sentence?"
10. ✅ **Tags are your index.** Include: the domain, the technology, the symptom keyword, and any categorization term (e.g., `bug`, `rule`, `gotcha`, `pattern`).

---

## Proactive Workflows

### Workflow A: Session Start
```bash
# 1. Load active context memories
fractal memories list --category context

# 2. Load active constraints for current work domain
fractal memories list --category constraint --query "<feature-name>"

# 3. Load recent lessons
fractal memories list --category lesson --limit 5
```

### Workflow B: After Fixing a Bug
```bash
# Immediately encode the bug pattern
fractal memories create \
  --category lesson \
  --title "<Bug symptom in <10 words>" \
  --description "<One sentence root cause + fix>" \
  --tags "<package>,<error-type>,bug,<feature>"
```

### Workflow C: Before Delegating to Subagent
```bash
# Pack context into a single retrievable handoff memory
fractal memories create \
  --category context \
  --title "Handoff: <Task> — <Agent> context pack" \
  --description "<Task brief + scope boundaries>" \
  --links '["<related-arch-uuid>","<related-constraint-uuid>"]'
```

### Workflow D: Architecture Decision Made
```bash
# Check if an old decision exists to supersede
fractal memories list --category architecture --query "<topic>"

# If yes, supersede it
fractal memories create --category architecture --supersedes '[{"id":"<old-uuid>","reason":"..."}]' ...

# If no, create fresh
fractal memories create --category architecture ...
```

---

## 📚 References & Resources

- **Fractal Guides:**
  - [The Master Skill Guide](../SKILL.md)
  - [Collections Architecture](../guides/collections.md)
  - [Toolset Architecture & Builders](../guides/toolset.md)

- **Source Code References:**
  - `src/features/memory/memory.interfaces.ts` — Full Zod schema & type definitions
  - `src/features/memory/memory.service.ts` — Service implementation & search weights
  - `src/features/memory/collections/memory.collection.ts` — Storage path pattern
  - `src/features/memory/controllers/memory.controller.ts` — REST API endpoints

- **Storage Pattern:**
  - Files live at: `.fractal/agents/{agent}/memories/{id}.memory.md`
  - Format: Markdown with YAML frontmatter (managed by `@igniter-js/collections`)
