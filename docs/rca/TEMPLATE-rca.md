# RCA: {{TITLE}}

| Field | Value |
|---|---|
| Bug ID | BUG_### |
| Severity | Blocker / Critical / Major / Minor |
| Reported | {{DATE}} |
| Environment | staging / production |
| Module | |
| Author | |

## Summary
One paragraph: what happened, who/what was affected, current status.

## Timeline
| Time | Event |
|---|---|
| | Defect introduced (if known — link commit/PR) |
| | Defect detected |
| | Reported |
| | Root cause identified |
| | Fix deployed |
| | Verified |

## Impact
- Users/records affected:
- Financial impact (if any — e.g. incorrect fee amounts, duplicate postings):
- Audit trail impact:

## Root Cause
What actually caused it — not just the symptom. Distinguish the triggering condition from the
underlying defect.

## Why It Wasn't Caught Earlier
Be specific: missing test coverage, wrong assumption in existing tests, environment difference,
etc. This section drives the "Prevention" section below — don't skip it.

## Fix
What changed, link to PR/commit.

## Prevention
- [ ] Regression test added: `tests/regression/critical/<spec>.spec.ts` or
      `tests/regression/full-suite/<spec>.spec.ts`
- [ ] Traceability matrix updated (`docs/issue-tracker/traceability-matrix.md`)
- [ ] Related areas checked for the same class of bug
- [ ] Monitoring/alerting added if this should have been caught in production first

## Related
- Issue log row:
- Related RCAs:
