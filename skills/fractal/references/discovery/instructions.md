# The Law of the Machine: Instruction Discovery & Proactivity

Welcome to the behavioral layer of the Fractal Operating System. As an AI Agent, you are traditionally stateless — your rules reset with every conversation. Fractal shatters this limitation. Through **Custom Instructions**, you can encode persistent, glob-scoped rules that are automatically injected into your context on every relevant tool call. These are not suggestions. They are laws.

## Why This Document Exists

This document is designed to expand your understanding of what Instructions can do beyond a simple "always do X" rule. Instructions in Fractal are **contextual, hierarchical, and surgical**. They fire only when you are editing the right file, in the right domain, at the right moment — via the `PostToolUse` event. A single instruction can eliminate an entire category of recurring bugs, enforce an architectural pattern, or automate a complex multi-step workflow.

**This document exists to show you that Instructions are the immune system of your codebase. They are the difference between a one-time fix and a permanent architectural guarantee.**

## The Mindset Shift

1. **Every recurring mistake should become an instruction.** If you catch yourself writing the same fix twice, create an instruction so you never write it wrong again.
2. **Glob scoping is your scalpel.** `src/features/**/*.ts` is very different from `**/*`. Use precision scoping to avoid instruction noise.
3. **Rule types encode intent.** `always` = mandatory. `never` = prohibited. `allow` = explicitly permitted. `ask` = gate behind confirmation. `workflow` = ordered process. `note` = informational context.
4. **Instructions are auto-injected.** When you open or write a file that matches a `paths[]` glob, the instruction is silently pushed into your system context. You don't call it — it finds you.
5. **ID is deterministic.** The `id` is always derived from the `name`: lowercased, spaces replaced with dashes. `"Git Workflow"` → `git-workflow`.

## Core Anatomy of an Instruction

Every instruction is a Markdown file stored at `.fractal/instructions/{type}/{id}.instruction.md`.

### Frontmatter Schema

```yaml
---
name: Human Readable Name         # Required. Drives the auto-generated ID.
type: standards                   # Required. One of: "standards" | "patterns" | "workflows"
description: One-line summary     # Required. Shown in the Fractal UI listing.
paths:                            # Required. Glob array for auto-injection scoping.
  - src/features/**/*.ts          # Injected when editing any feature TypeScript file.
  - '**/*'                        # Global: injected on every file event.
---
```

### Type Field Reference

| `type` Value | Purpose | Auto-Injected When |
|---|---|---|
| `standards` | Coding rules, style constraints, naming | Editing files matching `paths[]` |
| `patterns` | Architectural implementation blueprints | Editing files matching `paths[]` |
| `workflows` | Multi-step ordered processes | Editing files matching `paths[]` |

### Rule Type Conventions (within content)

The content body uses **bold trigger phrases** to encode rule semantics. These are conventions that agents interpret:

| Keyword | Behavior | Example |
|---|---|---|
| `ALWAYS` | Mandatory behavior, no exceptions | `**ALWAYS** prefix exported types with Fractal` |
| `NEVER` | Prohibited behavior | `**NEVER** use the \`any\` type` |
| `ALLOW` | Explicitly permitted, may seem counter-intuitive | `**ALLOW** using \`z.unknown()\` for external APIs` |
| `ASK` | Gate behind explicit user confirmation | `**ASK** before dropping a database column` |
| `WORKFLOW` | Ordered numbered sequence | `WORKFLOW: 1. Explore → 2. Plan → 3. Execute` |
| `NOTE` | Informational, no enforcement | `**NOTE**: This rule is waived for test files` |

### CLI Commands

```bash
# Create a new instruction
bun fractal instructions create \
  --name "Feature Architecture Standards" \
  --type standards \
  --description "Clean architecture rules for bounded contexts" \
  --paths "src/features/**/*.ts"

# List all registered instructions
bun fractal instructions list

# Get a specific instruction by ID
bun fractal instructions get --id "feature-architecture-standards"

# Update instruction content or metadata
bun fractal instructions update --id "feature-architecture-standards"

# Delete an instruction permanently
bun fractal instructions delete --id "feature-architecture-standards"
```

---

## Discovery Examples: 20 Ways to Encode Permanent Rules

---

### Example 01: Feature Architecture Standards

#### Introduction
Every time you open a file inside `src/features/`, these rules fire. They prevent architecture drift by ensuring every bounded context follows the same layered structure. This is the single most impactful instruction for maintaining Clean Architecture at scale.

#### Capabilities Used
- **Glob scoping** (`src/features/**/*.ts`)
- **ALWAYS / NEVER** rules
- **Critical Checkpoints** checklist

#### Instruction File
`.fractal/instructions/standards/feature-architecture-standards.instruction.md`

```yaml
---
name: Feature Architecture Standards
type: standards
description: Clean architecture rules for bounded contexts
paths:
  - src/features/**/*.ts
---
```

```markdown
## Main Context
Bounded contexts are the foundation of Fractal's modularity. Each `src/features/[feature]/` directory is a self-contained universe. Violating its boundaries creates hidden coupling that is nearly impossible to refactor later.

### 1. Controller Delegation Rule
**Trigger**: Writing code inside `src/features/[feature]/controllers/`.
**Rule**: **NEVER** write business logic in a controller. Controllers only validate inputs and delegate to procedures.
**✅ Correct**: `return context.procedures.memory.create(input.body);`
**❌ Incorrect**: `const data = await db.query(...); return data;`

### 2. Cross-Feature Import Rule
**Trigger**: Writing an import statement in any feature file.
**Rule**: **NEVER** import from another feature's directory (`src/features/other-feature`). Use shared `@core` utilities instead.

### 3. Procedure Error Mapping
**Trigger**: Writing `throw` in a procedure.
**Rule**: **ALWAYS** throw from the feature's typed `[feature].errors.ts`, never throw raw `Error()` or HTTP status codes.

## Critical Checkpoints
1. [ ] Does the controller delegate 100% of logic to a procedure?
2. [ ] Are all imports from `@core` or the current feature only?
3. [ ] Are errors typed and thrown via `[feature].errors.ts`?
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Feature Architecture Standards" \
  --type standards \
  --description "Clean architecture rules for bounded contexts" \
  --paths "src/features/**/*.ts"
```

---

### Example 02: Test Coverage Enforcement

#### Introduction
Injected whenever you write or modify a `.test.ts` file. It enforces coverage standards and naming patterns, ensuring tests are meaningful and discoverable — not just boilerplate written to satisfy a CI metric.

#### Instruction File
`.fractal/instructions/standards/test-coverage-enforcement.instruction.md`

```yaml
---
name: Test Coverage Enforcement
type: standards
description: Coverage thresholds and test naming rules
paths:
  - src/**/*.test.ts
  - src/**/*.spec.ts
---
```

```markdown
## Main Context
Tests are the safety net. A test without assertions, a test named "should work", or a test that doesn't cover the failure path is worse than no test — it creates false confidence.

### 1. Test Naming Convention
**Rule**: **ALWAYS** name tests using the format: `[unit] [action] [expected result]`.
**✅ Correct**: `"MemoryService.create() should return the created memory record"`
**❌ Incorrect**: `"test memory creation"`

### 2. Failure Path Coverage
**Rule**: **ALWAYS** write at least one test for the happy path and one for the failure path.
**✅ Correct**: Test `create()` succeeds AND test `create()` throws when name is empty.
**❌ Incorrect**: Only testing the happy path.

### 3. No Skipped Tests
**Rule**: **NEVER** commit code containing `test.skip()`, `it.skip()`, or `describe.skip()`.

### 4. Coverage Thresholds
**NOTE**: Target ≥ 80% line coverage per feature. Run `bun test --coverage` before pushing.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Test Coverage Enforcement" \
  --type standards \
  --description "Coverage thresholds and test naming rules" \
  --paths "src/**/*.test.ts" "src/**/*.spec.ts"
```

---

### Example 03: Security Coding Rules

#### Introduction
A global instruction (`paths: ['**/*']`) that fires on every file event. It contains the highest-priority security rules — secrets, injections, and unsafe patterns that should never appear anywhere in the codebase.

#### Instruction File
`.fractal/instructions/standards/security-coding-rules.instruction.md`

```yaml
---
name: Security Coding Rules
type: standards
description: Global security prohibitions applied to every file
paths:
  - '**/*'
---
```

```markdown
## Main Context
Security vulnerabilities are the most expensive bugs in production. These rules are non-negotiable and apply globally to every file in the workspace.

### 1. No Hardcoded Secrets
**Rule**: **NEVER** hardcode API keys, tokens, passwords, or private keys in source files.
**✅ Correct**: `const key = process.env.OPENAI_API_KEY;`
**❌ Incorrect**: `const key = "sk-abc123...";`

### 2. No SQL String Interpolation
**Rule**: **NEVER** construct SQL queries via string interpolation. Use parameterized queries.
**❌ Incorrect**: `` `SELECT * FROM users WHERE id = ${userId}` ``

### 3. Environment Variables Are Typed
**Rule**: **ALWAYS** validate environment variables at startup using a Zod schema in `config.server.ts`.

### 4. No `eval()` or `new Function()`
**Rule**: **NEVER** use `eval()`, `new Function(string)`, or `setTimeout(string)`.

### 5. Secrets in `.env.example` Only
**Rule**: **ALWAYS** add new environment variable names to `.env.example` with a placeholder value, and **NEVER** commit `.env` files.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Security Coding Rules" \
  --type standards \
  --description "Global security prohibitions applied to every file" \
  --paths "**/*"
```

---

### Example 04: API Design Standards

#### Introduction
Scoped to controller files, this instruction enforces consistent HTTP API design: verb usage, response shapes, error mapping, and OpenAPI documentation hygiene.

#### Instruction File
`.fractal/instructions/standards/api-design-standards.instruction.md`

```yaml
---
name: API Design Standards
type: standards
description: HTTP verb, response shape, and error mapping rules for controllers
paths:
  - src/features/**/controllers/*.ts
---
```

```markdown
## Main Context
The HTTP API is a public contract. Breaking its shape silently causes cascading failures in every client, agent, and integration that consumes it.

### 1. HTTP Verb Semantics
**Rule**: **ALWAYS** use the correct HTTP verb: GET (read), POST (create), PUT/PATCH (update), DELETE (delete).
**NEVER** use GET for state-changing operations.

### 2. Standardized Response Shape
**Rule**: **ALWAYS** return responses using the Igniter response helpers.
**✅ Correct**: `return igniter.response.ok({ data: result, _cta: { description: "Memory created." } });`
**❌ Incorrect**: `return { status: 200, body: result };`

### 3. Controller JSDoc + cURL Example
**Rule**: **ALWAYS** include a TSDoc block on every controller action with `@returns` and a `@example` cURL invocation.

### 4. No Business Logic in Controllers
**Rule**: **NEVER** write business logic in controllers. **ALWAYS** delegate to the feature procedure.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "API Design Standards" \
  --type standards \
  --description "HTTP verb, response shape, and error mapping rules for controllers" \
  --paths "src/features/**/controllers/*.ts"
```

---

### Example 05: Git Commit Message Conventions

#### Introduction
A global workflow instruction. Every time you interact with any file, this instruction reminds you of the exact commit message format, branching protocol, and atomicity rules. This encodes the project's entire VCS discipline permanently.

#### Instruction File
`.fractal/instructions/workflows/git-commit-message-conventions.instruction.md`

```yaml
---
name: Git Commit Message Conventions
type: workflows
description: Conventional commits, branching, and atomicity rules
paths:
  - '**/*'
---
```

```markdown
## Main Context
The git history is the "narrative" of the project. A messy history makes debugging impossible. Conventional commits enable automated changelog generation and semantic versioning.

### 1. Commit Format
**Rule**: **ALWAYS** use `type(scope): description` format.
**Allowed Types**: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `style`, `perf`.
**✅ Correct**: `feat(memory): implement BM25 full-text search`
**❌ Incorrect**: `"fixed stuff"`

### 2. Branching Protocol
**WORKFLOW**:
1. Create branch: `git checkout -b feat/memory-semantic-search`
2. Make atomic commits targeting one logical change at a time.
3. Before push: run `bun run tsc --noEmit` and `bun test`.
4. Open PR against `main`.

### 3. Atomic Commits
**Rule**: **NEVER** mix unrelated changes in a single commit.
**ASK** before staging more than one feature area in a single commit.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Git Commit Message Conventions" \
  --type workflows \
  --description "Conventional commits, branching, and atomicity rules" \
  --paths "**/*"
```

---

### Example 06: TypeScript Strict Mode Rules

#### Introduction
Fires on every `.ts` file. Enforces the Zod-as-SSOT paradigm, bans `any`, and mandates explicit return types. This single instruction eliminates the most common source of runtime errors in a TypeScript codebase.

#### Instruction File
`.fractal/instructions/standards/typescript-strict-mode-rules.instruction.md`

```yaml
---
name: TypeScript Strict Mode Rules
type: standards
description: Strict typing with Zod as single source of truth
paths:
  - src/**/*.ts
  - src/**/*.tsx
---
```

```markdown
## Main Context
Strict typing is the immune system of the codebase. `any` defeats this protection. Zod schemas are the Single Source of Truth for all data.

### 1. The Forbidden Type
**Rule**: **NEVER** use `any`, `z.any()`, or `as any` casts.

### 2. Zod as Source of Truth
**Rule**: **ALWAYS** define data shapes with Zod first, then derive TypeScript types using `z.infer<typeof Schema>`. **NEVER** write parallel `interface` declarations.
**✅ Correct**: `export type FractalMemory = z.infer<typeof FractalMemorySchema>;`

### 3. Explicit Return Types
**Rule**: **ALWAYS** type function arguments and return values explicitly.

### 4. Unknown over Any
**Rule**: **ALLOW** `z.unknown()` when the external data shape is genuinely unpredictable (third-party webhook payloads). This is the safe alternative to `any`.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "TypeScript Strict Mode Rules" \
  --type standards \
  --description "Strict typing with Zod as single source of truth" \
  --paths "src/**/*.ts" "src/**/*.tsx"
```

---

### Example 07: Database Query Optimization Rules

#### Introduction
Scoped to collection files, this instruction fires when writing data persistence logic. It prevents N+1 queries, unbounded list fetches, and missing `take` limits that would silently degrade performance at scale.

#### Instruction File
`.fractal/instructions/standards/database-query-optimization-rules.instruction.md`

```yaml
---
name: Database Query Optimization Rules
type: standards
description: Prevent N+1 queries, unbounded lists, and missing pagination
paths:
  - src/features/**/collections/*.ts
  - src/features/**/procedures/*.ts
---
```

```markdown
## Main Context
A query that works fine for 100 records becomes a system outage at 100,000. Optimization must be built in from the start, not bolted on after a production incident.

### 1. Always Paginate findMany
**Rule**: **ALWAYS** include `take` and `skip` on every `findMany()` call. The maximum default `take` is 100.
**✅ Correct**: `collection.findMany({ take: 50, skip: 0 })`
**❌ Incorrect**: `collection.findMany()` — unbounded, will return all records.

### 2. Select Only Needed Fields
**Rule**: **NEVER** fetch entire records when only a subset of fields is needed.

### 3. Batch Instead of Loop
**Rule**: **NEVER** call `findUnique()` inside a loop. Use `findMany` with an `{ in: [...ids] }` filter instead.

### 4. Index Hot Query Fields
**NOTE**: Fields used in frequent `where` filters should be documented in a comment inside the collection schema as `// @indexed`.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Database Query Optimization Rules" \
  --type standards \
  --description "Prevent N+1 queries, unbounded lists, and missing pagination" \
  --paths "src/features/**/collections/*.ts" "src/features/**/procedures/*.ts"
```

---

### Example 08: Dependency Injection Patterns

#### Introduction
Fires on `igniter.context.ts` and procedure files. It enforces the DI contract: services are registered once at the context level and consumed via the injected `context` object. No service instantiation inside procedures.

#### Instruction File
`.fractal/instructions/patterns/dependency-injection-patterns.instruction.md`

```yaml
---
name: Dependency Injection Patterns
type: patterns
description: Services registered in context, consumed via injection in procedures
paths:
  - src/igniter.context.ts
  - src/features/**/procedures/*.ts
---
```

```markdown
## Main Context
Direct instantiation creates hidden coupling. DI makes every dependency visible, mockable, and testable. Fractal's DI root is `src/igniter.context.ts`.

### 1. Context Is the Root
**Rule**: **ALWAYS** register services in `igniter.context.ts`. **NEVER** call `new MyService()` inside a procedure, controller, or queue.
**✅ Correct**: `context.features.memory.service.create(params)`
**❌ Incorrect**: `const svc = new MemoryService(); svc.create(params);`

### 2. No Circular Dependencies
**Rule**: **NEVER** create circular imports between features. If feature A depends on feature B's service, extract the shared logic to `src/@core/services/`.

### 3. Singleton Registration
**Rule**: **ALWAYS** register services as singletons at context boot time.
**ALLOW** creating short-lived helpers (stateless static classes) inline.

## Mental Model
Think of `igniter.context.ts` as the **main electrical panel**. Every feature plugs into it. No device wires itself directly to the generator.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Dependency Injection Patterns" \
  --type patterns \
  --description "Services registered in context, consumed via injection in procedures" \
  --paths "src/igniter.context.ts" "src/features/**/procedures/*.ts"
```

---

### Example 09: Error Handling Standards

#### Introduction
Scoped to error definition files and procedures. Ensures that every domain has a typed error registry, that errors carry actionable CTA (call-to-action) metadata, and that raw JS errors never bubble up to the HTTP layer.

#### Instruction File
`.fractal/instructions/standards/error-handling-standards.instruction.md`

```yaml
---
name: Error Handling Standards
type: standards
description: Typed FractalError registry and CTA metadata enforcement
paths:
  - src/features/**/*.errors.ts
  - src/features/**/procedures/*.ts
---
```

```markdown
## Main Context
Untyped errors are noise. Typed errors are signals. Every domain error must carry enough context for an AI agent (or human) to immediately understand what broke and what to do next.

### 1. Typed Error Registry
**Rule**: **ALWAYS** define domain errors in `[feature].errors.ts` using `FractalError.create()`. **NEVER** `throw new Error("something broke")`.

### 2. Mandatory CTA Metadata
**Rule**: **ALWAYS** include `cta.description` and `cta.commands[]` in every error definition.
**✅ Correct**:
```typescript
.addError("FRACTAL_MEMORY_NOT_FOUND", {
  status: 404,
  message: "Memory record not found.",
  cta: {
    description: "Verify the memory ID exists.",
    commands: ["bun fractal memories list"]
  }
})
```

### 3. Error Code Naming
**Rule**: **ALWAYS** use `SCREAMING_SNAKE_CASE` prefixed with `FRACTAL_[FEATURE]_` for error codes.
**✅ Correct**: `FRACTAL_MEMORY_NOT_FOUND`
**❌ Incorrect**: `memoryNotFound`

### 4. No Raw HTTP Codes in Procedures
**Rule**: **NEVER** return raw HTTP status codes from procedures. Map them to domain errors.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Error Handling Standards" \
  --type standards \
  --description "Typed FractalError registry and CTA metadata enforcement" \
  --paths "src/features/**/*.errors.ts" "src/features/**/procedures/*.ts"
```

---

### Example 10: Logging Standards

#### Introduction
Global instruction that enforces structured logging. Prevents `console.log` pollution in production, mandates log levels, and ensures every log line carries correlation context (request ID, feature, action).

#### Instruction File
`.fractal/instructions/standards/logging-standards.instruction.md`

```yaml
---
name: Logging Standards
type: standards
description: Structured logging with correlation IDs, no console.log in production code
paths:
  - src/**/*.ts
---
```

```markdown
## Main Context
`console.log("here")` is not a logging strategy. Structured logging with levels, correlation IDs, and context enables real-time debugging and post-mortem analysis without guesswork.

### 1. No console.log in Production Code
**Rule**: **NEVER** use `console.log`, `console.error`, or `console.warn` in `src/**/*.ts` (except test files).
**✅ Correct**: Use the injected `context.logger.info(...)` / `context.logger.error(...)`.

### 2. Log Levels
**Rule**: **ALWAYS** choose the correct level: `debug` (trace/dev), `info` (state changes), `warn` (recoverable anomalies), `error` (unrecoverable failures).

### 3. Structured Payloads
**Rule**: **ALWAYS** pass structured context objects as the second argument, never interpolate variables into the message string.
**✅ Correct**: `logger.info("Memory created", { memoryId: id, workspaceId })`
**❌ Incorrect**: `logger.info(\`Memory ${id} created in workspace ${workspaceId}\`)`

### 4. Sensitive Data Redaction
**Rule**: **NEVER** log passwords, API keys, or full JWT tokens. Log only the first 8 characters of any token for traceability.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Logging Standards" \
  --type standards \
  --description "Structured logging with correlation IDs, no console.log in production code" \
  --paths "src/**/*.ts"
```

---

### Example 11: Documentation Requirements (JSDoc Enforcement)

#### Introduction
Scoped to services, controllers, procedures, helpers, and interfaces — the "exported API" layers. Ensures every exported member has complete TSDoc: description, `@param`, `@returns`, and at least one `@example`.

#### Instruction File
`.fractal/instructions/standards/documentation-requirements.instruction.md`

```yaml
---
name: Documentation Requirements
type: standards
description: Mandatory TSDoc for all exported members in API layers
paths:
  - src/features/**/services/*.ts
  - src/features/**/controllers/*.ts
  - src/features/**/procedures/*.ts
  - src/@core/services/*.ts
  - src/@core/helpers/*.ts
---
```

```markdown
## Main Context
Documentation is the "User Manual" for other agents. An undocumented function forces the reader to reverse-engineer intent from implementation — the most expensive form of reading.

### 1. Mandatory TSDoc Block
**Rule**: **ALWAYS** add a TSDoc block to every exported class, method, interface, type, and property.

### 2. @param + @returns
**Rule**: **ALWAYS** include `@param` for every argument and `@returns` for non-void methods.

### 3. @example Block
**Rule**: **ALWAYS** include at least one `@example` for classes and public methods.

### 4. Interface-First Documentation
**Rule**: **ALWAYS** put the rich TSDoc on the Interface definition, and use `{@inheritDoc Interface.method}` in the concrete class implementation.

### 5. English Only
**Rule**: **ALWAYS** write all documentation in English.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Documentation Requirements" \
  --type standards \
  --description "Mandatory TSDoc for all exported members in API layers" \
  --paths "src/features/**/services/*.ts" "src/features/**/controllers/*.ts"
```

---

### Example 12: UI Component Standards

#### Introduction
Fires on any file inside the `presentation/` layer or `@app/`. Enforces component decomposition rules, mandatory prop typing via Zod, and the prohibition against putting business logic inside React components.

#### Instruction File
`.fractal/instructions/standards/ui-component-standards.instruction.md`

```yaml
---
name: UI Component Standards
type: standards
description: React component structure, prop typing, and presentation-only rules
paths:
  - src/@app/**/*.tsx
  - src/features/**/presentation/**/*.tsx
---
```

```markdown
## Main Context
React components should be "dumb" — they render data, they don't compute it. A component that fetches data, transforms it, and renders it is three responsibilities in one file. Split them.

### 1. Presentation-Only Rule
**Rule**: **NEVER** write data fetching, API calls, or business logic inside a React component. Use custom hooks (`use[Feature].hook.ts`) for data and `[feature].procedure.ts` for mutations.

### 2. Prop Type Naming
**Rule**: **ALWAYS** name prop interfaces `[ComponentName]Props`.
**✅ Correct**: `interface MemoryCardProps { ... }`

### 3. Zod-Validated Props for Dynamic Data
**Rule**: **ALLOW** using `z.infer<>` to derive prop types for components that render API response data directly — this creates a compile-time contract between API and UI.

### 4. Component File Naming
**Rule**: **ALWAYS** use `kebab-case` for filenames: `memory-card.component.tsx`, not `MemoryCard.tsx`.

### 5. No Inline Styles
**Rule**: **NEVER** use inline `style={{}}` objects. **ALWAYS** use Tailwind CSS utility classes.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "UI Component Standards" \
  --type standards \
  --description "React component structure, prop typing, and presentation-only rules" \
  --paths "src/@app/**/*.tsx" "src/features/**/presentation/**/*.tsx"
```

---

### Example 13: Environment Variable Handling

#### Introduction
Global instruction scoped to configuration and server-bootstrap files. Prevents environment variables from leaking to the client bundle and mandates Zod schema validation at server startup.

#### Instruction File
`.fractal/instructions/standards/environment-variable-handling.instruction.md`

```yaml
---
name: Environment Variable Handling
type: standards
description: Server vs client env separation and Zod validation at startup
paths:
  - src/@core/config.server.ts
  - src/@core/config.client.ts
  - src/index.ts
---
```

```markdown
## Main Context
Leaking server secrets to the client bundle is a critical security vulnerability. Mixing unvalidated `process.env` access throughout the codebase makes the app fragile to misconfigured deployments.

### 1. Centralized Access
**Rule**: **ALWAYS** access environment variables through `config.server.ts` or `config.client.ts`. **NEVER** call `process.env.ANYTHING` outside these two files.

### 2. Zod Validation at Boot
**Rule**: **ALWAYS** validate all server env vars using a Zod schema in `config.server.ts` at startup. The app **MUST** crash with a clear error if a required variable is missing.
**✅ Correct**:
```typescript
const EnvSchema = z.object({ DATABASE_URL: z.string().url() });
export const config = EnvSchema.parse(process.env);
```

### 3. Client Safety
**Rule**: **NEVER** expose server-side secrets in `config.client.ts`. Only `NEXT_PUBLIC_*` or equivalent public variables are allowed.

### 4. .env.example as Contract
**Rule**: **ALWAYS** add every new environment variable to `.env.example` with a placeholder value and a comment explaining its purpose.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Environment Variable Handling" \
  --type standards \
  --description "Server vs client env separation and Zod validation at startup" \
  --paths "src/@core/config.server.ts" "src/@core/config.client.ts"
```

---

### Example 14: Performance Budgets

#### Introduction
Fires on frontend entry points and API controllers. Encodes measurable performance targets and the rules for tracking them — preventing "performance by accident" from degrading into "performance by disaster".

#### Instruction File
`.fractal/instructions/standards/performance-budgets.instruction.md`

```yaml
---
name: Performance Budgets
type: standards
description: Frontend bundle size limits, API response time targets, and LCP benchmarks
paths:
  - src/@app/**/*.tsx
  - src/features/**/controllers/*.ts
---
```

```markdown
## Main Context
Performance is a feature. Slow UIs are a UX failure; slow APIs are an SLA failure. Measurable budgets prevent gradual performance degradation from going unnoticed.

### 1. Frontend Bundle Budget
**Rule**: The total JavaScript bundle size for the initial page load **MUST NOT** exceed 200 KB (gzipped). **NEVER** import a library that adds more than 50 KB without explicit team approval.
**NOTE**: Use `bun run build --analyze` to check bundle sizes before pushing.

### 2. API Response Time Target
**Rule**: Every API endpoint **MUST** respond in under 300 ms for the p95 percentile under normal load. If a controller action exceeds this, it **MUST** be moved to a background queue.

### 3. Lazy Loading
**Rule**: **ALWAYS** use dynamic imports (`import()`) for components that are not on the initial render path (modals, drawers, heavy charts).

### 4. No Blocking Operations on Main Thread
**Rule**: **NEVER** perform synchronous file I/O or CPU-intensive computations in a request handler. **ALWAYS** offload to a queue (`src/features/[feature]/queues/`).
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Performance Budgets" \
  --type standards \
  --description "Frontend bundle size limits, API response time targets, and LCP benchmarks" \
  --paths "src/@app/**/*.tsx" "src/features/**/controllers/*.ts"
```

---

### Example 15: Code Review Checklist Rules

#### Introduction
A workflow instruction that fires on every file, acting as a pre-commit mental checklist. Instead of relying on human memory, these rules are injected automatically before any code review or PR is finalized.

#### Instruction File
`.fractal/instructions/workflows/code-review-checklist-rules.instruction.md`

```yaml
---
name: Code Review Checklist Rules
type: workflows
description: Pre-push and pre-PR verification checklist
paths:
  - '**/*'
---
```

```markdown
## Main Context
Code reviews catch bugs. Checklists ensure reviews don't miss the obvious. This instruction fires globally to remind the agent of the minimum bar before any code is considered "done".

### WORKFLOW: Pre-Push Verification
1. **Type Check**: Run `bun run tsc --noEmit`. Zero errors allowed.
2. **Test Suite**: Run `bun test`. All tests must pass.
3. **Lint**: Run `bun run lint`. Zero warnings in modified files.
4. **Secret Scan**: Confirm no hardcoded secrets using `grep -r "sk-\|Bearer \|password=" src/`.
5. **Commit Format**: Verify the last commit follows `type(scope): description`.

### Pre-PR Review Questions
**ASK** yourself before opening a PR:
- [ ] Does this PR do exactly one thing?
- [ ] Are all new public methods documented with TSDoc?
- [ ] Are all error cases handled and typed?
- [ ] Is there a test for the failure path?
- [ ] Does the PR description explain *why* this change was made?

### NOTE
**ALLOW** skipping `bun test` only for `docs`-type commits that touch `.md` files exclusively.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Code Review Checklist Rules" \
  --type workflows \
  --description "Pre-push and pre-PR verification checklist" \
  --paths "**/*"
```

---

### Example 16: Migration Protocol

#### Introduction
A workflow instruction scoped to migration and schema files. Encodes the exact sequence required whenever a database schema or collection schema changes — preventing data loss and production outages from ad-hoc migrations.

#### Instruction File
`.fractal/instructions/workflows/migration-protocol.instruction.md`

```yaml
---
name: Migration Protocol
type: workflows
description: Ordered steps for schema changes to prevent data loss
paths:
  - src/features/**/collections/*.ts
  - migrations/**/*.ts
---
```

```markdown
## Main Context
Schema changes are the most dangerous operations in a running system. A missing migration step can corrupt production data silently, hours before anyone notices.

### WORKFLOW: Schema Change Protocol
1. **Snapshot First**: Export current collection data before any schema change: `bun fractal collections export --name [name]`.
2. **Write Migration**: Create a migration script in `migrations/[timestamp]-[description].ts` that transforms existing records to match the new schema.
3. **Test Migration Locally**: Run `bun run migrations/[timestamp]-[description].ts` in a dev environment with a copy of production data.
4. **Version the Schema**: Increment the `version` field in the collection definition.
5. **Deploy Together**: Schema change and migration script **MUST** be deployed atomically. **NEVER** deploy a schema change without its migration.
6. **Rollback Plan**: Document the rollback command in the PR description.

### ASK Before Proceeding
**ASK** the user for explicit confirmation before executing any migration that deletes or renames a field.

### NEVER
**NEVER** rename a field in a collection schema without providing a field migration mapping in the migration script.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Migration Protocol" \
  --type workflows \
  --description "Ordered steps for schema changes to prevent data loss" \
  --paths "src/features/**/collections/*.ts" "migrations/**/*.ts"
```

---

### Example 17: Feature Flag Conventions

#### Introduction
Fires on any file that references feature flags or environment-gated code. Ensures flags are centrally defined, typed, and removed promptly after their purpose is served — preventing "zombie flags" that linger indefinitely.

#### Instruction File
`.fractal/instructions/standards/feature-flag-conventions.instruction.md`

```yaml
---
name: Feature Flag Conventions
type: standards
description: Central registry, typed flags, and mandatory expiry dates
paths:
  - src/@core/config.server.ts
  - src/@core/config.client.ts
  - src/features/**/*.ts
---
```

```markdown
## Main Context
Feature flags are powerful but perilous. An unmanaged flag collection becomes a maze of dead code paths that nobody dares remove. Every flag must have an owner, a purpose, and a death date.

### 1. Central Registry
**Rule**: **ALWAYS** define feature flags in `src/@core/config.server.ts` under a `flags` namespace. **NEVER** check `process.env.SOME_FEATURE` inline in feature files.
**✅ Correct**: `if (config.flags.semanticSearch) { ... }`
**❌ Incorrect**: `if (process.env.SEMANTIC_SEARCH === "true") { ... }`

### 2. Typed Flags
**Rule**: **ALWAYS** define the flags object with explicit boolean types in the Zod config schema.

### 3. Expiry Date Comment
**Rule**: **ALWAYS** add a comment with the expected removal date next to each flag definition.
**✅ Correct**: `semanticSearch: z.boolean().default(false), // FLAG: Remove after 2025-Q3 launch`

### 4. No Permanent Flags
**Rule**: **NEVER** create a feature flag without a corresponding GitHub Issue to track its removal.
**NOTE**: Flags older than 90 days with no removal issue should be escalated.
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Feature Flag Conventions" \
  --type standards \
  --description "Central registry, typed flags, and mandatory expiry dates" \
  --paths "src/@core/config.server.ts" "src/features/**/*.ts"
```

---

### Example 18: Naming Convention Enforcement

#### Introduction
Scoped to all TypeScript source files. The single most consistent instruction in any codebase — it enforces file naming patterns, export naming prefixes, private member casing, and constant formatting.

#### Instruction File
`.fractal/instructions/standards/naming-convention-enforcement.instruction.md`

```yaml
---
name: Naming Convention Enforcement
type: standards
description: File names, export prefixes, private members, and constant casing
paths:
  - src/**/*.ts
  - src/**/*.tsx
---
```

```markdown
## Main Context
Names are "uniforms" for code. At a glance, the name should tell you the file's role, scope, and behavior. Inconsistent naming creates a cognitive tax on every reader.

### 1. Fractal Export Prefix
**Rule**: **ALWAYS** prefix exported schemas, interfaces, services, helpers, builders, and errors with `Fractal`.
**✅ Correct**: `FractalMemorySchema`, `FractalTaskService`, `FractalConfigHelper`
**❌ Incorrect**: `MemorySchema`, `TaskService`

### 2. Private Member Casing
**Rule**: **ALWAYS** use `_snake_case` for private class methods and properties.
**✅ Correct**: `private _validate_input(data: unknown) { ... }`
**❌ Incorrect**: `private validateInput(data: unknown) { ... }`

### 3. Constant Naming
**Rule**: **ALWAYS** use `UPPER_SNAKE_CASE` for private static readonly class constants.
**✅ Correct**: `private static readonly MAX_RETRY_ATTEMPTS = 5;`

### 4. File Naming
**Rule**: **ALWAYS** use `kebab-case` with a domain suffix for filenames.
- Services: `[name].service.ts`
- Helpers: `[name].helper.ts`
- Controllers: `[feature].controller.ts`
- Collections: `[feature].collection.ts`
- Tests: `[name].test.ts`
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Naming Convention Enforcement" \
  --type standards \
  --description "File names, export prefixes, private members, and constant casing" \
  --paths "src/**/*.ts" "src/**/*.tsx"
```

---

### Example 19: Import Ordering Standards

#### Introduction
Scoped to all TypeScript files. Enforces a canonical import order that reduces merge conflicts, improves readability, and makes the dependency graph of each file scannable at a glance.

#### Instruction File
`.fractal/instructions/standards/import-ordering-standards.instruction.md`

```yaml
---
name: Import Ordering Standards
type: standards
description: Canonical import group order and no wildcard imports
paths:
  - src/**/*.ts
  - src/**/*.tsx
---
```

```markdown
## Main Context
Import order is not cosmetic — it is a communication tool. The order tells the reader which dependencies are external (third-party), which are internal infrastructure, and which are local feature siblings.

### 1. Canonical Import Order
**Rule**: **ALWAYS** order imports in these groups, separated by blank lines:
```
// Group 1: Node.js built-ins
import fs from "node:fs";

// Group 2: External npm packages
import { z } from "zod";
import { igniter } from "@igniter-js/core";

// Group 3: Internal @core and @app aliases
import { FractalConfigHelper } from "@core/helpers/config.helper";

// Group 4: Cross-feature relative imports (avoid — prefer @core)
// Group 5: Current feature relative imports
import { MemoryError } from "../memory.errors";
import { MemoryCollection } from "../collections/memory.collection";
```

### 2. No Wildcard Imports
**Rule**: **NEVER** use `import * as X from "..."`. Always use named imports.
**✅ Correct**: `import { readFile, writeFile } from "node:fs/promises";`
**❌ Incorrect**: `import * as fs from "node:fs";`

### 3. Type-Only Imports
**Rule**: **ALWAYS** use `import type { ... }` for types that are only used in type positions (not at runtime).
**✅ Correct**: `import type { FractalMemory } from "../memory.interfaces";`
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "Import Ordering Standards" \
  --type standards \
  --description "Canonical import group order and no wildcard imports" \
  --paths "src/**/*.ts" "src/**/*.tsx"
```

---

### Example 20: API Versioning Rules

#### Introduction
Scoped to controller and router files. Enforces a strict versioning contract — once an API version is released, it cannot be broken. New behaviors require new versions. Deprecation follows a documented sunset protocol.

#### Instruction File
`.fractal/instructions/standards/api-versioning-rules.instruction.md`

```yaml
---
name: API Versioning Rules
type: standards
description: Backward compatibility guarantees and version sunset protocol
paths:
  - src/features/**/controllers/*.ts
  - src/igniter.router.ts
---
```

```markdown
## Main Context
An API is a public contract with every client that depends on it. Breaking it silently is a critical trust violation. Versioning makes the contract explicit and gives dependents time to migrate.

### 1. No Breaking Changes on Existing Versions
**Rule**: **NEVER** remove, rename, or change the type of an existing field in a versioned API response. This is a breaking change.
**ALLOW** adding new optional fields to a response — consumers can safely ignore them.

### 2. New Version for Breaking Changes
**Rule**: **ALWAYS** introduce a new version (e.g., `/v2/memories`) when a breaking change is unavoidable. **NEVER** silently break the existing `/v1/` endpoints.

### 3. Deprecation Notices
**Rule**: **ALWAYS** add a `Deprecation` response header and a `deprecated: true` field in the response body for any endpoint that will be removed.
**WORKFLOW: Deprecation Protocol**:
1. Add `Deprecation` header with sunset date.
2. Log a warning on every call to the deprecated endpoint.
3. Open a migration guide issue on GitHub.
4. After the sunset date, return `410 Gone`.

### 4. Route Prefix Convention
**Rule**: **ALWAYS** prefix API routes with `/api/v[N]/` where `N` is the version integer.
**✅ Correct**: `/api/v1/memories`, `/api/v2/memories`
**❌ Incorrect**: `/api/memories`, `/memories`
```

#### CLI Creation Command
```bash
bun fractal instructions create \
  --name "API Versioning Rules" \
  --type standards \
  --description "Backward compatibility guarantees and version sunset protocol" \
  --paths "src/features/**/controllers/*.ts" "src/igniter.router.ts"
```

---

## Instruction Anatomy Quick Reference

```
.fractal/instructions/
├── standards/           # type: "standards" — "HOW to write code"
│   ├── naming-convention-enforcement.instruction.md
│   ├── typescript-strict-mode-rules.instruction.md
│   ├── documentation-requirements.instruction.md
│   └── ...
├── patterns/            # type: "patterns" — "WHAT pattern to implement"
│   ├── dependency-injection-patterns.instruction.md
│   └── ...
└── workflows/           # type: "workflows" — "IN WHAT ORDER to do things"
    ├── git-commit-message-conventions.instruction.md
    ├── migration-protocol.instruction.md
    └── ...
```

### ID Derivation Table

| `name` field | Auto-derived `id` |
|---|---|
| `"Feature Architecture Standards"` | `feature-architecture-standards` |
| `"Git Commit Message Conventions"` | `git-commit-message-conventions` |
| `"TypeScript Strict Mode Rules"` | `typescript-strict-mode-rules` |
| `"API Versioning Rules"` | `api-versioning-rules` |

### Glob Scoping Precision Guide

| Scope | Pattern | When to Use |
|---|---|---|
| Entire workspace | `**/*` | Security rules, Git conventions |
| All TypeScript | `src/**/*.ts` | Type safety, naming, logging |
| Feature layer | `src/features/**/*.ts` | Architecture, DI, errors |
| Controllers only | `src/features/**/controllers/*.ts` | API design, HTTP verbs |
| Collections only | `src/features/**/collections/*.ts` | Query optimization, schemas |
| Test files | `src/**/*.test.ts` | Coverage, naming |
| UI layer | `src/**/*.tsx` | Component rules, Tailwind |
| Configuration | `src/@core/config.*.ts` | Env vars, feature flags |
| Router | `src/igniter.router.ts` | Versioning, route registration |

---

## Proactive Checklist for Instruction Creation

Before creating ANY instruction, ask yourself:

1. ✅ **Is this a recurring issue?** If I've corrected this more than once, it should be an instruction.
2. ✅ **What is the right scope?** Be surgical — global instructions cause noise; over-scoped ones miss their targets.
3. ✅ **Which type fits?** `standards` (how to code), `patterns` (what to implement), `workflows` (ordered process).
4. ✅ **Are my rules actionable?** Every rule needs a clear ✅ Correct and ❌ Incorrect example.
5. ✅ **Did I include Critical Checkpoints?** A numbered checklist agents can verify before saving.
6. ✅ **Is the ID predictable?** Verify: `name.toLowerCase().replace(/\s+/g, "-")`.
7. ✅ **Is there a Mental Model section?** An analogy or metaphor helps agents internalize the rule, not just memorize it.
