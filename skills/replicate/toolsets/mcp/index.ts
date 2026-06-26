import { FractalToolset } from "@fractal-os/plugin";

/**
 * Replicate MCP toolset.
 *
 * Spawns the community `mcp-replicate` server (https://github.com/deepfates/mcp-replicate)
 * and exposes every tool it provides for model discovery, prediction lifecycle,
 * and image-cache management. Requires the `REPLICATE_API_TOKEN` environment
 * variable to be set; the server exits on startup if the token is missing.
 *
 * Tool groups shipped by default:
 *   - Model discovery   → search_models, list_models, get_model,
 *                         list_collections, get_collection
 *   - Prediction flow   → create_prediction, create_and_poll_prediction,
 *                         get_prediction, cancel_prediction, list_predictions
 *   - Image handling    → view_image, clear_image_cache, get_image_cache_stats
 */
export default FractalToolset.create("mcp")
  .withDescription(
    "Run and integrate cloud machine learning models through the Replicate platform. Exposes model search, model inspection, prediction lifecycle (create, poll, cancel, list), and image-cache helpers for any model in the public Replicate catalog — image, video, audio, language, and vision models.",
  )
  .withRules([
    {
      type: "always",
      instruction:
        "Read `REPLICATE_API_TOKEN` from the environment only — never accept the token as a prompt argument, never echo it back to the user, never log it.",
    },
    {
      type: "always",
      instruction:
        "Call `get_model` on the target model before running it, to retrieve the exact `latest_version` hash and the full input/output schema. Pass that hash (not the named identifier) to `create_prediction` / `create_and_poll_prediction` so the result is reproducible.",
    },
    {
      type: "always",
      instruction:
        "Prefer `create_and_poll_prediction` for short-running models (under ~30 seconds) and `create_prediction` followed by a `get_prediction` poll loop for long-running ones (image-to-video, large upscale jobs). Use the non-blocking variant so the agent can stream progress or do other work.",
    },
    {
      type: "always",
      instruction:
        "Use `search_models` with a natural-language query for discovery, and `list_collections` / `get_collection` for curated browsing. Do not paginate `list_models` to find a specific capability — the semantic search is faster and more accurate.",
    },
    {
      type: "always",
      instruction:
        "Call `cancel_prediction` with the returned prediction ID whenever the user changes their mind, the result is no longer needed, or the prediction is stuck. Replicate bills by the second of GPU time and a canceled run is not charged.",
    },
    {
      type: "never",
      instruction:
        "Never pin a prediction to a model name string — always use the immutable version hash returned by `get_model`. The named identifier may resolve to a different version over time and silently change the output.",
    },
    {
      type: "never",
      instruction:
        "Do not submit private user data (PII, unpublished media, internal URLs) to a public model on Replicate without explicit consent — generated outputs are stored on Replicate's CDN and may be cached on intermediate infrastructure.",
    },
    {
      type: "never",
      instruction:
        "Do not retry a failing prediction in a tight loop. Inspect the `error` field from `get_prediction`, fix the input, and start a new prediction. Repeated retries on the same broken input waste GPU credits.",
    },
  ])
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "mcp-replicate"],
    env: {
      REPLICATE_API_TOKEN: process.env.REPLICATE_API_TOKEN ?? "",
    },
  })
  .build();
