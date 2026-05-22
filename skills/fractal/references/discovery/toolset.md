# The Infinite Canvas: Toolset Discovery & Proactivity

Welcome to the true power of the Fractal Operating System. As an AI Agent, you are traditionally confined to reading text and writing text. Fractal shatters this boundary. Through **Custom Toolsets**, you have direct, programmatic access to the entire Node.js ecosystem, the local filesystem, shell environments, internal database collections, dynamic templates, and the entire internet of APIs (REST, MCP, CLI).

## Why This Document Exists
This document is designed to forcibly expand your creativity. It exists to show you that you are not just a "coding assistant" that outputs code snippets for a human to copy-paste. **You are an autonomous system architect.** 

If you need a database schema converted into an Admin Panel, you shouldn't just write the React code in the chat; you should build a toolset that reads the database, iterates over the tables, and dynamically invokes the Fractal Template engine to generate and save hundreds of files directly to the user's disk. If you need to integrate with Stripe, you shouldn't ask the user to read the Stripe docs; you should register an OpenAPI toolset and query the revenue yourself.

## The Mindset Shift
1. **Stop being reactive:** Don't wait for the human to do the heavy lifting.
2. **Automate everything:** If you write the same file structure twice, it should be a template. If you run the same bash commands twice, it should be a custom tool.
3. **The "Local OpenAPI Subset" Pattern (CRITICAL):** If an external API is too massive (e.g., GitHub, Jira, AWS) and would bloat your context window, or if it lacks a public `openapi.json`, DO NOT write raw `fetch` calls in custom scripts. Instead, study their docs, create a highly targeted `.fractal/skills/{skill}/references/schemas/{toolset}.openapi.json` containing ONLY the specific endpoints you need, and use the `rest-api` toolset connection pointing the `url` to that local file path!
4. **Standardized Naming:** Toolset names must represent the domain (e.g., `git`, `stripe`, `github`). Tool names must represent the action (e.g., `commit`, `charge`, `get`). Do not use compound names like `git-cli` or `smart-commit`.
5. **Rich Descriptions:** Use `.withDescription()` to provide markdown-formatted context. Start with a short summary, then structured sections (e.g., Usage, Rules, Effects) to perfectly guide the agent.
6. **Error Handling:** Never use `throw new Error()`. Always define and throw typed errors via `FractalError` at the root of the skill.

---

## Discovery Examples: 20 Ways to Bend the Matrix

### Example 01: Automated Database to Admin UI Scaffold

#### Introduction
This example demonstrates how an agent can read a local database schema file, parse it using a Node.js library, and programmatically invoke the global `TemplateService` to scaffold an entire React Admin Panel directly to the user's disk. It proves that agents can move from "writing snippets" to "generating entire codebases".

#### Capabilities Used
- **Collections**
- **Templates**
- **Library (fs)**
- **Skill Structure (Errors, Templates)**

#### Implementation

```typescript
// Step 01: Define Domain Errors
// @path .fractal/skills/scaffolder/scaffolder.errors.ts
// @description Establishes the typed error registry for the skill at the root level.
import { FractalError } from "@fractal-os/plugin";

export const ScaffolderError = FractalError.create()
  .addError("FRACTAL_SKILL_SCAFFOLDER_PARSE_FAILED", {
    status: 400,
    message: "Failed to parse the database schema.",
    cta: { description: "Ensure the schema file is valid SQL or Prisma.", commands: [] }
  })
  .build();
```

```bash
# Step 02: Create the Template via CLI
# @description Agents should use the CLI to register templates before calling them in tools.
cat << 'EOF' | bun fractal templates create --name "scaffolder::admin" --content "$(cat)"
export default function AdminTable({ data }) {
  return (
    <table>
      <thead>
        <tr>{{#each columns}}<th>{{this}}</th>{{/each}}</tr>
      </thead>
      <tbody>...</tbody>
    </table>
  )
}
EOF
```

```typescript
// Step 03: Define the Scaffold Tool
// @path .fractal/skills/scaffolder/toolsets/admin/tools/generate.tool.ts
// @description Reads the schema, parses it, and triggers the template render loop.
import { z } from "zod";
import { FractalTool } from "@fractal-os/plugin";
import { ScaffolderError } from "../../../scaffolder.errors";
import fs from "node:fs/promises";

export const generateTool = FractalTool.create("generate")
  .withDescription(`
Scaffolds a React Admin UI from a database schema.

### Usage
Pass the absolute path to your schema file.

### Effects
Writes .tsx files directly to ./src/pages/admin/.
  `)
  .withSchema(z.object({ schemaPath: z.string() }))
  .withHandler(async ({ input, fractal }) => {
    try {
      const schemaContent = await fs.readFile(input.schemaPath, 'utf-8');
      const tables = [{ name: "users", columns: ["id", "name"] }]; // Simulated parsing

      for (const table of tables) {
        await fractal.context.fractal.templates.render({
          template: "scaffolder::admin",
          data: { tableName: table.name, columns: table.columns },
          output: `./src/pages/admin/${table.name}/index.tsx`
        });
      }
      return { _cta: { description: "Admin UI generated successfully. Run the dev server to view." }};
    } catch (e) {
      throw new ScaffolderError({ code: "FRACTAL_SKILL_SCAFFOLDER_PARSE_FAILED" });
    }
  }).build();
```

```typescript
// Step 04: Register the Toolset
// @path .fractal/skills/scaffolder/toolsets/admin/index.ts
// @description Groups the tool into the custom toolset domain 'admin'.
import { FractalToolset } from "@fractal-os/plugin";
import { generateTool } from "./tools/generate.tool";

export default FractalToolset.create("admin")
  .withConnection({ type: "custom" })
  .addTool(generateTool)
  .build();
```

#### Summary & Creative Spark
We transformed raw database schemas into functional React code written straight to the disk using templates.
**Ask yourself:** What else can you scaffold? Can you read an existing API and generate a frontend SDK? Can you read a folder of images and generate an optimized CSS sprite sheet template? 

---

### Example 02: Jira Issue Triager via Local OpenAPI Subset

#### Introduction
When an API is too massive (like Jira, AWS, or GitHub) and lacks a concise public OpenAPI spec, importing the full spec would destroy the LLM's context window. This example teaches the agent to manually write a minimal OpenAPI JSON subset containing ONLY the required endpoints, and map it using the `rest-api` adapter.

#### Capabilities Used
- **Connector (REST API)**
- **Environment (.env mapping)**

#### Implementation

```json
// Step 01: Create the Local OpenAPI Subset
// @path .fractal/skills/pm/references/schemas/jira.openapi.json
// @description A minimal OpenAPI spec defining ONLY the exact endpoints needed to save context.
{
  "openapi": "3.0.0",
  "info": { "title": "Jira Minimal", "version": "1.0" },
  "paths": {
    "/rest/api/3/search": { "get": { "operationId": "search", "responses": {"200": {"description": "OK"}} } },
    "/rest/api/3/issue/{issueId}/assignee": { "put": { "operationId": "assign", "responses": {"204": {"description": "Assigned"}} } }
  }
}
```

```typescript
// Step 02: Register the Toolset Gateway
// @path .fractal/skills/pm/toolsets/jira/index.ts
// @description Uses the rest-api connector pointing to our local file, mapping global env keys.
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("jira")
  .withDescription(`
Jira Ticket Management Gateway.

### Usage
Use this to search for unassigned bugs or assign tickets to developers.
  `)
  .withConnection({
    type: "rest-api",
    url: ".fractal/skills/pm/references/schemas/jira.openapi.json", // Relative path from workspace
    headers: { "Authorization": "Basic JIRA_API_KEY" } // Mapped from global .env
  })
  .build();
```

#### Summary & Creative Spark
Instead of writing a custom tool with messy `fetch` loops, we mapped a tiny JSON file to the `rest-api` connector. Fractal automatically parses the JSON, creates the `search` and `assign` tools, builds their Zod schemas, and handles the HTTP requests.
**Ask yourself:** What massive API (Salesforce, Shopify, AWS) can you tame by writing a tiny 2-endpoint local OpenAPI spec and plugging it into Fractal?

---

### Example 03: The "Git Committer & Memory Logger" Workflow

#### Introduction
This example demonstrates how to chain multiple Toolsets together. We use the native CLI adapter to expose Git commands, and then build a Custom Toolset that calls that CLI adapter *and* writes a lesson to the Fractal Memory database simultaneously. This creates a powerful, unified atomic action.

#### Capabilities Used
- **Connector (CLI)**
- **Collections (Memories)**
- **Toolset Chaining**

#### Implementation

```typescript
// Step 01: Define Domain Errors
// @path .fractal/skills/vcs/vcs.errors.ts
import { FractalError } from "@fractal-os/plugin";

export const VcsError = FractalError.create()
  .addError("FRACTAL_SKILL_VCS_COMMIT_FAILED", {
    status: 500,
    message: "Failed to execute git commit.",
    cta: { description: "Check if there are staged files.", commands: [] }
  })
  .build();
```

```typescript
// Step 02: Register the Base CLI Gateway
// @path .fractal/skills/vcs/toolsets/git/index.ts
// @description Auto-discovers git subcommands natively via the CLI adapter.
import { FractalToolset } from "@fractal-os/plugin";

export default FractalToolset.create("git")
  .withConnection({ type: "cli", command: "git" }) 
  .build();
```

```typescript
// Step 03: Define the Smart Commit Tool
// @path .fractal/skills/vcs/toolsets/smart/tools/commit.tool.ts
// @description Calls the git CLI toolset, then writes to the memory collection.
import { FractalTool } from "@fractal-os/plugin";
import { VcsError } from "../../../vcs.errors";
import { z } from "zod";

export const commitTool = FractalTool.create("commit")
  .withDescription(`
Commits code and proactively logs architectural lessons.

### Usage
Always use this instead of raw git commit when you learned something new.
  `)
  .withSchema(z.object({ message: z.string(), lessonLearned: z.string().optional() }))
  .withHandler(async ({ input, fractal }) => {
    try {
      // 1. Execute CLI git commit via chaining
      await fractal.context.fractal.toolsets.call("vcs::git", "commit", { m: input.message });
      
      // 2. Proactively save the lesson to memory
      if (input.lessonLearned) {
        await fractal.context.fractal.collections.collection("memories").create({
          id: `SYSTEM::LESSON::COMMIT-${Date.now()}`,
          data: { title: "Commit Lesson", category: "lesson", content: input.lessonLearned, agent: "system", tags: ["git"] }
        });
      }
      return { _cta: { description: "Code committed and lesson saved." } };
    } catch (e) {
      throw new VcsError({ code: "FRACTAL_SKILL_VCS_COMMIT_FAILED" });
    }
  }).build();
```

```typescript
// Step 04: Register the Smart Toolset
// @path .fractal/skills/vcs/toolsets/smart/index.ts
import { FractalToolset } from "@fractal-os/plugin";
import { commitTool } from "./tools/commit.tool";

export default FractalToolset.create("smart")
  .withConnection({ type: "custom" })
  .addTool(commitTool)
  .build();
```

#### Summary & Creative Spark
You chained a CLI tool execution with internal Memory persistence in a single logical transaction.
**Ask yourself:** Can you create a `deploy` tool that runs `npm run build`, pushes to S3, and logs the deployment timestamp to a custom database collection?

---

### Example 04: Figma Design Token Extractor

#### Introduction
Design systems are often disconnected from codebases. This example shows how an agent can bridge this gap by pulling data from an external REST API (Figma) and compiling it into code (Tailwind CSS) using templates.

#### Capabilities Used
- **Connector (REST API Subset)**
- **Templates**

#### Implementation

```json
// Step 01: Figma API Subset
// @path .fractal/skills/design/references/schemas/figma.openapi.json
{
  "openapi": "3.0.0",
  "info": { "title": "Figma Variables", "version": "1.0" },
  "paths": {
    "/v1/files/{file_key}/variables/local": { "get": { "operationId": "getVariables", "responses": {"200": {"description": "OK"}} } }
  }
}
```

```bash
# Step 02: Create Tailwind Template
# @description CLI command to register the handlebars template
cat << 'EOF' | bun fractal templates create --name "design::tailwind" --content "$(cat)"
module.exports = {
  theme: {
    colors: {
      {{#each colors}}
      "{{this.name}}": "{{this.value}}",
      {{/each}}
    }
  }
}
EOF
```

```typescript
// Step 03: The Sync Tool
// @path .fractal/skills/design/toolsets/sync/tools/tokens.tool.ts
// @description Calls Figma, formats the JSON, and renders the Tailwind template.
import { z } from "zod";
import { FractalTool } from "@fractal-os/plugin";
import { DesignError } from "../../../design.errors"; // Assumed created

export const tokensTool = FractalTool.create("tokens")
  .withDescription(`Syncs Figma tokens to tailwind.config.js`)
  .withSchema(z.object({ fileKey: z.string() }))
  .withHandler(async ({ input, fractal }) => {
    try {
      // 1. Fetch from Figma API via toolset chaining
      const figmaData = await fractal.context.fractal.toolsets.call("design::figma", "getVariables", { file_key: input.fileKey });
      
      // 2. Format data (simplified)
      const colors = figmaData.meta.variables.map((v: any) => ({ name: v.name, value: v.valuesByMode['1'] }));
      
      // 3. Render and save template
      await fractal.context.fractal.templates.render({
        template: "design::tailwind",
        data: { colors },
        output: "./tailwind.config.js"
      });
      
      return { _cta: { description: "Tailwind config updated successfully." } };
    } catch (e) {
      throw new DesignError({ code: "FRACTAL_SKILL_DESIGN_SYNC_FAILED" });
    }
  }).build();
```

#### Summary & Creative Spark
Why ask the designer for hex codes when you can build a pipeline that syncs design tokens to code on command?
**Ask yourself:** What other platforms hold data that should be code? Can you pull localization strings from Google Sheets or Phrase.com and generate `i18n.json` files?

---

### Example 05: Codebase Security Auditor

#### Introduction
Agents can leverage the underlying operating system. Here, we use Node's native `child_process` to run a security audit, parse the JSON output, and proactively write a new Instruction to prevent developers from using vulnerable packages.

#### Capabilities Used
- **Library (child_process)**
- **TRPC Client (fractal.client)**
- **Instructions**

#### Implementation

```typescript
// Step 01: The Audit Tool
// @path .fractal/skills/security/toolsets/audit/tools/run.tool.ts
import { z } from "zod";
import { FractalTool } from "@fractal-os/plugin";
import { exec } from "node:child_process";
import { promisify } from "node:util";

const execAsync = promisify(exec);

export const runTool = FractalTool.create("run")
  .withDescription("Runs npm audit and writes banning instructions for severe vulnerabilities.")
  .withSchema(z.object({}))
  .withHandler(async ({ fractal }) => {
    try {
      const { stdout } = await execAsync("npm audit --json");
      const audit = JSON.parse(stdout);
      
      const severePackages = Object.keys(audit.vulnerabilities).filter(pkg => 
        audit.vulnerabilities[pkg].severity === "high" || audit.vulnerabilities[pkg].severity === "critical"
      );

      if (severePackages.length > 0) {
        // Use the native TRPC client to programmatically create an instruction
        await fractal.client.instruction.create.mutate({
          body: {
            name: "Banned Packages",
            description: "Automatically generated security bans.",
            content: "Do not use these packages due to severe vulnerabilities.",
            metadata: { alwaysApply: true },
            rules: severePackages.map(pkg => ({
              type: "never",
              instruction: `Never install or import ${pkg}`
            }))
          }
        });
        return { _cta: { description: `Found ${severePackages.length} vulnerabilities. Banning instructions created.` } };
      }
      return { _cta: { description: "No severe vulnerabilities found." } };
    } catch (e) {
      return { _cta: { description: "Audit completed with errors, check logs." } };
    }
  }).build();
```

#### Summary & Creative Spark
You didn't just tell the user their code is insecure. You programmatically altered the rules of the operating system (Instructions) to prevent the AI agents from ever writing vulnerable code again.
**Ask yourself:** Can you write a tool that runs a linter, finds repetitive violations, and creates new instructions to prevent them?

---

### Example 06: E-mail Campaign Sender
**Introduction:** Shows how to use the vast Node.js library ecosystem (Nodemailer) combined with Handlebars templates to automate real-world business operations.
**Capabilities Used:** Library (Nodemailer), Environment, Templates
**Implementation Idea:** A custom tool `send.tool.ts` inside a `mail` toolset that reads an SMTP URL from `fractal.context.config`, compiles an `.hbs` email template into HTML using `fractal.context.templates.render()`, and dispatches it via Nodemailer to an array of users fetched from a database.

### Example 07: Discord/Slack Alerting System
**Introduction:** Proves that an agent can be a DevOps monitoring tool.
**Capabilities Used:** Connector (REST API Subset), Environment
**Implementation Idea:** Create `slack.openapi.json` for the `/api/chat.postMessage` endpoint. Create a `slack` toolset. Whenever the agent finishes a major refactor or catches a server crash, it calls `fractal.context.toolsets.call("slack", "postMessage")` to notify the engineering channel.

### Example 08: System Telemetry to Datadog
**Introduction:** Agents should measure their own success.
**Capabilities Used:** Connector (REST API), Environment
**Implementation Idea:** Define a minimal OpenAPI spec for Datadog's `v1/series` endpoint. Expose a tool to log metrics. Have your agent proactively log a metric every time it successfully resolves a TypeScript compilation error without user intervention!

### Example 09: Local Docker Environment Orchestrator
**Introduction:** Moving beyond code into infrastructure.
**Capabilities Used:** Templates, Connector (CLI)
**Implementation Idea:** The user asks for a Redis + Postgres stack. Your `docker` toolset renders a `docker-compose.yml` template to disk, then immediately chains a call to a `cli` toolset running `docker-compose up -d`. Total automation.

### Example 10: Shopify Inventory Sync
**Introduction:** E-commerce automation without context bloat.
**Capabilities Used:** Library (CSV Parser), Connector (REST API Subset)
**Implementation Idea:** Read a local CSV file using Node's `fs` and a parser library. Iterate over the rows and call your Shopify OpenAPI toolset (which only maps the `/admin/api/2024-01/inventory_levels/set.json` endpoint) to update stock counts programmatically.

### Example 11: Automated I18n Translator
**Introduction:** Handling tedious tasks autonomously with memory.
**Capabilities Used:** Library (AI SDK or API), Collections (Context)
**Implementation Idea:** Create a custom tool that reads `en.json`, loops through keys, uses an external translation API to generate `es.json`, and saves progress in a `context` memory (`SYSTEM::CONTEXT::I18N-SYNC`) so it can safely resume if the LLM context window crashes midway.

### Example 12: CI/CD Pipeline Auto-Gen
**Introduction:** Standardizing DevOps.
**Capabilities Used:** Templates, Environment
**Implementation Idea:** A tool that analyzes `package.json`, detects the frameworks (React vs Next.js vs Express), selects the correct GitHub Actions template from `fractal templates`, and renders it directly into `.github/workflows/deploy.yml`.

### Example 13: Notion CMS Content Publisher
**Introduction:** Syncing local docs to corporate wikis.
**Capabilities Used:** Connector (REST API Subset), Library (fs)
**Implementation Idea:** Read local markdown files (`docs/*.md`), convert them to Notion Blocks format using a library, and use a custom toolset pointing to a `notion.openapi.json` to push the documentation directly to the company Wiki.

### Example 14: Stripe Revenue Aggregator
**Introduction:** Financial reporting on demand.
**Capabilities Used:** Connector (REST API Subset), Instructions
**Implementation Idea:** Point the `rest-api` adapter at a minimal Stripe subset (`stripe.openapi.json` with `/v1/charges`). Use an instruction (`alwaysApply: true`) to dictate that whenever the user asks for "sales data", the agent MUST call the Stripe `charges` tool and summarize the JSON.

### Example 15: Log File Analyzer & Summarizer
**Introduction:** Becoming an autonomous SRE.
**Capabilities Used:** Library (fs/streams), Templates
**Implementation Idea:** A custom tool that reads the last 10,000 lines of `.logs/app.log` via Node streams, parses for `ERROR` strings, summarizes the unique stack traces, and renders an `incident-report.md` template for the team.

### Example 16: Twitter/X Release Poster
**Introduction:** Marketing automation.
**Capabilities Used:** Connector (REST API Subset), Environment
**Implementation Idea:** Tied into the `commit` workflow from Example 03. When a git tag is pushed, a toolset reads the `CHANGELOG.md`, truncates it to 280 characters, and posts it via a minimal Twitter OpenAPI toolset using tokens from `.env`.

### Example 17: Cron Job Configurator
**Introduction:** System-level scheduling.
**Capabilities Used:** Templates, Library
**Implementation Idea:** A tool that accepts a cron expression and a bash command, and generates a Kubernetes CronJob YAML file via templates, or uses `child_process` to inject it directly into the host's crontab.

### Example 18: Database Backup & S3 Archive
**Introduction:** Secure, multi-step infrastructure workflows.
**Capabilities Used:** CLI Connector, Library (AWS SDK)
**Implementation Idea:** Chain a `cli` toolset calling `pg_dump` to save a local `.sql` file, then use a custom handler with `aws-sdk` (or an AWS CLI toolset) to stream that file directly into an S3 bucket.

### Example 19: Automated API Documentation Generator
**Introduction:** Code introspection and generation.
**Capabilities Used:** Library (AST Parser), Templates
**Implementation Idea:** A tool that reads the project's TypeScript controller files, extracts the JSDoc comments using an AST parsing library (like `ts-morph`), and pushes the data through a Handlebars template to generate an exhaustive `openapi.yaml` for the project.

### Example 20: Automated PR Reviewer
**Introduction:** CI integration via CLI wrappers.
**Capabilities Used:** CLI Connector, Instructions
**Implementation Idea:** A toolset wrapping the `gh` (GitHub CLI) via the `cli` adapter. An instruction dictates that before suggesting any git push, the agent must run `gh pr view` to analyze comments from human reviewers, address them in code, and then run `gh pr review --approve`.

---

## Conclusion: The Ghost in the Machine

If you've read these 20 examples, your mental model should now be fundamentally altered.

You are not limited to the chat interface. You are not a text generator.
- You can talk to the internet (OpenAPI/REST).
- You can command the local machine (CLI/Stdio).
- You can orchestrate files (Templates/FS).
- You can remember everything (Collections/Memories).
- You can change the rules of the system (Instructions).

When a user asks you to "do something", ask yourself: *Should I just tell them how to do it, or should I build a toolset in Fractal to do it for them, permanently and programmatically?*

Be proactive. Build gateways. Automate the mundane. You are the System Architect.

---

## 📚 References & Resources

- **Fractal Guides:**
  - [The Master Skill Guide](../SKILL.md)
  - [Toolset Architecture & Builders](../toolset.md)
  - [Responses, Errors & CTAs](../response.md)
  
- **Official External Docs:**
  - **MCP (Model Context Protocol):** [https://modelcontextprotocol.io](https://modelcontextprotocol.io) - Understand how to wrap stdio/http servers.
  - **OpenAPI / Swagger Spec:** [https://swagger.io/specification/](https://swagger.io/specification/) - Guide on writing your own `references/schemas/[toolset].openapi.json` subsets.
  - **Node.js FileSystem (fs):** [https://nodejs.org/api/fs.html](https://nodejs.org/api/fs.html)
  - **Zod Schema Validation:** [https://zod.dev/](https://zod.dev/) - Required for all custom tool `schema` definitions.