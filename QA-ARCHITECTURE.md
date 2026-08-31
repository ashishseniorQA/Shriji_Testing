# QA Architecture — Fee Management Workflow System

## Purpose

This document is the single source of truth for *why* the QA repository is structured the way
it is. Read this before adding a new top-level folder — if what you need doesn't fit an existing
folder's stated purpose, either it belongs inside an existing folder or the structure needs to
evolve (propose it in a PR, don't just drop files anywhere).

## Design principles

1. **Test type is the primary axis, not feature.** `tests/` is split by *kind* of testing
   (e2e, api, security, performance...) first, and by feature/module second (as subfolders).
   This lets a team member or CI job target "run everything security-related" without needing to
   know every feature module.
2. **Critical vs. generic separation.** Inside `e2e` and `regression`, flows that gate a release
   (fee calculation, approval chain, payment posting, auth) are physically separated from
   generic/lower-risk flows. Critical suites run on every PR; generic suites run nightly.
3. **Reusable-first.** Anything used by more than one test (selectors, API clients, data
   builders) lives in `utils/` or `test-data/`, never copy-pasted into a spec file.
4. **AI-native.** Prompts and Claude skills are first-class, versioned artifacts in `ai-prompts/`
   and `skills/` — not throwaway chat messages. Any prompt that produced a useful test plan, RCA,
   or digest should be saved and reused.
5. **Evidence is not optional.** Every test run that finds a defect must leave evidence
   (screenshot, trace, network log) in `reports/`, referenced from the issue log.
6. **Naming is AI- and human-parseable.** kebab-case for files and folders, no spaces, no
   ambiguous abbreviations (`auth-and-access` not `aa`), consistent suffixes
   (`*-template.md`, `*-checklist.md`, `*.spec.ts`) so both humans and LLM agents can predict
   where something lives without being told.

## Folder-by-folder

| Folder | Responsibility |
|---|---|
| `skills/` | Claude Code skill definitions (multi-step, resumable AI workflows — e.g. QA Digest generation). Referenced directly by the root `CLAUDE.md`. |
| `ai-prompts/` | Single-shot, reusable prompts for ad-hoc AI tasks (generate test cases, triage a bug, write an RCA). Lighter-weight than a skill. |
| `config/` | Non-secret environment configuration and `.env` templates. Real secrets never get committed here. |
| `tests/e2e/` | Full user-journey tests via Playwright, browser-driven. Split into `critical-flows/` (release gate) and `generic-flows/`. |
| `tests/api/` | Contract and functional API testing — Postman collections for manual/CI contract checks, Playwright API tests for CI-integrated functional checks. |
| `tests/ui-validation/` | Visual regression, accessibility (WCAG), and responsive/viewport checks — UI correctness independent of business logic. |
| `tests/regression/` | Re-run suites that protect against previously-fixed bugs resurfacing. `critical/` = must pass every release; `full-suite/` = comprehensive, run on a schedule. |
| `tests/smoke/` | Minimal "is it even up" checks — fastest suite, runs first on every deploy. |
| `tests/security/` | Auth/access control, input validation (XSS/SQLi/injection), and an OWASP-aligned manual checklist. |
| `tests/performance/` | Load, stress, and Lighthouse-based frontend performance audits. |
| `tests/edge-cases/` | Boundary values, unusual input combinations, race conditions — deliberately separated so they don't dilute "core" suites but still get tracked and run. |
| `tests/db-validation/` | *(added — see Recommendations)* Backend/data-layer checks: fee calculation accuracy, rounding rules, audit-trail integrity, referential integrity after workflow transitions. |
| `test-data/` | Fixtures, mock API responses, and scripts to seed/reset test environment data. |
| `utils/` | Shared automation code: page objects, API client wrappers, generic helpers, custom Playwright assertions/matchers. |
| `reports/` | Allure results/report output, plus raw screenshots/videos/traces captured on failure. |
| `docs/qa-digest/` | Output of the QA Digest skill — living knowledge base of the app under test (pages, selectors, API map, test data catalog). |
| `docs/rca/` | Root cause analysis reports for significant/recurring defects, using a standard template. |
| `docs/test-plans/` | Per-release or per-feature test plans. |
| `docs/issue-tracker/` | CSV issue log (Excel-compatible), severity/priority matrix, traceability matrix. |
| `docs/release-notes/` | QA sign-off notes per release. |
| `ci-cd/` | CI pipeline definitions/notes (GitHub Actions or equivalent) that wire the above suites into automated gates. |

## Naming conventions

- Folders and files: `kebab-case`.
- Spec files: `<feature>.spec.ts` (Playwright convention).
- Templates: `*-template.md` / `*-template.csv`.
- Checklists: `*-checklist.md`.
- Claude prompts: named by *intent*, not by tool (`bug-triage-and-rca.md`, not `prompt-3.md`).
- Test IDs referenced across docs/issue-tracker/traceability-matrix: `TS_###` (test scenario),
  `E2E_###` (end-to-end flow), `BUG_###` (defect).

## What NOT to put here

- Real credentials, tokens, or production data — use `.env` (gitignored) and `test-data/` with
  synthetic data only.
- Application source code — this is a QA-only repository/directory tree; it references the app
  under test by URL, not by importing its code.
