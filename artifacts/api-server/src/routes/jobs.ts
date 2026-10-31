import { getAuth } from "@clerk/express";
import {
  ListCareerJobRecommendationsResponse,
  ListCareerJobRecommendationsQueryParams,
  MarkCareerJobAppliedResponse,
} from "@workspace/api-zod";
import {
  db,
  jobApplicationsTable,
  jobFeedRunsTable,
  jobListingsTable,
  careerProfilesTable,
  type JobListing,
  type CareerProfile,
} from "@workspace/db";
import { desc, eq, gt } from "drizzle-orm";
import { Router, type IRouter, type RequestHandler } from "express";
import {
  checkTheirStackReadiness,
  failedFeedRun,
  fetchJobFeed,
  getConfiguredJobFeeds,
  jobFeedStatus,
  JOB_RETENTION_MS,
  dedupeJobListings,
  THEIRSTACK_SOURCE,
} from "../lib/job-feeds";

const router: IRouter = Router();
const REFRESH_WINDOW_MS = 6 * 60 * 60 * 1000;
let refreshPromise: Promise<void> | null = null;

function currentUserId(req: Parameters<RequestHandler>[0]): string {
  const { userId } = getAuth(req);
  if (!userId) throw new Error("Authenticated user was not available");
  return userId;
}

const requireUser: RequestHandler = (req, res, next) => {
  if (!getAuth(req).userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
};

function tokenize(value: string): string[] {
  return [...new Set(
    value.toLowerCase().split(/[^a-z0-9+#.]+/).filter((item) => item.length > 2),
  )];
}

function searchLinks(role: string, city: string) {
  const keywords = encodeURIComponent(role || "technology");
  const location = encodeURIComponent(city || "India");
  return [
    {
      name: "LinkedIn Jobs",
      url: `https://www.linkedin.com/jobs/search/?keywords=${keywords}&location=${location}`,
    },
    {
      name: "Naukri",
      url: `https://www.naukri.com/${encodeURIComponent(role || "technology").replace(/%20/g, "-")}-jobs-in-${encodeURIComponent(city || "india").replace(/%20/g, "-")}`,
    },
    {
      name: "Wellfound",
      url: `https://wellfound.com/jobs?query=${keywords}`,
    },
    {
      name: "Monster",
      url: `https://www.monster.com/jobs/search/?q=${keywords}&where=${location}`,
    },
  ];
}

async function refreshFeeds(query: { role: string; target: string; city: string }): Promise<void> {
  const sources = getConfiguredJobFeeds();
  if (sources.length === 0) return;
  const now = new Date();
  const runs = await db.select().from(jobFeedRunsTable);
  const runBySource = new Map(runs.map((run) => [run.source, run]));
  const dueSources = sources.filter((source) => {
    const lastCheckedAt = runBySource.get(source.id)?.lastCheckedAt;
    return !lastCheckedAt || now.getTime() - lastCheckedAt.getTime() >= REFRESH_WINDOW_MS;
  });
  if (dueSources.length === 0) return;

  await Promise.all(dueSources.map(async (source) => {
    try {
      const jobs = await fetchJobFeed(source, query);
      for (const job of jobs) {
        await db
          .insert(jobListingsTable)
          .values({ ...job, lastSeenAt: now, fetchedAt: now })
          .onConflictDoUpdate({
            target: [jobListingsTable.source, jobListingsTable.externalId],
            set: {
              sourceName: job.sourceName,
              title: job.title,
              company: job.company,
              location: job.location,
              remoteType: job.remoteType,
              canonicalUrl: job.canonicalUrl,
              applyUrl: job.applyUrl,
              description: job.description,
              employmentType: job.employmentType,
              publishedAt: job.publishedAt,
              lastSeenAt: now,
              fetchedAt: now,
            },
          });
      }
      await db
        .insert(jobFeedRunsTable)
        .values({
          source: source.id,
          lastCheckedAt: now,
          lastSucceededAt: now,
          lastError: null,
          jobCount: jobs.length,
        })
        .onConflictDoUpdate({
          target: jobFeedRunsTable.source,
          set: {
            lastCheckedAt: now,
            lastSucceededAt: now,
            lastError: null,
            jobCount: jobs.length,
          },
        });
    } catch (error) {
      const failedRun = failedFeedRun(source.id, now, runBySource.get(source.id), error);
      await db
        .insert(jobFeedRunsTable)
        .values(failedRun)
        .onConflictDoUpdate({
          target: jobFeedRunsTable.source,
          set: {
            lastCheckedAt: now,
            lastError: failedRun.lastError,
          },
        });
    }
  }));
}

async function refreshIfDue(query: { role: string; target: string; city: string }): Promise<void> {
  if (refreshPromise) return refreshPromise;
  refreshPromise = refreshFeeds(query).finally(() => {
    refreshPromise = null;
  });
  return refreshPromise;
}

async function recordTheirStackReadiness(readiness: Awaited<ReturnType<typeof checkTheirStackReadiness>>): Promise<void> {
  const [previous] = await db
    .select()
    .from(jobFeedRunsTable)
    .where(eq(jobFeedRunsTable.source, THEIRSTACK_SOURCE.id))
    .limit(1);
  const succeeded = readiness.status === "healthy" || readiness.status === "empty";
  await db
    .insert(jobFeedRunsTable)
    .values({
      source: THEIRSTACK_SOURCE.id,
      lastCheckedAt: readiness.checkedAt,
      lastSucceededAt: succeeded ? readiness.checkedAt : previous?.lastSucceededAt ?? null,
      lastError: succeeded ? null : readiness.message,
      jobCount: readiness.sampleSize,
    })
    .onConflictDoUpdate({
      target: jobFeedRunsTable.source,
      set: {
        lastCheckedAt: readiness.checkedAt,
        lastSucceededAt: succeeded ? readiness.checkedAt : previous?.lastSucceededAt ?? null,
        lastError: succeeded ? null : readiness.message,
        jobCount: readiness.sampleSize,
      },
    });
}

const LEVEL_RANK: Record<string, number> = {
  intern: 0,
  junior: 1,
  associate: 2,
  mid: 3,
  senior: 4,
  lead: 5,
  manager: 5,
  staff: 6,
  principal: 7,
  director: 8,
  head: 9,
};

const LEVEL_LABELS = Object.keys(LEVEL_RANK);

function normalized(value: string): string {
  return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function inferLevel(value: string): string | null {
  const text = normalized(value);
  return LEVEL_LABELS
    .filter((level) => new RegExp(`\\b${level}\\b`, "i").test(text))
    .sort((left, right) => LEVEL_RANK[right] - LEVEL_RANK[left])[0] ?? null;
}

function extractYears(value: string): { min: number; max: number } | null {
  const text = normalized(value);
  const range = text.match(/(\d+(?:\.\d+)?)\s*(?:-|to)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)/i);
  if (range) return { min: Number(range[1]), max: Number(range[2]) };
  const plus = text.match(/(\d+(?:\.\d+)?)\s*\+?\s*(?:years?|yrs?)/i);
  if (plus) {
    const years = Number(plus[1]);
    return text.includes("+") ? { min: years, max: Number.POSITIVE_INFINITY } : { min: years, max: years };
  }
  return null;
}

function extractLakhs(value: string): number | null {
  const text = normalized(value).replace(/,/g, "");
  const amounts = [...text.matchAll(/(?:₹|rs\.?|inr)?\s*(\d+(?:\.\d+)?)\s*(?:l|lac|lakh|lakhs)\b/gi)]
    .map((match) => Number(match[1]))
    .filter(Number.isFinite);
  return amounts.length > 0 ? Math.max(...amounts) : null;
}

function cityTerms(city: string): string[] {
  const value = normalized(city);
  if (value.includes("bengaluru") || value.includes("bangalore")) return ["bengaluru", "bangalore"];
  return value ? [value] : [];
}

function profileLevel(profile: Pick<CareerProfile, "role" | "target" | "experience">): string | null {
  return inferLevel(`${profile.target} ${profile.role}`) ?? (
    (extractYears(profile.experience)?.min ?? 0) >= 7
      ? "senior"
      : (extractYears(profile.experience)?.min ?? 0) >= 3 ? "mid" : null
  );
}

export function matchJobToProfile(
  job: JobListing,
  profile: Pick<CareerProfile, "role" | "target" | "city" | "experience" | "ctc">,
) {
  const jobTitle = normalized(job.title);
  const jobText = normalized(`${job.title} ${job.description}`);
  const roleTokens = tokenize(profile.role).filter((token) => !LEVEL_LABELS.includes(token));
  const targetTokens = tokenize(profile.target).filter((token) => !LEVEL_LABELS.includes(token));
  const matchedRoleTokens = roleTokens.filter((token) => jobText.includes(token));
  const matchedTargetTokens = targetTokens.filter((token) => jobText.includes(token));
  const titleRoleTokens = roleTokens.filter((token) => jobTitle.includes(token));
  const titleTargetTokens = targetTokens.filter((token) => jobTitle.includes(token));
  const profileCityTerms = cityTerms(profile.city);
  const cityMatch = profileCityTerms.length === 0
    || profileCityTerms.some((term) => normalized(job.location).includes(term));
  const remoteMatch = job.remoteType === "remote" || job.remoteType === "hybrid";
  const locationMatch = cityMatch || remoteMatch;
  const expectedLevel = profileLevel(profile);
  const jobLevel = inferLevel(`${job.title} ${job.description}`);
  const profileYears = extractYears(profile.experience)?.min ?? null;
  const jobYears = extractYears(jobText);
  const levelMismatch = Boolean(
    expectedLevel
      && jobLevel
      && LEVEL_RANK[jobLevel] < Math.max(0, LEVEL_RANK[expectedLevel] - 2),
  );
  const experienceMismatch = Boolean(
    profileYears !== null
      && jobYears
      && (profileYears < jobYears.min - 2 || profileYears > jobYears.max + 4),
  );
  const currentCompensation = extractLakhs(profile.ctc);
  const listedCompensation = extractLakhs(jobText);
  const compensationMismatch = Boolean(
    currentCompensation !== null
      && listedCompensation !== null
      && listedCompensation < currentCompensation * 0.85,
  );

  const evidence: string[] = [];
  const unknowns: string[] = [];
  if (matchedRoleTokens.length > 0) {
    evidence.push(`Role signal: ${matchedRoleTokens.slice(0, 3).join(", ")} appears in this opening.`);
  }
  if (matchedTargetTokens.length > 0) {
    evidence.push(`Direction signal: ${matchedTargetTokens.slice(0, 3).join(", ")} connects to your target of ${profile.target}.`);
  } else {
    unknowns.push(`The listing does not explicitly mention your target direction (${profile.target}).`);
  }
  if (cityMatch) {
    evidence.push(`Location: ${profile.city} is listed for this role.`);
  } else if (remoteMatch) {
    evidence.push(`Location: ${job.remoteType} work keeps this role viable from ${profile.city}.`);
  } else {
    unknowns.push(`Location does not match ${profile.city}.`);
  }
  if (expectedLevel && jobLevel) {
    if (levelMismatch) unknowns.push(`Level appears below your ${expectedLevel} profile.`);
    else evidence.push(`Level: ${jobLevel} is consistent with your ${expectedLevel} trajectory.`);
  } else {
    unknowns.push("The listing does not make its level explicit.");
  }
  if (profileYears !== null && jobYears) {
    if (experienceMismatch) unknowns.push(`Experience range (${jobYears.min}–${Number.isFinite(jobYears.max) ? jobYears.max : `${jobYears.min}+`} years) may not fit your ${profile.experience}.`);
    else evidence.push(`Experience: the stated range is compatible with your ${profile.experience}.`);
  } else {
    unknowns.push("Required experience is not clearly stated.");
  }
  if (listedCompensation !== null) {
    if (compensationMismatch) unknowns.push(`Listed compensation may be below your current ${profile.ctc} baseline.`);
    else evidence.push(`Compensation: the listing signals up to ₹${listedCompensation}L.`);
  } else {
    unknowns.push("Compensation is not listed; verify the range before investing time.");
  }

  const roleMatch = titleRoleTokens.length >= Math.min(2, roleTokens.length)
    || titleTargetTokens.length >= Math.min(2, targetTokens.length);
  const score = Math.max(
    0,
    Math.min(
      100,
      (roleMatch ? 28 + Math.min(18, matchedRoleTokens.length * 8) : 0)
        + Math.min(16, matchedTargetTokens.length * 6)
        + (locationMatch ? 16 : 0)
        + (expectedLevel && jobLevel ? (levelMismatch ? 0 : 14) : 7)
        + (profileYears !== null && jobYears ? (experienceMismatch ? 0 : 12) : 6)
        + (listedCompensation !== null ? (compensationMismatch ? 0 : 8) : 4),
    ),
  );
  const eligible = roleMatch
    && locationMatch
    && !levelMismatch
    && !experienceMismatch
    && !compensationMismatch
    && score >= 52;
  const applicationGuidance = "Open the canonical employer application, confirm the compensation and level gaps above, then apply only if the role still fits your constraints.";

  return {
    eligible,
    score,
    evidence,
    unknowns,
    reason: `${evidence.slice(0, 2).join(" ")}${unknowns.length > 0 ? ` Unknowns: ${unknowns.slice(0, 2).join(" ")}` : ""}`.trim(),
    applicationGuidance,
    level: expectedLevel,
  };
}

type JobProviderClass = "direct_ats" | "broad_provider";

function providerClass(source: string, sourceProviders: Map<string, string>): JobProviderClass {
  return sourceProviders.get(source) === "theirstack" ? "broad_provider" : "direct_ats";
}

function deduplicationSummary(
  listings: JobListing[],
  groups: ReturnType<typeof dedupeJobListings>,
  sourceProviders: Map<string, string>,
) {
  const providerClasses: JobProviderClass[] = ["direct_ats", "broad_provider"];
  const summaries = providerClasses.map((currentClass) => {
    const classListingIds = new Set(
      listings
        .filter((listing) => providerClass(listing.source, sourceProviders) === currentClass)
        .map((listing) => listing.id),
    );
    const classGroups = groups.filter((group) => group.ids.some((id) => classListingIds.has(id)));
    return {
      providerClass: currentClass,
      rawListings: classListingIds.size,
      mergedRoles: classGroups.length,
      duplicateGroups: classGroups.filter((group) => group.ids.length > 1).length,
    };
  });

  return {
    rawListings: listings.length,
    mergedRoles: groups.length,
    duplicateGroups: groups.filter((group) => group.ids.length > 1).length,
    byProviderClass: summaries,
  };
}

router.get("/career/jobs/readiness", async (_req, res, next) => {
  try {
    const readiness = await checkTheirStackReadiness();
    await recordTheirStackReadiness(readiness);
    res.setHeader("cache-control", "no-store");
    res.status(readiness.status === "healthy" ? 200 : 503).json({
      ...readiness,
      broadCoverageReady: readiness.status === "healthy",
    });
  } catch (error) {
    next(error);
  }
});

router.use(requireUser);

router.get("/career/jobs", async (req, res, next) => {
  try {
    const userId = currentUserId(req);
    const parsed = ListCareerJobRecommendationsQueryParams.safeParse(req.query);
    const limit = parsed.success ? parsed.data.limit ?? 6 : 6;
    const [profile] = await db
      .select()
      .from(careerProfilesTable)
      .where(eq(careerProfilesTable.userId, userId))
      .limit(1);
    if (!profile) {
      res.status(404).json({ error: "Career profile not found" });
      return;
    }

    await refreshIfDue({
      role: profile.role,
      target: profile.target,
      city: profile.city,
    });
    const sources = getConfiguredJobFeeds();
    const sourceProviders = new Map(sources.map((source) => [source.id, source.provider]));
    const runs = await db.select().from(jobFeedRunsTable);
    const runBySource = new Map(runs.map((run) => [run.source, run]));
    const cutoff = new Date(Date.now() - JOB_RETENTION_MS);
    const listings = await db
      .select()
      .from(jobListingsTable)
      .where(gt(jobListingsTable.lastSeenAt, cutoff))
      .orderBy(desc(jobListingsTable.lastSeenAt), desc(jobListingsTable.publishedAt))
      .limit(250);
    const applications = await db
      .select({ jobId: jobApplicationsTable.jobId })
      .from(jobApplicationsTable)
      .where(eq(jobApplicationsTable.userId, userId));
    const hidden = new Set(applications.map((application) => application.jobId));
    const deduped = dedupeJobListings(listings, sourceProviders);
    const deduplication = deduplicationSummary(listings, deduped, sourceProviders);
    const ranked = deduped
      .filter((group) => !group.ids.some((id) => hidden.has(id)))
      .map((group) => {
        const job = group.listing;
        const match = matchJobToProfile(job, profile);
        const provenanceNames = group.provenance.map((item) => item.sourceName);
        const sourceName = provenanceNames.length > 1
          ? `${provenanceNames[0]} · Also found via ${provenanceNames.slice(1).join(", ")}`
          : provenanceNames[0];
        return {
          match,
          id: job.id,
          title: job.title,
          company: job.company,
          location: job.location,
          remoteType: job.remoteType,
          source: job.source,
          sourceName,
          provenance: group.provenance,
          canonicalUrl: job.canonicalUrl,
          applyUrl: job.applyUrl,
          publishedAt: job.publishedAt,
          lastVerifiedAt: job.fetchedAt,
          matchScore: match.score,
          matchReason: match.reason,
          matchEvidence: match.evidence,
          unknowns: match.unknowns,
          applicationGuidance: match.applicationGuidance,
        };
      })
      .filter((job) => job.match.eligible)
      .sort((left, right) => right.matchScore - left.matchScore)
      .slice(0, limit)
      .map(({ match: _match, ...job }) => job);
    const lastRefreshedAt = runs
      .map((run) => run.lastSucceededAt)
      .filter((value): value is Date => Boolean(value))
      .sort((left, right) => right.getTime() - left.getTime())[0] ?? null;
    const nextRefreshAt = runs.length > 0
      ? new Date(Math.min(...runs.map((run) => run.lastCheckedAt.getTime() + REFRESH_WINDOW_MS)))
      : null;
    const sourceCounts = new Map<string, number>();
    for (const listing of listings) sourceCounts.set(listing.source, (sourceCounts.get(listing.source) ?? 0) + 1);

    const feedStatuses = sources.length > 0
      ? sources.map((source) => jobFeedStatus(source, runBySource.get(source.id), sourceCounts.get(source.id) ?? 0))
      : [{
          id: "official-ats",
          name: "Official company feeds",
          provider: "operator configuration",
          status: "not_configured" as const,
          lastCheckedAt: null,
          message: "No official ATS feeds are configured for this environment yet.",
        }];

    res.json(ListCareerJobRecommendationsResponse.parse({
      jobs: ranked,
      profileContext: {
        role: profile.role,
        level: profileLevel(profile),
        city: profile.city,
        experience: profile.experience,
        compensation: profile.ctc,
        targetDirection: profile.target,
      },
      feeds: feedStatuses,
      searchLinks: searchLinks(profile.target || profile.role, profile.city),
      lastRefreshedAt,
      nextRefreshAt,
      deduplication,
    }));
  } catch (error) {
    next(error);
  }
});

async function markJob(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1], status: "applied" | "dismissed") {
  const userId = currentUserId(req);
  const [job] = await db
    .select()
    .from(jobListingsTable)
    .where(eq(jobListingsTable.id, String(req.params.id)))
    .limit(1);
  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  const actedAt = new Date();
  await db
    .insert(jobApplicationsTable)
    .values({ userId, jobId: job.id, status, actedAt })
    .onConflictDoUpdate({
      target: [jobApplicationsTable.userId, jobApplicationsTable.jobId],
      set: { status, actedAt },
    });
  res.json(MarkCareerJobAppliedResponse.parse({
    jobId: job.id,
    status,
    actedAt,
    applyUrl: status === "applied" ? job.applyUrl : null,
  }));
}

router.post("/career/jobs/:id/apply", async (req, res, next) => {
  try {
    await markJob(req, res, "applied");
  } catch (error) {
    next(error);
  }
});

router.post("/career/jobs/:id/dismiss", async (req, res, next) => {
  try {
    await markJob(req, res, "dismissed");
  } catch (error) {
    next(error);
  }
});

export default router;