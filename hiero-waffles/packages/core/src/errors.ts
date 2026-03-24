// packages/core/src/errors.ts

/**
 * Base class for all errors thrown by hiero-waffles
 * Extends the built-in Error so `instanceof HieroError` works across
 * package boundaries.
 */
export class HieroError extends Error {
  constructor(
    message: string,
    public override readonly cause?: unknown,
  ) {
    super(message);
    this.name = "HieroError";
    // Ensure prototype chain is correct when targeting ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * Thrown when the Mirror Node REST API returns a non-2xx response.
 */
export class MirrorNodeError extends HieroError {
  constructor(
    public readonly statusCode: number,
    public readonly endpoint: string,
    public readonly body: unknown,
  ) {
    super(
      `Mirror Node request failed: ${statusCode} ${endpoint}`,
    );
    this.name = "MirrorNodeError";
  }
}

/**
 * Thrown after all retry attempts have been exhausted.
 */
export class RetryExhaustedError extends HieroError {
  constructor(
    public readonly attempts: number,
    cause?: unknown,
  ) {
    super(`Operation failed after ${attempts} attempt(s)`, cause);
    this.name = "RetryExhaustedError";
  }
}

/**
 * Thrown when a scheduled transaction reaches a terminal state
 * other than `EXECUTED` (e.g. `DELETED`, `EXPIRED`).
 */
export class ScheduledTransactionError extends HieroError {
  constructor(
    public readonly scheduleId: string,
    public readonly status: string,
  ) {
    super(
      `Scheduled transaction ${scheduleId} ended with status: ${status}`,
    );
    this.name = "ScheduledTransactionError";
  }
}

/**
 * Thrown when a required configuration value is missing or invalid.
 */
export class ConfigurationError extends HieroError {
  constructor(message: string) {
    super(message);
    this.name = "ConfigurationError";
  }
}
