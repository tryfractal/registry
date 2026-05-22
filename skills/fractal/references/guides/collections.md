# Building Collections in Fractal

This guide explains how to create, structure, and optimize Custom Collections within the Fractal ecosystem using the `FractalCollection` builder (`@/src/@core/builders/collection.builder.ts`) and the underlying `@igniter-js/collections` package.

## 1. Architecture Overview

Collections in Fractal follow a **clean architecture** with clear separation of concerns:

```
User Request → Controller → Procedure → @igniter-js/collections Manager → Adapter → Filesystem
                                        ↕
                                   Collection Hooks (business logic)
                                        ↕
                                   FractalCollection (Zod schema + patterns)
```

### Key Concepts

| Concept | Description | Location |
|---------|-------------|----------|
| **Schema** | Zod v4 schema defining record structure | `schema.ts` |
| **Patterns** | File path template for record storage | `{id}.{collection}.json` |
| **Hooks** | Lifecycle interceptors (onCreated, onUpdated, etc.) | In `schema.ts` |
| **Manager** | Operational CRUD instance | `workspace.core.collections.get(name)` |
| **Adapter** | Storage backend (BunFsAdapter by default) | Configured at init |

### Fractal Wrappers vs Native @igniter-js/collections

Fractal provides two builders that wrap `@igniter-js/collections` with automatic context injection:

| Fractal Builder | Native Builder | What It Adds |
|----------------|---------------|-------------|
| `FractalCollection` (`@/core/builders/collection.builder`) | `IgniterCollectionModel` | Automatic `fractal` + `workspace` injection in hooks |
| `FractalView` (`@/core/builders/view.builder`) | `IgniterCollectionView` | Automatic `fractal` + `workspace` injection in getData |

**Always use Fractal builders in Fractal projects.** The native builders lack the `fractal` runtime context.

---

## 2. Collection Directory Structure

```
.fractal/collections/[collection-name]/
├── schema.ts              # FractalCollection definition (Zod schema + patterns + hooks)
└── data/
    ├── {uuid}.{name}.json # Individual records (auto-created)
    └── {uuid}.{name}.md   # Markdown records (if format: "md")
```

Records are stored with UUID-based filenames matching the pattern:
```
.fractal/collections/movies/data/{id}.movies.json
```

---

## 3. FractalCollection Builder API

### Creating a Collection (TypeScript)

```typescript
// .fractal/collections/[name]/schema.ts
import z from "zod";
import { FractalCollection } from "@fractal-os/plugin";
import { randomUUID } from "crypto";

export default FractalCollection.create("posts")
  .withIdGenerator(randomUUID)
  .withPatterns([".fractal/collections/posts/data/{id}.posts.json"])
  .withSchema(
    z.object({
      title: z.string().describe("Post title"),
      content: z.string().describe("Markdown content"),
      published: z.boolean().default(false).describe("Publication status"),
      tags: z.array(z.string()).default([]).describe("Content tags"),
      author: z.string().describe("Author name"),
      createdAt: z.string().datetime().optional().describe("Creation timestamp"),
    }),
  )
  .onCreated(async ({ value, fractal, workspace }) => {
    // Auto-set timestamp
    return { ...value, createdAt: new Date().toISOString() };
  })
  .onUpdated(async ({ value, previousValue, fractal, workspace }) => {
    // Prevent unpublishing
    if (previousValue.published && !value.published) {
      return false; // Abort
    }
    return value;
  })
  .build();
```

### Builder Methods

| Method | Description | Required? |
|--------|-------------|-----------|
| `create(name)` | Start building a collection with name (slug) | ✅ Yes |
| `withIdGenerator(fn)` | Set ID generator (default: `randomUUID`) | ✅ Recommended |
| `withPatterns(patterns[])` | File path templates for record storage | ✅ Yes |
| `withSchema(zodSchema)` | Zod v4 schema for validation | ✅ Yes |
| `onCreated(hook)` | Hook after creation, before persistence | ❌ No |
| `onUpdated(hook)` | Hook after read, before persistence | ❌ No |
| `onDeleted(hook)` | Hook before deletion | ❌ No |
| `onList(hook)` | Hook after listing, before return | ❌ No |
| `onRead(hook)` | Hook after single read, before return | ❌ No |
| `build()` | Return immutable collection definition | ✅ Yes |

### Hook Context Interface

```typescript
interface FractalCollectionHookContext<TSchema> {
  value: TSchema;
  workspace: FractalWorkspaceRuntime;
  fractal: FractalInstance;
}
```

**`workspace`** gives you access to:
- `workspace.core.collections.get("name")` — any collection manager
- `workspace.core.collections.list()` — all collection definitions
- `workspace.core.views.get("name")` — view instances
- `workspace.tasks`, `workspace.memories`, `workspace.skills`, etc. — all services

**`fractal`** gives you access to:
- `fractal.workspaces` — resolve/manage workspaces
- `fractal.config` — global configuration
- `fractal.logger` — structured logging

---

## 4. Zod v4 Schema Cheatsheet

### Primitive Types

```typescript
z.string()                        // Any string
z.number()                        // Any number (float)
z.number().int()                  // Integer only
z.boolean()                       // True/false
z.date()                          // Date object (not serializable to JSON)
z.string().datetime()             // ISO 8601 datetime string
z.string().email()                // Email format
z.string().uuid()                 // UUID format
z.string().url()                  // URL format
```

### Constraints

```typescript
z.string().min(3).max(100)            // String length
z.number().min(0)                     // Minimum value
z.number().max(100)                   // Maximum value
z.number().min(0).max(100)            // Range
z.string().regex(/^[a-z]+$/)          // Pattern matching
z.array(z.string()).min(1)            // Array minimum length
z.array(z.string()).max(10)           // Array maximum length
z.array(z.string()).nonempty()        // Array non-empty (shorthand for .min(1))
```

### Optional & Defaults

```typescript
z.string().optional()              // Field is not required
z.boolean().default(false)         // Default value if omitted
z.number().optional().default(0)   // Optional with default
z.string().nullable()              // Value can be null
```

### Enums

```typescript
z.enum(["draft", "published", "archived"])
z.enum(["low", "medium", "high"])
```

### Nested Objects

```typescript
z.object({
  name: z.string(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    zipCode: z.string().optional(),
  }).optional(),
  metadata: z.record(z.unknown()).optional(),
})
```

### Arrays

```typescript
z.array(z.string())                    // Array of strings
z.array(z.object({ name: z.string() })) // Array of objects
z.string().array()                     // Alternative syntax
```

### Unions & Discriminated Unions

```typescript
z.union([z.string(), z.number()])
z.discriminatedUnion("type", [
  z.object({ type: z.literal("text"), content: z.string() }),
  z.object({ type: z.literal("image"), url: z.string(), alt: z.string() }),
])
```

### Transformations

```typescript
z.string().transform(val => val.toLowerCase())
z.string().pipe(z.coerce.date())
z.number().transform(n => Math.round(n * 100) / 100)
```

### Describe (Documentation)

Always use `.describe()` for self-documenting schemas:
```typescript
z.string().describe("The post title (max 200 chars)"),
z.number().min(0).describe("Price in cents"),
```

---

## 5. Query Patterns

### Basic CRUD (via workspace.core.collections)

```typescript
// Create
const record = await workspace.core.collections.get("movies").create({
  data: { title: "Inception", year: 2010, genre: "Sci-Fi" },
});

// Read one
const movie = await workspace.core.collections.get("movies").findUnique({
  where: { id: "abc-123" },
});

// Read many
const movies = await workspace.core.collections.get("movies").findMany({
  where: { genre: "Sci-Fi" },
  orderBy: { year: "desc" },
  take: 10,
  skip: 0,
});

// Count
const count = await workspace.core.collections.get("movies").count({
  where: { genre: "Sci-Fi" },
});

// Update
const updated = await workspace.core.collections.get("movies").update({
  where: { id: "abc-123" },
  data: { rating: 9.0 },
});

// Delete
await workspace.core.collections.get("movies").delete({
  where: { id: "abc-123" },
});
```

### Filter Operators (where clause)

```typescript
// Equality
{ status: "published" }

// Contains (string)
{ title: { contains: "TypeScript" } }

// Starts with / Ends with
{ slug: { startsWith: "getting-started" } }
{ email: { endsWith: "@example.com" } }

// Greater than / Less than
{ year: { gte: 2000, lte: 2025 } }
{ rating: { gt: 7 } }

// In array
{ genre: { in: ["Sci-Fi", "Drama"] } }

// Array has
{ tags: { has: "featured" } }
{ tags: { hasEvery: ["ts", "node"] } }
{ tags: { hasSome: ["tutorial", "guide"] } }

// Full-text search
{
  search: {
    term: "typescript tutorial",
    fields: { title: { weight: 3 }, content: { weight: 1 } },
    threshold: 0.1,
    fuzzy: true,
  }
}
```

### Events

```typescript
// Subscribe to collection events
const sub = workspace.core.collections.get("movies").on("created", ({ value }) => {
  console.log(`Movie created: ${value.title}`);
});
sub.off(); // Unsubscribe

// Global events (all collections)
workspace.core.on("created", ({ collection, value }) => {
  console.log(`New record in ${collection}: ${value.id}`);
});
```

---

## 6. Hook Patterns & Best Practices

### Pattern 1: Auto-Timestamps
```typescript
.onCreated(async ({ value }) => ({
  ...value,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
}))
.onUpdated(async ({ value }) => ({
  ...value,
  updatedAt: new Date().toISOString(),
}))
```

### Pattern 2: Soft Delete
```typescript
.onDeleted(async ({ value, workspace }) => {
  // Instead of deleting, mark as deleted
  await workspace.core.collections.get("movies").update({
    where: { id: value.id },
    data: { deletedAt: new Date().toISOString() },
  });
  return false; // Prevent actual deletion
})
```

### Pattern 3: Audit Trail
```typescript
.onCreated(async ({ value, workspace }) => {
  await workspace.core.collections.get("audit").create({
    data: {
      collection: "movies",
      action: "created",
      documentId: value.id,
      timestamp: new Date().toISOString(),
    }
  });
  return value;
})
```

### Pattern 4: Slug Generation
```typescript
.onCreated(async ({ value }) => {
  const slug = value.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return { ...value, slug };
})
```

### Pattern 5: Cross-Collection Referential Integrity
```typescript
.onDeleted(async ({ value, workspace }) => {
  // Cascade delete related records
  const related = await workspace.core.collections.get("comments").findMany({
    where: { movieId: value.id },
  });
  for (const comment of related) {
    await workspace.core.collections.get("comments").delete({ where: { id: comment.id } });
  }
  return true;
})
```

### Pattern 6: Validation on Update
```typescript
.onUpdated(async ({ value, previousValue }) => {
  // Prevent status regression
  const validTransitions = {
    draft: ["review"],
    review: ["published", "draft"],
    published: ["archived"],
    archived: [],
  };
  const allowed = validTransitions[previousValue.status] || [];
  if (!allowed.includes(value.status)) {
    return false; // Invalid transition
  }
  return value;
})
```

---

## 7. Collection vs Other Storage Options

| Need | Use |
|------|-----|
| Structured domain data (contacts, tasks, inventory) | **Collection** |
| Agent memory across sessions | `memories` feature |
| App configuration | `config` feature |
| Cache / temporary data | In-memory Map or Redis adapter |
| File uploads / binary | `files` feature |
| Logs / telemetry | `events` feature + Logger |

---

## 8. Performance and Limits

- **Records per collection:** No hard limit (filesystem-limited)
- **Query filter operations:** In-memory (all records loaded, then filtered)
- **Best for:** Up to ~10,000 records per collection
- **For larger datasets:** Consider Redis or S3 adapter
- **Search:** BM25 full-text search with MiniSearch index (built per query)
- **File watching:** Auto-reload when files change via Bun's `fs.watch`
