# Recipe: Real Estate OS

> **Use Case:** Real estate agency management — listings, showings, offers, commissions, and client relationships.
> **Replaces:** Follow Up Boss + dotloop + Canva + Calendly + QuickBooks
> **User Profile:** Real estate agent, broker, property manager, agency owner

## Overview

This recipe transforms the Fractal workspace into a complete real estate management system. With Collections for properties, clients, showings, offers, and transactions — Views for pipeline dashboards and market analytics — Toolsets for MLS integration, e-signature, and calendar — you replace 5+ SaaS products with one platform that grows with your business.

---

## 1. Collections

### 1.1 `properties` — Property Listings

```typescript
z.object({
  address: z.string().describe("Full street address"),
  city: z.string().describe("City"),
  state: z.string().describe("State/Province"),
  zipCode: z.string().describe("ZIP/Postal code"),
  type: z.enum(["single_family", "condo", "townhouse", "multi_family", "land", "commercial"]).describe("Property type"),
  bedrooms: z.number().int().min(0).optional(),
  bathrooms: z.number().min(0).optional(),
  sqft: z.number().int().min(0).optional().describe("Square footage"),
  lotSize: z.number().min(0).optional().describe("Lot size in acres"),
  yearBuilt: z.number().int().min(1900).optional(),
  price: z.number().min(0).describe("Listing price"),
  originalPrice: z.number().min(0).optional().describe("Original listing price"),
  status: z.enum(["coming_soon", "active", "under_contract", "sold", "rented", "withdrawn", "expired"]).default("active"),
  listDate: z.string().describe("Date listed"),
  soldDate: z.string().optional(),
  mlsNumber: z.string().optional().describe("MLS number"),
  description: z.string().optional(),
  features: z.array(z.string()).default([]).describe("Key features (pool, garage, etc.)"),
  images: z.array(z.string()).default([]).describe("Image URLs or file paths"),
  virtualTourUrl: z.string().optional(),
  agentId: z.string().uuid().describe("Listing agent reference"),
  commissionPercent: z.number().min(0).max(100).default(3).describe("Commission percentage"),
  hoa: z.number().min(0).default(0).describe("Monthly HOA fee"),
  propertyTax: z.number().min(0).optional().describe("Annual property tax"),
})
```

### 1.2 `clients` — Buyers & Sellers

```typescript
z.object({
  name: z.string().describe("Full name"),
  email: z.string().email(),
  phone: z.string(),
  type: z.enum(["buyer", "seller", "both", "tenant", "landlord"]).describe("Client type"),
  status: z.enum(["lead", "prospect", "active", "under_contract", "closed", "past_client", "inactive"]).default("lead"),
  budgetMin: z.number().min(0).optional().describe("Minimum budget"),
  budgetMax: z.number().min(0).optional().describe("Maximum budget"),
  preferredLocations: z.array(z.string()).default([]).describe("Desired neighborhoods/cities"),
  bedrooms: z.number().int().min(0).optional().describe("Desired bedrooms"),
  bathrooms: z.number().min(0).optional().describe("Desired bathrooms"),
  propertyType: z.array(z.enum(["single_family", "condo", "townhouse", "multi_family"])).default([]),
  notes: z.string().optional(),
  source: z.enum(["referral", "website", "open_house", "social_media", "cold_call", "other"]).optional(),
  agentId: z.string().uuid().optional().describe("Assigned agent"),
  importantDates: z.array(z.object({
    type: z.enum(["birthday", "anniversary", "lease_end", "closing"]),
    date: z.string(),
  })).default([]),
  active: z.boolean().default(true),
})
```

### 1.3 `showings` — Property Showings

```typescript
z.object({
  propertyId: z.string().uuid().describe("Property reference"),
  clientId: z.string().uuid().describe("Client reference"),
  agentId: z.string().uuid().describe("Showing agent"),
  date: z.string().describe("Showing date"),
  time: z.string().describe("Showing time"),
  duration: z.number().int().min(5).default(30).describe("Duration in minutes"),
  status: z.enum(["scheduled", "confirmed", "completed", "cancelled", "no_show"]).default("scheduled"),
  feedback: z.string().optional().describe("Client feedback after showing"),
  interestLevel: z.enum(["low", "medium", "high", "very_high"]).optional(),
  followUpNeeded: z.boolean().default(false),
  notes: z.string().optional(),
})
```

### 1.4 `offers` — Purchase Offers

```typescript
z.object({
  propertyId: z.string().uuid().describe("Property reference"),
  clientId: z.string().uuid().describe("Buyer reference"),
  agentId: z.string().uuid().describe("Buyer's agent"),
  offerPrice: z.number().min(0).describe("Offered price"),
  earnestMoney: z.number().min(0).optional().describe("Earnest money deposit"),
  financingType: z.enum(["cash", "conventional", "fha", "va", "usda", "other"]).describe("Financing type"),
  contingency: z.array(z.enum(["inspection", "appraisal", "financing", "sale_of_home", "none"])).default([]),
  closingDate: z.string().describe("Proposed closing date"),
  status: z.enum(["draft", "submitted", "countered", "accepted", "rejected", "withdrawn"]).default("draft"),
  counterOffers: z.array(z.object({
    price: z.number().min(0),
    date: z.string(),
    terms: z.string().optional(),
  })).default([]),
  submittedAt: z.string().optional(),
  responseDeadline: z.string().optional(),
  notes: z.string().optional(),
})
```

### 1.5 `transactions` — Closed Deals

```typescript
z.object({
  propertyId: z.string().uuid(),
  clientId: z.string().uuid(),
  agentId: z.string().uuid(),
  offerId: z.string().uuid().optional(),
  salePrice: z.number().min(0).describe("Final sale price"),
  commissionAmount: z.number().min(0).describe("Total commission"),
  agentSplit: z.number().min(0).max(100).default(50).describe("Agent's split percentage"),
  closingDate: z.string().describe("Closing date"),
  status: z.enum(["in_progress", "closed", "fell_through"]).default("in_progress"),
  titleCompany: z.string().optional(),
  lender: z.string().optional(),
  inspectionResult: z.enum(["pass", "conditional", "fail"]).optional(),
  documents: z.array(z.object({
    name: z.string(),
    type: z.enum(["contract", "disclosure", "inspection", "appraisal", "title", "other"]),
    signedAt: z.string().optional(),
    filePath: z.string().optional(),
  })).default([]),
  notes: z.string().optional(),
})
```

### 1.6 `open_houses` — Open House Events

```typescript
z.object({
  propertyId: z.string().uuid(),
  agentId: z.string().uuid(),
  date: z.string().describe("Open house date"),
  startTime: z.string().describe("Start time"),
  endTime: z.string().describe("End time"),
  attendees: z.array(z.object({
    name: z.string(),
    phone: z.string().optional(),
    email: z.string().email().optional(),
    interestLevel: z.enum(["just_looking", "somewhat_interested", "very_interested"]).optional(),
    hasAgent: z.boolean().default(false),
    notes: z.string().optional(),
  })).default([]),
  status: z.enum(["scheduled", "active", "completed", "cancelled"]).default("scheduled"),
  marketingChannels: z.array(z.enum(["mls", "social_media", "flyers", "email", "signs", "website"])).default([]),
  notes: z.string().optional(),
})
```

---

## 2. Hooks — Intelligent Automation

### Hook: New Lead Nurture
```typescript
// Collection: clients — onCreated
.onCreated(async ({ value, workspace }) => {
  await workspace.events.emit({
    type: "client.new_lead",
    data: {
      clientId: value.id,
      name: value.name,
      type: value.type,
      source: value.source,
      budgetMin: value.budgetMin,
      budgetMax: value.budgetMax,
      preferredLocations: value.preferredLocations,
    },
  });
  return value;
})
```

### Hook: Price Change Tracking
```typescript
// Collection: properties — onUpdated
.onUpdated(async ({ value, previous, workspace }) => {
  if (value.price !== previous.price) {
    await workspace.events.emit({
      type: "property.price_change",
      data: {
        propertyId: value.id,
        address: value.address,
        oldPrice: previous.price,
        newPrice: value.price,
        changePercent: ((value.price - previous.price) / previous.price * 100).toFixed(1),
      },
    });
  }
  return value;
})
```

### Hook: Showing Follow-Up
```typescript
// Collection: showings — onUpdated
.onUpdated(async ({ value, workspace }) => {
  if (value.status === "completed" && value.followUpNeeded) {
    await workspace.events.emit({
      type: "showing.follow_up_needed",
      data: {
        clientId: value.clientId,
        propertyId: value.propertyId,
        feedback: value.feedback,
        interestLevel: value.interestLevel,
      },
    });
  }
  return value;
})
```

### Hook: Commission Calculation
```typescript
// Collection: transactions — onCreated
.onCreated(async ({ value, workspace }) => {
  const property = await workspace.core.collections.get("properties").findUnique({
    where: { id: value.propertyId },
  });
  const commission = value.salePrice * (property.commissionPercent / 100);
  const agentAmount = commission * (value.agentSplit / 100);
  return { ...value, commissionAmount: commission, agentPayout: agentAmount };
})
```

---

## 3. Views — Dashboards

### 3.1 `realestate-dashboard.view.ts` — Agent Overview

```typescript
FractalView.create("realestate-dashboard", workspace => ({
  name: "Real Estate Dashboard",
  icon: "Home",
  description: "Pipeline, showings, and commission tracking",
}))
.withData(async ({ workspace }) => {
  const [properties, clients, showings, transactions] = await Promise.all([
    workspace.core.collections.get("properties").findMany({ where: { status: "active" } }),
    workspace.core.collections.get("clients").findMany({ where: { status: { in: ["lead", "prospect", "active"] } } }),
    workspace.core.collections.get("showings").findMany({ where: { status: "scheduled" } }),
    workspace.core.collections.get("transactions").findMany({ where: { status: "closed" } }),
  ]);

  const thisMonth = new Date().toISOString().slice(0, 7);
  const monthlyTransactions = transactions.filter(t => t.closingDate.startsWith(thisMonth));
  const monthlyCommission = monthlyTransactions.reduce((s, t) => s + t.commissionAmount, 0);
  const totalPipeline = properties.reduce((s, p) => s + p.price, 0);

  return {
    items: properties,
    stats: {
      activeListings: properties.length,
      activeClients: clients.length,
      upcomingShowings: showings.length,
      monthlyCommission,
      totalPipeline,
      closedThisMonth: monthlyTransactions.length,
    },
    extra: { showings, clients, transactions },
  };
})
.withTree([
  Hero("Real Estate OS"),
  Grid({ columns: 4 }, [
    Metric("Active Listings", "/stats/activeListings"),
    Metric("Active Clients", "/stats/activeClients"),
    Metric("Monthly Commission", "/stats/monthlyCommission", { prefix: "$" }),
    Metric("Pipeline Value", "/stats/totalPipeline", { prefix: "$" }),
  ]),
  Section("Listing Pipeline", [
    Kanban("/items", {
      groupBy: "status",
      titleField: "address",
      columns: ["coming_soon", "active", "under_contract", "sold"],
      actions: [
        { label: "View", action: "navigate", path: "/properties/{id}" },
        { label: "Schedule Showing", action: "trigger", trigger: "schedule-showing" },
      ],
    }),
  ]),
  Section("Upcoming Showings", [
    Table("/extra/showings", {
      columns: ["date", "time", "property", "client", "status"],
      actions: [{ label: "Confirm", action: "trigger", trigger: "confirm-showing" }],
    }),
  ]),
  Section("Commission Trend", [
    Chart("/extra/transactions", {
      type: "bar",
      groupBy: "closingDate",
      valueField: "commissionAmount",
    }),
  ]),
])
```

### 3.2 `property-detail.view.ts` — Single Property View

```typescript
FractalView.create("property-detail", workspace => ({
  name: "Property Detail",
  icon: "Building",
  description: "Detailed view of a single property with activity history",
}))
.withData(async ({ workspace, options }) => {
  const propertyId = options?.where?.propertyId as string;
  const [property, showings, offers] = await Promise.all([
    workspace.core.collections.get("properties").findUnique({ where: { id: propertyId } }),
    workspace.core.collections.get("showings").findMany({ where: { propertyId } }),
    workspace.core.collections.get("offers").findMany({ where: { propertyId } }),
  ]);

  const daysOnMarket = Math.floor((Date.now() - new Date(property.listDate).getTime()) / 86400000);

  return {
    items: showings,
    stats: {
      price: property.price,
      daysOnMarket,
      totalShowings: showings.length,
      activeOffers: offers.filter(o => o.status === "submitted").length,
      priceChanges: property.price !== property.originalPrice ? property.originalPrice - property.price : 0,
    },
    extra: { property, offers },
  };
})
.withTree([
  Hero("{{extra.property.address}}", { subtitle: "{{extra.property.city}}, {{extra.property.state}} {{extra.property.zipCode}}" }),
  Grid({ columns: 4 }, [
    Metric("List Price", "/stats/price", { prefix: "$" }),
    Metric("Days on Market", "/stats/daysOnMarket"),
    Metric("Showings", "/stats/totalShowings"),
    Metric("Active Offers", "/stats/activeOffers"),
  ]),
  Section("Property Details", [
    Grid({ columns: 2 }, [
      Card("Details", { subtitle: "{{extra.property.bedrooms}} bed / {{extra.property.bathrooms}} bath / {{extra.property.sqft}} sqft" }),
      Card("Commission", { subtitle: "{{extra.property.commissionPercent}}% — ${{stats.price * extra.property.commissionPercent / 100}}" }),
    ]),
  ]),
  Section("Offer History", [
    Timeline("/extra/offers", {
      dateField: "submittedAt",
      titleField: "offerPrice",
      colorField: "status",
    }),
  ]),
  Section("Showing History", [
    Table("/items", {
      columns: ["date", "client", "interestLevel", "feedback"],
    }),
  ]),
])
```

---

## 4. Toolsets

### 4.1 MLS Integration Toolset
```typescript
{
  name: "mls",
  description: "Integration with Multiple Listing Service for property data",
  tools: [
    { name: "search_listings", description: "Search MLS for properties matching criteria" },
    { name: "sync_listing", description: "Sync property to/from MLS" },
    { name: "get_comparables", description: "Get comparable property sales data" },
    { name: "get_market_stats", description: "Fetch market statistics for an area" },
  ],
}
```

### 4.2 E-Signature Toolset
```typescript
{
  name: "esignature",
  description: "Document signing for contracts and disclosures",
  tools: [
    { name: "send_contract", description: "Send a contract for e-signature" },
    { name: "check_status", description: "Check signing status of a document" },
    { name: "download_signed", description: "Download completed signed document" },
  ],
}
```

### 4.3 Calendar & Scheduling Toolset
```typescript
{
  name: "calendar",
  description: "Scheduling showings, open houses, and closings",
  tools: [
    { name: "create_showing", description: "Schedule a property showing" },
    { name: "check_availability", description: "Check agent availability" },
    { name: "send_reminder", description: "Send showing reminder to client" },
    { name: "schedule_closing", description: "Schedule a closing date" },
  ],
}
```

### 4.4 Marketing Toolset
```typescript
{
  name: "marketing",
  description: "Property marketing and listing distribution",
  tools: [
    { name: "generate_flyer", description: "Generate property flyer from template" },
    { name: "post_social", description: "Post listing to social media" },
    { name: "send_email_campaign", description: "Send property email to client list" },
    { name: "create_virtual_tour", description: "Generate virtual tour link" },
  ],
}
```

---

## 5. Templates

### `property-flyer` Template
```handlebars
🏠 {{address}}

{{bedrooms}} Bed | {{bathrooms}} Bath | {{sqft}} Sq Ft
Listed at ${{price}}

{{description}}

{{#each features}}
✓ {{this}}
{{/each}}

Open House: {{openHouseDate}} {{openHouseTime}}
Contact: {{agentName}} — {{agentPhone}}

{{#if virtualTourUrl}}
🎥 Virtual Tour: {{virtualTourUrl}}
{{/if}}
```

### `showing-confirmation` Template
```handlebars
Hi {{clientName}},

Your showing is confirmed!

📍 {{address}}, {{city}}, {{state}} {{zipCode}}
📅 {{date}} at {{time}}
👤 Agent: {{agentName}}

See you there!
```

### `offer-summary` Template
```handlebars
OFFER SUMMARY — {{address}}

Buyer: {{clientName}}
Offer Price: ${{offerPrice}}
Financing: {{financingType}}
Earnest Money: ${{earnestMoney}}
Proposed Closing: {{closingDate}}

Contingencies:
{{#each contingency}}
- {{this}}
{{/each}}

Status: {{status}}
Response Deadline: {{responseDeadline}}
```

---

## 6. Agents

### `listing-agent` Agent
```yaml
name: Listing Agent
role: Property listing and marketing specialist
description: Manages listing lifecycle, price optimization, and marketing automation.
instructions: |
  You are a real estate listing specialist.
  - Monitor days-on-market and suggest price adjustments
  - Auto-generate marketing materials for new listings
  - Track comparable sales and provide pricing recommendations
  - Schedule and manage open houses
  - Alert on expired or underperforming listings
```

### `buyer-agent` Agent
```yaml
name: Buyer Agent
role: Buyer representation and showing coordination
description: Matches buyers with properties and coordinates showings.
instructions: |
  You are a buyer's agent specialist.
  - Match new buyer leads with suitable properties based on criteria
  - Schedule and coordinate property showings
  - Track showing feedback and interest levels
  - Prepare and submit offers
  - Manage buyer pipeline from lead to closing
```

---

## 7. Workflows

### New Listing Workflow
1. Create `properties` record → hook fires `property.new_listing` event
2. Agent auto-generates marketing materials via toolset
3. Sync listing to MLS → update `properties.mlsNumber`
4. Schedule open house → create `open_houses` record
5. Distribute to social media and email list

### Buyer Lead Workflow
1. New client inquiry → create `clients` record (status: "lead")
2. Agent matches buyer criteria to active listings
3. Schedule showings → create `showings` records
4. Collect feedback → update `showings.interestLevel`
5. If interested → prepare offer → create `offers` record
6. Offer accepted → create `transactions` record

### Closing Workflow
1. Offer accepted → update `properties.status = "under_contract"`
2. Create `transactions` record with all parties
3. Send contracts for e-signature via toolset
4. Track inspection, appraisal, and financing milestones
5. Close → update all statuses, calculate commission

---

## 8. Natural Evolution

- **Property management?** → Add `leases` and `rent_payments` collections + tenant portal view
- **Team brokerage?** → Add `agents` collection + team performance dashboards
- **CRM nurture?** → Add `campaigns` collection + drip email sequences
- **Market analytics?** → Add `market_data` collection + CMA (Comparative Market Analysis) toolset
- **Transaction coordination?** → Add `checklists` collection + milestone tracking
- **Referral tracking?** → Add `referrals` collection + commission split calculator