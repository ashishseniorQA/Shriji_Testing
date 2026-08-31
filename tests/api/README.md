# tests/api/

API-level testing for the Node.js backend, split by tool/purpose:

- [postman/](postman/) — collection-based contract and exploratory testing. Good for manual runs,
  quick contract verification, and sharing with backend engineers who don't run Playwright.
- [playwright-api/](playwright-api/) — functional API tests using Playwright's `request` context,
  integrated into the same CI run and reporting pipeline as the UI suites.

## When to use which

| Need | Use |
|---|---|
| Quick manual check / share with backend team | Postman |
| CI-gated functional test, same pipeline as E2E | Playwright API |
| Schema/contract validation against OpenAPI spec | Postman (or add a schema-validation spec under `playwright-api/`) |

Pull endpoint list, payload shapes, and auth requirements from
`docs/qa-digest/<app>-api-map.json` (produced by the QA Digest skill) rather than re-discovering
them via manual exploration.
