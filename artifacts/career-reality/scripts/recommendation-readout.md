# Recommendation readout cadence

Use `recommendation-readout.sql` as the recurring query for the CareerReality
production artifact.

## Cadence

- Run once per week.
- Run again after each CareerReality republish that changes recommendation
  instrumentation, once the new build has received tracked activity.
- Use the trailing 30-day window in the SQL and record the run date and window
  with the result.

## Interpretation rules

1. Review rows by `visitor_month`, `source_route`, and
   `destination_catalog_slug`.
2. Treat `reportable` rows as eligible for comparison only when they have at
   least 10 events and at least 5 approximate visitors in that month.
3. Treat `directional` rows as evidence of activity, not as a winning
   recommendation.
4. Keep `(missing_catalog_slug)` visible as historical/schema context, but do
   not mix it into current destination rankings.
5. If there are no reportable rows, say that there is not enough current
   evidence to compare surfaces. Do not rank a destination from a single row.

The report uses only route, catalog slug, aggregate event count, and
approximate visitor count, plus the month bucket required by the analytics
visitor-identity limitation. It excludes the launch video, mockup sandbox, and
API paths so the root CareerReality artifact is measured on its own.