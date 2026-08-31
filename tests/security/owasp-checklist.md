# OWASP-Aligned Manual Security Checklist

Run before each release and whenever auth/permissions change. Automate items into
`auth-and-access/` or `input-validation/` as coverage matures — check them off here in the
meantime as manually verified.

| Category | Check | Status | Notes |
|---|---|---|---|
| Authentication | Auth bypass via direct URL access | ☐ | |
| Authentication | Session fixation | ☐ | |
| Authentication | Token expiration handled correctly | ☐ | |
| Authorization | Horizontal privilege escalation (user A sees user B's fee records) | ☐ | |
| Authorization | Vertical privilege escalation (non-approver approves a fee) | ☐ | |
| Data Exposure | Sensitive data (fee amounts, PII) in URL params | ☐ | |
| Data Exposure | API response over-fetching (extra fields not needed by UI) | ☐ | |
| Data Exposure | Sensitive data in localStorage/console logs | ☐ | |
| Input | XSS via form fields (especially notes/comments on fee records) | ☐ | |
| Input | SQL/NoSQL injection patterns | ☐ | |
| Transport | HTTPS enforced everywhere | ☐ | |
| Transport | Cookies flagged HttpOnly + Secure | ☐ | |
| Transport | CORS configuration restricts to known origins | ☐ | |
| Headers | Content-Security-Policy present | ☐ | |
| Headers | X-Frame-Options set | ☐ | |
| API | Rate limiting on auth and fee-mutation endpoints | ☐ | |
| API | No open redirects | ☐ | |
| Audit | Every fee approval/rejection/payment action is attributable and immutable in the audit trail | ☐ | |

The last row (**Audit**) is domain-specific to a Fee Management Workflow System — financial
approval systems must have a tamper-evident audit trail; verify it can't be edited or deleted
after the fact, even by an admin role.
