import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const events = JSON.parse(
  readFileSync(new URL("../src/data/layoff-events.json", import.meta.url), "utf8"),
);
const registry = JSON.parse(
  readFileSync(new URL("../src/data/route-registry.json", import.meta.url), "utf8"),
);

test("layoff event records have unique slugs, dated sources, and valid statuses", () => {
  const slugs = events.map((event) => event.slug);
  assert.equal(new Set(slugs).size, slugs.length);

  for (const event of events) {
    assert.match(event.slug, /^[a-z0-9-]+$/);
    assert.ok(["Confirmed", "Reported", "Rumour"].includes(event.status));
    assert.match(event.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(event.sourcePublishedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(event.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
    assert.match(event.sourceUrl, /^https:\/\//);
    assert.ok(event.sourceLabel.trim());
    assert.ok(event.coverageNote.length >= 40, `${event.slug} needs a specific evidence limit`);
    assert.ok(event.readerCheck.length >= 40, `${event.slug} needs a practical verification step`);
    assert.ok(event.updateNote.length >= 30, `${event.slug} needs a transparent change note`);
    for (const update of event.sourceUpdates ?? []) {
      assert.match(update.sourceUrl, /^https:\/\//);
      assert.match(update.sourcePublishedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(update.summary.length >= 40);
    }
  }
});

test("each event report explains its evidence limits and a case-specific next check", () => {
  const normalizedChecks = events.map((event) => event.readerCheck.trim().toLowerCase());
  assert.equal(new Set(normalizedChecks).size, events.length, "Next checks should not be duplicated across event pages.");
  const normalizedLimits = events.map((event) => event.coverageNote.trim().toLowerCase());
  assert.equal(new Set(normalizedLimits).size, events.length, "Evidence limits should be specific to each event.");
  for (const event of events) assert.ok(event.readerCheck.includes(".") || event.readerCheck.includes("?"));
});

test("every layoff event has a registered public record route", () => {
  const registeredPaths = new Set(registry.routes.map((route) => route.path));
  for (const event of events) {
    assert.ok(
      registeredPaths.has(`/layoffs/${event.slug}`),
      `Missing route for ${event.slug}`,
    );
  }
});

test("recent sourced reports identify their sector and preserve source uncertainty", () => {
  const added = events.filter((event) => event.sourcePublishedAt >= "2026-09-01");
  assert.equal(added.length, 6);
  assert.ok(added.every((event) => event.sector));
  assert.match(added.find((event) => event.company === "PayPal").summary, /citing a person familiar/i);
  assert.match(added.find((event) => event.company === "Adidas").scale, /exact number not disclosed/i);
  assert.match(added.find((event) => event.slug === "amazon-stores-workforce-reduction-2026").scale, /India count not disclosed/i);
  const hsbc = events.find((event) => event.company === "HSBC");
  assert.equal(hsbc.status, "Reported");
  assert.equal(hsbc.sourceLabel, "Reuters");
  assert.match(hsbc.coverageNote, /not an India-wide reduction/i);
});

test("the event copy update date and change note are explicit", () => {
  assert.ok(events.every((event) => event.updatedAt === "2026-11-06"));
  assert.ok(events.every((event) => event.updateNote.length >= 30));
  const swiggy = events.find((event) => event.slug === "swiggy-workforce-reduction-2023");
  assert.match(swiggy.summary, /planned to lay off 380 employees/i);
  assert.match(swiggy.coverageNote, /did not establish .* departures were completed/i);
  const paypal = events.find((event) => event.slug === "paypal-india-workforce-reduction-2026");
  assert.equal(paypal.status, "Confirmed");
  assert.match(paypal.summary, /PayPal said about 220 India employees were affected/i);
  assert.match(paypal.sourceUpdates[0].sourceUrl, /thehindu\.com/i);

  const tcs = events.find((event) => event.slug === "tcs-layoffs");
  assert.match(tcs.coverageNote, /net headcount change is not a count of layoffs/i);
  assert.match(tcs.sourceUpdates[0].summary, /23,460/);

  const adidas = events.find((event) => event.slug === "adidas-india-technology-reduction-2026");
  assert.match(adidas.coverageNote, /unverified estimate of 350 or more/i);
  assert.match(adidas.sourceUpdates[0].summary, /did not confirm that count/i);

  const amazon = events.find((event) => event.slug === "amazon-stores-workforce-reduction-2026");
  assert.match(amazon.coverageNote, /about 130 India employees/i);
  assert.match(amazon.sourceUpdates[0].sourcePublishedAt, /^2026-10-08$/);
});

test("homepage latest event cards include the newest Amazon and Microsoft reports", () => {
  const latest = events
    .filter((event) => event.status === "Confirmed" || event.status === "Reported")
    .sort((a, b) => b.date.localeCompare(a.date) || b.sourcePublishedAt.localeCompare(a.sourcePublishedAt))
    .slice(0, 3)
    .map((event) => event.company);
  assert.ok(latest.includes("Microsoft"));
  assert.ok(latest.includes("Amazon"));
});

test("October 2026 reporting is accurately scoped and included in the newest records", () => {
  const amazon = events.find((event) => event.slug === "amazon-devices-services-reduction-2026");
  const microsoft = events.find((event) => event.slug === "microsoft-voluntary-buyout-offer-2026");

  assert.equal(amazon.sourceLabel, "Reuters via U.S. News");
  assert.match(amazon.coverageNote, /does not establish an India impact/i);
  assert.match(microsoft.scale, /departures not reported/i);
  assert.match(microsoft.coverageNote, /not a confirmed count of job losses/i);

  const newest = [...events].sort((a, b) => b.date.localeCompare(a.date));
  assert.equal(newest[0].slug, "amazon-devices-services-reduction-2026");
  assert.equal(newest[1].slug, "microsoft-voluntary-buyout-offer-2026");
});
