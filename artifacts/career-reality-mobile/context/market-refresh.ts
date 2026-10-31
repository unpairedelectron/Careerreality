export const MARKET_REFRESH_FRESHNESS_WINDOW_MS = 60_000;

export function getMarketRefreshAgeMs(
  value: string | undefined,
  now: number = Date.now(),
): number | undefined {
  if (!value) return undefined;
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return undefined;
  return Math.max(0, now - timestamp);
}

export function isMarketRefreshFresh(
  value: string | undefined,
  now: number = Date.now(),
): boolean {
  const age = getMarketRefreshAgeMs(value, now);
  return age !== undefined && age < MARKET_REFRESH_FRESHNESS_WINDOW_MS;
}

export function getMarketRefreshFreshnessMessage(
  value: string | undefined,
  now: number = Date.now(),
): string | undefined {
  const age = getMarketRefreshAgeMs(value, now);
  if (age === undefined || age >= MARKET_REFRESH_FRESHNESS_WINDOW_MS) return undefined;
  const remainingSeconds = Math.max(
    1,
    Math.ceil((MARKET_REFRESH_FRESHNESS_WINDOW_MS - age) / 1000),
  );
  return `Market read is still fresh; another refresh is available in about ${remainingSeconds} seconds.`;
}