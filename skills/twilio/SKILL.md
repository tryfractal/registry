---
name: twilio
description: >-
  Query the official Twilio platform documentation and API reference
  through the hosted Twilio MCP server. Use this skill whenever the user
  wants to look up a Twilio product, find the right endpoint to send an
  SMS, place a Programmable Voice call, send a WhatsApp message, run a
  Verify OTP flow, look up a phone number, build a Conversations or Flex
  integration, query a Studio flow, inspect Sync objects, drive
  TaskRouter workflows, set up Elastic SIP Trunking, fetch parameter
  schemas for any Twilio OpenAPI operation, or compare Programmable
  Messaging versions. Triggers on phrases like "how do I send an SMS
  with Twilio", "what's the endpoint to start a Voice call", "give me
  the schema for the Message resource", "find the API for Conversation
  Memory", or any request to look up Twilio API reference, docs, or
  product capabilities. Use this skill even if the user just says
  "ask twilio".
---

# Twilio Skill

This skill exposes the **official Twilio MCP server** (`https://mcp.twilio.com/docs`) as a single Fractal toolset. The server is **hosted by Twilio** — no installation, no Twilio account, no API keys required. It indexes the full Twilio public OpenAPI surface (1,800+ endpoints across 30+ products) plus Twilio, SendGrid, and Segment docs.

## Toolset

- `mcp` — Twilio MCP server. Hosted at `https://mcp.twilio.com/docs`. Public Beta. Read-only: the server **searches and retrieves** API specifications and documentation; it does **not** execute API calls on your behalf.

## How the toolset works

The MCP server exposes a **search-then-retrieve** workflow. The agent calls `twilio__search` to discover the right operations, then `twilio__retrieve` to pull the full parameter and response schema for the IDs it cares about. This two-step design keeps context usage efficient — you never pay the token cost of an operation you do not actually need.

## Core tools

| Tool | What it does |
|---|---|
| `twilio__search` | Takes a natural-language query, returns ranked Twilio API operations, documentation articles, and resource IDs. Accepts filters for product, version, and tags. |
| `twilio__retrieve` | Takes one or more API IDs from a `twilio__search` result, returns the full request parameter schema and response schema for those operations. |

## What is indexed

The hosted server indexes:

- The complete **public Twilio OpenAPI specification** — every endpoint in the `twilio/twilio-oai` repo.
- All **public Twilio Docs and Support articles**.
- **SendGrid Docs and Support articles**.
- **Segment Docs**.

Indexed products include (non-exhaustive — the server tracks the live public spec):

| Product | Use it for |
|---|---|
| Programmable Messaging | Sending and receiving SMS and MMS at scale. Note: v1 is current; v2010 is legacy. |
| Programmable Voice | Outbound and inbound PSTN calls, TwiML, conferences, recordings, queues. |
| Verify | One-time passcodes (SMS, voice, email, push, WhatsApp) for user verification. |
| Twilio Conversations | Multi-channel, multi-party messaging with state sync across SMS, WhatsApp, chat, and email. |
| WhatsApp Business | WhatsApp sender registration, template messages, session messages, and media. |
| Twilio Video | WebRTC-based audio/video rooms, recording, and composition. |
| Twilio Flex | Contact center platform (Tasks, Workers, Channels, Workflows). |
| Studio | Visual IVR / call-flow editor, exposed as a programmable REST API. |
| Sync | Realtime state — documents, lists, maps, message streams — for connected clients. |
| TaskRouter | Skill-based task assignment for contact centers and workflows. |
| Elastic SIP Trunking | Bring-your-own-carrier SIP termination and origination. |
| Lookup | Phone-number intelligence — carrier, line type, caller name, fraud risk. |
| Notify | Push notifications across APNs, FCM, and SMS fan-out. |
| Proxy | Masked phone numbers for anonymous two-way communications. |
| Content | Hosted media templates (images, video) referenced by MMS and WhatsApp. |
| Events | Webhook delivery and event-stream subscriptions. |
| Monitor | Operational telemetry — call logs, error logs, alert triggers. |
| Twilio Frontline | Mobile CRM worker enablement. |
| Super SIM / Wireless | Programmable IoT connectivity. |
| Trust Hub | Regulatory compliance bundles, end-user identity, KYC. |
| Marketplace | Third-party add-on purchases. |
| Conversation Memory | Long-lived memory for conversational AI agents. |
| Conversation Orchestrator | Routing and slot-filling across bots and humans. |
| Conversational Intelligence | Speech analytics, transcription, sentiment, operator scoring. |
| Twilio Agent Connect (TAC) | Bring-your-own LLM into Twilio voice and messaging flows. |

## Connection

The Twilio MCP server is **hosted**. There is nothing to install.

| Field | Value |
|---|---|
| Transport | MCP over HTTP |
| URL | `https://mcp.twilio.com/docs` |
| Authentication | **None** — the server indexes public specs only. |
| Network access | Outbound HTTPS to `mcp.twilio.com`. |

This toolset is configured with `type: "mcp-server::http"` and a `url` pointing at the hosted endpoint. No `command`, no `args`, no `env`, no API keys.

## Usage rules

- **Search first, retrieve second.** Always begin with `twilio__search` to discover the correct operation IDs. Do not guess endpoint paths from memory — Twilio's surface is 1,800+ endpoints and many products (Messaging, Conversations) have multiple API versions.
- **Pass the IDs straight into `twilio__retrieve`.** Search results include stable operation IDs (e.g. `Api20100401Message`, `ApiV2010AccountCall`). Pass the ones you need into a single `twilio__retrieve` call to fetch the full parameter and response schema in one round-trip.
- **Mind the version axis.** Programmable Messaging has both a `v2010` (legacy) and a `v1` (current) surface. By default `twilio__search` returns the latest version — pass `filter.version` (e.g. `"2010-04-01"`) if the user explicitly needs the legacy surface.
- **Filter to the product you mean.** When the user names a specific product ("Verify", "TaskRouter", "Studio", "Sync"), include it in the `twilio__search` query so irrelevant results from sibling products do not pollute the ranking.
- **Read the parameter schema before you write code.** Once `twilio__retrieve` returns the schema, mirror the field names exactly. Twilio uses kebab-case for HTTP path parameters (`FriendlyName`, `StatusCallback`) and PascalCase for body fields.
- **Do not invent endpoints.** If `twilio__search` returns zero results, the operation does not exist in the public spec. Tell the user, and suggest the closest matching product or version.
- **Do not call Twilio APIs directly through this skill.** The hosted MCP server is **read-only** — it does not send messages, place calls, or execute account operations. To actually invoke Twilio, the user must use the standard Twilio REST API with their own `TWILIO_ACCOUNT_SID` and `TWILIO_AUTH_TOKEN`, or use a different integration.
- **The toolset is safe to call repeatedly.** Each `twilio__search` / `twilio__retrieve` is stateless and idempotent. There is no quota and no rate-limit concern at normal agent usage patterns.

## Common query patterns

The following examples show the kind of natural-language queries that work well with `twilio__search`. Adapt phrasing to the user's wording, do not echo these literally.

| User intent | Suggested `twilio__search` query |
|---|---|
| Send an SMS | "send an SMS message" or "create a message resource" |
| Start an outbound call | "place an outbound voice call" or "create a call with TwiML" |
| Look up a phone number's carrier | "lookup phone number carrier" or "line type intelligence" |
| Send a WhatsApp template | "send WhatsApp template message" or "whatsapp business API templates" |
| Run a Verify OTP | "send verification code" or "verify OTP SMS" |
| Read or write a Sync document | "sync document create read update" |
| Move a TaskRouter task | "taskrouter update task assignment" |
| Fetch a Studio Flow definition | "studio flow list steps" |
| Search the OpenAPI spec for a specific resource | "Message resource v2010" |
| Find TwiML verbs | "TwiML Say Play Gather verb" |
| Discover new products | "Conversation Memory" / "Agent Connect" / "Conversational Intelligence" |

## Reference paths

When the user wants more than the search-then-retrieve round-trip — for example, a deep-dive on a specific Twilio product page — these upstream paths are the canonical sources.

| Topic | URL |
|---|---|
| Twilio homepage | <https://www.twilio.com/> |
| Twilio docs root | <https://www.twilio.com/docs> |
| Twilio MCP server docs | <https://www.twilio.com/docs/ai/mcp> |
| Public Twilio OpenAPI spec | <https://raw.githubusercontent.com/twilio/twilio-oai/main/spec/json/twilio_api_v2010.json> |
| Twilio CLI | <https://www.twilio.com/docs/twilio-cli/quickstart> |
| SendGrid docs | <https://docs.sendgrid.com/> |
| Segment docs | <https://segment.com/docs/> |

## Limitations

- **Read-only by design.** No `send`, `create`, `update`, or `delete` operations are exposed. For account-mutating actions, the user must use the standard Twilio REST API directly.
- **Public specs only.** Anything marked as private, beta-gated, or behind a sales contact will not appear in search results.
- **Model-dependent quality.** Search ranking and the agent's ability to pick the right operation depend on the AI model powering the orchestrator. Always confirm the retrieved schema matches the user's intent before suggesting code.
- **Public Beta.** Twilio explicitly marks the MCP server as a Public Beta — the tool list, parameters, and version filters may change before General Availability.

## Feedback

If a query returns poor results, an operation is missing, or the schema looks wrong, direct the user to file feedback with the Twilio team at `questions-mcp@twilio.com` (per the upstream docs page).

## References

- Upstream docs: <https://www.twilio.com/docs/ai/mcp>
- Twilio API reference: <https://www.twilio.com/docs/reference/api>
- Twilio OpenAPI source: <https://github.com/twilio/twilio-oai>
- License: MIT (Twilio open-source docs and OpenAPI spec are MIT-licensed; this skill is MIT-licensed as a thin wrapper around the hosted MCP endpoint).
