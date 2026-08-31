import { chromium, FullConfig } from '@playwright/test';
import dotenv from 'dotenv';
import { LoginPage } from './utils/page-objects/login.page';

dotenv.config();

/**
 * Fail-fast sanity check only — NOT storageState generation. See
 * utils/fixtures/auth.fixtures.ts for why: the refresh token is single-use/rotating,
 * confirmed live 2026-07-08, so a shared storageState snapshot cannot be safely reused
 * across the many `adminPage`/`staffPage`-fixture tests in a real suite. Every test
 * that needs a role now performs its own fresh UI login via that fixture instead.
 *
 * This step exists purely so a broken environment/credential fails immediately with a
 * clear message, instead of 30+ minutes into a full suite run with a confusing wall of
 * per-test login failures.
 */
export default async function globalSetup(_config: FullConfig) {
  const baseURL = requireEnv('BASE_URL');
  const centre = process.env.TEST_CENTRE ?? 'Main Centre';

  await checkRoleCanLogIn({
    baseURL,
    centre,
    email: requireEnv('ADMIN_USER_EMAIL'),
    password: requireEnv('ADMIN_USER_PASSWORD'),
    role: 'admin',
    fatal: true,
  });

  await checkRoleCanLogIn({
    baseURL,
    centre,
    email: requireEnv('STAFF_EMAIL'),
    password: requireEnv('STAFF_PASSWORD'),
    role: 'staff',
    fatal: false,
  });
}

async function checkRoleCanLogIn(opts: {
  baseURL: string;
  centre: string;
  email: string;
  password: string;
  role: 'admin' | 'staff';
  fatal: boolean;
}) {
  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL: opts.baseURL });
  const page = await context.newPage();

  try {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(opts.email, opts.password, opts.centre);
    await loginPage.expectLoggedInRedirect();
  } catch (error) {
    const message =
      `global-setup sanity check: "${opts.role}" (${opts.email}) could not log in to ` +
      `"${opts.centre}" — ${(error as Error).message}`;
    if (opts.fatal) {
      throw new Error(message);
    }
    console.warn(
      `\n⚠️  ${message}\nTests using the "${opts.role === 'admin' ? 'adminPage' : 'staffPage'}" fixture will ` +
        `fail until this is resolved — continuing so unaffected tests can still run.\n`,
    );
  } finally {
    await browser.close();
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing required env var "${name}" — copy .env.example to .env and fill in real values ` +
        `before running any suite (see README.md Quick start).`,
    );
  }
  return value;
}
