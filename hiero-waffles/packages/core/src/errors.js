// packages/core/src/errors.ts
/**
 * Base class for all errors thrown by hiero-waffles
 * Extends the built-in Error so `instanceof HieroError` works across
 * package boundaries.
 */
export class HieroError extends Error {
  cause;
  constructor(message, cause) {
    super(message);
    this.cause = cause;
    this.name = "HieroError";
    // Ensure prototype chain is correct when targeting ES5.
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
/**
 * Thrown when the Mirror Node REST API returns a non-2xx response.
 */
export class MirrorNodeError extends HieroError {
  statusCode;
  endpoint;
  body;
  constructor(statusCode, endpoint, body) {
    super(`Mirror Node request failed: ${statusCode} ${endpoint}`);
    this.statusCode = statusCode;
    this.endpoint = endpoint;
    this.body = body;
    this.name = "MirrorNodeError";
  }
}
/**
 * Thrown after all retry attempts have been exhausted.
 */
export class RetryExhaustedError extends HieroError {
  attempts;
  constructor(attempts, cause) {
    super(`Operation failed after ${attempts} attempt(s)`, cause);
    this.attempts = attempts;
    this.name = "RetryExhaustedError";
  }
}
/**
 * Thrown when a scheduled transaction reaches a terminal state
 * other than `EXECUTED` (e.g. `DELETED`, `EXPIRED`).
 */
export class ScheduledTransactionError extends HieroError {
  scheduleId;
  status;
  constructor(scheduleId, status) {
    super(`Scheduled transaction ${scheduleId} ended with status: ${status}`);
    this.scheduleId = scheduleId;
    this.status = status;
    this.name = "ScheduledTransactionError";
  }
}
/**
 * Thrown when a required configuration value is missing or invalid.
 */
export class ConfigurationError extends HieroError {
  constructor(message) {
    super(message);
    this.name = "ConfigurationError";
  }
}
//# sourceMappingURL=errors.js.map
