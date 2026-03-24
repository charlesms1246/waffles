// packages/core/src/__tests__/retry.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { withRetry } from "../retry.js";
import { RetryExhaustedError } from "../errors.js";

// Speed up tests by removing real delays
vi.useFakeTimers();

describe("withRetry", () => {
  beforeEach(() => {
    vi.clearAllTimers();
  });

  it("returns immediately on first success", async () => {
    const fn = vi.fn().mockResolvedValue("ok");
    const result = await withRetry(fn);
    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("retries on failure and succeeds on the second attempt", async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error("transient"))
      .mockResolvedValue("ok");

    const promise = withRetry(fn, { maxAttempts: 3 });
    // Advance timers to skip the back-off delay
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe("ok");
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it("throws RetryExhaustedError after all attempts fail", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("always fails"));

    const promise = withRetry(fn, { maxAttempts: 3 });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry when isRetryable returns false", async () => {
    const sentinelError = new Error("non-retryable");
    const fn = vi.fn().mockRejectedValue(sentinelError);

    const promise = withRetry(fn, {
      maxAttempts: 5,
      isRetryable: () => false,
    });
    await vi.runAllTimersAsync();

    await expect(promise).rejects.toBeInstanceOf(RetryExhaustedError);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exposes the attempt count on RetryExhaustedError", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    const promise = withRetry(fn, { maxAttempts: 2 });
    await vi.runAllTimersAsync();

    try {
      await promise;
    } catch (err) {
      expect(err).toBeInstanceOf(RetryExhaustedError);
      expect((err as RetryExhaustedError).attempts).toBe(2);
    }
  });
});
