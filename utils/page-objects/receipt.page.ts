import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { parseCurrency } from '@utils/helpers/currency';

export interface ReceiptGstFigures {
  base: number;
  cgst: number;
  sgst: number;
  grandTotal: number;
}

/**
 * `/receipts/:id` — `src/pages/receipts/ReceiptPage.tsx`. Confirmed via source read
 * 2026-07-08: this route is standalone (no MainLayout/topbar/sidebar) and is never
 * linked to from anywhere in the app — the only ways to reach it are typing the URL
 * directly or capturing a `receiptId` from another response. There is NO "Print"
 * button on this page itself (only "Download Receipt" and "Close" — printing relies
 * on the browser's native Ctrl+P).
 */
export class ReceiptPage extends BasePage {
  readonly downloadButton: Locator;
  readonly closeButton: Locator;

  constructor(page: Page) {
    super(page);
    this.downloadButton = page.getByRole('button', { name: 'Download Receipt' });
    this.closeButton = page.getByRole('button', { name: 'Close', exact: true });
  }

  async goto(receiptId: string) {
    await this.page.goto(`/receipts/${receiptId}`);
  }

  async expectLoaded() {
    await expect(this.page.getByText('RECEIPT', { exact: true })).toBeVisible();
  }

  /**
   * PARTICULARS is NOT a semantic `<table>` — confirmed live 2026-07-08: it's a series
   * of plain `<div>` rows each containing a label `<p>` and a value `<p>`, with no
   * `table`/`row`/`cell` roles at all. `getByRole('row', ...)` matches zero elements
   * and `.innerText()` waits out the full test timeout rather than failing fast — the
   * cause of a real 30s hang. Use the `following-sibling::`-from-label-text idiom
   * (matching `kpiValue`/`BasePage.fieldFollowingLabel`) instead of a role-based query.
   */
  private rowAmount(label: string): Locator {
    return this.page.getByText(label, { exact: true }).locator('xpath=following-sibling::p[1]');
  }

  /** Reads Base ("Tuition Fee"), CGST, SGST, and Grand Total from the PARTICULARS section. */
  async getGstFigures(): Promise<ReceiptGstFigures> {
    const [base, cgst, sgst, grandTotal] = await Promise.all([
      this.rowAmount('Tuition Fee').innerText(),
      this.rowAmount('CGST @ 9%').innerText(),
      this.rowAmount('SGST @ 9%').innerText(),
      this.rowAmount('Grand Total').innerText(),
    ]);
    return {
      base: parseCurrency(base),
      cgst: parseCurrency(cgst),
      sgst: parseCurrency(sgst),
      grandTotal: parseCurrency(grandTotal),
    };
  }

  get amountInWords(): Locator {
    return this.page.getByText('IN WORDS', { exact: true }).locator('xpath=following::p[1]');
  }

  /**
   * EDGE-082 reversal (confirmed live 2026-07-08, contradicting the source-read
   * prediction of an infinite spinner): `/receipts` and `/receipts/` (no id) don't
   * even reach `ReceiptPage.tsx`'s fetch `useEffect` — the router's own route matching
   * treats the missing `:id` segment as no match and falls through to the app's 404
   * catch-all page before any component-level fetch/spinner logic runs.
   */
  async expectNotFoundForMissingId() {
    await expect(this.page.getByRole('heading', { name: '404' })).toBeVisible();
    await expect(this.page.getByText('Page not found', { exact: true })).toBeVisible();
  }
}
