# config/

Non-secret environment configuration. Real credentials/tokens are never committed — only
`.example` templates live here; actual values go in a local, gitignored `.env`.

| File | Purpose |
|---|---|
| [environments/staging.env.example](environments/staging.env.example) | Staging environment template — default target for all test runs. |
| [environments/production.env.example](environments/production.env.example) | Production template — **read-only smoke checks only**, see warning inside the file. |

## Environment policy

- **Default test target is staging/testing.** Never assume production unless the user explicitly
  says so for a given session.
- **No write operations against production, ever**, per the project's `CLAUDE.md` rules — no
  form submissions, no data creation/updates/deletes, no destructive actions.
- Before any test session, confirm with the user: target URL, environment name, and whether
  credentials are already set in `.env` or need to be provided at runtime.
