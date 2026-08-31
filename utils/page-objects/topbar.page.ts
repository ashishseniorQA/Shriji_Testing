import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base.page';

export type NavLabel = 'Dashboard' | 'Users' | 'Admission' | 'Installments' | 'Reports' | 'Settings';

/**
 * `src/components/layout/Topbar.tsx` — the app has no sidebar (`Sidebar.tsx` is a
 * deliberate no-op, "layout uses top-nav only per Figma design"). Nav items, the
 * centre/session chips, and the profile-menu trigger are all plain `Box`es with no
 * semantic role/aria-label — matched here by their own exact rendered text via
 * `BasePage.exactText`, mirroring the pattern already proven live via Playwright MCP
 * during manual QA (`div[hasText: /^Installments$/]`).
 */
export class TopbarPage extends BasePage {
  constructor(page: Page) {
    super(page);
  }

  navItem(label: NavLabel): Locator {
    return this.exactText(label);
  }

  async goToNav(label: NavLabel) {
    await this.navItem(label).click();
  }

  /** Admin-only items (`adminOnly: true` in NAV_ITEMS) — Users, Reports. */
  async expectNavItemVisible(label: NavLabel) {
    await expect(this.navItem(label)).toBeVisible();
  }

  async expectNavItemAbsent(label: NavLabel) {
    await expect(this.navItem(label)).toHaveCount(0);
  }

  /**
   * Profile menu trigger has no stable text of its own except the role label
   * (`role.charAt(0).toUpperCase() + role.slice(1)` — "Admin"/"Staff"), which is
   * deterministic regardless of the account's actual display name.
   */
  async openProfileMenu(role: 'Admin' | 'Staff') {
    await this.exactText(role).click();
  }

  async logout(role: 'Admin' | 'Staff') {
    await this.openProfileMenu(role);
    await this.page.getByRole('menuitem', { name: 'Logout' }).click();
  }

  /**
   * No accessible name/testid on the bell trigger `Box`. Scoped out of phase-1 critical
   * flows (Auth/Admission/Installment/Payment/GST) — revisit with a concrete locator
   * when Notifications automation is picked up in a later phase.
   */
  get notificationBell(): Locator {
    return this.page.locator('[class*="Mui-notification"], [aria-label*="notification" i]').first();
  }
}
