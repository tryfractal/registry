# Recipe: Tutor OS

> **Use Case:** Private tutor or professor managing students, lessons, grades, and assignments.
> **Replaces:** Google Classroom + spreadsheets + Remind + local folders.
> **User Profile:** Private tutor, university professor, language teacher, music instructor.

## Overview

Tutor OS organizes educational content and student progress in one place. It allows for personalized lesson planning, automated reminders for students, and a clear view of academic performance over time.

---

## 1. Collections

### 1.1 `students` — Academic Roster

```typescript
z.object({
  name: z.string(),
  grade_level: z.string(),
  subjects: z.array(z.string()),
  parent_contact: z.string().optional(),
  student_email: z.string().email().optional(),
  status: z.enum(["active", "prospective", "inactive"]),
  notes: z.string().optional().describe("Learning style, difficulties"),
})
```

### 1.2 `lessons` — Content Library

```typescript
z.object({
  subject: z.string(),
  topic: z.string(),
  content: z.string().describe("Markdown content / Lesson plan"),
  attachments: z.array(z.string()).default([]).describe("File paths to PDFs/Slides"),
  estimated_duration: z.number().describe("minutes"),
})
```

### 1.3 `sessions` — Attendance & Delivery

```typescript
z.object({
  studentId: z.string().uuid(),
  lessonId: z.string().uuid().optional(),
  date: z.string(),
  topics_covered: z.array(z.string()),
  homework_assigned: z.string().optional(),
  attendance: z.enum(["present", "absent", "late"]),
})
```

### 1.4 `grades` — Performance Tracking

```typescript
z.object({
  studentId: z.string().uuid(),
  subject: z.string(),
  assessment_name: z.string().describe("e.g., Midterm, Quiz 1"),
  score: z.number(),
  max_score: z.number(),
  date: z.string(),
  feedback: z.string().optional(),
})
```

---

## 2. Hooks

### Hook: Homework Reminder
When a session is created with `homework_assigned`, schedule a WhatsApp/Email reminder for the student 2 days later.

### Hook: Low Grade Alert
If a grade is recorded below 70%, create a `task` for the tutor to "Review [Topic] with [Student]".

---

## 3. Views

### 3.1 `tutor-dashboard.view.ts`
Metrics: Lessons this week, average student grade, attendance rate.
Components: `Grid` of weekly sessions, `Chart` of grade trends.

### 3.2 `lesson-planner.view.ts`
Library of all `lessons` with `Table` and search. Action: "Assign to student".

---

## 4. Toolsets

- **Google Meet Toolset:** Auto-generate meeting links for online sessions.
- **Khan Academy Toolset:** Search and link relevant external exercises.
- **WhatsApp Toolset:** Direct communication with students/parents.

---

## 5. Templates

### `performance-report`
Handlebars template generating a monthly progress summary for parents.

---

## 6. Agents

### `curriculum-agent`
- Suggests lesson topics based on student difficulties.
- Summarizes performance trends.
- Grades assignments using provided rubrics.
