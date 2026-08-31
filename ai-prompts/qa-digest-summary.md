# Prompt: QA Digest Executive Summary

## Purpose
Compress a full `docs/qa-digest/<app>-qa-digest.md` (13-step output, often very long) into a
short summary for stakeholders who won't read the whole digest.

## Inputs
- `{{DIGEST_PATH}}` — path to the full digest file

## Prompt

```
You are a Senior QA Architect. Read {{DIGEST_PATH}} in full and produce an executive summary
for engineering leads and release managers, not for QA engineers (they'll read the full digest).

Include, in this order:
1. App scope in 2-3 sentences (what it does, who uses it, SPA/MPA, auth model)
2. Total pages / modules discovered, and how many are behind role restrictions
3. Top 5 highest-risk areas (pull from Step 8 "High-risk areas" and Step 10 coverage map's
   risk ratings) and why they're risky
4. Current automation coverage snapshot (from Step 10/11): what % of scenarios are P0/P1 and
   automated vs not
5. Top 3 security/accessibility findings from Steps 6.6/6.7 that need follow-up
6. One paragraph recommendation: what to test manually before next release vs what's safely
   automated

Keep it under 400 words. No raw tables — prose and short bullet lists only.
```

## Expected output format
Plain prose + bullets, <400 words, no markdown tables (this is for a leadership audience).
