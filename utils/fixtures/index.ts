/**
 * Single import for every spec: `import { test, expect } from '@utils/fixtures';`
 * `test` carries the role-based `adminPage`/`staffPage` fixtures; `expect` carries the
 * domain-specific GST matcher on top of Playwright's own assertions.
 */
export { test } from './auth.fixtures';
export { expect } from '../custom-assertions/gst-assertions';
