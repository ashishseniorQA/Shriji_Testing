import { Page, Locator, expect } from '@playwright/test';

/**
 * Shared behavior for every page object. The app has no `data-testid` attributes
 * anywhere (confirmed against FE source) — every locator in this framework is built
 * from MUI-rendered accessible labels, placeholders, button/role text, or scoped text
 * matches, per the selector priority in utils/README.md (data-testid > aria/role > id >
 * stable class > CSS fallback), skipping the data-testid tier since it doesn't exist here.
 */
export abstract class BasePage {
  constructor(protected readonly page: Page) {}

  /** Snackbar toasts (`GlobalSnackbar`) only mount inside `MainLayout` — never on auth pages. */
  async expectToast(text: string | RegExp) {
    await expect(this.page.getByText(text).first()).toBeVisible();
  }

  /** Inline `Alert severity="error"` used on auth pages and most dialogs. */
  get inlineAlert(): Locator {
    return this.page.locator('[role="alert"]').first();
  }

  async expectInlineAlert(text: string | RegExp) {
    await expect(this.inlineAlert).toContainText(text);
  }

  /**
   * Nav items, topbar chips, and MUI Select trigger boxes in this app are plain
   * `<div>`s with no semantic role — matched by their own exact text content, not by
   * accessible role. `.first()` guards against transient duplicate renders.
   */
  exactText(text: string): Locator {
    return this.page
      .locator('div, p, span, button')
      .filter({ hasText: new RegExp(`^${escapeRegExp(text)}$`) })
      .first();
  }

  async expectFieldError(message: string) {
    await expect(this.page.getByText(message, { exact: false }).first()).toBeVisible();
  }

  /**
   * Form field labels are rendered via a shared `FieldLabel` component
   * (`<Typography>{label}{required && <Box> *</Box>}</Typography>`) — required
   * fields' rendered text is literally "Label *", not "Label". This matches either
   * form so the same helper works for required and optional fields alike.
   */
  labelText(label: string): Locator {
    return this.page.getByText(new RegExp(`^${escapeRegExp(label)}(\\s*\\*)?$`));
  }

  /**
   * Finds the `<input>` that immediately follows a `FieldLabel` in document order —
   * used when a field's placeholder is ambiguous/shared with other fields (e.g. both
   * "Mobile" and "Father's Mobile" use the same placeholder text).
   */
  fieldFollowingLabel(label: string): Locator {
    return this.labelText(label).locator('xpath=following::input[1]');
  }

  /**
   * Deposit Date / DD Date are `@mui/x-date-pickers` fields — a segmented Month/Day/Year
   * control (`<span role="spinbutton" contenteditable="true">`), NOT a native
   * `<input type="date">`. Confirmed live 2026-07-08 via a standalone debug script
   * (real fresh login, not a stale session): a plain `fieldFollowingLabel().fill(...)`
   * grabs an unrelated `<input>` and no-ops silently; even `dateSegmentFollowingLabel()
   * .fill(...)` — targeting the *correct* Month span — still silently no-ops, because
   * `.fill()` only works via the native `value` setter / a real `[contenteditable]`
   * text-replace path, and this `contenteditable` span is driven entirely by keydown
   * handlers (MUI X's own segment-advance logic), not by DOM value mutation. Only
   * `.pressSequentially()` (real simulated keystrokes) is observed to work — confirmed
   * live: typing "MMDDYYYY" into the focused Month segment fills Month, auto-advances
   * to Day, then Year.
   */
  dateSegmentFollowingLabel(label: string): Locator {
    return this.labelText(label).locator('xpath=following::*[@role="spinbutton"][1]');
  }

  async fillDateField(label: string, isoDate: string) {
    const [year, month, day] = isoDate.split('-');
    const monthSegment = this.dateSegmentFollowingLabel(label);
    await monthSegment.click();
    await monthSegment.pressSequentially(`${month}${day}${year}`);
  }
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
