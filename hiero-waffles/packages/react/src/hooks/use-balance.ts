// packages/react/src/hooks/use-balance.ts
//
// Fetches and caches the HBAR + token balance for a given account ID.

import type { EntityId } from "@hiero-waffles/core";
import type { AccountInfo } from "@hiero-waffles/mirror-node";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHiero } from "../context.js";

export interface UseBalanceResult {
  /** Full account info (includes balance breakdown). `null` while loading. */
  data: AccountInfo | null;
  /** HBAR balance in tinybars. `null` while loading or on error. */
  hbarBalance: bigint | null;
  /** Whether the initial fetch is in progress. */
  loading: boolean;
  /** Any error from the most recent fetch. */
  error: Error | null;
  /** Manually trigger a refresh. */
  refresh: () => void;
}

/**
 * Fetches the HBAR and token balances for the given `accountId`.
 * Automatically re-fetches on a configurable interval.
 *
 * @param accountId - Entity ID in `shard.realm.num` format.
 * @param options.refreshIntervalMs - How often to poll (default: 0 = no poll).
 *
 * @example
 * function BalanceDisplay({ accountId }: { accountId: string }) {
 *   const { hbarBalance, loading, error } = useBalance(accountId as EntityId);
 *
 *   if (loading) return <span>Loading…</span>;
 *   if (error)   return <span>Error: {error.message}</span>;
 *   return <span>{Number(hbarBalance) / 1e8} ℏ</span>;
 * }
 */
export function useBalance(
  accountId: EntityId | null | undefined,
  options?: { refreshIntervalMs?: number },
): UseBalanceResult {
  const { mirrorClient } = useHiero();
  const [data, setData] = useState<AccountInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  // Track whether this effect is still mounted to avoid setState on unmounted
  const mountedRef = useRef(true);

  const fetchBalance = useCallback(async () => {
    if (!accountId) return;
    setLoading(true);
    setError(null);
    try {
      const info = await mirrorClient.accounts.getAccount(accountId);
      if (mountedRef.current) {
        setData(info);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error(String(err)));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [accountId, mirrorClient]);

  useEffect(() => {
    mountedRef.current = true;
    fetchBalance();

    const intervalMs = options?.refreshIntervalMs ?? 0;
    if (intervalMs > 0) {
      const id = setInterval(fetchBalance, intervalMs);
      return () => {
        clearInterval(id);
        mountedRef.current = false;
      };
    }
    return () => {
      mountedRef.current = false;
    };
  }, [fetchBalance, options?.refreshIntervalMs]);

  const hbarBalance =
    data?.balance?.balance != null ? BigInt(data.balance.balance) : null;

  return {
    data,
    hbarBalance,
    loading,
    error,
    refresh: fetchBalance,
  };
}
