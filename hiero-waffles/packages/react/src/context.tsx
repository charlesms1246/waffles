// packages/react/src/context.tsx
//
// Provides a React context that holds a configured HieroMirrorClient so
// descendant components never need to instantiate the client themselves.

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";
import { HieroMirrorClient } from "@hiero-waffles/mirror-node";
import type { NetworkConfig } from "@hiero-waffles/core";
import { ConfigurationError } from "@hiero-waffles/core";

// ─── Context shape ────────────────────────────────────────────────────────────

export interface HieroContextValue {
  /** Pre-configured Mirror Node client shared across the component tree. */
  mirrorClient: HieroMirrorClient;
  /** Active network configuration. */
  networkConfig: NetworkConfig;
}

const HieroContext = createContext<HieroContextValue | null>(null);
HieroContext.displayName = "HieroContext";

// ─── Provider ─────────────────────────────────────────────────────────────────

export interface HieroProviderProps {
  children: ReactNode;
  /** Network the application targets. */
  networkConfig: NetworkConfig;
  /**
   * Bring-your-own `HieroMirrorClient` instance.
   * When omitted a client is created from `networkConfig`.
   * Useful for testing — inject a mock client here.
   */
  mirrorClient?: HieroMirrorClient;
}

/**
 * Mount this provider near the root of your application.
 * All `useHiero`, `useBalance`, and `useTransactions` hooks require it.
 *
 * @example
 * // main.tsx
 * import { HieroProvider } from "@hiero-waffles/react";
 *
 * root.render(
 *   <HieroProvider networkConfig={{ network: "testnet" }}>
 *     <App />
 *   </HieroProvider>
 * );
 */
export function HieroProvider({
  children,
  networkConfig,
  mirrorClient: externalClient,
}: HieroProviderProps) {
  const mirrorClient = useMemo(
    () => externalClient ?? new HieroMirrorClient(networkConfig),
    // Re-create only when the network actually changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [networkConfig.network, networkConfig.mirrorNodeUrl, externalClient],
  );

  const value = useMemo<HieroContextValue>(
    () => ({ mirrorClient, networkConfig }),
    [mirrorClient, networkConfig],
  );

  return (
    <HieroContext.Provider value={value}>{children}</HieroContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Access the shared Hiero context.
 *
 * @throws {ConfigurationError} when used outside of {@link HieroProvider}.
 *
 * @example
 * const { mirrorClient, networkConfig } = useHiero();
 */
export function useHiero(): HieroContextValue {
  const ctx = useContext(HieroContext);
  if (!ctx) {
    throw new ConfigurationError(
      "useHiero must be used inside <HieroProvider>. " +
        "Wrap your app (or the relevant subtree) with <HieroProvider networkConfig={...}>.",
    );
  }
  return ctx;
}
