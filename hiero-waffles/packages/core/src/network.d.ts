/** Supported Hiero network environments. */
export type HieroNetwork = "mainnet" | "testnet" | "previewnet" | "local";
export interface NetworkConfig {
    /** The Hiero network to target. */
    network: HieroNetwork;
    /** Mirror Node base URL (auto-derived when omitted). */
    mirrorNodeUrl?: string;
    /** Consensus Node addresses, keyed by account ID string (e.g. "0.0.3"). */
    nodeAddresses?: Record<string, string>;
    /** Request timeout in milliseconds (default: 10_000). */
    timeoutMs?: number;
    /** Maximum number of automatic retries (default: 3). */
    maxRetries?: number;
}
/**
 * Resolve the Mirror Node REST API base URL for a given network.
 *
 * @param config - Network configuration object.
 * @returns The fully-qualified base URL (no trailing slash).
 *
 * @example
 * const url = resolveMirrorNodeUrl({ network: "testnet" });
 * // → "https://testnet.mirrornode.hedera.com"
 */
export declare function resolveMirrorNodeUrl(config: NetworkConfig): string;
/**
 * Resolve effective configuration, applying defaults for any omitted fields.
 */
export declare function resolveNetworkConfig(partial: NetworkConfig): Required<NetworkConfig>;
//# sourceMappingURL=network.d.ts.map