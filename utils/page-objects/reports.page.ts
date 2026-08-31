import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type ReportTab = 'Fee Report' | 'GST Report';

/**
 * `/reports` — `src/pages/reports/ReportsPage.tsx`, admin-only (`RoleRoute
 * requiredRole="admin"`, confirmed via source read). Two tabs: Fee Report (default)
 * and GST Report. Both "Export CSV" actions download client-side via a blob — no
 * date-range filter is wired up anywhere despite the service layer supporting `from`/
 * `to` params (confirmed unused in the JSX via source read).
 */
export class ReportsPage extends BasePage {
  readonly searchInput: Locator;
  readonly exportCsvButton: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search by name or roll no...');
    this.exportCsvButton = page.getByRole('button', { name: 'Export CSV' });
  }

  async goto() {
    await this.page.goto('/reports');
  }

  tab(name: ReportTab): Locator {
    return this.page.getByRole('button', { name, exact: true });
  }

  async selectTab(name: ReportTab) {
    await this.tab(name).click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async exportCsv(): Promise<import('@playwright/test').Download> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.exportCsvButton.click()]);
    return download;
  }

  /**
   * GST Report summary card value — next `<p>` after its label.
   * "CGST"/"SGST" also appear as Monthly GST Overview table column headers further
   * down the page (confirmed live 2026-07-08) — an unscoped `getByText` matches both,
   * and the table header's `following::p[1]` lands on the pagination footer text
   * ("Showing 1 to 2 of 2 entries"), a real strict-mode violation. The summary cards
   * render before the table in document order, so `.first()` reliably picks the card.
   */
  gstSummaryValue(label: 'Total GST Collected' | 'CGST' | 'SGST' | 'Taxable Fee Value'): Locator {
    return this.page.getByText(label, { exact: true }).first().locator('xpath=following::p[1]');
  }

  monthlyRow(monthYear: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(monthYear) });
  }

  feeReportEmptyState(): Locator {
    return this.page.getByText('No receipts found');
  }

  gstReportEmptyState(): Locator {
    return this.page.getByText('No GST data yet');
  }

  async expectFeeReportLoaded() {
    await expect(this.page.getByText('Sr No', { exact: true })).toBeVisible();
  }

  async expectGstReportLoaded() {
    await expect(this.page.getByText('Monthly GST Overview', { exact: true })).toBeVisible();
  }
}
