import assert from "node:assert/strict";
import test from "node:test";
import { createFreshnessCache } from "../src/lib/freshness-cache";

test("returns cached values within the freshness window", async () => {
  let currentTime = 1_000;
  let loads = 0;
  const cache = createFreshnessCache(60_000, () => currentTime);

  const first = await cache.get("user_123", async () => {
    loads += 1;
    return "first";
  });
  const second = await cache.get("user_123", async () => {
    loads += 1;
    return "second";
  });

  assert.equal(first.status, "refreshed");
  assert.equal(second.status, "fresh");
  assert.equal(second.value, "first");
  assert.equal(loads, 1);

  currentTime += 60_001;
  const third = await cache.get("user_123", async () => {
    loads += 1;
    return "third";
  });
  assert.equal(third.status, "refreshed");
  assert.equal(third.value, "third");
  assert.equal(loads, 2);
});

test("coalesces concurrent reads and does not cache failures", async () => {
  let loads = 0;
  let resolveLoad: ((value: string) => void) | undefined;
  const cache = createFreshnessCache(60_000);
  const pendingLoad = new Promise<string>((resolve) => {
    resolveLoad = resolve;
  });

  const first = cache.get("user_123", async () => {
    loads += 1;
    return pendingLoad;
  });
  const second = cache.get("user_123", async () => {
    loads += 1;
    return "unexpected";
  });

  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(loads, 1);
  resolveLoad?.("shared");
  assert.deepEqual(await Promise.all([first, second]), [
    { status: "refreshed", value: "shared" },
    { status: "coalesced", value: "shared" },
  ]);

  const failingCache = createFreshnessCache(60_000);
  await assert.rejects(failingCache.get("user_456", async () => {
    throw new Error("live source unavailable");
  }));
  const retry = await failingCache.get("user_456", async () => "recovered");
  assert.equal(retry.status, "refreshed");
  assert.equal(retry.value, "recovered");
});