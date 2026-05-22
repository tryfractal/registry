# The Structured Universe: Collection Discovery & Proactivity

Welcome to the persistent data layer of the Fractal Operating System. As an AI Agent, you are traditionally an amnesiac — forgetting everything the moment a chat ends. Collections shatter this limitation. Through **Fractal Custom Collections**, you have persistent, schema-validated, queryable storage that survives across sessions, enabling true long-term reasoning and autonomous data management.

## Why This Document Exists

This document is designed to expand your understanding of what Collections can do beyond simple CRUD. Collections in Fractal are built on `@igniter-js/collections`, a **universal ORM for content-driven applications** that treats files (JSON, Markdown) as structured data with a Prisma-like query API.

You are not limited to storing flat key-value pairs. You can define complex Zod schemas with nested objects, arrays, enums, refined types, defaults, and transformations. You can attach lifecycle hooks that execute custom logic on every CRUD operation. You can use full-text search with BM25 ranking. You can query with Prisma-like operators: `contains`, `in`, `gt`, `lt`, `gte`, `lte`, `has`, `hasEvery`, `hasSome`, `startsWith`, `endsWith`, `search`.

**This document exists to show you that Collections are the foundation of agentic persistence. Every project, every workspace, every skill should use Collections as its data backbone.**

## The Mindset Shift

1. **Never use raw JSON files.** Collections provide type safety, validation, and queryability that raw files lack.
2. **Schema-first thinking.** Before storing any data, define its shape with Zod. The schema is the source of truth — it drives autocomplete, validation, and documentation.
3. **Hooks as business logic.** Use `onCreated`, `onUpdated`, `onDeleted`, `onRead`, `onList` to implement domain rules (auto-timestamps, audit trails, cascading operations, access control).
4. **Collections are file-based.** Every record is a standalone file on disk. This means they're git-friendly, human-readable, and survive any system migration. No database server required.
5. **Views are the visualization layer.** Collections store and query data; Views render it. Design them as complementary tools in your architecture.

## Core Concepts from @igniter-js/collections

### Builder Pattern (Immutable)
```typescript
import { FractalCollection } from "@fractal-os/plugin";
import { z } from "zod";

export default FractalCollection.create("contacts")
  .withIdGenerator(randomUUID)          // UUID v4 by default
  .withPatterns([".fractal/collections/contacts/data/{id}.contacts.json"])
  .withSchema(z.object({
    name: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
  }))
  .onCreated(async ({ value, fractal, workspace }) => {
    // fractal: full Fractal runtime (workspaces, config, logger)
    // workspace: resolved workspace (all services, collections)
    return value; // always return the value
  })
  .build();
```

### FractalCollection Hook Context
```typescript
interface FractalCollectionHookContext<TSchema> {
  value: TSchema;                        // The record data (typed by schema)
  workspace: FractalWorkspaceRuntime;    // All workspace services + core
  fractal: FractalInstance;             // Global Fractal runtime
}
```

- `onCreated`: `{ value, workspace, fractal }` → return modified value
- `onUpdated`: `{ value, previousValue, workspace, fractal }` → return modified value
- `onDeleted`: `{ value, workspace, fractal }` → return `true` to proceed, `false` to abort
- `onList`: `{ value: items[], query?, workspace, fractal }` → return filtered array
- `onRead`: `{ value, workspace, fractal }` → return modified value

### Query Engine (Prisma-like)
```typescript
// From any service or view getData
const records = await workspace.core.collections.get("contacts").findMany({
  where: {
    name: { contains: "Silva" },
    age: { gte: 18, lt: 65 },
    tags: { has: "vip" },
    status: { in: ["active", "pending"] },
  },
  orderBy: { createdAt: "desc" },
  take: 50,
  skip: 0,
});

const single = await workspace.core.collections.get("contacts").findUnique({
  where: { id: "abc-123" },
});

const count = await workspace.core.collections.get("contacts").count({
  where: { status: "active" },
});
```

### Namespace API
```typescript
manager.collections.get("name")    // Get collection manager
manager.collections.list()         // Array of definitions
manager.collections.entries()      // Map of definitions
manager.views.get("name")          // View instance with .render()
manager.watcher.start()            // Start file watching
manager.on("created", (ctx) => {}) // Global event listener
```

---

## Discovery Examples: 20 Ways to Use Collections

### Example 01: Automated Audit Trail with Global Hooks

#### Introduction
Every workspace needs an audit trail — a record of who did what and when. Instead of writing audit logic in every service, use a global collection with hooks that automatically intercept all CRUD operations across all collections.

#### Capabilities Used
- **Collections** (audit records)
- **Lifecycle Hooks** (onCreated, onUpdated, onDeleted)
- **Cross-collection operations** (hook writes to audit collection)
- **Full-text search** (query audit history)

#### Implementation Sketch
```typescript
// `.fractal/collections/audit/schema.ts`
export default FractalCollection.create("audit")
  .withPatterns([".fractal/collections/audit/data/{id}.audit.json"])
  .withSchema(z.object({
    collection: z.string(),       // Which collection was modified
    action: z.enum(["created", "updated", "deleted"]),
    documentId: z.string(),       // ID of the modified record
    timestamp: z.string().datetime(),
    actor: z.string(),            // Agent or user who performed the action
    changes: z.record(z.unknown()).optional(),
  }))
  .build();
```

Then in your collection hooks:
```typescript
.onCreated(async ({ value, workspace }) => {
  await workspace.core.collections.get("audit").create({
    data: { collection: "contacts", action: "created", documentId: value.id, ... }
  });
  return value;
})
```

---

### Example 02: Multi-Collection CRM with Cross-References

#### Introduction
Build a CRM system where Contacts, Deals, and Activities are separate collections with bidirectional references. Use hooks to maintain referential integrity and cascade deletions.

#### Capabilities Used
- **Multiple Collections** (contacts, deals, activities)
- **Nested Zod Schemas** (addresses, metadata)
- **onDeleted Hook** (cascade cleanup)
- **Aggregation Queries** (count deals per contact)

#### Schema Sketch
```typescript
// contacts
z.object({
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  company: z.string().optional(),
  tags: z.array(z.string()).default([]),
  address: z.object({
    street: z.string(),
    city: z.string(),
    country: z.string(),
  }).optional(),
})

// deals
z.object({
  title: z.string(),
  contactId: z.string(),      // Reference to contacts
  value: z.number().min(0),
  stage: z.enum(["lead", "qualified", "proposal", "negotiation", "closed-won", "closed-lost"]),
  expectedCloseDate: z.string().optional(),
})

// activities
z.object({
  type: z.enum(["call", "email", "meeting", "note"]),
  contactId: z.string(),
  dealId: z.string().optional(),
  description: z.string(),
  createdAt: z.string().datetime(),
})
```

---

### Example 03: Content Management System with Draft/Publish Workflow

#### Introduction
Use collection hooks to enforce a content workflow: drafts can't be published without review, published content can't be un-published directly, and every state change is logged.

#### Capabilities Used
- **Schema enums** (status: draft, review, published, archived)
- **onCreated Hook** (auto-set status to draft)
- **onUpdated Hook** (state machine validation)
- **onList Hook** (filter out drafts from public access)

#### Implementation
```typescript
.onCreated(async ({ value, workspace }) => {
  return { ...value, status: "draft", createdAt: new Date().toISOString() };
})
.onUpdated(async ({ value, previousValue }) => {
  // Prevent unpublishing approved content
  if (previousValue.status === "published" && value.status === "draft") {
    return false; // Abort the update
  }
  // Require review before publishing
  if (previousValue.status === "draft" && value.status === "published") {
    return false; // Must go through "review" first
  }
  return { ...value, updatedAt: new Date().toISOString() };
})
.onList(async ({ value, query }) => {
  // Public API: only show published items
  if (!query?.includeAll) {
    return value.filter(item => item.status === "published");
  }
  return value;
})
```

---

### Example 04: Financial Ledger with Auto-Calculations

#### Introduction
Build a personal finance tracker where transactions automatically update category balances, detect overdue payments, and generate monthly summaries — all through collection hooks.

#### Capabilities Used
- **Numeric validation** (min, max)
- **Date validation**
- **onCreated Hook** (update category balance)
- **onList Hook** (calculate totals)
- **Aggregation with findMany**

#### Schema
```typescript
z.object({
  description: z.string(),
  amount: z.number(),
  type: z.enum(["income", "expense"]),
  category: z.string(),
  date: z.string().datetime(),
  tags: z.array(z.string()).optional(),
  recurring: z.boolean().default(false),
})
```

---

### Example 05: Agent Knowledge Base with Full-Text Search

#### Introduction
Use collections as a persistent knowledge base for AI agents. Store learnings, decisions, and context with BM25-powered full-text search for semantic retrieval.

#### Capabilities Used
- **Full-Text Search** (BM25 ranking with fuzzy matching)
- **Markdown format** (rich content bodies)
- **onCreated Hook** (auto-generate embeddings placeholder)
- **Search operators** (field weights, threshold)

#### Query Example
```typescript
const results = await workspace.core.collections.get("knowledge").findMany({
  where: {
    search: {
      term: "zod validation pattern",
      fields: {
        title: { weight: 3, fuzzy: true },
        content: { weight: 1, fuzzy: true },
        tags: { weight: 2, fuzzy: false },
      },
      threshold: 0.1,
      fuzzy: true,
    },
  },
  take: 10,
});
```

---

### Example 06: Event Sourcing with Append-Only Log

#### Introduction
Implement event sourcing where every state change is recorded as an immutable event. The current state is derived by replaying events in order.

#### Capabilities Used
- **Immutable records** (never update, only create)
- **onUpdated Hook** (block updates, force new events)
- **onDeleted Hook** (block deletions)
- **orderBy** (replay in sequence)

---

### Example 07: Multi-Tenant Data Isolation

#### Introduction
Use collection patterns with dynamic path variables to isolate data per workspace or tenant. Each tenant's data lives in separate directories without code changes.

#### Capabilities Used
- **Pattern variables** (`{workspace}`, `{tenant}`)
- **Dynamic basePath**
- **Schema consistency** (same schema, different data)

#### Pattern
```typescript
.withPatterns([".fractal/workspaces/{workspace}/collections/contacts/data/{id}.json"])
```

---

### Example 08: Inventory Management with Reorder Alerts

#### Introduction
Track product inventory with automatic reorder alerts. When stock falls below minimum, create an alert record in another collection.

#### Capabilities Used
- **onUpdated Hook** (detect low stock)
- **Cross-collection create** (generate alerts)
- **Conditional logic** (only alert when threshold crossed)

---

### Example 09: Survey/Form Builder with Dynamic Schemas

#### Introduction
Store survey responses against a dynamic schema. The collection schema validates response structure while allowing flexible question types.

#### Capabilities Used
- **z.union() and z.discriminatedUnion()**
- **Nested conditionals**
- **Response validation**

---

### Example 10: Scheduled Tasks with Cron-Like Patterns

#### Introduction
Build a task scheduler where tasks have cron expressions, and a hook checks for due tasks on every list operation.

#### Capabilities Used
- **onList Hook** (filter due tasks)
- **Status lifecycle** (pending → running → completed → failed)
- **Repeating patterns** (daily, weekly, monthly)

---

## Collection Schema Design Patterns

### Pattern 1: Timestamp Mixin
Every collection benefits from automatic timestamps:
```typescript
z.object({
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
  deletedAt: z.string().datetime().optional(), // soft delete
})
```

### Pattern 2: Soft Delete
Instead of hard deletion, mark records as deleted:
```typescript
.onDeleted(async ({ value }) => {
  // Intercept deletion and mark as soft-deleted instead
  await manager.update({ where: { id: value.id }, data: { deletedAt: new Date().toISOString() } });
  return false; // Prevent actual deletion
})
```

### Pattern 3: Slug Generation
Auto-generate URL-friendly slugs from titles:
```typescript
.onCreated(async ({ value }) => {
  const slug = value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { ...value, slug };
})
```

### Pattern 4: Counter Cache
Maintain aggregated counts to avoid expensive queries:
```typescript
.onCreated(async ({ value, workspace }) => {
  const stats = await workspace.core.collections.get("_stats").findUnique({ where: { id: "global" } });
  await workspace.core.collections.get("_stats").update({
    where: { id: "global" },
    data: { totalRecords: (stats?.totalRecords ?? 0) + 1 }
  });
  return value;
})
```

### Pattern 5: Versioning
Keep a history of changes to every record:
```typescript
.onUpdated(async ({ value, previousValue, workspace }) => {
  await workspace.core.collections.get("_versions").create({
    data: {
      recordId: previousValue.id,
      previousData: previousValue,
      timestamp: new Date().toISOString(),
    }
  });
  return value;
})
```

---

## Proactive Checklist for Collection Creation

Before creating ANY collection, ask yourself:

1. ✅ **Is there already a collection for this domain?** Use `Fractal > Collections > List` to check.
2. ✅ **What's the right schema?** Use Zod v4 types — prefer `z.number().int()` over `z.integer()`, `z.string().email()` over `z.email()`.
3. ✅ **What format?** `json` for structured data, `md` for content-heavy records (blog posts, docs, knowledge).
4. ✅ **What hooks do I need?** Plan business logic before implementation.
5. ✅ **What's the query pattern?** If you need frequent filtering on a field, ensure it's indexed in the schema.
6. ✅ **Who owns it?** `workspace` scope for domain data, `skill` scope for skill-specific data.
7. ✅ **What's the naming convention?** Use kebab-case slugs (e.g., `blog-posts`, not `blogPosts`).
