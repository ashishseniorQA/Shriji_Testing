# Requirements-to-Test Traceability Matrix

**Added beyond the original requirements list** — this is the artifact enterprise QA teams
almost always get asked for during an audit or release sign-off ("show me that requirement X is
tested"), and it's the fastest way to spot a feature with zero coverage before it ships, not
after.

| Requirement / Feature | Test Scenario ID(s) | Spec File | Automated? | Last Run | Status |
|---|---|---|---|---|---|
| Fee calculation accuracy | TS_### | `tests/db-validation/...` | ☐ | | |
| Fee approval workflow | TS_###, E2E_### | `tests/e2e/critical-flows/fee-approval-workflow.spec.ts` | ☐ | | |
| Payment posting | TS_### | `tests/e2e/critical-flows/payment-posting.spec.ts` | ☐ | | |
| Role-based access control | TS_### | `tests/security/auth-and-access/...` | ☐ | | |

## Maintenance rule

Update this matrix whenever a new requirement lands or a new spec is written — a traceability
matrix that's out of date is worse than none, because it gives false confidence. Cross-check
against `skills/qa-digest.md` Step 10 (Test Coverage Map) during each release cycle.
