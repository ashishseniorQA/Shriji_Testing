# Severity & Priority Matrix

**Added beyond the original requirements list** — without a shared definition, "Critical" means
something different to every reporter, which makes triage inconsistent and slows release
decisions. This is referenced by `ai-prompts/bug-triage-and-rca.md` so AI-assisted triage stays
consistent with human triage.

## Severity — how bad is the defect itself

| Severity | Definition | Example (Fee Management domain) |
|---|---|---|
| Blocker | Core workflow completely unusable, or data corruption | Fee approval workflow cannot complete for any record |
| Critical | Incorrect financial outcome, security/authz bypass, or audit trail gap | Fee amount calculated incorrectly; user approves their own fee request |
| Major | Feature broken but workaround exists, no financial/security impact | Filter on fee list doesn't work but manual search does |
| Minor | Cosmetic or low-impact functional issue | Misaligned button, non-blocking console warning |
| Trivial | Copy/typo, no functional impact | Label text typo |

## Priority — how soon it must be fixed

| Priority | Definition |
|---|---|
| P0 | Fix immediately, blocks release |
| P1 | Fix before next release |
| P2 | Fix within the next 2-3 releases |
| P3 | Fix when convenient / backlog |

## Auto-escalation rules

Regardless of how "small" a defect looks on the surface, escalate to at least **Critical / P0**
if it involves any of:
- Incorrect fee/financial calculation (even by a rounding cent)
- A way to approve, reject, or post a payment without proper authorization
- An audit trail entry that is missing, incorrect, or editable after the fact
- Any bypass of authentication or role-based access control
- Data corruption or loss, on any environment
