import { APIRequestContext, request as playwrightRequest } from '@playwright/test';

export interface LoginResponseBody {
  accessToken: string;
  user: { role: 'admin' | 'staff'; email: string; name: string };
}

/**
 * Thin wrapper around Playwright's `request` context for API-level checks that don't
 * need a full browser — e.g. the login endpoint's 401/200 paths (digest §"APIs
 * verified" for Module 1). All endpoints are relative to `API_BASE_URL` and use the
 * `{ error: { code, message } }` error shape documented across the digest's API
 * Mapping section.
 *
 * Endpoint URLs are built by plain string concatenation (`${apiBaseUrl}/path`), NOT
 * via `request.newContext({ baseURL })` + a leading-slash path. Live-confirmed
 * 2026-07-08: `API_BASE_URL` has a non-trivial path segment (`.../api`), and per
 * WHATWG URL resolution, a leading-slash relative path (`.post('/auth/login')`)
 * replaces the ENTIRE base path rather than appending to it — silently turning
 * `https://host/api` + `/auth/login` into `https://host/auth/login` (missing `/api`,
 * confirmed via a 405 from nginx, not the app). Plain concatenation sidesteps this
 * footgun entirely and matches the pattern already proven correct in
 * tests/smoke/app-health.spec.ts's own `GET /centres` check.
 */
export class ApiClient {
  private token: string | undefined;

  private constructor(
    private readonly context: APIRequestContext,
    private readonly apiBaseUrl: string,
  ) {}

  static async create(): Promise<ApiClient> {
    const apiBaseUrl = requireEnv('API_BASE_URL');
    const context = await playwrightRequest.newContext();
    return new ApiClient(context, apiBaseUrl);
  }

  private url(path: string): string {
    return `${this.apiBaseUrl}/${path}`;
  }

  async login(email: string, password: string) {
    return this.context.post(this.url('auth/login'), { data: { email, password } });
  }

  /**
   * Retries on failure — the login endpoint is rate-limited (QA-DIGEST.md LV-33,
   * live-confirmed 2026-07-08), and this call adds to the same login-endpoint volume
   * as every `adminPage`/`staffPage` fixture's own real UI login, especially when run
   * in parallel with them. A 401 for genuinely wrong credentials is deterministic and
   * won't be fixed by retrying, so this only helps the valid-credentials path — which
   * is the only path that calls this method (the 401 test calls `login()` directly).
   */
  async loginAndStoreToken(email: string, password: string): Promise<LoginResponseBody> {
    const maxAttempts = 3;
    let lastError: Error | undefined;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const res = await this.login(email, password);
      if (res.ok()) {
        const body = (await res.json()) as LoginResponseBody;
        this.token = body.accessToken;
        return body;
      }
      lastError = new Error(`API login failed: ${res.status()} ${await res.text()}`);
      if (attempt < maxAttempts) await new Promise((resolve) => setTimeout(resolve, attempt * 2_000));
    }

    throw lastError;
  }

  async getCentres() {
    return this.context.get(this.url('centres'), { headers: this.authHeaders() });
  }

  private authHeaders(): Record<string, string> {
    if (!this.token) {
      throw new Error('ApiClient: call loginAndStoreToken() before making an authenticated request.');
    }
    return { Authorization: `Bearer ${this.token}` };
  }

  async dispose() {
    await this.context.dispose();
  }
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required env var "${name}" — copy .env.example to .env and fill in real values.`);
  }
  return value;
}
