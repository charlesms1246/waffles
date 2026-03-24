// packages/core/src/network.ts

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

const MIRROR_NODE_URLS: Record<HieroNetwork, string> = {
  mainnet: "https://mainnet-public.mirrornode.hedera.com",
  testnet: "https://testnet.mirrornode.hedera.com",
  previewnet: "https://previewnet.mirrornode.hedera.com",
  local: "http://localhost:5551",
};

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
export function resolveMirrorNodeUrl(config: NetworkConfig): string {
  if (config.mirrorNodeUrl) {
    return config.mirrorNodeUrl.replace(/\/$/, "");
  }
  return MIRROR_NODE_URLS[config.network];
}

/**
 * Resolve effective configuration, applying defaults for any omitted fields.
 */
export function resolveNetworkConfig(partial: NetworkConfig): Required<NetworkConfig> {
  return {
    network: partial.network,
    mirrorNodeUrl: partial.mirrorNodeUrl ?? MIRROR_NODE_URLS[partial.network],
    nodeAddresses: partial.nodeAddresses ?? {},
    timeoutMs: partial.timeoutMs ?? 10_000,
    maxRetries: partial.maxRetries ?? 3,
  };
}
