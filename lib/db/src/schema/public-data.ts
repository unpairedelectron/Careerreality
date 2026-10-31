import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

export type PublicDataProvenanceStatus =
  | "VERIFIED"
  | "DERIVED"
  | "ESTIMATED"
  | "UNVERIFIED"
  | "LEGACY";

export type PublicDataConfidence = "High" | "Medium" | "Low" | "Mixed";

export type PublicDataProvenance = {
  status: PublicDataProvenanceStatus;
  sourceType: string;
  publicationDate: string;
  retrievedDate: string;
  reviewedAt: string;
  metric: string;
  transformation: string;
  methodologyName: string;
  methodologyVersion: string;
  methodologyInputs: string[];
  methodologyCalculation: string;
  confidence: PublicDataConfidence;
  limitations: string[];
  reviewerId: string;
};

const refreshedAt = timestamp("refreshed_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const salaryBenchmarksTable = pgTable(
  "salary_benchmarks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    role: text("role").notNull(),
    city: text("city").notNull(),
    experienceBand: text("experience_band").notNull(),
    p25: integer("p25").notNull(),
    median: integer("median").notNull(),
    p75: integer("p75").notNull(),
    sampleSize: integer("sample_size").notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    provenance: jsonb("provenance").$type<PublicDataProvenance>(),
    confidence: text("confidence", {
      enum: ["High", "Medium", "Low", "Mixed"],
    }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    refreshedAt,
  },
  (table) => [
    uniqueIndex("salary_benchmarks_role_city_experience_key").on(
      table.role,
      table.city,
      table.experienceBand,
    ),
    index("salary_benchmarks_city_role_idx").on(table.city, table.role),
    index("salary_benchmarks_refreshed_at_idx").on(table.refreshedAt),
  ],
);

export const companySignalsTable = pgTable(
  "company_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    sector: text("sector").notNull(),
    stability: integer("stability").notNull(),
    momentum: text("momentum").notNull(),
    signal: text("signal").notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    provenance: jsonb("provenance").$type<PublicDataProvenance>(),
    confidence: text("confidence", {
      enum: ["High", "Medium", "Low", "Mixed"],
    }).notNull(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    refreshedAt,
  },
  (table) => [
    uniqueIndex("company_signals_slug_key").on(table.slug),
    index("company_signals_sector_idx").on(table.sector),
    index("company_signals_refreshed_at_idx").on(table.refreshedAt),
  ],
);

export const layoffSignalsTable = pgTable(
  "layoff_signals",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    company: text("company").notNull(),
    signal: text("signal").notNull(),
    type: text("type", {
      enum: ["Layoff", "Hiring freeze", "Hiring signal", "Restructure"],
    }).notNull(),
    confidence: text("confidence", {
      enum: ["High", "Medium", "Low", "Mixed"],
    }).notNull(),
    source: text("source").notNull(),
    sourceUrl: text("source_url"),
    provenance: jsonb("provenance").$type<PublicDataProvenance>(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    refreshedAt,
  },
  (table) => [
    uniqueIndex("layoff_signals_company_observed_signal_key").on(
      table.company,
      table.observedAt,
      table.signal,
    ),
    index("layoff_signals_type_observed_at_idx").on(
      table.type,
      table.observedAt,
    ),
    index("layoff_signals_refreshed_at_idx").on(table.refreshedAt),
  ],
);

export const layoffSignalSubmissionsTable = pgTable(
  "layoff_signal_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    company: text("company").notNull(),
    description: text("description").notNull(),
    confidence: text("confidence", {
      enum: ["Low", "Medium", "High"],
    }).notNull(),
    moderationStatus: text("moderation_status", {
      enum: ["pending", "approved", "rejected"],
    }).notNull().default("pending"),
    submittedByUserId: text("submitted_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("layoff_signal_submissions_status_created_at_idx").on(
      table.moderationStatus,
      table.createdAt,
    ),
    index("layoff_signal_submissions_user_created_at_idx").on(
      table.submittedByUserId,
      table.createdAt,
    ),
  ],
);

export const careerCatalogSuggestionsTable = pgTable(
  "career_catalog_suggestions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityType: text("entity_type", {
      enum: ["company", "position"],
    }).notNull(),
    name: text("name").notNull(),
    normalizedName: text("normalized_name").notNull(),
    sector: text("sector").notNull(),
    jobFunction: text("job_function").notNull(),
    moderationStatus: text("moderation_status", {
      enum: ["pending", "approved", "rejected"],
    }).notNull().default("pending"),
    submittedByUserId: text("submitted_by_user_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedByUserId: text("reviewed_by_user_id"),
    reviewNote: text("review_note"),
  },
  (table) => [
    index("career_catalog_suggestions_status_created_at_idx").on(
      table.moderationStatus,
      table.createdAt,
    ),
    index("career_catalog_suggestions_entity_normalized_idx").on(
      table.entityType,
      table.normalizedName,
    ),
    index("career_catalog_suggestions_user_created_at_idx").on(
      table.submittedByUserId,
      table.createdAt,
    ),
    uniqueIndex("career_catalog_suggestions_approved_entity_normalized_key")
      .on(table.entityType, table.normalizedName)
      .where(sql`${table.moderationStatus} = 'approved'`),
  ],
);

export type SalaryBenchmark = typeof salaryBenchmarksTable.$inferSelect;
export type CompanySignal = typeof companySignalsTable.$inferSelect;
export type LayoffSignal = typeof layoffSignalsTable.$inferSelect;
export type LayoffSignalSubmission = typeof layoffSignalSubmissionsTable.$inferSelect;
export type CareerCatalogSuggestion = typeof careerCatalogSuggestionsTable.$inferSelect;