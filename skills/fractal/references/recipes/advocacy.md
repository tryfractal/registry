# Recipe: Law Firm OS

> **Use Case:** Law firm and solo practice management — cases, clients, billing, deadlines, and documents.
> **Replaces:** Clio + MyCase + TimeSolv + DocuSign + Calendly
> **User Profile:** Attorney, law firm partner, paralegal team, solo practitioner

## Overview

This recipe transforms the Fractal workspace into a complete law practice management system. With Collections for cases, clients, time entries, and billing — Views for practice dashboards and case timelines — Toolsets for court deadline APIs, e-signature, and document generation — you replace 4-5 SaaS products with one integrated environment that adapts to your firm's workflow.

---

## 1. Collections

### 1.1 `clients` — Client Registry

```typescript
z.object({
  name: z.string().describe("Full name or organization"),
  email: z.string().email().describe("Primary email"),
  phone: z.string().optional().describe("Phone number"),
  type: z.enum(["individual", "corporate", "government"]).describe("Client type"),
  taxId: z.string().optional().describe("SSN / EIN / Tax ID"),
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
    country: z.string().default("US"),
  }).optional(),
  referredBy: z.string().optional().describe("Referral source"),
  notes: z.string().optional(),
  active: z.boolean().default(true),
})
```

### 1.2 `cases` — Legal Cases

```typescript
z.object({
  clientId: z.string().uuid().describe("Client reference"),
  title: z.string().describe("Case title (e.g. Smith v. Jones)"),
  caseNumber: z.string().optional().describe("Court docket number"),
  practiceArea: z.enum([
    "corporate", "litigation", "family", "criminal", "immigration",
    "ip", "employment", "real_estate", "tax", "estate_planning", "other"
  ]).describe("Area of law"),
  status: z.enum([
    "intake", "active", "discovery", "trial", "settlement",
    "appeal", "closed", "archived"
  ]).default("intake"),
  judge: z.string().optional().describe("Assigned judge"),
  court: z.string().optional().describe("Court name and jurisdiction"),
  opposingCounsel: z.string().optional(),
  retainerAmount: z.number().min(0).describe("Retainer fee"),
  hourlyRate: z.number().min(0).describe("Billing rate per hour"),
  contingencyPercent: z.number().min(0).max(100).optional().describe("Contingency percentage"),
  openDate: z.string().describe("Date opened"),
  closeDate: z.string().optional(),
  statuteOfLimitations: z.string().optional().describe("SOL deadline"),
  tags: z.array(z.string()).default([]),
})
```

### 1.3 `time_entries` — Billable Time Tracking

```typescript
z.object({
  caseId: z.string().uuid().describe("Case reference"),
  clientId: z.string().uuid().describe("Client reference"),
  attorneyId: z.string().uuid().describe("Who performed the work"),
  date: z.string().describe("Date of work"),
  hours: z.number().min(0.1).describe("Hours worked"),
  description: z.string().describe("Work performed description"),
  activity: z.enum([
    "consultation", "research", "drafting", "filing", "court_appearance",
    "deposition", "negotiation", "review", "correspondence", "other"
  ]).describe("Activity category"),
  billable: z.boolean().default(true),
  rate: z.number().min(0).describe("Hourly rate applied"),
  billed: z.boolean().default(false).describe("Whether included in an invoice"),
})
```

### 1.4 `deadlines` — Court Dates & Statutory Deadlines

```typescript
z.object({
  caseId: z.string().uuid().describe("Case reference"),
  title: z.string().describe("Deadline description"),
  date: z.string().describe("Due date"),
  type: z.enum(["court_date", "filing_deadline", "discovery_deadline", "statute_of_limitations", "client_deadline", "internal"]).describe("Type"),
  priority: z.enum(["critical", "high", "medium", "low"]).default("medium"),
  completed: z.boolean().default(false),
  reminderDays: z.number().int().min(0).default(3).describe("Days before to send reminder"),
  notes: z.string().optional(),
})
```

### 1.5 `invoices` — Legal Billing

```typescript
z.object({
  caseId: z.string().uuid().describe("Case reference"),
  clientId: z.string().uuid().describe("Client reference"),
  number: z.string().describe("Invoice number (e.g. INV-2026-042)"),
  items: z.array(z.object({
    description: z.string(),
    hours: z.number().min(0),
    rate: z.number().min(0),
    amount: z.number().min(0),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0).default(0),
  total: z.number().min(0),
  status: z.enum(["draft", "sent", "paid", "overdue", "write_off"]).default("draft"),
  dueDate: z.string(),
  paidAt: z.string().optional(),
  paymentLink: z.string().optional(),
})
```

### 1.6 `documents` — Case Documents

```typescript
z.object({
  caseId: z.string().uuid().describe("Case reference"),
  clientId: z.string().uuid().describe("Client reference"),
  title: z.string().describe("Document title"),
  type: z.enum([
    "complaint", "answer", "motion", "brief", "contract", "letter",
    "discovery_request", "discovery_response", "settlement", "retainer", "other"
  ]).describe("Document category"),
  status: z.enum(["draft", "review", "sent", "filed", "signed", "archived"]).default("draft"),
  version: z.number().int().min(1).default(1),
  signedBy: z.array(z.string()).default([]).describe("Signatories"),
  signedAt: z.string().optional(),
  filePath: z.string().optional().describe("Path in workspace files"),
  tags: z.array(z.string()).default([]),
})
```

---

## 2. Hooks — Intelligent Automation

### Hook: Auto-number Invoices
```typescript
// Collection: invoices — onCreated
.onCreated(async ({ value, workspace }) => {
  const count = await workspace.core.collections.get("invoices").count();
  const number = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(3, "0")}`;
  return { ...value, number };
})
```

### Hook: Deadline Reminders
```typescript
// Collection: deadlines — onCreated
.onCreated(async ({ value, workspace }) => {
  // Schedule reminder via events
  await workspace.events.emit({
    type: "deadline.created",
    data: {
      caseId: value.caseId,
      title: value.title,
      date: value.date,
      priority: value.priority,
      reminderDays: value.reminderDays,
    },
  });
  return value;
})
```

### Hook: Enrich Cases with Unbilled Hours
```typescript
// Collection: cases — onList
.onList(async ({ value, workspace }) => {
  const enriched = await Promise.all(value.map(async (caseItem) => {
    const entries = await workspace.core.collections.get("time_entries").findMany({
      where: { caseId: caseItem.id, billed: false, billable: true },
    });
    const unbilled = entries.reduce((sum, e) => sum + (e.hours * e.rate), 0);
    return { ...caseItem, unbilledAmount: unbilled, unbilledHours: entries.length };
  }));
  return enriched;
})
```

### Hook: Mark Time Entries as Billed
```typescript
// Collection: invoices — onCreated (after invoice is created from time entries)
.onCreated(async ({ value, workspace }) => {
  // If invoice items reference time_entries, mark them as billed
  for (const item of value.items) {
    await workspace.core.collections.get("time_entries").update({
      where: { caseId: value.caseId, billed: false },
      data: { billed: true },
    });
  }
  return value;
})
```

---

## 3. Views — Dashboards

### 3.1 `practice-dashboard.view.ts` — Firm Overview

```typescript
FractalView.create("practice-dashboard", workspace => ({
  name: "Practice Dashboard",
  icon: "Scale",
  description: "Firm-wide overview of cases, billing, and deadlines",
}))
.withData(async ({ workspace }) => {
  const [cases, invoices, deadlines, clients] = await Promise.all([
    workspace.core.collections.get("cases").findMany({ where: { status: "active" } }),
    workspace.core.collections.get("invoices").findMany({}),
    workspace.core.collections.get("deadlines").findMany({ where: { completed: false } }),
    workspace.core.collections.get("clients").findMany({ where: { active: true } }),
  ]);

  const totalUnbilled = cases.reduce((sum, c) => sum + (c.unbilledAmount || 0), 0);
  const outstandingInvoices = invoices.filter(i => i.status === "sent" || i.status === "overdue");
  const criticalDeadlines = deadlines.filter(d => d.priority === "critical");

  return {
    items: cases,
    stats: {
      totalUnbilled,
      outstandingAmount: outstandingInvoices.reduce((s, i) => s + i.total, 0),
      activeCases: cases.length,
      criticalDeadlines: criticalDeadlines.length,
      totalClients: clients.length,
    },
    extra: { deadlines: criticalDeadlines, outstanding: outstandingInvoices },
  };
})
.withTree([
  Hero("Law Firm Dashboard"),
  Grid({ columns: 4 }, [
    Metric("Unbilled", "/stats/totalUnbilled", { prefix: "$", variant: "default" }),
    Metric("Outstanding", "/stats/outstandingAmount", { prefix: "$", variant: "warning" }),
    Metric("Active Cases", "/stats/activeCases"),
    Metric("Critical Deadlines", "/stats/criticalDeadlines", { variant: "destructive" }),
  ]),
  Section("Upcoming Deadlines", [
    Table("/extra/deadlines", {
      columns: ["title", "date", "priority", "type"],
      actions: [{ label: "View Case", action: "navigate", path: "/cases/{caseId}" }],
    }),
  ]),
  Section("Outstanding Invoices", [
    Table("/extra/outstanding", {
      columns: ["number", "client", "total", "dueDate", "status"],
      actions: [{ label: "Send Reminder", action: "trigger", trigger: "send-reminder" }],
    }),
  ]),
  Section("Cases by Practice Area", [
    Chart("/items", {
      type: "pie",
      groupBy: "practiceArea",
      valueField: "retainerAmount",
    }),
  ]),
])
```

### 3.2 `case-detail.view.ts` — Individual Case View

```typescript
FractalView.create("case-detail", workspace => ({
  name: "Case Detail",
  icon: "FolderOpen",
  description: "Detailed view of a single case with timeline and documents",
}))
.withData(async ({ workspace, options }) => {
  const caseId = options?.where?.caseId as string;
  const [caseData, timeEntries, deadlines, documents] = await Promise.all([
    workspace.core.collections.get("cases").findUnique({ where: { id: caseId } }),
    workspace.core.collections.get("time_entries").findMany({ where: { caseId } }),
    workspace.core.collections.get("deadlines").findMany({ where: { caseId } }),
    workspace.core.collections.get("documents").findMany({ where: { caseId } }),
  ]);

  const totalHours = timeEntries.reduce((s, e) => s + e.hours, 0);
  const billedHours = timeEntries.filter(e => e.billed).reduce((s, e) => s + e.hours, 0);

  return {
    items: timeEntries,
    stats: {
      totalHours,
      billedHours,
      unbilledHours: totalHours - billedHours,
      totalBilled: timeEntries.filter(e => e.billed).reduce((s, e) => s + (e.hours * e.rate), 0),
    },
    extra: { case: caseData, deadlines, documents },
  };
})
.withTree([
  Hero("{{extra.case.title}}", { subtitle: "{{extra.case.caseNumber}} — {{extra.case.practiceArea}}" }),
  Grid({ columns: 4 }, [
    Metric("Total Hours", "/stats/totalHours"),
    Metric("Billed Hours", "/stats/billedHours"),
    Metric("Unbilled Hours", "/stats/unbilledHours"),
    Metric("Total Billed", "/stats/totalBilled", { prefix: "$" }),
  ]),
  Section("Case Status", [
    Badge("{{extra.case.status}}", { variant: "default" }),
    Text("Opened: {{extra.case.openDate}}"),
    Text("Court: {{extra.case.court}}"),
  ]),
  Section("Deadlines", [
    Timeline("/extra/deadlines", {
      dateField: "date",
      titleField: "title",
      colorField: "priority",
    }),
  ]),
  Section("Time Entries", [
    Table("/items", {
      columns: ["date", "attorney", "activity", "hours", "billable", "rate"],
      actions: [{ label: "Edit", action: "trigger", trigger: "edit-time-entry" }],
    }),
  ]),
  Section("Documents", [
    Table("/extra/documents", {
      columns: ["title", "type", "status", "version", "lastModified"],
      actions: [
        { label: "Open", action: "trigger", trigger: "open-document" },
        { label: "Request Signature", action: "trigger", trigger: "request-signature" },
      ],
    }),
  ]),
])
```

---

## 4. Toolsets

### 4.1 Court API Toolset
```typescript
// .fractal/toolsets/court-api.toolset.ts
{
  name: "court-api",
  description: "Integration with court filing and docket systems",
  tools: [
    { name: "search_docket", description: "Search court docket by case number" },
    { name: "file_document", description: "E-file a document with the court" },
    { name: "get_deadlines", description: "Fetch statutory deadlines for a jurisdiction" },
  ],
}
```

### 4.2 E-Signature Toolset (DocuSign/HelloSign)
```typescript
{
  name: "esignature",
  description: "Send documents for electronic signature",
  tools: [
    { name: "send_for_signature", description: "Send a document for e-signature" },
    { name: "check_signature_status", description: "Check if a document has been signed" },
    { name: "download_signed", description: "Download the signed document" },
  ],
}
```

### 4.3 Document Generator Toolset
```typescript
{
  name: "doc-generator",
  description: "Generate legal documents from templates",
  tools: [
    { name: "generate_retainer", description: "Generate retainer agreement from template" },
    { name: "generate_complaint", description: "Generate complaint filing document" },
    { name: "generate_motion", description: "Generate motion filing document" },
  ],
}
```

### 4.4 Calendar Toolset
```typescript
{
  name: "calendar",
  description: "Court dates and appointment scheduling",
  tools: [
    { name: "create_event", description: "Create a calendar event" },
    { name: "check_availability", description: "Check attorney availability" },
    { name: "list_upcoming", description: "List upcoming court dates and meetings" },
  ],
}
```

---

## 5. Templates

### `retainer-agreement` Template
```handlebars
RETAINER AGREEMENT

Attorney: {{attorneyName}}
Client: {{clientName}}
Date: {{date}}

1. SCOPE OF REPRESENTATION
{{scopeDescription}}

2. FEES AND BILLING
Hourly Rate: ${{hourlyRate}}
Retainer Amount: ${{retainerAmount}}

3. TERMS
{{terms}}

Signed:
___________________________
Attorney: {{attorneyName}}

___________________________
Client: {{clientName}}
```

### `invoice-legal` Template
```handlebars
INVOICE {{number}}

Bill To: {{clientName}}
Case: {{caseTitle}}
Case No: {{caseNumber}}

Date        | Activity           | Hours | Rate  | Amount
{{#each items}}
{{date}}    | {{description}}    | {{hours}} | ${{rate}} | ${{amount}}
{{/each}}

                        Subtotal: ${{subtotal}}
                        Tax:      ${{tax}}
                        TOTAL:    ${{total}}

Due Date: {{dueDate}}
Payment Link: {{paymentLink}}
```

### `deadline-reminder` Template
```handlebars
⚠️ DEADLINE REMINDER

Case: {{caseTitle}}
Deadline: {{deadlineTitle}}
Date: {{deadlineDate}}
Priority: {{priority}}

{{#if notes}}
Notes: {{notes}}
{{/if}}

This deadline is {{daysUntil}} days away.
```

---

## 6. Agents

### `legal-assistant` Agent
```yaml
name: Legal Assistant
role: Legal research and case management assistant
description: Helps with legal research, deadline tracking, document drafting, and case status updates.
instructions: |
  You are a legal assistant specialized in case management.
  - Track all deadlines and remind attorneys 3 days before critical dates
  - Generate document drafts using templates
  - Summarize case status from time entries and billing data
  - Flag overdue invoices and unbilled hours
  - Suggest practice area insights based on case trends
```

### `billing-clerk` Agent
```yaml
name: Billing Clerk
role: Automated billing and invoicing
description: Manages invoice generation, payment tracking, and billing reminders.
instructions: |
  You are a billing specialist for a law firm.
  - Generate monthly invoices from unbilled time entries
  - Track payment status and send reminders for overdue invoices
  - Calculate contingency fees when cases settle
  - Produce monthly billing reports by attorney and practice area
```

---

## 7. Workflows

### Daily Workflow
1. **Morning:** Open `practice-dashboard` → review critical deadlines and outstanding invoices
2. **Throughout day:** Log `time_entries` as work is performed on cases
3. **End of day:** Review unbilled hours, flag any entries missing descriptions

### Monthly Billing Cycle
1. Run billing agent → generates invoices from unbilled time entries
2. Hook auto-numbers invoices and creates payment links
3. Agent sends invoice email using `invoice-legal` template
4. Track payment status → send reminders for overdue invoices
5. Update case billing totals

### Case Intake Workflow
1. New client inquiry → create `clients` record
2. Conflict check via agent search across existing cases
3. Create `cases` record with practice area and retainer
4. Generate retainer agreement via `doc-generator` toolset
5. Send for e-signature via `esignature` toolset
6. Set up initial deadlines via `deadlines` collection

### Court Filing Workflow
1. Prepare document using `doc-generator` toolset
2. Review and finalize document
3. E-file via `court-api` toolset
4. Create `documents` record with filing status
5. Update case status if needed

---

## 8. Natural Evolution

As the firm grows, the workspace evolves organically:
- **Hired associates?** → Add `attorneys` collection + view for workload allocation
- **Trust accounts?** → Add `trust_transactions` collection + IOLTA compliance hooks
- **Appeals?** → Add `appeals` collection with appellate deadline calculator
- **Multiple offices?** → Add `offices` collection + location-based dashboards
- **Client portal?** → Create `client-portal` view with filtered read-only access
- **Conflict checking?** → Add `conflicts` collection + agent-powered conflict search