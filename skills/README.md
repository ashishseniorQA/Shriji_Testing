# skills/ — Claude Code Skills

Multi-step, resumable AI workflows invoked via Claude Code. These are referenced directly by the
root `CLAUDE.md` and by Playwright MCP-driven sessions.

| File | Purpose |
|---|---|
| [run-qa-digest.md](run-qa-digest.md) | Launcher — collects inputs (URL, credentials, scope), validates access, dispatches to the right template below. |
| [qa-digest.md](qa-digest.md) | Full 13-step QA Digest blueprint (~60+ min). Produces a complete, machine-parseable knowledge base of the app under test: pages, selectors, API map, test data catalog, security/a11y/performance checks, BDD scenarios, Playwright code templates. |
| [qa-digest-lite.md](qa-digest-lite.md) | Quick 4-step scan (~15 min) for a first look at an unfamiliar app or a fast pre-release smoke check. |

## Output

All digest output lands in [`docs/qa-digest/`](../docs/qa-digest/), per the `OUTPUT STRUCTURE`
section of `qa-digest.md`.

## Adding a new skill

- One file per skill, named for what it *does* (`verb-noun.md`), not the tool it wraps.
- State required inputs, execution steps, and exact output file paths at the top.
- If the skill can be interrupted mid-run, document resume behavior explicitly (see
  `run-qa-digest.md` → "Resume Support" for the pattern).
