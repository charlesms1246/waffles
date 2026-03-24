// packages/scheduled-tx/src/__tests__/poller.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { waitForScheduledTransaction } from "../poller.js";
import { ScheduledTransactionError } from "@hiero-sdk-utils/core";
import type { EntityId } from "@hiero-sdk-utils/core";

vi.useFakeTimers();

const SCHEDULE_ID = "0.0.99887" as EntityId;
const NETWORK_CONFIG = { network: "testnet" as const };

function makeMirrorResponse(overrides: Record<string, unknown>) {
  return {
    schedule_id: SCHEDULE_ID,
    creator_account_id: "0.0.1000",
    payer_account_id: "0.0.1000",
    scheduled_transaction_id: "0.0.1000@1234567890.000000000",
    signatories: [],
    expiration_time: null,
    executed_timestamp: null,
    deleted_timestamp: null,
    ...overrides,
  };
}

function makeFetch(responses: object[]) {
  let call = 0;
  return vi.fn().mockImplementation(async () => ({
    ok: true,
    json: async () => responses[Math.min(call++, responses.length - 1)],
  }));
}

describe("waitForScheduledTransaction", () => {
  it("resolves immediately when the first poll returns EXECUTED", async () => {
    const fetch = makeFetch([
      makeMirrorResponse({ executed_timestamp: "1234567890.000000000" }),
    ]);

    const promise = waitForScheduledTransaction(SCHEDULE_ID, {
      networkConfig: NETWORK_CONFIG,
      fetch: fetch as typeof globalThis.fetch,
      intervalMs: 100,
      timeoutMs: 5_000,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("EXECUTED");
    expect(result.scheduleId).toBe(SCHEDULE_ID);
  });

  it("polls until EXECUTED status appears", async () => {
    const fetch = makeFetch([
      makeMirrorResponse({}),                                              // PENDING
      makeMirrorResponse({}),                                              // PENDING
      makeMirrorResponse({ executed_timestamp: "9999999999.000000000" }), // EXECUTED
    ]);

    const promise = waitForScheduledTransaction(SCHEDULE_ID, {
      networkConfig: NETWORK_CONFIG,
      fetch: fetch as typeof globalThis.fetch,
      intervalMs: 100,
      timeoutMs: 10_000,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result.status).toBe("EXECUTED");
    expect(fetch).toHaveBeenCalledTimes(3);
  });

  it("throws ScheduledTransactionError when status is DELETED", async () => {
    const fetch = makeFetch([
      makeMirrorResponse({ deleted_timestamp: "1234567890.000000000" }),
    ]);

    const promise = waitForScheduledTransaction(SCHEDULE_ID, {
      networkConfig: NETWORK_CONFIG,
      fetch: fetch as typeof globalThis.fetch,
      intervalMs: 100,
      timeoutMs: 5_000,
    });

    await vi.runAllTimersAsync();
    await expect(promise).rejects.toBeInstanceOf(ScheduledTransactionError);
  });

  it("throws a timeout error when the deadline is exceeded", async () => {
    // Always PENDING
    const fetch = makeFetch([makeMirrorResponse({})]);

    const promise = waitForScheduledTransaction(SCHEDULE_ID, {
      networkConfig: NETWORK_CONFIG,
      fetch: fetch as typeof globalThis.fetch,
      intervalMs: 500,
      timeoutMs: 1_000,
    });

    await vi.runAllTimersAsync();
    await expect(promise).rejects.toThrow(/timeout/i);
  });
});
