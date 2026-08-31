/**
 * BR-01: an admission can never be deleted, only cancelled — there is no cleanup path.
 * Every admission/installment this framework creates lives in the shared testing
 * environment forever. All generated identifiers are prefixed "PW-" (distinct from the
 * "QA-TEST-*"/"QA-9999" records created during the manual walkthrough) and are
 * timestamp+random based so parallel/repeated CI runs never collide.
 */
export function uniqueSuffix(): string {
  return `${Date.now().toString(36)}${Math.floor(Math.random() * 1e4)
    .toString(36)
    .padStart(3, '0')}`.toUpperCase();
}

export function uniqueAdmissionNo(): string {
  return `PW-ADM-${uniqueSuffix()}`;
}

export function uniqueRollNo(): string {
  return `PW-${uniqueSuffix()}`;
}

/** Digest BR-04: mobile is validated as 10–15 chars only, no digit-only regex — a real
 * 10-digit-looking number is used here for realistic positive-path data regardless. */
export function uniquePhoneNumber(): string {
  const base = 6_000_000_000 + Math.floor(Math.random() * 999_999_999);
  return String(base).slice(0, 10);
}
