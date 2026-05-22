# Building Views in Fractal

This guide explains how to create, structure, and optimize Views within the Fractal ecosystem using the `FractalView` builder (`@/src/@core/builders/view.builder.ts`) and the underlying `@igniter-js/collections` Views v2.0 system.

## 1. Architecture Overview

Views in Fractal are **global, independent entities** that render data-driven UIs. They are not bound to any single collection — they can access all collections, external APIs, and workspace services.

```
User visits URL → View Renderer loads view → getData hook executes
                                              ↓
                              Returns { items, stats, extra }
                                              ↓
                              Component tree renders with resolved valuePaths
                                              ↓
                              User sees dashboard / table / chart
```

### Key Characteristics

| Property | Description |
|----------|-------------|
| **Global** | Views live in `.fractal/views/`, independent of any collection |
| **Mandatory getData** | Every view MUST define `getData` — throws `VIEW_INVALID_CONFIGURATION` otherwise |
| **Multi-source** | Access any collection, external API, or service in `getData` |
| **Declarative tree** | UI is defined as a JSON-like tree, not React code |
| **valuePath binding** | Use `/stats/key`, `/items`, `/extra/key` to connect data to components |
| **Actions** | Optional interactive actions with parameter validation and confirmation dialogs |

---

## 2. View File Location

```
.fractal/views/
├── movies-dashboard.view.ts      # Workspace-level views
├── financas-dashboard.view.ts
└── pull-requests.view.ts

.fractal/skills/[skill]/views/
└── skill-specific.view.ts        # Skill-scoped views
```

File naming: `[view-name].view.ts`. The view name must match the first argument to `FractalView.create()`.

---

## 3. FractalView Builder API

### Complete Example

```typescript
// .fractal/views/movies-dashboard.view.ts
import { FractalView } from "@fractal-os/plugin";

export default FractalView.create("movies-dashboard")
  .withTitle("Movies Dashboard")
  .withDescription("Browse and analyze your movie collection")
  .withMetadata({ icon: "Film", order: 1 })
  .withData(async ({ workspace, options, fractal }) => {
    // Fetch data from collection
    const movies = await workspace.core.collections
      .get("movies")
      .findMany({ take: 100 });

    const items = movies.map(m => ({
      id: m.id,
      title: m.title,
      year: m.year,
      genre: m.genre,
      rating: m.rating,
    }));

    // Compute stats
    const avgRating = items.length > 0
      ? (items.reduce((s, m) => s + m.rating, 0) / items.length).toFixed(1)
      : "—";

    const genres = [...new Set(items.map(m => m.genre))];
    const genreCounts = genres.map(g => ({
      name: g,
      count: items.filter(m => m.genre === g).length,
    }));

    return {
      items,
      stats: {
        total: items.length,
        avgRating,
        genreCount: genres.length,
      },
      extra: {
        genreDistribution: genreCounts,
        lastFetched: new Date().toISOString(),
      },
    };
  })
  .withTree([
    {
      component: "Hero",
      props: { title: "Movies Dashboard", description: "Your movie collection" },
    },
    {
      component: "Section",
      props: { title: "Overview", description: "Key metrics" },
      children: [{
        component: "Grid",
        props: { columns: 3 },
        children: [
          { component: "Metric", props: { title: "Total Movies", icon: "Film" }, valuePath: "/stats/total" },
          { component: "Metric", props: { title: "Avg Rating", icon: "Star" }, valuePath: "/stats/avgRating" },
          { component: "Metric", props: { title: "Genres", icon: "Tags" }, valuePath: "/stats/genreCount" },
        ],
      }],
    },
    {
      component: "Section",
      props: { title: "All Movies" },
      children: [{
        component: "Table",
        props: {
          columns: [
            { key: "title", label: "Title" },
            { key: "year", label: "Year" },
            { key: "genre", label: "Genre" },
            { key: "rating", label: "Rating" },
          ],
        },
        valuePath: "/items",
      }],
    },
  ])
  .build();
```

### Builder Methods

| Method | Description | Required? |
|--------|-------------|-----------|
| `create(name)` | Start building a view with unique name | ✅ Yes |
| `withTitle(title)` | Display title | ✅ Recommended |
| `withDescription(desc)` | Subtitle/description text | ❌ No |
| `withMetadata(obj)` | Free-form metadata (`icon`, `order`, `color`, etc.) | ❌ No |
| `withData(hook)` | Async hook returning `{ items, stats?, extra? }` | ✅ **Mandatory** |
| `withTree(nodes[])` | Component tree defining the UI structure | ✅ Yes |
| `addAction(name, def)` | Add an interactive action | ❌ No |
| `build()` | Return immutable view definition | ✅ Yes |

### getData Context

```typescript
interface FractalViewDataHookContext {
  workspace: FractalWorkspaceRuntime;
  fractal: FractalInstance;
  options?: {
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
    skip?: number;
  };
}
```

### getData Return Shape

```typescript
{
  items: unknown[];                   // Main data array (for Tables, Kanban boards, etc.)
  stats?: Record<string, unknown>;    // KPI values (for Metric components)
  extra?: Record<string, unknown>;    // Auxiliary data (for Charts, Timelines, etc.)
}
```

---

## 4. Complete Component Reference

### Hero
Page header with title and description.
```typescript
{ component: "Hero", props: {
  title: "Dashboard Title",
  description: "Optional subtitle text",
}}
```

### Metric
KPI card with value, icon, and optional trend indicator.
```typescript
{ component: "Metric", props: {
  title: "Total Users",       // Display label
  icon: "Users",              // Lucide icon name (string, not component)
  trend: {                    // Optional trend indicator
    value: 12.5,              // Percentage change
    direction: "up",          // "up" | "down" | "neutral"
  },
}, valuePath: "/stats/totalUsers" }
```

**valuePath:** `/stats/keyName` — the numeric value to display.

### Table
Tabular data display with configurable columns.
```typescript
{ component: "Table", props: {
  columns: [
    { key: "title", label: "Title" },
    { key: "year", label: "Year" },
    { key: "rating", label: "Rating" },
  ],
}, valuePath: "/items" }
```

**valuePath:** `/items` or `/extra/someArray` — the array of objects to render.

### Chart
Data visualization (bar, line, pie, area, donut, funnel).
```typescript
{ component: "Chart", props: {
  type: "pie",                // "bar" | "line" | "pie" | "area" | "donut" | "funnel"
  data: "/extra/chartData",   // Array of { name, value/count }
}}
```

**Data format:** `[{ name: "Category", count: 10, value: 100 }, ...]`
- Pie/Donut: uses `name` + `value` (or `count`)
- Bar/Line/Area: uses `name` as X-axis, other numeric keys as Y-series

### Grid
Responsive grid layout container.
```typescript
{ component: "Grid", props: {
  columns: 3,                 // Number of columns
  gap: "md",                  // "sm" | "md" | "lg"
}, children: [
  { component: "Metric", ... },
  { component: "Metric", ... },
]}
```

### Section
Grouped content block with header.
```typescript
{ component: "Section", props: {
  title: "Overview",
  description: "Key metrics at a glance",
}, children: [ ... ] }
```

### Card
Card container with optional header.
```typescript
{ component: "Card", props: {
  title: "Revenue Chart",
  description: "Monthly breakdown",
}, children: [
  { component: "Chart", ... },
]}
```

### Badge
Status/tag label with color variants.
```typescript
{ component: "Badge", props: {
  label: "Active",            // Display text or valuePath
  variant: "success",         // "default" | "secondary" | "outline" | "destructive" | "success" | "warning"
}}
```

### StatusBadge
Auto-colored badge based on status string.
```typescript
{ component: "StatusBadge", props: {
  status: "paid",             // Status string (color auto-mapped)
}}
```

### Text
Labeled text display.
```typescript
{ component: "Text", props: {
  label: "Email",             // Label text
  value: "user@example.com",  // Display value (or valuePath)
  variant: "default",         // "default" | "muted" | "secondary"
}}
```

### Alert
Notification/warning banner with optional action.
```typescript
{ component: "Alert", props: {
  title: "Low Stock",
  message: "5 items below minimum",
  variant: "warning",         // "default" | "info" | "success" | "warning" | "destructive"
  action: { label: "View", action: "viewLowStock" },
}}
```

### Button
Interactive button that triggers a view action.
```typescript
{ component: "Button", props: {
  label: "Export CSV",
  action: "export",           // Must match an action defined with addAction()
  variant: "default",         // "default" | "outline" | "ghost" | "destructive"
  size: "default",            // "default" | "sm" | "lg" | "icon"
}}
```

### Timeline
Chronological activity/event feed.
```typescript
{ component: "Timeline", props: {
  direction: "vertical",      // "vertical" | "horizontal"
  showContact: false,
  showType: true,
}}
// Data comes from extra (auto-reads from data.extra)
```

### Kanban
Drag-drop board with configurable columns.
```typescript
{ component: "Kanban", props: {
  columns: [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
  ],
  groupBy: "status",          // Field name to group records by
  cardProps: ["title", "priority", "assignee"],  // Fields to show on each card
  view: "task-detail",        // Optional view name to navigate to on click
}}
```

### Form
Dynamic form with schema validation.
```typescript
{ component: "Form", props: {
  schema: {                   // JSON Schema for form fields
    type: "object",
    properties: {
      name: { type: "string", label: "Name" },
      email: { type: "string", format: "email", label: "Email" },
    },
    required: ["name", "email"],
  },
  action: "createContact",    // Action to execute on submit
  submitLabel: "Save",
}}
```

---

## 5. valuePath Binding System

valuePaths use JSON Pointer-like paths to resolve data from the `getData` return:

```
getData returns: {
  items: [...],
  stats: { total: 100, avgRating: 8.5 },
  extra: { chartData: [...], metadata: {...} },
}

/stats/total           → 100
/stats/avgRating       → 8.5
/items                 → [...]
/extra/chartData       → [...]
/extra/metadata/key    → value (nested access)
```

### Where valuePath Works

| Component | valuePath usage |
|-----------|----------------|
| Metric | `valuePath` → single numeric/string value from stats/extra |
| Table | `valuePath` → array of objects (usually `/items`) |
| Chart | `data` prop as string → array from extra (e.g., `"/extra/chartData"`) |
| Badge | Label can be resolved from data |
| Text | Value can be resolved from data |

---

## 6. View Actions

Actions add interactivity to views — export, create, delete, approve, etc.

### Action Definition

```typescript
.addAction("export", {
  description: "Export movies to CSV",
  confirm: {                              // Optional confirmation dialog
    title: "Export Movies",
    message: "This will download all movies as CSV",
    variant: "default",
  },
  handler: async ({ manager, params }) => {
    const movies = await manager.collections.get("movies").findMany();
    // ... generate CSV
    return { success: true, fileUrl: "/downloads/movies.csv" };
  },
  optimisticUpdate: ({ items, params }) => {
    return items.map(item => ({ ...item, exporting: true }));
  },
})
```

### Action Properties

| Property | Description | Required? |
|----------|-------------|-----------|
| `description` | What the action does | ✅ Yes |
| `params` | Zod schema for validated parameters | ❌ No |
| `confirm` | Confirmation dialog config | ❌ No |
| `handler` | Async function: `({ manager, params }) => ActionResult` | ✅ Yes |
| `optimisticUpdate` | Sync function to update UI before handler completes | ❌ No |

### Triggering Actions from Components

```typescript
// Button triggers an action
{ component: "Button", props: { label: "Export", action: "export" } }

// Alert can have an action button
{ component: "Alert", props: {
  title: "Warning",
  action: { label: "Fix Now", action: "resolveIssue" },
}}

// Form submits to an action
{ component: "Form", props: { action: "createRecord", submitLabel: "Save" } }
```

---

## 7. Composition Patterns

### Pattern 1: Multi-Source Dashboard
```typescript
.withData(async ({ workspace }) => {
  const [customers, orders, support] = await Promise.all([
    workspace.core.collections.get("customers").findMany(),
    workspace.core.collections.get("orders").findMany(),
    workspace.core.collections.get("support").findMany({ where: { status: "open" } }),
  ]);

  const revenue = orders
    .filter(o => o.status === "completed")
    .reduce((sum, o) => sum + o.total, 0);

  return {
    items: orders,
    stats: {
      totalCustomers: customers.length,
      totalOrders: orders.length,
      revenue,
      openTickets: support.length,
    },
  };
})
```

### Pattern 2: External API + Collection
```typescript
.withData(async ({ workspace }) => {
  // Combine local data with external API
  const [localEvents, externalWeather] = await Promise.all([
    workspace.core.collections.get("events").findMany({ take: 50 }),
    fetch("https://api.weather.gov/gridpoints/TOP/31,80/forecast").then(r => r.json()),
  ]);

  return {
    items: localEvents,
    stats: { eventCount: localEvents.length },
    extra: { weather: externalWeather },
  };
})
```

### Pattern 3: Aggregated View with Transforms
```typescript
.withData(async ({ workspace }) => {
  const sales = await workspace.core.collections.get("sales").findMany();

  // Group sales by month
  const byMonth = sales.reduce((acc, sale) => {
    const month = sale.date?.substring(0, 7) ?? "unknown";
    acc[month] = (acc[month] || 0) + sale.amount;
    return acc;
  }, {});

  const chartData = Object.entries(byMonth).map(([name, total]) => ({
    name, total,
  }));

  return {
    items: sales,
    stats: {
      totalRevenue: Object.values(byMonth).reduce((a, b) => a + b, 0),
    },
    extra: { monthlyRevenue: chartData },
  };
})
```

---

## 8. Best Practices

### DO:
- ✅ **Use `Promise.all`** for parallel data fetching in `getData`
- ✅ **Handle empty states** — components like Table and Metric gracefully handle no data
- ✅ **Use meaningful stats** — compute only what you'll display
- ✅ **Choose icons from Lucide** — any Lucide icon name works
- ✅ **Use `.describe()`** in schemas for auto-documentation
- ✅ **Organize with Section** — group related content for readability
- ✅ **Use valuePath** for dynamic data, static strings for labels

### DON'T:
- ❌ **Don't make getData too heavy** — it blocks rendering until complete
- ❌ **Don't return raw API responses** — transform data into your view's shape
- ❌ **Don't use `any`** — types flow from the Zod schema
- ❌ **Don't nest too deeply** — keep the tree max 4 levels deep
- ❌ **Don't forget to handle errors** — `getData` errors are caught and displayed

### Performance Tips:
- Use `take` to limit record counts
- Use `select` to fetch only needed fields
- Cache external API responses if appropriate
- Consider pagination for large datasets

---

## 9. Migration from JSON to TypeScript Views

JSON views are still supported but TypeScript is preferred:

```jsonc
// OLD: .fractal/views/dashboard.view.json
{
  "name": "dashboard",
  "title": "Dashboard",
  "getData": "./hooks/dashboard.ts",     // External hook file
  "tree": [...]
}
```

```typescript
// NEW: .fractal/views/dashboard.view.ts
import { FractalView } from "@fractal-os/plugin";

export default FractalView.create("dashboard")
  .withTitle("Dashboard")
  .withData(async ({ workspace }) => {
    // Inline data logic — no external hook file needed
    return { items: [], stats: {} };
  })
  .withTree([...])
  .build();
```

**Benefits of TypeScript:** Type safety, inline data logic, import reuse, hot reload, IDE autocomplete.
