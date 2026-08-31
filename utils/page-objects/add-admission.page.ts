import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';
import { PaymentMethod, PAYMENT_METHOD_LABELS } from '@test-data/fixtures/installments';

export interface AdmissionFormInput {
  admissionNo: string;
  rollNo: string;
  name: string;
  fatherName: string;
  courseName: string;
  paymentMethod: PaymentMethod;
  bankName?: string;
  ddOrTxnNo?: string;
  depositDate: string; // yyyy-mm-dd
  fees: number;
  finalFees: number;
  installmentCycleMonths: number;
  mobile: string;
  fatherMobile: string;
  remarks?: string;
}

/**
 * `/admissions/new` and `/admissions/:id/edit` — both served by
 * `AddAdmissionPage.tsx`, schema/placeholders grounded directly in that file.
 */
export class AddAdmissionPage extends BasePage {
  readonly admissionNoInput: Locator;
  readonly rollNoInput: Locator;
  readonly nameInput: Locator;
  readonly fatherNameInput: Locator;
  readonly courseSelect: Locator;
  readonly paymentMethodSelect: Locator;
  readonly bankNameSelect: Locator;
  readonly ddOrTxnNoInput: Locator;
  readonly depositDateInput: Locator;
  readonly feesInput: Locator;
  readonly finalFeesInput: Locator;
  readonly installmentCycleSelect: Locator;
  readonly mobileInput: Locator;
  readonly fatherMobileInput: Locator;
  readonly remarksInput: Locator;
  readonly submitButton: Locator;
  readonly resetButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    super(page);
    this.admissionNoInput = page.getByPlaceholder('Student Admission Number');
    this.rollNoInput = page.getByPlaceholder('Student roll number');
    this.nameInput = page.getByPlaceholder('Student name');
    this.fatherNameInput = page.getByPlaceholder(`Father's name`);
    this.courseSelect = page.locator('#mui-component-select-courseId');
    this.paymentMethodSelect = page.locator('#mui-component-select-depositType');
    this.bankNameSelect = page.locator('#mui-component-select-bankName');
    this.ddOrTxnNoInput = page.getByPlaceholder('Transaction ID');
    // Mobile/Father's Mobile share the placeholder "10-digit mobile number" — disambiguated
    // by document order relative to their own sibling FieldLabel.
    // Deposit Date is a segmented MUI X date field, not a plain <input> — see
    // BasePage.dateSegmentFollowingLabel/fillDateField for why this points at the Month
    // spinbutton rather than an <input>.
    this.depositDateInput = this.dateSegmentFollowingLabel('Deposit Date');
    this.feesInput = page.getByPlaceholder('e.g. 150000');
    this.finalFeesInput = page.getByPlaceholder('Final agreed fee');
    this.installmentCycleSelect = page.locator('#mui-component-select-installmentCycleMonths');
    this.mobileInput = this.fieldFollowingLabel('Mobile');
    this.fatherMobileInput = this.fieldFollowingLabel(`Father's Mobile`);
    // NOTE: field labels render as "Label *" for required fields (FieldLabel component
    // appends the asterisk inside the same Typography) — `fieldFollowingLabel`/`labelText`
    // (BasePage) account for this via an optional-asterisk regex; do not switch these to
    // a plain `getByText(label, { exact: true })` or they will stop matching.
    this.remarksInput = page.getByPlaceholder('Add any remarks or notes here...');
    this.submitButton = page.getByRole('button', { name: /submit admission|update admission/i });
    this.resetButton = page.getByRole('button', { name: 'Reset', exact: true });
    this.cancelButton = page.getByRole('button', { name: 'Cancel', exact: true });
  }

  async goto() {
    await this.page.goto('/admissions/new');
  }

  async selectCourse(courseName: string) {
    await this.courseSelect.click();
    await this.page.getByRole('option', { name: courseName }).click();
  }

  async selectPaymentMethod(method: PaymentMethod) {
    await this.paymentMethodSelect.click();
    await this.page.getByRole('option', { name: PAYMENT_METHOD_LABELS[method], exact: true }).click();
  }

  async selectBank(bankName: string) {
    await this.bankNameSelect.click();
    await this.page.getByRole('option', { name: bankName }).click();
  }

  async selectInstallmentCycle(months: number) {
    await this.installmentCycleSelect.click();
    const label = months === 1 ? '1 Month' : `${months} Months`;
    await this.page.getByRole('option', { name: label, exact: true }).click();
  }

  /** Fills every field. Course/payment-method/bank/cycle are set via their own select helpers. */
  async fill(data: AdmissionFormInput) {
    await this.admissionNoInput.fill(data.admissionNo);
    await this.rollNoInput.fill(data.rollNo);
    await this.nameInput.fill(data.name);
    await this.fatherNameInput.fill(data.fatherName);
    await this.selectCourse(data.courseName);
    await this.selectPaymentMethod(data.paymentMethod);
    if (data.bankName) await this.selectBank(data.bankName);
    if (data.ddOrTxnNo) await this.ddOrTxnNoInput.fill(data.ddOrTxnNo);
    await this.fillDateField('Deposit Date', data.depositDate);
    await this.feesInput.fill(String(data.fees));
    await this.finalFeesInput.fill(String(data.finalFees));
    await this.selectInstallmentCycle(data.installmentCycleMonths);
    await this.mobileInput.fill(data.mobile);
    await this.fatherMobileInput.fill(data.fatherMobile);
    if (data.remarks) await this.remarksInput.fill(data.remarks);
  }

  async submit() {
    await this.submitButton.click();
  }

  async submitAndWaitForCreate() {
    const [response] = await Promise.all([
      this.page.waitForResponse((res) => res.url().includes('/admissions') && res.request().method() === 'POST'),
      this.submit(),
    ]);
    return response;
  }

  async expectCreatedToast() {
    await this.expectToast('Admission created successfully');
  }

  async expectUpdatedToast() {
    await this.expectToast('Admission updated');
  }

  /**
   * LV-10: live-corrected Edit form — only these 4 fields are enabled.
   * NOTE: the subtitle uses a typographic/curly apostrophe (U+2019 "'"), not a
   * straight ASCII one (U+0027 "'") — confirmed live 2026-07-08 after this exact
   * string mismatch silently failed the match. Do not "clean up" this apostrophe.
   */
  async expectEditFormLocked() {
    await expect(
      this.page.getByText(`Update the student’s name and contact details. Fee and payment details are locked.`),
    ).toBeVisible();
    await expect(this.nameInput).toBeEnabled();
    await expect(this.fatherNameInput).toBeEnabled();
    await expect(this.mobileInput).toBeEnabled();
    await expect(this.fatherMobileInput).toBeEnabled();
    await expect(this.admissionNoInput).toBeDisabled();
    await expect(this.courseSelect).toHaveAttribute('aria-disabled', 'true');
    await expect(this.feesInput).toBeDisabled();
    await expect(this.finalFeesInput).toBeDisabled();
    await expect(this.depositDateInput).toBeDisabled();
  }
}
