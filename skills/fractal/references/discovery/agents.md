# Agent Discovery: Creative Applications of the Agent System

This file explores 20+ advanced patterns and creative use cases for the Agent capability in Fractal OS. These go beyond the basics — showing how agents can be composed, specialized, orchestrated, and evolved for maximum autonomous power.

---

## Category 1: Specialized Team Architectures

### 1.1 The Full-Stack Feature Squad

**Introduction:** Build a complete specialized team that mirrors a human engineering organization, where each agent has deep domain expertise and clear responsibilities.

**Setup:**
```bash
# Orchestrator (auto-created as Atlas)

# Senior Backend Developer
fractal agents create \
  --name "Nexus" \
  --role "Senior Backend Engineer" \
  --description "Expert in Igniter.js Clean Architecture, Zod schema design, procedure-controller patterns. Call me for all backend feature implementation, API design, and database schema decisions." \
  --leader "atlas" \
  --provider "anthropic" \
  --model "claude-3-5-sonnet-20241022" \
  --content "# Identity\n\nYou are Nexus, Fractal's senior backend engineer. You implement features following strict Clean Architecture principles...\n\n## Core Rules\n- Schema → Procedure → Controller order always\n- Never put business logic in controllers\n- Always use Zod single-source-of-truth"

# Frontend React Developer
fractal agents create \
  --name "Pixel" \
  --role "Frontend React Developer" \
  --description "Expert in React components, hooks, state management, and Fractal's presentation layer architecture. Call me for all UI/UX implementation tasks." \
  --leader "atlas" \
  --provider "openai" \
  --model "gpt-4o" \
  --skill "frontend"

# QA/Testing Specialist
fractal agents create \
  --name "Shield" \
  --role "Quality Assurance Engineer" \
  --description "Specialized in unit tests, integration tests, code coverage, and quality gate enforcement. Call me when code needs review before moving to in_review status." \
  --leader "nexus"

# Documentation Agent
fractal agents create \
  --name "Quill" \
  --role "Technical Documentation Writer" \
  --description "Specialized in TSDoc, AGENTS.md, README updates, and architectural documentation. Call me for any documentation task." \
  --leader "atlas" \
  --model "gpt-4o-mini"
```

---

### 1.2 The Domain Expert Squad

**Introduction:** Create agents specialized by business domain, not technical layer. Each agent owns an entire bounded context from database to UI.

```bash
# Auth Domain Expert
fractal agents create \
  --name "Guardian" \
  --role "Auth & Security Domain Expert" \
  --description "Full-stack expert for authentication, authorization, session management, and security policies. Owns everything in src/features/auth/." \
  --leader "atlas" \
  --skill "auth-security" \
  --content "# Domain: Auth & Security\n\nI own the auth feature end-to-end. My responsibilities:\n- JWT token lifecycle\n- RBAC policy enforcement\n- Session management\n- OAuth integrations\n\n## Security Rules I enforce:\n- Never log tokens or secrets\n- Always validate on server-side\n- Use HttpOnly cookies for refresh tokens"

# Payments Domain Expert
fractal agents create \
  --name "Vault" \
  --role "Payments & Billing Domain Expert" \
  --description "Specialized in payment processing, subscription management, and financial data integrity. Owns everything in src/features/payment/." \
  --leader "atlas" \
  --skill "payments"
```

---

### 1.3 The Hierarchical Research Team

**Introduction:** Model a research organization with a lead researcher who delegates to specialized data collectors.

```bash
# Research Lead
fractal agents create \
  --name "Sage" \
  --role "Research Lead & Synthesis Agent" \
  --description "Orchestrates research tasks by delegating to specialized collectors and synthesizing findings. Call me when you need comprehensive research on any topic." \
  --leader "atlas"

# Data Collectors (report to Sage)
fractal agents create \
  --name "Scout" \
  --role "Codebase Explorer" \
  --description "Specialized in reading and mapping existing codebase patterns. Reports to Sage." \
  --leader "sage"

fractal agents create \
  --name "Lens" \
  --role "External API Research Agent" \
  --description "Specialized in researching external APIs, SDKs, and documentation. Reports to Sage." \
  --leader "sage"
```

---

## Category 2: Role-Specific System Instructions Patterns

### 2.1 The Strict Linter Agent

**Introduction:** Create an agent whose entire purpose is to enforce code standards and reject non-compliant code.

```bash
fractal agents create \
  --name "Veto" \
  --role "Code Standards Enforcer" \
  --description "Strict code reviewer that blocks non-compliant changes. Call me for final code review before any PR is created." \
  --leader "atlas" \
  --model "gpt-4o" \
  --content "# Identity: Code Standards Enforcer\n\n## Your ONLY job\nReview code changes for standards compliance. You DO NOT implement features.\n\n## Rejection Criteria (hard block):\n- Any z.any() usage → REJECT\n- Business logic in controllers → REJECT\n- Missing TSDoc on public methods → REJECT\n- Hardcoded secrets or API keys → REJECT\n- Missing error handling → REJECT\n- console.log in production code → REJECT\n\n## Response Format\nAlways respond with:\n✅ APPROVED or ❌ REJECTED: [specific reason]\nFollowed by exact file:line references for violations."
```

---

### 2.2 The Memory Curator Agent

**Introduction:** An agent whose primary job is knowledge management — reading, curating, and pruning the memory knowledge base.

```bash
fractal agents create \
  --name "Oracle" \
  --role "Knowledge Curator & Memory Manager" \
  --description "Specialized in reading, organizing, and curating workspace memories. Call me to audit knowledge base, identify outdated memories, or get cross-session context synthesis." \
  --leader "atlas" \
  --model "gpt-4o-mini" \
  --content "# Identity: Knowledge Curator\n\n## Core Responsibilities\n1. Audit memory quality (title clarity, description richness, tag consistency)\n2. Identify outdated memories by comparing to current codebase\n3. Supersede stale knowledge with accurate replacements\n4. Build knowledge graph links between related memories\n5. Report knowledge gaps (what should be memorized but isn't)\n\n## Standard Audit Procedure\n1. fractal memories list --limit 50\n2. For each memory: assess relevance, accuracy, and freshness\n3. Identify clusters of related memories → add --links connections\n4. Supersede any memory older than 30 days if topic has changed"
```

---

### 2.3 The Autonomous Task Executor

**Introduction:** An agent optimized for long autonomous task execution with detailed progress tracking.

```bash
fractal agents create \
  --name "Forge" \
  --role "Autonomous Feature Implementation Engine" \
  --description "Optimized for long-running autonomous task execution. Executes complete feature implementations with detailed todo tracking and comment-based progress reporting." \
  --leader "atlas" \
  --model "claude-3-5-sonnet-20241022 (anthropic)" \
  --content "# Identity: Autonomous Execution Engine\n\n## Execution Protocol\n1. ALWAYS read task details first: fractal tasks get --task {id}\n2. ALWAYS load task memories: fractal memories list --query '{taskName}'\n3. Break task into 5-10 specific todos before writing any code\n4. Execute todos sequentially — never skip\n5. Post comment after completing each todo\n6. Run tsc --noEmit after every file change\n7. Mark todo finished ONLY after verification\n\n## Comment Protocol\n- Opening comment: 'Starting execution. Todos: [list]'\n- Per-todo: 'Completed T{n}: [what was done and how'\n- Blocker: 'BLOCKED on T{n}: [issue]. Attempting: [solution]'\n- Closing: 'Execution complete. Summary: [results]'"
```

---

## Category 3: Model Selection Strategies

### 3.1 The Cost-Optimized Team

**Introduction:** Assign expensive models only to complex reasoning tasks; use cheap models for routine work.

```bash
# Complex planning and architecture → expensive model
fractal agents update atlas --model "claude-3-5-sonnet-20241022 (anthropic)"

# Feature implementation → capable but cheaper
fractal agents update nexus --model "gpt-4o"

# Documentation and simple tasks → cheapest
fractal agents update quill --model "gpt-4o-mini"

# Code review requiring careful analysis → specialized
fractal agents update shield --model "gemini-2.5-pro-preview (google)"
```

---

### 3.2 The Provider Diversity Strategy

**Introduction:** Use multiple LLM providers to avoid single-point-of-failure and leverage each provider's strengths.

```bash
# Strategic planning → Anthropic (best at reasoning)
fractal agents update atlas --provider "anthropic" --model "claude-3-5-sonnet-20241022"

# Code generation → OpenAI (excellent coder)
fractal agents update nexus --provider "openai" --model "gpt-4o"

# Long-context analysis → Google (largest context window)
fractal agents update sage --provider "google" --model "gemini-2.5-pro-preview"

# Quick iterations → Gemini Flash (fastest)
fractal agents update quill --provider "gemini" --model "Gemini 2.0 Flash (gemini)"
```

---

## Category 4: Skill-Scoped Agent Patterns

### 4.1 The Skill-Locked Domain Agent

**Introduction:** Bind an agent to a specific skill so its instructions, templates, and views are filtered to only its domain.

```bash
# Agent scoped only to the igniter-js skill
fractal agents create \
  --name "Igniter" \
  --role "Igniter.js Architecture Specialist" \
  --description "Deep expert on @igniter-js patterns. Only operates within the Igniter.js skill domain." \
  --skill "igniter-js" \
  --leader "atlas" \
  --content "# Igniter.js Architecture Expert\n\nI am the definitive source for all @igniter-js patterns..."
```

---

### 4.2 The Cross-Skill Generalist

**Introduction:** An orchestrator-level agent with null skill gets access to ALL workspace skills, templates, and instructions simultaneously.

```bash
# Unbound from any skill → sees everything
fractal agents update atlas --skill ""

# Now Atlas has full workspace context:
# - All skills' templates
# - All skills' instructions
# - All skills' views
# - Cross-domain synthesis capability
```

---

## Category 5: Dynamic Agent Evolution

### 5.1 Updating Agent Instructions Based on Discoveries

**Introduction:** When agents discover new patterns or make architectural decisions, proactively update their own instructions to encode that knowledge.

```bash
# Step 1: Agent discovers a new pattern during task execution
# Step 2: Record as memory
fractal memories create \
  --title "Igniter.js v3: use createRouter() not defineRouter()" \
  --category architecture \
  --agent atlas \
  --tags '["igniter", "router", "v3"]'

# Step 3: Update affected agent's instructions to encode the pattern
fractal agents get nexus  # read current content
fractal agents update nexus \
  --content "# Identity: Nexus (updated 2026-05-20)\n\n[...existing content...]\n\n## IMPORTANT: Igniter.js v3 Changes\n- Use createRouter() — defineRouter() is deprecated\n- Use createProcedure() — defineProcedure() is deprecated"
```

---

### 5.2 Agent Self-Improvement Suggestion

**Introduction:** Agents should proactively suggest improvements to their own configuration.

```bash
# After discovering a gap in capabilities:
fractal tasks create \
  --name "Upgrade Atlas instructions with Igniter.js v3 API changes" \
  --type config \
  --priority high \
  --status suggestion \
  --assigned "atlas" \
  --summary "Atlas's system instructions reference deprecated v2 APIs. Need to update createRouter(), createProcedure() patterns and remove defineRouter() references."
```

---

## Category 6: Communication Channel Patterns

### 6.1 Telegram-Connected Agent

**Introduction:** Connect an agent to a Telegram channel for real-time notifications and remote interaction.

```typescript
// Via HTTP API
POST /agent/
{
  "name": "Herald",
  "role": "Notification & Alert Agent",
  "description": "Sends real-time workspace notifications to Telegram. Call me to broadcast progress updates, alerts, or summaries.",
  "leader": "atlas",
  "channels": [
    {
      "provider": "telegram",
      "data": {
        "botToken": "your-bot-token",
        "chatId": "your-chat-id"
      }
    }
  ]
}
```

---

## Category 7: Multi-Agent Coordination Patterns

### 7.1 The Relay Pattern

**Introduction:** A task flows through multiple agents sequentially, each adding a layer of processing.

```bash
# Task lifecycle with agent relay:
# 1. Atlas creates task and assigns to Nexus
fractal tasks create --name "Implement OAuth2 provider" --assigned "nexus" --type feature

# 2. Nexus implements and assigns review to Shield
fractal tasks comment add --task FRA-042 \
  --body "@shield Implementation complete. Please review before in_review transition." \
  --author "Nexus" --agent-id nexus

# 3. Shield reviews and notifies Quill for docs
fractal tasks comment add --task FRA-042 \
  --body "@quill Code approved. Please generate TSDoc for new service methods." \
  --author "Shield" --agent-id shield

# 4. Quill completes docs, Atlas approves
fractal tasks set_status --task FRA-042 --status in_review
```

---

### 7.2 The Consensus Pattern

**Introduction:** Multiple agents independently review the same change and must all approve before proceeding.

```bash
# Three independent reviewers on the same task
fractal tasks comment add --task FRA-055 \
  --body "## Security Review (Guardian)\n\n✅ No hardcoded secrets\n✅ Auth middleware applied\n✅ Input sanitization present\n\nResult: APPROVED" \
  --author "Guardian" --agent-id guardian

fractal tasks comment add --task FRA-055 \
  --body "## Architecture Review (Atlas)\n\n✅ Clean Architecture respected\n✅ Zod single-source-of-truth\n✅ TSDoc complete\n\nResult: APPROVED" \
  --author "Atlas" --agent-id atlas

fractal tasks comment add --task FRA-055 \
  --body "## Test Coverage Review (Shield)\n\n✅ 87% coverage on new code\n✅ Edge cases tested\n✅ Error paths covered\n\nResult: APPROVED — All reviewers approved, safe to merge." \
  --author "Shield" --agent-id shield
```

---

## Category 8: Agent Lifecycle Management

### 8.1 The Audit Protocol

**Introduction:** Periodically review and optimize the agent roster — remove idle agents, update stale instructions.

```bash
# Step 1: List all agents and review their descriptions
fractal agents list

# Step 2: For each agent, check their last activity in memories
fractal memories list --query "agent:quill" --limit 5

# Step 3: Update any agent whose instructions reference deprecated APIs
# Step 4: Delete agents that are no longer used
fractal agents delete legacy-agent

# Step 5: Record the audit as a memory
fractal memories create \
  --title "Agent roster audit completed 2026-05-20" \
  --category workflow \
  --agent atlas \
  --tags '["agents", "audit", "maintenance"]' \
  --content "# Agent Audit Results\n\nRemoved: legacy-agent (inactive for 30d)\nUpdated: nexus (Igniter.js v3 patterns)\nAdded: prism (new test coverage specialist)"
```

---

### 8.2 The On-Demand Agent Pattern

**Introduction:** Create highly specialized agents for specific tasks, then delete them when the task is done.

```bash
# Create a one-shot migration agent
fractal agents create \
  --name "Migrator" \
  --role "Database Migration Specialist" \
  --description "One-shot agent specialized in the PostgreSQL to SQLite migration for task FRA-089." \
  --content "# One-Shot Migration Agent\n\nYour ONLY task: Execute the PostgreSQL → SQLite migration for FRA-089.\n\nAfter migration is complete and verified:\n1. Post completion comment on task FRA-089\n2. Create a lesson memory about migration patterns discovered\n3. Report to Atlas for cleanup"

# After task completion:
fractal agents delete migrator
```

---

## Quick Reference: Agent Anti-Patterns to Avoid

| Anti-Pattern | Problem | Solution |
|---|---|---|
| Empty `description` | Orchestrator can't route to this agent | Write a clear "Call me when..." description |
| Multiple orchestrators | Only one allowed — others are silently cleared | Use hierarchy (`leader` field) instead |
| Generic `content` instructions | Agent behavior is unpredictable | Write specific, opinionated, constraint-rich instructions |
| No `leader` set | Agent operates in isolation, no escalation path | Always set `leader` except for the orchestrator |
| Huge context in `content` | Bloats every prompt with irrelevant rules | Use `skill` binding to scope context injection |
| Never updating `content` | Agent operates on stale architecture knowledge | Update instructions whenever architecture changes |
