import type { EntityId, PaginationOptions, TimestampRange } from "@hiero-waffles/core";
// packages/mirror-node/src/queries/accounts.ts
import type { MirrorNodeClient } from "../client.js";
import { collectAll, paginate } from "../pagination/paginator.js";

// ─── Response shapes ─────────────────────────────────────────────────────────

export interface AccountBalance {
  account: EntityId;
  balance: number;
  tokens: Array<{ token_id: EntityId; balance: number }>;
}

export interface AccountInfo {
  account: EntityId;
  alias: string | null;
  auto_renew_period: number;
  balance: AccountBalance;
  created_timestamp: string;
  decline_reward: boolean;
  deleted: boolean;
  ethereum_nonce: number;
  evm_address: string;
  expiry_timestamp: string | null;
  key: { _type: string; key: string } | null;
  max_automatic_token_associations: number;
  memo: string;
  pending_reward: number;
  receiver_sig_required: boolean;
  stake_period_start: string | null;
}

// ─── Query builder ────────────────────────────────────────────────────────────

export interface GetAccountOptions {
  /** Include balance detail in the response (default: true). */
  includeBalance?: boolean;
}

export interface ListTransactionsOptions extends PaginationOptions {
  timestampRange?: TimestampRange;
  /** Filter to a specific transaction type, e.g. "CRYPTOTRANSFER". */
  type?: string;
  /** Filter to a specific result, e.g. "SUCCESS". */
  result?: "SUCCESS" | "FAIL";
}

/**
 * Provides typed queries for the Mirror Node `/api/v1/accounts` endpoint.
 *
 * @example
 * const accounts = new AccountQueries(client);
 * const info = await accounts.getAccount("0.0.1234");
 * console.log(info.balance.balance); // hbar balance in tinybars
 */
export class AccountQueries {
  constructor(private readonly client: MirrorNodeClient) {}

  /**
   * Fetch detailed information for a single account.
   */
  async getAccount(
    accountId: EntityId,
    options?: GetAccountOptions,
  ): Promise<AccountInfo> {
    const params = options?.includeBalance === false ? { balance: false } : undefined;
    return this.client.get<AccountInfo>(`/api/v1/accounts/${accountId}`, params);
  }

  /**
   * Iterate over transactions for an account, page by page.
   *
   * @example
   * for await (const page of accounts.listTransactions("0.0.1234", { limit: 50 })) {
   *   processPage(page.items);
   * }
   */
  listTransactions(accountId: EntityId, options?: ListTransactionsOptions) {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: options?.limit ?? 25,
      order: options?.order ?? "desc",
      type: options?.type,
      result: options?.result,
    };

    if (options?.timestampRange?.from) {
      params.timestamp = `gte:${options.timestampRange.from}`;
    }
    if (options?.timestampRange?.to) {
      params.timestamp = `lte:${options.timestampRange.to}`;
    }

    return paginate<unknown>({
      client: this.client,
      path: "/api/v1/transactions",
      itemsKey: "transactions",
      params: { ...params, "account.id": accountId },
    });
  }

  /**
   * Collect all transactions for an account (all pages).
   * Use for small result sets only; prefer {@link listTransactions} otherwise.
   */
  async getAllTransactions(
    accountId: EntityId,
    options?: ListTransactionsOptions & { maxItems?: number },
  ): Promise<unknown[]> {
    const params: Record<string, string | number | boolean | undefined> = {
      limit: options?.limit ?? 100,
      order: options?.order ?? "desc",
      type: options?.type,
      result: options?.result,
      "account.id": accountId,
    };

    return collectAll<unknown>({
      client: this.client,
      path: "/api/v1/transactions",
      itemsKey: "transactions",
      params,
      ...(options?.maxItems !== undefined ? { maxItems: options.maxItems } : {}),
    });
  }
}
