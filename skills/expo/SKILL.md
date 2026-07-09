---
name: expo
description: >-
  Build, deploy, and debug Expo and React Native apps through the official Expo
  MCP server. Use this skill when the user wants to scaffold a new Expo project,
  add a library using expo install, read or search Expo SDK documentation, learn
  an Expo concept, manage EAS builds (list, trigger, cancel, get logs, submit),
  create or manage EAS workflows, investigate build failures, pull TestFlight
  crashes and feedback, fetch App Store or Google Play reviews and reply to
  them, interact with an iOS Simulator (screenshot, tap, find views), open React
  Native DevTools, or query the expo-router sitemap. Triggers on phrases like
  "create a new Expo project", "add SQLite to the app", "why did my build fail",
  "show me TestFlight crashes", "submit to the App Store", "take a screenshot
  of the simulator", "check the expo-router routes", or any request involving
  Expo, EAS, React Native, or mobile app development. Use this skill even if
  the user just says "use Expo" or asks how to build a mobile app.
metadata:
  rules:
    - type: always
      instruction: "Always use `npx expo install` (not `npm install` or `yarn add`) when adding Expo SDK libraries. Using the wrong package manager can install incompatible versions."
    - type: always
      instruction: "Prefer `read_documentation` over guessing Expo API details. The Expo SDK evolves rapidly — always fetch the docs to verify parameters, options, and compatibility before writing code."
    - type: never
      instruction: "Never use `expo-cli` (the deprecated global CLI). Always use `npx expo` (the local CLI) for all commands."
    - type: never
      instruction: "Never suggest 'ejecting' or 'eject' — the `expo eject` command was removed in SDK 46 (2022). Expo uses Continuous Native Generation (CNG): run `npx expo prebuild` to generate native projects on demand."
---
# Expo Skill

This skill exposes the official **Expo MCP Server** (`https://mcp.expo.dev/mcp`) as a single Fractal toolset. Expo MCP Server integrates with your Expo projects to provide SDK documentation, dependency management, EAS builds and workflows, app store integrations, and — when a local development server is running — simulator automation and DevTools access.

> **Important:** The Expo MCP Server is a **remote (Streamable HTTP)** server. You authenticate once via OAuth with your Expo account. A local Expo development server is only required for local capabilities (screenshots, taps, DevTools).

## Toolset

- `mcp` — Expo MCP Server (`https://mcp.expo.dev/mcp`). Remote Streamable HTTP server with OAuth authentication. Requires an [Expo account](https://expo.dev/signup) and, for some capabilities, an EAS paid plan.

## Server capabilities (always available)

These tools are available with just the remote MCP server connection:

### Documentation & learning

| Tool | What it does |
|---|---|
| `read_documentation` | Fetch a single Expo documentation page as markdown (~5000 tokens per call, use `offset` to paginate). |
| `search_documentation` | Search official Expo docs and return ranked page URLs. Requires an EAS paid plan. |
| `learn` | Teach the assistant about a specific Expo feature or workflow and remember it for future conversations. |

### Dependency management

| Tool | What it does |
|---|---|
| `add_library` | Add an Expo library using `npx expo install` with compatible versions, and attach usage instructions. |

### EAS Workflows (CI/CD)

| Tool | What it does |
|---|---|
| `workflow_create` | Create a new EAS workflow YAML file or fetch workflow syntax documentation. |
| `workflow_info` | Fetch detailed info about a specific workflow run by ID (status, jobs, errors, artifacts). |
| `workflow_list` | List recent EAS workflow runs for a project. |
| `workflow_logs` | Fetch logs for a specific job in a workflow run. |
| `workflow_run` | Trigger an EAS workflow run from a git reference. |
| `workflow_cancel` | Cancel a running workflow. |
| `workflow_validate` | Validate EAS workflow YAML syntax and configuration. |

### EAS Build

| Tool | What it does |
|---|---|
| `build_list` | List recent EAS builds for a project. |
| `build_info` | Fetch status and detailed info about a specific build. |
| `build_logs` | Fetch logs for a completed or errored build. |
| `build_submit` | Submit a finished build to the App Store or Google Play. |
| `build_run` | Trigger a new EAS build from a build profile. |
| `build_cancel` | Cancel a queued or in-progress build. |

### TestFlight

| Tool | What it does |
|---|---|
| `testflight_crashes` | Fetch TestFlight crash data — list recent crashes, or get the full crash log with stack trace. |
| `testflight_feedback` | Fetch screenshot feedback from TestFlight (device info, user comments, screenshot URLs). |

### App Store

| Tool | What it does |
|---|---|
| `appstore_reviews` | Fetch public App Store customer reviews (rating, title, body, reviewer, territory). |
| `appstore_reply_review` | Post or edit the public developer response to an App Store review. |
| `appstore_delete_review_response` | Delete the public developer response on an App Store review. |

### Google Play

| Tool | What it does |
|---|---|
| `playstore_crashes` | Fetch crash and ANR data from Google Play (Android Vitals). |
| `playstore_reviews` | Fetch user reviews from Google Play (author, star rating, device info, comment). |
| `playstore_reply_review` | Post a public developer reply to a Google Play review (350 char limit). |

## Local capabilities (require a running dev server)

These tools become available when the user has a local Expo development server running with `EXPO_UNSTABLE_MCP_SERVER=1` and the `expo-mcp` package installed:

| Tool | What it does |
|---|---|
| `expo_router_sitemap` | Query all routes of the current expo-router project. |
| `open_devtools` | Open the React Native DevTools. |
| `collect_app_logs` | Collect logs from the native device (logcat/syslog) or JavaScript console. |
| `automation_tap` | Tap on the device at given coordinates `(x, y)` or by `testID`. |
| `automation_take_screenshot` | Take a screenshot of the full app or a specific view by `testID`. |
| `automation_find_view` | Find a view and dump its properties (verify rendering). |

### Prompts

| Prompt | Availability |
|---|---|
| `expo_router_sitemap` | Query the expo-router sitemap. Available locally. |

## Prerequisites

Before using this skill, the user must:

1. **Have an Expo account** — Sign up at [expo.dev](https://expo.dev/signup).
2. **Have an Expo project** — Create one with `npx create-expo-app@latest --template default@sdk-56`, or ensure their existing project has the latest `expo` package.
3. **Authenticate** — The MCP server uses **OAuth**. When the toolset connects, follow the OAuth flow. The user can use a [Personal Access Token](https://expo.dev/accounts/_/settings/access-tokens) (recommended) or their Expo credentials.
4. **(Optional) Set up local capabilities** — Install `expo-mcp` as a dev dependency and start the dev server with `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` for simulator screenshots, taps, DevTools, and sitemap features.

## Usage rules

- **Always use `npx expo install` for Expo SDK packages.** It automatically resolves compatible versions. Never use `npm install expo-camera` — use `npx expo install expo-camera`.
- **Prefer `read_documentation` over guessing.** Expo APIs evolve quickly. Fetch the docs page and read the actual parameter names, types, and usage examples before generating code.
- **Use `add_library` to install libraries.** It handles version compatibility and attaches usage instructions automatically — saves a `read_documentation` call.
- **For build failures, call `build_info` then `build_logs`.** First get the build status and error summary, then fetch the full logs if more detail is needed.
- **For workflow jobs, draw a dependency diagram.** When a workflow has multiple jobs, use `workflow_info` to get the job structure and render a diagram showing dependencies between jobs.
- **Identify projects by `appId` or `appFullName`.** Tools like `build_list`, `build_run`, `workflow_list` etc. need either the `appId` (from `app.json` → `extra.eas.projectId`) or `appFullName` (e.g. `@owner/my-app`).
- **Submit to stores only with explicit confirmation.** Build submission (`build_submit`) and store replies (`appstore_reply_review`, `playstore_reply_review`) are write actions — gate them with a human confirmation step.
- **For local capabilities, the dev server must be running.** Remind the user to start it with `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` and to reconnect the MCP client after starting.

## Common misconceptions (from Expo docs)

- **"Ejecting" does not exist.** The `expo eject` command was removed in SDK 46 (2022). Use `npx expo prebuild` for Continuous Native Generation (CNG).
- **"Managed vs bare workflow" is outdated.** All Expo projects now use the same architecture. CNG generates native directories when needed.
- **Expo is not "just for prototypes."** It powers production apps for Kick, Coinbase, Bluesky, Burger King, SpaceX, Tesla, and many more.
- **`expo-cli` (global install) is deprecated.** Always use `npx expo`.

## Environment

This skill does not require environment variables for the base MCP connection — OAuth handles authentication. For local capabilities, the `expo-mcp` package must be installed in the project.

## Security notes

- Expo MCP Server **does not train AI models** on your data. It only provides MCP tools and prompts to the connected client.
- For server capabilities, Expo may access your Expo account and project data (builds, workflows, docs, TestFlight) needed to complete tool calls.
- For local capabilities, simulator data (screenshots, logs) is proxied through Expo MCP Server and returned to your MCP client. Review your client provider's data retention and training policies for sensitive projects.

## References

- Expo MCP docs: <https://docs.expo.dev/mcp>
- Expo SDK docs: <https://docs.expo.dev>
- Expo Router docs: <https://docs.expo.dev/router/introduction>
- EAS docs: <https://docs.expo.dev/eas>
- npm package (local capabilities): <https://www.npmjs.com/package/expo-mcp>
- Expo account: <https://expo.dev/signup>
- License: MIT
