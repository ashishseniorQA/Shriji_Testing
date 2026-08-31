# tests/e2e/

Full browser-driven user journeys via Playwright, exercising the React frontend against a real
(staging) backend — not mocked.

- [critical-flows/](critical-flows/) — release-gating journeys: login, fee calculation,
  approval workflow, payment posting. Must pass before any deploy.
- [generic-flows/](generic-flows/) — everything else: settings, profile, notifications,
  low-risk navigation. Runs nightly, doesn't block a release on its own.

## Adding a flow

1. Confirm whether it's release-gating (affects fee accuracy, approvals, audit trail, auth) —
   if yes, it goes in `critical-flows/`, and should also get a corresponding entry in
   `tests/regression/critical/`.
2. Use selectors and step sequences from `docs/qa-digest/` if a digest already exists for this
   app — don't re-discover selectors from scratch.
3. Use `utils/page-objects/` for any page interacted with by more than one flow.
