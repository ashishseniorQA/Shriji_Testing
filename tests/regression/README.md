# tests/regression/

Suites that guard against previously-fixed bugs resurfacing.

- [critical/](critical/) — must pass on every release. Every entry here traces back to a past
  `BUG_###` in `docs/issue-tracker/issues-log-template.csv` or a critical flow in
  `tests/e2e/critical-flows/`.
- [full-suite/](full-suite/) — comprehensive regression, run on a schedule (nightly/weekly), not
  on every PR — too slow to gate individual changes.

## Rule

Every confirmed bug fix gets a regression test **before** the fix is considered done. If the bug
was in a critical flow (fee calc, approval, payment, auth), the test goes in `critical/`;
otherwise `full-suite/`.
