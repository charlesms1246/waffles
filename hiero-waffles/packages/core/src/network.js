// packages/core/src/network.ts
const MIRROR_NODE_URLS = {
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
export function resolveMirrorNodeUrl(config) {
  if (config.mirrorNodeUrl) {
    return config.mirrorNodeUrl.replace(/\/$/, "");
  }
  return MIRROR_NODE_URLS[config.network];
}
/**
 * Resolve effective configuration, applying defaults for any omitted fields.
 */
export function resolveNetworkConfig(partial) {
  return {
    network: partial.network,
    mirrorNodeUrl: partial.mirrorNodeUrl ?? MIRROR_NODE_URLS[partial.network],
    nodeAddresses: partial.nodeAddresses ?? {},
    timeoutMs: partial.timeoutMs ?? 10_000,
    maxRetries: partial.maxRetries ?? 3,
  };
}
//# sourceMappingURL=network.js.map
