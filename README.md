# Shriji QA Framework — Fee Management Workflow System

Enterprise QA automation and documentation framework for the **Fee Management Workflow System**
(React frontend, Node.js backend). Built around Playwright (E2E + API), Postman (API contract
testing), Allure (reporting), and Claude Code (AI-assisted test design, digesting, and RCA).

## Stack

| Layer | Tool |
|---|---|
| Frontend | React |
| Backend | Node.js |
| E2E / UI automation | Playwright |
| API testing | Postman + Playwright API request context |
| Reporting | Allure |
| AI assistant | Claude Code (skills + prompt library in [`skills/`](skills/) and [`ai-prompts/`](ai-prompts/)) |

## Structure at a glance

```
skills/            Claude Code skills (QA digest generation, launcher)
ai-prompts/        Reusable prompt library for ad-hoc AI-assisted QA tasks
config/            Environment configs, secrets templates
tests/             All test suites, grouped by test type
test-data/         Fixtures, mock data, DB seed scripts
utils/             Shared automation code (page objects, API clients, helpers)
reports/           Allure results/report, screenshots, videos, traces
docs/              QA digest output, RCA reports, test plans, issue tracker
ci-cd/             Pipeline definitions and CI notes
```

See [QA-ARCHITECTURE.md](QA-ARCHITECTURE.md) for the full rationale, naming conventions, and
folder-by-folder responsibilities. Every major folder also has its own `README.md`.

## Quick start

1. Copy `.env.example` to `.env` and fill in the testing-environment base URL and credentials
   (never commit `.env`).
2. `npm install`
3. `npx playwright install --with-deps chromium`
4. Confirm target environment with the team before running anything — see
   [config/README.md](config/README.md).
5. Run smoke tests first: `npm run test:smoke`

## Golden rules

- **Never** run destructive or write operations against production.
- **Never** commit credentials, tokens, or real fee/financial data.
- Critical flows (fee calculation, approval workflow, payment posting) live under
  `tests/e2e/critical-flows/` and `tests/regression/critical/` — these gate every release.
- Every bug found gets an entry in `docs/issue-tracker/issues-log-template.csv` and, if it's a
  release-blocking or recurring issue, an RCA in `docs/rca/`.
