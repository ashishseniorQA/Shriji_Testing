# tests/ui-validation/

UI correctness checks that are independent of business logic — the page should *look* and
*behave* right regardless of what data is on it.

- [visual-regression/](visual-regression/) — Playwright screenshot comparisons
  (`expect(page).toHaveScreenshot()`) for key pages/components. Baseline images are
  environment-specific; document how baselines are updated in this folder once the first spec
  is added.
- [accessibility/](accessibility/) — WCAG 2.1 AA checks (use `@axe-core/playwright`). Mirrors
  the checklist in `skills/qa-digest.md` Step 6.7.
- [responsive/](responsive/) — viewport/breakpoint checks using the device matrix in the root
  `CLAUDE.md` (Desktop 1280x720, Tablet 768x1024, Mobile 375x812).

Runs nightly or on PRs that touch shared UI components — not required on every commit.
