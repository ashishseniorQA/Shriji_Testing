import { Page, Locator, expect } from '@playwright/test';
import { BasePage, escapeRegExp } from './base.page';

export type AdmissionStatusFilter = 'All Status' | 'Confirmed' | 'Cancelled';

/**
 * `/admissions` list — `src/pages/admissions/AdmissionsPage.tsx`. Column set, button
 * text, tooltip copy, and dialog copy below are quoted directly from that source file.
 */
export class AdmissionsPage extends BasePage {
  readonly addNewAdmissionButton: Locator;
  readonly uploadInBulkButton: Locator;
  readonly searchInput: Locator;
  readonly statusFilterSelect: Locator;
  readonly confirmDialogConfirmButton: Locator;
  readonly confirmDialogDismissButton: Locator;

  constructor(page: Page) {
    super(page);
    this.addNewAdmissionButton = page.getByRole('button', { name: 'Add New Admission' });
    this.uploadInBulkButton = page.getByRole('button', { name: 'Upload In Bulk' });
    this.searchInput = page.getByPlaceholder('Search by name or roll no...');
    this.statusFilterSelect = page.locator('div').filter({ hasText: /^All Status$|^Confirmed$|^Cancelled$/ }).first();
    // Live-confirmed 2026-07-08: the Cancel Admission dialog was redesigned since the
    // source was last read — it's no longer the generic single-message `ConfirmDialog`.
    // Confirm button is "Yes, Cancel Admission" (not "Cancel Admission"), and it now
    // includes an "Initiate Refund for this installment?" toggle switch.
    this.confirmDialogConfirmButton = page.getByRole('button', { name: 'Yes, Cancel Admission', exact: true });
    this.confirmDialogDismissButton = page.getByRole('dialog').getByRole('button', { name: 'Cancel', exact: true });
  }

  async goto() {
    await this.page.goto('/admissions');
  }

  async search(query: string) {
    await this.searchInput.fill(query);
  }

  async filterByStatus(status: AdmissionStatusFilter) {
    await this.statusFilterSelect.click();
    await this.page.getByRole('option', { name: status, exact: true }).click();
  }

  /** Row located by any visible identifying text (admission no., roll no., or name). */
  row(identifier: string): Locator {
    return this.page.getByRole('row', { name: new RegExp(escapeRegExp(identifier)) });
  }

  /**
   * Edit/Cancel icon buttons carry their own direct accessible name ("Edit",
   * "Cancel admission") — confirmed live 2026-07-08 — and share ONE cell together, so
   * a cell-based fallback would match both at once (strict-mode violation). Match
   * directly by button name only.
   */
  editButtonFor(identifier: string): Locator {
    return this.row(identifier).getByRole('button', { name: 'Edit', exact: true });
  }

  cancelButtonFor(identifier: string): Locator {
    return this.row(identifier).getByRole('button', { name: /cancel admission|already cancelled/i });
  }

  /**
   * The Print icon button is the one exception: its name ("Print receipt"/"No
   * receipt") lands on the wrapping `<td role="cell">` instead of the `<button>`
   * itself, which has no accessible name of its own — confirmed live 2026-07-08. It
   * has its own dedicated cell (unlike Edit/Cancel), so this fallback is safe here.
   */
  printButtonFor(identifier: string): Locator {
    const row = this.row(identifier);
    return row
      .getByRole('button', { name: /print receipt|no receipt/i })
      .or(row.getByRole('cell', { name: /print receipt|no receipt/i }).locator('button'));
  }

  async goToAdd() {
    await this.addNewAdmissionButton.click();
  }

  async goToEdit(identifier: string) {
    await this.editButtonFor(identifier).click();
  }

  /**
   * LV-31/LV-36 — "Initiate Refund for this installment?" toggle on the redesigned
   * Cancel Admission dialog. Confirmed live 2026-07-08 via direct network inspection —
   * this is a genuinely functional, working feature (not dead/cosmetic like the
   * source's own orphaned `CancelInstallmentDialog.tsx` component it resembles):
   *   - Defaults to OFF/unchecked (contradicts the orphaned source component's own
   *     `useState(true)` default — the live version is evidently a different/updated
   *     variant of that component).
   *   - Toggling it on reveals "Refund Amount *" (placeholder "Enter Refund Amount",
   *     ₹ prefix) and a "Max refundable: ₹{amount}" hint equal to the admission's
   *     paid/deposit amount.
   *   - Confirming sends `POST /admissions/:id/cancel` with body
   *     `{ refund: true, refundAmount: <n> }` — confirmed via live network capture.
   *   - This genuinely increments the Dashboard's "Total Refunded" KPI (and
   *     recalculates Net Balance) by exactly the submitted amount — confirmed live
   *     (₹30,000 → ₹35,000 after a ₹5,000 refund).
   *   - The confirm button stays "Yes, Cancel Admission" regardless of the toggle
   *     state — it is NOT "Yes, Cancel Installment" as the orphaned source component
   *     would suggest.
   */
  get initiateRefundToggle(): Locator {
    return this.page.getByRole('dialog').getByRole('switch');
  }

  get refundAmountInput(): Locator {
    return this.page.getByRole('dialog').getByPlaceholder('Enter Refund Amount');
  }

  get maxRefundableHint(): Locator {
    return this.page.getByText(/^Max refundable: /);
  }

  async enableRefund(amount: number) {
    await this.initiateRefundToggle.click();
    await expect(this.refundAmountInput).toBeVisible();
    await this.refundAmountInput.fill(String(amount));
  }

  /** BR-01: cancel is the only lifecycle-ending action — no delete exists anywhere. Leaves the refund toggle off. */
  async cancelAdmission(identifier: string) {
    await this.cancelButtonFor(identifier).click();
    await expect(this.page.getByRole('dialog').getByText('Cancel Admission?')).toBeVisible();
    await this.confirmDialogConfirmButton.click();
  }

  /** Cancels with the refund toggle enabled and a specific refund amount. */
  async cancelAdmissionWithRefund(identifier: string, refundAmount: number) {
    await this.cancelButtonFor(identifier).click();
    await expect(this.page.getByRole('dialog').getByText('Cancel Admission?')).toBeVisible();
    await this.enableRefund(refundAmount);
    await this.confirmDialogConfirmButton.click();
  }

  /**
   * LV-31 (live-confirmed 2026-07-08, redesigned since the source code was last read):
   * dialog title is "Cancel Admission?"; message format is "You are about to cancel
   * the Admission of {name} (Admission No: {admissionNo})." — name first, then
   * admission number, reversed from the source's original `{no} for {name}` template.
   */
  async expectCancelDialogMessage(admissionNo: string, studentName: string) {
    await expect(
      this.page.getByText(`You are about to cancel the Admission of ${studentName} (Admission No: ${admissionNo}).`),
    ).toBeVisible();
    await expect(
      this.page.getByText(
        'This action cannot be undone. The record will be marked as Cancelled and the receipt will no longer be printable.',
      ),
    ).toBeVisible();
  }

  async expectCancelledToast() {
    await this.expectToast('Admission cancelled');
  }

  /**
   * LV-31 (live-confirmed 2026-07-08, redesigned since the digest was last updated —
   * supersedes its "Cancel icon becomes disabled, tooltip 'Already cancelled'" claim):
   * a cancelled row's Print cell shows "—" and its Actions cell shows only "Info" text
   * with an icon — the Edit/Cancel/Print buttons are removed from the row entirely,
   * not merely disabled.
   */
  async expectAlreadyCancelled(identifier: string) {
    const row = this.row(identifier);
    await expect(this.editButtonFor(identifier)).toHaveCount(0);
    await expect(this.cancelButtonFor(identifier)).toHaveCount(0);
    await expect(row.getByText('Info', { exact: true })).toBeVisible();
  }

  async expectRowStatus(identifier: string, status: 'Confirmed' | 'Cancelled') {
    await expect(this.row(identifier).getByText(status, { exact: true })).toBeVisible();
  }
}
