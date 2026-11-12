# Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| MCP toolset fails to connect | `COMPOSIO_API_KEY` not set in workspace `.env`, `~/.fractal/.env` or the process env | Add it there and retry |
| 401/403 from MCP | Missing or wrong `COMPOSIO_API_KEY` | Re-copy key from dashboard Settings; check header `x-consumer-api-key` |
| "connection not found" / expired | App not linked or token revoked | Run `COMPOSIO_MANAGE_CONNECTIONS` and have the user re-authorize |
| "invalid input" | Guessed or stale schema | Re-run get-schema for the slug |
| Tool slug not found | Slug renamed | Search again by intent |
| Wrong account used | Multiple accounts per toolkit | Pass the explicit account id |
| Rate limited | App API quota | Back off, retry once, reduce batch size |
