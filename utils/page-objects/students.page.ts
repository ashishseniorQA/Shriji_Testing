import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * `/students` — `src/pages/students/StudentsPage.tsx`. A flat roster with NO
 * drill-down — confirmed via source read 2026-07-08: no row action, no per-student
 * navigation exists anywhere on this page. Not role-gated — open to both roles. The
 * real per-student ledger is `TransactionsPage` (see transactions.page.ts), reached
 * only via the Installments list.
 */
export class StudentsPage extends BasePage {
  readonly searchInput: Locator;
  readonly exportAllButton: Locator;
  readonly backToAdmissionsLink: Locator;

  constructor(page: Page) {
    super(page);
    this.searchInput = page.getByPlaceholder('Search by name or roll no...');
    this.exportAllButton = page.getByRole('button', { name: 'Export All' });
    this.backToAdmissionsLink = page.getByText('Back to Admissions');
  }

  async goto() {
    await this.page.goto('/students');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  row(identifier: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(identifier.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) });
  }

  async goBackToAdmissions() {
    await this.backToAdmissionsLink.click();
  }

  /** Client-side XLSX export via the `xlsx` package — confirmed via source, not a server export endpoint. */
  async exportAll(): Promise<import('@playwright/test').Download> {
    const [download] = await Promise.all([this.page.waitForEvent('download'), this.exportAllButton.click()]);
    return download;
  }
}
