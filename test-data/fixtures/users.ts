/**
 * Credentials always come from `.env` (see .env.example) — never hardcoded. Only two
 * roles exist in the app (`src/constants/roles.ts`): admin, staff.
 */
export type Role = 'admin' | 'staff';

export interface TestUser {
  role: Role;
  email: string;
  password: string;
  /** Role display text rendered in the Topbar profile trigger — "Admin" / "Staff". */
  roleLabel: 'Admin' | 'Staff';
}

export function getTestUser(role: Role): TestUser {
  if (role === 'admin') {
    return {
      role,
      email: requireEnv('ADMIN_USER_EMAIL'),
      password: requireEnv('ADMIN_USER_PASSWORD'),
      roleLabel: 'Admin',
    };
  }
  return {
    role,
    email: requireEnv('STAFF_EMAIL'),
    password: requireEnv('STAFF_PASSWORD'),
    roleLabel: 'Staff',
  };
}

export function getTestCentre(): string {
  return process.env.TEST_CENTRE ?? 'Main Centre';
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var "${name}" — copy .env.example to .env and fill in real values.`);
  }
  return value;
}
