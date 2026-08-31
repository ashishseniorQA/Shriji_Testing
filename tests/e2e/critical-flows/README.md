# tests/e2e/critical-flows/

Release-gating end-to-end journeys. A failure here blocks the release.

## Coverage (Fee Management Workflow System — Shri Ji)

Phase 1, implemented per the automation roadmap (Auth → Admission → Installment →
Payment → GST first; Refund, Receipt, Dashboard, Student Ledger, Reports next).
Bulk Upload is explicitly out of scope everywhere — it is Pending Development (SD-1).

- [x] `authentication.spec.ts` — login (positive both roles, wrong password, all 3
      field-validation messages, EDGE-007 double-submit, EDGE-013 logout+Back, BR-16
      role-gate redirects), plus API-level `POST /auth/login` 200/401 checks
- [x] `admission-management.spec.ts` — create (admin + staff parity), required-field
      validation, BR-02 (fees≤finalFees), BR-04 (lax mobile validation), BR-01/SD-2
      cancel lifecycle, LV-10 field-locked Edit form
- [x] `installment-management.spec.ts` — list/tabs/search, row Actions menu contents
      (source-confirmed: no Cancel/Verify option exists), Edit Details → Admissions
      edit routing (SD-2), Record New Installment prefill, View All Transactions, staff
      parity
- [x] `payment-collection.spec.ts` — `AddInstallmentPage` form: BR-06 lookup/autofill,
      lookup-not-found, field validation, BR-07 (no over-payment guard, documents actual
      lax behavior), BR-08 payment-method matrix (all 4 methods, no bank/DD required),
      Idempotency-Key header, remaining-fee update after payment
- [x] `gst-calculation.spec.ts` — BR-11 formula regression (exact live-verified worked
      example + odd-paisa-to-SGST rule + full live-verified amount spectrum), boundary
      amounts (₹1, ₹5,00,000) survive real admission creation without NaN/crash. Full
      on-screen/CSV GST cross-verification is deferred to the Receipts/Reports phase —
      see the spec's header comment for why.
- [x] `role-based-access.spec.ts` — nav visibility and BR-16 route guards for both
      roles, shared-module access parity (Admissions/Installments)

Check items off as specs are implemented. Each spec should be tagged `@critical` and
cross-referenced in `tests/regression/critical/` and `docs/issue-tracker/traceability-matrix.md`.

## Known gaps / deliberately deferred (not silently skipped)

- Cancelling an admission and then attempting to record an installment against it
  (BR-01's "blocks further installments") is **not yet automated** — the exact failure
  mode (lookup rejects it vs. submit rejects it) was never live-verified during manual
  QA, and SD-3 (backend enforcement) is officially Pending Backend Verification. Confirm
  the actual behavior manually first, then add the test.
- GST on-screen/CSV cross-verification (Receipt, Fee Report, GST Report) waits on the
  Receipt/Reports page objects, planned for the next phase.
- Settings-driven role differences (Institute Details/Notifications hidden for staff,
  Banks/Courses/Centres read-only for staff) are confirmed in source but not yet
  automated — Settings is a later-phase module.
