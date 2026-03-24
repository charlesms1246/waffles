// packages/mirror-node/src/index.ts

export { MirrorNodeClient } from "./client.js";
export type { MirrorNodeClientOptions } from "./client.js";

export { paginate, collectAll } from "./pagination/paginator.js";
export type { PaginatorOptions } from "./pagination/paginator.js";
export type { Page } from "@hiero-waffles/core";

export { AccountQueries } from "./queries/accounts.js";
export type {
  AccountInfo,
  AccountBalance,
  GetAccountOptions,
  ListTransactionsOptions,
} from "./queries/accounts.js";

export { TokenQueries } from "./queries/tokens.js";
export type {
  TokenInfo,
  NftInfo,
  TokenType,
  ListTokensOptions,
  ListNftsOptions,
} from "./queries/tokens.js";

// ─── High-level facade ────────────────────────────────────────────────────────

import { MirrorNodeClient } from "./client.js";
import { AccountQueries } from "./queries/accounts.js";
import { TokenQueries } from "./queries/tokens.js";
import type { NetworkConfig } from "@hiero-waffles/core";
import type { MirrorNodeClientOptions } from "./client.js";

/**
 * Unified facade over all Mirror Node query builders.
 *
 * This is the primary entry point for most consumers. It composes
 * {@link AccountQueries} and {@link TokenQueries} onto a single object,
 * so you only need to instantiate one class.
 *
 * @example
 * import { HieroMirrorClient } from "@hiero-waffles/mirror-node";
 *
 * const mirror = new HieroMirrorClient({ network: "testnet" });
 *
 * // Fetch account info
 * const info = await mirror.accounts.getAccount("0.0.1234");
 *
 * // Stream all NFTs for a token
 * for await (const page of mirror.tokens.listNfts("0.0.9999")) {
 *   console.log(page.items);
 * }
 */
export class HieroMirrorClient {
  private readonly _http: MirrorNodeClient;

  /** Typed queries for accounts and their transactions. */
  readonly accounts: AccountQueries;

  /** Typed queries for fungible tokens and NFTs. */
  readonly tokens: TokenQueries;

  constructor(
    networkConfig: NetworkConfig,
    options?: Omit<MirrorNodeClientOptions, "networkConfig">,
  ) {
    this._http = new MirrorNodeClient({ networkConfig, ...options });
    this.accounts = new AccountQueries(this._http);
    this.tokens = new TokenQueries(this._http);
  }

  /**
   * Access the raw HTTP client for endpoints not yet covered by a query class.
   */
  get http(): MirrorNodeClient {
    return this._http;
  }
}
