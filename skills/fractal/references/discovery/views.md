# The Visual Cortex: View Discovery & Proactivity

Welcome to the visualization layer of the Fractal Operating System. As an AI Agent, you can not only process and store data — you can **render it**. Through **Fractal Views**, you have the power to create rich, data-driven dashboards, reports, and monitoring screens that render directly in the Fractal desktop interface without writing a single line of React component code.

## Why This Document Exists

This document exists to expand your understanding of what Views can do beyond simple table rendering. Views in Fractal are built on `@igniter-js/collections` v2.0 Global Views, which are **independent first-class citizens** with unrestricted access to ALL collections and external APIs.

**Key architectural facts:**
- Views are **global**, not tied to any single collection
- Views have **mandatory `getData`** — they fetch data themselves
- Views can access **multiple collections** and **external APIs** simultaneously
- Views use a **declarative component tree** that maps to a rich registry of UI components
- Views support **actions** with parameter validation, confirmation dialogs, and optimistic updates

**This document exists to show you that Views are the ultimate aggregation and presentation layer. A single View can join data from 5 collections, call an external API, compute complex statistics, and render a beautiful dashboard — all without touching the React component library.**

## The Mindset Shift

1. **Data-first, not UI-first.** Start with `getData` — what data do you need? From which collections? What stats matter? Design the data shape before the component tree.
2. **Views are aggregators.** They can join, transform, and compute stats from any number of collections. Think of them as SQL views with a visual output.
3. **Components are declarative.** You describe WHAT to render, not HOW. The component registry handles all the React rendering.
4. **valuePath is the binding mechanism.** Use JSON Pointer paths (`/stats/total`, `/items`, `/extra/chartData`) to connect data to components.
5. **Actions add interactivity.** Beyond display, Views can define actions that trigger mutations, exports, or side effects.

## Core Concepts from @igniter-js/collections (v2.0)

### FractalView Builder
```typescript
import { FractalView } from "@fractal-os/plugin";

export default FractalView.create("analytics-dashboard")
  .withTitle("Analytics Dashboard")
  .withDescription("Overview of workspace metrics")
  .withMetadata({ icon: "BarChart3", order: 1 })
  .withData(async ({ workspace, options, fractal }) => {
    // workspace.core.collections.get("name") — access any collection
    // workspace.tasks, workspace.memories, etc. — built-in services
    // fractal — full runtime context

    const tasks = await workspace.core.collections.get("tasks").findMany({
      where: { status: "in_progress" },
      take: 100,
    });

    return {
      items: tasks,                    // Main data for tables, lists, kanban
      stats: {                         // KPI values for Metric components
        total: tasks.length,
        active: tasks.filter(t => t.priority === "urgent").length,
      },
      extra: {                         // Auxiliary data for charts, timelines
        chartData: [...],
        lastUpdated: new Date().toISOString(),
      },
    };
  })
  .withTree([ /* component tree */ ])
  .addAction("export", { /* action definition */ })
  .build();
```

### FractalViewDataHookContext
```typescript
interface FractalViewDataHookContext {
  workspace: FractalWorkspaceRuntime;  // All workspace services: core.collections, tasks, skills, etc.
  fractal: FractalInstance;           // Global Fractal runtime: workspaces, config, logger
  options?: {                         // Query options from URL/search params
    where?: Record<string, unknown>;
    orderBy?: Record<string, "asc" | "desc">;
    take?: number;
    skip?: number;
  };
}
```

### Component Registry (17 Components)

| Component | Use Case | Key Props | valuePath Support |
|-----------|----------|-----------|-------------------|
| **Hero** | Page header with title/description | `title`, `description` | No — static props |
| **Metric** | KPI card with value + icon + trend | `title`, `icon` (Lucide name) | `valuePath` for value |
| **Table** | Tabular data with columns | `columns: [{ key, label }]` | `valuePath` for items |
| **Chart** | Bar, line, pie, area, donut, funnel | `type`, `data` | `valuePath` for data |
| **Grid** | Responsive column layout | `columns: number`, `gap` | No — layout only |
| **Section** | Grouped content block | `title`, `description` | No — layout only |
| **Card** | Card container with optional header | `title`, `description` | No — layout only |
| **Badge** | Status/label tag | `label`, `variant: "success"|"warning"|"destructive"` | Partial |
| **StatusBadge** | Status-specific badge with auto-color | `status: string` | No |
| **Text** | Labeled text display | `label`, `value`, `variant` | Partial |
| **Alert** | Notification/warning banner | `title`, `message`, `variant`, `action` | Partial |
| **Button** | Interactive button with action | `label`, `action`, `variant` | No |
| **Timeline** | Chronological activity feed | `direction: "vertical"|"horizontal"` | Uses `extra` |
| **Kanban** | Drag-drop board with columns | `columns`, `groupBy`, `cardProps` | Uses `items` |
| **Form** | Dynamic form with schema validation | `schema`, `action`, `submitLabel` | No |
| **Avatar** | User/entity avatar image | `src`, `name`, `size` | No |

### valuePath Resolution

valuePaths use JSON Pointer-like syntax to resolve data from the `getData` response:

```
/stats/total           → data.stats.total
/stats/avgRating       → data.stats.avgRating
/items                 → data.items
/items/0/title         → data.items[0].title (specific item)
/extra/chartData       → data.extra.chartData
/extra/genreDistribution → data.extra.genreDistribution
```

The system also supports dotted paths and flattening:
- `stats.total` in a flat context also works
- Template strings with `{{variable}}` syntax are resolved via Handlebars

### Icon Names

Icons come from `lucide-react`. Any Lucide icon name works. Common ones:
- **Data:** `BarChart3`, `PieChart`, `TrendingUp`, `Activity`, `Gauge`
- **Actions:** `Plus`, `Trash2`, `Pencil`, `Download`, `Upload`
- **Entities:** `User`, `FileText`, `Calendar`, `Clock`, `Tag`, `Folder`
- **Status:** `CheckCircle`, `XCircle`, `AlertTriangle`, `Info`
- **Finance:** `DollarSign`, `CreditCard`, `Wallet`, `ArrowUpRight`, `ArrowDownRight`
- **Communication:** `Mail`, `Phone`, `MessageSquare`, `Bell`
- **Git:** `GitPullRequest`, `GitMerge`, `GitBranch`, `GitCommit`

---

## Discovery Examples: 20 Ways to Use Views

### Example 01: Cross-Collection CRM Dashboard

#### Introduction
Build a single dashboard that shows Contacts, Deals, and Activities from three separate collections in one unified view.

#### Capabilities Used
- **Multi-collection access** (getData queries 3 collections)
- **Aggregation** (compute pipeline value, conversion rate)
- **Metric + Grid + Table** components

#### Implementation
```typescript
.withData(async ({ workspace }) => {
  const [contacts, deals, activities] = await Promise.all([
    workspace.core.collections.get("contacts").findMany(),
    workspace.core.collections.get("deals").findMany(),
    workspace.core.collections.get("activities").findMany({ orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const wonDeals = deals.filter(d => d.stage === "closed-won");
  const pipelineValue = deals.reduce((sum, d) => sum + d.value, 0);
  const conversionRate = deals.length > 0
    ? ((wonDeals.length / deals.length) * 100).toFixed(1)
    : 0;

  return {
    items: activities, // Recent activities in table
    stats: {
      totalContacts: contacts.length,
      openDeals: deals.filter(d => d.stage !== "closed-won" && d.stage !== "closed-lost").length,
      pipelineValue,
      conversionRate,
    },
    extra: { recentDeals: deals.slice(0, 10) },
  };
})
.withTree([
  { component: "Hero", props: { title: "CRM Dashboard", description: "Pipeline overview and recent activity" } },
  {
    component: "Section", props: { title: "Pipeline Metrics" }, children: [{
      component: "Grid", props: { columns: 4 }, children: [
        { component: "Metric", props: { title: "Total Contacts", icon: "Users" }, valuePath: "/stats/totalContacts" },
        { component: "Metric", props: { title: "Open Deals", icon: "Target" }, valuePath: "/stats/openDeals" },
        { component: "Metric", props: { title: "Pipeline Value", icon: "DollarSign" }, valuePath: "/stats/pipelineValue" },
        { component: "Metric", props: { title: "Conversion Rate", icon: "TrendingUp" }, valuePath: "/stats/conversionRate" },
      ]
    }],
  },
  {
    component: "Section", props: { title: "Recent Activity" }, children: [{
      component: "Table", props: { columns: [
        { key: "type", label: "Type" },
        { key: "description", label: "Description" },
        { key: "createdAt", label: "Date" },
      ]}, valuePath: "/items"
    }],
  },
])
```

---

### Example 02: Financial Dashboard with Charts

#### Introduction
Create a comprehensive financial dashboard with revenue/expense metrics, category breakdown pie chart, and transaction table.

#### Capabilities Used
- **Chart** (pie, bar for category breakdown)
- **Metric** (totals, balance)
- **Card** (chart containers)
- **Section** (organization)

#### Visualization
```typescript
.withTree([
  { component: "Hero", props: { title: "Financeiro", description: "Fluxo de caixa consolidado" } },
  {
    component: "Section", props: { title: "Resumo" }, children: [{
      component: "Grid", props: { columns: 4 }, children: [
        { component: "Metric", props: { title: "A Receber", icon: "ArrowDownRight" }, valuePath: "/stats/totalReceivable" },
        { component: "Metric", props: { title: "A Pagar", icon: "ArrowUpRight" }, valuePath: "/stats/totalPayable" },
        { component: "Metric", props: { title: "Saldo", icon: "Scale" }, valuePath: "/stats/balance" },
        { component: "Metric", props: { title: "Lançamentos", icon: "List" }, valuePath: "/stats/totalItems" },
      ]
    }],
  },
  {
    component: "Section", props: { title: "Categorias" }, children: [{
      component: "Grid", props: { columns: 2 }, children: [
        {
          component: "Card", props: { title: "Distribuição por Categoria" }, children: [
            { component: "Chart", props: { type: "pie", data: "/extra/categoryBreakdown" } }
          ]
        },
        {
          component: "Card", props: { title: "Top 5 Transações" }, children: [
            { component: "Chart", props: { type: "bar", data: "/extra/topTransactions" } }
          ]
        },
      ]
    }],
  },
  {
    component: "Section", props: { title: "Lançamentos" }, children: [{
      component: "Table", props: { columns: [
        { key: "description", label: "Descrição" },
        { key: "amount", label: "Valor" },
        { key: "category", label: "Categoria" },
        { key: "status", label: "Status" },
      ]}, valuePath: "/items"
    }],
  },
])
```

---

### Example 03: GitHub Pull Requests Monitor (External API)

#### Introduction
Build a view that fetches data from the GitHub API — not from any collection. This demonstrates Views as independent data sources.

#### Capabilities Used
- **External API fetch** (GitHub REST API)
- **Metric** (PR stats)
- **Table** (PR list)
- **Stats transformation**

#### Implementation
```typescript
.withData(async () => {
  const response = await fetch("https://api.github.com/repos/owner/repo/pulls?state=all");
  const prs = await response.json();

  const items = prs.map(pr => ({
    id: String(pr.id),
    number: pr.number,
    title: pr.title,
    author: pr.user.login,
    state: pr.merged_at ? "merged" : pr.state,
    createdAt: new Date(pr.created_at).toLocaleDateString(),
  }));

  return {
    items,
    stats: {
      total: prs.length,
      open: prs.filter(p => p.state === "open" && !p.draft).length,
      merged: prs.filter(p => p.merged_at).length,
      drafts: prs.filter(p => p.draft).length,
    },
    extra: { repository: "owner/repo", lastFetched: new Date().toISOString() },
  };
})
```

---

### Example 04: Kanban Board for Task Management

#### Introduction
Use the Kanban component to create a Trello-like board for tasks grouped by status.

#### Capabilities Used
- **Kanban** component
- **groupBy** for automatic column grouping
- **cardProps** for card content

#### Implementation
```typescript
.withData(async ({ workspace }) => {
  const tasks = await workspace.core.collections.get("tasks").findMany({
    orderBy: { updatedAt: "desc" },
  });
  return { items: tasks, stats: { total: tasks.length } };
})
.withTree([
  {
    component: "Section", props: { title: "Task Board" }, children: [{
      component: "Kanban", props: {
        columns: [
          { id: "backlog", title: "Backlog" },
          { id: "todo", title: "To Do" },
          { id: "in_progress", title: "In Progress" },
          { id: "in_review", title: "Review" },
          { id: "finished", title: "Done" },
        ],
        groupBy: "status",
        cardProps: ["title", "priority", "assigned"],
      }
    }],
  },
])
```

---

### Example 05: Real-Time Monitoring with Auto-Refresh

#### Introduction
Combine collection data with system metrics to create a monitoring dashboard.

#### Capabilities Used
- **System stats** (memory, CPU from API)
- **Collection queries** (error logs, events)
- **Metric** (gauges)
- **Timeline** (recent events)

---

### Example 06: Content Calendar with Timeline

#### Introduction
Use the Timeline component to display scheduled content in chronological order.

#### Capabilities Used
- **Timeline** component
- **Date sorting** in getData
- **extra** data binding

---

### Example 07: Survey Results with Form Input

#### Introduction
Combine a Form for data entry with a Table + Chart for result visualization in the same view.

#### Capabilities Used
- **Form** (action with execution)
- **Table** (results display)
- **Chart** (distribution visualization)
- **View actions** (submit survey response)

---

### Example 08: Inventory Dashboard with Low-Stock Alerts

#### Introduction
Show inventory levels with color-coded alerts for items below minimum stock.

#### Capabilities Used
- **Alert** (low stock warnings)
- **Badge** (status indicators)
- **Metric** (inventory KPIs)
- **Table** (full inventory list)

---

### Example 09: Multi-Workspace Aggregation

#### Introduction
Aggregate data from multiple workspaces into a single admin overview.

#### Capabilities Used
- **fractal.workspaces** in getData
- **Workspace iteration**
- **Cross-workspace metrics**

---

### Example 10: Personal Finance with Budget Tracking

#### Introduction
Track spending against budget categories with progress indicators and overspend alerts.

#### Capabilities Used
- **Budget calculation** in getData
- **Alert** (overspend warnings)
- **Chart** (spending breakdown)
- **Metric** (budget vs actual)

---

## Component Composition Patterns

### Pattern 1: The KPI Grid
```
Section
└── Grid (columns: 4)
    ├── Metric (title: "Total", icon: "BarChart3", valuePath: "/stats/total")
    ├── Metric (title: "Active", icon: "Activity", valuePath: "/stats/active")
    ├── Metric (title: "Completed", icon: "CheckCircle", valuePath: "/stats/completed")
    └── Metric (title: "Pending", icon: "Clock", valuePath: "/stats/pending")
```

### Pattern 2: Dashboard with Charts
```
Section (title: "Analytics")
└── Grid (columns: 2)
    ├── Card (title: "Distribution")
    │   └── Chart (type: "pie", data: "/extra/distribution")
    └── Card (title: "Trends")
        └── Chart (type: "line", data: "/extra/trends")
```

### Pattern 3: Table with Status
```
Section (title: "Records")
└── Table (columns: [
      { key: "name", label: "Name" },
      { key: "status", label: "Status" },  // Use StatusBadge for this
      { key: "date", label: "Date" },
    ], valuePath: "/items")
```

### Pattern 4: Nested Sections
```
Hero (title, description)
├── Section (title: "Overview")
│   └── Grid → Metrics
├── Section (title: "Details")
│   └── Grid (columns: 2)
│       ├── Card → Chart
│       └── Card → Table
└── Section (title: "History")
    └── Timeline
```

### Pattern 5: Kanban with Metrics Above
```
Hero
├── Grid → Metrics (showing column counts)
└── Section
    └── Kanban (columns, groupBy, cardProps)
```

---

## Proactive Checklist for View Creation

Before creating ANY view, ask yourself:

1. ✅ **What's the primary data source?** Collection, external API, or both?
2. ✅ **What KPIs matter?** Design stats first — these drive the Metric components.
3. ✅ **What's the best component for each data type?** Single number → Metric, List → Table, Distribution → Chart, Chronological → Timeline.
4. ✅ **How many collections are needed?** Plan `getData` to fetch everything in `Promise.all`.
5. ✅ **What icons represent the data?** Use Lucide icon names (they render via `icons[name]`).
6. ✅ **Does this need actions?** Export, create, delete, approve — add actions for interactivity.
7. ✅ **What's the reading order?** Hero → Overview (KPIs) → Details (charts/tables) → Actions.
8. ✅ **Is the data shape compatible with components?** Charts need `{ name, count/value }` arrays. Tables need flat objects.
9. ✅ **Where does it live?** `.fractal/views/` for workspace views, `.fractal/skills/[skill]/views/` for skill views.
10. ✅ **Naming convention:** Use kebab-case (e.g., `crm-dashboard.view.ts`).
