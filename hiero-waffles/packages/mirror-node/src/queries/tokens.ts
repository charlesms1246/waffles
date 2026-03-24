import type { EntityId, PaginationOptions } from "@hiero-waffles/core";
// packages/mirror-node/src/queries/tokens.ts
import type { MirrorNodeClient } from "../client.js";
import { collectAll, paginate } from "../pagination/paginator.js";

// ─── Response shapes ─────────────────────────────────────────────────────────

export type TokenType = "FUNGIBLE_COMMON" | "NON_FUNGIBLE_UNIQUE";

export interface TokenInfo {
  token_id: EntityId;
  name: string;
  symbol: string;
  decimals: string;
  total_supply: string;
  max_supply: string;
  type: TokenType;
  treasury_account_id: EntityId;
  created_timestamp: string;
  deleted: boolean | null;
  freeze_default: boolean;
  memo: string;
  modified_timestamp: string;
  supply_type: "INFINITE" | "FINITE";
  wipe_key: { _type: string; key: string } | null;
  admin_key: { _type: string; key: string } | null;
}

export interface NftInfo {
  token_id: EntityId;
  serial_number: number;
  account_id: EntityId;
  created_timestamp: string;
  delegating_spender: EntityId | null;
  deleted: boolean;
  metadata: string; // base64-encoded
  modified_timestamp: string;
  spender: EntityId | null;
}

// ─── Query builder ────────────────────────────────────────────────────────────

export interface ListTokensOptions extends PaginationOptions {
  /** Filter by account that holds the token. */
  accountId?: EntityId;
  /** Filter by token type. */
  type?: TokenType;
}

export interface ListNftsOptions extends PaginationOptions {
  /** Filter by the account currently holding the NFT. */
  accountId?: EntityId;
}

/**
 * Provides typed queries for the Mirror Node `/api/v1/tokens` endpoint.
 *
 * @example
 * const tokens = new TokenQueries(client);
 * const info = await tokens.getToken("0.0.1234567");
 * console.log(info.name, info.symbol);
 */
export class TokenQueries {
  constructor(private readonly client: MirrorNodeClient) {}

  /**
   * Fetch metadata for a single token.
   */
  async getToken(tokenId: EntityId): Promise<TokenInfo> {
    return this.client.get<TokenInfo>(`/api/v1/tokens/${tokenId}`);
  }

  /**
   * Iterate over tokens, optionally filtered by account or type.
   */
  listTokens(options?: ListTokensOptions) {
    return paginate<TokenInfo>({
      client: this.client,
      path: "/api/v1/tokens",
      itemsKey: "tokens",
      params: {
        limit: options?.limit ?? 25,
        order: options?.order ?? "asc",
        "account.id": options?.accountId,
        type: options?.type,
      },
    });
  }

  /**
   * Collect all tokens (all pages).
   */
  async getAllTokens(options?: ListTokensOptions): Promise<TokenInfo[]> {
    return collectAll<TokenInfo>({
      client: this.client,
      path: "/api/v1/tokens",
      itemsKey: "tokens",
      params: {
        limit: options?.limit ?? 100,
        order: options?.order ?? "asc",
        "account.id": options?.accountId,
        type: options?.type,
      },
    });
  }

  /**
   * Fetch a specific NFT by token ID and serial number.
   */
  async getNft(tokenId: EntityId, serialNumber: number): Promise<NftInfo> {
    return this.client.get<NftInfo>(`/api/v1/tokens/${tokenId}/nfts/${serialNumber}`);
  }

  /**
   * Iterate over NFTs for a token, optionally filtered to a specific holder.
   */
  listNfts(tokenId: EntityId, options?: ListNftsOptions) {
    return paginate<NftInfo>({
      client: this.client,
      path: `/api/v1/tokens/${tokenId}/nfts`,
      itemsKey: "nfts",
      params: {
        limit: options?.limit ?? 25,
        order: options?.order ?? "asc",
        "account.id": options?.accountId,
      },
    });
  }
}
