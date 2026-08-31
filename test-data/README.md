# test-data/

Reusable, synthetic test data — never real user or financial data.

- [fixtures/](fixtures/) — static JSON/TS fixtures for common entities (fee records, users,
  roles) used across multiple specs.
- [mock-responses/](mock-responses/) — mocked API response bodies for tests that need to run
  independent of backend state (e.g. `page.route()` interception in Playwright).
- [seed-scripts/](seed-scripts/) — scripts to seed or reset staging test data before a run, and
  to create isolated fixtures for `tests/db-validation/` without touching shared data.

## Rules

- **No real PII or real financial data, ever** — use clearly synthetic values (e.g.
  `qa-test-user+01@example.com`, fee amounts like `123.45` not copied from a real record).
- Fixtures are versioned and reviewed like code — if a fixture changes shape, update every spec
  that imports it in the same PR.
- Seed scripts must be idempotent and safe to re-run.

## Known limitation: no delete/cleanup path (BR-01)

The app has no delete endpoint for admissions (only soft-cancel) and no way to hard-remove
an installment payment either — see `docs/qa-digest/QA-DIGEST.md` BR-01. There is currently
**no `seed-scripts/` teardown possible**: every admission/installment this framework creates
in the shared testing environment is permanent. `fixtures/admissions.ts` mitigates collisions
(not accumulation) by generating a unique `PW-ADM-<timestamp+random>` admission number and
`PW-<timestamp+random>` roll number per call — but the environment's admissions/installments
tables will grow, unbounded, with every CI run. If this becomes a problem (slow list-page
pagination, noisy manual QA), the real fix is a dedicated disposable test centre/session that
can be reset at the database layer directly — not something this framework can do from the
browser alone.
