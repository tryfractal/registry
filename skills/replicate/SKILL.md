---
name: replicate
description: >-
  Run and integrate cloud ML models through the Replicate platform. Use
  this skill whenever the user wants to generate images, video, audio,
  or text with a hosted ML model — Stable Diffusion, Flux, SDXL, Whisper,
  LLaMA, MusicGen, ControlNet, upscalers, background removers, or any
  model on Replicate; call a model with structured inputs, poll a
  long-running prediction, search the model catalog, browse collections,
  inspect input/output schemas, cancel stuck predictions, or chain
  multiple models in a pipeline. Triggers on phrases like "generate an
  image of a corgi", "upscale this photo 4x", "run Flux on this prompt",
  "transcribe this audio with Whisper", "find a model that does X", or
  any request to call a hosted ML model. Use this skill even if the user
  just says "use replicate" or asks how to run an open-source model
  without setting up their own GPU.
---

# Replicate Skill

This skill exposes the **Replicate MCP server** (`mcp-replicate`) as a single Fractal toolset. Replicate is a cloud platform that runs thousands of open-source machine learning models behind a single REST API, and the MCP server wraps that API into structured tools that the agent can call directly.

## Toolset

- `mcp` — Replicate MCP server (`mcp-replicate`). Spawns over stdio and requires a `REPLICATE_API_TOKEN` environment variable. Exposes model discovery, prediction lifecycle, and image-cache helpers.

## Model discovery tools

| Tool | What it does |
|---|---|
| `search_models` | Find models using semantic search over the public Replicate catalog. Pass a natural-language query like `"text to image"`, `"remove background"`, or `"image to video"`. |
| `list_models` | Browse the full model catalog, paginated. |
| `get_model` | Fetch a single model's metadata, including the **latest version hash** and its input/output schema. |
| `list_collections` | Browse curated collections (e.g. "Featured", "Best of text-to-image"). |
| `get_collection` | Inspect a single collection and the models it contains. |

## Prediction lifecycle tools

| Tool | What it does |
|---|---|
| `create_prediction` | Run a model. Returns a prediction ID plus a polling URL. Use when the model is slow and you want to do other work. |
| `create_and_poll_prediction` | Run a model **and block** until it completes. Use for short-running models or when the next step depends on the result. |
| `get_prediction` | Check the status of an existing prediction (`starting`, `processing`, `succeeded`, `failed`, `canceled`). |
| `cancel_prediction` | Stop a running prediction and avoid being charged. |
| `list_predictions` | List your recent predictions (paginated). |

## Image handling tools

| Tool | What it does |
|---|---|
| `view_image` | Open a generated image in the user's browser. |
| `clear_image_cache` | Drop the local image cache. |
| `get_image_cache_stats` | Inspect current cache usage. |

## Usage rules

- **Always set `REPLICATE_API_TOKEN` before starting the toolset.** The MCP server exits on startup if the token is missing. Get a token at <https://replicate.com/account/api-tokens>.
- **Prefer `create_and_poll_prediction` for short jobs, `create_prediction` for long ones.** Models that finish in under 30 seconds can block; models that take minutes (image-to-video, large upscale jobs) should use the non-blocking variant so the agent can do other work or stream progress.
- **Always pass an exact model version hash, not just the model name.** The `get_model` tool returns a `latest_version` hash. Hashes are immutable; the named identifier may pin to a different version over time and silently change behavior.
- **Inspect the schema with `get_model` before running.** The tool returns the input/output schema so you know what fields are required, their types, and the output shape (URL vs. base64, single file vs. list).
- **Cancel long-running predictions you no longer need.** Replicate charges by the second of GPU time. If the user changes their mind or the prediction is stuck, call `cancel_prediction` with the ID returned by `create_prediction`.
- **Never hardcode API tokens in prompts or scripts.** Read them from the `REPLICATE_API_TOKEN` environment variable only.
- **Don't use `list_models` for discovery when a search is faster.** `search_models` is semantic and returns the most relevant models in one call; `list_models` is paginated catalog and is meant for browsing.

## Configuration

The MCP server reads exactly one environment variable:

| Variable | Required | Purpose |
|---|---|---|
| `REPLICATE_API_TOKEN` | Yes | Replicate API token. Generate at <https://replicate.com/account/api-tokens>. |

The toolset also passes the token through to the spawned server, so it can be set either in the host environment or in the `env` block of the MCP connection.

## Connection arguments

Default spawn command:

```bash
npx -y mcp-replicate
```

With the `REPLICATE_API_TOKEN` exported in the environment. The server exposes its tools over stdio; the Fractal runtime brokers the JSON-RPC messages.

## Common patterns

### Generate an image with Flux

1. `get_model` on `black-forest-labs/flux-schnell` to grab the version hash and input schema.
2. `create_and_poll_prediction` with `{ version: <hash>, input: { prompt: "...", aspect_ratio: "16:9" } }`.
3. Return the image URL to the user.

### Upscale a photo 4x

1. `get_model` on `nightmareai/real-esrgan` to confirm the input shape.
2. `create_prediction` with the image URL as `image` input.
3. `get_prediction` in a loop with a short backoff until `status === "succeeded"`.
4. Open the output via `view_image` and return the URL.

### Chain a generation and an edit

1. Generate with `create_and_poll_prediction` (model A).
2. Pipe the output URL as the `image` input to a second `create_and_poll_prediction` (model B).
3. Return the final URL.

## Cost and quota notes

- Replicate charges by the second of GPU time, **not by API call**. A failed or canceled prediction is not billed.
- The cheapest models (Flux Schnell, SDXL Turbo) cost fractions of a cent per image; large video and language models can cost cents to dollars per run.
- The MCP server does not enforce a budget. The agent should avoid retry storms on a failing prediction and prefer `cancel_prediction` followed by a new run with corrected inputs.

## Security notes

- The API token is a bearer credential. Treat it like any other secret: do not log it, do not echo it back to the user, and do not include it in a commit.
- A model that accepts an arbitrary URL input can be used to probe internal services reachable from Replicate's network. Prefer models that accept uploaded assets only when a URL fetch is unnecessary.
- Generated outputs are stored on Replicate's CDN until the prediction record is deleted. Do not submit user-private data (PII, unpublished media) to public models without consent.

## References

- Replicate platform docs: <https://replicate.com/docs>
- Replicate API reference: <https://replicate.com/docs/reference/http>
- MCP server source: <https://github.com/deepfates/mcp-replicate>
- npm package: <https://www.npmjs.com/package/mcp-replicate>
- License: MIT
