import { Page } from '@playwright/test';
import { test, expect } from '@utils/fixtures';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { AddAdmissionPage } from '@utils/page-objects/add-admission.page';
import { InstallmentsPage } from '@utils/page-objects/installments.page';
import { TransactionsPage } from '@utils/page-objects/transactions.page';
import { StudentsPage } from '@utils/page-objects/students.page';
import { buildValidAdmission } from '@test-data/fixtures/admissions';
import { assertWriteOperationsAllowed } from '@utils/helpers/env-guard';

/**
 * "Student Ledger" is the Transactions page (`/installments/:admissionId/transactions`),
 * NOT the Students page — confirmed via source read 2026-07-08: `/students` has zero
 * drill-down of any kind (no row action, no navigation anywhere in its source). The
 * only path to a per-student payment history is the Installments list's row kebab
 * menu → "View All Transactions" (already covered structurally in
 * installment-management.spec.ts's phase-1 test of that same menu item — this spec
 * covers what's actually ON the destination page instead).
 */
test.describe('Student Ledger @generic', () => {
  test.beforeAll(() => assertWriteOperationsAllowed('student-ledger.spec.ts'));

  async function createAdmission(page: Page) {
    const admissionsPage = new AdmissionsPage(page);
    const addAdmission = new AddAdmissionPage(page);
    const data = buildValidAdmission({ fees: 8_000, finalFees: 30_000 });

    await admissionsPage.goto();
    await admissionsPage.goToAdd();
    await addAdmission.fill(data);
    await addAdmission.submit();
    await addAdmission.expectCreatedToast();

    return data;
  }

  test.describe('Transactions page (the real ledger)', () => {
    test('summary fields reflect the admission accurately', async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const installmentsPage = new InstallmentsPage(adminPage);
      const transactions = new TransactionsPage(adminPage);

      await installmentsPage.goto();
      await installmentsPage.search(data.rollNo);
      await installmentsPage.viewAllTransactionsFor(data.rollNo);

      await expect(adminPage).toHaveURL(/\/installments\/.+\/transactions/);
      await expect(transactions.finalFees).toHaveText(`₹${data.finalFees.toLocaleString('en-IN')}`);
      await expect(transactions.totalPaid).toHaveText(`₹${data.fees.toLocaleString('en-IN')}`);
      await expect(transactions.pendingAmount).toHaveText(`₹${(data.finalFees - data.fees).toLocaleString('en-IN')}`);
    });

    test('the initial-deposit transaction row has an enabled Print button (receipt exists)', async ({
      adminPage,
    }) => {
      const data = await createAdmission(adminPage);
      const installmentsPage = new InstallmentsPage(adminPage);
      const transactions = new TransactionsPage(adminPage);

      await installmentsPage.goto();
      await installmentsPage.search(data.rollNo);
      await installmentsPage.viewAllTransactionsFor(data.rollNo);

      await expect(transactions.printButtonFor(1)).toBeEnabled();
    });

    test('staff can also open a Transactions/ledger page (no role difference)', async ({ staffPage }) => {
      const data = await createAdmission(staffPage);
      const installmentsPage = new InstallmentsPage(staffPage);

      await installmentsPage.goto();
      await installmentsPage.search(data.rollNo);
      await installmentsPage.viewAllTransactionsFor(data.rollNo);

      await expect(staffPage).toHaveURL(/\/installments\/.+\/transactions/);
    });
  });

  test.describe('Students page (flat roster, no drill-down)', () => {
    test('lists students with the correct columns', async ({ adminPage }) => {
      const students = new StudentsPage(adminPage);
      await students.goto();

      for (const col of ['Admission No.', 'Roll No.', 'Name', 'Father Name', 'Class', 'Mobile', "Father Mobile No."]) {
        await expect(adminPage.getByRole('columnheader', { name: col, exact: true })).toBeVisible();
      }
    });

    test('search filters the roster to the matching student', async ({ adminPage }) => {
      const data = await createAdmission(adminPage);
      const students = new StudentsPage(adminPage);

      await students.goto();
      await students.search(data.rollNo);

      await expect(students.row(data.rollNo)).toBeVisible();
    });

    test('"Export All" downloads an .xlsx file (client-side export, not a server endpoint)', async ({
      adminPage,
    }) => {
      const students = new StudentsPage(adminPage);
      await students.goto();

      const download = await students.exportAll();
      expect(download.suggestedFilename()).toBe('students.xlsx');
    });

    test('staff can also open the Students page (no role difference)', async ({ staffPage }) => {
      const students = new StudentsPage(staffPage);
      await students.goto();
      await expect(staffPage).toHaveURL(/\/students/);
    });
  });
});
