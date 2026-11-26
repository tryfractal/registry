---
name: suno
description: Use this skill to create music with Suno, work with songs in the user's Suno library, or use Suno's MCP tools.
---

# Suno

Connect Suno to Fractal to create music from conversation and work with the user's Suno library. The available operations depend on the tools exposed by Suno and the connected account.

## Connection

The `mcp` toolset connects to `https://api.suno.com/mcp` over HTTP using Suno account authorization. Connect and approve access in Fractal before using the tools. Discover the current tool names and input schemas from the server.

## Working with music

- Clarify the desired mood, style, lyrics, and source material when necessary to fulfill the request.
- Suno supports creating songs, extending and covering songs, and working with user-provided audio. Use only operations available from the connected server.
- Music creation uses credits from the user's Suno plan. Songs created through MCP are saved to the user's Suno library. Some capabilities depend on the plan.
- Check the target song and account before modifying existing work. Obtain authorization for publication or other consequential actions when the user has not already requested them.
- Never expose tokens or credentials. Do not promise a particular result or invent available tool names.

## Examples

- Create an upbeat instrumental track for my video.
- Extend the song in my Suno library with a quieter ending.
- Turn my voice memo into a folk song while keeping the melody.

## References

- Suno MCP setup and capabilities: https://suno.com/mcp
- Suno MCP FAQ: https://help.suno.com/en/articles/14486145
