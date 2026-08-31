import { test, expect } from '@utils/fixtures';
import { ReportsPage } from '@utils/page-objects/reports.page';
import { parseCurrency } from '@utils/helpers/currency';

/**
 * `/reports` — admin-only (`RoleRoute requiredRole="admin"`, confirmed via source
 * read). Two tabs: Fee Report (default) and GST Report. Page sizes ([10,15,20,25,50]),
 * CSV export params (`search`-only for Fee Report, no params for GST Report), and
 * column sets confirmed via direct source read 2026-07-08 — no surprises versus the
 * QA digest's own already-live-verified findings (LV-14).
 */
test.describe('Reports @generic', () => {
  test('staff cannot reach /reports (BR-16 role gate)', async ({ staffPage }) => {
    await staffPage.goto('/reports');
    await expect(staffPage).toHaveURL(/\/dashboard/);
  });

  test('admin sees the Fee Report tab by default with the correct columns', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.expectFeeReportLoaded();

    for (const col of [
      'Sr No',
      'Roll',
      'Name',
      'Father Name',
      'Class',
      'Fees (₹)',
      'Payment Method',
      'CGST',
      'SGST',
      'Receipt No',
      'DD No',
      'DD-Dated',
      'F Year',
    ]) {
      await expect(adminPage.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }
  });

  test('Fee Report search filters the table', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.search('zzz-no-such-student-zzz');

    await expect(reports.feeReportEmptyState()).toBeVisible();
  });

  test('Fee Report "Export CSV" downloads a .csv file', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();

    const download = await reports.exportCsv();
    expect(download.suggestedFilename()).toBe('fee-report.csv');
  });

  test('GST Report tab shows the 4 summary cards with numeric values', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.selectTab('GST Report');
    await reports.expectGstReportLoaded();

    for (const label of ['Total GST Collected', 'CGST', 'SGST', 'Taxable Fee Value'] as const) {
      const value = parseCurrency(await reports.gstSummaryValue(label).innerText());
      expect(Number.isNaN(value)).toBe(false);
    }
  });

  test('GST Report monthly table columns and CGST+SGST≈Total GST reconciliation', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.selectTab('GST Report');
    await reports.expectGstReportLoaded();

    for (const col of ['Month', 'Taxable Amount', 'CGST', 'SGST', 'Total GST', 'Total Fee Collected']) {
      await expect(adminPage.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
    }

    const totalGst = parseCurrency(await reports.gstSummaryValue('Total GST Collected').innerText());
    const cgst = parseCurrency(await reports.gstSummaryValue('CGST').innerText());
    const sgst = parseCurrency(await reports.gstSummaryValue('SGST').innerText());
    expect(cgst + sgst).toBeCloseTo(totalGst, 1);
  });

  test('GST Report "Export CSV" downloads a .csv file', async ({ adminPage }) => {
    const reports = new ReportsPage(adminPage);
    await reports.goto();
    await reports.selectTab('GST Report');

    const download = await reports.exportCsv();
    expect(download.suggestedFilename()).toBe('gst-report.csv');
  });
});
