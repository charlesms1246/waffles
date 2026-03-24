// packages/scheduled-tx/src/poller.ts
//
// Poll the Mirror Node until a scheduled transaction reaches a
// terminal status (EXECUTED, DELETED, or EXPIRED).

import {
  ScheduledTransactionError,
  type EntityId,
  type NetworkConfig,
  resolveMirrorNodeUrl,
  withRetry,
} from "@hiero-waffles/core";
import type { ScheduleInfo, ScheduledTransactionStatus } from "./helper.js";

export interface WaitOptions {
  networkConfig: NetworkConfig;
  /** How often to poll in milliseconds. Default: 2_000. */
  intervalMs?: number;
  /** Maximum total wait time in milliseconds. Default: 120_000 (2 minutes). */
  timeoutMs?: number;
  /** Custom fetch implementation (useful for tests). */
  fetch?: typeof globalThis.fetch;
}

interface MirrorScheduleResponse {
  schedule_id: string;
  creator_account_id: string;
  payer_account_id: string;
  scheduled_transaction_id: string;
  signatories: Array<{ public_key_prefix: string }>;
  executed_timestamp: string | null;
  deleted_timestamp: string | null;
  expiration_time: string | null;
}

/**
 * Poll the Mirror Node until a scheduled transaction reaches a terminal status.
 *
 * Terminal statuses are `EXECUTED`, `DELETED`, and `EXPIRED`.
 *
 * @returns The resolved {@link ScheduleInfo} when a terminal status is reached.
 * @throws {ScheduledTransactionError} if the terminal status is not `EXECUTED`.
 * @throws {Error} if the timeout is exceeded before a terminal status is observed.
 *
 * @example
 * const result = await waitForScheduledTransaction("0.0.99887", {
 *   networkConfig: { network: "testnet" },
 *   intervalMs: 3_000,
 *   timeoutMs: 60_000,
 * });
 * console.log("Executed at:", result.executedTimestamp);
 */
export async function waitForScheduledTransaction(
  scheduleId: EntityId,
  options: WaitOptions,
): Promise<ScheduleInfo> {
  const intervalMs = options.intervalMs ?? 2_000;
  const timeoutMs = options.timeoutMs ?? 120_000;
  const _fetch = options.fetch ?? globalThis.fetch.bind(globalThis);
  const baseUrl = resolveMirrorNodeUrl(options.networkConfig);
  const url = `${baseUrl}/api/v1/schedules/${scheduleId}`;

  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    const raw = await withRetry<MirrorScheduleResponse>(
      async () => {
        const res = await _fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`Mirror Node ${res.status}: ${url}`);
        return res.json() as Promise<MirrorScheduleResponse>;
      },
      { maxAttempts: 3 },
    );

    const status = deriveStatus(raw);
    const info = mapToScheduleInfo(raw, status);

    if (status === "EXECUTED") return info;
    if (status === "DELETED" || status === "EXPIRED") {
      throw new ScheduledTransactionError(scheduleId, status);
    }

    // PENDING — wait and poll again
    await sleep(intervalMs);
  }

  throw new Error(
    `waitForScheduledTransaction: timeout after ${timeoutMs}ms for schedule ${scheduleId}`,
  );
}

function deriveStatus(raw: MirrorScheduleResponse): ScheduledTransactionStatus {
  if (raw.executed_timestamp) return "EXECUTED";
  if (raw.deleted_timestamp) return "DELETED";

  if (raw.expiration_time) {
    const expiryMs = Number(raw.expiration_time.replace(".", "")) / 1_000_000;
    if (Date.now() > expiryMs) return "EXPIRED";
  }

  return "PENDING";
}

function mapToScheduleInfo(
  raw: MirrorScheduleResponse,
  status: ScheduledTransactionStatus,
): ScheduleInfo {
  return {
    scheduleId: raw.schedule_id as EntityId,
    creatorAccountId: raw.creator_account_id as EntityId,
    payerAccountId: raw.payer_account_id as EntityId,
    scheduledTransactionId: raw.scheduled_transaction_id,
    signatories: raw.signatories.map((s) => s.public_key_prefix),
    status,
    expirationTime: raw.expiration_time,
    executedTimestamp: raw.executed_timestamp,
    deletedTimestamp: raw.deleted_timestamp,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
