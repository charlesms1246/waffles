// packages/mirror-node/src/pagination/paginator.ts
import type { MirrorNodeClient } from "../client.js";
import type { Page, QueryParams } from "@hiero-waffles/core";

/**
 * Shape of the raw Mirror Node pagination envelope.
 * Every list endpoint returns this structure.
 */
interface MirrorNodeListResponse<T> {
  [key: string]: T[] | { next: string | null } | unknown;
  links: { next: string | null };
}

export interface PaginatorOptions<T> {
  client: MirrorNodeClient;
  /** Initial path, e.g. `/api/v1/transactions`. */
  path: string;
  /** The key in the response body that contains the items array. */
  itemsKey: string;
  /** Initial query params merged with pagination params. */
  params?: QueryParams;
  /** Maximum items to yield in total across all pages. Omit for all pages. */
  maxItems?: number;
}

/**
 * Async generator that yields one {@link Page} at a time, following
 * Mirror Node's `links.next` cursor automatically.
 *
 * @example
 * for await (const page of paginate({ client, path: "/api/v1/transactions", itemsKey: "transactions" })) {
 *   console.log(page.items); // TransactionRecord[]
 *   if (someCondition) break; // safe to stop early
 * }
 */
export async function* paginate<T>(
  options: PaginatorOptions<T>,
): AsyncGenerator<Page<T>, void, unknown> {
  const { client, path, itemsKey, params = {}, maxItems } = options;

  let nextPath: string | null = path;
  let nextParams: QueryParams = params;
  let totalYielded = 0;

  while (nextPath !== null) {
    const raw: MirrorNodeListResponse<T> = await client.get<MirrorNodeListResponse<T>>(
      nextPath,
      nextParams,
    );

    const items = (raw[itemsKey] as T[] | undefined) ?? [];
    const next: string | null = raw.links?.next ?? null;

    let pageItems = items;
    if (maxItems !== undefined) {
      const remaining = maxItems - totalYielded;
      pageItems = items.slice(0, remaining);
    }

    totalYielded += pageItems.length;

    yield { items: pageItems, next };

    if (maxItems !== undefined && totalYielded >= maxItems) break;
    if (next === null) break;

    // The Mirror Node encodes the full next path in `links.next`,
    // e.g. "/api/v1/transactions?limit=25&timestamp=lt:1234567890.000000000"
    nextPath = next;
    nextParams = {}; // params are embedded in the cursor path
  }
}

/**
 * Collect all items from a paginated resource into a single array.
 *
 * **Use with caution** on large datasets — prefer the generator-based
 * {@link paginate} for streaming large result sets.
 *
 * @example
 * const allTxs = await collectAll({
 *   client,
 *   path: "/api/v1/transactions",
 *   itemsKey: "transactions",
 *   params: { "account.id": "0.0.1234", limit: 100 },
 * });
 */
export async function collectAll<T>(
  options: PaginatorOptions<T>,
): Promise<T[]> {
  const results: T[] = [];
  for await (const page of paginate(options)) {
    results.push(...page.items);
  }
  return results;
}
