import { pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const layoffAlertSubscriptionsTable = pgTable(
  "layoff_alert_subscriptions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    emailHash: text("email_hash").notNull(),
    companySlugs: text("company_slugs").array().notNull(),
    city: text("city"),
    sector: text("sector"),
    status: text("status", {
      enum: ["pending", "confirmed", "unsubscribed"],
    }).notNull().default("pending"),
    confirmationTokenHash: text("confirmation_token_hash"),
    confirmationExpiresAt: timestamp("confirmation_expires_at", { withTimezone: true }),
    unsubscribeTokenHash: text("unsubscribe_token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
    unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  },
  (table) => [uniqueIndex("layoff_alert_subscriptions_email_hash_key").on(table.emailHash)],
);

export type LayoffAlertSubscription =
  typeof layoffAlertSubscriptionsTable.$inferSelect;
