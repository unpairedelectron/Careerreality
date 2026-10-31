import assert from "node:assert/strict";
import test from "node:test";
import {
  createReportRateLimiter,
  reportRateLimitMax,
  reportRateLimitWindowMs,
  ReportRateLimitUnavailableError,
  type ReportRateLimitStore,
} from "../src/lib/report-rate-limiter";

class InMemoryRateLimitStore implements ReportRateLimitStore {
  readonly keys = new Set<string>();
  private readonly buckets = new Map<
    string,
    { requestCount: number; windowStartedAt: Date }
  >();

  async consume(keyHash: string, now: Date) {
    this.keys.add(keyHash);
    const current = this.buckets.get(keyHash);
    if (
      !current ||
      now.getTime() - current.windowStartedAt.getTime() >= reportRateLimitWindowMs
    ) {
      const bucket = { requestCount: 1, windowStartedAt: now };
      this.buckets.set(keyHash, bucket);
      return bucket;
    }

    const bucket = {
      requestCount: current.requestCount + 1,
      windowStartedAt: current.windowStartedAt,
    };
    this.buckets.set(keyHash, bucket);
    return bucket;
  }
}

function createTestLimiter(
  store: InMemoryRateLimitStore,
  now: () => Date,
) {
  return createReportRateLimiter(store, {
    secret: "test-only-secret",
    now,
  });
}

test("anonymous bursts share a hashed client bucket and stop after three reports", async () => {
  let currentTime = new Date("2026-09-07T06:00:00.000Z");
  const store = new InMemoryRateLimitStore();
  const consume = createTestLimiter(store, () => currentTime);

  const results = await Promise.all(
    Array.from({ length: 10 }, () =>
      consume({ ip: "203.0.113.42" }),
    ),
  );

  assert.equal(
    results.filter((result) => !result.limited).length,
    reportRateLimitMax,
  );
  assert.equal(
    results.filter((result) => result.limited).length,
    10 - reportRateLimitMax,
  );
  assert.equal(store.keys.size, 1);
  assert.equal([...store.keys].some((key) => key.includes("203.0.113.42")), false);
});

test("signed-in users get a stable account bucket independent of their IP", async () => {
  let currentTime = new Date("2026-09-07T06:00:00.000Z");
  const store = new InMemoryRateLimitStore();
  const consume = createTestLimiter(store, () => currentTime);

  for (let index = 0; index < reportRateLimitMax; index += 1) {
    const result = await consume({
      userId: "user_123",
      ip: `198.51.100.${index + 1}`,
    });
    assert.equal(result.limited, false);
  }
  const blocked = await consume({
    userId: "user_123",
    ip: "198.51.100.99",
  });
  const differentUser = await consume({
    userId: "user_456",
    ip: "198.51.100.99",
  });
  const anonymous = await consume({ ip: "198.51.100.99" });

  assert.equal(blocked.limited, true);
  assert.equal(differentUser.limited, false);
  assert.equal(anonymous.limited, false);
  assert.equal(store.keys.size, 3);
  assert.equal([...store.keys].some((key) => key.includes("user_123")), false);
});

test("scoped anonymous requests have independent HMAC buckets", async () => {
  const store = new InMemoryRateLimitStore();
  const consume = createTestLimiter(store, () => new Date("2026-09-07T06:00:00.000Z"));

  for (let index = 0; index < reportRateLimitMax; index += 1) {
    assert.equal((await consume({ ip: "203.0.113.42" })).limited, false);
    assert.equal((await consume({ scope: "public-job-link-fetch", ip: "203.0.113.42" })).limited, false);
  }

  assert.equal((await consume({ ip: "203.0.113.42" })).limited, true);
  assert.equal((await consume({ scope: "public-job-link-fetch", ip: "203.0.113.42" })).limited, true);
  assert.equal(store.keys.size, 2);
  assert.equal([...store.keys].some((key) => key.includes("203.0.113.42")), false);
});

test("retry timing points to the end of the current window and resets afterward", async () => {
  let currentTime = new Date("2026-09-07T06:00:30.000Z");
  const store = new InMemoryRateLimitStore();
  const consume = createTestLimiter(store, () => currentTime);

  for (let index = 0; index < reportRateLimitMax; index += 1) {
    await consume({ ip: "192.0.2.20" });
  }

  currentTime = new Date("2026-09-07T06:01:00.000Z");
  const blocked = await consume({ ip: "192.0.2.20" });
  assert.equal(blocked.limited, true);
  assert.equal(blocked.retryAfterSeconds, 870);

  currentTime = new Date("2026-09-07T06:15:31.000Z");
  const reset = await consume({ ip: "192.0.2.20" });
  assert.equal(reset.limited, false);
  assert.equal(reset.retryAfterSeconds, 900);
});

test("shared-store failures become a non-sensitive unavailable error", async () => {
  const consume = createReportRateLimiter(
    {
      async consume() {
        throw new Error("database connection details must not escape");
      },
    },
    {
      secret: "test-only-secret",
      now: () => new Date("2026-09-07T06:00:00.000Z"),
    },
  );

  await assert.rejects(
    consume({ ip: "198.51.100.77" }),
    (error: unknown) => {
      assert.equal(error instanceof ReportRateLimitUnavailableError, true);
      assert.equal((error as Error).message, "Report rate limiter unavailable");
      assert.equal((error as Error).message.includes("198.51.100.77"), false);
      assert.equal((error as Error).message.includes("database connection"), false);
      return true;
    },
  );
});