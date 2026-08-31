# ai-prompts/ — Reusable AI Prompt Library

Single-shot, copy-pasteable prompts for ad-hoc AI-assisted QA tasks — lighter-weight than a
Claude Code [skill](../skills/) (no multi-step execution or resume logic, just a well-crafted
prompt template with placeholders).

| File | Use it when |
|---|---|
| [test-case-generation.md](test-case-generation.md) | You have a requirement/user story/PR diff and need structured test cases fast. |
| [bug-triage-and-rca.md](bug-triage-and-rca.md) | A bug just came in and you need severity/priority classification plus a first-pass root cause hypothesis. |
| [regression-scope-analysis.md](regression-scope-analysis.md) | A change landed and you need to know which regression suites/flows are actually at risk. |
| [qa-digest-summary.md](qa-digest-summary.md) | You have a full `docs/qa-digest/` output and need a short human-readable executive summary from it. |

## Conventions

- Every prompt file: **Purpose**, **Inputs** (with `{{PLACEHOLDER}}` syntax), **Prompt**, **Expected output format**.
- Prompts must never ask the AI to invent test data, credentials, or URLs — they should always
  say "ask the user" or "pull from `test-data/`" when a real value is needed.
- If a prompt turns out to need multiple steps or resumability, promote it to `skills/` instead
  of letting it grow unwieldy here.
