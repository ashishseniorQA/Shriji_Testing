# Run QA Digest — Launcher

This skill launches a QA Digest analysis session. It collects inputs, selects the right template, and starts execution.

---

## Step 1 — Collect Inputs

Ask the user for:

1. **Application URL** (required)
   - e.g., https://testing.example.com/

2. **Credentials** (if app requires login)
   - Username / Email
   - Password
   - MFA: Yes / No

3. **Scope** (required — pick one):
   | Scope | What it does | Template |
   |-------|-------------|----------|
   | **Quick Scan** | Auth + App overview + Pages + Top elements (15 min) | qa-digest-lite.md |
   | **Full Digest** | All 13 steps — complete QA blueprint (60+ min) | qa-digest.md |
   | **Single Module** | Full analysis of one specific module/page | qa-digest.md (partial) |

4. **Target module** (only if scope = Single Module)
   - e.g., "Login page", "Projects", "Settings"

5. **Output location** (default: `<project>/docs/qa-digest/`)

---

## Step 2 — Validate

Before starting, confirm:
- [ ] URL is accessible (navigate and check)
- [ ] Credentials work (login and verify redirect)
- [ ] Playwright MCP is connected
- [ ] Output folder exists or can be created

If any check fails, STOP and report the issue.

---

## Step 3 — Execute

Based on scope:

**Quick Scan:**
1. Follow qa-digest-lite.md steps 0-3
2. Output: `<app>-quick-scan.md`

**Full Digest:**
1. Follow qa-digest.md steps 0-13
2. Track progress per step (completed / in-progress / pending)
3. Output: `<app>-qa-digest.md` + `<app>-playwright.md` + `<app>-test-data.json` + `<app>-api-map.json`

**Single Module:**
1. Login (Step 0)
2. Navigate to target module
3. Run Steps 3, 4, 5, 6, 9 for that module only
4. Output: `<app>-<module>-analysis.md`

---

## Step 4 — Report

After completion, provide a summary:

```
QA Digest Complete
------------------
App: [name]
URL: [url]
Scope: [Quick Scan / Full / Single Module]
Pages analyzed: [count]
Elements captured: [count]
Test scenarios generated: [count]
Files created: [list]
Duration: [time]
```

---

## Resume Support

If interrupted mid-execution:
- Check which step was last completed
- Ask user: "Resume from Step X or start over?"
- Continue from the incomplete step
