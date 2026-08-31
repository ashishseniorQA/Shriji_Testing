# QA Execution Report — Admission / Installment / Edit / Cancellation / Bulk Upload / Refund

**App:** Shri Ji Fee Management Workflow System
**Environment:** Testing (`https://shriji-fee-develop.webmobsoft.com`), Main Centre, session 2026-27
**Execution Date:** 2026-08-04
**Executed By:** Claude (QA Automation), via Playwright MCP live browser execution
**Test Case Source:** `shriji-fee-admission-installment-e2e-test-cases.xlsx` (sheet "Test Cases")
**Roles used:** Staff (`ashish1660webmob@gmail.com`) and Admin (`ashishwebmob1990@gmail.com`)

---

## 1. Executive Summary

Every test case in the sheet (TS_101–TS_126, 26 total) was executed sequentially against the live
testing environment this run. No test case was skipped or blocked — full credential and environment
access was available throughout.

| Status | Count | Test Case IDs |
|---|---|---|
| ✅ Done | 24 | TS_101–TS_105, TS_107–TS_125 (excluding 106, 126) |
| ❌ Issue | 2 | TS_106, TS_126 |
| ⚠️ Blocked | 0 | — |
| ⏭️ Skipped | 0 | — |

**Pass rate: 24/26 (92%).** Both Issues are documented below with full reproduction steps and are
tracked as **BUG-001** and **BUG-002** in the workbook's "Bug Reports" sheet.

## 2. Scope Covered

- **Admissions:** create (partial/full payment), search, edit (Admin), cancel (Admin, with/without
  refund), role-based Actions visibility (Staff vs Admin), field validation.
- **Installments:** record payment, view transaction history, Actions-menu state (ongoing vs
  fully-paid), data integrity (Total Paid / Pending Amount reconciliation).
- **Bulk Upload:** template download/structure, valid upload, invalid file type, mixed valid+invalid
  rows, duplicate Admission No. rejection, nonexistent-Course rejection.
- **Refund flow:** toggle behavior, max-refundable validation, partial refund execution, transaction
  ledger correctness, and re-verification of a previously known defect (no-refund mislabeling).

## 3. Findings — Issues Raised This Run

### BUG-001 — False "Reissue receipt?" prompt on a name-only edit (New)

| Field | Detail |
|---|---|
| Test Case | TS_106 |
| Module / Feature | Admissions / Edit Admission (Admin) |
| Severity / Priority | Medium / Medium |
| Steps to Reproduce | Admin → Edit any Confirmed admission → change **only** the Name field (leave every fee/deposit field untouched) → click "Update Admission" |
| Expected | "Admission updated" toast fires directly; no extra confirmation, since no fee/deposit field changed |
| Actual | A modal appears: *"Reissue receipt? You've changed a fee or deposit detail. Saving will void the current receipt and issue a new one with a new receipt number."* — factually incorrect for a name-only change. Clicking through still saves correctly (name updates, toast fires). |
| Root Cause (unconfirmed) | The fee/deposit-change detection likely fires on *any* form submission rather than diffing which field actually changed |
| Screenshot | `screenshots/2026-08-04/TS_106_ISSUE_FalseReissueReceiptPrompt.png` |
| Impact | Non-blocking (edit still completes correctly), but misleading wording risks confusing Admins into thinking a receipt will be voided when editing plain contact details |

### BUG-002 — "Refunded" status/count shown even when no refund was requested (Confirmed, pre-existing)

| Field | Detail |
|---|---|
| Test Case | TS_126 |
| Module / Feature | Admissions + Installments / Cancel Admission, no-refund path |
| Severity / Priority | Medium / Medium |
| Steps to Reproduce | Admin → cancel a Confirmed admission with Total Paid > 0, leaving "Initiate Refund" **OFF** → open that record's Installments → "View All Transactions" |
| Expected | STATUS reads "Cancelled" (matching the Installments list row); REFUNDED stat card unaffected |
| Actual | STATUS reads **"Refunded"** (REFUNDED AMOUNT correctly ₹0.00, but the status word is wrong); the Installments page REFUNDED stat card increments by the count of paid installment rows on that admission |
| Root Cause (unconfirmed) | Status/stat derivation likely keys off "Cancelled + has prior paid installments" rather than an actual refund-initiated flag |
| Screenshot | `screenshots/2026-08-04/TS_126_ISSUE_RefundedStatusBugWithZeroAmount.png` |
| Impact | Any reporting/reconciliation built on the "Refunded" label or REFUNDED stat card will overcount real refunds. This is a **re-verification**, not a new find — first surfaced earlier the same day; confirmed still present. Recommend keeping in the regression suite until fixed. |

## 4. Notable Non-Defect Observations

- **TS_113:** the disabled "Submit Admission" button retains its normal blue styling rather than a
  visually "greyed-out" disabled look. Confirmed functionally disabled via the DOM (`[disabled]`
  attribute present) — purely a cosmetic inconsistency, not filed as a defect.
- **TS_121:** previously flagged in the test-case document as untested / "no automation candidate."
  Executed this run — the app correctly rejects a bulk-import row referencing a Course that doesn't
  exist at the centre, with a clear, specific error message. Recommend updating that test case's
  Automation Candidate flag to "Yes" going forward.

## 5. Test Data Used

All records created this run use the `TCX_1xx`/`TCX_12x` synthetic naming convention (e.g. `TCX_101`,
`TCX_106`, `TCX_107`, `TCX_117`, `TCX_119A/B`, `TCX_121`, `TCX_122`) plus bulk-upload files under
`.playwright-mcp/bulk-upload-tests-run2/`. No real user or financial data was used. Two records
(`TCX_107`, `TCX_122`) were intentionally cancelled as part of TS_107/TS_110/TS_115/TS_122–126; these
cancellations are expected, reversible-in-intent test actions, not accidental data loss.

## 6. Validation Checklist

- [x] Every test case (26/26) has been executed.
- [x] Every row has an execution status (Done/Issue — no blanks).
- [x] Every Issue-status test case has an attached screenshot.
- [x] Every Issue includes a complete bug description (Bug Reports sheet, BUG-001/BUG-002).
- [x] No test case left blank in the updated sheet.
- [x] Updated `Test Cases` sheet is complete and ready for sharing (new columns: Execution Status,
  Execution Date, Executed By, Actual Result, Bug ID, Screenshot Reference, Execution Notes — existing
  columns untouched).

## 7. Artifacts

- `shriji-fee-admission-installment-e2e-test-cases.xlsx` — updated `Test Cases` sheet + new `Bug
  Reports` sheet
- `screenshots/2026-08-04/` — 8 evidence screenshots (TS_105/114, TS_106, TS_108, TS_113, TS_121,
  TS_123, TS_125, TS_126)
