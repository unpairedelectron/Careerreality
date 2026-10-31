-- Read-only production aggregate snapshot. Uses no user-level records.
SELECT
  'salary_benchmarks' AS dataset,
  count(*)::int AS row_count,
  count(*) FILTER (WHERE source_url IS NULL OR btrim(source_url) = '')::int AS missing_source_url,
  count(*) FILTER (WHERE source_url IS NOT NULL AND source_url !~* '^https?://[^[:space:]]+$')::int AS malformed_source_url,
  count(*) FILTER (WHERE refreshed_at < CURRENT_TIMESTAMP - INTERVAL '30 days')::int AS older_than_30_days,
  max(refreshed_at)::text AS latest_refreshed_at
FROM salary_benchmarks
UNION ALL
SELECT
  'company_signals',
  count(*)::int,
  count(*) FILTER (WHERE source_url IS NULL OR btrim(source_url) = '')::int,
  count(*) FILTER (WHERE source_url IS NOT NULL AND source_url !~* '^https?://[^[:space:]]+$')::int,
  count(*) FILTER (WHERE refreshed_at < CURRENT_TIMESTAMP - INTERVAL '30 days')::int,
  max(refreshed_at)::text
FROM company_signals
UNION ALL
SELECT
  'layoff_signals',
  count(*)::int,
  count(*) FILTER (WHERE source_url IS NULL OR btrim(source_url) = '')::int,
  count(*) FILTER (WHERE source_url IS NOT NULL AND source_url !~* '^https?://[^[:space:]]+$')::int,
  count(*) FILTER (WHERE refreshed_at < CURRENT_TIMESTAMP - INTERVAL '30 days')::int,
  max(refreshed_at)::text
FROM layoff_signals
ORDER BY dataset;
