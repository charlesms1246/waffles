// packages/mirror-node/src/client.ts
import {
  MirrorNodeError,
  type NetworkConfig,
  resolveMirrorNodeUrl,
  withRetry,
  type RetryOptions,
  type QueryParams,
} from "@hiero-sdk-utils/core";

export interface MirrorNodeClientOptions {
  networkConfig: NetworkConfig;
  /** Override retry behaviour for all requests. */
  retryOptions?: RetryOptions;
  /**
   * Custom fetch implementation.  Defaults to the global `fetch`.
   * Useful for injecting mocks in tests.
   */
  fetch?: typeof globalThis.fetch;
}

/**
 * Low-level HTTP client for the Hiero Mirror Node REST API.
 *
 * This class handles:
 * - Base URL resolution per network
 * - Query-string serialisation
 * - Automatic retries with exponential back-off
 * - Typed error surfacing via {@link MirrorNodeError}
 *
 * @example
 * const client = new MirrorNodeClient({
 *   networkConfig: { network: "testnet" },
 * });
 * const data = await client.get<AccountInfo>("/api/v1/accounts/0.0.1234");
 */
export class MirrorNodeClient {
  private readonly baseUrl: string;
  private readonly retryOptions: RetryOptions;
  private readonly _fetch: typeof globalThis.fetch;

  constructor(options: MirrorNodeClientOptions) {
    this.baseUrl = resolveMirrorNodeUrl(options.networkConfig);
    this.retryOptions = {
      maxAttempts: options.networkConfig.maxRetries ?? 3,
      isRetryable: (err) =>
        err instanceof MirrorNodeError && err.statusCode >= 500,
      ...options.retryOptions,
    };
    this._fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  /**
   * Perform a GET request to the Mirror Node API.
   *
   * @param path   - API path, e.g. `/api/v1/accounts/0.0.1234`
   * @param params - Optional query parameters (undefined values are omitted).
   * @returns Parsed JSON response body.
   * @throws {MirrorNodeError} on non-2xx responses (after retries).
   */
  async get<T>(path: string, params?: QueryParams): Promise<T> {
    const url = this.buildUrl(path, params);

    return withRetry(async () => {
      const response = await this._fetch(url, {
        headers: { Accept: "application/json" },
      });

      if (!response.ok) {
        let body: unknown;
        try {
          body = await response.json();
        } catch {
          body = await response.text();
        }
        throw new MirrorNodeError(response.status, url, body);
      }

      return response.json() as Promise<T>;
    }, this.retryOptions);
  }

  private buildUrl(path: string, params?: QueryParams): string {
    const base = `${this.baseUrl}${path}`;
    if (!params) return base;

    const qs = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        qs.set(key, String(value));
      }
    }

    const queryString = qs.toString();
    return queryString ? `${base}?${queryString}` : base;
  }
}
