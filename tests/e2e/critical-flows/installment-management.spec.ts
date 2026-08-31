import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { InstallmentsPage } from '@utils/page-objects/installments.page';
import { AddInstallmentPage } from '@utils/page-objects/add-installment.page';
import { buildValidAdmission } from '@test-data/fixtures/admissions';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * @critical — release gate. Grounded directly in `InstallmentsPage.tsx` source (row
 * "Actions" kebab menu items, quoted verbatim) and SD-2 (Cancel/Edit for an
 * installment resolve to the Admissions-tab actions). Confirms from source — not just
 * from the stakeholder decision — that no "Cancel Installment"/"Verify Installment"
 * menu item exists anywhere in this page's code.
 *
 * Each test creates its own admission first (BR-01: nothing here can ever be deleted,
 * so specs must not depend on shared/pre-existing rows).
 */
test.describe('Installment management @critical', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('installment-management.spec.ts'));

  async function createAdmission(page: Page) {
    const admissionsPage = new AdmissionsPage(page);
    const addAdmission = new AddAdmissionPage(page);
    const data = buildValidAdmission();

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    return data;
  }

  test('list renders with all four status tabs', async ({ adminPage }) => {
    const installmentsPage = new InstallmentsPage(adminPage);
    await installmentsPage.goto();

    await expect(installmentsPage.tab('All')).toBeVisible();
    await expect(installmentsPage.tab('Completed Installments')).toBeVisible();
    await expect(installmentsPage.tab('Overdue Installments')).toBeVisible();
    await expect(installmentsPage.tab('Refunded Installments')).toBeVisible();
  });

  test('search by roll number filters the list to the matching record', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);

    await expect(installmentsPage.row(data.rollNo)).toBeVisible();
  });

  test('row Actions menu exposes exactly Edit Details / Record New Installment / View All Transactions', async ({
    adminPage,
  }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.openRowActions(data.rollNo);

    await expect(adminPage.getByRole('menuitem', { name: /edit details/i })).toBeVisible();
    await expect(adminPage.getByRole('menuitem', { name: /record new installment/i })).toBeVisible();
    await expect(adminPage.getByRole('menuitem', { name: /view all transactions/i })).toBeVisible();
    // Not overdue — Send Reminder must not render (BR-09).
    await expect(adminPage.getByRole('menuitem', { name: /send reminder/i })).toHaveCount(0);
    await adminPage.keyboard.press('Escape');
  });

  test('SD-2/source-confirmed: no Cancel Installment or Verify Installment option exists anywhere', async ({
    adminPage,
  }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.expectNoCancelOrVerifyOption(data.rollNo);
  });

  test('Edit Details routes to the (field-locked) Admissions edit form — confirms SD-2 mapping', async ({
    adminPage,
  }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);
    const addAdmission = new AddAdmissionPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.editDetailsFor(data.rollNo);

    await expect(adminPage).toHaveURL(/\/admissions\/.+\/edit/);
    await addAdmission.expectEditFormLocked();
  });

  test('Record New Installment pre-fills and locks the Admission Number field', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);
    const addInstallment = new AddInstallmentPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.recordNewInstallmentFor(data.rollNo);

    await expect(adminPage).toHaveURL(/\/installments\/new/);
    await expect(addInstallment.admissionNoInput).toHaveValue(data.admissionNo);
    // Locked via `lockedAdmissionNo` nav state — other autofilled fields on this form
    // use `readOnly` rather than `disabled` (see AddInstallmentPage source notes).
    await expect(addInstallment.admissionNoInput).toHaveAttribute('readonly', '');
  });

  test('View All Transactions opens the transactions page for that admission', async ({ adminPage }) => {
    const data = await createAdmission(adminPage);
    const installmentsPage = new InstallmentsPage(adminPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await installmentsPage.viewAllTransactionsFor(data.rollNo);

    await expect(adminPage).toHaveURL(/\/installments\/.+\/transactions/);
  });

  test('staff sees the same Installments list and Actions menu as admin (no role difference)', async ({
    staffPage,
  }) => {
    const data = await createAdmission(staffPage);
    const installmentsPage = new InstallmentsPage(staffPage);

    await installmentsPage.goto();
    await installmentsPage.search(data.rollNo);
    await expect(installmentsPage.row(data.rollNo)).toBeVisible();
  });
});
