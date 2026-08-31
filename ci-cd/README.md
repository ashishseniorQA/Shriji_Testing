# ci-cd/

**Added beyond the original requirements list** — a QA framework this complete needs to be
*wired into* the pipeline, not just runnable by hand, or the suites quietly stop being run
consistently. Pipeline definitions live in the app repo's own `.github/workflows/` (or
equivalent) normally, but the QA-specific *strategy* and *gating rules* are documented here so
they're not buried in YAML.

## Suggested gating strategy

| Stage | Suites | Blocking? |
|---|---|---|
| On every push | `tests/smoke/` | Yes |
| On every PR | `tests/e2e/critical-flows/`, `tests/api/playwright-api/`, `tests/regression/critical/` | Yes |
| Nightly | `tests/e2e/generic-flows/`, `tests/regression/full-suite/`, `tests/ui-validation/`, `tests/edge-cases/` | No (report only) |
| Weekly / pre-release | `tests/performance/`, `tests/security/`, `tests/db-validation/` | Yes for security auth findings and db-validation |

## Notes

- Publish `reports/allure-report/` as a CI artifact on every run, pass or fail.
- Fail the pipeline loudly on a flaky-test spike (see `reports/flaky-tests-log.md`), don't let
  retries silently mask a real regression.
- Never let a CI job run write/destructive suites against production — gate by `ENVIRONMENT`
  variable, matching `config/environments/production.env.example`.
