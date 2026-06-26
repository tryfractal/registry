---
name: apple
description: >-
  Control native macOS apps — Messages, Mail, Notes, Calendar, Reminders,
  Contacts, and Maps — via AppleScript through the apple-mcp server. Use
  this skill when the user wants to send or read iMessages, check unread
  email, search or send mail, find or create notes, list or search reminders,
  create calendar events, look up contacts, search Maps for directions and
  locations, or search the web with DuckDuckGo. Triggers on phrases like
  "send a text to John", "check my unread emails", "find the note about
  AI", "create a reminder for tomorrow at 5pm", "what's on my calendar
  this week", "find Alice in my contacts", "search the web for latest
  AI news", "get directions to the airport", or any request to interact
  with native macOS applications from the agent. Use this skill even if
  the user just says "use my Mac", "check iMessage", or "find that email".
  Requires macOS with full-disk accessibility permissions granted to the
  terminal running the MCP server.
---

# Apple Skill

This skill exposes the **apple-mcp server** (`apple-mcp`, published by `supermemoryai`, maintained in the `jxnl/apple-mcp` fork) as a single Fractal toolset. The server uses AppleScript to drive native macOS applications — Messages, Mail, Notes, Calendar, Reminders, Contacts, and Maps.

## Toolset

- `mcp` — apple-mcp server (`bunx apple-mcp@latest`). Transport is **stdio**. Requires `bun` (install via `brew install oven-sh/bun/bun`). On first run, macOS prompts for accessibility permissions — grant them to the terminal that runs the MCP server (System Settings → Privacy & Security → Accessibility).

## Tools reference

| Tool | Operations | Key params |
|---|---|---|
| `contacts` | search (by name) or list all | `name` (optional) |
| `notes` | `list`, `search`, `create` | `operation`, `searchText`, `title`, `body`, `folderName` |
| `messages` | `send`, `read`, `unread`, `schedule` | `operation`, `phoneNumber`, `message`, `limit`, `scheduledTime` |
| `mail` | `unread`, `search`, `send`, `mailboxes`, `accounts`, `latest` | `operation`, `account`, `mailbox`, `limit`, `searchTerm`, `to`, `subject`, `body`, `cc`, `bcc` |
| `reminders` | `list`, `search`, `open`, `create`, `listById` | `operation`, `searchText`, `name`, `listName`, `listId`, `props`, `notes`, `dueDate` |
| `calendar` | `list`, `search`, `open`, `create` | `operation`, `searchText`, `eventId`, `limit`, `fromDate`, `toDate`, `title`, `startDate`, `endDate`, `location`, `notes`, `isAllDay`, `calendarName` |
| `maps` | `search`, `save`, `directions`, `pin`, `listGuides`, `addToGuide`, `createGuide` | `operation`, `query`, `limit`, `name`, `address`, `fromAddress`, `toAddress`, `transportType`, `guideName` |
| `webSearch` | web search (DuckDuckGo) | `query` |

> **Note:** `webSearch` sends network requests to DuckDuckGo. It may fail to load on some macOS configurations because the server uses lazy module loading with a 5-second eager-load timeout. If `webSearch` returns an error, tell the user the DuckDuckGo module failed to initialize and offer to search via a browser skill (playwright / chrome) instead.

---

## Workflows

### Contacts

```
1. To find a contact's phone number: call `contacts` with `{ name: "Alice" }`
2. To list every contact with a phone number: call `contacts` with `{}` (no name)
```

- The tool returns raw phone numbers. Pass those numbers directly to `messages` operations — the Messages tool expects a numeric string or email, **not** a contact name.
- If a contact has no phone number, the tool skips them. Try searching by first name, last name, or a partial match.

### Notes

**Workflow to find a note by content:**

```
1. Call `notes` with `{ operation: "search", searchText: "..." }`
2. The response returns note names and their full content.
3. If no results, try a different keyword — AppleScript full-text search is limited.
```

**Workflow to create a note:**

```
1. Call `notes` with `{ operation: "create", title: "...", body: "...", folderName?: "..." }`
2. `folderName` defaults to "Claude" if omitted. If the folder doesn't exist, the server creates it automatically.
```

- **Gotcha:** AppleScript full-text search for notes is limited and may miss results that Spotlight would find. If a search returns nothing, try a single distinctive word rather than a phrase.
- **Gotcha:** The `body` field supports plain text only. Markdown formatting will appear as raw text in the Notes app.

### Messages (iMessage)

**Workflow to send a message:**

```
1. Resolve the contact: call `contacts` with `{ name: "..." }` to get the phone number
2. Confirm with the user: "I'll send '[message]' to [name] at [number]. OK?"
3. Send: call `messages` with `{ operation: "send", phoneNumber: "...", message: "..." }`
```

**Operations reference:**

- `send` — sends immediately. Requires `phoneNumber` + `message`.
- `schedule` — schedules for later. Requires `phoneNumber` + `message` + `scheduledTime` (ISO 8601 string).
- `read` — reads recent messages from a conversation. Requires `phoneNumber`. Optional `limit` (default is all messages).
- `unread` — checks all unread iMessages. Optional `limit`.

- **Gotcha:** `phoneNumber` must be a raw number (`"+551199999999"`) or an email registered in iMessage. A contact name alone will fail — **always resolve via `contacts` first**.
- **Gotcha:** Scheduled messages persist in the system and will be sent even if the server restarts or the agent session ends.
- **Critical:** Always confirm the recipient and message content with the user before `send` or `schedule`. These operations cannot be recalled.

### Mail

**Operations (ordered by common usage):**

- **`latest`** — fetch the most recent emails (across all accounts or a specific account). Optional `limit` (default is server-defined). Use this when the user says "show me my recent emails".
- **`unread`** — fetch unread emails. Optional `account`, `mailbox`, `limit`.
- **`search`** — search emails by text. Requires `searchTerm`. Optional `account`, `mailbox`, `limit`.
- **`send`** — send an email. Requires `to`, `subject`, `body`. Optional `cc`, `bcc`, `account`.
- **`accounts`** — list all configured email accounts in Apple Mail.
- **`mailboxes`** — list mailboxes. Optional `account` to scope.

**Workflow to send an email:**

```
1. (Optional) Call `mail` with `{ operation: "accounts" }` to see available accounts
2. (Optional) Call `mail` with `{ operation: "mailboxes", account: "..." }` to scope the mailbox
3. Confirm with the user: "I'll send '[subject]' to [to] with body '[body preview]'. OK?"
4. Send: call `mail` with `{ operation: "send", to: "...", subject: "...", body: "...", cc?: "...", bcc?: "..." }`
```

- **Gotcha:** Mail search uses AppleScript's built-in search which can be slow on large mailboxes. Specify `account` and `mailbox` when possible to narrow the scope and speed up results.
- **Gotcha:** The `body` parameter is plain text. HTML formatting will be stripped or appear as raw markup.
- **Critical:** Always confirm `to`, `subject`, and a preview of `body` before calling `send`. Sent emails cannot be recalled.

### Reminders

**Operations:**

- **`list`** — returns all reminder lists and a count of reminders in each. Use this first to discover `listId` values.
- **`search`** — find reminders by text. Requires `searchText`.
- **`open`** — opens the Reminders app and navigates to the matching reminder. Requires `searchText`.
- **`create`** — create a new reminder. Requires `name`. Optional `listName`, `notes`, `dueDate` (ISO 8601).
- **`listById`** — get reminders from a specific list. Requires `listId`. Optional `props` array to specify which fields to return (e.g., `["name", "dueDate", "notes", "priority"]`).

**Workflow to create a reminder:**

```
1. (Optional) Call `reminders` with `{ operation: "list" }` to find which list to use
2. Build the params: name is required; dueDate should be ISO 8601; notes is plain text
3. Create: call `reminders` with `{ operation: "create", name: "...", listName?: "...", notes?: "...", dueDate?: "..." }`
```

- **Gotcha:** `dueDate` must be a full ISO 8601 string (e.g., `"2026-06-27T17:00:00.000Z"`). A plain date like `"2026-06-27"` may not be parsed correctly.
- **Gotcha:** `listById` returns only the fields specified in `props`. If `props` is omitted, it returns all default fields. Use `list` first to discover list IDs, then pass the ID to `listById`.
- **Gotcha:** Removing or completing reminders is NOT supported by this server. To mark a reminder as complete, tell the user to check it off in the Reminders app.

### Calendar

**Operations:**

- **`list`** — lists upcoming events. Default: events from today to +7 days, limit 10. Override with `limit`, `fromDate`, `toDate`.
- **`search`** — search events by text in title, location, and notes. Default date range: today to +30 days. Override with `limit`, `fromDate`, `toDate`. Requires `searchText`.
- **`create`** — create a new event. Requires `title`, `startDate`, `endDate`. Optional `location`, `notes`, `isAllDay`, `calendarName`.
- **`open`** — open a specific event in Calendar app. Requires `eventId`.

**Workflow to create an event:**

```json
// Example: 1-hour meeting tomorrow at 2pm
{
  "operation": "create",
  "title": "Sprint Review",
  "startDate": "2026-06-27T14:00:00.000Z",
  "endDate": "2026-06-27T15:00:00.000Z",
  "location": "Conference Room B",
  "notes": "Review sprint goals and demo completed work",
  "calendarName": "Work"
}
```

- **Gotcha:** All dates MUST be ISO 8601 strings with timezone info. Using `"2026-06-27"` without a time for a non-all-day event will fail or produce unexpected results.
- **Gotcha:** For all-day events, set `isAllDay: true`. When `isAllDay` is true, `startDate` can be a date-only string like `"2026-06-27"`.
- **Gotcha:** `calendarName` must match EXACTLY the name as it appears in the Calendar app sidebar. If omitted, the event is created in the default calendar.
- **Gotcha:** `eventId` for the `open` operation is an internal identifier returned by `list` or `search`. It's not the Calendar.app visible ID. Copy it from the tool's response exactly.

### Maps

**Operations:**

- **`search`** — search for locations. Requires `query`. Optional `limit`. Returns name, address, and coordinates.
- **`save`** — save a location as a favorite. Requires `name` + `address`.
- **`pin`** — drop a pin on the map at an address. Requires `name` + `address`.
- **`directions`** — get directions. Requires `fromAddress` + `toAddress`. Optional `transportType` (`"driving"`, `"walking"`, `"transit"`).
- **`createGuide`** — create a new guide. Requires `guideName`.
- **`addToGuide`** — add a place to an existing guide. Requires `address` + `guideName`.
- **`listGuides`** — list all guides.

**Workflow to search and save a location:**

```
1. Call `maps` with `{ operation: "search", query: "coffee shop in downtown SF" }`
2. Review results with the user
3. Call `maps` with `{ operation: "save", name: "Blue Bottle Coffee", address: "66 Mint St, San Francisco" }`
4. (Optional) Call `maps` with `{ operation: "createGuide", guideName: "SF Favorites" }`
5. (Optional) Call `maps` with `{ operation: "addToGuide", address: "66 Mint St, San Francisco", guideName: "SF Favorites" }`
```

- **Gotcha:** The `search` operation returns whatever Apple Maps considers relevant. Results may differ from Google Maps or Yelp.
- **Gotcha:** For `directions`, both `fromAddress` and `toAddress` are required. The result opens directions in the Maps app — the agent does NOT receive turn-by-turn text.
- **Gotcha:** `guideName` must match an existing guide for `addToGuide`. Create the guide first with `createGuide` if it doesn't exist.

---

## Gotchas

These are non-obvious pitfalls that will cause errors or unexpected behavior if overlooked:

1. **`phoneNumber` in Messages must be a raw number or email, never a contact name.** Always resolve through `contacts` first. The tool will silently fail if you pass a name string.

2. **`dueDate` in Reminders must be a full ISO 8601 timestamp.** A plain date string like `"2026-06-27"` may not parse. Always include time and timezone: `"2026-06-27T17:00:00.000Z"`.

3. **Calendar dates follow different rules depending on `isAllDay`.** For timed events, use full ISO 8601 with timezone. For all-day events, a date-only string works and you MUST set `isAllDay: true`.

4. **The server has a 5-second eager-load timeout.** If your machine is under load, modules may fail to load eagerly and the server falls back to lazy (on-demand) loading. This is transparent but may cause a brief delay on the first call to each tool.

5. **`webSearch` can fail to load.** The DuckDuckGo search module uses `cheerio` for HTML parsing which may have dependency issues on some setups. If it fails, fall back to a browser automation skill.

6. **`notes` search uses AppleScript, not Spotlight.** It searches note content via AppleScript's limited text search. Complex queries, special characters, or phrases may return fewer results than expected.

7. **Mail does NOT support attachments via MCP.** The `mail.send` operation doesn't accept file attachments. If the user wants to send a file, use the Mail app directly or compose via a browser.

8. **No delete or complete operations.** The server exposes only read + create + open. Deleting notes/emails/reminders or marking reminders complete is not possible through this MCP server. If the user asks, tell them to do it in the native app and offer to open it for them.

9. **The MCP server inherits your FULL macOS session.** There is no authentication, no scoping, no "read-only" mode. Any prompt the agent executes has the same access your terminal user has to Messages, Mail, Calendar, Notes, Reminders, Contacts, and Maps.

---

## Multi-step workflow examples

### "Send an email about the meeting notes to the team"

```
1. `contacts` → resolve team member names to email addresses (if needed)
2. `notes` → `{ operation: "search", searchText: "meeting notes" }` to find the content
3. `mail` → `{ operation: "send", to: "team@company.com", subject: "Meeting Notes", body: "..." }`
   → Confirm with user before sending
```

### "What's my schedule for tomorrow?"

```
1. Calculate tomorrow's date range in ISO 8601
2. `calendar` → `{ operation: "list", fromDate: "2026-06-27T00:00:00Z", toDate: "2026-06-27T23:59:59Z" }`
3. Format results as a readable summary for the user
```

### "Remind me to buy groceries when I get home"

```
1. `reminders` → `{ operation: "create", name: "Buy groceries", listName: "Personal", notes: "Milk, eggs, bread" }`
   → Note: the server cannot do location-based reminders. Use "Personal" list.
```

### "Find Alice's contact and send her a message"

```
1. `contacts` → `{ name: "Alice" }` → get phone number
2. Confirm with user
3. `messages` → `{ operation: "send", phoneNumber: "+551199999999", message: "..." }`
```

---

## Security model

| Concern | Reality |
|---|---|
| Auth | None. The server inherits your macOS user session completely. |
| Network | `webSearch` sends queries to DuckDuckGo. All other tools are purely local (AppleScript). |
| Side effects | `messages.send`, `messages.schedule`, `mail.send`, `notes.create`, `reminders.create`, `calendar.create` all write data to your real Apple apps. There's no undo. |
| Read scope | All contacts, all notes, all emails, all messages, all reminders, all calendar events. |
| Exposure | Never run the MCP server over HTTP or expose it to a network. There is zero authentication. |

## Configuration

### 1. Install Bun

```bash
brew install oven-sh/bun/bun
```

### 2. Grant accessibility permissions

On first run, macOS shows a prompt. Approve it, then go to **System Settings → Privacy & Security → Accessibility** and verify the terminal app (Terminal, iTerm2, VS Code, or Zed) is checked. Without this, AppleScript calls will fail silently.

### 3. The server runs via bunx

The toolset already specifies `bunx --no-cache apple-mcp@latest` — no manual configuration needed.

## References

- apple-mcp source: <https://github.com/jxnl/apple-mcp>
- Upstream (supermemoryai): <https://github.com/supermemoryai/apple-mcp>
- Product demo: <https://x.com/DhravyaShah/status/1892694077679763671>
- License: MIT
