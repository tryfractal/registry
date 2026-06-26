# Contributing to the Fractal Registry

Thanks for your interest in contributing to the **Fractal Registry** — the public catalog of skills that extend the [Fractal Organic Operating System](https://tryfractal.co). This guide covers everything you need to go from "I have an idea" to "my skill is live in the marketplace".

> If you only want to **use** existing skills, you don't need this file. Head to the [marketplace](https://tryfractal.co/marketplace) and run `fractal skills install <name>`.

---

## Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [How to get help](#how-to-get-help)
3. [Ways to contribute](#ways-to-contribute)
4. [Authoring a new skill](#authoring-a-new-skill)
5. [Updating an existing skill](#updating-an-existing-skill)
6. [Opening an issue](#opening-an-issue)
7. [Opening a pull request](#opening-a-pull-request)
8. [Review process & SLAs](#review-process--slas)
9. [Skill layout reference](#skill-layout-reference)
10. [Manifest schema reference](#manifest-schema-reference)
11. [Local validation](#local-validation)

---

## Code of Conduct

This project follows the [Contributor Covenant v2.1](CODE_OF_CONDUCT.md). By participating, you agree to its terms. Be kind, assume good faith, and help us keep the community welcoming for everyone.

---

## How to get help

| Need | Channel |
|---|---|
| Question about a skill | Open an issue with the **Documentation** template |
| Bug in a skill | Open an issue with the **Bug report** template |
| Security issue | **Do not open a public issue.** Follow [`SECURITY.md`](SECURITY.md) |
| Want to chat with the team | [Fractal Discord](https://discord.gg/tryfractal) |

---

## Ways to contribute

You don't have to write code to help. All of these are valuable:

- 📣 **Request a skill** — open an issue with the **Skill request** template.
- 🐛 **Report a bug** — open an issue with the **Bug report** template.
- ✨ **Suggest an improvement** — open an issue with the **Skill improvement** template.
- 📖 **Fix a doc** — edit any `.md` file in this repo and open a PR.
- 🆕 **Publish a skill** — author and submit (see below).
- 🔄 **Update a skill** — bug fixes, version bumps, new features (see below).
- 🔒 **Report a vulnerability** — private disclosure via [`SECURITY.md`](SECURITY.md).

---

## Authoring a new skill

A **skill** in Fractal is more than a prompt. It can ship a `SKILL.md`, instructions, agents, toolsets, collections, views, hooks, templates, artifacts, goals, and routines. Installing a skill makes the system adapt. See `AGENTS.md > II. CONSUMER GUIDE > Quick Start` for the full tutorial.

### Quick recipe

1. **Fork** this repository.
2. **Create a folder** under `skills/<your-skill-name>/`. The folder name becomes the unique skill id and the marketplace URL slug.
3. **Author `SKILL.md`** with the standard YAML frontmatter (`name` + `description` + `metadata.rules`).
4. **Author `.fractal/manifest.json`** following the [schema in AGENTS.md](../AGENTS.md). The `name`, `version`, `description`, `author.name`, `homepage`, `repository`, `path`, `license`, and `interface.{displayName,shortDescription,category}` fields are **required**.
5. **(Optional)** Add the folders you need:
   - `references/` — long-form docs loaded on demand.
   - `toolsets/<name>/` — MCP / REST / CLI toolset definitions.
   - `templates/` — LiquidJS templates.
   - `instructions/` — workspace-scoped behavioral rules.
   - `collections/` — custom `@igniter-js/collections` schemas.
   - `views/` — Fractal view trees (`FractalView`).
   - `agents/`, `hooks/`, `artifacts/`, `goals/`, `routines/`, `assets/` — see AGENTS.md.
6. **Validate locally** (see [Local validation](#local-validation) below).
7. **Open a PR** using the **New skill submission** issue template (see [Opening a pull request](#opening-a-pull-request)).
8. **Wait for review.** See [SLAs](#review-process--slas).

### Naming rules

- Lowercase letters, numbers, and hyphens only. No underscores, no dots, no spaces.
- Must match the folder name exactly (the marketplace URL is `/marketplace/<name>`).
- Must be unique. Search the repo before creating a new skill.
- Don't impersonate existing products — `<name>-for-fractal` is fine, `linear` is not.

### Writing a good `SKILL.md` description

The `description` field in `SKILL.md` is the primary trigger for the agent, so write it like an instruction: `Use this skill when...`. Focus on user intent, not implementation details. List the concrete tasks and boundary cases that should trigger the skill, stay under 1024 characters when possible, and do not reference other skills by name. A good description is specific enough to trigger reliably and narrow enough to avoid false positives.

### Category, capabilities, and toolsets

Pick the most specific category from: `Productivity`, `Development`, `Communication`, `Data`, `Design`, `DevOps`, `AI`, `Research`. Check every capability the skill actually has (Read, Write, Execute, Network, Persist). Be honest — over-promising leads to bad UX.

For single-toolset skills, use the canonical toolset folder that matches the transport: `toolsets/mcp/` for MCP servers, `toolsets/api/` for OpenAPI integrations, and `toolsets/cli/` for CLI wrappers. If the skill ships custom tools, split them into one folder per entity instead of inventing extra transport names.

### Logos

A skill's `interface.logo` may point to any absolute, publicly reachable image URL (`png`, `svg`, `jpg`, or similar). Prefer an SVGL asset when one exists, but a normal hosted image is completely fine when that is the best brand match. Make sure the URL is stable and renders correctly in the marketplace card.

### License

By default your contribution is **MIT**. Other accepted licenses: `Apache-2.0`, `BSD-3-Clause`, `ISC`. If you're submitting on behalf of the Fractal team, use `SEE LICENSE IN LICENSE`. You retain copyright of your work; by submitting you grant the project a license to redistribute it under the chosen license.

---

## Updating an existing skill

1. **Open an issue** with the **Skill update** template if the change is non-trivial.
2. **Bump the `version` field** in `.fractal/manifest.json` following semver:
   - **Patch** (`0.0.x`) — bug fix, typo, internal refactor, logo swap, or small doc tweak.
   - **Minor** (`0.x.0`) — new backward-compatible feature or a meaningful expansion of the skill's triggers / toolset.
   - **Major** (`x.0.0`) — breaking change to the manifest schema, removed tools, renamed fields.
3. **Add a CHANGELOG entry** to the skill folder (`skills/<name>/CHANGELOG.md`).
4. **Open a PR** and reference the issue.

For **breaking changes**, file a **Skill improvement** issue first so the team can review the migration plan before you code it.

---

## Opening an issue

Always use one of the provided templates. The chooser guides you to the right one:

- 💡 **Skill request** — "please build this skill"
- 🐛 **Bug report** — "this skill is broken"
- 🔒 **Security report** — "this skill has a vulnerability" (read SECURITY.md first)
- ✨ **Skill improvement** — "this skill should do X better"
- 🆕 **New skill submission** — "here's a PR for a new skill"
- 🔄 **Skill update** — "I'm bumping this skill to v0.x.y"
- 📖 **Documentation** — "the docs are wrong / missing"

If none of these fit, use the **Discussion** tab on GitHub instead of opening an issue.

---

## Opening a pull request

1. **Fork** the repo and create a branch: `git checkout -b skills/<name>` or `fix/<skill>-<issue>`.
2. Make your changes following the [skill layout reference](#skill-layout-reference).
3. **Run the local validator** (see below).
4. **Commit** with a clear message: `feat(<skill>): add foo tool` or `fix(<skill>): handle null config`.
5. **Push** and open a PR against `main`.
6. **Fill the PR template** — checklist, screenshots, related issues.
7. Wait for CI and a Fractal team review.

### PR checklist (from the template)

- [ ] `SKILL.md` and `.fractal/manifest.json` are present and valid
- [ ] `version` was bumped if the change is non-trivial
- [ ] CHANGELOG entry added
- [ ] Tested locally (if applicable)
- [ ] Screenshots attached for UI changes
- [ ] Linked to a related issue (if any)

---

## Review process & SLAs

| Stage | Owner | Target time |
|---|---|---|
| Triage (labels, area assignment) | Fractal team | 3 business days |
| First review response | Fractal team | 5 business days |
| Follow-up reviews | Fractal team | 3 business days per round |
| Security reports | Fractal team | **48 hours** (see SECURITY.md) |
| Marketplace appearance | Automated | up to 5 minutes after merge (cache TTL) |

If you don't hear back within the target window, ping the team on Discord.

---

## Skill layout reference

```
skills/<skill-name>/
├── SKILL.md                            ← mandatory: agent-facing manual
├── .fractal/
│   └── manifest.json                   ← mandatory: marketplace descriptor
├── CHANGELOG.md                        ← recommended
├── README.md                           ← optional: human-friendly overview
├── references/                         ← optional: long-form docs
├── toolsets/<name>/                     ← optional: MCP/REST/CLI toolsets
├── templates/                          ← optional: LiquidJS templates
├── instructions/                       ← optional: workspace rules
├── collections/                        ← optional: @igniter-js/collections
├── views/                              ← optional: FractalView trees
├── agents/                             ← optional: pre-configured sub-agents
├── hooks/                              ← optional: FractalHook interceptors
├── artifacts/                          ← optional: static HTML / SPA artifacts
├── goals/                              ← optional: predefined goals
├── routines/                           ← optional: scheduled automations
└── assets/                             ← optional: logos, icons, screenshots
```

The full list with semantics is in [`AGENTS.md > I. MAINTAINER GUIDE > FileSystem Topology`](../AGENTS.md).

---

## Manifest schema reference

The manifest is a JSON file at `skills/<name>/.fractal/manifest.json` that follows the **OpenAI Codex plugin descriptor** format. The full schema is documented in [`AGENTS.md > III. TECHNICAL REFERENCE > Manifest schema`](../AGENTS.md). The minimum required fields are:

```json
{
  "name": "my-skill",
  "version": "0.1.0",
  "description": "One paragraph. Keep it concise and under 1024 characters.",
  "author": { "name": "Your Name" },
  "homepage": "https://tryfractal.co/marketplace/my-skill",
  "repository": "https://github.com/tryfractal/registry",
  "path": "/skills/my-skill",
  "license": "MIT",
  "interface": {
    "displayName": "My Skill",
    "shortDescription": "What it does in one line.",
    "category": "Productivity"
  }
}
```

---

## Local validation

Before opening a PR, validate the manifest against the schema. From the repo root:

```bash
# (Coming soon) Bun-based validator
bun run scripts/validate-manifest.ts skills/<your-skill>/.fractal/manifest.json
```

For now, manually check:

- [ ] All required fields are present
- [ ] `name` matches the folder name exactly
- [ ] `path` starts with `/skills/<name>`
- [ ] `homepage` follows the `tryfractal.co/marketplace/<name>` convention
- [ ] `repository` is `https://github.com/tryfractal/registry`
- [ ] `interface.category` is one of the 8 allowed values
- [ ] `SKILL.md` description is imperative, user-intent focused, and ideally under 1024 characters
- [ ] `interface.logo` (if set) is an absolute image URL that resolves successfully
- [ ] `version` follows semver

---

## License

By contributing, you agree that your contribution will be licensed under the same license as the skill you're contributing to (default: MIT).
