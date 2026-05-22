# Recipe: Restaurant OS

> **Use Case:** Restaurant management — reservations, menu, inventory, staff, and financials.
> **Replaces:** Toast + OpenTable + MarketMan + HotSchedules + QuickBooks
> **User Profile:** Restaurant owner, manager, chef, FOH/BOH staff

## Overview

This recipe transforms the Fractal workspace into a complete restaurant management system. With Collections for menu items, reservations, orders, inventory, and staff scheduling — Views for kitchen dashboards and FOH management — Toolsets for POS integration, delivery platforms, and supplier ordering — you replace 5+ SaaS products with one adaptive system.

---

## 1. Collections

### 1.1 `menu_items` — Menu Catalog

```typescript
z.object({
  name: z.string().describe("Dish name"),
  description: z.string().optional().describe("Menu description"),
  category: z.enum(["appetizer", "entree", "dessert", "beverage", "side", "special"]).describe("Menu category"),
  cuisine: z.string().optional().describe("Cuisine type (Italian, Japanese, etc.)"),
  price: z.number().min(0).describe("Selling price"),
  cost: z.number().min(0).describe("Ingredient cost"),
  prepTime: z.number().int().min(0).describe("Prep time in minutes"),
  calories: z.number().int().min(0).optional().describe("Calorie count"),
  allergens: z.array(z.enum(["gluten", "dairy", "nuts", "shellfish", "soy", "egg", "fish"])).default([]),
  dietary: z.array(z.enum(["vegan", "vegetarian", "keto", "gluten-free", "halal", "kosher"])).default([]),
  available: z.boolean().default(true).describe("Currently on menu"),
  seasonal: z.boolean().default(false),
  image: z.string().optional().describe("Image URL or file path"),
  spiceLevel: z.enum(["none", "mild", "medium", "hot", "extreme"]).default("none"),
})
```

### 1.2 `reservations` — Table Reservations

```typescript
z.object({
  date: z.string().describe("Reservation date (YYYY-MM-DD)"),
  time: z.string().describe("Reservation time (HH:mm)"),
  partySize: z.number().int().min(1).describe("Number of guests"),
  customerName: z.string().describe("Guest name"),
  customerPhone: z.string().describe("Contact phone"),
  customerEmail: z.string().email().optional(),
  tableId: z.string().optional().describe("Assigned table"),
  status: z.enum(["confirmed", "waitlist", "seated", "completed", "cancelled", "no_show"]).default("confirmed"),
  specialRequests: z.string().optional().describe("Dietary needs, celebrations, etc."),
  occasion: z.enum(["none", "birthday", "anniversary", "business", "date", "other"]).default("none"),
  depositPaid: z.boolean().default(false),
  notes: z.string().optional(),
})
```

### 1.3 `orders` — Customer Orders

```typescript
z.object({
  tableNumber: z.string().optional().describe("Dine-in table"),
  type: z.enum(["dine_in", "takeout", "delivery"]).describe("Order type"),
  items: z.array(z.object({
    menuItemId: z.string().uuid(),
    name: z.string(),
    quantity: z.number().int().min(1),
    price: z.number().min(0),
    modifications: z.string().optional(),
    course: z.enum(["starter", "main", "dessert"]).default("main"),
  })),
  subtotal: z.number().min(0),
  tax: z.number().min(0),
  tip: z.number().min(0).default(0),
  total: z.number().min(0),
  status: z.enum(["received", "preparing", "ready", "served", "completed", "cancelled"]).default("received"),
  serverId: z.string().optional().describe("Server/employee reference"),
  reservationId: z.string().optional(),
  deliveryAddress: z.string().optional(),
  estimatedReady: z.string().optional().describe("Estimated completion time"),
  completedAt: z.string().optional(),
})
```

### 1.4 `inventory` — Ingredient & Supply Stock

```typescript
z.object({
  name: z.string().describe("Ingredient or supply name"),
  category: z.enum(["protein", "produce", "dairy", "dry_goods", "beverage", "packaging", "cleaning", "other"]).describe("Category"),
  unit: z.enum(["kg", "lb", "liter", "gallon", "piece", "case", "bag", "bottle"]).describe("Unit of measure"),
  currentStock: z.number().min(0).describe("Current quantity on hand"),
  minStock: z.number().min(0).describe("Minimum threshold for reorder alert"),
  reorderQuantity: z.number().min(0).describe("Amount to order when restocking"),
  costPerUnit: z.number().min(0).describe("Cost per unit"),
  supplierId: z.string().optional().describe("Primary supplier reference"),
  storageLocation: z.enum(["walk_in", "freezer", "dry_storage", "bar", "prep_area"]).optional(),
  expiryDate: z.string().optional().describe("Expiration date for perishables"),
  lastRestocked: z.string().optional(),
})
```

### 1.5 `staff` — Employee Management

```typescript
z.object({
  name: z.string().describe("Employee name"),
  role: z.enum(["chef", "sous_chef", "line_cook", "prep_cook", "dishwasher", "server", "host", "bartender", "manager", "owner"]).describe("Role"),
  phone: z.string().describe("Contact phone"),
  email: z.string().email().optional(),
  hireDate: z.string().describe("Date hired"),
  hourlyRate: z.number().min(0).describe("Pay rate per hour"),
  certifications: z.array(z.enum(["food_handler", "servsafe", "alcohol", "cpr", "allergen"])).default([]),
  availability: z.object({
    monday: z.array(z.string()).default([]).describe("Available shift times"),
    tuesday: z.array(z.string()).default([]),
    wednesday: z.array(z.string()).default([]),
    thursday: z.array(z.string()).default([]),
    friday: z.array(z.string()).default([]),
    saturday: z.array(z.string()).default([]),
    sunday: z.array(z.string()).default([]),
  }).default({}),
  active: z.boolean().default(true),
  notes: z.string().optional(),
})
```

### 1.6 `shifts` — Schedule Shifts

```typescript
z.object({
  staffId: z.string().uuid().describe("Employee reference"),
  date: z.string().describe("Shift date (YYYY-MM-DD)"),
  startTime: z.string().describe("Shift start (HH:mm)"),
  endTime: z.string().describe("Shift end (HH:mm)"),
  role: z.string().describe("Assigned role for this shift"),
  section: z.string().optional().describe("Section/position assignment"),
  status: z.enum(["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]).default("scheduled"),
  tips: z.number().min(0).optional().describe("Tips earned this shift"),
  notes: z.string().optional(),
})
```

### 1.7 `suppliers` — Vendor Management

```typescript
z.object({
  name: z.string().describe("Supplier name"),
  contactName: z.string().optional(),
  phone: z.string(),
  email: z.string().email().optional(),
  category: z.enum(["protein", "produce", "dairy", "dry_goods", "beverage", "packaging", "equipment", "other"]).describe("Primary category"),
  leadTimeDays: z.number().int().min(0).default(2).describe("Typical delivery lead time"),
  minimumOrder: z.number().min(0).optional().describe("Minimum order amount"),
  rating: z.number().min(1).max(5).optional().describe("Quality rating"),
  paymentTerms: z.string().optional().describe("Net 30, COD, etc."),
  notes: z.string().optional(),
  active: z.boolean().default(true),
})
```

---

## 2. Hooks — Intelligent Automation

### Hook: Low Stock Alert
```typescript
// Collection: inventory — onUpdated
.onUpdated(async ({ value, workspace }) => {
  if (value.currentStock <= value.minStock) {
    await workspace.events.emit({
      type: "inventory.low_stock",
      data: {
        item: value.name,
        current: value.currentStock,
        minimum: value.minStock,
        reorderQty: value.reorderQuantity,
        supplierId: value.supplierId,
      },
    });
  }
  return value;
})
```

### Hook: Auto-Calculate Order Totals
```typescript
// Collection: orders — onCreated & onUpdated
.onCreated(async ({ value, workspace }) => {
  const subtotal = value.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  const tax = subtotal * 0.08; // 8% tax rate
  const total = subtotal + tax + value.tip;
  return { ...value, subtotal, tax, total };
})
```

### Hook: Deduct Inventory on Order Completion
```typescript
// Collection: orders — onUpdated (status → completed)
.onUpdated(async ({ value, workspace }) => {
  if (value.status !== "completed") return value;

  // Deduct ingredients from inventory based on menu items
  for (const item of value.items) {
    const menuItem = await workspace.core.collections.get("menu_items").findUnique({
      where: { id: item.menuItemId },
    });
    // Recipe cost tracking — could link to a recipes collection
    // For now, deduct based on cost
  }
  return value;
})
```

### Hook: Reservation Reminder
```typescript
// Collection: reservations — onCreated
.onCreated(async ({ value, workspace }) => {
  await workspace.events.emit({
    type: "reservation.created",
    data: {
      customerName: value.customerName,
      date: value.date,
      time: value.time,
      partySize: value.partySize,
      phone: value.customerPhone,
    },
  });
  return value;
})
```

---

## 3. Views — Dashboards

### 3.1 `restaurant-dashboard.view.ts` — Manager Overview

```typescript
FractalView.create("restaurant-dashboard", workspace => ({
  name: "Restaurant Dashboard",
  icon: "UtensilsCrossed",
  description: "Real-time restaurant operations overview",
}))
.withData(async ({ workspace }) => {
  const today = new Date().toISOString().split("T")[0];

  const [orders, reservations, inventory, shifts] = await Promise.all([
    workspace.core.collections.get("orders").findMany({ where: { date: today } }),
    workspace.core.collections.get("reservations").findMany({ where: { date: today } }),
    workspace.core.collections.get("inventory").findMany({}),
    workspace.core.collections.get("shifts").findMany({ where: { date: today } }),
  ]);

  const lowStockItems = inventory.filter(i => i.currentStock <= i.minStock);
  const todaysRevenue = orders.filter(o => o.status === "completed").reduce((s, o) => s + o.total, 0);
  const avgOrderValue = orders.length > 0 ? todaysRevenue / orders.length : 0;

  return {
    items: orders,
    stats: {
      todaysRevenue,
      totalOrders: orders.length,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100,
      reservations: reservations.filter(r => r.status === "confirmed").length,
      staffOnDuty: shifts.filter(s => s.status === "in_progress" || s.status === "confirmed").length,
      lowStockAlerts: lowStockItems.length,
    },
    extra: { lowStock: lowStockItems, reservations, shifts },
  };
})
.withTree([
  Hero("Restaurant OS"),
  Grid({ columns: 4 }, [
    Metric("Today's Revenue", "/stats/todaysRevenue", { prefix: "$", variant: "default" }),
    Metric("Orders", "/stats/totalOrders"),
    Metric("Reservations", "/stats/reservations"),
    Metric("Low Stock Alerts", "/stats/lowStockAlerts", { variant: "destructive" }),
  ]),
  Section("Low Stock Items", [
    Table("/extra/lowStock", {
      columns: ["name", "category", "currentStock", "minStock", "supplier"],
      actions: [{ label: "Reorder", action: "trigger", trigger: "reorder-item" }],
    }),
  ]),
  Section("Today's Reservations", [
    Table("/extra/reservations", {
      columns: ["time", "customerName", "partySize", "tableId", "status"],
      actions: [
        { label: "Seat", action: "trigger", trigger: "seat-reservation" },
        { label: "Cancel", action: "trigger", trigger: "cancel-reservation" },
      ],
    }),
  ]),
  Section("Order Trends", [
    Chart("/items", {
      type: "bar",
      groupBy: "type",
      valueField: "total",
    }),
  ]),
])
```

### 3.2 `kitchen-display.view.ts` — Kitchen Screen

```typescript
FractalView.create("kitchen-display", workspace => ({
  name: "Kitchen Display",
  icon: "ChefHat",
  description: "Real-time order queue for kitchen staff",
}))
.withData(async ({ workspace }) => {
  const orders = await workspace.core.collections.get("orders").findMany({
    where: { status: { in: ["received", "preparing"] } },
  });

  const sorted = orders.sort((a, b) => {
    const priority = { received: 1, preparing: 2 };
    return (priority[a.status] || 3) - (priority[b.status] || 3);
  });

  return {
    items: sorted,
    stats: {
      pending: orders.filter(o => o.status === "received").length,
      preparing: orders.filter(o => o.status === "preparing").length,
    },
    extra: {},
  };
})
.withTree([
  Hero("Kitchen Display"),
  Grid({ columns: 2 }, [
    Metric("Pending", "/stats/pending", { variant: "warning" }),
    Metric("Preparing", "/stats/preparing", { variant: "default" }),
  ]),
  Section("Active Orders", [
    Kanban("/items", {
      groupBy: "status",
      titleField: "tableNumber",
      columns: ["received", "preparing", "ready"],
      actions: [
        { label: "Start", action: "trigger", trigger: "start-order" },
        { label: "Ready", action: "trigger", trigger: "ready-order" },
      ],
    }),
  ]),
])
```

### 3.3 `menu-management.view.ts` — Menu & Pricing

```typescript
FractalView.create("menu-management", workspace => ({
  name: "Menu Management",
  icon: "BookOpen",
  description: "Manage menu items, pricing, and profitability",
}))
.withData(async ({ workspace }) => {
  const menuItems = await workspace.core.collections.get("menu_items").findMany({});

  const byCategory = {};
  menuItems.forEach(item => {
    if (!byCategory[item.category]) byCategory[item.category] = [];
    byCategory[item.category].push(item);
  });

  const avgFoodCost = menuItems.reduce((s, i) => s + (i.cost / i.price), 0) / menuItems.length;

  return {
    items: menuItems,
    stats: {
      totalItems: menuItems.length,
      availableItems: menuItems.filter(i => i.available).length,
      avgFoodCostPercent: Math.round(avgFoodCost * 10000) / 100,
      categories: Object.keys(byCategory).length,
    },
    extra: { byCategory },
  };
})
.withTree([
  Hero("Menu Management"),
  Grid({ columns: 4 }, [
    Metric("Total Items", "/stats/totalItems"),
    Metric("Available", "/stats/availableItems"),
    Metric("Avg Food Cost %", "/stats/avgFoodCostPercent", { suffix: "%" }),
    Metric("Categories", "/stats/categories"),
  ]),
  Section("Menu by Category", [
    Grid({ columns: 3 }, Object.keys("/extra/byCategory").map(cat =>
      Card(cat, {
        subtitle: "{{extra.byCategory[cat].length}} items",
        actions: [{ label: "View", action: "navigate", path: `/menu/${cat}` }],
      })
    )),
  ]),
  Section("Profitability", [
    Chart("/items", {
      type: "scatter",
      xField: "cost",
      yField: "price",
      groupBy: "category",
    }),
  ]),
])
```

---

## 4. Toolsets

### 4.1 POS Integration Toolset
```typescript
{
  name: "pos",
  description: "Point-of-sale system integration for order processing",
  tools: [
    { name: "send_order", description: "Push order to POS terminal" },
    { name: "get_daily_summary", description: "Fetch daily sales summary from POS" },
    { name: "process_payment", description: "Process payment for an order" },
    { name: "refund_order", description: "Issue a refund for an order" },
  ],
}
```

### 4.2 Delivery Platform Toolset
```typescript
{
  name: "delivery",
  description: "Integration with delivery platforms (UberEats, DoorDash, etc.)",
  tools: [
    { name: "sync_menu", description: "Sync menu items to delivery platform" },
    { name: "receive_order", description: "Receive order from delivery platform" },
    { name: "update_availability", description: "Toggle item availability on platforms" },
    { name: "get_delivery_status", description: "Track delivery driver status" },
  ],
}
```

### 4.3 Supplier Ordering Toolset
```typescript
{
  name: "supplier",
  description: "Automated supplier ordering and price comparison",
  tools: [
    { name: "place_order", description: "Place an order with a supplier" },
    { name: "compare_prices", description: "Compare prices across suppliers" },
    { name: "track_delivery", description: "Track incoming supplier deliveries" },
  ],
}
```

---

## 5. Templates

### `reservation-confirmation` Template
```handlebars
Hi {{customerName}},

Your reservation is confirmed!

📅 Date: {{date}}
🕐 Time: {{time}}
👥 Party Size: {{partySize}}

{{#if specialRequests}}
Special Requests: {{specialRequests}}
{{/if}}

We look forward to seeing you!

To modify or cancel, reply to this message.
```

### `reorder-alert` Template
```handlebars
⚠️ LOW STOCK ALERT

Item: {{name}}
Category: {{category}}
Current Stock: {{currentStock}} {{unit}}
Minimum Threshold: {{minStock}} {{unit}}
Suggested Reorder: {{reorderQuantity}} {{unit}}

Please reorder from supplier: {{supplierName}}
```

### `daily-sales-report` Template
```handlebars
📊 Daily Sales Report — {{date}}

Revenue: ${{totalRevenue}}
Orders: {{totalOrders}}
Avg Order Value: ${{avgOrderValue}}

By Type:
  Dine-in: ${{dineInRevenue}} ({{dineInOrders}} orders)
  Takeout: ${{takeoutRevenue}} ({{takeoutOrders}} orders)
  Delivery: ${{deliveryRevenue}} ({{deliveryOrders}} orders))

Top Sellers:
{{#each topSellers}}
  {{name}} — {{count}} sold (${{revenue}})
{{/each}}

Staff on duty: {{staffCount}}
Reservations: {{reservationCount}}
```

---

## 6. Agents

### `kitchen-coordinator` Agent
```yaml
name: Kitchen Coordinator
role: Kitchen operations and order management
description: Manages order flow, inventory alerts, and kitchen timing.
instructions: |
  You are a kitchen coordinator for a restaurant.
  - Monitor active orders and alert kitchen staff of new orders
  - Track prep times and flag orders exceeding estimated times
  - Alert when inventory reaches minimum stock levels
  - Suggest menu item 86 (unavailable) when ingredients run low
  - Coordinate with FOH on special dietary requests
```

### `restaurant-manager` Agent
```yaml
name: Restaurant Manager
role: Operations and financial management
description: Oversees daily operations, staff scheduling, and profitability.
instructions: |
  You are a restaurant general manager.
  - Generate daily sales reports every closing
  - Track food cost percentages and flag items above 35%
  - Manage staff scheduling and coverage gaps
  - Monitor reservation patterns and suggest staffing adjustments
  - Analyze menu profitability and recommend pricing changes
```

---

## 7. Workflows

### Daily Service Workflow
1. **Pre-service (2hrs before):** Manager opens dashboard → reviews reservations, staff schedule, inventory alerts
2. **Service:** Orders flow in → kitchen display updates in real-time → inventory auto-deducts on completion
3. **Post-service:** Daily sales report auto-generated → inventory alerts checked → next-day prep list created

### Inventory Reorder Workflow
1. Stock reaches minimum threshold → hook fires `inventory.low_stock` event
2. Manager receives alert → reviews reorder suggestion with supplier comparison
3. Places order via supplier toolset → updates `inventory.lastRestocked`
4. Delivery arrives → updates `inventory.currentStock`

### Weekly Menu Planning
1. Manager reviews `menu-management` view → identifies seasonal items to rotate
2. Creates new `menu_items` or updates existing → toggles `available` flag
3. Syncs updated menu to delivery platforms via toolset
4. Updates recipe costs and verifies pricing targets

---

## 8. Natural Evolution

- **Multiple locations?** → Add `locations` collection + multi-location dashboards
- **Loyalty program?** → Add `customers` collection + `loyalty_points` tracking
- **Catering?** → Add `catering_orders` collection + custom pricing hooks
- **Recipe management?** → Add `recipes` collection linking ingredients to menu items
- **Tip distribution?** → Add `tip_pools` collection + automatic split calculations
- **Health inspection?** → Add `inspections` collection + compliance checklist views