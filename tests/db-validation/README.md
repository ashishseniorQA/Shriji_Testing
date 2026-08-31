# tests/db-validation/

**Added beyond the original requirements list** — see "Missing areas" in the root QA summary
for why. A Fee Management Workflow System lives or dies on data-layer correctness that UI/API
tests alone won't fully catch:

- Fee calculation accuracy (tax, discounts, late fees, rounding) verified directly against
  stored values, not just what the UI displays.
- Referential integrity after workflow state transitions (e.g. does rejecting an approval
  correctly revert dependent records, or leave orphaned state?).
- Audit-trail completeness and immutability (every state change has a corresponding, unaltered
  audit record).
- Idempotency of payment-posting operations (retried/duplicate requests don't double-post).

These tests talk to the backend/DB layer directly (via API + a read-only DB query helper in
`utils/api-clients/` or a dedicated DB client), not through the browser. Keep them read-only
against shared environments; use `test-data/seed-scripts/` to set up isolated fixtures rather
than mutating shared staging data.
