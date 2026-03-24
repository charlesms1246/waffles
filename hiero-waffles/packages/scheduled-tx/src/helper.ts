// packages/scheduled-tx/src/helper.ts
//
// This module wraps the @hashgraph/sdk ScheduleCreateTransaction and
// ScheduleSignTransaction, adding:
//  - A typed options object for creation
//  - Auto-population of payer / node configuration from NetworkConfig
//  - A convenience method to query the Mirror Node for schedule info

import type { NetworkConfig, EntityId } from "@hiero-waffles/core";
import {
  ScheduledTransactionError,
  ConfigurationError,
} from "@hiero-waffles/core";

// These types mirror the @hashgraph/sdk API.  We use conditional imports
// so the package compiles without the SDK being installed (useful in
// test environments that mock it).
type HederaClient = import("@hashgraph/sdk").Client;
type Transaction = import("@hashgraph/sdk").Transaction;
type PrivateKey = import("@hashgraph/sdk").PrivateKey;
type TransactionId = import("@hashgraph/sdk").TransactionId;

export type ScheduledTransactionStatus =
  | "PENDING"
  | "EXECUTED"
  | "DELETED"
  | "EXPIRED";

export interface ScheduleInfo {
  scheduleId: EntityId;
  creatorAccountId: EntityId;
  payerAccountId: EntityId;
  scheduledTransactionId: string;
  signatories: string[];
  status: ScheduledTransactionStatus;
  expirationTime: string | null;
  executedTimestamp: string | null;
  deletedTimestamp: string | null;
}

export interface CreateScheduledTransactionOptions {
  /** The inner transaction to schedule (must not yet be frozen). */
  transaction: Transaction;
  /** Optional human-readable memo stored on-chain (max 100 chars). */
  memo?: string;
  /** Account to pay the scheduled execution fee. Defaults to the operator. */
  payerAccountId?: string;
  /**
   * When `true`, the schedule is immediately submitted and executed the
   * moment the required signatures are collected.  Default: `true`.
   */
  waitForExpiry?: boolean;
}

/**
 * Helper for creating and managing Hiero scheduled transactions.
 *
 * Scheduled transactions allow multiple parties to coordinate on a
 * transaction that executes only after the required set of signatories
 * has signed.
 *
 * @example
 * import { Client, TransferTransaction, Hbar } from "@hashgraph/sdk";
 * import { ScheduledTransactionHelper } from "@hiero-waffles/scheduled-tx";
 *
 * const client = Client.forTestnet().setOperator(operatorId, operatorKey);
 * const helper = new ScheduledTransactionHelper(client, { network: "testnet" });
 *
 * const innerTx = new TransferTransaction()
 *   .addHbarTransfer("0.0.1234", new Hbar(-1))
 *   .addHbarTransfer("0.0.5678", new Hbar(1));
 *
 * const { scheduleId } = await helper.create({ transaction: innerTx, memo: "Pay Alice" });
 * console.log("Schedule created:", scheduleId);
 *
 * // Another party co-signs:
 * await helper.sign(scheduleId, aliceKey);
 */
export class ScheduledTransactionHelper {
  constructor(
    private readonly client: HederaClient,
    private readonly networkConfig: NetworkConfig,
  ) {}

  /**
   * Wrap an inner transaction in a `ScheduleCreateTransaction` and execute it.
   *
   * @returns The new schedule ID and the transaction ID of the create tx.
   */
  async create(options: CreateScheduledTransactionOptions): Promise<{
    scheduleId: EntityId;
    transactionId: TransactionId;
  }> {
    // Lazy-import to allow test environments to mock @hashgraph/sdk
    const { AccountId, ScheduleCreateTransaction } = await import("@hashgraph/sdk");

    if (!options.memo || options.memo.length <= 100) {
      // memo length is fine
    } else {
      throw new ConfigurationError(
        "Scheduled transaction memo must not exceed 100 characters",
      );
    }

    const scheduleTx = new ScheduleCreateTransaction()
      .setScheduledTransaction(options.transaction)
      .setWaitForExpiry(options.waitForExpiry ?? false);

    if (options.memo) {
      scheduleTx.setScheduleMemo(options.memo);
    }

    if (options.payerAccountId) {
      scheduleTx.setPayerAccountId(AccountId.fromString(options.payerAccountId));
    }

    const response = await scheduleTx.execute(this.client);
    const receipt = await response.getReceipt(this.client);

    if (!receipt.scheduleId) {
      throw new ScheduledTransactionError(
        "unknown",
        "No scheduleId returned in receipt",
      );
    }

    return {
      scheduleId: receipt.scheduleId.toString() as EntityId,
      transactionId: response.transactionId,
    };
  }

  /**
   * Add a signature to an existing scheduled transaction.
   *
   * @param scheduleId - The `0.0.X` schedule entity ID.
   * @param signerKey  - The private key to sign with.
   * @returns The transaction ID of the sign transaction.
   */
  async sign(
    scheduleId: EntityId,
    signerKey: PrivateKey,
  ): Promise<TransactionId> {
    const { ScheduleSignTransaction } = await import("@hashgraph/sdk");

    const signTx = new ScheduleSignTransaction().setScheduleId(scheduleId);

    await signTx.freezeWith(this.client);
    signTx.sign(signerKey);

    const response = await signTx.execute(this.client);
    return response.transactionId;
  }

  /**
   * Delete a scheduled transaction before it executes.
   *
   * Only the admin key (set at creation) can delete a scheduled transaction.
   *
   * @param scheduleId - The `0.0.X` schedule entity ID.
   * @param adminKey   - The admin private key.
   */
  async delete(scheduleId: EntityId, adminKey: PrivateKey): Promise<void> {
    const { ScheduleDeleteTransaction } = await import("@hashgraph/sdk");

    const deleteTx = new ScheduleDeleteTransaction().setScheduleId(scheduleId);

    await deleteTx.freezeWith(this.client);
    deleteTx.sign(adminKey);
    const response = await deleteTx.execute(this.client);
    await response.getReceipt(this.client);
  }
}
