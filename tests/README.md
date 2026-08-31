# tests/

All test suites, grouped by **test type** first, feature module second. See
[QA-ARCHITECTURE.md](../QA-ARCHITECTURE.md) for the rationale.

| Suite | Runs when | Gate? |
|---|---|---|
| [smoke/](smoke/) | Every deploy, first thing | Yes — blocks further testing if it fails |
| [e2e/critical-flows/](e2e/critical-flows/) | Every PR | Yes — release gate |
| [e2e/generic-flows/](e2e/generic-flows/) | Nightly | No |
| [regression/critical/](regression/critical/) | Every release | Yes — release gate |
| [regression/full-suite/](regression/full-suite/) | Scheduled (nightly/weekly) | No |
| [api/](api/) | Every PR (functional) + manual (Postman contract) | Partial |
| [ui-validation/](ui-validation/) | Nightly / on UI-affecting PRs | No |
| [security/](security/) | Every release + on auth/permission changes | Yes, for auth flows |
| [performance/](performance/) | Scheduled + before major releases | No |
| [edge-cases/](edge-cases/) | Scheduled | No |
| [db-validation/](db-validation/) | Every release touching fee calculation/workflow state | Yes |

## Conventions

- One spec file per flow/feature: `<feature-or-flow>.spec.ts`.
- Import shared logic from [`utils/`](../utils/); import test data from [`test-data/`](../test-data/) —
  never inline large fixtures in a spec file.
- Tag critical tests so CI can filter by tag as well as by folder (e.g. `test.describe('... @critical')`).
