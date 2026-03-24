// @ts-nocheck
/**
 * docs/examples/mirror-node-quickstart.ts
 *
 * Demonstrates the Mirror Node client:
 *  - Fetching account info
 *  - Streaming paginated transactions
 *  - Querying token metadata and NFTs
 *
 * Run:
 *   npx tsx docs/examples/mirror-node-quickstart.ts
 */

import { HieroMirrorClient } from "@hiero-waffles/mirror-node";
import type { EntityId } from "@hiero-waffles/core";

// ─── Instantiate ─────────────────────────────────────────────────────────────

const mirror = new HieroMirrorClient({ network: "testnet" });

// ─── Example 1: Fetch a single account ───────────────────────────────────────

async function printAccountInfo(accountId: EntityId) {
  const info = await mirror.accounts.getAccount(accountId);

  const hbar = Number(info.balance.balance) / 1e8;
  console.log(`\n── Account ${accountId} ──`);
  console.log(`  Balance : ${hbar.toFixed(8)} ℏ`);
  console.log(`  Memo    : ${info.memo || "(none)"}`);
  console.log(`  Created : ${info.created_timestamp}`);
  console.log(`  Tokens  : ${info.balance.tokens.length} associated`);
}

// ─── Example 2: Stream the first 3 pages of transactions ─────────────────────

async function streamTransactions(accountId: EntityId) {
  console.log(`\n── Transactions for ${accountId} (3 pages) ──`);
  let pageNum = 0;

  for await (const page of mirror.accounts.listTransactions(accountId, {
    limit: 5,
    order: "desc",
  })) {
    pageNum++;
    console.log(`  Page ${pageNum}: ${page.items.length} transactions`);

    for (const tx of page.items as Array<Record<string, unknown>>) {
      console.log(`    ${tx["transaction_id"]}  ${tx["name"]}`);
    }

    if (pageNum >= 3) break; // Stop after 3 pages for the demo
  }
}

// ─── Example 3: Token metadata ────────────────────────────────────────────────

async function printTokenInfo(tokenId: EntityId) {
  const token = await mirror.tokens.getToken(tokenId);
  console.log(`\n── Token ${tokenId} ──`);
  console.log(`  Name    : ${token.name}`);
  console.log(`  Symbol  : ${token.symbol}`);
  console.log(`  Type    : ${token.type}`);
  console.log(`  Supply  : ${token.total_supply}`);
  console.log(`  Decimals: ${token.decimals}`);
}

// ─── Example 4: Stream NFTs ───────────────────────────────────────────────────

async function listNfts(tokenId: EntityId, maxPages = 2) {
  console.log(`\n── NFTs for token ${tokenId} (first ${maxPages} pages) ──`);
  let page = 0;

  for await (const result of mirror.tokens.listNfts(tokenId, { limit: 5 })) {
    page++;
    for (const nft of result.items) {
      console.log(`  Serial #${nft.serial_number}  holder: ${nft.account_id}`);
    }
    if (page >= maxPages || !result.next) break;
  }
}

// ─── Run all examples ─────────────────────────────────────────────────────────

// Replace these IDs with valid testnet entity IDs when running for real.
const DEMO_ACCOUNT = "0.0.1234" as EntityId;
const DEMO_TOKEN = "0.0.5678" as EntityId;

(async () => {
  try {
    await printAccountInfo(DEMO_ACCOUNT);
    await streamTransactions(DEMO_ACCOUNT);
    await printTokenInfo(DEMO_TOKEN);
    await listNfts(DEMO_TOKEN);
  } catch (err) {
    console.error("Example failed:", err);
    process.exit(1);
  }
})();
