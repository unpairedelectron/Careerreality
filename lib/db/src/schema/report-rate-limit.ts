import { index, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const reportRateLimitBucketsTable = pgTable(
  "report_rate_limit_buckets",
  {
    keyHash: text("key_hash").primaryKey(),
    windowStartedAt: timestamp("window_started_at", {
      withTimezone: true,
    }).notNull(),
    requestCount: integer("request_count").notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("report_rate_limit_buckets_updated_at_idx").on(table.updatedAt),
  ],
);

export type ReportRateLimitBucket = typeof reportRateLimitBucketsTable.$inferSelect;