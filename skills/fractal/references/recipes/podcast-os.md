# Recipe: Podcast OS

> **Use Case:** Podcast producer managing episodes, guests, sponsors, and publishing pipeline.
> **Replaces:** Notion + Google Calendar + Trello + spreadsheets + Descript (partially).
> **User Profile:** Podcast host, producer, content creator, media agency.

## Overview

This recipe streamlines the production of a podcast. From the initial idea to the published episode analytics, everything lives in Fractal. It coordinates guest outreach, sponsorship tracking, and the editorial pipeline.

---

## 1. Collections

### 1.1 `episodes` — Editorial Pipeline

```typescript
z.object({
  title: z.string(),
  number: z.number().int(),
  status: z.enum(["idea", "outreach", "scheduled", "recorded", "editing", "ready", "published"]).default("idea"),
  recordingDate: z.string().optional(),
  publishDate: z.string().optional(),
  guestId: z.string().uuid().optional(),
  description: z.string().describe("Show notes"),
  rawAudioPath: z.string().optional(),
  finalAudioUrl: z.string().optional(),
  tags: z.array(z.string()).default([]),
})
```

### 1.2 `guests` — Guest Database

```typescript
z.object({
  name: z.string(),
  bio: z.string(),
  expertise: z.array(z.string()),
  contact: z.string().describe("Email or social handle"),
  status: z.enum(["lead", "contacted", "confirmed", "past_guest", "rejected"]).default("lead"),
  pastEpisodes: z.array(z.string()).default([]).describe("Episode IDs"),
})
```

### 1.3 `sponsors` — Revenue Tracking

```typescript
z.object({
  brand: z.string(),
  contactPerson: z.string(),
  amount: z.number(),
  episodes: z.array(z.string()).describe("Purchased episode slots"),
  status: z.enum(["prospect", "negotiation", "active", "completed"]),
})
```

---

## 2. Hooks

### Hook: Auto-Episode Numbering
Increments the episode number automatically on creation.

### Hook: Guest Invitation
When status changes to `outreach`, render an invitation template and send via Email toolset.

---

## 3. Views

### 3.1 `editorial-calendar.view.ts`
`Kanban` view grouped by `status`. Cards show episode title, number, and guest name.

### 3.2 `sponsorship-dashboard.view.ts`
`Metric` cards for Total Revenue, Active Sponsors, and Projected Earnings. `Table` of upcoming sponsored slots.

---

## 4. Toolsets

- **Spotify API Toolset:** Fetch episode analytics (downloads, listeners).
- **Whisper Toolset:** Auto-transcribe raw audio into Markdown show notes.
- **Calendly Toolset:** Let guests pick their recording slot.

---

## 5. Templates

### `guest-invite-email`
Personalized invitation explaining the show format and expertise match.

### `show-notes-md`
Structure for the final Markdown file: Intro, Bio, Chapters, Links, Sponsor mentions.

---

## 6. Agents

### `producer-agent`
- Researches guests based on expertise.
- Generates show notes chapters from transcripts.
- Manages the publishing checklist.
