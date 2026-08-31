import { test, expect } from '@utils/fixtures';
import { LoginPage } from '@utils/page-objects/login.page';
import { DashboardPage } from '@utils/page-objects/dashboard.page';
import { getTestUser, getTestCentre } from '@test-data/fixtures/users';

/**
 * "Is it even up" — fastest suite, runs first before anything else. Read-only: no
 * admissions/installments are created here. If this fails, stop — don't bother
 * running the rest (tests/smoke/README.md).
 */
test.describe('App health @smoke', () => {
  test('the login page loads with no console errors and the centre list populates', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    const login = new LoginPage(page);
    await login.goto();

    await expect(login.emailInput).toBeVisible();
    await expect(login.passwordInput).toBeVisible();
    await expect(login.signInButton).toBeVisible();
    await login.centreSelect.click();
    await expect(page.getByRole('option', { name: getTestCentre(), exact: true })).toBeVisible();
    await page.keyboard.press('Escape');

    expect(consoleErrors, `Unexpected console errors on initial paint: ${consoleErrors.join('; ')}`).toEqual([]);
  });

  test('login succeeds with the known-good admin test account and the dashboard renders', async ({ page }) => {
    const admin = getTestUser('admin');
    const login = new LoginPage(page);
    const dashboard = new DashboardPage(page);

    await login.goto();
    await login.login(admin.email, admin.password, getTestCentre());

    await login.expectLoggedInRedirect();
    await dashboard.expectLoaded();
  });

  test('the shared adminPage fixture (used throughout every other suite) logs in and loads the dashboard', async ({
    adminPage,
  }) => {
    // Deliberately NOT storageState reuse — see utils/fixtures/auth.fixtures.ts for
    // why (the refresh token is single-use/rotating; a shared snapshot cannot be
    // safely reused across the many tests that need this fixture).
    const dashboard = new DashboardPage(adminPage);
    await dashboard.goto();
    await dashboard.expectLoaded();
  });

  test('a core API endpoint responds (GET /centres)', async ({ request }) => {
    const baseURL = process.env.API_BASE_URL;
    const res = await request.get(`${baseURL}/centres`);
    // Unauthenticated — expect a clean 401, not a 5xx/crash. Confirms the API itself is up.
    expect(res.status(), 'API should be reachable and return an auth error, not a server error').toBeLessThan(500);
  });
});
