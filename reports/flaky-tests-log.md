# Flaky Tests Log

**Added beyond the original requirements list** — tracking flakiness explicitly prevents the
slow death of a test suite where "just re-run it" quietly becomes normal and real failures get
ignored along with the noise.

| Spec | First observed | Occurrences | Suspected cause | Status | Owner |
|---|---|---|---|---|---|
| | | | | Investigating / Fixed / Quarantined | |

## Process

1. A test that fails without a corresponding product defect gets logged here on its **second**
   intermittent failure (one-offs happen; patterns matter).
2. Check `skills/qa-digest.md` Step 11.5 for known flakiness patterns (animations, lazy loading,
   toasts) before assuming it's a new issue.
3. If not fixed within a sprint, quarantine (skip in CI, keep running locally/nightly) rather
   than letting it block every PR indefinitely — but quarantined tests must stay visible here,
   not silently disabled.
