/**
 * Root CLAUDE.md / config/README.md: no write or destructive operations against
 * production, ever. Call this at the top of any spec/fixture that creates, edits, or
 * cancels real records before it does anything else.
 */
export function assertWriteOperationsAllowed(context: string): void {
  const environment = process.env.ENVIRONMENT ?? 'testing';
  const allowWrites = process.env.ALLOW_WRITE_OPERATIONS !== 'false';

  if (environment === 'production' || !allowWrites) {
    throw new Error(
      `Refusing to run "${context}" — it creates/mutates real records and ` +
        `ENVIRONMENT="${environment}" / ALLOW_WRITE_OPERATIONS="${process.env.ALLOW_WRITE_OPERATIONS}" ` +
        `does not permit write operations. This suite must only run against a testing/staging environment.`,
    );
  }
}
