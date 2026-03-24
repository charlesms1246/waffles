// packages/react/src/hooks/use-transactions.ts
//
// Paginated transaction history for a given account, with load-more support.

import { useState, useEffect, useCallback, useRef } from "react";
import { useHiero } from "../context.js";
import type { EntityId, TimestampRange } from "@hiero-sdk-utils/core";

// We re-use the raw Mirror Node transaction shape; a more specific type
// can be added once Mirror Node typings are fully fleshed out.
export type TransactionRecord = Record<string, unknown>;

export interface UseTransactionsOptions {
  /** Filter to a single transaction type, e.g. "CRYPTOTRANSFER". */
  type?: string;
  /** Filter to a result status. */
  result?: "SUCCESS" | "FAIL";
  /** Optional time window filter. */
  timestampRange?: TimestampRange;
  /** Page size (1–100). Default: 25. */
  limit?: number;
}

export interface UseTransactionsResult {
  /** Accumulated transactions across all pages fetched so far. */
  transactions: TransactionRecord[];
  /** Whether the initial page is loading. */
  loading: boolean;
  /** Whether a `loadMore` call is in progress. */
  loadingMore: boolean;
  /** Any error from the most recent operation. */
  error: Error | null;
  /** `true` when there are more pages available. */
  hasMore: boolean;
  /** Fetch the next page and append results to `transactions`. */
  loadMore: () => Promise<void>;
  /** Reset state and re-fetch from page 1. */
  refresh: () => void;
}

/**
 * Provides paginated transaction history for an account with
 * infinite-scroll / load-more ergonomics.
 *
 * @example
 * function TxList({ accountId }: { accountId: string }) {
 *   const { transactions, loadMore, hasMore, loading } =
 *     useTransactions(accountId as EntityId, { limit: 50 });
 *
 *   return (
 *     <>
 *       {transactions.map((tx) => <TxRow key={tx.transaction_id} tx={tx} />)}
 *       {hasMore && (
 *         <button onClick={loadMore} disabled={loading}>Load more</button>
 *       )}
 *     </>
 *   );
 * }
 */
export function useTransactions(
  accountId: EntityId | null | undefined,
  options?: UseTransactionsOptions,
): UseTransactionsResult {
  const { mirrorClient } = useHiero();
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  // Keep a stable ref to the iterator across renders
  const iteratorRef = useRef<AsyncGenerator<
    { items: TransactionRecord[]; next: string | null }
  > | null>(null);
  const mountedRef = useRef(true);

  const buildIterator = useCallback(() => {
    if (!accountId) return null;
    return mirrorClient.accounts.listTransactions(accountId, {
      limit: options?.limit ?? 25,
      type: options?.type,
      result: options?.result,
      timestampRange: options?.timestampRange,
    }) as AsyncGenerator<{ items: TransactionRecord[]; next: string | null }>;
  }, [
    accountId,
    mirrorClient,
    options?.limit,
    options?.type,
    options?.result,
    options?.timestampRange,
  ]);

  const fetchFirstPage = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    setTransactions([]);
    setNextCursor(null);

    const iter = buildIterator();
    iteratorRef.current = iter;

    try {
      const { value, done } = await iter!.next();
      if (!mountedRef.current) return;
      if (!done && value) {
        setTransactions(value.items);
        setNextCursor(value.next);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [accountId, buildIterator]);

  const loadMore = useCallback(async () => {
    if (!iteratorRef.current || !nextCursor) return;
    setLoadingMore(true);
    setError(null);
    try {
      const { value, done } = await iteratorRef.current.next();
      if (!mountedRef.current) return;
      if (!done && value) {
        setTransactions((prev) => [...prev, ...value.items]);
        setNextCursor(value.next);
      } else {
        setNextCursor(null);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) setLoadingMore(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    mountedRef.current = true;
    fetchFirstPage();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchFirstPage]);

  return {
    transactions,
    loading,
    loadingMore,
    error,
    hasMore: nextCursor !== null,
    loadMore,
    refresh: fetchFirstPage,
  };
}
