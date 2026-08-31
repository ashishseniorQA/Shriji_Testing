# reports/

Generated evidence and reporting output. **Everything in this folder is gitignored** (see root
`.gitignore`) except this README — it's regenerated per run, not committed.

- [allure-results/](allure-results/) — raw Allure result files written by `allure-playwright`
  during a run.
- [allure-report/](allure-report/) — generated HTML report (`npm run report:allure:generate`).
- [screenshots/](screenshots/) — failure screenshots (auto-captured per `playwright.config.ts`,
  `screenshot: 'only-on-failure'`). Organize ad-hoc manual screenshots by date:
  `screenshots/2026-07-01/login-page.png`.
- [videos/](videos/) — failure videos (`video: 'retain-on-failure'`).
- [traces/](traces/) — Playwright trace files for failure debugging (`npx playwright show-trace`).
- [flaky-tests-log.md](flaky-tests-log.md) — running log of tests that fail intermittently
  without a clear defect, so patterns can be spotted before they erode trust in the suite.

## Rule

Any manual QA session (not just automated runs) that finds a defect must save evidence here and
link it from the corresponding row in `docs/issue-tracker/issues-log-template.csv`. An issue
without evidence is much harder to triage and reproduce.
