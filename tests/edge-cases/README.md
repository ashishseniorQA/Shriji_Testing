# tests/edge-cases/

Boundary values, unusual input combinations, and race conditions — deliberately kept separate
from `e2e/` and `regression/` so these don't dilute core-flow signal, while still being tracked
and run on a schedule.

Suggested coverage for a Fee Management Workflow System:
- Zero, negative, and extremely large fee amounts
- Currency rounding at the smallest denomination (half-cent rounding rules)
- Two approvers acting on the same fee record concurrently
- Approval submitted, then the underlying record is edited before approval completes
- Fee record with the maximum allowed number of line items/attachments
- Unicode/special characters in free-text fields (payer name, notes)
- Timezone edge cases around fee due-dates and approval timestamps (DST transitions)
