// packages/mirror-node/src/__tests__/paginator.test.ts
import { describe, expect, it, vi } from "vitest";
import type { MirrorNodeClient } from "../client.js";
import { collectAll, paginate } from "../pagination/paginator.js";

function makeClient(pages: Array<{ items: string[]; nextPath: string | null }>) {
  let callIndex = 0;
  const getMock = vi.fn().mockImplementation(async () => {
    const page = pages[callIndex] ?? { items: [], nextPath: null };
    callIndex++;
    return {
      items: page.items,
      links: { next: page.nextPath },
    };
  });
  return { get: getMock } as unknown as MirrorNodeClient;
}

describe("paginate", () => {
  it("yields a single page when there is no next link", async () => {
    const client = makeClient([{ items: ["a", "b"], nextPath: null }]);
    const pages: Array<{ items: string[]; next: string | null }> = [];
    for await (const page of paginate<string>({
      client,
      path: "/items",
      itemsKey: "items",
    })) {
      pages.push(page);
    }
    expect(pages).toHaveLength(1);
    const firstPage = pages[0];
    expect(firstPage).toBeDefined();
    if (!firstPage) {
      throw new Error("Expected the first page to be present");
    }
    expect(firstPage.items).toEqual(["a", "b"]);
    expect(firstPage.next).toBeNull();
  });

  it("follows next links across multiple pages", async () => {
    const client = makeClient([
      { items: ["a", "b"], nextPath: "/items?cursor=2" },
      { items: ["c", "d"], nextPath: "/items?cursor=3" },
      { items: ["e"], nextPath: null },
    ]);

    const allItems: string[] = [];
    for await (const page of paginate<string>({
      client,
      path: "/items",
      itemsKey: "items",
    })) {
      allItems.push(...page.items);
    }
    expect(allItems).toEqual(["a", "b", "c", "d", "e"]);
  });

  it("respects maxItems and stops early", async () => {
    const client = makeClient([
      { items: ["a", "b", "c"], nextPath: "/items?cursor=2" },
      { items: ["d", "e"], nextPath: null },
    ]);

    const allItems: string[] = [];
    for await (const page of paginate<string>({
      client,
      path: "/items",
      itemsKey: "items",
      maxItems: 4,
    })) {
      allItems.push(...page.items);
    }
    expect(allItems).toHaveLength(4);
    expect(allItems).toEqual(["a", "b", "c", "d"]);
  });
});

describe("collectAll", () => {
  it("returns all items across all pages as a flat array", async () => {
    const client = makeClient([
      { items: ["x", "y"], nextPath: "/items?cursor=2" },
      { items: ["z"], nextPath: null },
    ]);

    const result = await collectAll<string>({
      client,
      path: "/items",
      itemsKey: "items",
    });
    expect(result).toEqual(["x", "y", "z"]);
  });
});
