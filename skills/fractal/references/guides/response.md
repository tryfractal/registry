# Responses and Error Handling in Fractal

This guide explains how Fractal handles data flow, standardizes responses, and manages domain errors across the CLI, Toolsets, and internal APIs. Understanding this architecture is crucial for writing robust `Custom Toolsets` and responding properly to Call-to-Action (CTA) directives.

## 1. The Fractal Execution Lifecycle

Whether a command is executed via the CLI (`fractal my-command`) or an LLM calls a toolset (`fractal toolsets call ...`), the underlying data flow is handled automatically by the Fractal infrastructure.

### The Success Flow
When your tool handler or procedure executes successfully, **you just return the raw data object**. 

You **DO NOT** need to manually wrap your responses in `{ status: "success", data: ... }` when writing custom tool handlers or procedures. The Fractal infrastructure automatically wraps responses into the standard `ToolExecutionResultSchema` or CLI output format.

### The Error Flow
When an error occurs, you **DO NOT** manually return a `{ status: "error", error: ... }` object.
Instead, you **throw a domain-specific error** built with the `FractalError`.

The core infrastructure intercepts this throw and gracefully unwraps it to the LLM or CLI, ensuring the agent doesn't crash and receives actionable feedback.

---

## 2. Using `FractalError`

Fractal uses a fluent builder to define and register errors dynamically. This ensures that every error has a strongly-typed `code`, an optional `schema` (to define the issue payload), a dynamic `message`, and crucially, a `cta` (Call to Action).

### Defining Errors (Inside `[feature].errors.ts`)

```typescript
import { FractalError } from "@fractal-os/plugin";
import { z } from "zod";

export const DatabaseError = FractalError.create()
  .addError("FRACTAL_SKILL_DB_QUERY_FAILED", {
    status: 500,
    schema: z.object({ query: z.string(), reason: z.string() }),
    message: ({ issue }) => `Query failed: ${issue.reason}. Query was: ${issue.query}`,
    cta: {
      description: "Check your SQL syntax or ensure the table exists.",
      commands: [
        {
          command: "fractal toolsets call",
          description: "List tables to verify the schema",
          args: { toolset: "db-tools", tool: "list_tables" },
        }
      ]
    }
  })
  .addError("FRACTAL_SKILL_DB_NOT_FOUND", {
    status: 404,
    message: "The requested database could not be found."
  })
  .build();
```

### Throwing Errors (Inside your Custom Toolset or Procedure)

If a condition fails, simply `throw` the instantiated error:

```typescript
import { DatabaseError } from "./database.errors";

// Inside a handler or procedure:
if (!dbExists) {
  throw new DatabaseError({
    code: "FRACTAL_SKILL_DB_NOT_FOUND"
  });
}

if (queryFailed) {
  throw new DatabaseError({
    code: "FRACTAL_SKILL_DB_QUERY_FAILED",
    issue: { query: "SELECT * FROM X", reason: "Table X does not exist" }
  });
}
```

---

## 3. The Power of `FractalResponseCTA`

The `cta` (Call to Action) block is a core paradigm in Fractal. It provides **contextual instructions** to the LLM on how to proceed, along with **suggested commands**.

### What does a CTA look like to the LLM?
When the `FractalCommand` or `ToolsetService` unwraps an error (or a success response) that contains a `_cta` object, it formats it explicitly for the LLM:

```json
{
  "code": "TEMPLATE_VALIDATION_ERROR",
  "message": "Input validation failed for schema",
  "cta": {
    "description": "Select a template ID from the list to view its schema details.",
    "commands": [
      {
        "command": "fractal templates get",
        "description": "View details of a specific template",
        "args": { "template": "<templateId>" }
      }
    ]
  }
}
```

### Returning a CTA on Success
CTAs aren't just for errors! You can return a `_cta` object inside a successful response to guide the agent on the next logical step. The infrastructure automatically strips the `_cta` key from the data payload and maps it to the CLI/Tool output metadata.

```typescript
// Inside a custom tool or procedure:
return {
  path: "src/features/auth/controllers/auth.controller.ts",
  _cta: {
    description: `Controller rendered successfully. Follow this instructions to ensure that the controller is generated correctly.`,
    commands: [
      {
        description: "Read the rendered controller to check rendered output, ensure that matches your expectations.",
        command: "cat",
        args: { path: "src/features/auth/controllers/auth.controller.ts" },
      },
      {
        description: "Ensure that rendered controller has not any errors(syntax or logic). IF you find any errors, fix them or try to run the tool again.",
        command: "bunx tsc --noEmit src/features/auth/controllers/auth.controller.ts",
        args: { path: "src/features/auth/controllers/auth.controller.ts" },
      },
      {
        description: "Check if the controller was registered on the igniter.router.ts. If not, register it.",
        command: "cat",
        args: { path: "src/igniter.router.ts" },
      },   
      {
        description: "Nice! The controller is ready! Report back for next instructions or if you already have other instructions, follow them.",
      },
    ],
  },
};
```

---

## 4. How the Infrastructure Handles This (Under the Hood)

You do not need to call these builders directly when writing tools, but understanding them empowers you to leverage their behavior:

1. **`ToolsetService.call()`**:
   - Automatically wraps handler outputs into `{ status: "success", data: result }`.
   - Automatically catches exceptions (like Zod validation errors or `FractalErrorInstance` throws) and wraps them into `{ status: "error", error: { message, code, issue } }`. This prevents tool execution crashes and feeds clean errors to the LLM.
2. **`FractalCommand`**:
   - Unwraps `{ data, error }` responses from the Igniter client.
   - Maps TRPC errors to `FractalAppError` with CTA support.
   - Transpiles `_cta` metadata on successful returns into actionable CLI hints.

### Summary Checklist for Custom Toolsets
- **Success:** Return the raw data object (e.g., `return { count: 10 }`). You can optionally append `_cta`.
- **Failure:** Throw a strongly-typed error using a `FractalError` registry. Ensure you provide a `cta` so the LLM knows how to self-correct.