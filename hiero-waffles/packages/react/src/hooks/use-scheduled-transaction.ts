// packages/react/src/hooks/use-scheduled-transaction.ts
//
// Poll a scheduled transaction's status and surface it as reactive state.

import type { EntityId } from "@hiero-waffles/core";
import { waitForScheduledTransaction } from "@hiero-waffles/scheduled-tx";
import type {
  ScheduleInfo,
  ScheduledTransactionStatus,
} from "@hiero-waffles/scheduled-tx";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHiero } from "../context.js";

export interface UseScheduledTransactionResult {
  /** Current status. `null` while the first poll hasn't returned. */
  status: ScheduledTransactionStatus | null;
  /** Full schedule info once available. */
  scheduleInfo: ScheduleInfo | null;
  /** Whether polling is actively running. */
  polling: boolean;
  /** Any error (terminal status or network). */
  error: Error | null;
  /** Manually cancel ongoing polling. */
  cancel: () => void;
}

/**
 * Polls the Mirror Node for the status of a scheduled transaction,
 * surfacing reactive `status` / `scheduleInfo` state to your component.
 *
 * The hook begins polling as soon as `scheduleId` is non-null and stops
 * automatically once a terminal status is reached or the component unmounts.
 *
 * @example
 * function ScheduleStatus({ scheduleId }: { scheduleId: string }) {
 *   const { status, scheduleInfo, polling } =
 *     useScheduledTransaction(scheduleId as EntityId);
 *
 *   if (polling) return <Spinner />;
 *   return <p>Status: {status}</p>;
 * }
 */
export function useScheduledTransaction(
  scheduleId: EntityId | null | undefined,
  options?: { intervalMs?: number; timeoutMs?: number },
): UseScheduledTransactionResult {
  const { networkConfig } = useHiero();
  const [status, setStatus] = useState<ScheduledTransactionStatus | null>(null);
  const [scheduleInfo, setScheduleInfo] = useState<ScheduleInfo | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const cancelledRef = useRef(false);

  const cancel = useCallback(() => {
    cancelledRef.current = true;
    setPolling(false);
  }, []);

  useEffect(() => {
    if (!scheduleId) return;
    cancelledRef.current = false;
    setPolling(true);
    setError(null);
    setStatus(null);
    setScheduleInfo(null);

    waitForScheduledTransaction(scheduleId, {
      networkConfig,
      intervalMs: options?.intervalMs ?? 3_000,
      timeoutMs: options?.timeoutMs ?? 120_000,
    })
      .then((info) => {
        if (cancelledRef.current) return;
        setScheduleInfo(info);
        setStatus(info.status);
      })
      .catch((err) => {
        if (cancelledRef.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        // Try to surface the terminal status from ScheduledTransactionError
        if (err?.status) setStatus(err.status as ScheduledTransactionStatus);
      })
      .finally(() => {
        if (!cancelledRef.current) setPolling(false);
      });

    return () => {
      cancelledRef.current = true;
    };
  }, [scheduleId, networkConfig, options?.intervalMs, options?.timeoutMs]);

  return { status, scheduleInfo, polling, error, cancel };
}
