import assert from "node:assert/strict";
import test from "node:test";
import { matchesLayoffAlert } from "../src/lib/layoff-alert-matching.js";

const event = {
  slug: "sample-company",
  status: "Reported" as const,
  geography: "India · Bengaluru and Hyderabad",
  sector: "Information technology",
};

test("matches all credible events when no optional filters are selected", () => {
  assert.equal(matchesLayoffAlert({ companySlugs: [], city: null, sector: null }, event), true);
});

test("matches city and sector preferences together", () => {
  assert.equal(matchesLayoffAlert({
    companySlugs: [],
    city: "Bengaluru",
    sector: "Information technology",
  }, event), true);
  assert.equal(matchesLayoffAlert({
    companySlugs: [],
    city: "Chennai",
    sector: "Information technology",
  }, event), false);
  assert.equal(matchesLayoffAlert({
    companySlugs: [],
    city: "Bengaluru",
    sector: "Fintech",
  }, event), false);
});

test("never matches a Rumour, including for a legacy company preference", () => {
  assert.equal(matchesLayoffAlert(
    { companySlugs: ["sample-company"] },
    { ...event, status: "Rumour" },
  ), false);
});

test("preserves existing confirmed company preferences", () => {
  assert.equal(matchesLayoffAlert(
    { companySlugs: ["sample-company"], city: "Chennai", sector: "Fintech" },
    event,
  ), true);
});
