// @ts-nocheck
/**
 * docs/examples/scheduled-tx-quickstart.ts
 *
 * End-to-end example of a multi-party scheduled transfer:
 *  1. Party A creates the scheduled transaction.
 *  2. Party B co-signs.
 *  3. Both parties poll for the terminal status.
 *
 * This example requires a real @hashgraph/sdk Client configured with
 * funded testnet accounts and their private keys.
 *
 * Run:
 *   OPERATOR_ID=0.0.xxxx OPERATOR_KEY=302... RECIPIENT_ID=0.0.yyyy npx tsx docs/examples/scheduled-tx-quickstart.ts
 */

import { Client, Hbar, PrivateKey, TransferTransaction } from "@hashgraph/sdk";
import type { EntityId } from "@hiero-waffles/core";
import {
  ScheduledTransactionHelper,
  waitForScheduledTransaction,
} from "@hiero-waffles/scheduled-tx";

const NETWORK = "testnet" as const;

// ─── Load credentials from environment ───────────────────────────────────────

const operatorId = process.env["OPERATOR_ID"] ?? "0.0.1234";
const operatorKey = process.env["OPERATOR_KEY"] ?? "";
const recipientId = process.env["RECIPIENT_ID"] ?? "0.0.5678";

if (!operatorKey) {
  console.error("OPERATOR_KEY environment variable is required.");
  process.exit(1);
}

// ─── Build SDK client ─────────────────────────────────────────────────────────

const client = Client.forTestnet().setOperator(
  operatorId,
  PrivateKey.fromStringDer(operatorKey),
);

const helper = new ScheduledTransactionHelper(client, { network: NETWORK });

// ─── Step 1: Create the scheduled transfer ────────────────────────────────────

console.log("Creating scheduled transfer…");

const innerTx = new TransferTransaction()
  .addHbarTransfer(operatorId, new Hbar(-1))
  .addHbarTransfer(recipientId, new Hbar(1));

const { scheduleId } = await helper.create({
  transaction: innerTx,
  memo: "Demo scheduled transfer",
});

console.log(`✓ Schedule created: ${scheduleId}`);

// ─── Step 2: Co-sign with the operator key ────────────────────────────────────
// In a real multi-party scenario, each party would sign independently,
// possibly from different processes or machines.

console.log("Signing scheduled transaction…");
const signerKey = PrivateKey.fromStringDer(operatorKey);
await helper.sign(scheduleId as EntityId, signerKey);
console.log("✓ Signed");

// ─── Step 3: Poll until execution ────────────────────────────────────────────

console.log("Polling for execution…");

const result = await waitForScheduledTransaction(scheduleId as EntityId, {
  networkConfig: { network: NETWORK },
  intervalMs: 2_000,
  timeoutMs: 60_000,
});

console.log(`\n✓ Schedule ${scheduleId} ${result.status}`);
if (result.executedTimestamp) {
  console.log(`  Executed at: ${result.executedTimestamp}`);
}

client.close();
