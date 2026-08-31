# tests/performance/

- [load/](load/) — expected concurrent-user load scenarios (e.g. month-end fee processing spike).
- [stress/](stress/) — beyond-expected-load scenarios to find the breaking point.
- [lighthouse-audits/](lighthouse-audits/) — frontend performance audits (LCP, TTI, CLS) using
  the thresholds defined in `skills/qa-digest.md` Step 6.5.

Run on a schedule and before major releases — not on every PR. Tooling (k6, Artillery,
Lighthouse CI) is intentionally not pinned yet; pick one when the first suite is implemented and
document the choice in this README.
