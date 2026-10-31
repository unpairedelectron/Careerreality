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
  }
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
  const added = events.filter((event) => event.updatedAt === "2026-10-28");
  assert.equal(added.length, 5);
  assert.ok(added.every((event) => event.sector && event.sourceLabel === "Reuters"));
  assert.match(added.find((event) => event.company === "PayPal").summary, /citing a person familiar/i);
  assert.match(added.find((event) => event.company === "Adidas").scale, /exact number not disclosed/i);
  assert.match(added.find((event) => event.company === "Amazon").scale, /India count not disclosed/i);
  const hsbc = events.find((event) => event.company === "HSBC");
  assert.equal(hsbc.status, "Reported");
  assert.equal(hsbc.sourceLabel, "Reuters");
  assert.match(hsbc.coverageNote, /not an India-wide reduction/i);
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
