import {
  index,
  integer,
  jsonb,
  pgTable,
  date,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

const now = timestamp("created_at", { withTimezone: true })
  .notNull()
  .defaultNow();

export const careerProfilesTable = pgTable(
  "career_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    name: text("name").notNull(),
    situation: text("situation").notNull(),
    role: text("role").notNull(),
    company: text("company").notNull(),
    city: text("city").notNull(),
    experience: text("experience").notNull(),
    ctc: text("ctc").notNull(),
    target: text("target").notNull(),
    resumeName: text("resume_name"),
    resumeStatus: text("resume_status", {
      enum: ["not_added", "processing", "ready", "failed"],
    })
      .notNull()
      .default("not_added"),
    resumeData: jsonb("resume_data"),
    resumeError: text("resume_error"),
    resumeUpdatedAt: timestamp("resume_updated_at", { withTimezone: true }),
    createdAt: now,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("career_profiles_user_id_key").on(table.userId),
    index("career_profiles_updated_at_idx").on(table.updatedAt),
  ],
);

export const careerActionsTable = pgTable(
  "career_actions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    kind: text("kind", {
      enum: ["brief", "decision", "skill", "application", "profile"],
    }).notNull(),
    title: text("title").notNull(),
    body: text("body").notNull(),
    source: text("source").notNull(),
    status: text("status", {
      enum: ["open", "completed", "skipped"],
    })
      .notNull()
      .default("open"),
    dueDate: date("due_date", { mode: "string" }),
    marketChangeId: text("market_change_id"),
    createdAt: now,
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
  (table) => [
    index("career_actions_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
    uniqueIndex("career_actions_user_market_change_key").on(
      table.userId,
      table.marketChangeId,
    ),
  ],
);

export const careerBriefSnapshotsTable = pgTable(
  "career_brief_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    snapshot: jsonb("snapshot").notNull(),
    createdAt: now,
  },
  (table) => [
    index("career_brief_snapshots_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const jobListingsTable = pgTable(
  "job_listings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    sourceName: text("source_name").notNull(),
    externalId: text("external_id").notNull(),
    title: text("title").notNull(),
    company: text("company").notNull(),
    location: text("location").notNull(),
    remoteType: text("remote_type", {
      enum: ["onsite", "hybrid", "remote", "unknown"],
    }).notNull().default("unknown"),
    canonicalUrl: text("canonical_url").notNull(),
    applyUrl: text("apply_url").notNull(),
    description: text("description").notNull().default(""),
    employmentType: text("employment_type"),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    fetchedAt: timestamp("fetched_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("job_listings_source_external_id_key").on(
      table.source,
      table.externalId,
    ),
    index("job_listings_fetched_at_idx").on(table.fetchedAt),
    index("job_listings_published_at_idx").on(table.publishedAt),
  ],
);

export const jobApplicationsTable = pgTable(
  "job_applications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    jobId: uuid("job_id")
      .notNull()
      .references(() => jobListingsTable.id, { onDelete: "cascade" }),
    status: text("status", {
      enum: ["applied", "dismissed"],
    }).notNull(),
    actedAt: timestamp("acted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("job_applications_user_job_key").on(
      table.userId,
      table.jobId,
    ),
    index("job_applications_user_status_idx").on(
      table.userId,
      table.status,
    ),
  ],
);

export const jobFeedRunsTable = pgTable(
  "job_feed_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    source: text("source").notNull(),
    lastCheckedAt: timestamp("last_checked_at", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    lastSucceededAt: timestamp("last_succeeded_at", {
      withTimezone: true,
    }),
    lastError: text("last_error"),
    jobCount: integer("job_count").notNull().default(0),
  },
  (table) => [
    uniqueIndex("job_feed_runs_source_key").on(table.source),
    index("job_feed_runs_checked_at_idx").on(table.lastCheckedAt),
  ],
);

export const promotionReadinessTable = pgTable(
  "promotion_readiness",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    scopeScore: integer("scope_score").notNull(),
    impactScore: integer("impact_score").notNull(),
    skillsScore: integer("skills_score").notNull(),
    sponsorshipScore: integer("sponsorship_score").notNull(),
    pathStatus: text("path_status", {
      enum: ["clear", "unclear", "blocked"],
    }).notNull().default("unclear"),
    pathNotes: text("path_notes")
      .notNull()
      .default("Promotion path context has not been recorded yet."),
    proofPoint: text("proof_point").notNull(),
    targetDate: date("target_date", { mode: "string" }),
    managerCheckInDate: date("manager_check_in_date", { mode: "string" }),
    createdAt: now,
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("promotion_readiness_user_id_key").on(table.userId),
    index("promotion_readiness_updated_at_idx").on(table.updatedAt),
  ],
);

export const promotionReadinessSnapshotsTable = pgTable(
  "promotion_readiness_snapshots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    scopeScore: integer("scope_score").notNull(),
    impactScore: integer("impact_score").notNull(),
    skillsScore: integer("skills_score").notNull(),
    sponsorshipScore: integer("sponsorship_score").notNull(),
    pathStatus: text("path_status", {
      enum: ["clear", "unclear", "blocked"],
    }).notNull(),
    pathNotes: text("path_notes").notNull(),
    proofPoint: text("proof_point").notNull(),
    targetDate: date("target_date", { mode: "string" }),
    managerCheckInDate: date("manager_check_in_date", { mode: "string" }),
    capturedAt: now,
  },
  (table) => [
    index("promotion_readiness_snapshots_user_captured_at_idx").on(
      table.userId,
      table.capturedAt,
    ),
  ],
);

export const promotionEvidenceTable = pgTable(
  "promotion_evidence",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id").notNull(),
    title: text("title").notNull(),
    detail: text("detail").notNull(),
    actionId: uuid("action_id"),
    createdAt: now,
  },
  (table) => [
    index("promotion_evidence_user_created_at_idx").on(
      table.userId,
      table.createdAt,
    ),
  ],
);

export const insertCareerProfileSchema = createInsertSchema(
  careerProfilesTable,
).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});
export type InsertCareerProfile = z.infer<typeof insertCareerProfileSchema>;
export type CareerProfile = typeof careerProfilesTable.$inferSelect;
export type CareerAction = typeof careerActionsTable.$inferSelect;
export type JobListing = typeof jobListingsTable.$inferSelect;
export type JobApplication = typeof jobApplicationsTable.$inferSelect;
export type JobFeedRun = typeof jobFeedRunsTable.$inferSelect;
export type PromotionReadiness = typeof promotionReadinessTable.$inferSelect;
export type PromotionReadinessSnapshot = typeof promotionReadinessSnapshotsTable.$inferSelect;
export type PromotionEvidence = typeof promotionEvidenceTable.$inferSelect;