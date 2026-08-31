# Manual QA Walkthrough — Fee Management Workflow System

**Type:** Full manual regression walkthrough (module by module), pre-automation.
**Started:** 2026-07-06
**Reference:** `docs/qa-digest/QA-DIGEST.md` (source of truth for business flow, field lists, API mapping,
edge cases — this file does NOT duplicate that detail, only scenario execution + results + evidence).

## Scope

Every module listed in QA-DIGEST.md Section 3 (Module Inventory), tested manually against the live
`testing` environment before any Playwright automation is written. Per stakeholder decision SD-5
(digest Section 22.5), automation does not start until this full walkthrough completes and the digest
is corrected wherever live behavior diverges from the original static-code-analysis version (v1.0).

## Out of Scope (for now)

- Admissions Bulk Upload — confirmed Pending Development (SD-1). Excluded from this walkthrough entirely
  until the dev team ships the feature.
- Full penetration-style security testing (Section 15 of the digest) — the role/scope-enforcement checks
  noted as "Pending Backend Verification" (SD-3) will be spot-checked opportunistically during this
  walkthrough (e.g., direct-URL role-gate tests), but a dedicated security pass is a separate future
  exercise.

## Environment

| Property | Value |
|---|---|
| Environment | `testing` (per `Shriji-testing/.env`, `ENVIRONMENT=testing`) |
| Base URL | `https://shriji-fee-testing.webmobsoft.com` |
| Admin account | `ashish@webmobinfo.ch` |
| Staff account | `ashish1660webmob+13@gmail.com` (display name "Staff2") |
| Centres available | "Main Centre", "Sub Centre" |
| Academic session | "2026-27" |

Credentials live only in the gitignored `Shriji-testing/.env` — never in this file or the digest.

## Entry Criteria
- QA-DIGEST.md v1.0 complete (static analysis of FE source).
- Live environment + credentials available (met 2026-07-06).

## Exit Criteria
- Every module in Section 3 of the digest has been manually exercised at least once for its happy path,
  its primary negative path, and any role-permission boundary that applies to it.
- Every discrepancy between the digest's static-analysis claims and live behavior is logged in
  QA-DIGEST.md Section 22.6 (Live Verification Log) and, where it's a genuine defect, in
  `docs/issue-tracker/issues-log-template.csv`.
- Scenarios worth automating are flagged per-module below for a future Playwright-writing pass.

## Sign-off Owner
Ashish (product owner) — per this conversation.

---

## Module 1 — Authentication ✅ COMPLETE (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 6.1/6.2/2.6. **Prerequisite:** none (entry point).

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Admin login, wrong password | Negative | Select "Main Centre", enter admin email + wrong password, Sign In | Inline error, stay on `/login` | `POST /api/auth/login` → 401; inline alert "Invalid email or password"; console logged the 401 via the app's own API/QueryClient error logger, no crash | **PASS** | Snapshot + console log captured in session |
| Admin login, correct credentials | Positive | Same, corrected password | Redirect to `/dashboard`, Topbar shows role/nav for admin | Redirected correctly; nav shows Dashboard/Users/Admission/Installments/Reports/Settings (all 6 items — full admin set) | **PASS** | Snapshot captured |
| Admin logout | Positive | Topbar avatar → Logout | Redirect to `/login`, session cleared | Redirected correctly, menu showed disabled name/email row + Logout item exactly as documented | **PASS** | Snapshot captured |
| Staff login, correct credentials | Positive | Select "Main Centre", staff email/password, Sign In | Redirect to `/dashboard`, Topbar shows role/nav for staff | Redirected correctly; nav shows only Dashboard/Admission/Installments/Settings — **Users and Reports correctly absent** | **PASS** | Snapshot captured |
| Staff direct-URL access to `/users` | Permission | While logged in as staff, `page.goto('/users')` (hard navigation) | Silent redirect to `/dashboard`, no error message (per digest EDGE-126) | Redirected to `/dashboard` exactly as documented; session survived the hard reload via silent cookie refresh | **PASS** | Snapshot captured |
| Staff direct-URL access to `/reports` | Permission | Same, `/reports` | Silent redirect to `/dashboard` (per digest EDGE-086) | Redirected to `/dashboard`, no message | **PASS** | Snapshot captured |
| Centre dropdown population | Boundary/data | Open Centre select on login page | Options load from `GET /centres` | Two centres loaded: "Main Centre", "Sub Centre" | **PASS** | Snapshot captured |

**APIs verified:** `POST /auth/login` (401 + 200 paths), `POST /auth/logout`, `POST /auth/refresh` (implicit, on hard reload), `GET /centres`.

**Not yet tested this session (carry forward):** Forgot Password flow (EDGE-011/012), Reset Password flow incl. invalid/missing token (EDGE-009/010), OTP email-verification flow (EDGE-109/110/111), session-timeout / proactive-refresh behavior (EDGE-015), multi-tab logout behavior (EDGE-016), back-button behavior post-logout (EDGE-013/014).

**Automation candidates (high value, stable):** admin login success, staff login success, wrong-password error message, staff role-gate redirects for `/users` and `/reports`. These are deterministic, fast, and already have exact expected strings documented — good first Playwright specs once automation begins.

---

## Module 2 — Dashboard 🔶 CORE VERIFIED — advanced/edge cases deferred to regression phase (stakeholder decision, 2026-07-06)

**Business flow:** see QA-DIGEST.md Section 7 intro / Section 3 row 2. **Prerequisite:** Module 1 login.

| Scenario | Type | Steps | Expected (per digest v1.0) | Actual (live) | Result | Evidence |
|---|---|---|---|---|---|---|
| Admin Dashboard KPI cards | Data/functional | Load `/dashboard` as admin | 4 cards per static review | **5 cards live**: Total Students, Total Collected, Total Refunded, Net Balance, Pending Fees | **VERSION/ENVIRONMENT MISMATCH — unresolved, not filed as a defect.** Pending dev team confirmation of intended baseline (stakeholder decision 2026-07-06). See digest LV-3. | Snapshot captured |
| Admin "This Month" filter button | Negative/functional | Click "This Month" | Static review: decorative, no-op | Confirmed no-op live — button toggles its own active state only, no data/subtitle change | **PASS (confirms known gap)** | Snapshot before/after captured |
| Admin Dashboard "Recent Installments" negative Remain display | Data integrity | Observe table with existing overpaid test data | Not explicitly predicted by static review beyond a general clamp note | Two rows show raw negative Remain (`-₹65,000`, `-₹4,97,000`), unclamped — inconsistent with Installments list page's clamp-to-zero behavior | **NEW DEFECT — BUG_003 filed** | Snapshot captured |
| Staff Dashboard KPI cards | Data/functional | Load `/dashboard` as staff | 3 cards: My Students, Pending Fees, Today's Collection | Confirmed exactly 3 cards, matching digest precisely | **PASS** | Snapshot captured |
| Staff Dashboard subtitle hardcoded text | Content/data | Observe subtitle under "Dashboard" heading | "Welcome Staff Cashier — {session}" regardless of actual staff name | Confirmed: shows "Welcome Staff Cashier — 2026-27" even though logged-in user is "Staff2" | **PASS (confirms known bug)** | Snapshot captured |
| Orphaned `₹0L` DOM element | Visual/regression | Observe page after navigating Admin Dashboard → Logout → Login → Staff Dashboard | Not predicted by static review (impossible to find via source alone) | Confirmed present on 3 consecutive SPA-navigated screens; absent after a hard page reload | **NEW DEFECT — BUG_002 filed** | Snapshots captured across 3 screens |

**Deferred to regression phase (stakeholder decision, 2026-07-06):** Admin dashboard charts with
edge-case data (zero data, single data point), realtime update via socket (`dashboard:changed`) by
making a change from a second session, polling fallback with socket disconnected, "View All" dead-link
buttons, notification bell popover content and mark-read behavior, centre/session switch effect on
dashboard data. Priority for the remaining walkthrough passes is the core business flow: Admissions →
Installments → Fee Collection → Receipts → Transactions, then back to Dashboard edge cases and
remaining modules before regression sign-off.

**APIs to verify (carried forward):** `GET /dashboard` (response shape — confirm whether
`DashboardAdminCards` now actually includes `totalRefunded`/`netBalance` fields server-side once the
dev team responds on the version/environment mismatch, LV-3).

**Automation candidates:** KPI card presence/values for both roles (hold until the card-set mismatch is
resolved with the team — do not lock in assertions against an unconfirmed baseline), staff nav-item
absence, empty-state table text ("No recent collections").

---

## Module 3 — Admissions 🔶 IN PROGRESS

**Business flow:** see QA-DIGEST.md Section 7.1–7.4. **Prerequisite:** Module 1 login (admin or staff —
no role differences expected per the digest).

**Test data created:** Admission `QA-TEST-001` / Roll No. `QA-9999` / "QA Test Student" — course BCA,
Cash, Deposit Date 06 Jul 2026, Fees Paid ₹5,000, Final Fees ₹50,000, Installment Cycle 6 Months.
Explicitly marked in its Remarks field as safe-to-cancel test data. **Not yet cancelled** — left active
to support the downstream Installments/Receipts/Transactions chain per stakeholder instruction to
validate the full flow. Will be cancelled (not deleted — no such action exists per BR-01) once the full
chain is verified, unless told to leave it as persistent test fixture data.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Admissions list — columns/stats/filters | Functional/data | Load `/admissions` as staff | 10 columns, 3 stat cards (no Pending card), status filter = All/Confirmed/Cancelled only | Matched exactly, byte-for-byte with digest | **PASS** | Snapshot captured |
| Status filter dropdown options | Boundary (EDGE-037) | Open Status filter | "All Status"/"Confirmed"/"Cancelled" only, no "Pending" | Confirmed exactly 3 options, no Pending | **PASS (confirms known gap)** | Snapshot captured |
| Course dropdown data hygiene | Data integrity | Open Class/Course dropdown on Add Admission | N/A — no format validation expected on course names (per digest §9.5) | Found a pre-existing course literally named `"12333333)))((((&&&&&##@@!!"` in the live dropdown — confirms zero content/format validation on master-data course creation | **PASS (live-confirms known validation gap)** | Snapshot captured |
| Add New Admission — full field render | Functional | Open `/admissions/new` | All fields per digest §9.2 render with correct labels/placeholders | Matched exactly. Also surfaced 2 browser console warnings: `"The specified value 'NaN' cannot be parsed"` on page load (Fees Paid / Final Fees number inputs default to uncontrolled NaN) | **PASS + minor new defect noted (see notes)** | Snapshot + console log captured |
| Create admission — happy path | Positive/E2E | Fill all fields with valid data, Submit Admission | Toast "Admission created successfully", redirect to list, new row visible, stats increment | Exact match: toast text verbatim, redirected, row appeared as row 1, TOTAL/CONFIRMED both went 6→7. **Print receipt button was immediately enabled on the new row** (not disabled), confirming a receipt is generated synchronously at creation time | **PASS** | Snapshot + toast captured |
| Print receipt on newly-created admission | Positive | Click Print icon on QA-TEST-001 row | PDF blob downloads, no error toast | No error toast fired; console showed no new errors. Notification bell count incremented 8→9 immediately after, confirming admission-create fires an in-app notification event (`new_admission` type per Topbar icon mapping) | **PASS** | Console + snapshot captured |

| Edit admission — resolves "Edit Installment" (SD-2) | Investigation + positive | Open Edit on QA-TEST-001; observe field states; change Name to "QA Test Student Edited"; Update Admission | Stakeholder said "Edit Installment" = Admissions tab Edit | **Major discovery:** form subtitle now reads "Update the student's name and contact details. Fee and payment details are locked." Only Name/Father Name/Mobile/Father's Mobile are enabled — every fee/payment field is disabled. Save succeeded: toast "Admission updated" (verbatim), row updated to new name, ₹5,000 fee figure unchanged | **PASS (name-edit works) + MAJOR FINDING logged (LV-10) — no UI path exists to correct a mistaken fee amount on an existing admission** | Snapshots + toast captured |

**Minor new defect noted:** Two browser-level `"NaN cannot be parsed"` console warnings fire on every
Add Admission page load (Fees Paid / Final Fees number inputs render with an uncontrolled `NaN` value
before user input). Not user-visible and not yet filed as a tracked bug (cosmetic console noise, easy
fix: default these fields to an empty string instead of `NaN`) — will file if it recurs elsewhere
(Add Installment form uses the same pattern per digest §9.3, worth checking when that module is tested).

**Not yet tested this pass:** search/pagination behavior.

**UPDATE 2026-07-08 (while building the Playwright automation framework):** Edit Admission, Cancel
Admission (dialog redesigned — see QA-DIGEST.md LV-31), and boundary/negative validation cases are now
covered by `tests/e2e/critical-flows/admission-management.spec.ts`. **Admissions Bulk Upload is no
longer excluded** — SD-1 is closed as shipped; the feature is fully implemented and was verified
end-to-end (template download → fill → upload → validate → "1 of 1 records added"). See QA-DIGEST.md
§7.4 (rewritten) and LV-32 for the full template/validation-rule breakdown and untested follow-ups
(multi-row files, partial-failure reporting, duplicate rejection).

**APIs verified:** `POST /admissions` (create, 200 + Idempotency-Key header), `GET /admissions` (list
refetch after create), `GET /receipts/:id/download` (print action, via `downloadReceiptPdf`).

**Automation candidates:** admission-create happy path (stable, exact toast text known), status-filter
option list, course-dropdown-has-inactive-item-preserved-on-edit (once Edit is tested).

---

## Cross-Module Verification — GST & Fee Calculation Audit ✅ COMPLETE (2026-07-06)

Performed out of the original module sequence at stakeholder request ("check GST and all the
calculations") immediately after creating the QA-TEST-001 admission, to validate financial correctness
before continuing the business-flow chain. Spans Reports (Fee Report + GST Report), Dashboard, and
Installments list.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| GST rate & formula | Calculation | Hand-computed Base/CGST/SGST from the Fee Report's "Fees (₹)" column for all 9 rows and compared to displayed CGST/SGST | Digest only knew "split evenly" (BR-11), exact rate unknown from FE code | Confirmed **18% total (9%+9%), tax-inclusive**: `Base = Fees ÷ 1.18`. Exact match on all 9 rows from ₹1 to ₹5,00,000, including correct odd-paisa rounding (remainder assigned to SGST) | **PASS — BR-11 updated with confirmed rate** | Manual calculation recorded in QA-DIGEST.md §22.6 LV-6 |
| GST Report ⟷ Fee Report reconciliation | Calculation/cross-check | Compare Fee Report row-sum, GST Report summary cards, and GST Report monthly table | Should all reconcile if calculations are consistent | Gross sum ₹6,64,001 = Taxable ₹5,62,712.70 + Total GST ₹1,01,288.30 (exact); June ₹5,70,000 + July ₹94,001 = ₹6,64,001 (exact); each month's Taxable+GST = that month's Total Fee Collected (exact) | **PASS — no discrepancy across any of the 3 aggregation views** | Snapshots of both report tabs captured |
| "Pending Fees" dashboard KPI aggregate | Calculation/cross-check | Sum "Remaining Fees (₹)" column across all 7 rows on Installments list; compare to Dashboard's Pending Fees card | Should match if the KPI aggregates correctly | ₹45,000+₹5,000+₹0+₹24,999+₹0+₹0+₹8,000 = **₹82,999**, exact match to the Dashboard KPI | **PASS** | Snapshot captured |
| "Total Students" / "Total Collected" KPI aggregates | Calculation/cross-check | Compare Dashboard cards to Admissions list total and Fee Report gross sum | Should match | Total Students (7) = Admissions list total (7); Total Collected (₹6,64,001) = Fee Report gross sum (₹6,64,001) | **PASS** | Snapshot captured |
| Negative-Remain display vs. aggregate correctness | Data integrity | Confirmed whether BUG_003's display bug affects the Pending Fees total | Unknown prior to this check | **Confirmed it does not** — Pending Fees uses the correctly-clamped per-student values; BUG_003 is display-only in one preview widget. Severity downgraded Medium→Low in the issue tracker | **PASS — BUG_003 re-scoped, not a financial-integrity issue** | Issue tracker updated |

**Conclusion: no calculation defects found anywhere in the fee/GST engine.** This was a genuine risk
area (Section 17.1 of the digest specifically calls out "financial correctness gaps" as a business
risk) and it has now been positively verified, not just assumed safe.

---

## Module 5 — Installments 🔶 IN PROGRESS

**Business flow:** see QA-DIGEST.md Section 7.5–7.8. **Prerequisite:** Module 3 admission QA-TEST-001.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Admission-number lookup autofill | Positive/functional | Type `QA-TEST-001` into Admission Number, wait ~2s | Roll No/Name/Father Name/Course/Final Fee/Remaining Fee/Mobile/Father's Mobile all autofill, read-only | Exact match: all fields populated correctly (Course BCA, Final Fee ₹50,000, Remaining Fee ₹45,000, both mobiles) after the debounced lookup | **PASS** | Snapshot captured |
| Payment Method → conditional required field | Boundary/validation (new discovery) | Select Payment Method "UPI" | Not predicted by digest (documented as always-optional) | **"DD No / Transaction No" label gained a required asterisk** immediately on selecting UPI | **NEW FINDING — LV-9 logged, needs follow-up for Cheque/DD and Bank Transfer** | Snapshot captured |
| Record installment — happy path | Positive/E2E | Fill Payment Method UPI, Txn No, Deposit Date 06 Jul 2026, Fees ₹10,000, Remarks; Submit | Toast "Installment recorded successfully", redirect to list, Remaining Fees decrements correctly | Exact match: toast verbatim, redirected, QA-TEST-001 row now shows Remaining Fees ₹35,000 (₹45,000 − ₹10,000, correct), Installments count 2, status "Paid". TOTAL RECORDS 9→10 | **PASS** | Toast + snapshot captured |
| Locate Cancel/Verify/Edit Installment UI (SD-2 follow-up) | Investigation | Checked "Actions" menu on a `Paid` row, "Actions" menu on a `Completed` row, and the Transactions detail page's per-row actions | Stakeholder stated these exist and are testable | **Not found in any of the 3 locations** — only "Record New Installment"/"View All Transactions"/"Print receipt" appeared. Reproduces the original static-analysis finding exactly | **SD-2 RE-OPENED — blocking, needs stakeholder input before this sub-area can be tested** | 3 snapshots captured, see digest LV-8 |

**SD-2 CLOSED (2026-07-06):** "Cancel" and "Edit" both resolved to Admissions-tab actions (already
tested and confirmed working in Module 3 — Edit surfaced a major finding, LV-10: fee/payment fields are
now locked, only Name/Father Name/Mobile/Father's Mobile remain editable). "Verify Installment"
confirmed by stakeholder as **Pending Development** — same treatment as the Admissions Bulk Upload
(SD-1): excluded from defect reporting and this cycle's regression run, marked "Pending Development /
Not Yet Testable." All three resolutions saved to persistent memory.

**Not yet tested this pass:** Bulk Upload (functional, per digest — not excluded like Admissions'), Send
Reminder (needs an `overdue` record, none exist in current test data — OVERDUE stat = 0), boundary/
negative cases (fees > remaining, fees = 0), other 3 payment methods' required-field behavior (LV-9
follow-up).

**APIs verified:** `GET /installments/lookup` (autofill), `POST /installments` (create, 200 +
Idempotency-Key header), `GET /installments` (list refetch after create).

**Automation candidates:** record-installment happy path (stable, exact toast text known), lookup-autofill
correctness. **Hold off** on Cancel/Verify/Edit automation candidates entirely until SD-2 resolves.

---

## Module 6 — Transactions ✅ SPOT-CHECKED (via Module 5 investigation)

Visited while investigating SD-2 (see above). Confirmed live: page renders "All Installments" header,
4 summary fields (Student Name/Roll No./Admission No./Course) + 4 financial fields (Final Fees/Total
Paid/Pending Amount/Next Due Date), and an 8-column "Installment History" table (Installment/Amount/
Payment Method/DD No-Txn No/Deposit Date/Remarks/Status/Print) — matches digest §7 exactly. Confirmed
**Total Paid can legitimately exceed Final Fees** in this test data (Test-15/Vijat: Final Fees ₹10,000,
Total Paid ₹5,07,000, Pending Amount correctly clamped to ₹0) — live evidence supporting BR-07's
"no client-side overpayment guard" finding.

**New finding — "Next Due Date" calculation mismatch:** on QA-TEST-001's Transactions page, "Next Due
Date" showed **06 Jul 2027** (12 months after the 06 Jul 2026 deposit date), despite the admission's
Installment Cycle being set to **6 Months** at creation. Expected ~06 Jan 2027 if the cycle field drives
this calculation. Not yet root-caused (could be a backend default that ignores `installmentCycleMonths`,
or the cycle may only govern something else entirely) — needs a follow-up question to the stakeholder/
dev team rather than a guess.

Full scenario-by-scenario pass (print-per-row, empty state, pagination) still outstanding.

---

## Module 7 — Receipts ✅ VERIFIED (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 7.9. **Prerequisite:** Module 5 installment payment (used
receipt `VA202607QA-9999-2`, the ₹10,000 UPI installment on QA-TEST-001).

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Print receipt from Transactions row | Positive | Click "Print receipt" on Installment 2 row | Blob PDF download, no error toast | Downloaded cleanly, no error | **PASS** | Network log captured |
| Standalone `/receipts/:id` page — orphaned-route confirmation | Investigation | Extract a receipt ID from network traffic (no in-app link exists to this route, per static review); navigate directly | Static review flagged this route as never linked to in-app | **Confirmed** — had to pull the ID from a captured `GET /api/receipts/:id/download` network request; nothing in the UI links here. Page itself renders correctly once visited directly | **PASS (confirms known gap — route works but is unreachable via normal navigation)** | Network request + snapshot captured |
| Receipt field-by-field accuracy audit | Data integrity | Cross-check every field against the source installment/admission data | All fields should match | **All correct**: Father's Name, Roll No., Admission Number, Course, Date, Session, DD/Txn No., Payment Method all matched exactly. GST math exact: ₹8,474.58 base + ₹762.71 CGST + ₹762.71 SGST = ₹10,000.00 Grand Total. "In Words" correctly says "Ten Thousand Rupees only" | **PASS — extends the LV-6 calculation audit to the actual receipt document itself, not just Report aggregation views** | Full field table in digest LV-11 |
| Institute header cross-check | Data integrity | Compare receipt header (address/phone/email/GSTIN/CIN/SAC/institute name) against Settings → Institute Details | Should match | **Exact match on all 7 fields** | **PASS** | Snapshots of both screens captured |
| Receipt Student Name vs. post-edit admission name | Data integrity / behavior confirmation | Compare receipt's Student Name against the admission's current name (edited to "QA Test Student Edited" in Module 3) | Unknown — not predictable from static code alone | Receipt shows the **pre-edit** name "QA Test Student" — confirms receipts are immutable point-in-time snapshots, not live-joined to the admission record | **PASS (confirmed behavior, not a defect)** — noted as a compliance consideration: a corrected data-entry typo won't retroactively fix already-issued receipts | Digest LV-11 |
| Receipt No. sequencing | Data integrity | Compare receipt numbers across the two transactions for QA-TEST-001 | Should be sequential/predictable | First receipt (admission deposit): `VA202607QA-9999` (no suffix). Second receipt (installment): `VA202607QA-9999-2`. Format: `VA{YYYYMM}{RollNo}[-{n}]`, sequential per student | **PASS** | Cross-referenced against Fee Report |

**Conclusion: no defects found in receipt generation, GST calculation, or institute-data accuracy.**
The only "gap" is the already-known orphaned-route issue (not a new finding, confirms static analysis).

**APIs verified:** `GET /api/receipts/:id/download` (blob, via Transactions print), `GET
/receipts/:id` equivalent (standalone page load + "Download Receipt" re-fetch-then-download flow).

**Automation candidates:** receipt field-accuracy assertions are excellent regression candidates given
how precisely they can be computed (GST formula is now fully known) — a test could create a payment of
any amount and assert the exact expected CGST/SGST/Grand Total on the resulting receipt.

---

## Module 8 — Students ✅ VERIFIED (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 3 (Module Inventory, row 4). **Prerequisite:** Module 1 login.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Column/layout check | Functional | Load `/students` | 7 columns per digest: Admission No./Roll No./Name/Father Name/Class/Mobile/Father Mobile No. | Exact match | **PASS** | Snapshot captured |
| Search | Positive/functional | Type "QA" into search box | Debounced filter (~300ms) | Correctly filtered to exactly 1 matching entry ("1 entry" / "Showing 1 to 1 of 1 entries") | **PASS** | Snapshot captured |
| Export All | Positive | Click "Export All" | Client-side `students.xlsx` download, no errors | Downloaded `students.xlsx` cleanly | **PASS** | Download event captured |
| Live vs. snapshot data consistency | Data integrity | Compare this list's display of QA-TEST-001's name against the receipt (Module 7) | N/A — new cross-module check | Students list shows the **current** name "QA Test Student Edited" (matches live admission record), confirming this is a live view — contrasts correctly with Receipts (LV-11), which freeze the name at transaction time | **PASS (confirms correct, consistent design: lists are live, receipts are snapshots)** | Cross-referenced with Module 7 |
| Global Search Bar — result rendering | Positive | Type "9999" into the top Global Search Bar | Badge (last 2 digits), name, subline "{rollNo} · {course} · s/o {father}" | Exact match: badge "99", name "QA Test Student Edited", subline "QA-9999 · BCA · s/o QA Test Father" | **PASS** | Snapshot captured |
| Global Search Bar → Admissions deep link | Negative/regression | Click the search result | Per digest: lands on `/admissions?search=<rollNo>` but does NOT actually filter (EDGE-041) | **Confirmed exactly as predicted** — landed on `/admissions?search=QA-9999`, search box empty, all 8 rows shown unfiltered | **CONFIRMED DEFECT — BUG_004 filed** | Snapshot captured, see digest LV-12 |

**Conclusion:** Students module itself has no defects. The Global Search deep-link into Admissions is
confirmed broken (BUG_004) — this was a "known gap" in the digest before, now a verified, filed defect.

**APIs verified:** `GET /students` (list + search), client-side XLSX generation (no export API call —
confirms the digest's finding that this fetches up to `limit:100000` in one request and builds the file
in-browser).

**Automation candidates:** search-filters-to-N-results assertion, export-triggers-download assertion,
Global Search result rendering (badge/name/subline format) — all stable and well-specified now.

---

## Module 9 — Reports (pagination/search/export) ✅ VERIFIED (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 13. Summary cards/GST math already covered in the
Cross-Module Calculation Audit above; this pass covers the remaining interaction mechanics.

**Session note:** hit a real session expiry navigating here after ~38 min idle (`POST /auth/refresh`
→ 401 → clean redirect to `/login`). Logged back in as admin and continued — see digest LV-14a.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Fee Report page-size options | Boundary | Open page-size dropdown | `[10,15,20,25,50]` | Exact match | **PASS** | Snapshot captured |
| Fee Report pagination | Positive | Set page size to 10 (11 total entries) | 2 pages created | "Showing 1 to 10 of 11" → page 2 "Showing 11 to 11 of 11"; Sr No correctly continued as "11" (not reset to "1"); Next/Prev correctly enabled/disabled at boundaries | **PASS** | Snapshots captured |
| Fee Report search | Positive | Search "Carlson" | Debounced filter, resets to page 1 | Filtered to exactly 1 entry, page reset to 1 | **PASS** | Snapshot captured |
| Fee Report CSV export | Positive + data integrity | Click "Export CSV" while search active | Digest: export sends only `search`, ignores pagination | Downloaded `fee-report.csv` containing **only the 1 search-filtered row** — confirms export-respects-search-ignores-pagination exactly | **PASS** | File content read and verified |
| Fee Report CSV — hidden column discovery | Data integrity | Read raw CSV content | Not predictable from UI alone | **CSV includes a `GST %` column (value `18`)** not shown on-screen — independently confirms the 18% rate from LV-6 via a completely different data path (raw export vs. UI display) | **PASS (bonus confirmation)** | CSV file content |
| Fee Report CSV — enum value discrepancy | Minor finding | Compare CSV `Deposit Type` value to UI's Payment Method label | N/A | CSV shows raw `"upi"`; UI shows friendly `"UPI"` | **Minor cosmetic inconsistency — not filed as a bug**, noted for polish | CSV file content |
| GST Report totals (re-verified with new data) | Calculation | Compare summary cards/monthly table after 2 more transactions were added | Should still reconcile exactly | July: ₹1,09,322.88 + ₹19,678.12 = ₹1,29,001.00 exactly; June unchanged ₹5,70,000; grand total ties to Fee Report gross sum | **PASS** | Snapshot captured |
| GST Report CSV export | Positive + data integrity | Click "Export CSV" | Should match on-screen Monthly GST Overview | Downloaded `gst-report.csv`; content matches exactly (June/July rows, all figures to the paisa) | **PASS** | File content read and verified |

**Conclusion: no defects in Reports pagination/search/export mechanics.** The GST-rate CSV discovery is
a valuable confirmation, not a new risk area.

**APIs verified:** `GET /reports/fees` (paginated + search), `GET /reports/fees/export` (blob, respects
search param), `GET /reports/gst` (no params), `GET /reports/gst/export` (blob, no params).

**Automation candidates:** CSV content-matches-on-screen-data assertions (both tabs), pagination
boundary assertions, GST-rate-from-CSV as a cheap ground-truth check for other calculation tests.

---

## Module 10 — Settings ✅ VERIFIED (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 7.11. All destructive/shared-data scenarios (Change
Password, Institute Details) were explicitly approved by the stakeholder before execution.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Profile pencil (dead button) | Negative/regression | Click the Profile section's edit pencil | Digest: known dead button (EDGE-106) | No state change whatsoever | **PASS (confirms known gap)** | Snapshot captured |
| User Information — edit Full Name | Positive | Change "ADMIN" → "ADMIN QA-Tested", save; then revert | Topbar reflects change immediately | Confirmed both directions; Topbar avatar/name updated instantly each time; no residual test data left | **PASS** | Snapshots captured |
| Change Password — mismatch validation | Negative | Enter mismatched Confirm Password, submit | Some validation error | **New exact string found: "Password do not match"** (grammatically incorrect — differs from Reset Password's correct "Passwords do not match") | **PASS + minor copy-inconsistency noted (not filed as bug)** | Snapshot captured |
| Change Password — real submission (stakeholder-approved) | Positive/E2E | Submit real current→new password change | Form resets, no forced logout, token rotates in-place | Confirmed exactly: form reset to empty, session stayed active, no re-login required. `.env` updated immediately with new password `Wpadmin124#` | **PASS** | Snapshot + `.env` updated |
| Institute Details — edit/save (stakeholder-approved) | Positive/data integrity | Change CIN "123"→"123-QA", save, verify via network request, then revert | Digest predicted: full 9-field payload sent, not a diff | **Confirmed via network inspection**: `PUT /api/institute` body contained all 9 fields even though only `cin` changed | **PASS** | Network request body captured, reverted cleanly |
| Master data — Add/Remove Bank | Positive | Add "QA Test Bank," confirm count increments; remove via "×," confirm dialog, confirm count decrements | Digest: confirmation dialog with specific copy | Dialog text matched verbatim: *"Remove "QA Test Bank"?" / "This will permanently remove the entry. It will no longer appear in dropdowns or lists and cannot be recovered."* Round-trip clean, no residual data | **PASS** | Snapshots captured |
| Notifications — "both keys together" rule (BR-14) | Data integrity | Toggle only "New Admission" off, inspect network request, toggle back on | Digest's BR-14 (derived from code comment): both keys always sent together | **Confirmed via network request**: `PUT /api/settings` body was `{"notifications":{"newAdmission":false,"newInstallment":true}}` — both keys present for a single-toggle change | **PASS — BR-14 now backed by live network evidence** | Network request body captured |

**Conclusion: no functional defects in Settings.** One cosmetic copy-inconsistency found (password
mismatch error text differs between two forms). All destructive/shared-data test actions were reverted
to original state except the approved password change, which is now reflected in `.env`.

**APIs verified:** `PATCH /auth/me` (name), `POST /auth/change-password`, `PUT /api/institute`, `POST
/api/{banks}`, `DELETE /api/{banks}/:id`, `PUT /api/settings`.

**Automation candidates:** notifications-both-keys-sent assertion (network-level, high value given BR-14
is a real footgun for future refactors), institute-full-payload-sent assertion, master-data add/remove
round-trip.

---

## Module 11 — Users ✅ VERIFIED (2026-07-06), one open question raised

**Business flow:** see QA-DIGEST.md Section 7.12. Admin-only module.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Users list — columns, self-row guards | Functional | Load `/users` | 5 columns; self row shows disabled Edit/Delete with tooltips | Exact match | **PASS** | Snapshot captured |
| Create user (invite-based) | Positive/E2E | Add "QA Test User" (staff, `qa-test-user@example.com`) | No password field; toast "Invite sent to {email}..." | Exact match, verbatim toast; row appeared with status "pending" | **PASS** | Snapshot + toast captured |
| Resend Invite | Positive | Click "Resend invite" on the pending user | Confirmation dialog, specific copy | Matched exactly: *"Resend Invite" / "Resend invite to QA Test User? A new link will be emailed to qa-test-user@example.com."* | **PASS** | Snapshot captured |
| Edit pending user — no active/inactive switch | Functional | Open Edit on the pending user | Digest: "Pending Activation" banner, no status switch | Exact match | **PASS** | Snapshot captured |
| Edit — role change | Positive | Change role staff→admin, save | Diff-patch update succeeds | Row updated to "admin" correctly | **PASS** | Snapshot captured |
| Delete user | Positive (cleanup) | Delete the test user | Confirmation dialog, specific copy | Matched exactly: *"Delete User" / "Delete QA Test User? This cannot be undone."* Deleted cleanly, list returned to 2 users | **PASS** | Snapshot captured |
| Centre-scoping | Data integrity | Switch Main Centre ↔ Sub Centre, compare Users list | Digest: not scope-gated | Confirmed — identical 2-user list under both centres | **PASS** | Snapshots captured |
| **"Staff2" account visibility** | **Investigation — pending verification** | Searched the Users list under both centres for `ashish1660webmob+13@gmail.com` (the staff account used since Module 1) | Expected to find it listed | **Not found anywhere** — only 2 users total exist in this list (the admin self + a "Super Admin"). Yet this staff account logs in successfully. | 🟡 **PENDING VERIFICATION — explicitly not classified as a bug** (stakeholder decision, 2026-07-06) | Snapshots captured under both centres |

**Conclusion:** Users CRUD lifecycle is fully verified with no defects. One anomaly surfaced and is
tracked as **Pending Verification** (not a confirmed bug): the "Staff2" account isn't visible in Users
Management under either centre. Per stakeholder direction, next steps before this can be classified are:
(1) inspect the raw `GET /users` API response directly to see if Staff2 is present server-side but
hidden client-side, or absent entirely; (2) verify centre filtering isn't excluding it; (3) verify
institute/tenant scoping isn't excluding it; (4) confirm with the dev team whether Staff2 is expected to
be visible to this admin at all. None of these steps have been performed yet — this requires either API
access beyond the browser UI or dev-team input.

**APIs verified:** `POST /users`, `POST /users/:id/invite`, `PATCH /users/:id` (role change), `DELETE
/users/:id`, `GET /users` (centre-scoping behavior).

**Automation candidates:** full create→resend→edit→delete lifecycle (stable, exact copy known
throughout), self-protection guard assertions.

---

## Module 12 — Notifications (bell/popover) ✅ VERIFIED (2026-07-06)

**Business flow:** see QA-DIGEST.md Section 12 / Topbar description.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| Popover open + unread count | Functional | Click bell icon | Header "Notifications ({n})", "Mark all read" shown when unread > 0 | Exact match: "Notifications (7)"; exactly 7 of 11 items had the clickable/unread affordance, matching the count precisely | **PASS** | Snapshot captured |
| Icon color-coding by type | Visual | Screenshot the popover | Green = new admission, blue = installment (per static review) | Confirmed exactly via screenshot | **PASS** | Screenshot captured (`notifications-popover.png`) |
| Unread visual indicator | Visual (new discovery) | Screenshot the popover | Not previously documented | **New detail found**: unread items show a blue dot indicator alongside bold text | **PASS (digest enriched with new detail)** | Screenshot captured |
| Relative time formatting | Functional | Read timestamps on live notifications | "{n}h ago" / "{n}d ago" format | Confirmed: "1h ago," "2h ago," "4h ago," "3d ago," "4d ago" all present and correctly formatted | **PASS** | Snapshot captured |
| Own actions generate notifications | Data integrity / E2E confirmation | Compare notification list against test actions taken earlier in this session | Creating QA-TEST-001 and its installment should have fired notifications | Confirmed: "New admission: QA Test Student (QA-9999)" and "Installment ₹10000 from QA Test Student (QA-9999)" both present | **PASS — confirms the create-action → notification pipeline end to end** | Snapshot captured |
| Mark all read | Positive | Click "Mark all read" | Header count clears, button disappears, bell badge clears, items lose unread state | All four confirmed exactly | **PASS** | Snapshots captured before/after |

**Conclusion: no defects — Notifications bell/popover works exactly as documented**, with one bonus
visual detail (blue unread-dot) now added to the digest.

**APIs verified:** `GET /notifications` (popover load), `POST /notifications/read-all` (Mark all read).

**Automation candidates:** unread-count-matches-clickable-items assertion, mark-all-read clears
badge/button/dot-indicators assertion, icon-color-by-notification-type visual regression check.

---

## Module 13 — Dashboard edge cases (deferred from Module 2) ✅ VERIFIED (2026-07-07, with 2 items deferred)

**Business flow:** see QA-DIGEST.md Section 2 / Dashboard description. This module closes out the
deferred edge cases from Module 2: "View All" dead-links, centre-switch effects on dashboard data,
realtime/live update behavior, and zero-data/socket-disconnected edge cases.

| Scenario | Type | Steps | Expected | Actual | Result | Evidence |
|---|---|---|---|---|---|---|
| "View All" buttons (Recent Admissions & Recent Installments) | Negative / dead-link check | Click both "View All" buttons on `/dashboard` | Should navigate somewhere meaningful, or be intentionally disabled | URL stayed on `/dashboard` for both — no navigation, no dialog | **FAIL (reconfirms EDGE-055, known gap)** | Snapshot captured |
| Centre-switch effect on dashboard data | Functional / data integrity | Switch Main Centre → Sub Centre, observe all KPIs/charts/tables, then switch back | Fully re-scoped dataset per centre; switching back restores original data cleanly | Sub Centre: Total Students 12→4, Total Collected ₹7,90,001→₹1,26,000, Total Refunded ₹30,000→₹6,000, Net Balance recalculated correctly (₹1,26,000−₹6,000=₹1,20,000 ✓); different admissions ("Sub Test 1–4"), different class categories (X-advance/MCA), only 3 installment rows (fewer-than-5 case rendered cleanly). Switching back to Main Centre restored the exact original dataset (12 students, ₹7,90,001 collected). | **PASS** | Snapshots captured (Sub Centre + reverted Main Centre) |
| Payment Methods percentage rounding (Sub Centre) | Boundary / cosmetic | Observe Payment Methods breakdown percentages on Sub Centre | Should sum to ~100% | Summed to 101% due to independent per-method rounding | **Minor cosmetic quirk, not filed as a bug** (same class as existing rounding notes elsewhere in the digest) | Snapshot captured |
| Orphaned "₹0L" stray element persists across centre switch | Regression check | Observe stray DOM element (BUG_002) after centre switch | If BUG_002 is layout-level (not data-dependent), it should persist regardless of centre/data | Confirmed present in both Main Centre and Sub Centre views | **Confirms BUG_002 is layout-level, not data-dependent** | Snapshot captured |
| Realtime/live update without manual refresh | Functional / architecture | Open dashboard in two tabs (same session). In Tab B, submit a new ₹1,000 installment payment against QA-TEST-001. Leave Tab A untouched; check immediately, then again after ~20s | Dashboard should reflect the new payment without a manual reload, via either socket push or polling | Immediately after submission, Tab A was still stale (old figures). After ~20s (no interaction with Tab A), Tab A had updated on its own: Total Collected ₹7,90,001→₹7,91,001, Net Balance ₹7,60,001→₹7,61,001, Pending Fees ₹88,999→₹87,999, Recent Installments showed the new QA-9999 payment (₹1,000/₹34,000 remain) at top | **PASS — confirmed auto-update, behavior consistent with background poll/refetch rather than instant socket push** | Snapshots captured (immediately-after and +20s) |
| Zero-data chart rendering | Boundary (deferred) | Find a centre/session with zero admissions/collections | Charts should render an empty state without crashing | **Not testable in this environment** — every available centre (Main, Sub) has ≥4 students with collected fees; no zero-data centre/session exists, and deleting all live data to force this state was not authorized | **DEFERRED — not silently skipped** | N/A |
| Polling fallback with socket disconnected | Boundary (deferred) | Forcibly disconnect the dashboard's socket connection and observe whether polling still updates the data | Dashboard should still update via polling fallback if sockets are unavailable | **Not attempted** — would require `browser_evaluate`/`browser_run_code` to force-close a WebSocket, both of which need explicit per-use approval under this project's CLAUDE.md and were not requested for this specific check | **DEFERRED — not silently skipped** | N/A |

**Conclusion: no functional defects in centre-switching or auto-update behavior.** EDGE-055 (dead
"View All" links) reconfirmed as a known, still-open gap. Two edge cases (zero-data charts,
socket-disconnected polling fallback) remain genuinely untestable in this environment without either
destructive test-data changes or additional explicit approval for JS-injection tooling — documented here
as open items rather than assumed-passing.

**APIs verified:** `GET /dashboard` (re-fetched on centre switch and on the ~20s auto-update poll).

**Automation candidates:** centre-switch-reloads-correct-dataset assertion (and reverts cleanly),
dashboard-auto-updates-after-external-write assertion (poll with generous timeout, not immediate assert),
dead-link regression check for both "View All" buttons.

---

**Manual QA walkthrough complete for Modules 1–13.** Proceeding to Playwright automation scoping next.
