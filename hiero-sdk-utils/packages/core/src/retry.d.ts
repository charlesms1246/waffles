export interface RetryOptions {
    /** Maximum number of attempts (including the first). Default: 3. */
    maxAttempts?: number;
    /** Initial delay in ms before first retry. Default: 200. */
    baseDelayMs?: number;
    /** Maximum delay cap in ms. Default: 5_000. */
    maxDelayMs?: number;
    /**
     * Predicate that decides whether an error is retryable.
     * Return `true` to retry, `false` to rethrow immediately.
     * Default: always retry.
     */
    isRetryable?: (error: unknown) => boolean;
}
/**
 * Execute `fn`, retrying on failure with exponential back-off + full jitter.
 *
 * The delay between attempt N and N+1 is:
 *   `jitter(min(baseDelayMs × 2^N, maxDelayMs))`
 *
 * @throws {RetryExhaustedError} after all attempts are exhausted.
 *
 * @example
 * const result = await withRetry(() => fetchBalance(accountId), {
 *   maxAttempts: 4,
 *   isRetryable: (e) => e instanceof MirrorNodeError && e.statusCode >= 500,
 * });
 */
export declare function withRetry<T>(fn: () => Promise<T>, options?: RetryOptions): Promise<T>;
//# sourceMappingURL=retry.d.ts.map