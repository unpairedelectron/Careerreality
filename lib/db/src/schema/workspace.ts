import { index, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();

export const savedCareerDecisionsTable = pgTable(
  "saved_career_decisions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind", { enum: ["salary", "risk", "company", "ai"] }).notNull(),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    signal: text("signal").notNull(),
    createdAt,
  },
  (table) => [index("saved_career_decisions_user_created_at_idx").on(table.userId, table.createdAt)],
);

export const companyWatchlistItemsTable = pgTable(
  "company_watchlist_items",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    company: text("company").notNull(),
    note: text("note").notNull(),
    signal: text("signal").notNull(),
    createdAt,
  },
  (table) => [
    index("company_watchlist_items_user_created_at_idx").on(table.userId, table.createdAt),
    uniqueIndex("company_watchlist_items_user_company_key").on(table.userId, table.company),
  ],
);

export const insertSavedCareerDecisionSchema = createInsertSchema(
  savedCareerDecisionsTable,
).omit({ id: true, createdAt: true });
export type InsertSavedCareerDecision = z.infer<
  typeof insertSavedCareerDecisionSchema
>;
export type SavedCareerDecision = typeof savedCareerDecisionsTable.$inferSelect;

export const insertCompanyWatchlistItemSchema = createInsertSchema(
  companyWatchlistItemsTable,
).omit({ id: true, createdAt: true });
export type InsertCompanyWatchlistItem = z.infer<
  typeof insertCompanyWatchlistItemSchema
>;
export type CompanyWatchlistItem = typeof companyWatchlistItemsTable.$inferSelect;