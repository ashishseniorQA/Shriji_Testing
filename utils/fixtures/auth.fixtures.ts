import { test as base, Page, BrowserContext } from '@playwright/test';
import { LoginPage } from '../page-objects/login.page';
import { getTestUser, getTestCentre, Role } from '@test-data/fixtures/users';

interface RoleFixtures {
  /** A fresh page, in a worker-scoped session already logged in as admin. */
  adminPage: Page;
  /** A fresh page, in a worker-scoped session already logged in as staff. */
  staffPage: Page;
}

interface WorkerRoleFixtures {
  adminContext: BrowserContext;
  staffContext: BrowserContext;
}

/**
 * Auth strategy, in order of what was tried and why each was rejected:
 *
 * 1. Share one `storageState` snapshot across every test (the QA digest's original
 *    Automation Readiness suggestion). REJECTED — live-confirmed 2026-07-08: the
 *    refresh token is single-use/rotating. A captured snapshot can be consumed by
 *    exactly ONE additional browser context; reusing it a second time (even
 *    sequentially, even within one worker) redirects to `/login`, since the first
 *    consumer's bootstrap `POST /auth/refresh` already rotated it server-side.
 *
 * 2. Fresh real UI login in every single test. REJECTED — live-confirmed 2026-07-08:
 *    running the full suite (~40 tests) at normal parallelism fired that many fresh
 *    logins in under 3 minutes, and a meaningful fraction started failing (including
 *    the ADMIN account, not just the already-broken staff one) with the same
 *    redirect-to-`/login` symptom. Most likely explanation is backend rate-limiting on
 *    the login endpoint — a real security control (see
 *    tests/security/owasp-checklist.md's "Rate limiting on auth... endpoints" row),
 *    not a bug, but one this framework must not trip on every run.
 *
 * 3. **One real login per WORKER, kept as a single live `BrowserContext` reused for
 *    that worker's entire lifetime** (this file's actual approach). Each test gets its
 *    own `Page` inside that shared context, not a new context. This is safe against
 *    single-use-refresh-token rotation — unlike approach 1, we never recreate a
 *    context from a stale captured snapshot; the ONE live context's cookies rotate
 *    forward naturally as Playwright's own network stack updates them after every
 *    request; and it caps total login volume at (worker count), not (test count),
 *    avoiding the rate-limit trigger from approach 2.
 *
 *    Residual issue, also live-confirmed 2026-07-08: at the default worker count, all
 *    workers still start within the same second, so even (worker count) logins can
 *    land in one rate-limit window — a worker whose ONE login attempt gets rejected
 *    has no way to recover (Playwright caches a failed worker-scoped fixture for that
 *    worker's whole lifetime; every test scheduled to it then fails near-instantly on
 *    the same cached error, distinguishable in a run's output by their sub-second
 *    durations vs. the usual several-second real-browser durations). A few retries
 *    with backoff inside the login itself absorbs this without masking a genuinely
 *    broken account (e.g. staff's centre-assignment issue below still exhausts all
 *    retries and fails loudly, as it should).
 *
 *    Second-order issue, also live-confirmed 2026-07-08: staff's failure is NOT
 *    transient (it's the known centre-assignment issue — LV-... ISSUE_001-adjacent —
 *    not rate-limiting), so retrying it 3x with backoff only spends time it will never
 *    recover from, and was observed to blow past the worker-scoped fixture's 30s setup
 *    timeout. That timeout appears to tear down the whole worker process — silently
 *    killing its `adminContext` too, so unrelated admin-based tests scheduled to the
 *    same worker started failing with "Target page, context or browser has been
 *    closed." Retries are now sized per role: `admin` gets the full 3 attempts (its
 *    failures are transient rate-limiting); `staff` gets 1 (its failure is a known,
 *    persistent account problem — failing fast avoids poisoning its worker's other
 *    fixtures). Once the backend centre assignment is fixed, staff should get full
 *    retries too — bump `STAFF_RETRY_ATTEMPTS` back to 3 at that point.
 */
const ADMIN_RETRY_ATTEMPTS = 3;
const STAFF_RETRY_ATTEMPTS = 1;

async function createRoleContext(browser: import('@playwright/test').Browser, role: Role): Promise<BrowserContext> {
  const user = getTestUser(role);
  const maxAttempts = role === 'admin' ? ADMIN_RETRY_ATTEMPTS : STAFF_RETRY_ATTEMPTS;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    // `baseURL` is a test-scoped option in @playwright/test's built-in fixtures — a
    // worker-scoped fixture can't depend on it, so read the same underlying env var
    // directly (identical value, and genuinely static across the whole run either way).
    const context = await browser.newContext({ baseURL: process.env.BASE_URL });
    const page = await context.newPage();
    const loginPage = new LoginPage(page);

    try {
      await loginPage.goto();
      await loginPage.login(user.email, user.password, getTestCentre());
      await loginPage.expectLoggedInRedirect();
      await page.close();
      return context;
    } catch (error) {
      await context.close();
      if (attempt === maxAttempts) throw error;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }
  }

  throw new Error(`createRoleContext: exhausted ${maxAttempts} attempts for role "${role}" (unreachable).`);
}

export const test = base.extend<RoleFixtures, WorkerRoleFixtures>({
  adminContext: [
    async ({ browser }, use) => {
      const context = await createRoleContext(browser, 'admin');
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  staffContext: [
    async ({ browser }, use) => {
      const context = await createRoleContext(browser, 'staff');
      await use(context);
      await context.close();
    },
    { scope: 'worker' },
  ],

  adminPage: async ({ adminContext }, use) => {
    const page = await adminContext.newPage();
    await use(page);
    await page.close();
  },

  staffPage: async ({ staffContext }, use) => {
    const page = await staffContext.newPage();
    await use(page);
    await page.close();
  },
});
