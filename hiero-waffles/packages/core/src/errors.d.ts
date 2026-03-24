/**
 * Base class for all errors thrown by hiero-waffles
 * Extends the built-in Error so `instanceof HieroError` works across
 * package boundaries.
 */
export declare class HieroError extends Error {
    readonly cause?: unknown | undefined;
    constructor(message: string, cause?: unknown | undefined);
}
/**
 * Thrown when the Mirror Node REST API returns a non-2xx response.
 */
export declare class MirrorNodeError extends HieroError {
    readonly statusCode: number;
    readonly endpoint: string;
    readonly body: unknown;
    constructor(statusCode: number, endpoint: string, body: unknown);
}
/**
 * Thrown after all retry attempts have been exhausted.
 */
export declare class RetryExhaustedError extends HieroError {
    readonly attempts: number;
    constructor(attempts: number, cause?: unknown);
}
/**
 * Thrown when a scheduled transaction reaches a terminal state
 * other than `EXECUTED` (e.g. `DELETED`, `EXPIRED`).
 */
export declare class ScheduledTransactionError extends HieroError {
    readonly scheduleId: string;
    readonly status: string;
    constructor(scheduleId: string, status: string);
}
/**
 * Thrown when a required configuration value is missing or invalid.
 */
export declare class ConfigurationError extends HieroError {
    constructor(message: string);
}
//# sourceMappingURL=errors.d.ts.map