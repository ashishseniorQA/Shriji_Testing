import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { DashboardPage } from '@utils/page-objects/dashboard.page';
import { buildValidAdmission } from '@test-data/fixtures/admissions';
import { parseCurrency } from '@utils/helpers/currency';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * Refund has no dedicated module or route — it's only reachable via the "Initiate
 * Refund" toggle on the Admissions Cancel dialog (see admissions.page.ts / QA-DIGEST
 * LV-36). Live-confirmed 2026-07-08 via direct network capture that this is a real,
 * working feature (not the dead/cosmetic UI a static source read would suggest) — the
 * E2E test below is the strongest possible proof: it reads the Dashboard's "Total
 * Refunded" KPI before and after, and asserts the exact delta.
 */
test.describe('Refund @generic', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('refund.spec.ts'));

  async function createAdmission(page: Page) {
    const admissionsPage = new AdmissionsPage(page);
    const addAdmission = new AddAdmissionPage(page);
    const data = buildValidAdmission({ fees: 7_000, finalFees: 50_000 });

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    return data;
  }

  test('toggle defaults off; enabling it reveals Refund Amount and the correct Max refundable hint', async ({
    adminPage,
  }) => {
    const data = await createAdmission(adminPage);
    const admissionsPage = new AdmissionsPage(adminPage);

    await admissionsPage.goto();
    await admissionsPage.search(data.rollNo);
    await admissionsPage.cancelButtonFor(data.rollNo).click();

    await expect(admissionsPage.refundAmountInput).toHaveCount(0);

    await admissionsPage.initiateRefundToggle.click();
    await expect(admissionsPage.refundAmountInput).toBeVisible();
    await expect(admissionsPage.maxRefundableHint).toHaveText(`Max refundable: ₹${data.fees.toLocaleString('en-IN')}`);

    await admissionsPage.confirmDialogDismissButton.click();
  });

  test('cancelling with a refund increments the Dashboard "Total Refunded" KPI by the exact amount', async ({
    adminPage,
  }) => {
    const refundAmount = 3_000;
    const data = await createAdmission(adminPage);

    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    const refundedBefore = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());
    const netBalanceBefore = parseCurrency(await dashboard.kpiValue('Net Balance').innerText());

    const admissionsPage = new AdmissionsPage(adminPage);
    await admissionsPage.goto();
    await admissionsPage.search(data.rollNo);
    await admissionsPage.cancelAdmissionWithRefund(data.rollNo, refundAmount);
    await admissionsPage.expectCancelledToast();

    await dashboard.goto();
    const refundedAfter = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());
    const netBalanceAfter = parseCurrency(await dashboard.kpiValue('Net Balance').innerText());

    expect(refundedAfter - refundedBefore).toBeCloseTo(refundAmount, 2);
    expect(netBalanceBefore - netBalanceAfter).toBeCloseTo(refundAmount, 2);
  });

  test('cancelling WITHOUT enabling refund leaves "Total Refunded" unchanged', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);

    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    const refundedBefore = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());

    const admissionsPage = new AdmissionsPage(adminPage);
    await admissionsPage.goto();
    await admissionsPage.search(data.rollNo);
    await admissionsPage.cancelAdmission(data.rollNo);
    await admissionsPage.expectCancelledToast();

    await dashboard.goto();
    const refundedAfter = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());
    expect(refundedAfter).toBeCloseTo(refundedBefore, 2);
  });
});
