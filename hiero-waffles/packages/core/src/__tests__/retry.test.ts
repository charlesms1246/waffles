// packages/core/src/__tests__/retry.test.ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RetryExhaustedError } from "../errors.js";
import { withRetry } from "../retry.js";

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
    const assertion = expect(promise).rejects.toBeInstanceOf(RetryExhaustedError);
    await vi.runAllTimersAsync();

    await assertion;
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("does not retry when isRetryable returns false", async () => {
    const sentinelError = new Error("non-retryable");
    const fn = vi.fn().mockRejectedValue(sentinelError);

    const promise = withRetry(fn, {
      maxAttempts: 5,
      isRetryable: () => false,
    });
    const assertion = expect(promise).rejects.toBeInstanceOf(RetryExhaustedError);
    await vi.runAllTimersAsync();

    await assertion;
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("exposes the attempt count on RetryExhaustedError", async () => {
    const fn = vi.fn().mockRejectedValue(new Error("fail"));

    const promise = withRetry(fn, { maxAttempts: 2 });
    const assertion = expect(promise).rejects.toMatchObject({ attempts: 2 });
    await vi.runAllTimersAsync();
    await assertion;
  });
});
