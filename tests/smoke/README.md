# tests/smoke/

Minimal "is it even up" checks — the fastest suite, runs first on every deploy before anything
else. If smoke fails, stop and don't bother running the rest.

Suggested coverage (keep this suite small — a handful of specs, seconds not minutes):
- App loads, no console errors on initial paint
- Login succeeds with a known-good test account
- Dashboard/landing page renders after login
- One core API health check (e.g. `GET /api/health` or equivalent)

Do not add feature-depth coverage here — that belongs in `tests/e2e/` or `tests/regression/`.
