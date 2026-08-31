import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { InstallmentsPage } from '@utils/page-objects/installments.page';
import { AddInstallmentPage } from '@utils/page-objects/add-installment.page';
import { buildValidAdmission, todayISODate } from '@test-data/fixtures/admissions';
import { PAYMENT_METHOD_LABELS } from '@test-data/fixtures/installments';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * @critical — release gate. Covers `AddInstallmentPage.tsx` (`/installments/new`) — the
 * actual payment-recording form, as distinct from installment-management.spec.ts's
 * list/navigation coverage. Grounded in the source's inline Zod schema (no
 * `.refine()` at all — confirmed no cross-field validation exists here, unlike
 * Admissions) and BR-06/BR-07/BR-08.
 */
test.describe('Payment collection @critical', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('payment-collection.spec.ts'));

  async function createAdmission(page: Page, finalFees = 50_000) {
    const admissionsPage = new AdmissionsPage(page);
    const addAdmission = new AddAdmissionPage(page);
    const data = buildValidAdmission({ finalFees, fees: 5_000 });

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    return data;
  }

  test('BR-06: Admission Number lookup autofills every dependent field as read-only', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const addInstallment = new AddInstallmentPage(adminPage);

    await addInstallment.goto();
    await addInstallment.enterAdmissionNo(data.admissionNo);
    await addInstallment.waitForAutofill();

    await expect(addInstallment.rollNoInput).toHaveValue(data.rollNo);
    await expect(addInstallment.nameInput).toHaveValue(data.name);
    await expect(addInstallment.finalFeeInput).toHaveValue(String(data.finalFees));
    // Initial deposit at admission time was 5,000 of a 50,000 final fee.
    await expect(addInstallment.remainFeeInput).toHaveValue(String(data.finalFees - 5_000));
    await addInstallment.expectAutofilledReadOnly();
  });

  test('an unknown admission number shows the lookup-not-found helper text', async ({ adminPage }) => {
    const addInstallment = new AddInstallmentPage(adminPage);
    await addInstallment.goto();
    await addInstallment.enterAdmissionNo('PW-DOES-NOT-EXIST-999');

    await addInstallment.expectLookupNotFound();
    await expect(addInstallment.finalFeeInput).toHaveValue('');
  });

  test.describe('validation', () => {
    test('submitting without a payment method shows "Select a payment method"', async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const addInstallment = new AddInstallmentPage(adminPage);

      await addInstallment.goto();
      await addInstallment.enterAdmissionNo(data.admissionNo);
      await addInstallment.waitForAutofill();
      await addInstallment.fillDepositDate(todayISODate());
      await addInstallment.feesInput.fill('1000');
      await addInstallment.submit();

      await addInstallment.expectFieldError('Select a payment method');
    });

    test('submitting without a deposit date shows "Deposit date is required"', async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const addInstallment = new AddInstallmentPage(adminPage);

      await addInstallment.goto();
      await addInstallment.enterAdmissionNo(data.admissionNo);
      await addInstallment.waitForAutofill();
      await addInstallment.selectPaymentMethod('cash');
      await addInstallment.feesInput.fill('1000');
      await addInstallment.submit();

      await addInstallment.expectFieldError('Deposit date is required');
    });

    test('submitting without a fees amount shows "Fees is required"', async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const addInstallment = new AddInstallmentPage(adminPage);

      await addInstallment.goto();
      await addInstallment.enterAdmissionNo(data.admissionNo);
      await addInstallment.waitForAutofill();
      await addInstallment.selectPaymentMethod('cash');
      await addInstallment.fillDepositDate(todayISODate());
      await addInstallment.submit();

      await addInstallment.expectFieldError('Fees is required');
    });
  });

  /**
   * BR-07 CORRECTED 2026-07-08 (live-tested; supersedes the digest's static-analysis
   * claim of "no client-side over-payment guard"): recording Fees greater than the
   * Remaining Fee IS blocked, with a reactive (no-submit-needed) error "Fees cannot
   * exceed the remaining fee" and a disabled Submit button — the same pattern as
   * Admissions' fees≤finalFees refine (admission-management.spec.ts BR-02). The Zod
   * schema itself has no `.refine()` for this (confirmed via source read), so this
   * guard is enforced by some other runtime mechanism the static read didn't catch —
   * same class of gap as LV-9's DD-No-required discovery above.
   */
  test('BR-07: recording more than the remaining balance is blocked (client-side over-payment guard confirmed)', async ({
    adminPage,
  }) => {
    const data = await createAdmission(adminPage, 10_000); // remaining = 5,000 after the 5,000 initial deposit
    const addInstallment = new AddInstallmentPage(adminPage);

    await addInstallment.goto();
    await addInstallment.fill({
      admissionNo: data.admissionNo,
      paymentMethod: 'cash',
      depositDate: todayISODate(),
      fees: 50_000, // far beyond the 5,000 remaining balance
    });

    await addInstallment.expectFieldError('Fees cannot exceed the remaining fee');
    await expect(addInstallment.submitButton).toBeDisabled();
  });

  test('BR-08: "Cash" is accepted without Bank Name or DD/Transaction No', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const addInstallment = new AddInstallmentPage(adminPage);

    await addInstallment.goto();
    await addInstallment.fill({
      admissionNo: data.admissionNo,
      paymentMethod: 'cash',
      depositDate: todayISODate(),
      fees: 1_000,
    });
    await addInstallment.submit();

    await addInstallment.expectRecordedToast();
  });

  /**
   * LV-9 (originally "not yet confirmed" — now fully confirmed and CORRECTED
   * 2026-07-08): selecting UPI, Cheque/DD, or Bank Transfer makes "DD No /
   * Transaction No" genuinely required, not just visually — leaving it empty shows
   * "Required for this payment method" and blocks the toast/submission entirely.
   * This does NOT show up in the Zod schema (`ddOrTxnNo` is `.optional()` there,
   * confirmed via source read) — the conditional requirement is enforced by some
   * other runtime mechanism (e.g. a `useEffect`/`setError` watching `paymentMethod`),
   * which is why a schema-only static read missed it. Bank Name stays optional
   * regardless of method — only DD No/Transaction No is conditionally required.
   */
  for (const method of (['upi', 'cheque_dd', 'bank_transfer'] as const)) {
    test(`BR-08/LV-9: "${PAYMENT_METHOD_LABELS[method]}" requires DD No / Transaction No`, async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const addInstallment = new AddInstallmentPage(adminPage);

      await addInstallment.goto();
      await addInstallment.fill({
        admissionNo: data.admissionNo,
        paymentMethod: method,
        depositDate: todayISODate(),
        fees: 1_000,
      });
      await addInstallment.submit();

      await addInstallment.expectFieldError('Required for this payment method');

      await addInstallment.ddOrTxnNoInput.fill(`TXN-${Date.now()}`);
      await addInstallment.submit();
      await addInstallment.expectRecordedToast();
    });
  }

  test('Idempotency-Key header is present on the create-installment request', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const addInstallment = new AddInstallmentPage(adminPage);

    await addInstallment.goto();
    await addInstallment.fill({
      admissionNo: data.admissionNo,
      paymentMethod: 'cash',
      depositDate: todayISODate(),
      fees: 1_000,
    });
    const response = await addInstallment.submitAndWaitForCreate();

    expect(response.request().headers()['idempotency-key']).toBeTruthy();
  });

  test('a successful payment updates the Remaining Fees shown on the Installments list', async ({ adminPage }) => {
    const data = await createAdmission(adminPage, 20_000); // remaining = 15,000 after the 5,000 initial deposit
    const addInstallment = new AddInstallmentPage(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);

    await addInstallment.goto();
    await addInstallment.fill({
      admissionNo: data.admissionNo,
      paymentMethod: 'upi',
      depositDate: todayISODate(),
      fees: 5_000,
    });
    await addInstallment.submit();
    await addInstallment.expectRecordedToast();

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.expectRemainingFees(data.rollNo, '₹10,000');
  });
});
