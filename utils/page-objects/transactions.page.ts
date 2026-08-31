import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * `/installments/:admissionId/transactions` — `src/pages/installments/TransactionsPage.tsx`.
 * This is the real "Student Ledger" — confirmed via source read 2026-07-08 that the
 * Students page (`/students`) has NO drill-down of any kind; the only path here is the
 * Installments list's row kebab menu → "View All Transactions"
 * (`InstallmentsPage.viewAllTransactionsFor`). Not role-gated — open to both roles.
 */
export class TransactionsPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  async goto(admissionId: string) {
    await this.page.goto(`/installments/${admissionId}/transactions`);
  }

  /** Summary field value is the next `<p>` after its label — same idiom as Dashboard KPIs. */
  summaryField(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator('xpath=following::p[1]');
  }

  get finalFees(): Locator {
    return this.summaryField('Final Fees');
  }

  get totalPaid(): Locator {
    return this.summaryField('Total Paid');
  }

  get pendingAmount(): Locator {
    return this.summaryField('Pending Amount');
  }

  /**
   * BUG_005-adjacent (confirmed via source read: this is a pure passthrough of the
   * server's `admission.nextDueDate` — no client-side date computation exists here at
   * all). Any anomaly in this value is a backend data issue, not something this page
   * can be blamed for — do not assert a specific expected date without separate
   * backend confirmation.
   */
  get nextDueDate(): Locator {
    return this.summaryField('Next Due Date');
  }

  row(installmentLabel: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(`^${installmentLabel}\\b`) });
  }

  /** "Installment N" labels are synthesized client-side by index, not from any API field. */
  installmentRow(index: number): Locator {
    return this.row(`Installment ${index}`);
  }

  printButtonFor(index: number): Locator {
    const row = this.installmentRow(index);
    return row
      .getByRole('button', { name: /print receipt|no receipt/i })
      .or(row.getByRole('cell', { name: /print receipt|no receipt/i }).locator('button'));
  }

  async expectEmpty() {
    await expect(this.page.getByText('No transactions yet')).toBeVisible();
  }
}
