import { FractalToolset } from "@fractal-os/plugin";

/**
 * apple-mcp toolset.
 *
 * Spawns `jxnl/apple-mcp` and exposes 8 AppleScript-driven tools that
 * control native macOS apps: Messages, Mail, Notes, Calendar, Reminders,
 * Contacts, and Maps. Includes a DuckDuckGo web search tool.
 *
 * Requires `bun` on the PATH and accessibility permissions granted to the
 * terminal running the MCP server.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Control native macOS apps through apple-mcp — 8 tools: contacts, notes, messages, mail, reminders, calendar, webSearch, maps. Backed by AppleScript, no API keys needed. Requires bun + macOS accessibility permissions."
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Before any send operation (messages, mail), confirm the content and recipient with the user — these tools have real-world side effects and can't be undone.",
    },
    {
      type: "always",
      instruction:
        "For `messages` send/schedule, use the phone number returned by `contacts` — the tool expects a raw number or email, not a contact name.",
    },
    {
      type: "always",
      instruction:
        "For `calendar` create, always include both startDate and endDate in ISO format. Set isAllDay to true for all-day events and omit startDate/endDate times.",
    },
    {
      type: "always",
      instruction:
        "For `mail` send, provide at minimum to, subject, and body. cc and bcc are optional. Use `mail` with operation='accounts' first if you're unsure which account to use.",
    },
    {
      type: "always",
      instruction:
        "For `notes` create, the server creates a new folder if the specified folderName doesn't exist yet. Default folder is 'Claude'.",
    },
    {
      type: "always",
      instruction:
        "For `webSearch`, the server uses DuckDuckGo. If the user asks for a source-specific search, prepend 'site:example.com' to the query — DuckDuckGo supports site: syntax.",
    },
    {
      type: "always",
      instruction:
        "For `reminders` create, dueDate is optional. Without a dueDate, the reminder has no deadline and appears in the default reminders list.",
    },
    {
      type: "never",
      instruction:
        "Never expose the apple-mcp server over HTTP or a network. It has zero authentication and gives complete access to the user's iMessage, Mail, and personal data.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "bunx",
    args: ["--no-cache", "apple-mcp@latest"],
  })
  .build();
