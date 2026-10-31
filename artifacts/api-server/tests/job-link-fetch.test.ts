import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import express from "express";
import { createServer } from "node:http";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  fetchPublicJobPage,
  isPublicAddress,
  JobLinkFetchError,
  maxJobPageBytes,
  maxJobTextLength,
} from "../src/lib/safe-job-link-fetch.ts";
import { createJobLinksRouter, jobLinkFetchEnabled } from "../src/routes/job-links.ts";

const publicAddress = [{ address: "8.8.8.8", family: 4 }];
const fixture = (name: string) =>
  readFileSync(fileURLToPath(new URL(`./fixtures/job-link-fetch/${name}.html`, import.meta.url)), "utf8");
const html = (body: string, location?: string) => ({
  status: location ? 302 : 200,
  headers: location ? { location } : { "content-type": "text/html; charset=utf-8" },
  body: Buffer.from(body),
});

test("public-address validation rejects private, reserved, mapped and documentation ranges", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "172.16.0.1", "192.168.1.1", "169.254.10.4", "100.64.0.1", "224.0.0.1", "192.0.2.1", "::1", "fc00::1", "fe80::1", "::ffff:127.0.0.1", "2001:db8::1", "2002::1"]) {
    assert.equal(isPublicAddress(address), false, address);
  }
  assert.equal(isPublicAddress("8.8.8.8"), true);
  assert.equal(isPublicAddress("2606:4700:4700::1111"), true);
});

test("malformed URLs, credentials, unsupported ports, hosts and paths are rejected", async () => {
  for (const url of [
    "not a URL",
    "http://jobs.lever.co/acme/0123456789",
    "https://user:pass@jobs.lever.co/acme/0123456789",
    "https://jobs.lever.co:8443/acme/0123456789",
    "https://localhost/acme/0123456789",
    "https://jobs.lever.co/proxy",
    "https://127.0.0.1/acme/0123456789",
  ]) {
    await assert.rejects(fetchPublicJobPage(url), JobLinkFetchError, url);
  }
});

test("rejects mixed public and private DNS answers before making a request", async () => {
  let requested = false;
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      resolve: async () => [...publicAddress, { address: "10.1.2.3", family: 4 }],
      request: async () => { requested = true; return html("never"); },
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 403,
  );
  assert.equal(requested, false);
});

test("validates each redirect host and its fresh DNS answers", async () => {
  let lookups = 0;
  let requests = 0;
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      resolve: async () => {
        lookups += 1;
        return lookups === 1 ? publicAddress : [{ address: "127.0.0.1", family: 4 }];
      },
      request: async () => {
        requests += 1;
        return html("", "https://jobs.ashbyhq.com/acme/0123456789");
      },
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 403,
  );
  assert.equal(lookups, 2);
  assert.equal(requests, 1);
});

test("caps redirect chains", async () => {
  let requests = 0;
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      resolve: async () => publicAddress,
      request: async () => {
        requests += 1;
        return html("", "https://jobs.ashbyhq.com/acme/0123456789");
      },
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 502,
  );
  assert.equal(requests, 4);
});

test("follows a bounded allowlisted redirect and strips active HTML content", async () => {
  let requests = 0;
  const result = await fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
    resolve: async () => publicAddress,
    request: async () => {
      requests += 1;
      return requests === 1
        ? html("", "https://jobs.ashbyhq.com/acme/0123456789")
        : html("<h1>Engineer &amp; Analyst</h1><script>secret()</script><p>Build services.</p>");
    },
  });
  assert.equal(requests, 2);
  assert.match(result.text, /Engineer & Analyst/u);
  assert.match(result.text, /Build services/u);
  assert.doesNotMatch(result.text, /secret/u);
});

test("extracts useful job text from privacy-safe Greenhouse, Lever and Ashby fixtures", async () => {
  const fixtures = [
    {
      url: "https://boards.greenhouse.io/sampleco/jobs/1234567",
      page: fixture("greenhouse"),
      expected: ["Software Engineer", "Design reliable services", "Experience with TypeScript"],
    },
    {
      url: "https://jobs.lever.co/sampleco/0123456789abcdef",
      page: fixture("lever"),
      expected: ["Product Analyst", "Turn product questions into clear analysis", "SQL and experimentation"],
    },
    {
      url: "https://jobs.ashbyhq.com/sampleco/0123456789abcdef",
      page: fixture("ashby"),
      expected: ["Customer Support Specialist", "Help customers resolve technical issues", "Clear written communication"],
    },
  ];

  for (const { url, page, expected } of fixtures) {
    const result = await fetchPublicJobPage(url, {
      resolve: async () => publicAddress,
      request: async () => html(page),
    });
    for (const text of expected) assert.ok(result.text.includes(text), `${url} should retain ${text}`);
    for (const excluded of ["Board navigation", "Sign in", "Footer links", "script-only-marker", "style-only-marker"]) {
      assert.ok(!result.text.includes(excluded), `${url} should exclude ${excluded}`);
    }
    assert.equal(result.truncated, false);
  }
});

test("rejects oversized pages, unsupported content types and timed-out requests", async () => {
  const base = {
    resolve: async () => publicAddress,
    request: async () => html(""),
  };
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      ...base,
      request: async () => ({ ...html(""), body: Buffer.alloc(maxJobPageBytes + 1) }),
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 413,
  );
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      ...base,
      request: async () => ({ status: 200, headers: { "content-type": "application/pdf" }, body: Buffer.from("pdf") }),
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 415,
  );
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      ...base,
      request: async () => ({ status: 200, headers: { "content-type": "application/xhtml+xml" }, body: Buffer.from("<main>job</main>") }),
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 415,
  );
  const plainText = await fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
    ...base,
    request: async () => ({ status: 200, headers: { "content-type": "text/plain; charset=utf-8" }, body: Buffer.from("Plain-text job listing") }),
  });
  assert.equal(plainText.text, "Plain-text job listing");
  assert.equal(plainText.truncated, false);
  const truncated = await fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
    ...base,
    request: async () => html(`<main><p>${"A".repeat(maxJobTextLength + 10)}</p></main>`),
  });
  assert.equal(truncated.text.length, maxJobTextLength);
  assert.equal(truncated.truncated, true);
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      ...base,
      request: async () => { throw new JobLinkFetchError(504, "timeout"); },
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 504,
  );
  await assert.rejects(
    fetchPublicJobPage("https://jobs.lever.co/acme/0123456789", {
      resolve: async () => new Promise(() => {}),
      request: async () => html("never"),
    }),
    (error: unknown) => error instanceof JobLinkFetchError && error.status === 504,
  );
});

test("route requires explicit consent and does not call the fetcher while disabled", async (t) => {
  const app = express();
  app.use(express.json());
  let fetchCount = 0;
  app.use(createJobLinksRouter({
    enabled: true,
    consumeRateLimit: async () => ({ limited: false, retryAfterSeconds: 900 }),
    fetchPage: async () => {
      fetchCount += 1;
      return { text: "Reviewed public job text", truncated: false };
    },
  }));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  const endpoint = `http://127.0.0.1:${address.port}/public/job-links/fetch`;
  const denied = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://jobs.lever.co/acme/0123456789", consent: false }),
  });
  assert.equal(denied.status, 400);
  assert.equal(fetchCount, 0);
  const accepted = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://jobs.lever.co/acme/0123456789", consent: true }),
  });
  assert.equal(accepted.status, 200);
  assert.deepEqual(await accepted.json(), { text: "Reviewed public job text", truncated: false });
  assert.equal(fetchCount, 1);
});

test("route applies the shared IP limit before fetching and uses a separate scope", async (t) => {
  const app = express();
  app.use(express.json());
  let fetchCount = 0;
  const identities: Array<{ scope?: string; ip?: string | null }> = [];
  app.use(createJobLinksRouter({
    enabled: true,
    consumeRateLimit: async (identity) => {
      identities.push(identity);
      return { limited: true, retryAfterSeconds: 123 };
    },
    fetchPage: async () => {
      fetchCount += 1;
      return { text: "Should not fetch", truncated: false };
    },
  }));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await fetch(`http://127.0.0.1:${address.port}/public/job-links/fetch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://jobs.lever.co/acme/0123456789", consent: true }),
  });

  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "123");
  assert.deepEqual(identities, [{ scope: "public-job-link-fetch", ip: "127.0.0.1" }]);
  assert.equal(fetchCount, 0);
});

test("route fails closed without fetching when the shared limiter is unavailable", async (t) => {
  const app = express();
  app.use(express.json());
  let fetchCount = 0;
  app.use(createJobLinksRouter({
    enabled: true,
    consumeRateLimit: async () => { throw new Error("rate limit storage unavailable"); },
    fetchPage: async () => {
      fetchCount += 1;
      return { text: "Should not fetch", truncated: false };
    },
  }));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve())));
  const address = server.address();
  assert.ok(address && typeof address !== "string");

  const response = await fetch(`http://127.0.0.1:${address.port}/public/job-links/fetch`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: "https://jobs.lever.co/acme/0123456789", consent: true }),
  });

  assert.equal(response.status, 503);
  assert.equal(response.headers.get("retry-after"), "60");
  assert.equal(fetchCount, 0);
});

test("production requires both explicit enablement and operator readiness", () => {
  const before = {
    nodeEnv: process.env.NODE_ENV,
    enabled: process.env.JOB_LINK_FETCH_ENABLED,
    ready: process.env.JOB_LINK_FETCH_PRODUCTION_READY,
  };
  try {
    process.env.NODE_ENV = "production";
    delete process.env.JOB_LINK_FETCH_ENABLED;
    delete process.env.JOB_LINK_FETCH_PRODUCTION_READY;
    assert.equal(jobLinkFetchEnabled(), false);
    process.env.JOB_LINK_FETCH_ENABLED = "true";
    assert.equal(jobLinkFetchEnabled(), false);
    process.env.JOB_LINK_FETCH_PRODUCTION_READY = "true";
    assert.equal(jobLinkFetchEnabled(), true);
  } finally {
    if (before.nodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = before.nodeEnv;
    if (before.enabled === undefined) delete process.env.JOB_LINK_FETCH_ENABLED;
    else process.env.JOB_LINK_FETCH_ENABLED = before.enabled;
    if (before.ready === undefined) delete process.env.JOB_LINK_FETCH_PRODUCTION_READY;
    else process.env.JOB_LINK_FETCH_PRODUCTION_READY = before.ready;
  }
});
