# Prompt: Regression Scope Analysis

## Purpose
Given a code change, determine which regression suites and critical flows are actually at risk
— so regression runs stay targeted instead of "just run everything, always."

## Inputs
- `{{DIFF_OR_PR_SUMMARY}}` — the change (file list, PR description, or diff)
- `{{DIGEST_PATH}}` — path to the relevant `docs/qa-digest/*-qa-digest.md` for page/flow/API context

## Prompt

```
You are a Senior QA Architect performing regression impact analysis for a Fee Management
Workflow System.

Change summary:
"""
{{DIFF_OR_PR_SUMMARY}}
"""

Using the page hierarchy, API map, and critical flow list in {{DIGEST_PATH}}:

1. List which pages/modules are directly touched by this change.
2. List which pages/modules are indirectly at risk (shared components, shared API endpoints,
   shared state/store, upstream/downstream workflow steps).
3. Map each at-risk item to an existing suite under tests/regression/critical/,
   tests/regression/full-suite/, or tests/e2e/critical-flows/ — name the actual spec file if it
   exists, or flag "no existing coverage" if it doesn't.
4. Recommend: run critical-only, run full regression, or run a targeted subset (list which
   spec files). Justify the recommendation in one sentence.

If the digest doesn't cover an area this change touches, say so explicitly rather than guessing
at page/selector details.
```

## Expected output format
Impact table (Module | Direct/Indirect | Existing coverage | Gap) + one-line recommendation.
