# tests/api/postman/

Postman collections and environments for manual/exploratory API contract testing.

- [collections/](collections/) — exported `.postman_collection.json` files, one per API domain
  (e.g. `fee-management.postman_collection.json`, `auth.postman_collection.json`).
- [environments/](environments/) — exported `.postman_environment.json` files
  (`staging.postman_environment.json`, etc.) — **never export an environment with real secret
  values populated**; use Postman variables and fill secrets locally/via vault.

## Conventions

- Name collections by API domain, not by tester or date.
- Every request should have at least one assertion in its **Tests** tab (status code + key
  response fields) so the collection can double as a CI check via `newman` if needed later.
- Keep collections in sync with `docs/qa-digest/<app>-api-map.json` — if an endpoint changes,
  update both.
