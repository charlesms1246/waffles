// packages/mirror-node/src/__tests__/client.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MirrorNodeClient } from "../client.js";
import { MirrorNodeError } from "@hiero-sdk-utils/core";

function makeFetch(status: number, body: unknown) {
  return vi.fn().mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
    text: () => Promise.resolve(String(body)),
  });
}

describe("MirrorNodeClient", () => {
  let client: MirrorNodeClient;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = makeFetch(200, { account: "0.0.1234" });
    client = new MirrorNodeClient({
      networkConfig: { network: "testnet", maxRetries: 1 },
      fetch: fetchMock as typeof globalThis.fetch,
    });
  });

  it("calls the correct URL for a given path", async () => {
    await client.get("/api/v1/accounts/0.0.1234");
    expect(fetchMock).toHaveBeenCalledWith(
      "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.1234",
      expect.objectContaining({ headers: { Accept: "application/json" } }),
    );
  });

  it("appends query params to the URL", async () => {
    await client.get("/api/v1/accounts", { limit: 10, order: "asc" });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toContain("limit=10");
    expect(url).toContain("order=asc");
  });

  it("omits undefined query params", async () => {
    await client.get("/api/v1/accounts", { limit: 10, order: undefined });
    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).not.toContain("order");
  });

  it("returns the parsed JSON body", async () => {
    const result = await client.get<{ account: string }>(
      "/api/v1/accounts/0.0.1234",
    );
    expect(result).toEqual({ account: "0.0.1234" });
  });

  it("throws MirrorNodeError on 404", async () => {
    fetchMock = makeFetch(404, { _status: { messages: [{ message: "Not found" }] } });
    client = new MirrorNodeClient({
      networkConfig: { network: "testnet", maxRetries: 1 },
      fetch: fetchMock as typeof globalThis.fetch,
    });

    await expect(client.get("/api/v1/accounts/0.0.9999")).rejects.toBeInstanceOf(
      MirrorNodeError,
    );
  });

  it("includes the status code on MirrorNodeError", async () => {
    fetchMock = makeFetch(429, "rate limited");
    client = new MirrorNodeClient({
      networkConfig: { network: "testnet", maxRetries: 1 },
      fetch: fetchMock as typeof globalThis.fetch,
    });

    try {
      await client.get("/api/v1/accounts/0.0.1");
    } catch (err) {
      expect(err).toBeInstanceOf(MirrorNodeError);
      expect((err as MirrorNodeError).statusCode).toBe(429);
    }
  });
});
