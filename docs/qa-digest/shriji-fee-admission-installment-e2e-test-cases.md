# Admission → Installment → Edit → Cancellation — E2E Test Cases

**Module:** Admissions + Installments
**App:** Shri Ji Fee Management Workflow System
**Environment:** Testing (`https://shriji-fee-develop.webmobsoft.com`), Main Centre, session 2026-27
**Execution date:** 2026-08-04
**Executed via:** Playwright MCP (live browser), roles: Staff (`ashish1660webmob@gmail.com`) and Admin (`ashishwebmob1990@gmail.com`)
**Test records used:** Admission No. `QA_E2E_001` (Roll No. `1015`, manual entry); `BULK_QA_001`/`BULK_QA_002` (Roll No. `2001`/`2002`, bulk-imported) — all synthetic data, safe to delete

This run walked the full lifecycle live — create admission → view/search → pay off remaining
installment → view transactions → edit (Admin) → cancel (Admin) — and captured actual behavior to
generate the test cases below. Cases marked **[live-verified]** were executed and passed this run;
others are derived from the same flow but not all were separately re-executed (e.g. negative/validation
variants already covered in `tests/e2e/critical-flows/admission-management.spec.ts` and
`installment-management.spec.ts`).

## Test Cases

| ID | Category | Scenario | Given | When | Then | Priority | Automation candidate |
|----|----------|----------|-------|------|------|----------|----------------------|
| TS_101 | Functional | Staff creates a new admission with a partial deposit | Staff is logged in, on Admissions tab | Fills required fields with Fees Paid < Final Fees and submits | Admission created with status Confirmed; row appears at top of list; "Next Due Month" field is required and shown only when Fees Paid < Final Fees | P0 | Yes |
| TS_102 | Functional | Staff creates a new admission with full payment | Staff is on Add Admission form | Fees Paid == Final Fees | Admission created; "Next Due Month" field does not appear/is not required | P1 | Yes |
| TS_103 | Functional | Search/view admission by Roll No. | Admissions list has ≥1 entry | Type roll no. into "Search by name, roll no. or admission no." | List filters to exactly the matching row(s); "N entries" count updates | P0 | Yes |
| TS_104 | Functional | Record a new installment that fully clears the remaining balance | Admission has Remaining Fee > 0 | Staff opens row Actions → "Record New Installment", enters Fees == Remaining Fee, submits | Installment recorded; Remaining Fees becomes ₹0.00; Installment record status becomes "Completed"; installment count increments | P0 | Yes |
| TS_105 | Functional | View all transactions for a record | Admission has ≥1 installment | Open row Actions → "View All Transactions" | Page shows Student Name/Roll/Admission No./Course, Final Fees, Total Paid, Pending Amount, and an Installment History table with one row per payment (amount, method, deposit date, status) | P1 | Yes |
| TS_106 | Functional | Admin edits an admission's name | Admin logged in, admission exists and Confirmed | Admin opens row Actions → Edit (pencil icon), changes Name only, clicks "Update Admission" | "Admission updated" toast; list row reflects new name immediately | P0 | Yes |
| TS_107 | Functional | Admin cancels an admission (no refund) | Admin logged in, admission exists and Confirmed | Admin opens row Actions → Cancel (circle-slash icon) → confirm dialog → leaves "Initiate Refund" off → "Yes, Cancel Admission" | "Admission cancelled" toast; row Status becomes Cancelled; "Cancelled On" populated with today's date; Print button replaced by "Info" link; Edit/Cancel icons removed (re-cancel blocked) | P0 | Yes |
| TS_108 | Role-based access | Edit/Cancel are Admin-only | Same admission record, viewed once as Staff and once as Admin | Compare the Admissions list "Actions" column for each role | Staff: no Actions column / no Edit or Cancel control anywhere (list, detail page, or Installments menu). Admin: Actions column shows Edit + Cancel icons | P0 | Yes |
| TS_109 | Functional | Admin edit form is not field-locked | Admin logged in, opens Edit on a Confirmed admission | Inspect form fields | All fields are editable (Roll No., Course, Payment Method, Deposit Date, Fees Paid, Final Fees, mobiles, Next Due Month); subtitle warns "Editing a fee or deposit detail will void the current receipt and issue a new one." | P1 | Yes |
| TS_110 | Functional | Cancel dialog offers a refund toggle | Admin opens Cancel confirmation dialog on a record with paid installments | Observe dialog contents | Dialog shows "Initiate Refund for this installment?" switch (default off) in addition to the cancel warning text | P1 | Yes |
| TS_111 | Installments menu state | Actions menu shrinks once fully paid | Installment record has Remaining Fees > 0 vs. == 0 | Open row Actions on each state | Not-fully-paid: "Record New Installment" + "View All Transactions". Fully paid: only "View All Transactions" | P1 | Yes |
| TS_112 | Validation | Required-field errors on empty Add Admission submit | Staff/Admin on blank Add Admission form | Click Submit without filling fields | Inline errors for Admission Number, Roll Number, Name, Father's Name required | P1 | Yes (already in `admission-management.spec.ts`) |
| TS_113 | Validation | Fees Paid cannot exceed Final Fees | On Add Admission form | Enter Fees Paid > Final Fees | Inline error "Fees paid cannot exceed final fees"; Submit stays disabled | P0 | Yes (already covered) |
| TS_114 | Data integrity | Total Paid == sum of installment amounts | Admission with 2 installments (₹5,000 + ₹5,000) | Open transactions/detail view | Total Paid = ₹10,000.00, Pending Amount = ₹0.00, matches Final Fees | P1 | Yes |
| TS_115 | Negative | Re-cancelling an already-cancelled admission is blocked | Admission status is Cancelled | Attempt to find a Cancel control | No Edit/Cancel controls remain on a Cancelled row (only "Info") | P1 | Yes |
| TS_116 | Functional | Download the Bulk Upload sample template | On Admissions tab, "Upload In Bulk" dialog open | Click "Download Template" | `admissions-import-template.xlsx` downloads with 3 sheets (Admissions, Lists, Instructions); headers match `Admission No, Roll No, Name, Father Name, Mobile, Father Mobile, Course, Final Fees, Fees Paid, Next Due Month, Deposit Type, Bank Name, DD or Txn No, DD Date(DD/MM/YYYY), Remarks` | P1 | Yes |
| TS_117 | Functional | Bulk-upload a valid single-row file (partial payment) | Valid `.xlsx` matching the template, required columns filled, Fees Paid < Final Fees | Browse File → select file → "Upload & Validate" | Dialog reports "1 of 1 records added"; new admission appears immediately in the Admissions list with status Confirmed and correct Initial Deposit | P0 | Yes |
| TS_118 | Negative | Reject a non-.xlsx file client-side | Bulk Upload dialog open | Select a `.csv` file via Browse File | Inline error "Only .xlsx files are supported." shown; no upload attempted; Total Admissions count unchanged | P1 | Yes |
| TS_119 | Functional/Edge case | Mixed valid + invalid rows in one file report partial success with per-row reason | 2-row `.xlsx`: row 1 valid, row 2 has Fees Paid > Final Fees | Upload & Validate | Dialog reports "1 of 2 records added · 1 failed" plus the specific reason, e.g. "Row 3 (ADM_NO): The deposit amount cannot exceed the final fees." (row numbers are 1-indexed including the header row); only the valid row's admission is created | P0 | Yes |
| TS_120 | Negative | Reject a duplicate Admission No. via bulk upload | `.xlsx` row reuses an Admission No. that already exists (e.g. `adm_001`) | Upload & Validate | Dialog reports "0 of 1 records added · 1 failed" with reason "Row 2 (adm_001): This admission number is already in use. Please enter a different one."; no new/duplicate admission created | P0 | Yes |
| TS_121 | Data integrity | Bulk-imported Course/Bank Name must already exist in the app | Template's Instructions sheet states values are matched case-insensitively against existing app data and must be created in-app first (no more auto-create-by-name) | Upload a row with a Course name not yet in the app | Expected: row fails validation (unconfirmed this run — flagged as a gap, see Open Questions) | P2 | No — needs a dedicated negative-course-name test first |
| TS_122 | Functional | Enabling the refund toggle reveals a required Refund Amount field | Admin opens Cancel dialog on a Confirmed admission with Total Paid > 0 | Toggle "Initiate Refund for this installment?" ON | A required "Refund Amount" field appears with hint "Max refundable: ₹{Total Paid}"; "Yes, Cancel Admission" stays enabled (no amount entered yet is not blocking until submit is attempted in practice, but field is marked required) | P0 | Yes |
| TS_123 | Validation | Refund Amount cannot exceed the total paid | Refund toggle ON, dialog open | Enter an amount greater than Total Paid (e.g. ₹9,000 on an ₹8,000 paid record) | Inline error "Cannot exceed the total paid (₹{Total Paid})"; "Yes, Cancel Admission" becomes disabled | P0 | Yes |
| TS_124 | Functional | Cancel + partial refund in one action | Refund toggle ON, valid partial amount entered (e.g. ₹3,000 of ₹8,000 paid) | Click "Yes, Cancel Admission" | Admission Cancelled; Installments list row shows "Cancelled" status with a "₹3,000.00 refunded" sub-label; Installments page REFUNDED stat card increments | P0 | Yes |
| TS_125 | Data integrity | Refund creates a distinct negative transaction row, original installment untouched | After TS_124, open the record's transactions/detail page | Inspect Installment History and header fields | REFUNDED AMOUNT = ₹3,000.00; top STATUS = "Refunded"; Installment History gains a new "Refund" row (amount -₹3,000.00, payment method "—", remarks "Refund on admission cancellation", status "Refunded"); the original installment row is unchanged, still "Paid" | P1 | Yes |
| TS_126 | **Bug** | Cancelling *without* enabling the refund toggle still mislabels the record as "Refunded" | Admission cancelled with the refund toggle left OFF (no refund ever requested) | Open the record's transactions/detail page | **Defect:** top-level STATUS field incorrectly shows "Refunded" (REFUNDED AMOUNT correctly stays ₹0.00, but the status word is misleading since no refund occurred). The Installments list row itself is correct (plain "Cancelled", no refunded sub-label) — only the detail-page STATUS field and the aggregate REFUNDED stat card are wrong. The REFUNDED stat card counts by installment-row, not by admission (a 2-installment admission cancelled with no refund bumped REFUNDED by 2) | P1 | Yes |

## Open questions / findings raised this run

1. **Edit/Cancel is Admin-only (confirmed by stakeholder 2026-08-04)** — the Admissions list's Actions
   column (Edit/Cancel icons) does not render at all for Staff. Update any test plan assuming Staff can
   edit/cancel.
2. **Edit form field-locking is NOT what prior docs described, for Admin.** Admin's edit form has no
   locked fields — a live discrepancy from the note in `QA-DIGEST.md` §7.6/LV-10 ("all fee/payment
   fields locked, only name/contact editable"). That note may have described Staff-role behavior, or an
   older build. See correction added to `QA-DIGEST.md` §7.6 and to project memory
   `cancel-admission-vs-installment`.
3. **Refund flow fully tested (2026-08-04) — see TS_122–TS_126.** Toggling "Initiate Refund for this
   installment?" ON reveals a required Refund Amount field capped at Total Paid, with inline validation.
   A valid amount cancels + refunds in one action, producing a distinct negative "Refund" transaction row.
   **Bug found (TS_126):** cancelling with the toggle left OFF still causes the transactions/detail
   page's top-level STATUS field to show "Refunded" (misleadingly — REFUNDED AMOUNT correctly stays
   ₹0.00), and the Installments page's REFUNDED stat card still increments (by installment-row count,
   not by admission). Only the Installments **list row** itself is unaffected/correct in this case. See
   project memory `refund-flow-mechanics` for the full writeup.
4. **Installments row Actions menu (Staff role) showed only 2 items** ("Record New Installment",
   "View All Transactions") rather than the 3-item menu ("Edit Details" + the other two) referenced
   elsewhere in this repo's spec comments. Worth confirming whether "Edit Details" is Admin-gated too,
   or was removed from this build.
5. **`.env` admin email had a typo** (`aashishwebmob1990@gmail.com`, double "a") that caused repeated
   401s; corrected to `ashishwebmob1990@gmail.com`.
6. **Bulk Upload template drifted from prior documentation.** The live template's columns no longer
   match what `QA-DIGEST.md` §7.4 described: `Fees` → `Fees Paid`, `Installment Cycle Months` →
   `Next Due Month`, `Deposit Date` → `DD Date(DD/MM/YYYY)`, `Bank` → `Bank Name`, and the **`Status`
   column has been removed entirely** (bulk imports can no longer be created as Pending/Cancelled — every
   row imports as Confirmed). Course/Bank Name also no longer auto-create from the file; the Instructions
   sheet now says they "must already exist in the app." See correction added to `QA-DIGEST.md` §7.4.
7. **Bulk Upload's Lists reference sheet (Courses dropdown) is missing "9TH FOUNDATION"** even though a
   live admission (`adm_005`) already uses that course. Unclear if this blocks importing a row with that
   course name — not tested (see TS_121).
8. **Previous note that Admissions Bulk Upload was "not fully wired" (SD-1) is itself stale** — it has
   been fully functional since 2026-07-08 per `QA-DIGEST.md` §7.4, and re-confirmed live today (TS_116–
   TS_120). The "Out of Scope" line in the original version of this document repeating that claim was
   wrong and has been removed.

## Not covered this run (out of scope / flagged in prior docs, do not re-chase)

- "Verify Installment" — confirmed **Pending Development** by stakeholder (2026-07-06); excluded from
  regression until shipped.
- Bulk-importing a row with a Course/Bank Name that doesn't yet exist in the app (TS_121) — expected to
  fail per the Instructions sheet, but not exercised live this run.
- Refunding an installment on a record with >1 paid installment (only tested against single-installment
  and 2-installment-no-refund cases) — untested whether the refund amount can be attributed to a specific
  installment or is always applied against the admission total.
- Bulk-imported `Deposit Type` value "Online/UPI" vs. the single-admission form's "UPI" naming
  inconsistency — noted, not filed as a defect, not re-tested.
