// packages/core/src/__tests__/network.test.ts
import { describe, it, expect } from "vitest";
import {
  resolveMirrorNodeUrl,
  resolveNetworkConfig,
  type NetworkConfig,
} from "../network.js";

describe("resolveMirrorNodeUrl", () => {
  it("returns the canonical testnet URL by default", () => {
    const cfg: NetworkConfig = { network: "testnet" };
    expect(resolveMirrorNodeUrl(cfg)).toBe(
      "https://testnet.mirrornode.hedera.com",
    );
  });

  it("returns the canonical mainnet URL", () => {
    expect(resolveMirrorNodeUrl({ network: "mainnet" })).toBe(
      "https://mainnet-public.mirrornode.hedera.com",
    );
  });

  it("uses a custom mirrorNodeUrl when provided", () => {
    const cfg: NetworkConfig = {
      network: "testnet",
      mirrorNodeUrl: "https://my-mirror.example.com/",
    };
    // Trailing slash should be stripped
    expect(resolveMirrorNodeUrl(cfg)).toBe("https://my-mirror.example.com");
  });

  it("resolves local to localhost", () => {
    expect(resolveMirrorNodeUrl({ network: "local" })).toBe(
      "http://localhost:5551",
    );
  });
});

describe("resolveNetworkConfig", () => {
  it("fills in defaults when optional fields are omitted", () => {
    const resolved = resolveNetworkConfig({ network: "testnet" });
    expect(resolved.timeoutMs).toBe(10_000);
    expect(resolved.maxRetries).toBe(3);
    expect(resolved.nodeAddresses).toEqual({});
  });

  it("preserves explicit overrides", () => {
    const resolved = resolveNetworkConfig({
      network: "mainnet",
      timeoutMs: 5_000,
      maxRetries: 1,
    });
    expect(resolved.timeoutMs).toBe(5_000);
    expect(resolved.maxRetries).toBe(1);
  });
});
