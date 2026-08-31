# docs/qa-digest/

Output destination for the `skills/run-qa-digest.md` launcher and its templates
(`skills/qa-digest.md` full, `skills/qa-digest-lite.md` quick scan).

Expected files per app/scope analyzed:
- `<app>-qa-digest.md` — full digest (Steps 0-11.5)
- `<app>-playwright.md` — Playwright code templates (Step 12)
- `<app>-test-data.json` — structured test data catalog (Step 4)
- `<app>-api-map.json` — structured API endpoint map (Step 6)
- `<app>-quick-scan.md` — quick-scan output (Lite scope)
- `<app>-<module>-analysis.md` — single-module deep dive

Treat these as living documents — if a QA session or test run discovers a new page, selector,
or endpoint, append it to the relevant file rather than letting the digest go stale.
