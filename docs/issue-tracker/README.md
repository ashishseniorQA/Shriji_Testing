# docs/issue-tracker/

Lightweight, Excel-compatible issue tracking that doesn't require a separate tool.

- [issues-log-template.csv](issues-log-template.csv) — the issue log. Open directly in Excel/
  Google Sheets, or duplicate per release (`issues-log-2026-q3.csv`) if you want per-release
  history instead of one running log with a "Release" column — pick one convention and stay
  consistent.
- [severity-priority-matrix.md](severity-priority-matrix.md) — shared definitions so severity/
  priority classification is consistent across the team (and across AI-assisted triage — see
  `ai-prompts/bug-triage-and-rca.md`).
- [traceability-matrix.md](traceability-matrix.md) — maps requirements/features to test cases
  to automation status, so coverage gaps are visible at a glance.

**If your organization already has Jira/Linear/Azure DevOps**, this CSV is a lightweight
fallback or a QA-local working copy — not a replacement for the system of record. State which
one is authoritative in a note at the top of the CSV once decided.
