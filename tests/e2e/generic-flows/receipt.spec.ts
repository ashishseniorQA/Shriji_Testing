import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { ReceiptPage } from '@utils/page-objects/receipt.page';
import { buildValidAdmission } from '@test-data/fixtures/admissions';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * `/receipts/:id` — confirmed via source read 2026-07-08 to be a standalone route
 * (no MainLayout/topbar) that is NEVER linked to from anywhere in the app. The only
 * way to reach it is a captured `receiptId` (see `createAdmissionAndGetReceiptId`
 * below, which reads it directly off the `POST /admissions` creation response).
 *
 * This closes the loop flagged in gst-calculation.spec.ts's header comment (phase 1):
 * full on-screen GST verification was deferred until a Receipt page object existed.
 * It now does — `toHaveCorrectGstSplit` is exercised here for the first time.
 */
test.describe('Receipt @generic', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('receipt.spec.ts'));

  /**
   * `receiptId` is read directly off the `POST /admissions` creation response
   * (confirmed live 2026-07-08: the response body is `{ admission: { ..., receiptId } }`)
   * rather than re-fetched via a follow-up search. The Admissions search field only
   * matches name/roll-no (confirmed live: searching by `admissionNo` returns `total: 0`
   * — the placeholder "Search by name or roll no..." is accurate, not just UI copy) and
   * roll no is server-generated and unknown until after creation, so a follow-up search
   * can't reliably target this specific record anyway. Reading it straight off the
   * creation response sidesteps both problems entirely.
   */
  async function createAdmissionAndGetReceiptId(page: Page, fees: number) {
    const admissionsPage = new AdmissionsPage(page);
    const addAdmission = new AddAdmissionPage(page);
    const data = buildValidAdmission({ fees, finalFees: fees });

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    const response = await addAdmission.submitAndWaitForCreate();
    await addAdmission.expectCreatedToast();

    const body = await response.json();
    const receiptId = body.admission?.receiptId as string | undefined;
    if (!receiptId) {
      throw new Error(`POST /admissions response had no receiptId: ${JSON.stringify(body)}`);
    }
    return { data, receiptId };
  }

  test('loads with the correct GST breakdown for the admission it was generated from', async ({ adminPage }) => {
    const fees = 10_000;
    const { receiptId } = await createAdmissionAndGetReceiptId(adminPage, fees);

    const receipt = new ReceiptPage(adminPage);
    await receipt.goto(receiptId);
    await receipt.expectLoaded();

    const figures = await receipt.getGstFigures();
    expect(figures).toHaveCorrectGstSplit(fees);
  });

  test('shows a non-empty "amount in words" line', async ({ adminPage }) => {
    const { receiptId } = await createAdmissionAndGetReceiptId(adminPage, 15_000);

    const receipt = new ReceiptPage(adminPage);
    await receipt.goto(receiptId);
    await receipt.expectLoaded();

    await expect(receipt.amountInWords).not.toHaveText('');
  });

  test('"Download Receipt" triggers a PDF download', async ({ adminPage }) => {
    const { receiptId } = await createAdmissionAndGetReceiptId(adminPage, 5_000);

    const receipt = new ReceiptPage(adminPage);
    await receipt.goto(receiptId);
    await receipt.expectLoaded();

    const [download] = await Promise.all([adminPage.waitForEvent('download'), receipt.downloadButton.click()]);
    expect(download.suggestedFilename()).toMatch(/\.pdf$/i);
  });

  test('is a standalone page with no app nav/topbar', async ({ adminPage }) => {
    const { receiptId } = await createAdmissionAndGetReceiptId(adminPage, 2_000);

    const receipt = new ReceiptPage(adminPage);
    await receipt.goto(receiptId);
    await receipt.expectLoaded();

    await expect(adminPage.getByText('Dashboard', { exact: true })).toHaveCount(0);
    await expect(adminPage.getByText('Installments', { exact: true })).toHaveCount(0);
  });

  /**
   * EDGE-082 reversal (confirmed live 2026-07-08): the source-read prediction was an
   * infinite loading spinner from `ReceiptPage.tsx`'s fetch `useEffect`. Live behavior
   * is actually a clean 404 — the router never matches `/receipts` or `/receipts/`
   * (empty `:id`) to the receipt route at all, so the component's fetch logic never runs.
   */
  test('EDGE-082: navigating with no id shows the app 404 page, not the receipt route', async ({ adminPage }) => {
    const receipt = new ReceiptPage(adminPage);
    await adminPage.goto('/receipts/');
    await receipt.expectNotFoundForMissingId();
  });
});
