import { createHmac } from "node:crypto";
import {
  db,
  reportRateLimitBucketsTable,
} from "@workspace/db";
import { lt, sql } from "drizzle-orm";

export const reportRateLimitWindowMs = 15 * 60 * 1000;
export const reportRateLimitMax = 3;

type ReportRateLimitIdentity = {
  scope?: string;
  userId?: string | null;
  ip?: string | null;
};

type ReportRateLimitBucket = {
  requestCount: number;
  windowStartedAt: Date;
};

export type ReportRateLimitStore = {
  consume: (
    keyHash: string,
    now: Date,
  ) => Promise<ReportRateLimitBucket>;
};

export type ReportRateLimitDecision = {
  limited: boolean;
  retryAfterSeconds: number;
};

export class ReportRateLimitUnavailableError extends Error {
  constructor() {
    super("Report rate limiter unavailable");
    this.name = "ReportRateLimitUnavailableError";
  }
}

export function reportRateLimitIdentity({
  scope,
  userId,
  ip,
}: ReportRateLimitIdentity): string {
  const identity = userId ? `user:${userId}` : `ip:${ip || "unknown-client"}`;
  return scope ? `${scope}:${identity}` : identity;
}

export function hashReportRateLimitIdentity(
  identity: string,
  secret: string,
): string {
  return createHmac("sha256", secret)
    .update(`careerreality-report-rate-limit:${identity}`)
    .digest("hex");
}

export function retryAfterSeconds(
  windowStartedAt: Date,
  now: Date,
  windowMs = reportRateLimitWindowMs,
): number {
  return Math.max(
    1,
    Math.ceil(
      (windowStartedAt.getTime() + windowMs - now.getTime()) / 1000,
    ),
  );
}

export function createReportRateLimiter(
  store: ReportRateLimitStore,
  {
    secret,
    max = reportRateLimitMax,
    windowMs = reportRateLimitWindowMs,
    now = () => new Date(),
  }: {
    secret: string;
    max?: number;
    windowMs?: number;
    now?: () => Date;
  },
) {
  return async function consume(
    identity: ReportRateLimitIdentity,
  ): Promise<ReportRateLimitDecision> {
    const currentTime = now();
    const keyHash = hashReportRateLimitIdentity(
      reportRateLimitIdentity(identity),
      secret,
    );
    let bucket: ReportRateLimitBucket;
    try {
      bucket = await store.consume(keyHash, currentTime);
    } catch {
      throw new ReportRateLimitUnavailableError();
    }

    return {
      limited: bucket.requestCount > max,
      retryAfterSeconds: retryAfterSeconds(
        bucket.windowStartedAt,
        currentTime,
        windowMs,
      ),
    };
  };
}

const databaseRateLimitStore: ReportRateLimitStore = {
  async consume(keyHash, now) {
    const expired = sql`
      ${reportRateLimitBucketsTable.windowStartedAt}
      <= CURRENT_TIMESTAMP - interval '15 minutes'
    `;

    const [bucket] = await db
      .insert(reportRateLimitBucketsTable)
      .values({
        keyHash,
        windowStartedAt: now,
        requestCount: 1,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: reportRateLimitBucketsTable.keyHash,
        set: {
          windowStartedAt: sql`
            case when ${expired}
              then ${now}
              else ${reportRateLimitBucketsTable.windowStartedAt}
            end
          `,
          requestCount: sql`
            case when ${expired}
              then 1
              else ${reportRateLimitBucketsTable.requestCount} + 1
            end
          `,
          updatedAt: now,
        },
      })
      .returning({
        requestCount: reportRateLimitBucketsTable.requestCount,
        windowStartedAt: reportRateLimitBucketsTable.windowStartedAt,
      });

    if (!bucket) {
      throw new Error("Unable to update report rate limit bucket");
    }
    return bucket;
  },
};

let lastCleanupAt = 0;
async function pruneExpiredRateLimitBuckets(now: Date): Promise<void> {
  if (now.getTime() - lastCleanupAt < reportRateLimitWindowMs) return;
  lastCleanupAt = now.getTime();
  await db
    .delete(reportRateLimitBucketsTable)
    .where(
      lt(
        reportRateLimitBucketsTable.updatedAt,
        new Date(now.getTime() - reportRateLimitWindowMs * 2),
      ),
    );
}

const rateLimitSecret =
  process.env.SESSION_SECRET ??
  (process.env.NODE_ENV === "production"
    ? (() => {
        throw new Error("SESSION_SECRET must be set for report rate limiting");
      })()
    : "careerreality-development-rate-limit");

export const consumeReportRateLimit = createReportRateLimiter(
  {
    async consume(keyHash, now) {
      await pruneExpiredRateLimitBuckets(now);
      return databaseRateLimitStore.consume(keyHash, now);
    },
  },
  { secret: rateLimitSecret },
);