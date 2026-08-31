# Prompt: Test Case Generation

## Purpose
Turn a requirement, user story, or PR diff into structured, automatable test cases.

## Inputs
- `{{FEATURE_NAME}}` — e.g. "Late fee waiver approval"
- `{{REQUIREMENT_TEXT}}` — user story, acceptance criteria, or PR description
- `{{MODULE}}` — which part of the Fee Management Workflow System this touches

## Prompt

```
You are a Senior QA Architect. Given the requirement below for {{FEATURE_NAME}} in the
{{MODULE}} module of a Fee Management Workflow System, generate test cases covering:

- Functional (happy path)
- Validation (required fields, format, boundary values)
- Negative (invalid input, unauthorized access, missing preconditions)
- Edge cases (zero/negative fee amounts, currency rounding, concurrent approval attempts,
  workflow state conflicts)
- Data integrity (fee amount persists correctly through create -> approve -> post)

Requirement:
"""
{{REQUIREMENT_TEXT}}
"""

Do not invent business rules not stated or implied by the requirement — flag ambiguity as an
open question instead of guessing. Do not invent test data values that look like real user or
financial data; use obviously synthetic values.

Output as a table: ID | Category | Scenario | Given | When | Then | Priority (P0-P3) |
Automation candidate (Yes/No).
```

## Expected output format
BDD-style table, IDs prefixed `TS_###`, matching the format used in
`skills/qa-digest.md` Step 9 so results can be merged into the same tracker.
