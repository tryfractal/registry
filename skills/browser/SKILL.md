---
name: browser
description: >-
  Browser automation with Playwright MCP. Use this skill whenever the user
  wants to navigate websites, click buttons, fill forms, inspect page content,
  take screenshots, scrape structured data, or interact with any browser,
  webpage, tab, form, checkout, login, or web app.
---

# Browser Skill

This skill exposes a single browser toolset backed by `@playwright/mcp`.
It uses Playwright's default browser session for now.

## Toolset

- `playwright` - Playwright MCP connected to the active browser debugging
  endpoint.

## Usage rules

- Use this skill for navigation, clicks, typing, screenshots, extraction, and
  page inspection.
- Keep actions structured and deterministic. Use screenshots only when the page
  structure alone is not enough.

## Notes

The skill currently uses Playwright defaults. If we want live browser attachment
again later, we can reintroduce a CDP endpoint explicitly.