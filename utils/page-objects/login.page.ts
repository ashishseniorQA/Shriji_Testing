import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

/**
 * `/login` — src/pages/auth/LoginPage.tsx (GuestRoute → AuthLayout).
 * Centre is a MUI `Select` (no native `label` prop — labeled by a sibling Typography
 * "Centre"), Email/Password are plain `TextField`s with `placeholder` only. Selectors
 * below are grounded directly in the FE source, not inferred from the rendered DOM.
 */
export class LoginPage extends BasePage {
  readonly centreSelect: Locator;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly signInButton: Locator;
  readonly showPasswordToggle: Locator;

  constructor(page: Page) {
    super(page);
    // MUI auto-generates `id="mui-component-select-{name}"` on the Select trigger when
    // rendered via `<Select {...field} ...>` (react-hook-form Controller spread) —
    // confirmed live (2026-07-07): renders as `aria-disabled="true"` with visible text
    // "Loading centres..." until `GET /centres` resolves, then becomes clickable.
    this.centreSelect = page.locator('#mui-component-select-centreId');
    this.emailInput = page.getByPlaceholder('you@company.com');
    this.passwordInput = page.getByPlaceholder('••••••••');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.showPasswordToggle = page.getByRole('button', { name: /show password|hide password/i });
  }

  async goto() {
    await this.page.goto('/login');
  }

  /**
   * Centre select is a MUI Select (Controller-driven), disabled with `aria-disabled`
   * (not the native `disabled` attribute, so Playwright's own actionability checks
   * don't wait for it automatically) while `GET /centres` is in flight — confirmed
   * live. Once a centre is chosen, `renderValue` no longer shows the placeholder text.
   */
  async selectCentre(centreName: string) {
    await expect(this.centreSelect).not.toHaveAttribute('aria-disabled', 'true');
    await this.centreSelect.click();
    await this.page.getByRole('option', { name: centreName, exact: true }).click();
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
  }

  async submit() {
    await this.signInButton.click();
  }

  async login(email: string, password: string, centre: string) {
    await this.selectCentre(centre);
    await this.fillCredentials(email, password);
    await this.submit();
  }

  async expectLoggedInRedirect() {
    await expect(this.page).toHaveURL(/\/dashboard/);
  }

  /** Wrong email/password — live-verified exact copy, `Alert severity="error"`. */
  async expectInvalidCredentials() {
    await this.expectInlineAlert('Invalid email or password');
  }

  /** Digest §0 / LoginPage.tsx error-code branch, verbatim. */
  async expectAccountPending() {
    await this.expectInlineAlert(
      `Your account isn't activated yet. Use the "Set your password" link in your invite email.`,
    );
  }

  /** Digest §0 / LoginPage.tsx error-code branch, verbatim. */
  async expectAccountInactive() {
    await this.expectInlineAlert('Your account has been deactivated. Contact an administrator.');
  }

  async expectValidationError(message: string) {
    await this.expectFieldError(message);
  }
}
