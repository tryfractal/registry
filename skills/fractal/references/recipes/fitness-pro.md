# Recipe: Fitness Pro OS

> **Use Case:** Personal trainer or nutritionist managing students, workouts, meals, and progress.
> **Replaces:** Trainerize + TrueCoach + MyFitnessPal + spreadsheets.
> **User Profile:** Personal trainer, nutritionist, health coach, yoga instructor.

## Overview

This recipe turns Fractal into a specialized coaching platform. It manages the entire athlete/student lifecycle from intake to periodic evaluation. Using Collections for students, workouts, and meals — and Views for progress tracking — you provide a professional, data-driven coaching experience.

---

## 1. Collections

### 1.1 `students` — Client Roster

```typescript
z.object({
  name: z.string().describe("Full name"),
  email: z.string().email(),
  phone: z.string(),
  goal: z.enum(["weight_loss", "muscle_gain", "performance", "health"]).describe("Primary objective"),
  restrictions: z.array(z.string()).default([]).describe("Injuries or allergies"),
  activePlan: z.string().optional().describe("Current program name"),
  membershipStatus: z.enum(["active", "paused", "trial", "inactive"]).default("trial"),
  startDate: z.string(),
  nextAssessment: z.string().optional(),
})
```

### 1.2 `workouts` — Training Programs

```typescript
z.object({
  studentId: z.string().uuid(),
  title: z.string().describe("e.g., Push Day, Full Body A"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  exercises: z.array(z.object({
    name: z.string(),
    sets: z.number().int(),
    reps: z.string().describe("e.g., 10-12 or AMRAP"),
    rest: z.string().describe("e.g., 60s"),
    notes: z.string().optional(),
  })),
  frequency: z.string().describe("e.g., 3x per week"),
  lastUpdated: z.string().datetime(),
})
```

### 1.3 `meals` — Nutrition Plans

```typescript
z.object({
  studentId: z.string().uuid(),
  title: z.string().describe("e.g., Cutting Plan V2"),
  dailyMacros: z.object({
    protein: z.number().describe("grams"),
    carbs: z.number(),
    fat: z.number(),
    calories: z.number(),
  }),
  meals: z.array(z.object({
    time: z.string().describe("e.g., 08:00"),
    name: z.string(),
    items: z.array(z.string()),
    macros: z.record(z.number()).optional(),
  })),
})
```

### 1.4 `progress` — Biometric Tracking

```typescript
z.object({
  studentId: z.string().uuid(),
  date: z.string(),
  weight: z.number().describe("kg"),
  bodyFat: z.number().optional().describe("%"),
  measurements: z.record(z.number()).optional().describe("e.g., waist: 80"),
  photos: z.array(z.string()).default([]).describe("File paths to progress photos"),
  notes: z.string().optional(),
})
```

---

## 2. Hooks — Intelligent Automation

### Hook: Progress Notification
```typescript
// Collection: progress — onCreated
.onCreated(async ({ value, workspace }) => {
  const student = await workspace.core.collections.get("students").findUnique({
    where: { id: value.studentId }
  });

  // Calculate weight change
  const previous = await workspace.core.collections.get("progress").findMany({
    where: { studentId: value.studentId },
    orderBy: { date: "desc" },
    take: 2
  });

  if (previous.length > 1) {
    const diff = value.weight - previous[1].weight;
    await workspace.events.publish({
      type: "fitness.progress_recorded",
      data: { studentName: student.name, weightDiff: diff }
    });
  }
  return value;
})
```

---

## 3. Views — Coaching Dashboards

### 3.1 `coach-dashboard.view.ts` — Trainer Overview
Metrics: Active students, assessments due this week, average student adherence.
Components: `Grid` of `Metrics`, `Table` of students, `Chart` of revenue.

### 3.2 `student-portal.view.ts` — Client View
Components: `Card` with today's workout, `Metric` for current weight, `Timeline` of recent activities.

---

## 4. Toolsets

- **WhatsApp Toolset:** Send daily workouts or reminders to students.
- **Nutrition API Toolset:** Fetch macro info for foods (e.g., FatSecret API).
- **Stripe Toolset:** Manage monthly coaching subscriptions.

---

## 5. Templates

### `workout-pdf`
Handlebars template to generate a printable PDF version of the workout plan.

---

## 6. Agents

### `training-assistant` Agent
- Helps the coach design workouts based on restrictions.
- Analyzes progress data to suggest load increases.
- Answers student questions in chat about exercise form.
