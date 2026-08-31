import { test, expect } from '@utils/fixtures';
import { DashboardPage } from '@utils/page-objects/dashboard.page';
import { parseCurrency } from '@utils/helpers/currency';

/**
 * `/dashboard`. Grounded in a direct FE source read 2026-07-08 (`AdminDashboard.tsx`,
 * `StaffDashboard.tsx`, `useDashboard.ts`) plus the manual QA walkthrough's Module
 * 2/13 live findings (LV-3, LV-25 through LV-28). Two confirmed source-vs-live
 * mismatches this spec deliberately tests against the LIVE reality, not the source:
 *   - Source builds exactly 4 admin KPI cards; live renders 5 (adds Total Refunded,
 *     Net Balance) — LV-3/LV-26, unresolved, not yet re-confirmed against the actual
 *     deployed bundle. This spec asserts the live 5-card set.
 *   - "This Month"/"Today" filter buttons have NO onClick handler in source (EDGE-054)
 *     — confirmed dead, not merely no-op.
 *   - "View All" buttons (EDGE-055) were ALSO source-confirmed dead, and reconfirmed
 *     dead live as recently as LV-25 (2026-07-07) — but as of LV-37 (2026-07-08) they
 *     are real, working navigation to `/admissions`/`/installments`. The live app was
 *     fixed a day after both the source read and the prior live check. This spec
 *     asserts the current live (functional) reality, not the historical dead-link one.
 */
test.describe('Dashboard @generic', () => {
  test('admin sees all 5 live KPI cards and Net Balance reconciles', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectLoaded();

    for (const label of ['Total Students', 'Total Collected', 'Total Refunded', 'Net Balance', 'Pending Fees']) {
      await expect(dashboard.kpiValue(label)).toBeVisible();
    }

    const collected = parseCurrency(await dashboard.kpiValue('Total Collected').innerText());
    const refunded = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());
    const netBalance = parseCurrency(await dashboard.kpiValue('Net Balance').innerText());

    expect(netBalance).toBeCloseTo(collected - refunded, 2);
  });

  test('staff sees exactly 3 KPI cards and no charts', async ({ staffPage }) => {
    const dashboard = new DashboardPage(staffPage);
    await dashboard.goto();
    await dashboard.expectLoaded();

    await expect(dashboard.kpiValue('My Students')).toBeVisible();
    await expect(dashboard.kpiValue('Pending Fees')).toBeVisible();
    await expect(dashboard.kpiValue("Today's Collection")).toBeVisible();
    await expect(staffPage.getByText('Class-wise Collection')).toHaveCount(0);
    await expect(staffPage.getByText('Payment Methods', { exact: true })).toHaveCount(0);
  });

  test('EDGE-055: both "View All" buttons navigate to their full list pages', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectNavigatesTo(dashboard.viewAllButtonFor('Recent Admissions'), '/admissions');

    await dashboard.goto();
    await dashboard.expectNavigatesTo(dashboard.viewAllButtonFor('Recent Installments'), '/installments');
  });

  test('EDGE-054: "This Month" filter button is a dead link', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectDeadLink(dashboard.monthFilterButton);
  });

  test('Recent Admissions and Recent Installments tables render with correct columns', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();

    const admissionsTable = dashboard.tableFor('Recent Admissions');
    for (const col of ['Adm No', 'Roll No.', 'Name', 'Class', 'Fees', 'Status']) {
      await expect(admissionsTable.getByRole('columnheader', { name: col })).toBeVisible();
    }

    const installmentsTable = dashboard.tableFor('Recent Installments');
    for (const col of ['Roll No.', 'Name', 'Class', 'Paid', 'Remain', 'Status']) {
      await expect(installmentsTable.getByRole('columnheader', { name: col })).toBeVisible();
    }
  });

  test('BR-18: switching centre reloads a fully different, correctly-scoped dataset', async ({ adminPage }) => {
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();

    const mainStudents = await dashboard.kpiValue('Total Students').innerText();

    await dashboard.switchCentre('Sub Centre');
    await expect(dashboard.kpiValue('Total Students')).not.toHaveText(mainStudents);
    const subCollected = parseCurrency(await dashboard.kpiValue('Total Collected').innerText());
    const subRefunded = parseCurrency(await dashboard.kpiValue('Total Refunded').innerText());
    const subNetBalance = parseCurrency(await dashboard.kpiValue('Net Balance').innerText());
    expect(subNetBalance).toBeCloseTo(subCollected - subRefunded, 2);

    // Restore original state for any tests that run after this one.
    await dashboard.switchCentre('Main Centre');
    await expect(dashboard.kpiValue('Total Students')).toHaveText(mainStudents);
  });
});
