import assert from "node:assert/strict";
import test from "node:test";
import {
  getMarketRefreshFreshnessMessage,
  isMarketRefreshFresh,
  MARKET_REFRESH_FRESHNESS_WINDOW_MS,
} from "../../career-reality-mobile/context/market-refresh";

const refreshedAt = "2026-09-08T12:00:00.000Z";
const refreshedAtMs = Date.parse(refreshedAt);

test("treats a recent successful read as fresh and explains the deferral", () => {
  assert.equal(
    isMarketRefreshFresh(
      refreshedAt,
      refreshedAtMs + MARKET_REFRESH_FRESHNESS_WINDOW_MS - 1,
    ),
    true,
  );
  assert.match(
    getMarketRefreshFreshnessMessage(refreshedAt, refreshedAtMs + 2_000) ?? "",
    /still fresh/i,
  );
});

test("allows refresh after the window and for failed or malformed timestamps", () => {
  assert.equal(
    isMarketRefreshFresh(
      refreshedAt,
      refreshedAtMs + MARKET_REFRESH_FRESHNESS_WINDOW_MS,
    ),
    false,
  );
  assert.equal(isMarketRefreshFresh(undefined, refreshedAtMs), false);
  assert.equal(isMarketRefreshFresh("not-a-date", refreshedAtMs), false);
  assert.equal(
    getMarketRefreshFreshnessMessage(
      refreshedAt,
      refreshedAtMs + MARKET_REFRESH_FRESHNESS_WINDOW_MS,
    ),
    undefined,
  );
});