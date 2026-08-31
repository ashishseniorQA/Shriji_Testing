# tests/api/playwright-api/

Functional API tests using Playwright's `request` fixture — run in the same CI job and Allure
report as the UI suites.

Suggested spec split:
- `auth-api.spec.ts` — login/logout/token refresh endpoints
- `fee-api.spec.ts` — fee CRUD + calculation endpoints
- `workflow-api.spec.ts` — approval state transition endpoints
- `payment-api.spec.ts` — payment posting endpoints

Use `utils/api-clients/` for request wrappers so auth headers and base URLs aren't repeated
per spec.
