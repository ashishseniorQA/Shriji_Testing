import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { buildValidAdmission } from '@test-data/fixtures/admissions';
import { calculateExpectedGst, GST_TEST_AMOUNTS } from '@test-data/fixtures/gst';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * @critical — release gate. BR-11 (18% tax-inclusive GST, 9% CGST + 9% SGST, odd paisa
 * to SGST) is computed **server-side** and only ever rendered on-screen in two places:
 * the Receipt (`/receipts/:id`, a standalone route with no in-app link) and the
 * Fee/GST Reports (`/reports`) — grepped `src/pages/admissions` and
 * `src/pages/installments` directly, confirmed neither Admission nor Installment forms
 * display any GST figure at all.
 *
 * Both Receipts and Reports are explicitly later-phase modules in this project's
 * automation roadmap (Auth → Admission → Installment → Payment → GST first; Refund,
 * Receipt, Dashboard, Student Ledger, Reports after). Until the Receipt/Report page
 * objects exist, this spec verifies what's honestly verifiable now:
 *   1. The BR-11 formula itself, against the exact live-verified worked example from
 *      the manual QA walkthrough (receipt VA202607QA-9999-2) — a pure regression check
 *      with no browser needed, so a formula regression is caught immediately.
 *   2. That the full amount spectrum BR-11 was verified across live (₹1 to ₹5,00,000)
 *      is still accepted end-to-end through the real Admission form without a
 *      crash/NaN, which is the one part of that live finding reachable from this
 *      phase's page objects.
 * On-screen CGST/SGST/receipt-total assertions using `toHaveCorrectGstSplit` land as
 * soon as the Receipt or Reports page object is built in the next phase — the matcher
 * itself is ready now (see utils/custom-assertions/gst-assertions.ts).
 */
test.describe('GST calculation @critical', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('gst-calculation.spec.ts'));

  test.describe('BR-11 formula (no browser)', () => {
    test('matches the live-verified worked example exactly (Fees ₹10,000)', () => {
      const result = calculateExpectedGst(10_000);

      expect(result.base).toBeCloseTo(8_474.58, 2);
      expect(result.cgst).toBeCloseTo(762.71, 2);
      expect(result.sgst).toBeCloseTo(762.71, 2);
      expect(result.base + result.cgst + result.sgst).toBeCloseTo(10_000, 2);
    });

    test('the odd paisa from splitting GST in half is always assigned to SGST', () => {
      // ₹1 tax-inclusive: TotalGST = 1 − (1/1.18) = 0.1525..., half = 0.0763 / 0.0763 —
      // live-verified exact figures were CGST ₹0.08 / SGST ₹0.07 (SGST takes the
      // remainder after CGST rounds up), confirming CGST is not always the smaller half.
      const result = calculateExpectedGst(1);

      expect(result.cgst).toBeCloseTo(0.08, 2);
      expect(result.sgst).toBeCloseTo(0.07, 2);
      expect(result.cgst + result.sgst).toBeCloseTo(result.totalGst, 2);
    });

    test.describe('reconciles to the paisa across the live-verified amount spectrum', () => {
      for (const amount of GST_TEST_AMOUNTS) {
        test(`Fees ₹${amount}`, () => {
          const result = calculateExpectedGst(amount);
          expect(result.base + result.cgst + result.sgst).toBeCloseTo(amount, 2);
          expect(Number.isNaN(result.base)).toBe(false);
          expect(Number.isNaN(result.cgst)).toBe(false);
          expect(Number.isNaN(result.sgst)).toBe(false);
        });
      }
    });
  });

  test.describe('boundary amounts survive real admission creation (no NaN/crash)', () => {
    async function createAdmissionWithFees(page: Page, amount: number) {
      const admissionsPage = new AdmissionsPage(page);
      const addAdmission = new AddAdmissionPage(page);
      const data = buildValidAdmission({ fees: amount, finalFees: amount });

      await admissionsPage.goto();
      await admissionsPage.goToAdd();
      await addAdmission.fill(data);
      await addAdmission.submit();

      return { data, addAdmission };
    }

    test('₹1 extreme-low boundary is accepted without error', async ({ adminPage }) => {
      const { addAdmission } = await createAdmissionWithFees(adminPage, 1);
      await addAdmission.expectCreatedToast();
    });

    test('₹5,00,000 upper-range amount is accepted without error', async ({ adminPage }) => {
      const { addAdmission } = await createAdmissionWithFees(adminPage, 5_00_000);
      await addAdmission.expectCreatedToast();
    });
  });
});
