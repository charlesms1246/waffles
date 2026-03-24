# Changelog

All notable changes to `hiero-waffles` packages are documented here.

This file is generated automatically by
[Changesets](https://github.com/changesets/changesets).
Do not edit it manually — run `pnpm changeset` to record changes.

---

## Unreleased

### hiero-waffles@1.0.7

- Added explicit root `exports` entries for `./core`, `./mirror-node`,
  `./scheduled-tx`, and `./react`, all pointing to production `dist` outputs.
- Restricted root publish contents via `files` so the npm tarball contains only
  essential metadata and built `dist` artifacts.

### @hiero-waffles/core@0.1.0

**Initial release.**

- `NetworkConfig` type and `resolveMirrorNodeUrl` / `resolveNetworkConfig` helpers.
- Typed error hierarchy: `HieroError`, `MirrorNodeError`, `RetryExhaustedError`,
  `ScheduledTransactionError`, `ConfigurationError`.
- `withRetry` utility with exponential back-off and full jitter.
- Shared types: `EntityId`, `Page<T>`, `PaginationOptions`, `TimestampRange`.

### @hiero-waffles/mirror-node@0.1.0

**Initial release.**

- `HieroMirrorClient` — unified facade over all query builders.
- `MirrorNodeClient` — low-level HTTP client with retry and typed errors.
- `AccountQueries` — typed `getAccount` and paginated `listTransactions`.
- `TokenQueries` — typed `getToken`, `getNft`, `listTokens`, `listNfts`.
- `paginate<T>` — async generator following `links.next` cursors.
- `collectAll<T>` — convenience wrapper to collect all pages into an array.

### @hiero-waffles/scheduled-tx@0.1.0

**Initial release.**

- `ScheduledTransactionHelper` — `create`, `sign`, and `delete` helpers.
- `waitForScheduledTransaction` — Mirror Node poller with configurable
  interval and timeout; throws `ScheduledTransactionError` on terminal
  non-executed states.

### @hiero-waffles/react@0.1.0

**Initial release.**

- `HieroProvider` — React context provider for network configuration.
- `useHiero` — access the shared `mirrorClient` and `networkConfig`.
- `useBalance` — reactive HBAR and token balance with optional polling.
- `useTransactions` — paginated transaction history with load-more.
- `useScheduledTransaction` — polls a schedule ID and surfaces reactive status.
