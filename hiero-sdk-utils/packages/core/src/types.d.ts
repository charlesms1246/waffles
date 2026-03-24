/** Hiero entity ID in the canonical `shard.realm.num` format. */
export type EntityId = `${number}.${number}.${number}`;
/** Unix epoch timestamp in seconds (as returned by Mirror Node). */
export type UnixTimestampSeconds = number;
/**
 * A paginated result page as returned by the Mirror Node REST API.
 * The `next` field is the raw value from the `links.next` field of the
 * response; it is `null` when there are no more pages.
 */
export interface Page<T> {
    items: T[];
    /** Opaque cursor for the next page, or `null` when exhausted. */
    next: string | null;
}
/**
 * Options common to all paginated Mirror Node queries.
 */
export interface PaginationOptions {
    /** Maximum number of items per page (1–100, API default: 25). */
    limit?: number;
    /** Sort order for results. */
    order?: "asc" | "desc";
}
/**
 * A timestamp range filter.  At least one of `from` / `to` must be provided.
 */
export interface TimestampRange {
    /** Inclusive lower bound (Unix seconds). */
    from?: UnixTimestampSeconds;
    /** Inclusive upper bound (Unix seconds). */
    to?: UnixTimestampSeconds;
}
/**
 * Simple key/value map used for building query strings.
 * Values that are `undefined` are omitted.
 */
export type QueryParams = Record<string, string | number | boolean | undefined>;
//# sourceMappingURL=types.d.ts.map