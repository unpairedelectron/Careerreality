import type { JobFeedRun, JobListing } from "@workspace/db";

export type JobFeedProvider = "greenhouse" | "lever" | "ashby" | "theirstack";

export type JobFeedSource = {
  id: string;
  provider: JobFeedProvider;
  board: string;
  label: string;
  company?: string;
};

export type JobFeedQuery = {
  role: string;
  target: string;
  city: string;
};

export type JobFeedHealthStatus = "healthy" | "empty" | "unauthorized" | "unavailable" | "not_configured";
export type NormalizedJob = Omit<
  JobListing,
  "id" | "lastSeenAt" | "fetchedAt"
>;

export type JobRecommendationProvenance = {
  source: string;
  sourceName: string;
  canonicalUrl: string;
};

export type DedupeListing = {
  listing: JobListing;
  ids: string[];
  provenance: JobRecommendationProvenance[];
};

const REQUEST_TIMEOUT_MS = 8_000;
export const JOB_RETENTION_MS = 45 * 24 * 60 * 60 * 1000;

export const THEIRSTACK_SOURCE: JobFeedSource = {
  id: "theirstack",
  provider: "theirstack",
  board: "india-and-remote",
  label: "TheirStack jobs",
};
function parseSources(): JobFeedSource[] {
  const raw = process.env.CAREER_JOB_FEED_SOURCES;
  const sources: JobFeedSource[] = [];
  try {
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const [index, value] of parsed.entries()) {
          if (!value || typeof value !== "object") continue;
          const item = value as Record<string, unknown>;
          if (item.provider !== "greenhouse" && item.provider !== "lever" && item.provider !== "ashby") continue;
          const board = typeof item.board === "string" ? item.board.trim() : "";
          const label = typeof item.label === "string" ? item.label.trim() : "";
          if (!board || !label) continue;
          sources.push({
            id: typeof item.id === "string" ? item.id : `feed-${index + 1}`,
            provider: item.provider,
            board,
            label,
            company: typeof item.company === "string" ? item.company.trim() : undefined,
          });
        }
      }
    }
  } catch {
    // A malformed optional source list must not disable the provider configured
    // through the secure secret flow or crash the API.
  }
  if (process.env.THEIRSTACK_API_KEY?.trim()) {
    sources.push(THEIRSTACK_SOURCE);
  }
  return sources.slice(0, 50);
}

export function getConfiguredJobFeeds(): JobFeedSource[] {
  return parseSources();
}

export function safeJobUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" ? url.toString() : null;
  } catch {
    return null;
  }
}

export function isWithinJobRetentionWindow(lastSeenAt: Date, now = new Date()): boolean {
  return lastSeenAt.getTime() > now.getTime() - JOB_RETENTION_MS;
}

export function failedFeedRun(
  source: string,
  now: Date,
  previous: JobFeedRun | undefined,
  error: unknown,
) {
  return {
    source,
    lastCheckedAt: now,
    lastSucceededAt: previous?.lastSucceededAt ?? null,
    lastError: error instanceof Error ? error.message.slice(0, 500) : "Feed unavailable",
    jobCount: previous?.jobCount ?? 0,
  };
}

export function isProviderAuthorizationError(error: unknown): boolean {
  if (error instanceof JobFeedProviderError) {
    return error.statusCode === 401 || error.statusCode === 403;
  }
  return error instanceof Error
    && /theirstack.*(?:returned|authorization failed).*?\b(?:401|403)\b/i.test(error.message);
}
export function jobFeedStatus(source: JobFeedSource, run: JobFeedRun | undefined, count: number) {
  const status: JobFeedHealthStatus = !run
    ? "not_configured"
    : run.lastError
      ? isProviderAuthorizationError(new Error(run.lastError)) ? "unauthorized" : "unavailable"
      : count === 0
        ? "empty"
        : "healthy";
  return {
    id: source.id,
    name: source.label,
    provider: source.provider,
    status,
    lastCheckedAt: run?.lastCheckedAt ?? null,
    message: !run
      ? "This official source is configured but has not been checked yet."
      : run.lastError
        ? status === "unauthorized"
          ? `Provider authorization failed: ${run.lastError}`
          : `Last check failed: ${run.lastError}`
        : count === 0
          ? "No active roles were returned recently. Listings older than 45 days or with invalid application links are excluded."
          : `${count} active roles currently tracked.`,
  };
}

function canonicalKey(value: string): string {
  try {
    const url = new URL(value);
    url.hash = "";
    const pathSegments = url.pathname.split("/").filter(Boolean);
    while (["apply", "apply-now", "application"].includes(pathSegments.at(-1)?.toLowerCase() ?? "")) {
      pathSegments.pop();
    }
    url.pathname = `/${pathSegments.join("/")}`;
    for (const key of [...url.searchParams.keys()]) {
      if (key.toLowerCase().startsWith("utm_") || ["ref", "source", "gh_src"].includes(key.toLowerCase())) {
        url.searchParams.delete(key);
      }
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return value;
  }
}

function sourcePriority(job: JobListing, sourceProviders: Map<string, string>): number {
  return sourceProviders.get(job.source) === "theirstack" ? 1 : 0;
}

export function dedupeJobListings(
  listings: JobListing[],
  sourceProviders: Map<string, string>,
): DedupeListing[] {
  const groups = new Map<string, DedupeListing>();
  for (const listing of listings) {
    const key = canonicalKey(listing.canonicalUrl);
    const provenance = {
      source: listing.source,
      sourceName: listing.sourceName,
      canonicalUrl: listing.canonicalUrl,
    };
    const existing = groups.get(key);
    if (!existing) {
      groups.set(key, { listing, ids: [listing.id], provenance: [provenance] });
      continue;
    }
    if (!existing.ids.includes(listing.id)) existing.ids.push(listing.id);
    if (!existing.provenance.some((item) => item.source === provenance.source && item.canonicalUrl === provenance.canonicalUrl)) {
      existing.provenance.push(provenance);
    }
    const preferred = sourcePriority(listing, sourceProviders) < sourcePriority(existing.listing, sourceProviders)
      || (sourcePriority(listing, sourceProviders) === sourcePriority(existing.listing, sourceProviders)
        && listing.fetchedAt.getTime() > existing.listing.fetchedAt.getTime());
    if (preferred) existing.listing = listing;
  }
  return [...groups.values()];
}

function text(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value.replace(/\s+/g, " ").trim() : fallback;
}

function identifier(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function date(value: unknown): Date | null {
  if (typeof value !== "string" && typeof value !== "number") return null;
  const result = new Date(value);
  return Number.isNaN(result.getTime()) ? null : result;
}

function remoteType(location: string, workplaceType?: string): NormalizedJob["remoteType"] {
  const value = `${location} ${workplaceType ?? ""}`.toLowerCase();
  if (value.includes("remote") || value.includes("work from home") || value.includes("anywhere")) return "remote";
  if (value.includes("hybrid")) return "hybrid";
  if (value.length > 0) return "onsite";
  return "unknown";
}

async function readJson(url: string): Promise<unknown> {
  const response = await fetch(url, {
    headers: { accept: "application/json", "user-agent": "CareerRealityJobs/1.0" },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) throw new Error(`Feed returned ${response.status}`);
  return response.json();
}

async function postJson(url: string, apiKey: string, body: unknown): Promise<unknown> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      accept: "application/json",
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      "user-agent": "CareerRealityJobs/1.0",
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new JobFeedProviderError(
        `TheirStack authorization failed (HTTP ${response.status})`,
        "theirstack",
        response.status,
      );
    }
    throw new JobFeedProviderError(`TheirStack returned ${response.status}`, "theirstack", response.status);
  }
  return response.json();
}

function greenhouseJobs(source: JobFeedSource, body: unknown): NormalizedJob[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { jobs?: unknown }).jobs)) return [];
  return (body as { jobs: unknown[] }).jobs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const job = item as Record<string, unknown>;
    const canonicalUrl = safeJobUrl(job.absolute_url);
    if (!canonicalUrl) return [];
    const location = text((job.location as { name?: unknown } | undefined)?.name, "Location not listed");
    return [{
      source: source.id,
      sourceName: source.label,
      externalId: identifier(job.id),
      title: text(job.title, "Untitled role"),
      company: source.company || source.label,
      location,
      remoteType: remoteType(location),
      canonicalUrl,
      applyUrl: canonicalUrl,
      description: text(job.content).slice(0, 3_000),
      employmentType: null,
      publishedAt: date(job.updated_at),
    }];
  }).filter((job) => job.externalId);
}

function leverJobs(source: JobFeedSource, body: unknown): NormalizedJob[] {
  if (!Array.isArray(body)) return [];
  return body.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const job = item as Record<string, unknown>;
    const categories = (job.categories && typeof job.categories === "object")
      ? job.categories as Record<string, unknown>
      : {};
    const canonicalUrl = safeJobUrl(job.hostedUrl) ?? safeJobUrl(job.applyUrl);
    const applyUrl = safeJobUrl(job.applyUrl);
    if (!canonicalUrl || !applyUrl) return [];
    const location = text(categories.location, "Location not listed");
    return [{
      source: source.id,
      sourceName: source.label,
      externalId: identifier(job.id),
      title: text(job.text, "Untitled role"),
      company: source.company || source.label,
      location,
      remoteType: remoteType(location),
      canonicalUrl,
      applyUrl,
      description: text(job.descriptionPlain).slice(0, 3_000),
      employmentType: text(categories.commitment) || null,
      publishedAt: date(job.createdAt),
    }];
  }).filter((job) => job.externalId);
}

function ashbyJobs(source: JobFeedSource, body: unknown): NormalizedJob[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { jobs?: unknown }).jobs)) return [];
  return (body as { jobs: unknown[] }).jobs.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const job = item as Record<string, unknown>;
    const canonicalUrl = safeJobUrl(job.jobUrl) ?? safeJobUrl(job.applyUrl);
    const applyUrl = safeJobUrl(job.applyUrl);
    if (!canonicalUrl || !applyUrl) return [];
    const location = text(job.location, "Location not listed");
    return [{
      source: source.id,
      sourceName: source.label,
      externalId: identifier(job.jobUrl || job.id),
      title: text(job.title, "Untitled role"),
      company: source.company || source.label,
      location,
      remoteType: remoteType(location, text(job.workplaceType)),
      canonicalUrl,
      applyUrl,
      description: text(job.descriptionPlain).slice(0, 3_000),
      employmentType: text(job.employmentType) || null,
      publishedAt: date(job.publishedAt),
    }];
  }).filter((job) => job.externalId);
}

function theirStackJobs(source: JobFeedSource, body: unknown): NormalizedJob[] {
  if (!body || typeof body !== "object" || !Array.isArray((body as { data?: unknown }).data)) return [];
  return (body as { data: unknown[] }).data.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const job = item as Record<string, unknown>;
    const canonicalUrl = safeJobUrl(job.url) ?? safeJobUrl(job.final_url) ?? safeJobUrl(job.source_url);
    if (!canonicalUrl) return [];
    const companyObject = job.company_object && typeof job.company_object === "object"
      ? job.company_object as Record<string, unknown>
      : {};
    const location = text(
      job.location
      ?? job.long_location
      ?? job.short_location
      ?? (Array.isArray(job.cities) ? job.cities.join(", ") : ""),
      "India or remote",
    );
    const workplace = [
      job.remote === true ? "remote" : "",
      job.hybrid === true ? "hybrid" : "",
    ].filter(Boolean).join(" ");
    const employmentStatuses = Array.isArray(job.employment_statuses)
      ? job.employment_statuses.filter((value): value is string => typeof value === "string")
      : [];
    return [{
      source: source.id,
      sourceName: source.label,
      externalId: identifier(job.id),
      title: text(job.job_title, "Untitled role"),
      company: text(job.company, text(companyObject.name, "Company not listed")),
      location,
      remoteType: remoteType(location, workplace),
      canonicalUrl,
      applyUrl: canonicalUrl,
      description: text(job.description).slice(0, 3_000),
      employmentType: employmentStatuses[0] || null,
      publishedAt: date(job.date_posted) ?? date(job.discovered_at),
    }];
  }).filter((job) => job.externalId);
}

export async function fetchJobFeed(
  source: JobFeedSource,
  query?: JobFeedQuery,
): Promise<NormalizedJob[]> {
  if (source.provider === "theirstack") {
    const apiKey = process.env.THEIRSTACK_API_KEY?.trim();
    if (!apiKey) throw new Error("TheirStack is not configured");
    const titles = [...new Set([query?.target, query?.role].filter((value): value is string => Boolean(value?.trim())))].slice(0, 4);
    const body = await postJson("https://api.theirstack.com/v1/jobs/search", apiKey, {
      job_title_or: titles.length > 0 ? titles : ["technology"],
      job_country_code_or: ["IN"],
      workplace_types_or: ["remote", "hybrid", "on_site"],
      posted_at_max_age_days: 14,
      final_url_exists: true,
      company_type: "direct_employer",
      limit: 50,
      page: 0,
    });
    return theirStackJobs(source, body);
  }
  const encodedBoard = encodeURIComponent(source.board);
  const url = source.provider === "greenhouse"
    ? `https://boards-api.greenhouse.io/v1/boards/${encodedBoard}/jobs?content=true`
    : source.provider === "lever"
      ? `https://api.lever.co/v0/postings/${encodedBoard}?mode=json`
      : `https://api.ashbyhq.com/posting-api/job-board/${encodedBoard}`;
  const body = await readJson(url);
  if (source.provider === "greenhouse") return greenhouseJobs(source, body);
  if (source.provider === "lever") return leverJobs(source, body);
  return ashbyJobs(source, body);
}

function isIndiaOrRemoteSample(job: NormalizedJob): boolean {
  return job.remoteType === "remote"
    || job.remoteType === "hybrid"
    || /\bindia\b/i.test(job.location);
}

export async function checkTheirStackReadiness(now = new Date()): Promise<TheirStackReadiness> {
  if (!process.env.THEIRSTACK_API_KEY?.trim()) {
    return {
      provider: "theirstack",
      status: "not_configured",
      checkedAt: now,
      sampleSize: 0,
      message: "TheirStack API key is not configured; broad job coverage is blocked.",
    };
  }

  try {
    const jobs = await fetchJobFeed(THEIRSTACK_SOURCE, {
      role: "technology",
      target: "technology",
      city: "Remote",
    });
    const sampleSize = jobs.filter(isIndiaOrRemoteSample).length;
    if (sampleSize === 0) {
      return {
        provider: "theirstack",
        status: "empty",
        checkedAt: now,
        sampleSize,
        message: "TheirStack responded successfully but returned no valid India/remote sample; broad job coverage is blocked.",
      };
    }
    return {
      provider: "theirstack",
      status: "healthy",
      checkedAt: now,
      sampleSize,
      message: `TheirStack returned ${sampleSize} valid India/remote sample${sampleSize === 1 ? "" : "s"}.`,
    };
  } catch (error) {
    const unauthorized = isProviderAuthorizationError(error);
    const message = error instanceof Error ? error.message : "TheirStack readiness check failed";
    return {
      provider: "theirstack",
      status: unauthorized ? "unauthorized" : "unavailable",
      checkedAt: now,
      sampleSize: 0,
      message: `${message}; broad job coverage is blocked.`,
    };
  }
}

export class JobFeedProviderError extends Error {
  constructor(
    message: string,
    readonly provider: JobFeedProvider,
    readonly statusCode?: number,
  ) {
    super(message);
    this.name = "JobFeedProviderError";
  }
}

export type TheirStackReadiness = {
  provider: "theirstack";
  status: JobFeedHealthStatus;
  checkedAt: Date;
  sampleSize: number;
  message: string;
};
