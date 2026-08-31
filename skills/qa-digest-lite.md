# QA DIGEST LITE — Quick Exploratory Analysis

*(Fast scan — Steps 0 to 3 only. Use full qa-digest.md for complete coverage.)*

---

## REQUIRED INPUT

```
Website URL: {{APPLICATION_URL}}
```

---

## STEP 0 — AUTHENTICATION

1. Navigate to the URL
2. Detect if login is required

IF login required, ask user for:
- Username
- Password
- Environment (staging / prod / dev / testing)

STOP until credentials are provided.

After login, capture:

| Property | Value |
|----------|-------|
| Login Page URL | |
| Auth Type | Form / OAuth / SSO |
| Token Type | JWT / Session / Cookie |
| Token Storage | localStorage / sessionStorage / cookie |
| Post-login Redirect | |

---

## STEP 1 — APP OVERVIEW

Capture:

| Property | Value |
|----------|-------|
| Application Name | |
| Base URL | |
| Framework | |
| Bundler | |
| SPA / MPA | |
| UI Library | |

Detection: Check root element keys, script src patterns, meta tags.

---

## STEP 2 — PAGE DISCOVERY

Explore all navigation items and capture:

| # | Page Name | URL | Requires Auth | Key Features |
|---|-----------|-----|---------------|-------------|

Also output page hierarchy:
```
/ (root)
├── /page-1
├── /page-2
│   ├── /page-2/sub
```

---

## STEP 3 — ELEMENT INVENTORY (Top pages only)

For the **top 5 most important pages**, capture interactive elements:

| Page | Element | Type | Selector | Default State | Wait Required |
|------|---------|------|----------|---------------|---------------|

Selector priority: data-testid → aria/role → id → stable class → CSS fallback

---

## OUTPUT

Single file: `<app>/docs/qa-digest/<app>-quick-scan.md`

Include all tables above with a summary:
- Total pages found
- Total interactive elements captured
- Key observations (broken links, console errors, missing labels)
- Recommendation: which pages need full qa-digest analysis

---

## WHEN TO USE THIS vs FULL DIGEST

| Use Lite When | Use Full When |
|--------------|---------------|
| First look at an unfamiliar app | Building complete test coverage |
| Quick smoke check before a release | Setting up automation suite |
| Evaluating scope of QA effort | Creating test data catalog |
| Exploring a single module | Full security/a11y/performance audit |
