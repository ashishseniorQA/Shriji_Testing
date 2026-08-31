import { test, expect } from '@utils/fixtures';
import { LoginPage } from '@utils/page-objects/login.page';
import { DashboardPage } from '@utils/page-objects/dashboard.page';
import { TopbarPage } from '@utils/page-objects/topbar.page';
import { ApiClient } from '@utils/api-clients/api-client';
import { getTestUser, getTestCentre } from '@test-data/fixtures/users';

/**
 * @critical — release gate. Grounded in QA-DIGEST.md §0/§9.1 and the live-verified
 * manual test plan Module 1. Exact copy asserted below (inline alert text, ACCOUNT_*
 * error strings, validation messages) is quoted verbatim from `LoginPage.tsx`.
 */
test.describe('Authentication @critical', () => {
  test('admin can log in and lands on the dashboard with full nav', async ({ page }) => {
    const admin = getTestUser('admin');
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const topbar = new TopbarPage(page);

    await login.goto();
    await login.login(admin.email, admin.password, getTestCentre());

    await login.expectLoggedInRedirect();
    await dashboard.expectLoaded();
    await topbar.expectNavItemVisible('Users');
    await topbar.expectNavItemVisible('Reports');
  });

  test('staff can log in and lands on the dashboard without Users/Reports nav', async ({ page }) => {
    const staff = getTestUser('staff');
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);
    const topbar = new TopbarPage(page);

    await login.goto();
    await login.login(staff.email, staff.password, getTestCentre());

    await login.expectLoggedInRedirect();
    await dashboard.expectLoaded();
    await topbar.expectNavItemAbsent('Users');
    await topbar.expectNavItemAbsent('Reports');
  });

  test('wrong password shows the exact inline "Invalid email or password" alert', async ({ page }) => {
    const admin = getTestUser('admin');
    const login = new LoginPage(page);

    await login.goto();
    await login.login(admin.email, 'definitely-the-wrong-password', getTestCentre());

    await login.expectInvalidCredentials();
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('field validation', () => {
    test('submitting with no centre selected shows "Please select a centre"', async ({ page }) => {
      const admin = getTestUser('admin');
      const login = new LoginPage(page);

      await login.goto();
      await login.fillCredentials(admin.email, admin.password);
      await login.submit();

      await login.expectValidationError('Please select a centre');
    });

    test('an invalid email format shows "Enter a valid email"', async ({ page }) => {
      const login = new LoginPage(page);

      await login.goto();
      await login.selectCentre(getTestCentre());
      await login.fillCredentials('not-an-email', 'somepassword');
      await login.submit();

      await login.expectValidationError('Enter a valid email');
    });

    test('a password under 6 characters shows "Password must be at least 6 characters"', async ({ page }) => {
      const admin = getTestUser('admin');
      const login = new LoginPage(page);

      await login.goto();
      await login.selectCentre(getTestCentre());
      await login.fillCredentials(admin.email, 'ab1');
      await login.submit();

      await login.expectValidationError('Password must be at least 6 characters');
    });
  });

  test('EDGE-007: rapid double-click of Sign In does not fire a duplicate login request', async ({ page }) => {
    const admin = getTestUser('admin');
    const login = new LoginPage(page);
    await login.goto();
    await login.selectCentre(getTestCentre());
    await login.fillCredentials(admin.email, admin.password);

    const loginRequests: number[] = [];
    page.on('request', (req) => {
      if (req.url().includes('/auth/login') && req.method() === 'POST') loginRequests.push(Date.now());
    });

    await Promise.all([login.signInButton.click(), login.signInButton.click({ force: true }).catch(() => {})]);
    await login.expectLoggedInRedirect();

    expect(loginRequests.length).toBeLessThanOrEqual(1);
  });

  test('EDGE-013: logout then Back does not reveal stale protected content', async ({ page }) => {
    const admin = getTestUser('admin');
    const login = new LoginPage(page);
    const topbar = new TopbarPage(page);

    await login.goto();
    await login.login(admin.email, admin.password, getTestCentre());
    await login.expectLoggedInRedirect();

    await topbar.logout('Admin');
    await expect(page).toHaveURL(/\/login/);

    await page.goBack();
    await expect(page).toHaveURL(/\/login/);
  });

  test.describe('role-gated routes (BR-16)', () => {
    test('staff hitting /users or /reports directly is silently redirected to /dashboard', async ({ staffPage }) => {
      await staffPage.goto('/users');
      await expect(staffPage).toHaveURL(/\/dashboard/);

      await staffPage.goto('/reports');
      await expect(staffPage).toHaveURL(/\/dashboard/);
    });

    test('admin can reach /users and /reports directly', async ({ adminPage }) => {
      await adminPage.goto('/users');
      await expect(adminPage).toHaveURL(/\/users/);

      await adminPage.goto('/reports');
      await expect(adminPage).toHaveURL(/\/reports/);
    });
  });

  test.describe('API-level (no browser)', () => {
    test('POST /auth/login returns 200 + accessToken for valid credentials', async () => {
      const client = await ApiClient.create();
      const admin = getTestUser('admin');
      const body = await client.loginAndStoreToken(admin.email, admin.password);

      expect(body.accessToken).toBeTruthy();
      expect(body.user.email).toBe(admin.email);
      await client.dispose();
    });

    test('POST /auth/login returns 401 for invalid credentials', async () => {
      const client = await ApiClient.create();
      const admin = getTestUser('admin');
      const res = await client.login(admin.email, 'definitely-the-wrong-password');

      expect(res.status()).toBe(401);
      await client.dispose();
    });
  });
});
