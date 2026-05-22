# Recipe: Freelancer OS

> **Use Case:** Self-employed professional managing multiple clients, projects, billing, and time.
> **Replaces:** QuickBooks + Trello + Calendly + Toggl + spreadsheets.
> **User Profile:** Designer, developer, consultant, solo lawyer, photographer.

## Overview

This recipe transforms the Fractal workspace into a complete management system for self-employed professionals. With Collections for clients, projects, invoices, and time-tracking — Views for financial dashboards and project pipelines — and Toolsets for Stripe, Google Calendar, and email integration — you replace 3-4 different SaaS products with a single integrated environment that grows with your business.

---

## 1. Collections

### 1.1 `clients` — Client Registry

**Schema:**
```typescript
z.object({
  name: z.string().describe("Full name or company name"),
  email: z.string().email().describe("Primary email"),
  phone: z.string().optional().describe("Phone number"),
  rate: z.number().min(0).describe("Contracted hourly rate ($)"),
  currency: z.enum(["USD", "EUR", "BRL"]).default("USD"),
  category: z.enum(["recurring", "project-based", "one-off"]).describe("Relationship type"),
  active: z.boolean().default(true),
  notes: z.string().optional().describe("Notes"),
  contractUrl: z.string().optional().describe("Contract link"),
})
```

### 1.2 `projects` — Client Projects

```typescript
z.object({
  clientId: z.string().uuid().describe("Client reference"),
  title: z.string().describe("Project name"),
  description: z.string().optional().describe("Brief scope"),
  status: z.enum(["prospecting", "proposal", "active", "paused", "completed", "cancelled"]).default("prospecting"),
  budget: z.number().min(0).describe("Total budget ($)"),
  estimatedHours: z.number().min(0).optional().describe("Estimated hours"),
  startDate: z.string().optional().describe("Start date"),
  deadline: z.string().optional().describe("Deadline"),
  milestones: z.array(z.object({
    title: z.string(),
    dueDate: z.string(),
    completed: z.boolean().default(false),
  })).default([]),
})
```

### 1.3 `invoices` — Billing & Invoicing

```typescript
z.object({
  projectId: z.string().uuid().describe("Related project"),
  clientId: z.string().uuid().describe("Client reference"),
  number: z.string().describe("Invoice number (e.g., INV-2026-001)"),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().min(1),
    unitPrice: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "cancelled"]).default("draft"),
  dueDate: z.string().describe("Due date"),
  paidAt: z.string().optional().describe("Payment date"),
  stripePaymentLink: z.string().optional().describe("Stripe payment link"),
  template: z.enum(["default", "detailed"]).default("default"),
})
```

### 1.4 `time_entries` — Time Tracking

```typescript
z.object({
  projectId: z.string().uuid(),
  clientId: z.string().uuid(),
  date: z.string().describe("Date of entry"),
  hours: z.number().min(0.25).describe("Hours worked"),
  description: z.string().describe("Work performed"),
  billable: z.boolean().default(true),
  rate: z.number().min(0).describe("Rate applied to this entry"),
})
```

---

## 2. Hooks — Intelligent Automation

### Hook: Auto-number Invoices
```typescript
.onCreated(async ({ value, workspace }) => {
  const count = await workspace.core.collections.get("invoices").count();
  const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
  return { ...value, number };
})
```

### Hook: Generate Stripe Payment Link
```typescript
.onCreated(async ({ value, workspace }) => {
  if (value.status !== "draft") return value;

  // Call Stripe toolset
  const stripeResult = await workspace.toolsets.call({
    toolset: "stripe",
    tool: "create_payment_link",
    input: {
      amount: Math.round(value.total * 100), // cents
      currency: "usd",
      description: `Invoice ${value.number}`,
      metadata: { invoiceId: value.id, clientId: value.clientId },
    }
  });

  return {
    ...value,
    stripePaymentLink: stripeResult.data?.url,
    status: "sent",
  };
})
```

### Hook: Unbilled Hours Enrichment
```typescript
.onList(async ({ value, workspace }) => {
  return await Promise.all(value.map(async (project) => {
    const entries = await workspace.core.collections.get("time_entries").findMany({
      where: { projectId: project.id, billable: true },
    });
    const totalHours = entries.reduce((s, e) => s + e.hours, 0);
    const unbilled = totalHours * (project.budget / (project.estimatedHours || 1));
    return { ...project, totalHours, unbilled };
  }));
})
```

---

## 3. Views — Dashboards

### 3.1 `freelancer-dashboard.view.ts` — Business Overview

**Visual Tree:**
```
Hero: "My Freelance Business"
├── Grid (4 cols): Metric (Revenue, Pending, Hours, Active Projects)
├── Section "Pipeline": Kanban (projects by status)
├── Section "Financial": Table (recent invoices with status + Stripe link)
└── Section "Hours": Chart (bar — hours per project per week)
```

### 3.2 `client-portal.view.ts` — Client-specific View

**Data filtered by `clientId` (query param):**
```typescript
.withData(async ({ workspace, options }) => {
  const clientId = options?.where?.clientId as string;
  const [client, projects, invoices] = await Promise.all([
    workspace.core.collections.get("clients").findUnique({ where: { id: clientId } }),
    workspace.core.collections.get("projects").findMany({ where: { clientId } }),
    workspace.core.collections.get("invoices").findMany({ where: { clientId } }),
  ]);
  // ...
})
```

---

## 4. Toolsets

### 4.1 Stripe Toolset
- `create_payment_link` — Generate checkout URL
- `get_payment_status` — Check if paid
- `create_customer` — Create Stripe customer

### 4.2 Google Calendar Toolset
- `create_event` — Schedule client meetings
- `list_events` — Check availability

### 4.3 Email Toolset
- `send_invoice` — Send formatted HTML emails using Handlebars

---

## 5. Templates

### `invoice-email` template
```handlebars
Subject: Invoice {{number}} — {{clientName}}

Hi {{clientName}},

Please find attached invoice {{number}} for the {{projectTitle}} project.

Total: {{currency}} {{total}}
Due Date: {{dueDate}}

Payment Link: {{stripePaymentLink}}

Thank you!
```

---

## 6. Daily Workflow

1. **Morning:** Open `freelancer-dashboard` → Review active projects and previous day's hours.
2. **During Day:** Log `time_entries` as work is performed.
3. **End of Month:** Create `invoice` for accumulated hours → Hook generates Stripe link → Hook sends email.
4. **When Paid:** Update `invoices.status = "paid"` → Dashboard reflects updated revenue.
5. **New Client:** Create `clients` record → Agent suggests contract template.
