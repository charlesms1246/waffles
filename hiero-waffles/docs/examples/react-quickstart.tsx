import type { EntityId } from "@hiero-waffles/core";
import {
  HieroProvider,
  useBalance,
  useScheduledTransaction,
  useTransactions,
} from "@hiero-waffles/react";

// ─── 1. Wrap your app ─────────────────────────────────────────────────────────

export function App() {
  return (
    <HieroProvider networkConfig={{ network: "testnet" }}>
      <Dashboard accountId={"0.0.1234" as EntityId} />
    </HieroProvider>
  );
}

// ─── 2. Display HBAR balance ──────────────────────────────────────────────────

function BalanceCard({ accountId }: { accountId: EntityId }) {
  const { hbarBalance, loading, error, refresh } = useBalance(accountId, {
    // Refresh the balance every 30 seconds
    refreshIntervalMs: 30_000,
  });

  if (loading) return <p>Loading balance…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error.message}</p>;

  const hbar = hbarBalance != null ? Number(hbarBalance) / 1e8 : null;

  return (
    <div>
      <h2>Balance</h2>
      <p>{hbar?.toFixed(8) ?? "—"} ℏ</p>
      <button type="button" onClick={refresh}>
        Refresh
      </button>
    </div>
  );
}

// ─── 3. Paginated transaction list ────────────────────────────────────────────

function TransactionList({ accountId }: { accountId: EntityId }) {
  const { transactions, loading, loadingMore, hasMore, loadMore, error } =
    useTransactions(accountId, { limit: 25 });

  if (loading) return <p>Loading transactions…</p>;
  if (error) return <p style={{ color: "red" }}>Error: {error.message}</p>;

  return (
    <div>
      <h2>Transactions</h2>
      <ul>
        {transactions.map((tx) => (
          <li key={tx["transaction_id"] as string}>
            <code>{tx["transaction_id"] as string}</code>{" "}
            <span>{tx["name"] as string}</span>
          </li>
        ))}
      </ul>
      {hasMore && (
        <button type="button" onClick={loadMore} disabled={loadingMore}>
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}

// ─── 4. Scheduled transaction status ─────────────────────────────────────────

function ScheduleTracker({ scheduleId }: { scheduleId: EntityId }) {
  const { status, scheduleInfo, polling, error } = useScheduledTransaction(scheduleId, {
    intervalMs: 3_000,
    timeoutMs: 120_000,
  });

  const statusColor: Record<string, string> = {
    EXECUTED: "green",
    DELETED: "orange",
    EXPIRED: "gray",
    PENDING: "blue",
  };

  return (
    <div>
      <h2>Scheduled transaction</h2>
      <p>
        Schedule ID: <code>{scheduleId}</code>
      </p>
      {polling && <p>⏳ Polling…</p>}
      {status && (
        <p style={{ color: statusColor[status] ?? "black" }}>
          Status: <strong>{status}</strong>
        </p>
      )}
      {scheduleInfo?.executedTimestamp && (
        <p>Executed at: {scheduleInfo.executedTimestamp}</p>
      )}
      {error && <p style={{ color: "red" }}>Error: {error.message}</p>}
    </div>
  );
}

// ─── Dashboard composes all three ────────────────────────────────────────────

function Dashboard({ accountId }: { accountId: EntityId }) {
  return (
    <main style={{ fontFamily: "sans-serif", padding: "2rem", maxWidth: 640 }}>
      <h1>Hiero Dashboard</h1>
      <BalanceCard accountId={accountId} />
      <hr />
      <TransactionList accountId={accountId} />
      <hr />
      {/* Replace with a real schedule ID when testing */}
      <ScheduleTracker scheduleId={"0.0.99887" as EntityId} />
    </main>
  );
}
