# docs/rca/

Root cause analysis reports for significant or recurring defects — not every bug needs one, but
every **Blocker/Critical** severity bug and every bug that recurs after a prior "fix" does.

Use [TEMPLATE-rca.md](TEMPLATE-rca.md). Name completed RCAs `RCA-<BUG_ID>-<short-slug>.md`
(e.g. `RCA-BUG_042-duplicate-payment-posting.md`).

## When an RCA is required

- Severity Blocker or Critical (see `docs/issue-tracker/severity-priority-matrix.md`)
- Any incident affecting fee calculation accuracy, the approval workflow, or the audit trail
- Any bug that reappears after being marked fixed
- Any production incident, regardless of severity elsewhere
