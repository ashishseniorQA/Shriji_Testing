import { Page, Locator, expect } from '@playwright/test';
import { BasePage, escapeRegExp } from './base.page';

/**
 * Source (`InstallmentsPage.tsx`) hardcodes only 3 tabs ("All"/"Completed
 * Installments"/"Overdue Installments") — the live `testing` deployment additionally
 * renders a 4th "Refunded Installments" tab, screenshot-confirmed live during manual
 * QA (2026-07-06/07). This is the same class of source-vs-deployed-build drift as the
 * Dashboard KPI-card mismatch (LV-3) — test against the live 4-tab set, not the source.
 */
export type InstallmentTab = 'All' | 'Completed Installments' | 'Overdue Installments' | 'Refunded Installments';

/**
 * `/installments` list — `src/pages/installments/InstallmentsPage.tsx`. The row
 * "Actions" control is a kebab-menu (`MoreVertOutlined`), NOT separate icon buttons
 * like the Admissions list. Its menu items are, verbatim from source: "Edit Details"
 * (routes to the Admissions edit form — confirms SD-2's Cancel/Edit-via-Admissions-tab
 * resolution directly from code), "Record New Installment", "View All Transactions",
 * and "Send Reminder" (only rendered when the row's status is `overdue`). There is NO
 * "Cancel Installment" or "Verify Installment" menu item anywhere in source — confirms
 * Verify is genuinely Pending Development, not a missed selector.
 */
export class InstallmentsPage extends BasePage {
  readonly addNewInstallmentButton: Locator;
  readonly uploadInBulkButton: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewInstallmentButton = page.getByRole('button', { name: 'Add New Installment' });
    this.uploadInBulkButton = page.getByRole('button', { name: 'Upload In Bulk' });
    this.searchInput = page.getByPlaceholder('Search by name or roll no...');
  }

  async goto() {
    await this.page.goto('/installments');
  }

  async goToAdd() {
    await this.addNewInstallmentButton.click();
  }

  tab(label: InstallmentTab): Locator {
    return this.page.getByRole('button', { name: label, exact: true });
  }

  async selectTab(label: InstallmentTab) {
    await this.tab(label).click();
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  row(identifier: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(identifier)) });
  }

  /**
   * MUI `Tooltip` on this icon button puts its accessible name on a wrapping
   * `role="generic"` span rather than forwarding it to the inner `<button>` — same
   * pattern confirmed live on the Admissions list's Print/Edit/Cancel icons
   * (see AdmissionsPage.actionIconButton). Try the direct button name first, fall
   * back to the wrapper-then-button pattern.
   */
  actionsButtonFor(identifier: string): Locator {
    const row = this.row(identifier);
    return row.getByRole('button', { name: 'Actions' }).or(row.getByRole('generic', { name: 'Actions' }).locator('button'));
  }

  async openRowActions(identifier: string) {
    await this.actionsButtonFor(identifier).click();
  }

  /** Routes to the Admissions edit form (SD-2) — same destination as the Admissions-list Edit icon. */
  async editDetailsFor(identifier: string) {
    await this.openRowActions(identifier);
    await this.page.getByRole('menuitem', { name: /edit details/i }).click();
  }

  async recordNewInstallmentFor(identifier: string) {
    await this.openRowActions(identifier);
    await this.page.getByRole('menuitem', { name: /record new installment/i }).click();
  }

  async viewAllTransactionsFor(identifier: string) {
    await this.openRowActions(identifier);
    await this.page.getByRole('menuitem', { name: /view all transactions/i }).click();
  }

  async sendReminderFor(identifier: string) {
    await this.openRowActions(identifier);
    await this.page.getByRole('menuitem', { name: /send reminder/i }).click();
  }

  /** BR-09: only rendered when the row's status is `overdue`. */
  async expectNoSendReminderOption(identifier: string) {
    await this.openRowActions(identifier);
    await expect(this.page.getByRole('menuitem', { name: /send reminder/i })).toHaveCount(0);
    await this.page.keyboard.press('Escape');
  }

  /** Confirms Verify/Cancel are absent from the menu, per SD-2 and source-code confirmation. */
  async expectNoCancelOrVerifyOption(identifier: string) {
    await this.openRowActions(identifier);
    await expect(this.page.getByRole('menuitem', { name: /^cancel installment$/i })).toHaveCount(0);
    await expect(this.page.getByRole('menuitem', { name: /^verify installment$/i })).toHaveCount(0);
    await this.page.keyboard.press('Escape');
  }

  async expectRemainingFees(identifier: string, amount: string) {
    await expect(this.row(identifier).getByText(amount, { exact: true })).toBeVisible();
  }
}
