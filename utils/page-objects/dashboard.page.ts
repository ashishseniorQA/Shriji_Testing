import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * `/dashboard` — `src/pages/dashboard/DashboardPage.tsx` branches on role: admin gets
 * `AdminDashboard.tsx` (KPI cards + 2 charts + 2 "Recent" tables), staff gets
 * `StaffDashboard.tsx` (3 KPI cards + 1 table, no charts).
 *
 * KPI cards — source-vs-live mismatch (LV-3, confirmed again 2026-07-08 via direct
 * source read: `DashboardAdminCards` type has exactly 4 fields — no `totalRefunded`/
 * `netBalance`). The live `testing` deployment renders 5 cards. This page object
 * targets the LIVE 5-card reality (what a real test run will actually see), not the
 * 4-card source type — do not "fix" this back down to 4 without re-confirming live.
 *
 * Every scoped lookup here uses the `following::`-from-heading-text idiom (matching
 * `kpiValue`/`BasePage.fieldFollowingLabel`) rather than a div-container `.filter()`.
 * Confirmed live 2026-07-08: a `.locator('div').filter({has: ...}).last()` approach
 * for "the card containing this heading" resolved to an ambiguous/wrong container
 * (`Class`/`Status`/`Name` column headers are shared by both "Recent" tables) and, in
 * one case, caused a `.click()` to hang for the full 30s timeout rather than fail
 * cleanly. `following::` from a uniquely-matched heading text is more precise, since
 * it always resolves relative to a real, specific DOM node's document position.
 */
export class DashboardPage extends BasePage {
  readonly monthFilterButton: Locator;

  constructor(page: Page) {
    super(page);
    this.monthFilterButton = page.getByRole('button', { name: /this month/i });
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectLoaded() {
    await expect(this.page).toHaveURL(/\/dashboard/);
    await expect(this.page.getByText('Overview', { exact: true })).toBeVisible();
  }

  /**
   * The Overview KPI grid is the sibling immediately following the "Overview" heading.
   * Scoping to it matters: "Total Collected" also appears as a footer label inside the
   * Payment Methods card (confirmed live 2026-07-08 — an unscoped page-wide search
   * matches both and throws a strict-mode violation).
   */
  private kpiGrid(): Locator {
    return this.page.getByText('Overview', { exact: true }).locator('xpath=following-sibling::*[1]');
  }

  /** KPI card value paragraph is the next `<p>` in document order after its label, within the KPI grid only. */
  kpiValue(label: string): Locator {
    return this.kpiGrid().getByText(label, { exact: true }).locator('xpath=following::p[1]');
  }

  async expectKpi(label: string, value: string) {
    await expect(this.kpiValue(label)).toHaveText(value);
  }

  viewAllButtonFor(heading: 'Recent Admissions' | 'Recent Installments'): Locator {
    return this.page
      .getByText(heading, { exact: true })
      .locator('xpath=following::button[normalize-space()="View All"][1]');
  }

  tableFor(heading: 'Recent Admissions' | 'Recent Installments'): Locator {
    return this.page.getByText(heading, { exact: true }).locator('xpath=following::table[1]');
  }

  chartTodayButtonFor(heading: 'Class-wise Collection' | 'Payment Methods'): Locator {
    return this.page
      .getByText(heading, { exact: true })
      .locator('xpath=following::button[contains(normalize-space(), "Today")][1]');
  }

  /**
   * EDGE-055 reversal (LV-37, confirmed live 2026-07-08): both "View All" buttons were
   * a source-and-live-confirmed dead link as of LV-25 (2026-07-07) but now navigate for
   * real — do not revert this to a dead-link check without re-confirming live first.
   */
  async expectNavigatesTo(button: Locator, path: string) {
    await button.click();
    await expect(this.page).toHaveURL(new RegExp(path.replace(/\//g, '\\/') + '$'));
  }

  /** `AdminDashboard.tsx`: "No data yet" when `classChartData.length === 0`. */
  async expectClassWiseChartEmpty() {
    await expect(
      this.page.getByText('Class-wise Collection', { exact: true }).locator('xpath=following::p[.="No data yet"][1]'),
    ).toBeVisible();
  }

  /** `AdminDashboard.tsx`: "No data yet" when `pmethods.length === 0`. */
  async expectPaymentMethodsEmpty() {
    await expect(
      this.page.getByText('Payment Methods', { exact: true }).locator('xpath=following::p[.="No data yet"][1]'),
    ).toBeVisible();
  }

  paymentMethodPercent(mode: 'Cash' | 'Online / UPI' | 'Cheque / DD' | 'Bank Transfer'): Locator {
    return this.page.getByText(mode, { exact: true }).locator('xpath=following::p[1]');
  }

  /**
   * EDGE-054/EDGE-055 — confirmed via direct source read 2026-07-08: `TableCardHeader`'s
   * "View All" and every `FilterButton` ("This Month"/"Today") render with NO `onClick`
   * prop at all, anywhere they're used. Not merely no-ops at runtime — the handlers
   * were never wired in source. Clicking must be a pure no-op: same URL, no dialog.
   */
  async expectDeadLink(button: Locator) {
    const before = this.page.url();
    await button.click();
    await expect(this.page).toHaveURL(before);
  }

  centreSwitcher(): Locator {
    return this.exactText('Main Centre').or(this.exactText('Sub Centre'));
  }

  async switchCentre(centreName: 'Main Centre' | 'Sub Centre') {
    await this.centreSwitcher().click();
    await this.page.getByRole('menuitem', { name: centreName, exact: true }).click();
  }
}
