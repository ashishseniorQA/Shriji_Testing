import { test, expect } from '@utils/fixtures';
import { TopbarPage } from '@utils/page-objects/topbar.page';
import { AdmissionsPage } from '@utils/page-objects/admissions.page';
import { InstallmentsPage } from '@utils/page-objects/installments.page';

/**
 * @critical — release gate. Dedicated access-control regression suite (BR-16,
 * `RoleRoute.tsx`: any role other than the route's `requiredRole` is bounced to
 * `/dashboard`, not shown a 403 page). Only two roles exist app-wide: admin, staff.
 *
 * Settings-specific role differences (Institute Details/Notifications sections
 * entirely unrendered for staff; Banks/Courses/Centres read-only for staff) are
 * confirmed in source but deliberately deferred here — Settings is a later phase per
 * this project's roadmap (Auth/Admission/Installment/Payment/GST first).
 */
test.describe('Role-based access control @critical', () => {
  test.describe('navigation visibility', () => {
    test('admin nav shows all six items including Users and Reports', async ({ adminPage }) => {
      await adminPage.goto('/dashboard');
      const topbar = new TopbarPage(adminPage);

      for (const label of ['Dashboard', 'Users', 'Admission', 'Installments', 'Reports', 'Settings'] as const) {
        await topbar.expectNavItemVisible(label);
      }
    });

    test('staff nav omits Users and Reports (admin-only items)', async ({ staffPage }) => {
      await staffPage.goto('/dashboard');
      const topbar = new TopbarPage(staffPage);

      for (const label of ['Dashboard', 'Admission', 'Installments', 'Settings'] as const) {
        await topbar.expectNavItemVisible(label);
      }
      await topbar.expectNavItemAbsent('Users');
      await topbar.expectNavItemAbsent('Reports');
    });
  });

  test.describe('route guards (BR-16, RoleRoute)', () => {
    test('staff direct-navigating to /users is silently redirected to /dashboard, not shown a 403', async ({
      staffPage,
    }) => {
      await staffPage.goto('/users');
      await expect(staffPage).toHaveURL(/\/dashboard/);
      await expect(staffPage.getByText(/forbidden|403|access denied/i)).toHaveCount(0);
    });

    test('staff direct-navigating to /reports is silently redirected to /dashboard, not shown a 403', async ({
      staffPage,
    }) => {
      await staffPage.goto('/reports');
      await expect(staffPage).toHaveURL(/\/dashboard/);
      await expect(staffPage.getByText(/forbidden|403|access denied/i)).toHaveCount(0);
    });

    test('admin reaches /users and /reports directly without being redirected', async ({ adminPage }) => {
      await adminPage.goto('/users');
      await expect(adminPage).toHaveURL(/\/users/);

      await adminPage.goto('/reports');
      await expect(adminPage).toHaveURL(/\/reports/);
    });
  });

  test.describe('shared modules have identical access for both roles', () => {
    test('staff can open the Admissions list and its Add Admission form', async ({ staffPage }) => {
      const admissionsPage = new AdmissionsPage(staffPage);
      await admissionsPage.goto();
      await expect(staffPage).toHaveURL(/\/admissions$/);

      await admissionsPage.goToAdd();
      await expect(staffPage).toHaveURL(/\/admissions\/new/);
    });

    test('staff can open the Installments list and its Add Installment form', async ({ staffPage }) => {
      const installmentsPage = new InstallmentsPage(staffPage);
      await installmentsPage.goto();
      await expect(staffPage).toHaveURL(/\/installments$/);

      await installmentsPage.goToAdd();
      await expect(staffPage).toHaveURL(/\/installments\/new/);
    });
  });
});
