# Building Toolsets in Fractal

This guide explains how to create, structure, and optimize Custom Skill Toolsets within the Fractal ecosystem using the official `@src/plugins/toolset.ts` and `@src/plugins/tool.ts` Builders.

**CRITICAL PARADIGM:** Toolsets are a **Dynamic Discovery Gateway**. Never ask a user to install an MCP Server, OpenAPI client, or heavy CLI tool directly into their IDE (Claude Code, Cursor). That pollutes the LLM context window with hundreds of tool schemas you don't need right now. Instead, register them as Fractal Toolsets. This allows you to dynamically search (`list --query`), load the exact schema only when needed (`get`), and execute securely (`call`).

## 1. Directory Structure

A skill with custom toolsets MUST follow this directory structure:

```text
.fractal/skills/my-skill/
├── SKILL.md
└── toolsets/
    └── my-toolset/
        ├── index.ts              # The Toolset Definition Builder
        └── tools/                # (Only needed for "custom" type connections)
            ├── my-tool.tool.ts   
            └── another.tool.ts
```

## 2. Pre-Built Adapters (The Gateway Pattern)

While `custom` is the most flexible connection type, Fractal excels at dynamically wrapping external systems (MCP, OpenAPI, CLI) using pre-built adapters. For these adapters, you **do not** need to define the `tools` array manually! The adapter parses the remote definition and registers all tools automatically.

### A. MCP Server (Stdio)
Wraps any local MCP server package using standard input/output.
**Schema Interface:** `{ type: "mcp-server::stdio", command: string, args: string[], env?: Record<string, string> }`

```typescript
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("postgres-mcp")
  .withDescription("Direct access to the PostgreSQL database")
  .withConnection({
    type: "mcp-server::stdio",
    command: "npx",
    args: ["-y", "@modelcontextprotocol/server-postgres", "postgresql://localhost/mydb"],
    env: {
      PGPASSWORD: "DB_PASSWORD" // Maps from global config
    }
  })
  .build();
```

### B. MCP Server (SSE/HTTP)
Connects to an MCP server running remotely via Server-Sent Events HTTP endpoints.
**Schema Interface:** `{ type: "mcp-server::http", url: string, headers?: Record<string, string> }`

```typescript
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("remote-mcp")
  .withDescription("Remote company API via MCP")
  .withConnection({
    type: "mcp-server::http",
    url: "https://api.mycompany.com/mcp/sse",
    headers: {
      // Headers can map directly or use global config mapping if the adapter resolves it
      "Authorization": "Bearer YOUR_HARDCODED_TOKEN_OR_MAPPED" 
    }
  })
  .build();
```

### C. OpenAPI Adapter (REST API)
Point this at a valid Swagger/OpenAPI JSON spec (via the `rest-api` or `openapi` alias if supported), and Fractal will automatically create a tool for every endpoint (e.g., `get_users`, `post_order`).
**Schema Interface:** `{ type: "rest-api", url: string, headers?: Record<string, string> }`

```typescript
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("stripe-api")
  .withDescription("Full Stripe API Integration")
  .withConnection({
    type: "rest-api",
    url: "https://api.stripe.com/v1/spec.json",
    headers: { 
      "Authorization": "Bearer YOUR_TOKEN"
    }
  })
  .build();
```

### D. CLI Adapter
Wraps a local CLI binary. The CLI adapter will attempt to auto-discover subcommands by parsing `--help` text!
**Schema Interface:** `{ type: "cli", command: string, env?: Record<string, string> }`

```typescript
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("github-cli")
  .withDescription("GitHub CLI (gh) wrapper for PRs and issues")
  .withConnection({
    type: "cli",
    command: "gh",
    env: {
      GITHUB_TOKEN: "GH_AUTH_TOKEN" // Maps global config variable GH_AUTH_TOKEN to GITHUB_TOKEN inside CLI
    }
  })
  .build();
```

## 3. Creating a Custom Toolset (TypeScript Handler)

If you need pure TypeScript logic instead of wrapping an external service, you build a `custom` toolset. 

**CRITICAL PARADIGM (Data Flow):** You do NOT need to manually return `{ status: "success", data: ... }` inside your handler. The Fractal infrastructure automatically wraps successful returns and intercepts thrown errors. See `references/response.md` for a deep dive into Error Handling and Call-to-Action (CTA) responses.

### Step A: Define Errors in the Skill Root (`[skill-name].errors.ts`)
Following Fractal standards, define your domain errors at the ROOT of your skill using the `FractalError`. This makes them reusable across all toolsets and services within the skill.

```typescript
// .fractal/skills/my-skill/my-skill.errors.ts
import { FractalError } from "@fractal-os/plugin";

export const MySkillError = FractalError.create()
  .addError("FRACTAL_SKILL_MYSKILL_ACTION_FAILED", {
    status: 400,
    message: "The requested action could not be completed.",
    cta: {
      description: "Check your inputs and try again.",
      commands: [] // Suggest commands here
    }
  })
  .build();
```

### Step B: Define a Tool (`tools/my-action.tool.ts`)
```typescript
import { z } from "zod";
import { FractalTool } from "@fractal-os/plugin"; 
import { MySkillError } from "../../../my-skill.errors"; // Import from skill root!

export const myActionTool = FractalTool.create("my_action")
  .withDescription("Does a specific action")
  .withSchema(z.object({
    text: z.string().describe("The text to process")
  }))
  .withHandler(async ({ input, fractal }) => {
    fractal.context.fractal.logger.info(`Processing: ${input.text}`);
    
    if (input.text === "bad") {
      // Throw domain errors directly. Infrastructure catches and formats them!
      throw new MySkillError({ code: "FRACTAL_SKILL_MYSKILL_ACTION_FAILED" });
    }
    
    // Return raw data. You can optionally append _cta to proactively guide the agent!
    return {
      result: input.text.toUpperCase(),
      _cta: {
        description: "Action succeeded. Proceed to the next step.",
        commands: [{ command: "fractal some other command" }]
      }
    };
  })
  .build();
```

### Step B: Group Tools into a Toolset (`index.ts`)
```typescript
import { FractalToolset } from "@fractal-os/plugin"; 
import { myActionTool } from "./tools/my-action.tool";

export default FractalToolset.create("my-custom-slug")
  .withDescription("A collection of powerful tools")
  .withRules([
    { type: "always", instruction: "Use these tools carefully" }
  ])
  .withConnection({ type: "custom" }) // "custom" means we use TS handlers
  .addTool(myActionTool)
  .build();
```

## 4. Leveraging the Fractal Context (`fractal.context`)

Inside any `.withHandler(async ({ input, fractal }) => { ... })` of a custom toolset, the `fractal.context` object gives you the keys to the kingdom.

### A. Render Templates (Automated Output)
Skills can bundle their own templates. You can render them natively from a tool, saving the output directly to disk!

```typescript
.withHandler(async ({ input, fractal }) => {
  const result = await fractal.context.fractal.templates.render({
    template: "my-skill::component-template",
    data: { name: input.componentName },
    output: `./src/components/${input.componentName}.tsx` // Automated disk writing!
  });
  
  return { 
    ...result,
    _cta: {
      description: "Template generated successfully. You can now use it in your code.",
      commands: [] 
    }
  };
})
```

### B. Calling Other Toolsets (Chaining)
You can orchestrate complex workflows by calling other toolsets (like MCPs or OpenAPI) from within your custom tool:

```typescript
.withHandler(async ({ input, fractal }) => {
  // Execute a query via another installed toolset
  const dbResult = await fractal.context.fractal.toolsets.call(
    "database-skill::postgres", 
    "query", 
    { sql: "SELECT * FROM users" }
  );
  
  return { ...dbResult };
})
```

### C. Reading Configuration / Secrets
```typescript
.withHandler(async ({ input, fractal }) => {
  // Reads from the global configuration/environment (.env or process.env)
  const token = fractal.context.config.get("API_KEY");
})
```

### D. Reading / Writing to DB Collections
You have full access to the internal Igniter Collections API:
```typescript
.withHandler(async ({ input, fractal }) => {
  // Query memories
  const memories = await fractal.context.fractal.collections.collection("memories").findMany({
    where: { category: "architecture" }
  });

  // Query skills
  const skills = await fractal.context.fractal.collections.collection("skills").findMany({});
  
  // Or write records to your own custom collections
})
```

### E. E2E Trpc Client (`fractal.client`)
You have full access to the internal TRPC client that maps to the REST API:
```typescript
.withHandler(async ({ input, fractal }) => {
  // Call internal system APIs programmatically
  const response = await fractal.client.memory.list.query({ category: "lesson" });
})
```

## 5. Environment Variables & Security

If your toolset requires secrets (like tokens for MCP or OpenAPI), define them in the `connection.env` mapping on the Toolset builder. Fractal will automatically map the global `.env` variables (handled securely by `FractalConfig`) to your toolset and warn if they are missing. **Never hardcode credentials.**

```typescript
export default FractalToolset.create("api-tools")
  .withConnection({
    type: "openapi",
    url: "...",
    env: {
      // Maps the global process.env.GITHUB_API_KEY to 'TOKEN' inside this context
      TOKEN: "GITHUB_API_KEY" 
    }
  })
```

## 6. Migration from Scripts to Toolsets

If you find a skill relying on raw bash scripts inside `.fractal/skills/[id]/scripts/`, you **MUST** refactor it into a Custom Toolset.

**Why?**
1. **Validation**: Toolsets use Zod schemas. If the LLM hallucinates an argument, the ToolsetService catches it and returns a clean JSON error.
2. **Context**: Toolsets have access to `fractal.context` (logger, collections, templates, chained toolsets).
3. **Discoverability**: Toolsets appear in `fractal toolsets list`, preventing context bloat.

**The Refactor Protocol:**
1. Create `toolsets/[toolset-slug]/index.ts` and the `tools/` folder.
2. Use `FractalTool.create` for each script's logic.
3. Use `FractalToolset.create` to bundle them.
4. Delete the old `.sh` or `.js` script.
5. Update the agent's memory to instruct the use of `fractal toolsets call`.