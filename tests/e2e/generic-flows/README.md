# tests/e2e/generic-flows/

Lower-risk journeys that don't gate a release: profile/settings management, notifications,
search/filter UX, non-critical navigation. Runs nightly.

Add one spec file per flow: `<flow-name>.spec.ts`. If a "generic" flow turns out to touch fee
calculation, approvals, or audit data, move it to
[`../critical-flows/`](../critical-flows/) instead.
