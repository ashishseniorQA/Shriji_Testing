import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { buildValidAdmission, buildOverpaidAdmission, buildAdmissionWithAlphaMobile } from '@test-data/fixtures/admissions';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * @critical — release gate. Grounded in QA-DIGEST.md §9.2/§7.3 and live-verified
 * corrections from the manual test plan (Module 3, LV-10). BR-01/BR-02 referenced
 * below are the digest's Business Rules; exact copy is quoted from `AddAdmissionPage.tsx`
 * and `AdmissionsPage.tsx`.
 *
 * Skips Bulk Upload entirely per explicit instruction — it is Pending Development
 * (SD-1, buttons have no onClick handler) and out of scope for this phase.
 */
test.describe('Admission management @critical', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('admission-management.spec.ts'));

  test('admin creates a valid admission end-to-end', async ({ adminPage }) => {
    const admissionsPage = new AdmissionsPage(adminPage);
    const addAdmission = new AddAdmissionPage(adminPage);
    const data = buildValidAdmission();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();

    await addAdmission.expectCreatedToast();
    await expect(adminPage).toHaveURL(/\/admissions$/);
    await admissionsPage.search(data.rollNo);
    await admissionsPage.expectRowStatus(data.rollNo, 'Confirmed');
    // Receipt is generated synchronously at creation — Print becomes enabled immediately
    // (Tooltip title toggles "Print receipt"/enabled vs "No receipt"/disabled).
    await expect(admissionsPage.printButtonFor(data.rollNo)).toBeEnabled();
  });

  test('staff can also create an admission (no role difference in Admissions CRUD)', async ({ staffPage }) => {
    const admissionsPage = new AdmissionsPage(staffPage);
    const addAdmission = new AddAdmissionPage(staffPage);
    const data = buildValidAdmission();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();

    await addAdmission.expectCreatedToast();
  });

  test.describe('validation', () => {
    test('submitting an empty form shows the required-field messages', async ({ adminPage }) => {
      const addAdmission = new AddAdmissionPage(adminPage);
      await addAdmission.goto();
      await addAdmission.submit();

      await addAdmission.expectFieldError('Admission number is required');
      await addAdmission.expectFieldError('Roll number is required');
      await addAdmission.expectFieldError('Name is required');
      await addAdmission.expectFieldError(`Father's name is required`);
    });

    test('BR-02: fees paid greater than final fees is blocked with the cross-field message', async ({ adminPage }) => {
      const admissionsPage = new AdmissionsPage(adminPage);
      const addAdmission = new AddAdmissionPage(adminPage);
      const data = buildOverpaidAdmission();

      await admissionsPage.goto();
      await admissionsPage.goToAdd();
      await addAdmission.fill(data);

      // Live-confirmed 2026-07-08: the refine error appears reactively as soon as the
      // invalid Fees value is entered — the form does not wait for a submit attempt.
      // The Submit button is correspondingly kept disabled the whole time (react-hook-form
      // `formState.isValid`), so clicking it never succeeds; assert the disabled state
      // directly instead of attempting (and hanging on) a click.
      await addAdmission.expectFieldError('Fees paid cannot exceed final fees');
      await expect(addAdmission.submitButton).toBeDisabled();
      await expect(adminPage).toHaveURL(/\/admissions\/new/);
    });
  });

  test('BR-04: a non-numeric mobile number is accepted (length-only validation, no digit regex)', async ({
    adminPage,
  }) => {
    const admissionsPage = new AdmissionsPage(adminPage);
    const addAdmission = new AddAdmissionPage(adminPage);
    const data = buildAdmissionWithAlphaMobile();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();

    // Documents actual (lax) behavior per BR-04 — this is expected to succeed, not fail.
    await addAdmission.expectCreatedToast();
  });

  test('BR-01/SD-2: cancelling an admission is soft, blocks further use, and disables re-cancel', async ({
    adminPage,
  }) => {
    const admissionsPage = new AdmissionsPage(adminPage);
    const addAdmission = new AddAdmissionPage(adminPage);
    const data = buildValidAdmission();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    await admissionsPage.search(data.rollNo);
    await admissionsPage.cancelButtonFor(data.rollNo).click();
    await admissionsPage.expectCancelDialogMessage(data.admissionNo, data.name);
    await admissionsPage.confirmDialogConfirmButton.click();

    await admissionsPage.expectCancelledToast();
    await admissionsPage.search(data.rollNo);
    await admissionsPage.expectRowStatus(data.rollNo, 'Cancelled');
    await admissionsPage.expectAlreadyCancelled(data.rollNo);
  });

  test('LV-10: Edit form locks every field except name/contact details', async ({ adminPage }) => {
    const admissionsPage = new AdmissionsPage(adminPage);
    const addAdmission = new AddAdmissionPage(adminPage);
    const data = buildValidAdmission();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    await admissionsPage.search(data.rollNo);
    await admissionsPage.goToEdit(data.rollNo);

    await addAdmission.expectEditFormLocked();

    const updatedName = `${data.name} Updated`;
    await addAdmission.nameInput.fill(updatedName);
    await addAdmission.submit();
    await addAdmission.expectUpdatedToast();

    await admissionsPage.goto();
    await admissionsPage.search(data.rollNo);
    await expect(admissionsPage.row(data.rollNo)).toContainText(updatedName);
  });
});
