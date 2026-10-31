import assert from "node:assert/strict";
import test from "node:test";

process.env.DATABASE_URL ??= "postgresql://job-feed-test:job-feed-test@127.0.0.1:5432/job-feed-test";

const {
  checkTheirStackReadiness,
  failedFeedRun,
  fetchJobFeed,
  isProviderAuthorizationError,
  isWithinJobRetentionWindow,
  jobFeedStatus,
  dedupeJobListings,
} = await import("../src/lib/job-feeds.ts");

const source = {
  id: "acme",
  provider: "lever" as const,
  board: "acme",
  label: "Acme careers",
};

const theirStackSource = {
  id: "theirstack",
  provider: "theirstack" as const,
  board: "india-and-remote",
  label: "TheirStack jobs",
};

function response(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

test("a failed feed is unavailable and preserves its last successful freshness", () => {
  const lastSucceededAt = new Date("2026-09-08T08:00:00.000Z");
  const checkedAt = new Date("2026-09-08T09:00:00.000Z");
  const previous = {
    source: source.id,
    lastCheckedAt: lastSucceededAt,
    lastSucceededAt,
    lastError: null,
    jobCount: 4,
  } as const;

  const failed = failedFeedRun(source.id, checkedAt, previous as never, new Error("Feed returned 503"));

  assert.equal(failed.lastCheckedAt, checkedAt);
  assert.equal(failed.lastSucceededAt, lastSucceededAt);
  assert.equal(failed.lastError, "Feed returned 503");
  assert.equal(jobFeedStatus(source, { ...previous, ...failed }, 4).status, "unavailable");
});

test("listings outside the retention window are not current", () => {
  const now = new Date("2026-09-08T09:00:00.000Z");
  assert.equal(isWithinJobRetentionWindow(new Date("2026-07-25T09:00:01.000Z"), now), true);
  assert.equal(isWithinJobRetentionWindow(new Date("2026-07-25T09:00:00.000Z"), now), false);
});

test("lever listings with non-HTTPS or malformed application URLs are rejected", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response([
    {
      id: "safe",
      text: "Safe role",
      hostedUrl: "https://jobs.lever.co/acme/safe",
      applyUrl: "https://jobs.lever.co/acme/safe/apply",
      categories: { location: "Remote" },
    },
    {
      id: "http",
      text: "HTTP role",
      hostedUrl: "https://jobs.lever.co/acme/http",
      applyUrl: "http://jobs.lever.co/acme/http/apply",
      categories: { location: "Remote" },
    },
    {
      id: "malformed",
      text: "Malformed role",
      hostedUrl: "https://jobs.lever.co/acme/malformed",
      applyUrl: "not a URL",
      categories: { location: "Remote" },
    },
  ]);

  try {
    const jobs = await fetchJobFeed(source);
    assert.deepEqual(jobs.map((job) => job.externalId), ["safe"]);
    assert.equal(jobs[0]?.applyUrl, "https://jobs.lever.co/acme/safe/apply");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("a provider failure remains a failed feed instead of becoming an empty success", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => response({ error: "temporarily unavailable" }, 503);

  try {
    await assert.rejects(fetchJobFeed(source), /Feed returned 503/);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("TheirStack authorization failures are explicit and never include the API key", async (t) => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.THEIRSTACK_API_KEY;
  const secret = "secret-that-must-not-appear";
  process.env.THEIRSTACK_API_KEY = secret;

  try {
    for (const status of [401, 403]) {
      await t.test(`classifies HTTP ${status} as unauthorized`, async () => {
        globalThis.fetch = async () => response({ error: "not authorized" }, status);
        await assert.rejects(
          fetchJobFeed(theirStackSource),
          (error: unknown) => {
            assert.equal(isProviderAuthorizationError(error), true);
            assert.equal((error as Error).message, `TheirStack authorization failed (HTTP ${status})`);
            assert.equal(String(error).includes(secret), false);
            return true;
          },
        );
        const run = failedFeedRun(
          theirStackSource.id,
          new Date("2026-09-08T09:00:00.000Z"),
          undefined,
          new Error(`TheirStack authorization failed (HTTP ${status})`),
        );
        assert.equal(jobFeedStatus(theirStackSource, run as never, 0).status, "unauthorized");
      });
    }
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.THEIRSTACK_API_KEY;
    else process.env.THEIRSTACK_API_KEY = previousKey;
  }
});

test("TheirStack readiness requires a valid India or remote sample", async (t) => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.THEIRSTACK_API_KEY;
  process.env.THEIRSTACK_API_KEY = "test-key";
  const checkedAt = new Date("2026-09-08T09:00:00.000Z");

  try {
    await t.test("reports healthy for an India or remote sample", async () => {
      globalThis.fetch = async () => response({
        data: [{
          id: 201,
          job_title: "Platform Engineer",
          company: "Northstar Labs",
          location: "Remote",
          remote: true,
          url: "https://northstar.example/jobs/201",
        }],
      });
      const readiness = await checkTheirStackReadiness(checkedAt);
      assert.equal(readiness.status, "healthy");
      assert.equal(readiness.sampleSize, 1);
      assert.equal(readiness.checkedAt, checkedAt);
    });

    await t.test("reports empty when the provider responds without a valid sample", async () => {
      globalThis.fetch = async () => response({ data: [] });
      const readiness = await checkTheirStackReadiness(checkedAt);
      assert.equal(readiness.status, "empty");
      assert.equal(readiness.sampleSize, 0);
      assert.match(readiness.message, /broad job coverage is blocked/i);
    });

    await t.test("blocks broad coverage when the provider rejects the credential", async () => {
      globalThis.fetch = async () => response({ error: "not authorized" }, 403);
      const readiness = await checkTheirStackReadiness(checkedAt);
      assert.equal(readiness.status, "unauthorized");
      assert.equal(readiness.sampleSize, 0);
      assert.match(readiness.message, /authorization failed.*403/i);
      assert.match(readiness.message, /broad job coverage is blocked/i);
      assert.equal(readiness.message.includes("test-key"), false);
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.THEIRSTACK_API_KEY;
    else process.env.THEIRSTACK_API_KEY = previousKey;
  }
});

test("TheirStack readiness reports missing configuration without probing the provider", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.THEIRSTACK_API_KEY;
  delete process.env.THEIRSTACK_API_KEY;
  let called = false;
  globalThis.fetch = async () => {
    called = true;
    return response({ data: [] });
  };

  try {
    const readiness = await checkTheirStackReadiness(new Date("2026-09-08T09:00:00.000Z"));
    assert.equal(readiness.status, "not_configured");
    assert.equal(called, false);
    assert.equal(readiness.message.includes("API key"), true);
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.THEIRSTACK_API_KEY;
    else process.env.THEIRSTACK_API_KEY = previousKey;
  }
});

test("TheirStack requests India and remote roles and keeps only canonical HTTPS destinations", async () => {
  const originalFetch = globalThis.fetch;
  const previousKey = process.env.THEIRSTACK_API_KEY;
  let requestBody: Record<string, unknown> | undefined;
  let authorization = "";
  process.env.THEIRSTACK_API_KEY = "test-key";
  globalThis.fetch = async (_input, init) => {
    requestBody = JSON.parse(String(init?.body)) as Record<string, unknown>;
    authorization = new Headers(init?.headers).get("authorization") ?? "";
    return response({
      data: [
        {
          id: 101,
          job_title: "Senior Data Engineer",
          company: "Northstar Labs",
          location: "Bengaluru, India",
          remote: false,
          hybrid: true,
          description: "Python and data platforms.",
          date_posted: "2026-09-08",
          url: "https://northstar.example/jobs/101",
        },
        {
          id: 102,
          job_title: "Invalid destination",
          company: "Unsafe",
          location: "Remote",
          description: "Should not be returned.",
          url: "http://unsafe.example/jobs/102",
        },
      ],
    });
  };

  try {
    const jobs = await fetchJobFeed(theirStackSource, {
      role: "Data Engineer",
      target: "Senior Data Engineer",
      city: "Bengaluru",
    });
    assert.equal(authorization, "Bearer test-key");
    assert.deepEqual(requestBody?.job_country_code_or, ["IN"]);
    assert.deepEqual(requestBody?.workplace_types_or, ["remote", "hybrid", "on_site"]);
    assert.deepEqual(requestBody?.job_title_or, ["Senior Data Engineer", "Data Engineer"]);
    assert.deepEqual(jobs.map((job) => job.externalId), ["101"]);
    assert.equal(jobs[0]?.remoteType, "hybrid");
    assert.equal(jobs[0]?.canonicalUrl, "https://northstar.example/jobs/101");
    assert.equal(jobs[0]?.applyUrl, "https://northstar.example/jobs/101");
  } finally {
    globalThis.fetch = originalFetch;
    if (previousKey === undefined) delete process.env.THEIRSTACK_API_KEY;
    else process.env.THEIRSTACK_API_KEY = previousKey;
  }
});

test("duplicate canonical roles prefer direct ATS provenance and retain both sources", () => {
  const fetchedAt = new Date("2026-09-08T09:00:00.000Z");
  const makeListing = (overrides: Record<string, unknown>) => ({
    id: "listing-id",
    source: "theirstack",
    sourceName: "TheirStack jobs",
    externalId: "external-id",
    title: "Senior Data Engineer",
    company: "Northstar Labs",
    location: "Bengaluru, India",
    remoteType: "hybrid",
    canonicalUrl: "https://northstar.example/jobs/101?utm_source=theirstack",
    applyUrl: "https://northstar.example/jobs/101",
    description: "Python and data platforms.",
    employmentType: null,
    publishedAt: null,
    lastSeenAt: fetchedAt,
    fetchedAt,
    ...overrides,
  }) as never;

  const groups = dedupeJobListings([
    makeListing({ id: "aggregator-id" }),
    makeListing({
      id: "direct-id",
      source: "northstar",
      sourceName: "Northstar careers",
      canonicalUrl: "https://northstar.example/jobs/101",
      applyUrl: "https://northstar.example/jobs/101",
    }),
  ], new Map([
    ["theirstack", "theirstack"],
    ["northstar", "greenhouse"],
  ]));

  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.listing.id, "direct-id");
  assert.deepEqual(groups[0]?.ids, ["aggregator-id", "direct-id"]);
  assert.deepEqual(groups[0]?.provenance.map((item) => item.sourceName), ["TheirStack jobs", "Northstar careers"]);
});

test("hosted and application URL variants merge without collapsing distinct role URLs", () => {
  const fetchedAt = new Date("2026-09-08T09:00:00.000Z");
  const makeListing = (overrides: Record<string, unknown>) => ({
    id: "listing-id",
    source: "theirstack",
    sourceName: "TheirStack jobs",
    externalId: "external-id",
    title: "Product Designer",
    company: "Northstar Labs",
    location: "Remote, India",
    remoteType: "remote",
    canonicalUrl: "https://jobs.lever.co/northstar/product-designer",
    applyUrl: "https://jobs.lever.co/northstar/product-designer",
    description: "Product design role.",
    employmentType: null,
    publishedAt: null,
    lastSeenAt: fetchedAt,
    fetchedAt,
    ...overrides,
  }) as never;

  const groups = dedupeJobListings([
    makeListing({
      id: "direct-id",
      source: "northstar",
      sourceName: "Northstar careers",
    }),
    makeListing({
      id: "aggregator-id",
      canonicalUrl: "https://jobs.lever.co/northstar/product-designer/apply?utm_source=theirstack",
      applyUrl: "https://jobs.lever.co/northstar/product-designer/apply?utm_source=theirstack",
    }),
    makeListing({
      id: "different-role-id",
      externalId: "different-role",
      canonicalUrl: "https://jobs.lever.co/northstar/product-designer-platform",
      applyUrl: "https://jobs.lever.co/northstar/product-designer-platform",
    }),
  ], new Map([
    ["theirstack", "theirstack"],
    ["northstar", "lever"],
  ]));

  assert.equal(groups.length, 2);
  const merged = groups.find((group) => group.ids.includes("aggregator-id"));
  assert.equal(merged?.listing.id, "direct-id");
  assert.deepEqual(merged?.ids, ["direct-id", "aggregator-id"]);
  assert.deepEqual(merged?.provenance.map((item) => item.sourceName), ["Northstar careers", "TheirStack jobs"]);
  assert.equal(groups.some((group) => group.ids.includes("different-role-id")), true);
});

test("live ATS URL shapes merge their application variants and keep distinct openings separate", () => {
  const fetchedAt = new Date("2026-09-08T09:00:00.000Z");
  const makeListing = (overrides: Record<string, unknown>) => ({
    id: "listing-id",
    source: "theirstack",
    sourceName: "TheirStack jobs",
    externalId: "external-id",
    title: "Observed ATS role",
    company: "Observed Company",
    location: "Remote",
    remoteType: "remote",
    canonicalUrl: "https://example.com/jobs/observed",
    applyUrl: "https://example.com/jobs/observed",
    description: "Observed from a public ATS response.",
    employmentType: null,
    publishedAt: null,
    lastSeenAt: fetchedAt,
    fetchedAt,
    ...overrides,
  }) as never;

  const groups = dedupeJobListings([
    makeListing({
      id: "gitlab-direct",
      source: "gitlab",
      sourceName: "GitLab careers",
      canonicalUrl: "https://job-boards.greenhouse.io/gitlab/jobs/8556658002",
      applyUrl: "https://job-boards.greenhouse.io/gitlab/jobs/8556658002",
      title: "AI Engineer",
      company: "GitLab",
      location: "Remote, Bangalore",
    }),
    makeListing({
      id: "gitlab-aggregated",
      canonicalUrl: "https://job-boards.greenhouse.io/gitlab/jobs/8556658002?utm_source=theirstack",
      applyUrl: "https://job-boards.greenhouse.io/gitlab/jobs/8556658002?utm_source=theirstack",
      title: "AI Engineer",
      company: "GitLab",
      location: "Remote, Bangalore",
    }),
    makeListing({
      id: "deuna-direct",
      source: "deuna",
      sourceName: "DEUNA careers",
      canonicalUrl: "https://jobs.lever.co/deuna/26b86395-02b2-4540-8d97-6c648f3fab79",
      applyUrl: "https://jobs.lever.co/deuna/26b86395-02b2-4540-8d97-6c648f3fab79/apply",
      title: "AI Platform Tech Lead",
      company: "DEUNA",
      location: "San Francisco",
    }),
    makeListing({
      id: "deuna-aggregated",
      canonicalUrl: "https://jobs.lever.co/deuna/26b86395-02b2-4540-8d97-6c648f3fab79/apply",
      applyUrl: "https://jobs.lever.co/deuna/26b86395-02b2-4540-8d97-6c648f3fab79/apply",
      title: "AI Platform Tech Lead",
      company: "DEUNA",
      location: "San Francisco",
    }),
    makeListing({
      id: "linear-direct",
      source: "linear",
      sourceName: "Linear careers",
      canonicalUrl: "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff",
      applyUrl: "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application",
      title: "Senior / Staff Fullstack Engineer",
      company: "Linear",
      location: "Europe",
    }),
    makeListing({
      id: "linear-aggregated",
      canonicalUrl: "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application",
      applyUrl: "https://jobs.ashbyhq.com/linear/d3bc1ced-3ce4-4086-a050-555055dbb1ff/application",
      title: "Senior / Staff Fullstack Engineer",
      company: "Linear",
      location: "Europe",
    }),
    makeListing({
      id: "linear-distinct",
      source: "linear",
      sourceName: "Linear careers",
      canonicalUrl: "https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32",
      applyUrl: "https://jobs.ashbyhq.com/linear/cd5ae036-0223-427a-b038-ba16ef9dcb32/application",
      title: "Senior / Staff Fullstack Engineer",
      company: "Linear",
      location: "Europe",
    }),
  ], new Map([
    ["theirstack", "theirstack"],
    ["gitlab", "greenhouse"],
    ["deuna", "lever"],
    ["linear", "ashby"],
  ]));

  assert.equal(groups.length, 4);
  assert.equal(groups.find((group) => group.ids.includes("gitlab-aggregated"))?.listing.source, "gitlab");
  assert.equal(groups.find((group) => group.ids.includes("deuna-aggregated"))?.listing.source, "deuna");
  assert.equal(groups.find((group) => group.ids.includes("linear-aggregated"))?.listing.source, "linear");
  assert.deepEqual(groups.find((group) => group.ids.includes("linear-distinct"))?.ids, ["linear-distinct"]);
});