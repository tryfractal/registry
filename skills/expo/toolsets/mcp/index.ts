import { FractalToolset } from "@fractal-os/plugin";

/**
 * Expo MCP toolset.
 *
 * Connects to the official Expo MCP Server at `https://mcp.expo.dev/mcp`
 * using OAuth authentication. Exposes the full set of Expo tools:
 *   - Documentation: read_documentation, search_documentation, learn
 *   - Dependencies: add_library
 *   - EAS Workflows: workflow_create, workflow_info, workflow_list,
 *     workflow_logs, workflow_run, workflow_cancel, workflow_validate
 *   - EAS Build: build_list, build_info, build_logs, build_submit,
 *     build_run, build_cancel
 *   - TestFlight: testflight_crashes, testflight_feedback
 *   - App Store: appstore_reviews, appstore_reply_review,
 *     appstore_delete_review_response
 *   - Google Play: playstore_crashes, playstore_reviews,
 *     playstore_reply_review
 *   - Local (require dev server): expo_router_sitemap, open_devtools,
 *     collect_app_logs, automation_tap, automation_take_screenshot,
 *     automation_find_view
 *
 * Authenticates via OAuth with the user's Expo account. For server
 * capabilities, no local setup is required. For local capabilities
 * (screenshots, taps, DevTools), the user must install `expo-mcp`
 * and start the dev server with `EXPO_UNSTABLE_MCP_SERVER=1`.
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Expo ecosystem via the official Expo MCP Server (https://mcp.expo.dev/mcp). " +
      "Build, deploy, and debug universal Expo and React Native apps — scaffold projects, " +
      "manage SDK dependencies, trigger EAS builds and workflows, submit to App Store and " +
      "Google Play, monitor TestFlight crashes and feedback, search documentation, " +
      "and automate iOS Simulator interactions.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Always use `npx expo install` (the local CLI) when the user needs to add an Expo SDK library. " +
        "The global `expo-cli` is deprecated. Use the add_library tool whenever possible — it handles " +
        "version compatibility and attaches usage instructions automatically.",
    },
    {
      type: "always",
      instruction:
        "Prefer read_documentation over guessing Expo API signatures. The Expo SDK evolves rapidly — " +
        "always verify parameters, return types, and compatibility before writing usage code. " +
        "Use search_documentation first to find the right page if you're unsure which page to read.",
    },
    {
      type: "always",
      instruction:
        "For build and workflow failures, follow a layered investigation: " +
        "(1) call build_info or workflow_info for the status summary and error message, " +
        "(2) call build_logs or workflow_logs with the specific job/section to get the full logs. " +
        "Draw a dependency diagram when a workflow has multiple jobs.",
    },
    {
      type: "always",
      instruction:
        "Pass either appId (from app.json's extra.eas.projectId) or appFullName " +
        "(@owner/my-app) to build and workflow tools. The user can find these in their " +
        "Expo project configuration or on the Expo dashboard.",
    },
    {
      type: "always",
      instruction:
        "Remind the user that local capabilities (screenshots, taps, DevTools, sitemap) " +
        "require a running Expo dev server with `EXPO_UNSTABLE_MCP_SERVER=1 npx expo start` " +
        "and the `expo-mcp` package installed. The MCP client must reconnect after the " +
        "dev server starts or stops.",
    },
    {
      type: "never",
      instruction:
        "Never suggest `expo eject` — that command was removed in SDK 46 (2022). " +
        "Expo uses Continuous Native Generation (CNG): run `npx expo prebuild` instead.",
    },
    {
      type: "never",
      instruction:
        "Never call build_submit, workflow_run, appstore_reply_review, playstore_reply_review, " +
        "or appstore_delete_review_response without explicit user confirmation in the same turn. " +
        "These are production write actions that ship code to users or post publicly visible content.",
    },
  ])
  .withConnection({
    type: "mcp-server::http",
    url: "https://mcp.expo.dev/mcp",
  })
  .build();
