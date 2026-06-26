# Security Policy

The Fractal team takes security vulnerabilities in the **Fractal Registry** seriously. This document explains how to report a vulnerability privately, what we promise, and what we don't.

---

## Supported versions

The registry is a catalog of independently versioned skills. Each skill's `version` field in `.fractal/manifest.json` is the source of truth. Security fixes are applied to the latest minor of each major version.

| Skill | Supported versions |
|---|---|
| `fractal` | latest minor |
| `browser` | latest minor |
| _your-skill_ | latest minor |

For third-party skills, contact the author directly (see the `author` field in the manifest).

---

## Reporting a vulnerability

**Do not file a public issue for unpatched vulnerabilities.** Public disclosure before a fix puts every user of the skill at risk.

Instead, email **team@tryfractal.co** with:

- A clear description of the issue and its impact
- Reproduction steps (private; do not include real credentials or data)
- Affected skill(s) and version(s)
- Whether you intend to publish a CVE / GHSA after the fix lands
- Your handle if you want public credit (optional — you can stay anonymous)

If you prefer a structured report, you can use the **Security report** issue template, but **only** for:

- Informational findings
- Already-fixed issues you're documenting
- Hardening recommendations

For everything else, email. The Security report template is public; the email channel is not.

---

## What we promise

| Step | Target |
|---|---|
| Initial acknowledgment | within **48 hours** of receiving your email |
| Triage and severity assignment | within **5 business days** |
| Patch for `Critical` / `High` | within **7 days** of triage |
| Patch for `Medium` / `Low` | next minor release |
| Coordinated disclosure | we work with you on a timeline that suits both sides |
| Public credit | we add you to the advisory's credits unless you opt out |

If you don't receive an initial acknowledgment within 48 hours, please follow up — email sometimes gets lost in spam folders, and we want to hear from you.

---

## What we will not do

- We will not threaten legal action against researchers who follow this policy.
- We will not require you to enter into an NDA before we look at your report (unless you ask for one).
- We will not share your report with third parties without your consent, except as needed to coordinate a fix (e.g. the upstream library maintainer).
- We will not silently fix and ship without crediting you, unless you explicitly opt out.

---

## Scope

**In scope**: any skill in this repository, the registry's CI / GitHub Actions workflows, and documentation that could lead to insecure setups (e.g. copy-paste-able scripts that prompt for credentials).

**Out of scope**:

- Vulnerabilities in third-party services that skills integrate with (report upstream).
- Issues in the runtime / CLI / desktop app (those are tracked in the main Fractal repo).
- Issues in the marketing site (those are also tracked in the main Fractal repo).
- Social engineering, phishing, or physical attacks.
- Denial of service against `tryfractal.co` or the GitHub repo itself.

---

## Coordinated disclosure timeline

A typical disclosure for a `High` issue looks like:

1. **Day 0** — you email `team@tryfractal.co`.
2. **Day 0-2** — we acknowledge and open a private thread.
3. **Day 2-7** — we triage, develop, and test a fix.
4. **Day 7** — we release the patched version and a security advisory.
5. **Day 14** — you (optionally) publish a writeup.

For `Critical` issues, the patch lands within **72 hours** of triage. If you need a different timeline (e.g. you have a conference talk scheduled), tell us — we will work with you.

---

## Recognition

Researchers who report valid vulnerabilities (with their permission) are listed in the **Acknowledgments** section below.

### Acknowledgments

- _Your name here — be the first._

---

## Contact

**team@tryfractal.co** — for everything security-related.

For everything else, see [`CONTRIBUTING.md`](CONTRIBUTING.md) and the [issue templates](../ISSUE_TEMPLATE/).
