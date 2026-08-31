# utils/

Shared automation code. If more than one spec needs it, it belongs here — not copy-pasted.

- [page-objects/](page-objects/) — one class/module per page or major component, encapsulating
  selectors and interactions. Selectors should come from `docs/qa-digest/` when available,
  following the selector priority: `data-testid` > aria/role > `id` > stable class > CSS fallback.
- [api-clients/](api-clients/) — thin wrappers around Playwright's `request` context (or a DB
  client for `tests/db-validation/`) that handle auth headers, base URLs, and common
  request/response shapes.
- [helpers/](helpers/) — generic utilities: date/currency formatting matchers, wait strategies
  for known flaky patterns (see `skills/qa-digest.md` Step 11.5), test-account provisioning.
- [custom-assertions/](custom-assertions/) — Playwright custom matchers (`expect.extend`) for
  domain-specific assertions (e.g. `expect(feeRecord).toHaveCorrectlyRoundedAmount()`).

## Rule

A page object or helper is reviewed like production code — if it's flaky or has a bad selector,
every spec using it inherits the problem. Treat this folder with at least the same rigor as
`tests/`.
