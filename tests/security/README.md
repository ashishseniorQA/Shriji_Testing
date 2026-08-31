# tests/security/

Security-focused testing, aligned with the checks in `skills/qa-digest.md` Step 6.6.

- [auth-and-access/](auth-and-access/) — auth bypass via direct URL access, session
  fixation/expiry, role-based authorization (horizontal and vertical privilege escalation —
  especially important for a Fee Management system where roles gate approval authority).
- [input-validation/](input-validation/) — XSS, SQL/NoSQL injection patterns, input
  sanitization on all form fields, especially fee-amount and free-text fields.
- [owasp-checklist.md](owasp-checklist.md) — manual checklist for items that aren't (yet)
  automated: headers, CORS, transport security, rate limiting.

## Rules

- These tests run against **staging only**, never production, per the root `CLAUDE.md`.
- Any confirmed finding gets an entry in `docs/issue-tracker/issues-log-template.csv` with
  severity escalated per `docs/issue-tracker/severity-priority-matrix.md` — auth/authz and
  financial-data findings are never "Minor."
