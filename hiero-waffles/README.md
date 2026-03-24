# hiero-waffles

[![CI](https://github.com/charlesms1246/waffles/actions/workflows/ci.yml/badge.svg?branch=main)](https://github.com/charlesms1246/waffles/actions/workflows/ci.yml?query=branch%3Amain)
[![License](https://img.shields.io/badge/license-Apache--2.0-blue.svg)](LICENSE)
[![pnpm](https://img.shields.io/badge/maintained%20with-pnpm-cc00ff.svg)](https://pnpm.io/)

A production-minded TypeScript utility library for [Hiero](https://hiero.org/)
networks that makes the everyday developer experience better.

> **Inspired by** [hiero-enterprise-java](https://github.com/OpenElements/hiero-enterprise-java) —
> the same philosophy of clean APIs, strong typing, and contribution hygiene,
> brought to the TypeScript ecosystem.

---

## Packages

| Package | Version | Description |
|---------|---------|-------------|
| [`hiero-waffles/core`](packages/core) | [![npm](https://img.shields.io/npm/v/hiero-waffles)](https://www.npmjs.com/package) | Shared types, errors, retry logic |
| [`hiero-waffles/mirror-node`](packages/mirror-node) | [![npm](https://img.shields.io/npm/v/hiero-waffles)](https://www.npmjs.com/package/hiero-waffles) | Typed Mirror Node client with pagination |
| [`hiero-waffles/scheduled-tx`](packages/scheduled-tx) | [![npm](https://img.shields.io/npm/v/hiero-waffles)](https://www.npmjs.com/package/hiero-waffles) | Create, sign, and track scheduled transactions |
| [`hiero-waffles/react`](packages/react) | [![npm](https://img.shields.io/npm/v/hiero-waffles)](https://www.npmjs.com/package/hiero-waffles) | React hooks and provider for Hiero flows |

---

## Installation

Install only the packages you need:

```bash
# npm
npm install hiero-waffles/mirror-node

# pnpm
pnpm add hiero-waffles/mirror-node

# yarn
yarn add hiero-waffles/mirror-node
```

`hiero-waffles/core` is a direct dependency of every other package and is
installed automatically. The React package requires `react >= 18`. The
scheduled-tx package requires `@hashgraph/sdk >= 2.40` as a peer dependency.

---

## Quickstart

### Mirror Node client

```typescript
import { HieroMirrorClient } from "hiero-waffles/mirror-node";
import type { EntityId } from "hiero-waffles/core";

const mirror = new HieroMirrorClient({ network: "testnet" });

// Fetch account info
const info = await mirror.accounts.getAccount("0.0.1234" as EntityId);
console.log(`Balance: ${info.balance.balance} tinybars`);

// Stream transactions page by page — memory-efficient for large accounts
for await (const page of mirror.accounts.listTransactions("0.0.1234" as EntityId, {
  limit: 25,
  order: "desc",
})) {
  console.log(`Page: ${page.items.length} transactions`);
  // break early at any time — the generator cleans up safely
}

// Collect all NFTs for a token (use paginate() for large collections)
const nfts = await mirror.tokens.listNfts("0.0.9999" as EntityId);
```

### Scheduled transactions

```typescript
import { Client, TransferTransaction, Hbar, PrivateKey } from "@hashgraph/sdk";
import {
  ScheduledTransactionHelper,
  waitForScheduledTransaction,
} from "hiero-waffles/scheduled-tx";
import type { EntityId } from "hiero-waffles/core";

const client = Client.forTestnet().setOperator(operatorId, operatorKey);
const helper = new ScheduledTransactionHelper(client, { network: "testnet" });

// 1. Create
const innerTx = new TransferTransaction()
  .addHbarTransfer(senderAccountId, new Hbar(-1))
  .addHbarTransfer(recipientAccountId, new Hbar(1));

const { scheduleId } = await helper.create({
  transaction: innerTx,
  memo: "Pay Alice",
});

// 2. Co-sign (from another party, possibly a different process)
await helper.sign(scheduleId, alicePrivateKey);

// 3. Wait for execution
const result = await waitForScheduledTransaction(scheduleId as EntityId, {
  networkConfig: { network: "testnet" },
  intervalMs: 2_000,
  timeoutMs: 60_000,
});
console.log(`Executed at: ${result.executedTimestamp}`);
```

### React integration

```tsx
// main.tsx — wrap your app once
import { HieroProvider } from "hiero-waffles/react";

root.render(
  <HieroProvider networkConfig={{ network: "testnet" }}>
    <App />
  </HieroProvider>
);

// BalanceCard.tsx — use hooks anywhere inside the tree
import { useBalance } from "hiero-waffles/react";
import type { EntityId } from "hiero-waffles/core";

function BalanceCard({ accountId }: { accountId: EntityId }) {
  const { hbarBalance, loading, error, refresh } = useBalance(accountId, {
    refreshIntervalMs: 30_000, // auto-refresh every 30 s
  });

  if (loading) return <span>Loading…</span>;
  if (error)   return <span>Error: {error.message}</span>;

  return (
    <div>
      <p>{Number(hbarBalance) / 1e8} ℏ</p>
      <button onClick={refresh}>Refresh</button>
    </div>
  );
}

// TransactionList.tsx — infinite-scroll pattern
import { useTransactions } from "hiero-waffles/react";

function TransactionList({ accountId }: { accountId: EntityId }) {
  const { transactions, hasMore, loadMore, loadingMore } =
    useTransactions(accountId, { limit: 25 });

  return (
    <>
      {transactions.map((tx) => <TxRow key={tx.transaction_id} tx={tx} />)}
      {hasMore && (
        <button onClick={loadMore} disabled={loadingMore}>
          Load more
        </button>
      )}
    </>
  );
}
```

Full runnable examples live in [`docs/examples/`](docs/examples/).

---

## API reference

### `hiero-waffles/core`

| Export | Description |
|--------|-------------|
| `NetworkConfig` | Network target, Mirror Node URL, timeout, and retry configuration |
| `resolveMirrorNodeUrl(config)` | Derive the Mirror Node base URL for a given `NetworkConfig` |
| `resolveNetworkConfig(partial)` | Apply defaults to a partial `NetworkConfig` |
| `withRetry(fn, options?)` | Run an async function with exponential back-off and jitter |
| `HieroError` | Base error class for all library errors |
| `MirrorNodeError` | Non-2xx Mirror Node response (includes `statusCode` and `endpoint`) |
| `RetryExhaustedError` | All retry attempts exhausted |
| `ScheduledTransactionError` | Terminal non-executed schedule status |
| `ConfigurationError` | Missing or invalid configuration |
| `EntityId` | Branded type — `"${number}.${number}.${number}"` |
| `Page<T>` | Paginated result with `items` and `next` cursor |

### `hiero-waffles/mirror-node`

| Export | Description |
|--------|-------------|
| `HieroMirrorClient` | Unified client — exposes `.accounts` and `.tokens` |
| `MirrorNodeClient` | Low-level HTTP client — use for endpoints not yet wrapped |
| `AccountQueries` | `.getAccount(id)`, `.listTransactions(id, opts)`, `.getAllTransactions(id, opts)` |
| `TokenQueries` | `.getToken(id)`, `.getNft(id, serial)`, `.listTokens(opts)`, `.listNfts(id, opts)` |
| `paginate<T>(opts)` | Async generator — yields `Page<T>` following `links.next` |
| `collectAll<T>(opts)` | Convenience — collect all pages into a flat array |

### `hiero-waffles/scheduled-tx`

| Export | Description |
|--------|-------------|
| `ScheduledTransactionHelper` | `.create(opts)`, `.sign(id, key)`, `.delete(id, key)` |
| `waitForScheduledTransaction(id, opts)` | Poll until `EXECUTED`, `DELETED`, or `EXPIRED` |
| `ScheduleInfo` | Full schedule state returned by the poller |
| `ScheduledTransactionStatus` | `"PENDING" \| "EXECUTED" \| "DELETED" \| "EXPIRED"` |

### `hiero-waffles/react`

| Export | Description |
|--------|-------------|
| `HieroProvider` | Context provider — pass `networkConfig` (and optional `mirrorClient`) |
| `useHiero()` | Access shared `mirrorClient` and `networkConfig` |
| `useBalance(accountId, opts?)` | Reactive balance with optional polling; returns `hbarBalance`, `loading`, `error`, `refresh` |
| `useTransactions(accountId, opts?)` | Paginated transaction history; returns `transactions`, `hasMore`, `loadMore` |
| `useScheduledTransaction(scheduleId, opts?)` | Reactive schedule status; returns `status`, `scheduleInfo`, `polling` |

---

## Configuration

All clients accept a `NetworkConfig` object:

```typescript
interface NetworkConfig {
  network: "mainnet" | "testnet" | "previewnet" | "local";
  mirrorNodeUrl?: string;  // Override Mirror Node base URL
  timeoutMs?: number;      // Request timeout (default: 10_000)
  maxRetries?: number;     // Auto-retry count (default: 3)
}
```

For local development with `hedera-local-node`:

```typescript
const mirror = new HieroMirrorClient({
  network: "local",
  // Defaults to http://localhost:5551
});
```

---

## Error handling

All errors extend `HieroError`, so you can catch them uniformly:

```typescript
import {
  HieroError,
  MirrorNodeError,
  RetryExhaustedError,
} from "hiero-waffles/core";

try {
  const info = await mirror.accounts.getAccount("0.0.1234" as EntityId);
} catch (err) {
  if (err instanceof MirrorNodeError) {
    console.error(`HTTP ${err.statusCode} from ${err.endpoint}`);
  } else if (err instanceof RetryExhaustedError) {
    console.error(`Failed after ${err.attempts} attempts`, err.cause);
  } else if (err instanceof HieroError) {
    console.error("Hiero error:", err.message);
  }
}
```

---

## Contributing

Contributions are very welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for the
full guide, including:

- Local setup
- DCO sign-off requirement (`git commit -s`)
- GPG-signed commits
- Conventional commit format
- How to add a Changeset for versioning

---

## License

[Apache 2.0](LICENSE) © hiero-waffles contributors
