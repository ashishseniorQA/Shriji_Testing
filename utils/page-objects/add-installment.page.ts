import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '@test-data/fixtures/installments';

export interface InstallmentFormInput {
  admissionNo: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  ddOrTxnNo?: string;
  depositDate: string; // yyyy-mm-dd
  fees: number;
  remarks?: string;
}

/**
 * `/installments/new` — `src/pages/installments/AddInstallmentPage.tsx`. Roll No,
 * Name, Father Name, Course, Final Fee, Remaining Fee, Mobile, Father's Mobile are all
 * hard-read-only (BR-06) and populated by a 1500ms-debounced lookup keyed off Admission
 * Number. Only Payment Method, Bank Name, DD No/Date, Deposit Date, Fees, Remarks are
 * ever user-editable.
 */
export class AddInstallmentPage extends BasePage {
  readonly admissionNoInput: Locator;
  readonly rollNoInput: Locator;
  readonly nameInput: Locator;
  readonly fatherNameInput: Locator;
  readonly courseSelect: Locator;
  readonly finalFeeInput: Locator;
  readonly remainFeeInput: Locator;
  readonly paymentMethodSelect: Locator;
  readonly bankNameSelect: Locator;
  readonly ddOrTxnNoInput: Locator;
  readonly depositDateInput: Locator;
  readonly feesInput: Locator;
  readonly mobileInput: Locator;
  readonly fatherMobileInput: Locator;
  readonly remarksInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page);
    this.admissionNoInput = page.getByPlaceholder('Student Admission Number');
    // Everything below shares the placeholder "Auto-filled from admission" — disambiguated
    // by document order relative to each field's own FieldLabel.
    this.rollNoInput = this.fieldFollowingLabel('Roll No.');
    this.nameInput = this.fieldFollowingLabel('Name');
    this.fatherNameInput = this.fieldFollowingLabel('Father name');
    this.courseSelect = page.locator('#mui-component-select-courseId');
    this.finalFeeInput = this.fieldFollowingLabel('Final Fee');
    this.remainFeeInput = this.fieldFollowingLabel('Remaining Fee');
    this.mobileInput = this.fieldFollowingLabel('Mobile');
    this.fatherMobileInput = this.fieldFollowingLabel(`Father's Mobile`);
    this.paymentMethodSelect = page.locator('#mui-component-select-paymentMethod');
    this.bankNameSelect = page.locator('#mui-component-select-bankId');
    this.ddOrTxnNoInput = page.getByPlaceholder('Transaction ID');
    // Segmented MUI X date field, not a plain <input> — see BasePage.fillDateField.
    this.depositDateInput = this.dateSegmentFollowingLabel('Deposit Date');
    this.feesInput = page.getByPlaceholder('e.g. ₹15,000');
    this.remarksInput = page.getByPlaceholder('Add any remarks or notes here...');
    this.submitButton = page.getByRole('button', { name: /submit installment|save changes/i });
  }

  async goto() {
    await this.page.goto('/installments/new');
  }

  async enterAdmissionNo(admissionNo: string) {
    await this.admissionNoInput.fill(admissionNo);
  }

  /** Debounced 1500ms lookup — wait for the autofilled Final Fee to become non-empty. */
  async waitForAutofill() {
    await expect(this.finalFeeInput).not.toHaveValue('', { timeout: 5_000 });
  }

  async selectPaymentMethod(method: PaymentMethod) {
    await this.paymentMethodSelect.click();
    await this.page.getByRole('option', { name: PAYMENT_METHOD_LABELS[method], exact: true }).click();
  }

  async selectBank(bankName: string) {
    await this.bankNameSelect.click();
    await this.page.getByRole('option', { name: bankName }).click();
  }

  async fillDepositDate(isoDate: string) {
    await this.fillDateField('Deposit Date', isoDate);
  }

  async fill(data: InstallmentFormInput) {
    await this.enterAdmissionNo(data.admissionNo);
    await this.waitForAutofill();
    await this.selectPaymentMethod(data.paymentMethod);
    if (data.bankName) await this.selectBank(data.bankName);
    if (data.ddOrTxnNo) await this.ddOrTxnNoInput.fill(data.ddOrTxnNo);
    await this.fillDateField('Deposit Date', data.depositDate);
    await this.feesInput.fill(String(data.fees));
    if (data.remarks) await this.remarksInput.fill(data.remarks);
  }

  async submit() {
    await this.submitButton.click();
  }

  async submitAndWaitForCreate() {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/installments') && res.request().method() === 'POST'),
      this.submit(),
    ]);
    return response;
  }

  async expectRecordedToast() {
    await this.expectToast('Installment recorded successfully');
  }

  /** Runtime-only fallback string (not a Zod message) shown as the field's helperText. */
  async expectLookupNotFound() {
    await this.expectFieldError('No admission found for this number');
  }

  /**
   * Autofilled TextFields use `slotProps.htmlInput.readOnly: true` (still focusable,
   * not `disabled`) — per source. The Course Select is the one exception, hardcoded
   * `disabled` rather than read-only.
   */
  async expectAutofilledReadOnly() {
    await expect(this.rollNoInput).toHaveAttribute('readonly', '');
    await expect(this.nameInput).toHaveAttribute('readonly', '');
    await expect(this.fatherNameInput).toHaveAttribute('readonly', '');
    await expect(this.finalFeeInput).toHaveAttribute('readonly', '');
    await expect(this.remainFeeInput).toHaveAttribute('readonly', '');
    await expect(this.courseSelect).toHaveAttribute('aria-disabled', 'true');
  }
}
